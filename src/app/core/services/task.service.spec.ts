import { TestBed } from '@angular/core/testing';
import { TaskService } from './task.service';
import { AuthService } from './auth.service';
import { TaskFormValue } from '../models/task.model';
import { registerTestUser } from '../../testing/auth-test-helpers';

function makeFormValue(overrides: Partial<TaskFormValue> = {}): TaskFormValue {
  return {
    title: 'Test task',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: null,
    ...overrides,
  };
}

describe('TaskService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('initializes with an empty array when logged out', () => {
    const service = TestBed.inject(TaskService);
    expect(service.tasks()).toEqual([]);
  });

  describe('when logged in', () => {
    it('initializes with an empty array when this user has no stored tasks', async () => {
      const authService = TestBed.inject(AuthService);
      await registerTestUser(authService);

      const service = TestBed.inject(TaskService);
      expect(service.tasks()).toEqual([]);
    });

    it('initializes with an empty array when this user’s stored value is corrupt JSON', async () => {
      const authService = TestBed.inject(AuthService);
      const user = await registerTestUser(authService);
      localStorage.setItem(`tasks_data_${user.id}`, '{not-valid-json');

      expect(() => TestBed.inject(TaskService)).not.toThrow();
      const service = TestBed.inject(TaskService);
      expect(service.tasks()).toEqual([]);
    });

    it('persists the full task array to this user’s localStorage key after create', async () => {
      const authService = TestBed.inject(AuthService);
      const user = await registerTestUser(authService);
      const service = TestBed.inject(TaskService);

      service.create(makeFormValue({ title: 'First' }));

      const stored = JSON.parse(localStorage.getItem(`tasks_data_${user.id}`)!);
      expect(stored.map((t: { title: string }) => t.title)).toEqual(['First']);
    });

    it('persists after update and after delete', async () => {
      const authService = TestBed.inject(AuthService);
      const user = await registerTestUser(authService);
      const service = TestBed.inject(TaskService);
      const task = service.create(makeFormValue({ title: 'Original' }))!;

      service.update(task.id, makeFormValue({ title: 'Updated' }));
      expect(JSON.parse(localStorage.getItem(`tasks_data_${user.id}`)!)).toEqual(service.tasks());

      service.delete(task.id);
      expect(JSON.parse(localStorage.getItem(`tasks_data_${user.id}`)!)).toEqual([]);
    });

    it('assigns distinct ids to consecutively created tasks and reflects both in the signal', async () => {
      const authService = TestBed.inject(AuthService);
      await registerTestUser(authService);
      const service = TestBed.inject(TaskService);

      const first = service.create(makeFormValue({ title: 'First' }))!;
      const second = service.create(makeFormValue({ title: 'Second' }))!;

      expect(first.id).not.toEqual(second.id);
      expect(service.tasks().map((t) => t.id)).toEqual([first.id, second.id]);
    });
  });

  describe('when logged out', () => {
    it('create/update/delete no-op instead of throwing, and do not write to localStorage', () => {
      const service = TestBed.inject(TaskService);

      expect(() => service.create(makeFormValue())).not.toThrow();
      expect(service.create(makeFormValue())).toBeNull();
      expect(() => service.update('some-id', makeFormValue())).not.toThrow();
      expect(() => service.delete('some-id')).not.toThrow();
      expect(service.tasks()).toEqual([]);
      expect(Object.keys(localStorage).some((key) => key.startsWith('tasks_data_'))).toBe(false);
    });
  });

  describe('per-user isolation', () => {
    it('reads and writes different users’ tasks under different localStorage keys, and switches on user change', async () => {
      const authService = TestBed.inject(AuthService);
      const service = TestBed.inject(TaskService);

      const userA = await registerTestUser(authService, 'a@example.com');
      TestBed.tick();
      const taskA = service.create(makeFormValue({ title: 'A’s task' }))!;
      expect(service.tasks()).toEqual([taskA]);

      authService.logout();
      const userB = await registerTestUser(authService, 'b@example.com');
      TestBed.tick();
      expect(service.tasks()).toEqual([]);
      const taskB = service.create(makeFormValue({ title: 'B’s task' }))!;
      expect(service.tasks()).toEqual([taskB]);

      expect(JSON.parse(localStorage.getItem(`tasks_data_${userA.id}`)!)).toEqual([taskA]);
      expect(JSON.parse(localStorage.getItem(`tasks_data_${userB.id}`)!)).toEqual([taskB]);

      authService.logout();
      await authService.login('a@example.com', 'password123');
      TestBed.tick();
      expect(service.tasks()).toEqual([taskA]);
    });
  });
});
