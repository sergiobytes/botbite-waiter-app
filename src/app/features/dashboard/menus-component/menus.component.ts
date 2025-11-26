import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { IconsService } from '../../../core/services/icons.service';
import { MenusService } from '../../../core/services/menus.service';
import { OrgService } from '../../../core/services/org.service';
import { Mode } from '../../../core/services/types/common.types';
import { Menu } from '../../../core/services/types/menus.types';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { TitleComponent } from '../../../shared/components/title/title';
import { createPaginationState } from '../../../shared/utils/pagination.util';
import { createSearchState } from '../../../shared/utils/search.util';

interface MenuForm {
  readonly id?: string;
  name: string;
  isActive: boolean;
}
@Component({
  selector: 'app-menus.component',
  imports: [
    TitleComponent,
    PaginationComponent,
    ModalComponent,
    EmptyStateComponent,
    LucideAngularModule,
  ],
  templateUrl: './menus.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenusComponent {
  private readonly menusService = inject(MenusService);
  private readonly orgService = inject(OrgService);
  private readonly toastrService = inject(ToastrService);
  protected readonly iconsService = inject(IconsService);

  private loading = signal(false);
  readonly mode = signal<Mode>(null);
  readonly filters = signal<{ isActive?: boolean }>({});

  private readonly filteredMenus = signal<Menu[]>([]);
  private readonly filteredTotal = signal(0);

  readonly form = signal<MenuForm>({
    name: '',
    isActive: true,
  });

  readonly menus = computed(() => this.filteredMenus());
  readonly total = computed(() => this.filteredTotal());
  readonly branchId = computed(() => this.orgService.selectedBranchId());

  private readonly paginationState = createPaginationState(this.total, {
    onChange: () => this.fetch(),
  });

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

  private previousBranchId: string | null = null;

  constructor() {
    effect(() => {
      const bid = this.branchId();

      if (bid && bid !== this.previousBranchId) {
        this.previousBranchId = bid;
        this.paginationState.resetToFirstPage();
        this.filters.set({});
        this.searchState.searchTerm.set('');
        this.fetch();
      }
    });
  }

  private fetch(): void {
    if (!this.branchId()) return;

    this.loading.set(true);
    const { limit, offset } = this.pagination();

    this.menusService
      .findMenusByBranch({
        search: this.searchTerm() || undefined,
        isActive: this.filters().isActive,
        limit,
        offset,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.filteredMenus.set(response);
          this.filteredTotal.set(response.length);
        },
        error: () => {
          console.error('Error fetching menus');
          this.toastrService.error('Error al cargar los menús');
        },
      });
  }

  updateFilterSearch = (e: Event) => this.searchState.updateSearch(e);

  openCreate(): void {
    this.mode.set('create');
    this.form.set({
      name: '',
      isActive: true,
    });
  }
}
