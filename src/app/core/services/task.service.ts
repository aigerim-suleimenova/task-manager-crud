import { Injectable, effect, inject, signal } from '@angular/core';
import { Task, TaskFormValue } from '../models/task.model';
import { AuthService } from './auth.service';

function storageKeyFor(userId: string): string {
  return `tasks_data_${userId}`;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly authService = inject(AuthService);
  private readonly tasksSignal = signal<Task[]>(this.loadFromStorage());
  readonly tasks = this.tasksSignal.asReadonly();

  constructor() {
    // Reload the task list whenever the active user changes (login, logout, or
    // switching accounts) so a previous user's tasks never linger on screen.
    // localStorage access is synchronous, so there's no async window in which
    // this reload could race a pending persist() from the prior user.
    effect(() => {
      this.authService.currentUser();
      this.tasksSignal.set(this.loadFromStorage());
    });
  }

  getAll(): Task[] {
    return this.tasksSignal();
  }

  create(value: TaskFormValue): Task | null {
    if (!this.authService.currentUser()) {
      console.warn('TaskService.create called with no active user; ignoring.');
      return null;
    }
    const task: Task = { id: crypto.randomUUID(), ...value };
    this.tasksSignal.update((tasks) => [...tasks, task]);
    this.persist();
    return task;
  }

  update(id: string, value: TaskFormValue): void {
    if (!this.authService.currentUser()) {
      console.warn('TaskService.update called with no active user; ignoring.');
      return;
    }
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === id ? { ...task, ...value, id } : task)),
    );
    this.persist();
  }

  delete(id: string): void {
    if (!this.authService.currentUser()) {
      console.warn('TaskService.delete called with no active user; ignoring.');
      return;
    }
    this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== id));
    this.persist();
  }

  private persist(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return;
    }
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(this.tasksSignal()));
  }

  private loadFromStorage(): Task[] {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      return [];
    }
    try {
      const raw = localStorage.getItem(storageKeyFor(userId));
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
