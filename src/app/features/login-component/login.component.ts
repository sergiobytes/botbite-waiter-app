import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastrService);

  protected date: Date = new Date();

  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  canSubmit = computed(() => !this.loading());

  submit() {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth.login({ email, password }).subscribe({
      next: (response) => {
        this.toast.success('Bienvenido');
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        const msg =
          err.error.message ?? err.status === 429
            ? 'Demasiados intentos. Inténtalo más tarde.'
            : 'Error en el inicio de sesión. Revisa tus credenciales.';

        this.toast.error(msg);
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
