## Context

Greenfield project — no existing Angular app, no backend. See proposal.md for motivation. Three Figma exports were supplied (Task List, Task Form, Delete Confirm) and define the target visual style; the user has directed styling to use **Bootstrap** (not Tailwind/Angular Material as originally floated).

## Goals / Non-Goals

**Goals:**
- Working Angular standalone-component app implementing full task CRUD against `localStorage`.
- Visual design matching the Figma screens' layout, color palette, badges, and modal treatment, rebuilt with Bootstrap primitives/utilities instead of the raw Figma markup.
- Fully responsive (mobile/tablet/desktop), since the Figma export is fixed-width (1200px) and explicitly calls out replacing absolute positioning with responsive layout.

**Non-Goals:**
- No backend/API, authentication, multi-user workspace, search, filtering/sorting, or notifications — the Figma screens show a "Sidebar" with workspace switcher, notifications bell, and search box, but the underlying app has no such features. These are rendered as static/presentational chrome only, not wired to real logic.
- No routing between pages — the whole app is a single view (list + modals).
- No automated visual-regression testing against the Figma files.

## Decisions

**Angular standalone APIs, no NgModules.** Bootstrap via `provideRouter`-free, `ApplicationConfig`-based `main.ts`. Rationale: matches the user's explicit requirement (standalone components + signals) and is the current Angular default.

**State: a single `TaskService` holding a `signal<Task[]>`.**
- `TaskService` (`providedIn: 'root'`) owns a private `WritableSignal<Task[]>` and exposes it as a read-only `Signal<Task[]>` via `.asReadonly()`.
- CRUD methods (`create`, `update`, `delete`, `getAll`) mutate the signal and immediately call a private `persist()` that does `localStorage.setItem('tasks_data', JSON.stringify(tasks))`.
- On construction, `TaskService` reads `localStorage.getItem('tasks_data')`, `JSON.parse`s it (guarded by try/catch — treat parse failure or missing key as an empty array), and seeds the signal.
- Alternative considered: NgRx / a full store. Rejected — the state is a single flat list with no cross-cutting concerns; a store adds ceremony with no benefit at this scale.

**Task identity: `crypto.randomUUID()`.** Available in all evergreen browsers; avoids adding a uuid library dependency.

**Task model** (`src/app/models/task.model.ts`):
```ts
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // ISO 8601 date string (yyyy-MM-dd), or null if unset
}
```

**Component structure** (all standalone, under `src/app/`):
- `AppComponent` — hosts the static sidebar/header shell plus `<app-task-list>`, and owns which modal (if any) is open: none / create-edit / delete-confirm. Holds the "task currently being edited/deleted" as a local signal.
- `task-list/task-list.component.ts` — reads `TaskService`'s signal via `input()`-free direct injection, renders the table/badges, emits `edit(task)` and `delete(task)` outputs that `AppComponent` handles by opening the relevant modal.
- `task-form/task-form.component.ts` — a `ReactiveFormsModule` form used for both create and edit. Takes an optional `Task` via `@Input()`; when present, `patchValue`s the form in `ngOnInit`. Emits `save(TaskFormValue)` and `cancel()`. Does not talk to `TaskService` directly — `AppComponent` (or a thin wrapper) performs the actual `create`/`update` call, keeping the form a dumb presentational component.
- `confirm-dialog/confirm-dialog.component.ts` — generic modal taking `title`, `message` inputs and emitting `confirm()` / `cancel()`; reused for delete (and any future destructive action).

**Modals rendered as plain Angular structural directives (`@if`) inside `AppComponent`'s template, not Bootstrap's JS modal plugin.** Rationale: keeps modal open/close state in Angular (signals) as the single source of truth, avoids loading `bootstrap.bundle.js` / Popper, and avoids fighting Angular change detection around jQuery-style `show()`/`hide()` DOM APIs. We reuse Bootstrap's **markup and classes** (`modal`, `modal-dialog`, `modal-content`, `d-block` to force-show, a manually rendered `modal-backdrop`) for visual fidelity, and bind `(click)` on the backdrop / Cancel / close (×) button to close.

