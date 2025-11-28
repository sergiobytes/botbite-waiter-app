import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { combineLatest } from 'rxjs';
import { CategoriesService } from '../../../core/services/categories.service';
import { IconsService } from '../../../core/services/icons.service';
import { MenusService } from '../../../core/services/menus.service';
import { OrgService } from '../../../core/services/org.service';
import { ProductsService } from '../../../core/services/products.service';
import { Menu, MenuItem } from '../../../core/services/types/menus.types';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { TitleComponent } from '../../../shared/components/title/title';
import { createPaginationState } from '../../../shared/utils/pagination.util';
import { createSearchState } from '../../../shared/utils/search.util';
import { extractMenuIdFromSlug } from '../../../shared/utils/slug-genarator.util';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { MenuItemForm } from '../../../core/services/forms/forms.interfaces';

@Component({
  selector: 'app-menu-items',
  imports: [
    CommonModule,
    TitleComponent,
    EmptyStateComponent,
    PaginationComponent,
    ModalComponent,
    LucideAngularModule,
  ],
  templateUrl: './menu-items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemsComponent {
  protected readonly menusService = inject(MenusService);
  protected readonly productsService = inject(ProductsService);
  protected readonly categoryService = inject(CategoriesService);
  protected readonly orgService = inject(OrgService);
  protected readonly iconsService = inject(IconsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly menuId = signal<string | null>(null);
  protected readonly menu = signal<Menu | null>(null);
  protected readonly menuItems = computed(() => this.menusService.menuItems());
  protected readonly products = computed(() => this.productsService.products());
  protected readonly loading = signal(false);
  protected readonly showModal = signal(false);
  protected readonly showConfirmModal = signal(false);
  protected readonly target = signal<MenuItem | null>(null);
  protected readonly filters = signal<{ isActive?: boolean }>({});

  protected readonly form = signal<MenuItemForm>({
    product: [],
    category: {
      name: '',
      isActive: true,
    },
    price: 0,
    isActive: true,
  });

  protected readonly selectedProductIds = signal<string[]>([]);
  protected readonly selectedCategoryId = signal<string>('');
  protected readonly productPrice = signal<number>(0);
  protected readonly productSearchTerm = signal<string>('');
  protected readonly saving = signal(false);

  protected readonly categories = computed(() => this.categoryService.categories());

  // Productos que NO están en el menú actual
  protected readonly availableProducts = computed(() => {
    const allProducts = this.products();
    const currentMenuItems = this.menusService.allMenuItems();
    const menuProductIds = new Set(currentMenuItems.map((item) => item.product.id));
    const searchTerm = this.productSearchTerm().toLowerCase().trim();

    let filtered = allProducts.filter((product) => !menuProductIds.has(product.id));

    // Aplicar búsqueda si hay término
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  });

  protected readonly menuName = computed(() => this.menu()?.name ?? 'Menú');
  protected readonly isEditing = computed(() => !!this.form().id);
  protected readonly modalTitle = computed(() =>
    this.isEditing() ? 'Editar Producto' : 'Agregar Productos'
  );
  protected readonly confirmTargetStatus = computed(() => !this.target()?.isActive);
  protected readonly confirmMessage = computed(() => {
    const action = this.confirmTargetStatus() ? 'activar' : 'desactivar';
    const productName = this.target()?.product?.name ?? 'este producto';
    return `¿Seguro que quieres ${action} "${productName}"?`;
  });

  protected readonly canSaveProducts = computed(() => {
    return (
      this.selectedProductIds().length > 0 &&
      this.selectedCategoryId() !== '' &&
      this.productPrice() > 0
    );
  });

  protected readonly activeFilterValue = computed(() => {
    const isActive = this.filters().isActive;
    if (isActive === undefined) return '';
    return isActive ? 'true' : 'false';
  });

  private readonly stableTotal = signal(0);

  private readonly paginationState = createPaginationState(
    computed(() => (this.loading() ? this.stableTotal() : this.menusService.totalMenuItems())),
    {
      onChange: () => this.fetch(),
    }
  );

  readonly pagination = this.paginationState.pagination;
  readonly pageFrom = this.paginationState.pageFrom;
  readonly pageTo = this.paginationState.pageTo;
  readonly canPrev = this.paginationState.canPrev;
  readonly canNext = this.paginationState.canNext;

  private readonly searchState = createSearchState({
    onSearch: () => {
      this.paginationState.resetToFirstPage();
      this.fetch();
    },
  });

  readonly searchTerm = this.searchState.searchTerm;

  constructor() {
    effect(() => {
      const slug = this.route.snapshot.paramMap.get('slug');

      if (!slug) {
        this.menuId.set(null);
        this.menu.set(null);
        return;
      }

      const shortId = extractMenuIdFromSlug(slug);

      if (!shortId) {
        console.error('Invalid menu slug:', slug);
        this.router.navigateByUrl('/dashboard/menus');
        return;
      }

      this.loadMenuByShortId(shortId);
    });
  }

  private loadMenuByShortId(shortId: string): void {
    const branchId = this.orgService.selectedBranchId();

    if (!branchId) {
      this.menuId.set(null);
      this.menu.set(null);
      return;
    }

    this.loading.set(true);

    this.menusService.findMenusByBranch({}).subscribe({
      next: () => {
        const foundMenu = this.menusService.menus().find((m) => m.id.endsWith(shortId));

        if (foundMenu) {
          this.menuId.set(foundMenu.id);
          this.menu.set(foundMenu);
          this.fetch();
        } else {
          console.error('Menu not found for shortId:', shortId);
          this.router.navigateByUrl('/dashboard/menus');
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading menus:', error);
        this.loading.set(false);
        this.router.navigateByUrl('/dashboard/menus');
      },
    });
  }

  private fetch(): void {
    const mid = this.menuId();
    const rid = this.orgService.selectedRestaurantId();

    if (!mid || !rid) {
      this.menusService.menuItems.set([]);
      this.menusService.totalMenuItems.set(0);
      return;
    }

    this.stableTotal.set(this.menusService.totalMenuItems());
    this.loading.set(true);

    const params = {
      search: this.searchTerm() || undefined,
      isActive: this.filters().isActive,
      limit: this.pagination().limit,
      offset: this.pagination().offset,
    };

    combineLatest([
      this.menusService.findItemsByMenu(mid, params),
      this.menusService.findAllItems(mid),
      this.productsService.findAllProductsByRestaurant(rid, {
        limit: 1000,
      }),
      this.categoryService.list({ limit: 100 }),
    ]).subscribe();
  }

  nextPage = () => this.paginationState.nextPage();
  prevPage = () => this.paginationState.prevPage();
  changeLimit = (e: Event) => this.paginationState.changeLimit(e);
  updateFilterSearch = (e: Event) => this.searchState.updateSearch(e);

  protected updateFilterActive(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    let isActive: boolean | undefined;

    if (value === '') {
      isActive = undefined;
    } else if (value === 'true') {
      isActive = true;
    } else if (value === 'false') {
      isActive = false;
    }

    this.filters.update((f) => ({ ...f, isActive }));
    this.paginationState.resetToFirstPage();
    this.fetch();
  }

  protected openAddProductsModal(): void {
    this.selectedProductIds.set([]);
    this.selectedCategoryId.set('');
    this.productPrice.set(0);
    this.productSearchTerm.set('');
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.selectedProductIds.set([]);
    this.selectedCategoryId.set('');
    this.productPrice.set(0);
    this.productSearchTerm.set('');
  }

  protected updateProductSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.productSearchTerm.set(target.value);
  }

  protected toggleProductSelection(productId: string): void {
    this.selectedProductIds.update((ids) => {
      if (ids.includes(productId)) {
        return ids.filter((id) => id !== productId);
      } else {
        return [...ids, productId];
      }
    });
  }

  protected isProductSelected(productId: string): boolean {
    return this.selectedProductIds().includes(productId);
  }

  protected updateCategory(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedCategoryId.set(target.value);
  }

  protected updatePrice(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    this.productPrice.set(isNaN(value) ? 0 : value);
  }

  protected saveProducts(): void {
    const mid = this.menuId();
    const productIds = this.selectedProductIds();
    const categoryId = this.selectedCategoryId();
    const price = this.productPrice();

    if (!mid || productIds.length === 0 || !categoryId || price <= 0) {
      return;
    }

    this.saving.set(true);

    // Crear un array de observables para crear cada menu item
    const createObservables = productIds.map((productId) =>
      this.menusService.createMenuItem(mid, {
        productId,
        categoryId: parseInt(categoryId),
        price,
        isActive: true,
      })
    );

    // Ejecutar todas las creaciones en paralelo
    combineLatest(createObservables).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeModal();
        this.fetch();
      },
      error: (err) => {
        console.error('Error saving menu items:', err);
        this.saving.set(false);
      },
    });
  }
}
