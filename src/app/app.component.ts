import { Component, computed, inject, signal } from '@angular/core';
import { TaskListComponent } from './features/tasks/components/task-list/task-list.component';
import { TaskFormComponent } from './features/tasks/components/task-form/task-form.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { RegisterComponent } from './features/auth/components/register/register.component';
import { TaskService } from './core/services/task.service';
import { AuthService } from './core/services/auth.service';
import { Task, TaskFormValue } from './core/models/task.model';
import { userInitials } from './shared/user-initials';

type ModalState =
  | { kind: 'none' }
  | { kind: 'form'; task: Task | null }
  | { kind: 'confirm-delete'; task: Task };

type AuthView = 'login' | 'register';

@Component({
  selector: 'app-root',
  imports: [TaskListComponent, TaskFormComponent, ConfirmDialogComponent, LoginComponent, RegisterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly taskService = inject(TaskService);
  protected readonly authService = inject(AuthService);

  protected readonly taskCount = computed(() => this.taskService.tasks().length);

  protected readonly authView = signal<AuthView>('login');

  protected readonly searchTerm = signal('');

  protected readonly userInitials = computed(() => userInitials(this.authService.currentUser()?.email ?? ''));

  protected readonly modalState = signal<ModalState>({ kind: 'none' });

  protected readonly isFormOpen = computed(() => this.modalState().kind === 'form');
  protected readonly isDeleteConfirmOpen = computed(() => this.modalState().kind === 'confirm-delete');

  protected readonly formTask = computed(() => {
    const state = this.modalState();
    return state.kind === 'form' ? state.task : null;
  });

  protected readonly deleteDialogMessage = computed(() => {
    const state = this.modalState();
    if (state.kind !== 'confirm-delete') {
      return '';
    }
    return `Are you sure you want to delete "${state.task.title}"? This action cannot be undone and will permanently remove the record.`;
  });

  openCreate(): void {
    this.modalState.set({ kind: 'form', task: null });
  }

  openEdit(task: Task): void {
    this.modalState.set({ kind: 'form', task });
  }

  openDeleteConfirm(task: Task): void {
    this.modalState.set({ kind: 'confirm-delete', task });
  }

  closeModal(): void {
    this.modalState.set({ kind: 'none' });
  }

  onFormSave(value: TaskFormValue): void {
    const state = this.modalState();
    if (state.kind !== 'form') {
      return;
    }
    if (state.task) {
      this.taskService.update(state.task.id, value);
    } else {
      this.taskService.create(value);
    }
    this.closeModal();
  }

  onDeleteConfirmed(): void {
    const state = this.modalState();
    if (state.kind !== 'confirm-delete') {
      return;
    }
    this.taskService.delete(state.task.id);
    this.closeModal();
  }

  onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onLogout(): void {
    this.authService.logout();
    // Always return to the login screen on logout, regardless of whichever
    // auth view (login/register) happened to be showing before the user
    // last signed in.
    this.authView.set('login');
  }
}
