import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UserRole } from '../../../core/services/types/common.types';
import { getRoleBadgeClass } from '../../utils/role-bagde-class.util';

@Component({
  selector: 'app-role-badge',
  imports: [],
  templateUrl: './role-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleBadgeComponent {
  role = input.required<string>();

  protected displayRole = computed(() => {
    const roleLabels: Record<UserRole, string> = {
      super: 'SUPER',
      admin: 'ADMINISTRADOR',
      client: 'CLIENTE',
      user: 'USUARIO',
    };

    const normalizedRole = this.role().toLowerCase() as UserRole;
    return roleLabels[normalizedRole] ?? this.role();
  });

  protected badgeClasses = computed(
    () => `px-2 py-1 rounded-lg text-xs font-medium ${getRoleBadgeClass(this.role().toUpperCase())}`
  );
}
