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
import { Branch, BranchListResponse } from '../../../core/services/types/branches.types';
import { Mode, Pagination } from '../../../core/services/types/common.types';
import { TitleComponent } from '../../../shared/components/title/title';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

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

  readonly addingMessages = signal(false);
  readonly messagesToAdd = signal(0);
  readonly targetForMessages = signal<Branch | null>(null);

  readonly filters = signal<{ search?: string; isActive?: boolean }>({});
  readonly pagination = signal<Partial<Pagination>>({ limit: 10, offset: 0 });

  readonly branches = computed(() => this.orgService.branches());
  readonly total = computed(() => this.branches().length);

  readonly restaurantId = computed(() => this.orgService.selectedRestaurantId());
  readonly confirmTargetStatus = computed(() => !!this.confirmEnable());

  readonly generatingQr = signal<string | null>(null);

  readonly form = signal<BranchForm>({
    name: '',
    address: '',
    phoneNumberAssistant: '',
    phoneNumberReception: '',
    isActive: true,
  });

  readonly trackById = (_: number, b: Branch) => b.id;

  private previousRestaurantId: string | null = null;

  constructor() {
    // Effect para recargar branches cuando cambia el restaurante
    effect(() => {
      const rid = this.restaurantId();

      // Solo resetear y recargar si cambió el restaurante
      if (rid && rid !== this.previousRestaurantId) {
        this.previousRestaurantId = rid;
        this.pagination.set({ limit: 10, offset: 0 }); // Reset paginación
        this.filters.set({}); // Reset filtros
        this.reload();
      }
    });
  }

  private fetch() {
    const rid = this.restaurantId();
    if (!rid) return;

    const limit = this.pagination().limit ?? 10;
    const offset = this.pagination().offset ?? 0;

    this.branchesService
      .listByRestaurant({
        search: this.filters().search,
        isActive: this.filters().isActive,
        limit,
        offset,
      })
      .subscribe();
  }

  reload() {
    this.fetch();
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
    this.reload();
  }

  prevPage() {
    if (!this.canPrev()) return;
    this.pagination.update((p) => ({ ...p, offset: Math.max(0, p.offset! - p.limit!) }));
    this.reload();
  }

  changeLimit(event: Event) {
    const select = event.target as HTMLSelectElement;
    const limit = Number(select.value) || 10;
    this.pagination.set({ limit, offset: 0 });
    this.reload();
  }

  updateFilterSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filters.update((f) => ({ ...f, search: input.value || undefined }));
    this.pagination.update((p) => ({ ...p, offset: 0 }));
    clearTimeout((this as any)._searchTimeout);
    (this as any)._searchTimeout = setTimeout(() => this.reload(), 300);
  }

  updateFilterActive(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;

    this.filters.update((f) => ({
      ...f,
      isActive: value === '' ? undefined : value === 'true',
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

    const dto: Partial<Branch> = {
      name: f.name.trim(),
      address: f.address.trim(),
      phoneNumberAssistant: f.phoneNumberAssistant?.trim() || null,
      phoneNumberReception: f.phoneNumberReception?.trim() || null,
      isActive: !!f.isActive,
    };

    const op =
      this.mode() === 'create'
        ? this.branchesService.create(dto)
        : this.branchesService.update({ id: f.id!, ...dto });

    op.pipe(
      tap((response: BranchListResponse | never[]) => {
        // Actualizar el estado local sin recargar
        if (Array.isArray(response)) return;
        this.orgService.branches.set(response.branches);
      }),
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
      tap((response: BranchListResponse | never[]) => {
        if (Array.isArray(response)) return;
        this.orgService.branches.set(response.branches);
      }),
      catchError((e) => {
        console.error('Error toggling branch status:', e);
        this.toastrService.error('Error al cambiar el estado de la sucursal');
        return EMPTY;
      })
    ).subscribe(() => {
      this.toastrService.success(
        `Sucursal ${enable ? 'activada' : 'desactivada'} correctamente`
      );
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
      .update({
        id: branch.id,
        availableMessages: branch.availableMessages + amount,
      })
      .pipe(
        tap((response: BranchListResponse | never[]) => {
          if (Array.isArray(response)) return;
          this.orgService.branches.set(response.branches);
        }),
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
        tap((res) => {
          // Actualizar el QR en el branch actual
          const updated = this.orgService.branches().map((b) =>
            b.id === branch.id ? { ...b, qrUrl: res.qrUrl } : b
          );
          this.orgService.branches.set(updated);

          // Si es el branch seleccionado, actualizar también
          if (branch.id === this.orgService.selectedBranch()?.id) {
            this.orgService.updateSelectedBranch({ qrUrl: res.qrUrl });
          }
        }),
        catchError((e) => {
          console.error('Error generating QR code:', e);
          this.toastrService.error('Error al generar el código QR');
          return EMPTY;
        }),
        finalize(() => this.generatingQr.set(null))
      )
      .subscribe(() => {
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
        tap((response: BranchListResponse | never[]) => {
          if (Array.isArray(response)) return;
          this.orgService.branches.set(response.branches);
        }),
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
