import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitleComponent } from '../../../shared/components/title/title';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Mode, UserRole } from '../../../core/services/types/common.types';
import { UserRow } from '../../../core/services/types/users.types';
import { catchError, EMPTY } from 'rxjs';
import { getRoleBadgeClass } from '../../../shared/utils/role-bagde-class.util';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { createPaginationState } from '../../../shared/utils/pagination.util';
import { createSearchState } from '../../../shared/utils/search.util';
import { ModalComponent } from '../../../shared/components/modal/modal';

@Component({
  selector: 'app-users.component',
  imports: [CommonModule, TitleComponent, PaginationComponent, ModalComponent],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  protected readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);

  readonly loading = signal(false);
  readonly total = signal(0);
  readonly roleFilter = signal<UserRole | ''>('');
  readonly mode = signal<Mode>(null);
  readonly saving = signal(false);
  readonly form = signal<{ email: string; password: string }>({ email: '', password: '' });

  readonly me = computed(() => this.authService.user());
  readonly myId = computed(() => this.me()?.id);
  readonly isSuper = computed(() =>
    (this.me()?.roles || []).map((r) => r.toLowerCase()).includes('super')
  );
  readonly isAdmin = computed(() =>
    (this.me()?.roles || []).map((r) => r.toLowerCase()).includes('admin')
  );

  readonly modalTitle = computed(() => {
    const currentMode = this.mode();
    if (currentMode === 'create-user') return 'Crear Usuario';
    if (currentMode === 'create-client') return 'Crear Cliente';
    return '';
  });

  readonly isFormValid = computed(() => {
    const f = this.form();
    return f.email.trim() !== '' && f.password.trim().length >= 6;
  });

  private readonly paginationState = createPaginationState(this.total, {
    onChange: () => this.reload(),
  });

  readonly pagination = this.paginationState.pagination;
  readonly pageFrom = this.paginationState.pageFrom;
  readonly pageTo = this.paginationState.pageTo;
  readonly canPrev = this.paginationState.canPrev;
  readonly canNext = this.paginationState.canNext;

  private readonly searchState = createSearchState({
    onSearch: () => {
      this.paginationState.resetToFirstPage();
      this.reload();
    },
  });

  readonly search = this.searchState.searchTerm;

  constructor() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    const { limit, offset } = this.pagination();

    this.usersService
      .list({
        search: this.search() || undefined,
        role: this.roleFilter() || undefined,
        limit,
        offset,
      })
      .subscribe({
        next: (res) => {
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toastrService.error('Error al cargar los usuarios');
        },
      });
  }

  nextPage = () => this.paginationState.nextPage();
  prevPage = () => this.paginationState.prevPage();
  changeLimit = (e: Event) => this.paginationState.changeLimit(e);
  updateSearch = (e: Event) => this.searchState.updateSearch(e);

  updateRole(e: Event) {
    const v = (e.target as HTMLSelectElement).value as UserRole | '';
    this.roleFilter.set(v);
    this.pagination.update((p) => ({ ...p, offset: 0 }));
    this.reload();
  }

  openCreateUser() {
    this.mode.set('create-user');
    this.form.set({ email: '', password: '' });
  }

  openCreateClient() {
    this.mode.set('create-client');
    this.form.set({ email: '', password: '' });
  }

  closeModal() {
    this.mode.set(null);
    this.form.set({ email: '', password: '' });
  }

  save() {
    const { email, password } = this.form();
    if (!email || !password) {
      this.toastrService.warning('Email y contraseña son obligatorios');
      return;
    }

    this.saving.set(true);

    const role = this.mode() === 'create-client' ? 'client' : 'user';

    this.usersService.registerUserOrClient({ email, password }, `register-${role}`).subscribe({
      next: () => {
        this.toastrService.success('Usuario registrado');
        this.closeModal();
        this.saving.set(false);
        this.reload();
      },
      error: () => {
        this.toastrService.error('No se pudo registrar al usuario');
        this.saving.set(false);
      },
    });
  }

  canActOn(row: UserRow) {
    if (row.id === this.myId()) return false;
    const userRoles = (row.roles || []).map((r) => r.toLowerCase());
    if (userRoles.includes('super')) return false;
    if (this.isSuper()) return true;
    if (this.isAdmin() && !userRoles.includes('admin')) return true;
    return false;
  }

  activate(row: UserRow) {
    if (!this.canActOn(row)) {
      this.toastrService.warning('No puedes activar tu propio usuario');
      return;
    }

    this.usersService
      .activateUser(row.id)
      .pipe(
        catchError((e) => {
          console.error(e);
          this.toastrService.error('Error al activar el usuario');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastrService.success('Usuario activado correctamente');
        this.reload();
      });
  }

  deactivate(row: UserRow) {
    if (!this.canActOn(row)) {
      this.toastrService.warning('No puedes desactivar tu propio usuario');
      return;
    }

    this.usersService
      .deactivateUser(row.id)
      .pipe(
        catchError((e) => {
          console.error(e);
          this.toastrService.error('Error al desactivar el usuario');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastrService.success('Usuario desactivado correctamente');
        this.reload();
      });
  }

  hasRole(row: UserRow, role: UserRole) {
    return (row.roles || []).map((r) => r.toLowerCase()).includes(role);
  }

  addAdmin(row: UserRow) {
    if (!this.canActOn(row)) {
      this.toastrService.warning('No puedes modificar tu propio usuario');
      return;
    }

    this.usersService
      .addAdminRole(row.id)
      .pipe(
        catchError((e) => {
          console.error(e);
          this.toastrService.error('Error al añadir el rol de administrador');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastrService.success('Rol de administrador añadido');
        this.reload();
      });
  }

  removeAdmin(row: UserRow) {
    if (!this.isSuper()) {
      this.toastrService.warning('Solo un superusuario puede modificar roles de administrador');
      return;
    }

    if (!this.canActOn(row)) {
      this.toastrService.warning('No puedes modificar tu propio usuario');
      return;
    }

    this.usersService
      .removeAdminRole(row.id)
      .pipe(
        catchError((e) => {
          console.error(e);
          this.toastrService.error('Error al eliminar el rol de administrador');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastrService.success('Rol de administrador eliminado');
        this.reload();
      });
  }

  roleBadgeClass(role?: string) {
    return getRoleBadgeClass(role);
  }

  updateFormEmail(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.form.update((f) => ({ ...f, email: value }));
  }

  updateFormPassword(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.form.update((f) => ({ ...f, password: value }));
  }
}
