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
import { IconsService } from '../../../core/services/icons.service';
import { MenusService } from '../../../core/services/menus.service';
import { OrgService } from '../../../core/services/org.service';
import { ProductsService } from '../../../core/services/products.service';
import { Menu, MenuItem } from '../../../core/services/types/menus.types';
import { TitleComponent } from '../../../shared/components/title/title';
import { createPaginationState } from '../../../shared/utils/pagination.util';
import { createSearchState } from '../../../shared/utils/search.util';
import { extractMenuIdFromSlug } from '../../../shared/utils/slug-genarator.util';
import { CategoriesService } from '../../../core/services/categories.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';

interface MenuItemForm {
  readonly id?: string;
  productId?: string;
  price: number;
  isActive: boolean;
}

@Component({
  selector: 'app-menu-items',
  imports: [
    CommonModule,
    TitleComponent,
    EmptyStateComponent,
    PaginationComponent,
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
    price: 0,
    isActive: true,
  });

  protected readonly menuName = computed(() => this.menu()?.name ?? 'Menú');
  protected readonly isEditing = computed(() => !!this.form().id);
  protected readonly modalTitle = computed(() =>
    this.isEditing() ? 'Editar Producto' : 'Agregar Producto'
  );
  protected readonly confirmTargetStatus = computed(() => !this.target()?.isActive);
  protected readonly confirmMessage = computed(() => {
    const action = this.confirmTargetStatus() ? 'activar' : 'desactivar';
    const productName = this.target()?.product?.name ?? 'este producto';
    return `¿Seguro que quieres ${action} "${productName}"?`;
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
}
