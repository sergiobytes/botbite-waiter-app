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
  // rows
  total = signal<number>(0);
  pagination = signal<Partial<Pagination>>({ limit: 10, offset: 0 });

  search = signal<string>('');
  roleFilter = signal<UserRole | ''>('');

  mode = signal<Mode>(null);
  // saving
  form = signal<{ email: string; password: string }>({ email: '', password: '' });

  // me
  // myId
  // isSuper
  // isAdmin

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

  pageFrom = computed(() => console.log('Not implemented yet'));
  pageTo = computed(() => console.log('Not implemented yet'));
  canPrev = computed(() => console.log('Not implemented yet'));
  canNext = computed(() => console.log('Not implemented yet'));

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

  roleBadgeClass(role?: string) {
    return getRoleBadgeClass(role);
  }
}
