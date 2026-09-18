import { TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../../core/services/auth.service';

function setValue(fixture: ReturnType<typeof TestBed.createComponent>, selector: string, value: string): void {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('RegisterComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [RegisterComponent] });
  });

  it('creates an account and logs the user in on valid input', async () => {
    const authService = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    setValue(fixture, '#register-email', 'new@example.com');
    setValue(fixture, '#register-password', 'password123');
    setValue(fixture, '#register-confirm-password', 'password123');
    await fixture.componentInstance.onSubmit();

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.currentUser()?.email).toBe('new@example.com');
  });

  it('shows an inline error and does not create an account when passwords do not match', async () => {
    const authService = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    setValue(fixture, '#register-email', 'new@example.com');
    setValue(fixture, '#register-password', 'password123');
    setValue(fixture, '#register-confirm-password', 'different456');
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(authService.isAuthenticated()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('shows an inline error and does not create an account when the password is too short', async () => {
    const authService = TestBed.inject(AuthService);
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    setValue(fixture, '#register-email', 'new@example.com');
    setValue(fixture, '#register-password', 'short1');
    setValue(fixture, '#register-confirm-password', 'short1');
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(authService.isAuthenticated()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('shows an inline error and does not create a second account when the email is already registered', async () => {
    const authService = TestBed.inject(AuthService);
    await authService.register('existing@example.com', 'password123', 'password123');
    authService.logout();

    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    setValue(fixture, '#register-email', 'existing@example.com');
    setValue(fixture, '#register-password', 'password456');
    setValue(fixture, '#register-confirm-password', 'password456');
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(authService.isAuthenticated()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('emits switchToLogin when the "Log in" button is clicked', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();

    let switched = false;
    fixture.componentInstance.switchToLogin.subscribe(() => (switched = true));

    const link: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-link');
    link.click();

    expect(switched).toBe(true);
  });
});
