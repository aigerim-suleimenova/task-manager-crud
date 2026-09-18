import { expect, Page } from '@playwright/test';

export function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

/**
 * Clicks "Register" and fills the registration form, without submitting.
 *
 * "Email"/"Password" labels exist on both the login and register screens,
 * so filling them immediately after the "Register" click can race Angular's
 * @if/@else view swap and land on the about-to-be-destroyed login form
 * instead. "Confirm Password" only exists on the register form, so waiting
 * for it guarantees the register view is actually mounted before filling
 * anything else.
 */
export async function fillRegisterForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByRole('button', { name: 'Register' }).click();

  const confirmPassword = page.getByRole('textbox', { name: 'Confirm Password' });
  await expect(confirmPassword).toBeVisible();

  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
  await confirmPassword.fill(password);
}

/** Registers a fresh account (valid password) and waits for the task list. */
export async function registerAndLogin(page: Page): Promise<string> {
  const email = uniqueEmail();
  await page.goto('/');
  await fillRegisterForm(page, email, 'password123');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();
  return email;
}
