import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { TaskService } from './core/services/task.service';
import { AuthService } from './core/services/auth.service';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { Task } from './core/models/task.model';
import { UserAccount } from './core/models/user-account.model';
import { registerTestUser } from './testing/auth-test-helpers';

function readStoredTasks(userId: string): Task[] {
  const raw = localStorage.getItem(`tasks_data_${userId}`);
  return raw ? JSON.parse(raw) : [];
}

function newTaskButton(fixture: { nativeElement: HTMLElement }): HTMLButtonElement {
  const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
  return buttons.find((button) => button.textContent?.trim() === 'New Task') as HTMLButtonElement;
}

describe('AppComponent', () => {
  let testUser: UserAccount;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [AppComponent],
    });
    testUser = await registerTestUser(TestBed.inject(AuthService));
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('opens the create form when "New Task" is clicked, and creates a task on save', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    newTaskButton(fixture).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-task-form')).toBeTruthy();

    const titleInput: HTMLInputElement = fixture.nativeElement.querySelector('#task-title');
    titleInput.value = 'New task from form';
    titleInput.dispatchEvent(new Event('input'));

    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const taskService = TestBed.inject(TaskService);
    expect(taskService.tasks().map((t) => t.title)).toEqual(['New task from form']);
    expect(fixture.nativeElement.querySelector('app-task-form')).toBeFalsy();
  });

  it('opens the edit form pre-filled and updates the existing task (not a new one) on save', () => {
    const taskService = TestBed.inject(TaskService);
    const task = taskService.create({
      title: 'Original title',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: null,
    })!;

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const editButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Edit task"]',
    );
    editButton.click();
    fixture.detectChanges();

    const titleInput: HTMLInputElement = fixture.nativeElement.querySelector('#task-title');
    expect(titleInput.value).toBe('Original title');

    titleInput.value = 'Updated title';
    titleInput.dispatchEvent(new Event('input'));
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(taskService.tasks().length).toBe(1);
    expect(taskService.tasks()[0].id).toBe(task.id);
    expect(taskService.tasks()[0].title).toBe('Updated title');
  });

  it('opens the delete confirmation with the task name and leaves the task unchanged on cancel', () => {
    const taskService = TestBed.inject(TaskService);
    taskService.create({
      title: 'Task to keep',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: null,
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Delete task"]',
    );
    deleteButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Task to keep');

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const cancelButton = buttons.find((button) => button.textContent?.trim() === 'Cancel');
    cancelButton?.click();
    fixture.detectChanges();

    expect(taskService.tasks().length).toBe(1);
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeFalsy();
  });

  it('removes the task when delete is confirmed', () => {
    const taskService = TestBed.inject(TaskService);
    taskService.create({
      title: 'Task to delete',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: null,
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Delete task"]',
    );
    deleteButton.click();
    fixture.detectChanges();

    const dialog: HTMLElement = fixture.nativeElement.querySelector('app-confirm-dialog');
    const confirmButton: HTMLButtonElement | null = Array.from(
      dialog.querySelectorAll('button'),
    ).find((button) => button.textContent?.trim() === 'Delete') ?? null;
    confirmButton?.click();
    fixture.detectChanges();

    expect(taskService.tasks().length).toBe(0);
    expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeFalsy();
  });

  it('persists every create, edit, and delete made through the UI to localStorage', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    // Create
    newTaskButton(fixture).click();
    fixture.detectChanges();
    const titleInput: HTMLInputElement = fixture.nativeElement.querySelector('#task-title');
    titleInput.value = 'Persisted task';
    titleInput.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    let stored = readStoredTasks(testUser.id);
    expect(stored.map((t) => t.title)).toEqual(['Persisted task']);
    const taskId = stored[0].id;

    // Edit
    (fixture.nativeElement.querySelector('button[aria-label="Edit task"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const editTitleInput: HTMLInputElement = fixture.nativeElement.querySelector('#task-title');
    editTitleInput.value = 'Persisted task (edited)';
    editTitleInput.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    stored = readStoredTasks(testUser.id);
    expect(stored).toEqual([expect.objectContaining({ id: taskId, title: 'Persisted task (edited)' })]);

    // Delete
    (fixture.nativeElement.querySelector('button[aria-label="Delete task"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const dialog: HTMLElement = fixture.nativeElement.querySelector('app-confirm-dialog');
    const confirmButton = Array.from(dialog.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Delete',
    ) as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();

    expect(readStoredTasks(testUser.id)).toEqual([]);
  });

  it('renders tasks seeded in localStorage before the app bootstraps', () => {
    const seeded: Task[] = [
      {
        id: 'seed-1',
        title: 'Seeded task',
        description: 'From a previous session',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2024-10-28',
      },
    ];
    localStorage.setItem(`tasks_data_${testUser.id}`, JSON.stringify(seeded));

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Seeded task');
    expect(fixture.nativeElement.textContent).toContain('Oct 28, 2024');
  });

  it('filters the task list when typing in the header search box', () => {
    const taskService = TestBed.inject(TaskService);
    taskService.create({
      title: 'Design landing page',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: null,
    });
    taskService.create({
      title: 'Fix login bug',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: null,
    });

    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);

    const searchInput: HTMLInputElement = fixture.nativeElement.querySelector(
      'input[aria-label="Search tasks"]',
    );
    searchInput.value = 'login';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Fix login bug');
  });

  describe('authentication gating', () => {
    it('shows only the login/register screens and no task data when logged out', () => {
      TestBed.inject(AuthService).logout();

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-task-list')).toBeFalsy();
      expect(newTaskButton(fixture)).toBeFalsy();
      expect(fixture.nativeElement.querySelector('app-login')).toBeTruthy();
    });

    it('toggles between the login and register screens via their switchTo outputs', () => {
      TestBed.inject(AuthService).logout();

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-login')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-register')).toBeFalsy();

      const registerLink: HTMLButtonElement = fixture.nativeElement.querySelector('app-login button.btn-link');
      registerLink.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-register')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-login')).toBeFalsy();

      const loginLink: HTMLButtonElement = fixture.nativeElement.querySelector('app-register button.btn-link');
      loginLink.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-login')).toBeTruthy();
    });

    it('reveals the task list and the real user’s email in the sidebar after logging in through the real form', async () => {
      TestBed.inject(AuthService).logout();

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#login-email');
      emailInput.value = testUser.email;
      emailInput.dispatchEvent(new Event('input'));
      const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector('#login-password');
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input'));

      const loginComponent = fixture.debugElement.query(By.directive(LoginComponent))
        .componentInstance as LoginComponent;
      await loginComponent.onSubmit();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-task-list')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-login')).toBeFalsy();
      expect(fixture.nativeElement.textContent).toContain(testUser.email);
    });

    it('wires the sidebar logout icon to end the session and return to the login screen', () => {
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-task-list')).toBeTruthy();

      const logoutButton: HTMLButtonElement = fixture.nativeElement.querySelector(
        'button[aria-label="Log out"]',
      );
      logoutButton.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-task-list')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('app-login')).toBeTruthy();
    });

    it('returns to the login screen on logout even if the user registered (rather than logged in) last', async () => {
      // Start logged out and land on the register screen, matching the real
      // repro: a visitor clicks "Register", creates an account (authView is
      // never touched again while authenticated), then later logs out.
      TestBed.inject(AuthService).logout();
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const registerLink: HTMLButtonElement = fixture.nativeElement.querySelector('app-login button.btn-link');
      registerLink.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-register')).toBeTruthy();

      const emailInput: HTMLInputElement = fixture.nativeElement.querySelector('#register-email');
      emailInput.value = 'brandnew@example.com';
      emailInput.dispatchEvent(new Event('input'));
      const passwordInput: HTMLInputElement = fixture.nativeElement.querySelector('#register-password');
      passwordInput.value = 'password123';
      passwordInput.dispatchEvent(new Event('input'));
      const confirmInput: HTMLInputElement = fixture.nativeElement.querySelector(
        '#register-confirm-password',
      );
      confirmInput.value = 'password123';
      confirmInput.dispatchEvent(new Event('input'));

      const registerComponent = fixture.debugElement.query(By.directive(RegisterComponent))
        .componentInstance as RegisterComponent;
      await registerComponent.onSubmit();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-task-list')).toBeTruthy();

      const logoutButton: HTMLButtonElement = fixture.nativeElement.querySelector(
        'button[aria-label="Log out"]',
      );
      logoutButton.click();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-login')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-register')).toBeFalsy();
    });
  });

  describe('session persistence across reload', () => {
    it('keeps a user logged in across a reload (fresh DI container, same localStorage)', () => {
      // testUser was registered (and is logged in) by the outer beforeEach, which
      // already wrote auth_accounts/auth_session to localStorage.

      // Simulate a page reload: a brand-new DI container reading the same localStorage.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [AppComponent] });
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const reloadedAuthService = TestBed.inject(AuthService);
      expect(reloadedAuthService.isAuthenticated()).toBe(true);
      expect(reloadedAuthService.currentUser()?.email).toBe(testUser.email);
      expect(fixture.nativeElement.querySelector('app-task-list')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-login')).toBeFalsy();
    });

    it('shows the login screen after a reload when no session was stored', () => {
      localStorage.clear();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ imports: [AppComponent] });
      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-login')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-task-list')).toBeFalsy();
    });
  });
});
