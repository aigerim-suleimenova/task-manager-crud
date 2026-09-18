import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Task } from '../../../../core/models/task.model';
import { registerTestUser } from '../../../../testing/auth-test-helpers';

function getToggleButton(
  fixture: ComponentFixture<TaskListComponent>,
  label: 'Filters' | 'Sort',
): HTMLButtonElement {
  const buttons: HTMLButtonElement[] = Array.from(
    fixture.nativeElement.querySelectorAll('.chrome-btn'),
  );
  const button = buttons.find((b) => b.textContent?.trim().startsWith(label));
  if (!button) {
    throw new Error(`No chrome-btn found starting with "${label}"`);
  }
  return button;
}

function getRowTitles(fixture: ComponentFixture<TaskListComponent>): string[] {
  const rows: HTMLTableRowElement[] = Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
  return rows.map((row) => row.querySelector('.fw-semibold')?.textContent?.trim() ?? '');
}

function getFilterCheckbox(fixture: ComponentFixture<TaskListComponent>, labelText: string): HTMLInputElement {
  const rows: HTMLLabelElement[] = Array.from(
    fixture.nativeElement.querySelectorAll('.filters-checkbox-row'),
  );
  const row = rows.find((r) => r.textContent?.trim() === labelText);
  if (!row) {
    throw new Error(`No filter checkbox found with label "${labelText}"`);
  }
  return row.querySelector('input[type="checkbox"]') as HTMLInputElement;
}

function createTask(taskService: TaskService, overrides: Partial<Omit<Task, 'id'>> = {}): Task {
  const task = taskService.create({
    title: 'Task',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: null,
    ...overrides,
  });
  if (!task) {
    throw new Error('createTask: TaskService.create returned null — is a test user logged in?');
  }
  return task;
}

