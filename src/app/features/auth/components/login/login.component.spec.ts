import { TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../../core/services/auth.service';

function setValue(fixture: ReturnType<typeof TestBed.createComponent>, selector: string, value: string): void {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(selector);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('LoginComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [LoginComponent] });
  });

  it('logs in with valid credentials for an existing account', async () => {
    const authService = TestBed.inject(AuthService);
    await authService.register('user@example.com', 'password123', 'password123');
    authService.logout();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    setValue(fixture, '#login-email', 'user@example.com');
    setValue(fixture, '#login-password', 'password123');
    // Awaited directly rather than via a dispatched submit event + whenStable():
    // this app is zoneless, so Angular's scheduler has no visibility into the
    // unpatched crypto.subtle promise chain inside onSubmit()'s login() call.
    await fixture.componentInstance.onSubmit();

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.currentUser()?.email).toBe('user@example.com');
  });

  it('shows an inline error on a wrong password without clearing the entered email, and stays logged out', async () => {
    const authService = TestBed.inject(AuthService);
    await authService.register('user@example.com', 'password123', 'password123');
    authService.logout();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    setValue(fixture, '#login-email', 'user@example.com');
    setValue(fixture, '#login-password', 'wrong-password');
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(authService.isAuthenticated()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#login-email');
    expect(emailInput.value).toBe('user@example.com');
  });

  it('emits switchToRegister when the Register button is clicked', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    let switched = false;
    fixture.componentInstance.switchToRegister.subscribe(() => (switched = true));

    const link: HTMLButtonElement = fixture.nativeElement.querySelector('button.btn-link');
    link.click();

    expect(switched).toBe(true);
  });
});
