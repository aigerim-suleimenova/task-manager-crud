## Why

There is currently no application in this repository. We need a standalone Task Manager where a user can create, view, update, and delete tasks, with data persisted locally in the browser so the tool is usable without a backend.

## What Changes

- Scaffold a new Angular application (standalone components, Signals, Reactive Forms).
- Add a `Task` model (`id`, `title`, `description`, `status`, `priority`, `dueDate`).
- Add a `TaskService` that performs CRUD against `localStorage` (key `tasks_data`) and exposes the task list as a signal.
- Add a `TaskListComponent` that renders tasks in a table with color-coded Status and Priority badges, and Edit/Delete row actions, styled after the supplied Figma "Task List" screen.
- Add a `TaskFormComponent` (modal) used for both creating and editing a task, with Reactive Forms validation (Title required; Description, Status, Priority, Due Date), styled after the supplied Figma "Task Form" screen.
- Add a `ConfirmDialogComponent` (modal) that gates task deletion behind an explicit confirmation, styled after the supplied Figma "Delete Confirm" screen.
- Style the app with Bootstrap (per user direction, superseding the originally proposed Tailwind/Angular Material option), matching the Figma palette (green primary `#7AB648`, status/priority badge colors, card/table/modal treatment).
- Persist every create/update/delete to `localStorage` and load existing tasks on app start.

## Capabilities

### New Capabilities
- `task-management`: Create, read, update, and delete tasks through a form and list UI, with localStorage-backed persistence and delete confirmation.

### Modified Capabilities
- (none — greenfield project)

## Impact

- New Angular workspace (package.json, angular.json, src/ tree) — no existing app code affected.
- New dependency: Bootstrap (CSS, optionally the JS bundle for modal behavior) instead of Tailwind CSS/Angular Material.
- Browser `localStorage` under key `tasks_data` becomes the sole data store; no backend/API is introduced.
