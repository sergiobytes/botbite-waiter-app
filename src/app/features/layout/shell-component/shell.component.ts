import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OrgService } from '../../../core/services/org.service';
import { catchError, switchMap, EMPTY } from 'rxjs';

type NavItem = {
  label: string;
  icon?: string;
  to: string;
};

@Component({
  selector: 'app-shell-component',
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected org = inject(OrgService);

  open = signal(false);
  items: NavItem[] = [
    { label: 'Inicio', to: '/dashboard/home' },
    { label: 'Categorías', to: '/dashboard/categories' },
  ];

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
    if (!this.auth.isAuthenticated() || this.auth.user()) {
      return;
    }

    this.auth
      .loadProfile()
      .pipe(
        catchError(() => {
          this.auth.logout();
          return EMPTY;
        }),
        switchMap(() => this.org.loadRestaurants()),
        catchError(() => EMPTY)
      )
      .subscribe({
        next: () => {
          const restaurantId = this.selectedRestaurantId();
          if (restaurantId) {
            this.org.loadBranches(restaurantId).subscribe();
          }
        },
      });
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

  getRoleBadgeClass(role?: string): string {
    const roleClasses = {
      SUPER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
      USER: 'bg-green-100 text-green-800 border-green-200',
    } as const;

    return (
      roleClasses[role as keyof typeof roleClasses] ??
      'bg-neutral-100 text-neutral-700 border-neutral-200'
    );
  }

  onSelectRestaurant(id: string): void {
    this.org.selectRestaurant(id);
    // El effect _watchRestaurant se encargará de cargar las sucursales automáticamente
  }

  onSelectBranch(id: string): void {
    this.org.selectBranch(id);
  }
}
