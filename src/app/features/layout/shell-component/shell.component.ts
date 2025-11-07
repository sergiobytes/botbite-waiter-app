import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

type NavItem = {
  label: string;
  icon?: string;
  to: string;
};

@Component({
  selector: 'app-shell-component',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  open = signal(false);

  currentBranch = signal('Principal');

  items: NavItem[] = [{ label: 'Inicio', to: '/dashboard/home' }];

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
}
