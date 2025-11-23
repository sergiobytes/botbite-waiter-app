import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BranchesService } from '../../../core/services/branches.service';
import { OrgService } from '../../../core/services/org.service';
import { AuthService } from '../../../core/services/auth.service';
import { Branch } from '../../../core/services/types/branches.types';
import { Mode } from '../../../core/services/types/common.types';
import { TitleComponent } from '../../../shared/components/title/title';
import { catchError, EMPTY, finalize } from 'rxjs';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { createPaginationState } from '../../../shared/utils/pagination.util';
import { createSearchState } from '../../../shared/utils/search.util';

interface BranchForm {
  readonly id?: string;
  name: string;
  address: string;
  phoneNumberAssistant?: string;
  phoneNumberReception?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-branches.component',
  imports: [CommonModule, TitleComponent, PaginationComponent],
  templateUrl: './branches.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchesComponent {
  private readonly branchesService = inject(BranchesService);
  protected readonly orgService = inject(OrgService);
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);

  readonly saving = signal(false);
  readonly mode = signal<Mode>(null);
  readonly confirming = signal(false);
  private confirmEnable = signal<boolean | null>(null);
  readonly target = signal<Branch | null>(null);
  readonly addingMessages = signal(false);
  readonly messagesToAdd = signal(0);
  readonly targetForMessages = signal<Branch | null>(null);
  readonly generatingQr = signal<string | null>(null);
  readonly filters = signal<{ isActive?: boolean }>({});

  readonly form = signal<BranchForm>({
    name: '',
    address: '',
    phoneNumberAssistant: '',
    phoneNumberReception: '',
    isActive: true,
  });

  readonly branches = computed(() => this.orgService.branches());
  readonly total = computed(() => this.orgService.totalBranches());
  readonly restaurantId = computed(() => this.orgService.selectedRestaurantId());
  readonly confirmTargetStatus = computed(() => !!this.confirmEnable());

  readonly activeFilterValue = computed(() => {
    const isActive = this.filters().isActive;
    if (isActive === undefined) return '';
    return isActive ? 'true' : 'false';
  });

  readonly canAddMessages = computed(() => {
    const roles = this.authService.user()?.roles || [];
    return roles.includes('super') || roles.includes('admin');
  });

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

  readonly trackById = (_: number, b: Branch) => b.id;

  private previousRestaurantId: string | null = null;

  constructor() {
    effect(() => {
      const rid = this.restaurantId();

      if (rid && rid !== this.previousRestaurantId) {
        this.previousRestaurantId = rid;
        this.paginationState.resetToFirstPage();
        this.filters.set({});
        this.searchState.searchTerm.set('');
        this.fetch();
      }
    });
  }

  private fetch() {
    const rid = this.restaurantId();
    if (!rid) return;

    const { limit, offset } = this.pagination();

    this.branchesService
      .listByRestaurant({
        search: this.searchTerm() || undefined,
        isActive: this.filters().isActive,
        limit,
        offset,
      })
      .subscribe();
  }

  reload() {
    this.fetch();
  }

  nextPage = () => this.paginationState.nextPage();
  prevPage = () => this.paginationState.prevPage();
  changeLimit = (e: Event) => this.paginationState.changeLimit(e);
  updateFilterSearch = (e: Event) => this.searchState.updateSearch(e);

  updateFilterActive(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    let isActive: boolean | undefined;

    if (value === '') {
      isActive = undefined; // Todos
    } else if (value === 'true') {
      isActive = true; // Activos
    } else if (value === 'false') {
      isActive = false; // Inactivos
    }

    this.filters.update((f) => ({
      ...f,
      isActive,
    }));

    this.goFirst();
  }

  goFirst() {
    this.pagination.update((p) => ({ ...p, offset: 0 }));
    this.reload();
  }

  openCreate() {
    this.mode.set('create');
    this.form.set({
      name: '',
      address: '',
      phoneNumberAssistant: '',
      phoneNumberReception: '',
      isActive: true,
    });
  }

  openEdit(branch: Branch) {
    this.mode.set('edit');
    this.form.set({
      id: branch.id,
      name: branch.name,
      address: branch.address,
      phoneNumberAssistant: branch.phoneNumberAssistant ?? '',
      phoneNumberReception: branch.phoneNumberReception ?? '',
      isActive: branch.isActive,
    });
  }

  closeModal() {
    this.mode.set(null);
    this.form.set({
      name: '',
      address: '',
      phoneNumberAssistant: '',
      phoneNumberReception: '',
      isActive: true,
    });
  }

  handleSave() {
    this.save();
  }

  save() {
    const f = this.form();
    if (!f.name.trim() || !f.address.trim()) return;

    this.saving.set(true);

    const { id, ...data } = f;

    const dto: Partial<Branch> = {
      name: data.name.trim(),
      address: data.address.trim(),
      phoneNumberAssistant: data.phoneNumberAssistant?.trim() || null,
      phoneNumberReception: data.phoneNumberReception?.trim() || null,
      isActive: !!data.isActive,
    };

    const op =
      this.mode() === 'create'
        ? this.branchesService.create(dto)
        : this.branchesService.update(id!, dto);

    op.pipe(
      catchError((e) => {
        console.error('Error saving branch:', e);
        this.toastrService.error('Error al guardar la sucursal');
        return EMPTY;
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(() => {
      this.toastrService.success('Sucursal guardada correctamente');
      this.mode.set(null);
    });
  }

  confirmToggle(branch: Branch, enable: boolean) {
    this.target.set(branch);
    this.confirmEnable.set(enable);
    this.confirming.set(true);
  }

  toggleActive() {
    const b = this.target();
    const enable = this.confirmEnable();
    this.confirming.set(false);
    if (!b || enable === null) return;

    const op = enable ? this.branchesService.activate(b.id) : this.branchesService.deactivate(b.id);

    op.pipe(
      catchError((e) => {
        console.error('Error toggling branch status:', e);
        this.toastrService.error('Error al cambiar el estado de la sucursal');
        return EMPTY;
      })
    ).subscribe(() => {
      this.toastrService.success(`Sucursal ${enable ? 'activada' : 'desactivada'} correctamente`);
    });
  }

  openAddMessages(branch: Branch) {
    this.targetForMessages.set(branch);
    this.messagesToAdd.set(0);
    this.addingMessages.set(true);
  }

  closeAddMessagesModal() {
    this.addingMessages.set(false);
    this.targetForMessages.set(null);
    this.messagesToAdd.set(0);
  }

  handleAddMessages() {
    const branch = this.targetForMessages();
    const amount = this.messagesToAdd();

    if (!branch || amount <= 0) {
      this.toastrService.warning('Ingresa una cantidad válida de mensajes');
      return;
    }

    this.saving.set(true);

    this.branchesService
      .update(branch.id, {
        availableMessages: amount,
      })
      .pipe(
        catchError((e) => {
          console.error('Error adding messages:', e);
          this.toastrService.error('Error al agregar mensajes');
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => {
        this.toastrService.success(`${amount} mensajes agregados correctamente`);
        this.closeAddMessagesModal();
      });
  }

  onGenerateQr(branch: Branch) {
    const rid = this.restaurantId();
    if (!rid) return;

    this.generatingQr.set(branch.id);

    this.branchesService
      .generateQr(rid, branch.id)
      .pipe(
        catchError((e) => {
          console.error('Error generating QR code:', e);
          this.toastrService.error('Error al generar el código QR');
          return EMPTY;
        }),
        finalize(() => this.generatingQr.set(null))
      )
      .subscribe((res) => {
        // Actualizar el QR en el branch actual
        const updated = this.orgService
          .branches()
          .map((b) => (b.id === branch.id ? { ...b, qrUrl: res.qrUrl } : b));
        this.orgService.branches.set(updated);

        this.toastrService.success('Código QR generado correctamente');
      });
  }

  onCsvSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.branchesService
      .bulkUploadByCsv(file)
      .pipe(
        catchError((e) => {
          console.error('Error uploading CSV:', e);
          this.toastrService.error('Error al subir el archivo CSV');
          return EMPTY;
        })
      )
      .subscribe(() => {
        input.value = '';
        this.toastrService.success('Sucursales cargadas correctamente');
        this.goFirst();
      });
  }

  updateForm<K extends keyof BranchForm>(key: K, ev: Event) {
    const el = ev.target as HTMLInputElement;
    this.form.update((f) => ({ ...f, [key]: el.value as any }));
  }

  updateFormChecked<K extends keyof BranchForm>(key: K, ev: Event) {
    const el = ev.target as HTMLInputElement;
    this.form.update((f) => ({ ...f, [key]: el.checked as any }));
  }
}
