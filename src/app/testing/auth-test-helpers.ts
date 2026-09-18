import { AuthService } from '../core/services/auth.service';
import { UserAccount } from '../core/models/user-account.model';

/** Registers (and thereby logs in) a fresh test account for specs that need an active user. */
export async function registerTestUser(
  authService: AuthService,
  email = 'test@example.com',
  password = 'password123',
): Promise<UserAccount> {
  const result = await authService.register(email, password, password);
  if (!result.ok) {
    throw new Error(`registerTestUser failed: ${result.message}`);
  }
  const user = authService.currentUser();
  if (!user) {
    throw new Error('registerTestUser: no current user after successful registration');
  }
  return user;
}
