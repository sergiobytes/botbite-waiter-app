import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitleComponent } from '../../../shared/components/title/title';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Mode, Pagination } from '../../../core/services/types/common.types';
import { UserRow } from '../../../core/services/types/users.types';
import { debounceTime, Subject } from 'rxjs';

interface UserForm {
  readonly id?: string;
  email: string;
  password?: string;
}

@Component({
  selector: 'app-users.component',
  imports: [CommonModule, TitleComponent],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly toastrService = inject(ToastrService);

  private confirmEnable = signal<boolean | null>(null);

  readonly saving = signal(false);
  readonly confirming = signal(false);

  readonly mode = signal<Mode>(null);
  readonly target = signal<UserRow | null>(null);
  readonly filters = signal<{ search?: string; isActive?: boolean }>({});
  readonly pagination = signal<Partial<Pagination>>({ limit: 10, offset: 0 });

  readonly users = computed(() => this.usersService.users());
  readonly total = computed(() => this.users().length);
  readonly confirmTargetStatus = computed(() => !!this.confirmEnable());

  readonly canAddAdminRole = computed(() => {
    const roles = this.authService.user()?.roles || [];
    return roles.includes('super') || roles.includes('admin');
  });

  readonly canRemoveAdminRole = computed(() => {
    const roles = this.authService.user()?.roles || [];
    return roles.includes('super');
  });

  readonly form = signal<UserForm>({
    name: '',
    email: '',
    isActive: true,
  });

  readonly trackById = (_: number, u: UserRow) => u.id;

  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(debounceTime(300)).subscribe((searchTerm) => {
      this.filters.update((f) => ({ ...f, search: searchTerm || undefined }));
      this.pagination.update((p) => ({ ...p, offset: 0 }));
      this.reload();
    });
  }

  private fetch() {
    const limit = this.pagination().limit ?? 10;
    const offset = this.pagination().offset ?? 0;

    this.usersService
      .list({
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
    const total = this.usersService.users().length;
    return total === 0 ? 0 : offset + 1;
  });

  pageTo = computed(() => {
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    const total = this.usersService.users().length;
    return Math.min(offset + limit, total);
  });

  canPrev = computed(() => {
    const offset = this.pagination().offset ?? 0;
    return offset > 0;
  });

  canNext = computed(() => {
    const offset = this.pagination().offset ?? 0;
    const limit = this.pagination().limit ?? 10;
    const total = this.usersService.users().length;
    return offset + limit < total;
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

  updateFilterSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

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
      email: '',
      isActive: true,
    });
  }

  openEdit(user: UserRow) {
    this.mode.set('edit');
    this.form.set({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  }
}
