import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  protected readonly date = new Date();
  protected readonly loading = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth
      .login({ email, password })
      .pipe(
        switchMap(() => this.auth.loadProfile()),
        catchError((err) => {
          this.handleLoginError(err);
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((profile) => {
        if (profile) {
          this.toast.success('Bienvenido');
          this.router.navigateByUrl('/dashboard');
        }
      });
  }

  private handleLoginError(err: any): void {
    if (err.status === 401) {
      this.auth.logout();
    }

    const msg =
      err.error?.message ||
      (err.status === 429
        ? 'Demasiados intentos. Inténtalo más tarde.'
        : 'Error en el inicio de sesión. Revisa tus credenciales.');

    this.toast.error(msg);
  }
}
