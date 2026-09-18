import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const ACCOUNTS_KEY = 'auth_accounts';
const SESSION_KEY = 'auth_session';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('initializes with no accounts and no session when localStorage is empty', () => {
    const service = TestBed.inject(AuthService);
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('initializes with no accounts and no session when localStorage holds corrupt JSON', () => {
    localStorage.setItem(ACCOUNTS_KEY, '{not-valid-json');
    localStorage.setItem(SESSION_KEY, 'some-id');
    expect(() => TestBed.inject(AuthService)).not.toThrow();
    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('register', () => {
    it('creates an account, logs it in, and persists both accounts and session', async () => {
      const service = TestBed.inject(AuthService);

      const result = await service.register('New@Example.com', 'password123', 'password123');

      expect(result).toEqual({ ok: true });
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('new@example.com');

      const storedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)!);
      expect(storedAccounts).toHaveLength(1);
      expect(storedAccounts[0].email).toBe('new@example.com');
      expect(localStorage.getItem(SESSION_KEY)).toBe(storedAccounts[0].id);
    });

    it('rejects an empty email or password without creating an account', async () => {
      const service = TestBed.inject(AuthService);

      const result = await service.register('', 'password123', 'password123');

      expect(result.ok).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect(JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]')).toEqual([]);
    });

    it('rejects a mismatched password confirmation without creating an account', async () => {
      const service = TestBed.inject(AuthService);

      const result = await service.register('a@example.com', 'password123', 'password456');

      expect(result.ok).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('rejects a password under 8 characters without creating an account', async () => {
      const service = TestBed.inject(AuthService);

      const result = await service.register('a@example.com', 'short1', 'short1');

      expect(result.ok).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('rejects a duplicate email (case-insensitive) without creating a second account', async () => {
      const service = TestBed.inject(AuthService);
      await service.register('dup@example.com', 'password123', 'password123');
      service.logout();

      const result = await service.register('DUP@Example.com', 'password456', 'password456');

      expect(result.ok).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      const storedAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY)!);
      expect(storedAccounts).toHaveLength(1);
    });
  });

  describe('login', () => {
    it('logs in with the correct email and password', async () => {
      const service = TestBed.inject(AuthService);
      await service.register('user@example.com', 'password123', 'password123');
      service.logout();

      const result = await service.login('user@example.com', 'password123');

      expect(result).toEqual({ ok: true });
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()?.email).toBe('user@example.com');
    });

    it('rejects an unknown email', async () => {
      const service = TestBed.inject(AuthService);

      const result = await service.login('nobody@example.com', 'password123');

      expect(result.ok).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('rejects a wrong password without revealing which field was wrong', async () => {
      const service = TestBed.inject(AuthService);
      await service.register('user@example.com', 'password123', 'password123');
      service.logout();

      const wrongPassword = await service.login('user@example.com', 'wrong-password');
      const unknownEmail = await service.login('nobody@example.com', 'wrong-password');

      expect(wrongPassword.ok).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
      expect((wrongPassword as { ok: false; message: string }).message).toBe(
        (unknownEmail as { ok: false; message: string }).message,
      );
    });
  });

  describe('logout', () => {
    it('clears the session so isAuthenticated becomes false and auth_session no longer names a user', async () => {
      const service = TestBed.inject(AuthService);
      await service.register('user@example.com', 'password123', 'password123');

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });
});
