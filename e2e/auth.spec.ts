import { test, expect } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

test.describe('Authentication', () => {
  test('registers a new account and lands on the task list', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByRole('heading', { name: 'Task Manager' })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test('rejects registration with a password under 8 characters', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail());
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('short');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
  });

  test('logs out and returns to the login screen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(uniqueEmail());
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('button', { name: 'New Task' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('shows an error on login with a wrong password', async ({ page }) => {
    const email = uniqueEmail();

    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('password123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.getByRole('button', { name: 'Log out' }).click();

    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });
});
