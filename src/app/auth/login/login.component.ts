import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MATERIAL_MODULES } from '../../shared/material';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_MODULES],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  readonly portalTitleCharacters = 'Customer Care Satisfaction Survey'.split('');

  loading = false;
  errorMessage = '';
  hidePassword = true;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { username, password } = this.form.getRawValue();

    this.authService.login(username ?? '', password ?? '').pipe(
      finalize(() => {
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      })
    ).subscribe({
      next: () => {
        void this.router.navigate(['/surveys']);
      },
      error: (error) => {
        this.errorMessage = this.getLoginErrorMessage(error?.status);
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 4000 });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  private getLoginErrorMessage(status?: number): string {
    if (status === 423) {
      return 'Account locked. Try again later or contact admin.';
    }

    if (status === 401) {
      return 'Invalid credentials.';
    }

    return 'Login failed. Please try again.';
  }
}
