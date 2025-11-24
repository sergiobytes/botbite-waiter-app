import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, concatMap, EMPTY } from 'rxjs';
import { hasRole } from '../../../core/guards/roles.guard';
import { AuthService } from '../../../core/services/auth.service';
import { OrgService } from '../../../core/services/org.service';
import type { UserRole } from '../../../core/services/types/common.types';
import { RoleBadgeComponent } from '../../../shared/components/role-badge/role-badge';
import { getRoleBadgeClass } from '../../../shared/utils/role-bagde-class.util';

type NavItem = {
  label: string;
  icon?: string;
  to: string;
  requiredRole?: UserRole; // Rol mínimo requerido para mostrar el item
};

@Component({
  selector: 'app-shell-component',
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    RoleBadgeComponent,
  ],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected org = inject(OrgService);

  open = signal(false);

  private allItems: NavItem[] = [
    { label: 'Inicio', to: '/dashboard/home' },
    { label: 'Usuarios', to: '/dashboard/users', requiredRole: 'admin' },
    { label: 'Categorías', to: '/dashboard/categories', requiredRole: 'admin' },
    { label: 'Restaurantes', to: '/dashboard/restaurants' },
    { label: 'Sucursales', to: '/dashboard/branches' },
    { label: 'Productos', to: '/dashboard/products', requiredRole: 'client'},
  ];

  items = computed(() => {
    const user = this.auth.user();
    if (!user?.roles) return [this.allItems[0]];

    return this.allItems.filter((item) => {
      if (!item.requiredRole) return true;
      return hasRole(user.roles, item.requiredRole);
    });
  });

  restaurants = this.org.restaurants;
  selectedRestaurantId = this.org.selectedRestaurantId;
  selectedRestaurant = this.org.selectedRestaurant;

  branches = this.org.branches;
  selectedBranchId = this.org.selectedBranchId;
  selectedBranch = this.org.selectedBranch;

  ngOnInit(): void {
    this.initializeUserData();
  }

  private initializeUserData(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    if (!this.auth.user()) {
      this.auth
        .loadProfile()
        .pipe(
          catchError(() => {
            this.auth.logout();
            return EMPTY;
          }),
          concatMap(() => this.loadOrganizationData()),
          catchError(() => EMPTY)
        )
        .subscribe();
    } else {
      this.loadOrganizationData().subscribe();
    }
  }

  private loadOrganizationData() {
    return this.org.loadRestaurants().pipe(catchError(() => EMPTY));
  }

  displayUser(): string {
    const user = this.auth.user();
    if (!user?.email) return '';

    const role = this.getBestRole(user.roles);
    return role ? `${user.email} - ${role}` : user.email;
  }

  toggle(): void {
    this.open.update((isOpen) => !isOpen);
  }

  closeOnNavigate(): void {
    if (window.innerWidth < 1024) {
      this.open.set(false);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  goToProfile(): void {
    this.router.navigateByUrl('/dashboard/profile');
  }

  getBestRole(roles?: string[]): string | undefined {
    if (!roles?.length) return undefined;

    const roleSet = new Set(roles.map((role) => role.toLowerCase()));
    const roleHierarchy = ['super', 'admin', 'user'];

    for (const role of roleHierarchy) {
      if (roleSet.has(role)) {
        return role.toUpperCase();
      }
    }

    return roles[0].toUpperCase();
  }

  onSelectRestaurant(id: string): void {
    this.org.selectRestaurant(id);
  }

  onSelectBranch(id: string): void {
    this.org.selectBranch(id);
  }
}
