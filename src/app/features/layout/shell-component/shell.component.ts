import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { OrgService } from '../../../core/services/org.service';

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
export class ShellComponent {
  private router = inject(Router);
  protected auth = inject(AuthService);
  protected org = inject(OrgService);

  open = signal(false);
  items: NavItem[] = [{ label: 'Inicio', to: '/dashboard/home' }];

  restaurants = this.org.restaurants;
  selectedRestaurantId = this.org.selectedRestaurantId;
  selectedRestaurant = this.org.selectedRestaurant;

  constructor() {
    if (this.auth.isAuthenticated() && !this.auth.user()) {
      this.auth.loadProfile().subscribe({ error: () => this.auth.logout() });
      this.org.loadRestaurants().subscribe();
    }
  }

  displayUser(): string {
    const u = this.auth.user();
    if (!u) return '';
    const role = this.bestRole(u.roles);
    return role ? `${u.email} - ${role}` : u.email;
  }

  toggle() {
    this.open.update((v) => !v);
  }

  closeOnNavigate() {
    if (window.innerWidth < 1024) this.open.set(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  goToProfile() {
    this.router.navigateByUrl('/dashboard/profile');
  }

  bestRole(roles?: string[]) {
    if (!roles?.length) return undefined;
    const set = new Set(roles.map((r) => r.toLowerCase()));

    if (set.has('super')) return 'SUPER';
    if (set.has('admin')) return 'ADMIN';
    if (set.has('user')) return 'USER';
    return roles[0].toUpperCase();
  }

  getRoleBadgeClass(role?: string) {
    switch (role) {
      case 'SUPER':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'USER':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  }

  onSelectRestaurant(id: string) {
    this.org.selectRestaurant(id);
    // TODO: Recargar información específica del restaurante
  }
}
