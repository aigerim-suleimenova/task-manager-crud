import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

test.describe('Task CRUD', () => {
  test('creates, edits, and deletes a task', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Buy groceries');
    await page.getByRole('textbox', { name: 'Description' }).fill('Milk, eggs, bread');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Milk, eggs, bread')).toBeVisible();

    await page.getByRole('button', { name: 'Edit task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Buy groceries and cook dinner');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('Buy groceries and cook dinner')).toBeVisible();

    await page.getByRole('button', { name: 'Delete task' }).click();
    await expect(page.getByRole('heading', { name: 'Delete Task?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByText('No tasks yet.')).toBeVisible();
  });

  test('cancelling delete leaves the task in place', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Task to keep');
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByText('Task to keep')).toBeVisible();

    await page.getByRole('button', { name: 'Delete task' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // exact: 'Task to keep' also appears inside the confirm dialog's own
    // message ("...delete \"Task to keep\"?...") — a substring match on the
    // undismissed dialog would otherwise resolve to two elements.
    await expect(page.getByText('Task to keep', { exact: true })).toBeVisible();
  });

  test('rejects an empty title', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText('Title is required.')).toBeVisible();
  });

  test('persists a created task across a page reload', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Persisted task');
    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page.getByText('Persisted task')).toBeVisible();

    await page.reload();

    await expect(page.getByText('Persisted task')).toBeVisible();
  });

  test('finds a task by search and filters it out again', async ({ page }) => {
    await registerAndLogin(page);

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Design landing page');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await page.getByRole('button', { name: 'New Task' }).click();
    await page.getByRole('textbox', { name: 'Title' }).fill('Fix login bug');
    await page.getByRole('button', { name: 'Create Task' }).click();

    await page.getByRole('textbox', { name: 'Search tasks' }).fill('login');

    await expect(page.getByText('Fix login bug')).toBeVisible();
    await expect(page.getByText('Design landing page')).toBeHidden();
  });
});