**Styling: Bootstrap 5 via npm (`bootstrap` package), compiled from its Sass source** (`src/styles.scss` sets `$primary: #7AB648` and related theme-color Sass variables, then `@use 'bootstrap/scss/bootstrap'`), rather than importing the precompiled `bootstrap.min.css` directly. No Bootstrap JS bundle is included since modals are hand-rolled (see above); if a future component needs Bootstrap JS behavior (e.g. dropdowns), it can be added then.
  - _Amendment (discovered during implementation):_ Bootstrap 5.3's precompiled CSS hardcodes each component's color as a literal hex value inside that component's own custom properties (e.g. `.btn-primary { --bs-btn-bg: #0d6efd; ... }`), rather than referencing the root `--bs-primary` variable. Overriding `--bs-primary` at `:root` therefore does not retint `.btn-primary`/`.bg-primary`/etc. Compiling from Sass with `$primary` overridden is the standard, supported way to retheme Bootstrap and produces the same visual result the original CSS-only plan intended.
- Badge colors are implemented as small custom CSS classes (e.g. `.badge-status-todo`, `.badge-priority-high`) layered on top of Bootstrap's `.badge` utility, using the exact hex values from the Figma export (status: To Do `#F3F4F6`/`#4B5563`, In Progress `#E8F5DE`/`#5A8A35`, Done `#D1FAE5`/`#065F46`; priority: Low `#F0FDF4`/`#15803D`, Medium `#FEF3C7`/`#D97706`, High `#FEE2E2`/`#DC2626`), since Bootstrap's default badge palette doesn't match.
- Primary action color (`New Task` / `Create Task` buttons) uses the Sass `$primary` override (`#7AB648`) rather than Bootstrap's default blue, to match the Figma brand color.
- The Figma sidebar (workspace switcher, nav, user profile) is rebuilt as static Bootstrap flex/utility markup for visual fidelity, with hard-coded placeholder content (e.g. "Acme Corp", "Jane Doe") — no logic behind it.
- Layout uses Bootstrap's flex/grid utilities (`d-flex`, `flex-column`, `flex-grow-1`, responsive `d-none d-md-flex`, etc.) instead of the Figma export's fixed pixel widths/absolute positioning, per the Figma note to make it fully responsive. On narrow viewports the sidebar collapses (hidden or collapsible) and the table becomes horizontally scrollable or stacks to a card-per-task layout.

**Form validation:** `Validators.required` (with a trimmed-value custom validator, since `required` alone passes on whitespace) on `title`; no validators on `description`/`dueDate`; `status`/`priority` default to `'To Do'` / `'Medium'` and use `Validators.required` so an empty selection can't be submitted.

**Due date representation:** stored as `yyyy-MM-dd` string from `<input type="date">`, kept as a plain string end-to-end (no `Date` object round-tripping) to avoid timezone-shift bugs when serializing to/from `localStorage`.
- _Amendment (discovered during implementation):_ this also extends to **display** formatting. Angular's `DatePipe` parses a bare `yyyy-MM-dd` string as local midnight and then applies its own timezone-conversion math even when passed an explicit `'UTC'` timezone argument, which can shift the displayed value onto the wrong calendar day depending on the browser's local offset (verified: renders one day earlier in UTC+2). The task list therefore formats `dueDate` with a small pure string-parsing helper (`formatDueDate`, `src/app/shared/date-format.ts`) instead of `DatePipe`, so display is unaffected by the runtime's timezone.

## Risks / Trade-offs

- **[Hand-rolled modals lose native Bootstrap JS affordances]** (focus trap, `Esc`-to-close, ARIA wiring Bootstrap's plugin provides automatically) → Mitigation: implement `Esc` keydown handling and focus-return manually in `ConfirmDialogComponent`/`TaskFormComponent`; keep them small enough that this is tractable.
- **[`localStorage` is per-browser/per-device]**, so "persistence" doesn't mean multi-device sync → Mitigation: none needed — this matches the proposal's explicit scope (local persistence only), just calling it out so it isn't mistaken for a bug later.
- **[`crypto.randomUUID()` requires a secure context (HTTPS or localhost)]** → Mitigation: acceptable for a local dev/demo app; note it if ever deployed over plain HTTP.
- **[Custom badge/brand colors drift from Bootstrap's theme as Bootstrap versions change]** → Mitigation: colors are pinned as explicit hex values in one place (a small `_theme.scss` or CSS custom-properties block) rather than scattered inline styles.
