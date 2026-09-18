import { Injectable, computed, signal } from '@angular/core';
import { UserAccount } from '../models/user-account.model';
import { hashPassword } from '../../shared/password-hash';

const ACCOUNTS_KEY = 'auth_accounts';
const SESSION_KEY = 'auth_session';
const MIN_PASSWORD_LENGTH = 8;

export type AuthResult = { ok: true } | { ok: false; message: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accountsSignal = signal<UserAccount[]>(this.loadAccounts());
  private readonly sessionUserIdSignal = signal<string | null>(this.loadSession());

  readonly currentUser = computed(() => {
    const id = this.sessionUserIdSignal();
    if (!id) {
      return null;
    }
    return this.accountsSignal().find((account) => account.id === id) ?? null;
  });

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  async register(email: string, password: string, confirmPassword: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return { ok: false, message: 'Email and password are required.' };
    }
    if (password !== confirmPassword) {
      return { ok: false, message: 'Passwords do not match.' };
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }
    if (this.accountsSignal().some((account) => account.email === normalizedEmail)) {
      return { ok: false, message: 'An account with this email already exists.' };
    }

    const passwordHash = await hashPassword(password);
    const account: UserAccount = { id: crypto.randomUUID(), email: normalizedEmail, passwordHash };
    this.accountsSignal.update((accounts) => [...accounts, account]);
    this.persistAccounts();
    this.setSession(account.id);
    return { ok: true };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const account = this.accountsSignal().find((a) => a.email === normalizedEmail);
    const passwordHash = await hashPassword(password);

    if (!account || passwordHash !== account.passwordHash) {
      return { ok: false, message: 'Invalid email or password.' };
    }

    this.setSession(account.id);
    return { ok: true };
  }

  logout(): void {
    this.setSession(null);
  }

  private setSession(userId: string | null): void {
    this.sessionUserIdSignal.set(userId);
    this.persistSession();
  }

  private persistAccounts(): void {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(this.accountsSignal()));
  }

  private persistSession(): void {
    const id = this.sessionUserIdSignal();
    if (id) {
      localStorage.setItem(SESSION_KEY, id);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  private loadAccounts(): UserAccount[] {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private loadSession(): string | null {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }
}
