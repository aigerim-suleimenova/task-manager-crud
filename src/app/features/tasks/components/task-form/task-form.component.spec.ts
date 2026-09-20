import { TestBed } from '@angular/core/testing';
import { TaskFormComponent } from './task-form.component';
import { Task, TaskFormValue } from '../../../../core/models/task.model';

describe('TaskFormComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TaskFormComponent] });
  });

  it('initializes the form with create defaults when no task is provided', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: null,
    });
    expect(fixture.componentInstance.isEdit).toBe(false);
  });

  it('pre-fills every field when opened with an existing task', () => {
    const task: Task = {
      id: 'abc',
      title: 'Existing task',
      description: 'Existing description',
      status: 'In Progress',
      priority: 'High',
      dueDate: '2024-10-28',
    };

    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.componentRef.setInput('task', task);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.getRawValue()).toEqual({
      title: 'Existing task',
      description: 'Existing description',
      status: 'In Progress',
      priority: 'High',
      dueDate: '2024-10-28',
    });
    expect(fixture.componentInstance.isEdit).toBe(true);
  });

  it('does not emit save when the title is blank or whitespace-only', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.detectChanges();

    const emitted: TaskFormValue[] = [];
    fixture.componentInstance.save.subscribe((value) => emitted.push(value));

    fixture.componentInstance.form.controls.title.setValue('   ');
    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual([]);
    expect(fixture.componentInstance.titleInvalid).toBe(true);
  });

  it('emits save with the trimmed form value on valid submit', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.detectChanges();

    const emitted: TaskFormValue[] = [];
    fixture.componentInstance.save.subscribe((value) => emitted.push(value));

    fixture.componentInstance.form.setValue({
      title: '  New task  ',
      description: 'Details',
      status: 'To Do',
      priority: 'Low',
      dueDate: '2024-11-01',
    });
    fixture.componentInstance.onSubmit();

    expect(emitted).toEqual([
      {
        title: 'New task',
        description: 'Details',
        status: 'To Do',
        priority: 'Low',
        dueDate: '2024-11-01',
      },
    ]);
  });

  it('emits cancel when the Cancel button is clicked', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
    const cancelButton = buttons.find((button) => button.textContent?.trim() === 'Cancel');
    cancelButton?.click();

    expect(cancelled).toBe(true);
  });

  it('emits cancel when the close (×) button is clicked', () => {
    const fixture = TestBed.createComponent(TaskFormComponent);
    fixture.detectChanges();

    let cancelled = false;
    fixture.componentInstance.cancel.subscribe(() => (cancelled = true));

    const closeButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Close"]',
    );
    closeButton.click();

    expect(cancelled).toBe(true);
  });
});
