import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly switchToLogin = output<void>();

  readonly form = this.fb.group({
    email: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    confirmPassword: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const { email, password, confirmPassword } = this.form.getRawValue();
    const result = await this.authService.register(email, password, confirmPassword);
    this.submitting.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message);
    }
  }
}
