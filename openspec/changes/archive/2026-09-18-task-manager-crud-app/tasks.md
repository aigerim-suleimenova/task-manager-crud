## 1. Project Scaffold

- [x] 1.1 Generate a new Angular app (standalone components, no routing needed) with `ng new` (or equivalent) and verify `ng serve` / `ng build` run successfully on the empty scaffold
- [x] 1.2 Add the `bootstrap` npm package and register `bootstrap.min.css` in `angular.json` `styles`, and verify a Bootstrap utility class (e.g. `d-flex`) visibly applies in the running app
- [x] 1.3 Add a `_theme` stylesheet (or `:root` CSS custom properties) defining the brand/badge hex values from design.md (`$primary: #7AB648` Sass override, status/priority badge colors) and import it after Bootstrap's CSS

## 2. Task Model & Service

- [x] 2.1 Add `src/app/models/task.model.ts` with the `Task`, `TaskStatus`, `TaskPriority` types per design.md and verify it compiles (`tsc`/`ng build`)
- [x] 2.2 Add `src/app/services/task.service.ts` (`providedIn: 'root'`) with a private `WritableSignal<Task[]>`, a public readonly signal accessor, and `getAll`/`create`/`update`/`delete` methods
- [x] 2.3 Implement `localStorage` load-on-construct (key `tasks_data`, guarded JSON.parse defaulting to `[]`) and verify via a unit test that a corrupt/missing value yields an empty array instead of throwing
- [x] 2.4 Implement persist-on-write (every `create`/`update`/`delete` writes the full array back to `tasks_data`) and verify via a unit test that `localStorage.setItem` is called with the updated array after each operation
- [x] 2.5 Implement `create` generating an id via `crypto.randomUUID()` and verify via a unit test that two consecutive creates get distinct ids and the signal reflects both

## 3. Task List UI

- [x] 3.1 Build `TaskListComponent` reading `TaskService`'s signal and rendering a row per task (title, description, status badge, priority badge, due date) and verify it renders 0/1/many tasks correctly in a component test
- [x] 3.2 Add status badge styling (`To Do`/`In Progress`/`Done`) and priority badge styling (`Low`/`Medium`/`High`) matching the hex values in design.md, and verify visually against the Figma Task List screen
- [x] 3.3 Add Edit/Delete action buttons per row that emit `edit`/`delete` outputs with the corresponding `Task`, and verify via a component test that clicking each emits the expected event with the right task
- [x] 3.4 Add an empty-state message shown when the task list is empty, and verify it appears when `TaskService` has zero tasks and disappears once one is added
- [x] 3.5 Make the list responsive (horizontal scroll or stacked card layout below a small-viewport breakpoint) and verify by resizing the browser / using device emulation at mobile width (browser-tool window resize was unreliable in this session — see note below; verified structurally instead: `.table-responsive` computes `overflow-x: auto`, confirmed via live DOM inspection)

## 4. Task Form (Create/Edit) Modal

- [x] 4.1 Build `TaskFormComponent` with a `ReactiveFormsModule` form (title, description, status, priority, dueDate) matching the fields/defaults in design.md, and verify the form group's initial value matches an empty-create default
- [x] 4.2 Add an `@Input() task?: Task` that `patchValue`s the form on `ngOnInit` when present, and verify via a component test that opening the form with a task pre-fills all fields
- [x] 4.3 Add required/trimmed validation on `title` and required validation on `status`/`priority`, surfacing a visible error and blocking submit when invalid, and verify via a component test that submitting a blank/whitespace title does not emit `save`
- [x] 4.4 Wire form submission to emit a `save` event with the form's value (for create) or the merged updated `Task` (for edit), and a `cancel` event on Cancel/close (×), and verify both via component tests
- [x] 4.5 Style the modal (header, body, footer, Cancel/Submit buttons) to match the Figma Task Form screen using Bootstrap modal classes rendered via `@if` (per design.md — no Bootstrap JS plugin), and verify visually against the Figma screen
- [x] 4.6 In `AppComponent` (or a thin container), wire "New Task" button and each row's Edit action to open this modal in create vs. edit mode, and call `TaskService.create`/`update` on `save`, closing the modal after

## 5. Delete Confirmation Modal

- [x] 5.1 Build `ConfirmDialogComponent` with `title`/`message` inputs and `confirm`/`cancel` outputs, styled per the Figma Delete Confirm screen (warning icon, red Delete button), and verify via a component test that each button emits the right output
- [x] 5.2 In `AppComponent`, wire each row's Delete action to open `ConfirmDialogComponent` with the task's name in the message, calling `TaskService.delete` only on `confirm`, and verify via a component test that cancelling leaves the task list unchanged and confirming removes the task

## 6. Persistence Verification

- [x] 6.1 Write an integration/component test that creates, edits, and deletes a task through the UI and asserts `localStorage.getItem('tasks_data')` reflects each change
- [x] 6.2 Write a test that seeds `localStorage` with a `tasks_data` value before bootstrapping the app and verifies the task list renders those tasks on load

## 7. Final Polish

- [x] 7.1 Rebuild the static sidebar/header shell (workspace name, nav, user block, "New Task" button, task count) as presentational Bootstrap markup per design.md, and verify it visually matches the Figma screens across desktop and mobile widths (desktop verified via live screenshots against all three Figma screens; mobile verified structurally — see 3.5 note)
- [x] 7.2 Run the full test suite and `ng build` and verify both succeed with no errors
