import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { TaskService } from '../../../../core/services/task.service';
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
