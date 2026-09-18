import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TaskService } from '../../../../core/services/task.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Task, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { formatDueDate } from '../../../../shared/date-format';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  'To Do': 'badge-status-todo',
  'In Progress': 'badge-status-in-progress',
  Done: 'badge-status-done',
};

const PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
  Low: 'badge-priority-low',
  Medium: 'badge-priority-medium',
  High: 'badge-priority-high',
};

const STATUS_ORDER: Record<TaskStatus, number> = { 'To Do': 0, 'In Progress': 1, Done: 2 };
const PRIORITY_ORDER: Record<TaskPriority, number> = { Low: 0, Medium: 1, High: 2 };

type SortField = 'title' | 'dueDate' | 'priority' | 'status';
type SortDirection = 'asc' | 'desc';
type OpenMenu = 'filters' | 'sort' | null;

const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

const STATUS_VALUES: readonly TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const PRIORITY_VALUES: readonly TaskPriority[] = ['Low', 'Medium', 'High'];
const SORT_FIELD_VALUES: readonly SortField[] = ['title', 'dueDate', 'priority', 'status'];

interface StoredViewPrefs {
  statusFilter: TaskStatus[];
  priorityFilter: TaskPriority[];
  sortField: SortField | null;
  sortDirection: SortDirection;
}

interface ViewPrefs {
  statusFilter: ReadonlySet<TaskStatus>;
  priorityFilter: ReadonlySet<TaskPriority>;
  sortField: SortField | null;
  sortDirection: SortDirection;
}

function viewPrefsKeyFor(userId: string): string {
  return `task_view_prefs_${userId}`;
}

const DEFAULT_VIEW_PREFS: ViewPrefs = {
  statusFilter: new Set(),
  priorityFilter: new Set(),
  sortField: null,
  sortDirection: 'asc',
};

function loadViewPrefs(userId: string | undefined): ViewPrefs {
  if (!userId) {
    return DEFAULT_VIEW_PREFS;
  }
  try {
    const raw = localStorage.getItem(viewPrefsKeyFor(userId));
    if (!raw) {
      return DEFAULT_VIEW_PREFS;
    }
    const parsed = JSON.parse(raw);
    const statusFilter = Array.isArray(parsed.statusFilter)
      ? parsed.statusFilter.filter((s: unknown) => STATUS_VALUES.includes(s as TaskStatus))
      : [];
    const priorityFilter = Array.isArray(parsed.priorityFilter)
      ? parsed.priorityFilter.filter((p: unknown) => PRIORITY_VALUES.includes(p as TaskPriority))
      : [];
    const sortField = SORT_FIELD_VALUES.includes(parsed.sortField) ? (parsed.sortField as SortField) : null;
    const sortDirection: SortDirection = parsed.sortDirection === 'desc' ? 'desc' : 'asc';
    return { statusFilter: new Set(statusFilter), priorityFilter: new Set(priorityFilter), sortField, sortDirection };
  } catch {
    return DEFAULT_VIEW_PREFS;
  }
}

function compareTasks(a: Task, b: Task, field: SortField): number {
  switch (field) {
    case 'title':
      return a.title.localeCompare(b.title);
    case 'dueDate':
      if (a.dueDate === b.dueDate) return 0;
      if (a.dueDate === null) return 1; // tasks with no due date always sort last
      if (b.dueDate === null) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    case 'priority':
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    case 'status':
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  }
}

