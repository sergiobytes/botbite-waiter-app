import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TitleComponent } from '../../../shared/components/title/title';
import { UsersService } from '../../../core/services/users.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Mode, Pagination } from '../../../core/services/types/common.types';
import { UserRow } from '../../../core/services/types/users.types';

interface UserForm {
  readonly id?: string;
  name: string;
  email: string;
  isActive: boolean;
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
}
