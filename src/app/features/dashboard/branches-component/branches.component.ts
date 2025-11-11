import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BranchesService } from '../../../core/services/branches.service';
import { OrgService } from '../../../core/services/org.service';
import { Branch } from '../../../core/services/types/branches.types';
import { Mode, Pagination } from '../../../core/services/types/common.types';
import { TitleComponent } from '../../../shared/components/title/title';
import { catchError, EMPTY, filter, finalize } from 'rxjs';

interface BranchForm {
  readonly id?: string;
  name: string;
  address: string;
  phoneNumberAssistant?: string;
  phoneNumberReception?: string;
  availableMessages: number;
  isActive: boolean;
}

@Component({
  selector: 'app-branches.component',
  imports: [CommonModule, TitleComponent],
  templateUrl: './branches.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchesComponent {
  private readonly branchesService = inject(BranchesService);
  protected readonly orgService = inject(OrgService);
  private readonly toastrService = inject(ToastrService);

  readonly saving = signal(false);
  readonly mode = signal<Mode>(null);

  readonly confirming = signal(false);
  private confirmEnable = signal<boolean | null>(null);
  readonly target = signal<Branch | null>(null);

  readonly filters = signal<{ search?: string; isActive?: boolean }>({});
  readonly pagination = signal<Partial<Pagination>>({ limit: 10, offset: 0 });

  readonly allBranches = computed(() => this.orgService.branches());

  // Filtrado y paginación en el cliente
  readonly branches = computed(() => {
    let filtered = this.allBranches();

    // Aplicar filtro de búsqueda
    const searchTerm = this.filters().search?.toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchTerm) ||
        b.address.toLowerCase().includes(searchTerm)
      );
    }

    // Aplicar filtro de estado
    const isActive = this.filters().isActive;
    if (isActive !== undefined) {
      filtered = filtered.filter(b => b.isActive === isActive);
    }

    return filtered;
  });

  readonly total = computed(() => this.branches().length);

  // Branches paginados para mostrar en la tabla
  readonly paginatedBranches = computed(() => {
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    return this.branches().slice(offset, offset + limit);
  });

  readonly restaurantId = computed(() => this.orgService.selectedRestaurantId());
  readonly confirmingTargetStatus = computed(() => !!this.confirmEnable());

  readonly generatingQr = signal<string | null>(null);

  readonly form = signal<BranchForm>({
    name: '',
    address: '',
    phoneNumberAssistant: '',
    phoneNumberReception: '',
    availableMessages: 0,
    isActive: true,
  });

  readonly trackById = (_: number, b: Branch) => b.id;

  reload() {
    // Ya no necesita fetch(), el effect() del OrgService maneja la carga
    const rid = this.restaurantId();
    if (rid) {
      this.orgService.loadBranches(rid).subscribe();
    }
  }

  pageFrom = computed(() => {
    const offset = this.pagination().offset ?? 0;
    return this.total() === 0 ? 0 : offset + 1;
  });

  pageTo = computed(() => {
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    return Math.min(offset + limit, this.total());
  });

  canPrev = computed(() => {
    const offset = this.pagination().offset ?? 0;
    return offset > 0;
  });

  canNext = computed(() => {
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    return offset + limit < this.total();
  });

  nextPage() {
    if (!this.canNext()) return;
    this.pagination.update((p) => ({ ...p, offset: p.offset! + p.limit! }));
  }

  prevPage() {
    if (!this.canPrev()) return;
    this.pagination.update((p) => ({ ...p, offset: Math.max(0, p.offset! - p.limit!) }));
  }

  changeLimit(event: Event) {
    const select = event.target as HTMLSelectElement;
    const limit = Number(select.value) || 10;
    this.pagination.set({ limit, offset: 0 });
  }

  updateFilterSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filters.update((f) => ({ ...f, search: input.value || undefined }));
    this.pagination.update((p) => ({ ...p, offset: 0 })); // Reset a primera página
  }

  updateFilterActive(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.filters.update((f) => ({
      ...f,
      isActive: value === '' ? undefined : value === 'true',
    }));

    this.pagination.update((p) => ({ ...p, offset: 0 })); // Reset a primera página
  }

  goFirst() {
    this.pagination.update((p) => ({ ...p, offset: 0 }));
  }

  openCreate() {
    this.mode.set('create');
    this.form.set({
      name: '',
      address: '',
      phoneNumberAssistant: '',
      phoneNumberReception: '',
      availableMessages: 0,
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
      availableMessages: branch.availableMessages,
      isActive: branch.isActive,
    });
  }

  // closeModal

  // handleSave
  // save

  confirmToggle(branch: Branch, enable: boolean) {
    this.target.set(branch);
    this.confirmEnable.set(enable);
    this.confirming.set(true);
  }

  // toggleActive

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
        this.orgService.updateSelectedBranch(
          branch.id === this.orgService.selectedBranch()?.id ? { qrUrl: res.qrUrl } : {}
        );
        this.reload();
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

  // updateForm
  // updateFormNumber
  // updateFormChecked
}