describe('TaskListComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [TaskListComponent] });
    await registerTestUser(TestBed.inject(AuthService));
  });

  it('renders an empty state when there are no tasks', () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('No tasks yet');
  });

  it('renders one row per task and removes the empty state once a task exists', () => {
    const taskService = TestBed.inject(TaskService);
    createTask(taskService, { title: 'Only task' });

    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();

    const rows: NodeListOf<HTMLTableRowElement> = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('Only task');
    expect(rows[0].textContent).not.toContain('No tasks yet');
  });

  it('renders many tasks with their status/priority badges and due date', () => {
    const taskService = TestBed.inject(TaskService);
    createTask(taskService, { title: 'First', status: 'To Do', priority: 'Low' });
    createTask(taskService, { title: 'Second', status: 'In Progress', priority: 'High', dueDate: '2024-10-28' });
    createTask(taskService, { title: 'Third', status: 'Done', priority: 'Medium' });

    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();

    const rows: NodeListOf<HTMLTableRowElement> = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);

    const secondRow = rows[1];
    expect(secondRow.querySelector('.badge-status-in-progress')?.textContent?.trim()).toBe('In Progress');
    expect(secondRow.querySelector('.badge-priority-high')?.textContent?.trim()).toBe('High');
    expect(secondRow.textContent).toContain('Oct 28, 2024');
  });

  it('emits edit with the corresponding task when its Edit button is clicked', () => {
    const taskService = TestBed.inject(TaskService);
    const task = createTask(taskService, { title: 'Editable task' });

    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();

    const emitted: Task[] = [];
    fixture.componentInstance.edit.subscribe((value) => emitted.push(value));

    const editButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Edit task"]',
    );
    editButton.click();

    expect(emitted).toEqual([task]);
  });

  it('emits delete with the corresponding task when its Delete button is clicked', () => {
    const taskService = TestBed.inject(TaskService);
    const task = createTask(taskService, { title: 'Deletable task' });

    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();

    const emitted: Task[] = [];
    fixture.componentInstance.delete.subscribe((value) => emitted.push(value));

    const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Delete task"]',
    );
    deleteButton.click();

    expect(emitted).toEqual([task]);
  });

  describe('search', () => {
    it('shows every task when the search term is empty', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'First' });
      createTask(taskService, { title: 'Second' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('filters case-insensitively by title', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'Design landing page' });
      createTask(taskService, { title: 'Fix login bug' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.componentRef.setInput('searchTerm', 'LOGIN');
      fixture.detectChanges();

      const rows: NodeListOf<HTMLTableRowElement> = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('Fix login bug');
    });

    it('filters by description as well as title', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'Task A', description: 'Contains the word budget' });
      createTask(taskService, { title: 'Task B', description: 'Unrelated' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.componentRef.setInput('searchTerm', 'budget');
      fixture.detectChanges();

      const rows: NodeListOf<HTMLTableRowElement> = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('Task A');
    });

    it('shows a "no matches" message (not the empty-list message) when a search yields nothing but tasks exist', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'Only task' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.componentRef.setInput('searchTerm', 'nonexistent');
      fixture.detectChanges();

      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(1);
      expect(rows[0].textContent).toContain('No tasks match');
      expect(rows[0].textContent).not.toContain('No tasks yet');
    });
  });

  describe('filters', () => {
    it('opens the Filters panel on click and closes it on a second click', () => {
      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();

      const filtersButton = getToggleButton(fixture, 'Filters');
      expect(filtersButton.getAttribute('aria-expanded')).toBe('false');

      filtersButton.click();
      fixture.detectChanges();
      expect(filtersButton.getAttribute('aria-expanded')).toBe('true');
      expect(fixture.nativeElement.querySelector('[role="group"][aria-label="Filter tasks"]')).toBeTruthy();

      filtersButton.click();
      fixture.detectChanges();
      expect(filtersButton.getAttribute('aria-expanded')).toBe('false');
      expect(fixture.nativeElement.querySelector('[role="group"][aria-label="Filter tasks"]')).toBeFalsy();
    });

    it('filters by a checked status, showing tasks with any checked status (union)', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'Todo task', status: 'To Do' });
      createTask(taskService, { title: 'Doing task', status: 'In Progress' });
      createTask(taskService, { title: 'Done task', status: 'Done' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();
      getToggleButton(fixture, 'Filters').click();
      fixture.detectChanges();

      getFilterCheckbox(fixture, 'To Do').click();
      fixture.detectChanges();
      expect(getRowTitles(fixture)).toEqual(['Todo task']);

      getFilterCheckbox(fixture, 'Done').click();
      fixture.detectChanges();
      expect(getRowTitles(fixture).sort()).toEqual(['Done task', 'Todo task']);
    });

    it('combines status and priority filters with AND semantics across dimensions', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'Match', status: 'To Do', priority: 'High' });
      createTask(taskService, { title: 'Wrong priority', status: 'To Do', priority: 'Low' });
      createTask(taskService, { title: 'Wrong status', status: 'Done', priority: 'High' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();
      getToggleButton(fixture, 'Filters').click();
      fixture.detectChanges();

      getFilterCheckbox(fixture, 'To Do').click();
      getFilterCheckbox(fixture, 'High').click();
      fixture.detectChanges();

      expect(getRowTitles(fixture)).toEqual(['Match']);
    });

    it('shows an active-filter count badge and clears filters via "Clear filters"', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'A', status: 'To Do' });
      createTask(taskService, { title: 'B', status: 'Done' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();
      const filtersButton = getToggleButton(fixture, 'Filters');

      expect(filtersButton.querySelector('.filter-count-badge')).toBeFalsy();

      filtersButton.click();
      fixture.detectChanges();
      const checkbox: HTMLInputElement = fixture.nativeElement.querySelector(
        '.filters-checkbox-row input[type="checkbox"]',
      );
      checkbox.click();
      fixture.detectChanges();

      expect(filtersButton.querySelector('.filter-count-badge')?.textContent?.trim()).toBe('1');
      expect(getRowTitles(fixture)).toEqual(['A']);

      const clearButton: HTMLButtonElement = fixture.nativeElement.querySelector('.dropdown-panel .btn-link');
      clearButton.click();
      fixture.detectChanges();

      expect(getRowTitles(fixture).sort()).toEqual(['A', 'B']);
      expect(filtersButton.querySelector('.filter-count-badge')).toBeFalsy();
    });
  });

  describe('sort', () => {
    it('sorts ascending by title on first click and toggles to descending on a second click', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'Charlie' });
      createTask(taskService, { title: 'Alpha' });
      createTask(taskService, { title: 'Bravo' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();

      getToggleButton(fixture, 'Sort').click();
      fixture.detectChanges();
      const titleOption: HTMLButtonElement = Array.from(
        fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'),
      ).find((b) => (b as HTMLButtonElement).textContent?.includes('Title')) as HTMLButtonElement;
      titleOption.click();
      fixture.detectChanges();

      expect(getRowTitles(fixture)).toEqual(['Alpha', 'Bravo', 'Charlie']);
      // The Sort menu closes after a selection.
      expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeFalsy();

      getToggleButton(fixture, 'Sort').click();
      fixture.detectChanges();
      const titleOptionAgain: HTMLButtonElement = Array.from(
        fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'),
      ).find((b) => (b as HTMLButtonElement).textContent?.includes('Title')) as HTMLButtonElement;
      titleOptionAgain.click();
      fixture.detectChanges();

      expect(getRowTitles(fixture)).toEqual(['Charlie', 'Bravo', 'Alpha']);
    });

    it('sorts tasks with no due date last, regardless of direction', () => {
      const taskService = TestBed.inject(TaskService);
      createTask(taskService, { title: 'No date' });
      createTask(taskService, { title: 'Earlier', dueDate: '2024-01-01' });
      createTask(taskService, { title: 'Later', dueDate: '2024-06-01' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();
      getToggleButton(fixture, 'Sort').click();
      fixture.detectChanges();
      const dueDateOption: HTMLButtonElement = Array.from(
        fixture.nativeElement.querySelectorAll('[role="menuitemradio"]'),
      ).find((b) => (b as HTMLButtonElement).textContent?.includes('Due Date')) as HTMLButtonElement;
      dueDateOption.click();
      fixture.detectChanges();

      expect(getRowTitles(fixture)).toEqual(['Earlier', 'Later', 'No date']);
    });

    it('returns to natural order via "Clear sort"', () => {
      const taskService = TestBed.inject(TaskService);
      const first = createTask(taskService, { title: 'Zulu' });
      const second = createTask(taskService, { title: 'Alpha' });

      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();
      getToggleButton(fixture, 'Sort').click();
      fixture.detectChanges();
      (
        Array.from(fixture.nativeElement.querySelectorAll('[role="menuitemradio"]')).find((b) =>
          (b as HTMLButtonElement).textContent?.includes('Title'),
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();
      expect(getRowTitles(fixture)).toEqual(['Alpha', 'Zulu']);

      getToggleButton(fixture, 'Sort').click();
      fixture.detectChanges();
      const clearSort: HTMLButtonElement = Array.from(
        fixture.nativeElement.querySelectorAll('[role="menuitem"]'),
      ).find((b) => (b as HTMLButtonElement).textContent?.trim() === 'Clear sort') as HTMLButtonElement;
      clearSort.click();
      fixture.detectChanges();

      expect(getRowTitles(fixture)).toEqual([first.title, second.title]);
    });
  });

  describe('dropdown dismissal', () => {
    it('closes an open menu when clicking outside the component', () => {
      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();

      getToggleButton(fixture, 'Filters').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.dropdown-panel')).toBeTruthy();

      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.dropdown-panel')).toBeFalsy();
    });

    it('closes an open menu on Escape', () => {
      const fixture = TestBed.createComponent(TaskListComponent);
      fixture.detectChanges();

      getToggleButton(fixture, 'Sort').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.dropdown-panel')).toBeTruthy();

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.dropdown-panel')).toBeFalsy();
    });
  });
});