@Component({
  selector: 'app-task-list',
  imports: [BadgeComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly taskService = inject(TaskService);
  private readonly authService = inject(AuthService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly searchTerm = input('');

  readonly statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
  readonly priorityOptions: TaskPriority[] = ['Low', 'Medium', 'High'];
  readonly sortFields = SORT_FIELDS;

  private readonly statusFilter = signal<ReadonlySet<TaskStatus>>(new Set());
  private readonly priorityFilter = signal<ReadonlySet<TaskPriority>>(new Set());
  private readonly sortField = signal<SortField | null>(null);
  private readonly sortDirection = signal<SortDirection>('asc');

  readonly activeSortField = this.sortField.asReadonly();
  readonly activeSortDirection = this.sortDirection.asReadonly();
  readonly activeFilterCount = computed(() => this.statusFilter().size + this.priorityFilter().size);

  readonly openMenu = signal<OpenMenu>(null);

  // Tracks which user's prefs are currently loaded into the signals above,
  // so the effect below can tell "the user changed" apart from "the same
  // user changed a filter" on each run.
  private lastLoadedUserId: string | undefined;

  constructor() {
    // Single effect, explicitly ordered: two separate effects (one to load
    // on user change, one to persist on filter/sort change) would both
    // depend on the same userId signal with no guaranteed execution order
    // between them — if the persist effect ran first on a user switch, it
    // would write the previous user's in-memory filter state under the new
    // user's storage key. Branching within one effect avoids that by
    // construction.
    effect(() => {
      const userId = this.authService.currentUser()?.id;
      // Read unconditionally, not only inside the branch below that needs
      // them: on the very first run, lastLoadedUserId is undefined, so the
      // "user changed" branch always runs first and never reaches the read
      // below it. If these were read only there, this effect would never
      // establish them as dependencies at all, and would never re-run when
      // a filter/sort actually changes afterward — persistence would
      // silently stop working after the initial load. Reading them here
      // does mean the "user changed" branch's own .set() calls trigger one
      // harmless extra run (re-persisting the same just-loaded values); that
      // redundancy is the correct, deliberate trade-off, not a bug.
      const statusFilter = this.statusFilter();
      const priorityFilter = this.priorityFilter();
      const sortField = this.sortField();
      const sortDirection = this.sortDirection();

      if (userId !== this.lastLoadedUserId) {
        this.lastLoadedUserId = userId;
        const prefs = loadViewPrefs(userId);
        this.statusFilter.set(prefs.statusFilter);
        this.priorityFilter.set(prefs.priorityFilter);
        this.sortField.set(prefs.sortField);
        this.sortDirection.set(prefs.sortDirection);
        return;
      }

      if (!userId) {
        return;
      }
      const prefs: StoredViewPrefs = {
        statusFilter: Array.from(statusFilter),
        priorityFilter: Array.from(priorityFilter),
        sortField,
        sortDirection,
      };
      localStorage.setItem(viewPrefsKeyFor(userId), JSON.stringify(prefs));
    });
  }

  readonly tasks = computed(() => {
    let result = this.taskService.tasks();

    const term = this.searchTerm().trim().toLowerCase();
    if (term) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) || task.description.toLowerCase().includes(term),
      );
    }

    const statuses = this.statusFilter();
    if (statuses.size > 0) {
      result = result.filter((task) => statuses.has(task.status));
    }

    const priorities = this.priorityFilter();
    if (priorities.size > 0) {
      result = result.filter((task) => priorities.has(task.priority));
    }

    const field = this.sortField();
    if (field) {
      const direction = this.sortDirection();
      result = [...result].sort((a, b) => {
        const comparison = compareTasks(a, b, field);
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  });

  readonly edit = output<Task>();
  readonly delete = output<Task>();

  readonly formatDueDate = formatDueDate;

  statusBadgeClass(status: TaskStatus): string {
    return STATUS_BADGE_CLASS[status];
  }

  priorityBadgeClass(priority: TaskPriority): string {
    return PRIORITY_BADGE_CLASS[priority];
  }

  toggleFiltersMenu(): void {
    this.openMenu.update((current) => (current === 'filters' ? null : 'filters'));
  }

  toggleSortMenu(): void {
    this.openMenu.update((current) => (current === 'sort' ? null : 'sort'));
  }

  isStatusFilterChecked(status: TaskStatus): boolean {
    return this.statusFilter().has(status);
  }

  isPriorityFilterChecked(priority: TaskPriority): boolean {
    return this.priorityFilter().has(priority);
  }

  toggleStatusFilter(status: TaskStatus): void {
    this.statusFilter.update((current) => toggledSet(current, status));
  }

  togglePriorityFilter(priority: TaskPriority): void {
    this.priorityFilter.update((current) => toggledSet(current, priority));
  }

  clearFilters(): void {
    this.statusFilter.set(new Set());
    this.priorityFilter.set(new Set());
  }

  selectSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
    this.openMenu.set(null);
  }

  clearSort(): void {
    this.sortField.set(null);
    this.openMenu.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.openMenu() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.openMenu.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openMenu.set(null);
  }
}

function toggledSet<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}
