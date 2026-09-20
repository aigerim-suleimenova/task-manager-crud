import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Task, TaskFormValue, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

function requiredTrimmedValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString();
  return value.trim().length > 0 ? null : { required: true };
}

@Component({
  selector: 'app-task-form',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent {
  readonly task = input<Task | null>(null);

  readonly save = output<TaskFormValue>();
  readonly cancel = output<void>();

  readonly statusOptions: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
  readonly priorityOptions: TaskPriority[] = ['Low', 'Medium', 'High'];

  private readonly fb = inject(FormBuilder);
  private readonly submitted = signal(false);

  readonly form = this.fb.group({
    title: this.fb.nonNullable.control('', { validators: [requiredTrimmedValidator] }),
    description: this.fb.nonNullable.control(''),
    status: this.fb.nonNullable.control<TaskStatus>('To Do', { validators: [Validators.required] }),
    priority: this.fb.nonNullable.control<TaskPriority>('Medium', {
      validators: [Validators.required],
    }),
    dueDate: this.fb.control<string | null>(null),
  });

  constructor() {
    effect(() => {
      const task = this.task();
      if (task) {
        this.form.patchValue({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
        });
      }
    });
  }

  get isEdit(): boolean {
    return !!this.task();
  }

  get titleInvalid(): boolean {
    const control = this.form.controls.title;
    return control.invalid && (control.touched || this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.save.emit({
      title: value.title.trim(),
      description: value.description,
      status: value.status,
      priority: value.priority,
      dueDate: value.dueDate || null,
    });
  }
}
