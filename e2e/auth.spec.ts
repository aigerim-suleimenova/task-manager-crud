import { test, expect } from '@playwright/test';
import { fillRegisterForm, registerAndLogin, uniqueEmail } from './helpers';

test.describe('Authentication', () => {
  test('registers a new account and lands on the task list', async ({ page }) => {
    const email = await registerAndLogin(page);

    await expect(page.getByRole('heading', { name: 'Task Manager' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('rejects registration with a password under 8 characters', async ({ page }) => {
    await page.goto('/');
    await fillRegisterForm(page, uniqueEmail(), 'short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
  });

  test('logs out and returns to the login screen', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows an error on login with a wrong password', async ({ page }) => {
    const email = await registerAndLogin(page);
    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });
});
