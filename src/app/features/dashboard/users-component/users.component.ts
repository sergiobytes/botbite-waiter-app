import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitleComponent } from '../../../shared/components/title/title';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Mode, Pagination, UserRole } from '../../../core/services/types/common.types';
import { UserRow } from '../../../core/services/types/users.types';
import { catchError, debounceTime, EMPTY, finalize, Subject } from 'rxjs';
import { getRoleBadgeClass } from './../../../shared/utils/role-bagde-class.util';

@Component({
  selector: 'app-users.component',
  imports: [CommonModule, TitleComponent],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  protected readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);

  loading = signal<boolean>(false);
  total = signal<number>(0);
  pagination = signal<Partial<Pagination>>({ limit: 10, offset: 0 });

  search = signal<string>('');
  roleFilter = signal<UserRole | ''>('');

  mode = signal<Mode>(null);
  saving = signal<boolean>(false);
  form = signal<{ email: string; password: string }>({ email: '', password: '' });

  me = computed(() => this.authService.user());
  myId = computed(() => this.me()?.id);
  isSuper = computed(() => (this.me()?.roles || []).map((r) => r.toLowerCase()).includes('super'));
  isAdmin = computed(() => (this.me()?.roles || []).map((r) => r.toLowerCase()).includes('admin'));

  constructor() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.usersService
      .list({
        search: this.search() || undefined,
        role: this.roleFilter() || undefined,
        limit: this.pagination().limit,
        offset: this.pagination().offset,
      })
      .pipe(
        catchError((e) => {
          console.error(e);
          this.toastrService.error('Error al cargar los usuarios');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        this.total.set(res.total);
      });
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
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    this.pagination.update((p) => ({ ...p, offset: offset + limit }));
    this.reload();
  }

  prevPage() {
    if (!this.canPrev()) return;
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    this.pagination.update((p) => ({ ...p, offset: Math.max(0, offset - limit) }));
    this.reload();
  }

  changeLimit(event: Event) {
    const select = event.target as HTMLSelectElement;
    const limit = Number(select.value) || 10;
    this.pagination.set({ limit, offset: 0 });
    this.reload();
  }

  updateSearch(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    this.search.set(v);
    clearTimeout((this as any)._t);
    (this as any)._t = setTimeout(() => {
      this.pagination.update((p) => ({ ...p, offset: 0 }));
      this.reload();
    }, 250);
  }

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
  }

  save() {
    const { email, password } = this.form();
    if (!email?.trim() || !password?.trim()) return;
    this.saving.set(true);

    const op =
      this.mode() === 'create-client'
        ? this.usersService.registerUserOrClient(
            { email: email.trim(), password: password.trim() },
            'register-client'
          )
        : this.usersService.registerUserOrClient(
            { email: email.trim(), password: password.trim() },
            'register-user'
          );

    op.pipe(
      catchError((e) => {
        console.error(e);
        this.toastrService.error('No se pudo registrar');
        return EMPTY;
      }),
      finalize(() => this.saving.set(false))
    ).subscribe(() => {
      this.toastrService.success('Usuario registrado');
      this.mode.set(null);
      this.reload();
    });
  }

  canActOn(row: UserRow) {
    const meEmail = this.me()?.email.toLowerCase();
    return row.email.toLowerCase() !== meEmail;
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

  roleBadgeClass(role?: string) {
    return getRoleBadgeClass(role);
  }
}
