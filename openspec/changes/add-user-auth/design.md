## Context

See proposal.md for motivation. This builds on the already-implemented `task-manager-crud-app` change: an Angular 22 standalone-component app with a signal-backed `TaskService` persisting to a single global `localStorage` key (`tasks_data`), a single-view `AppComponent` (sidebar + header + task list, no router) that toggles hand-rolled Bootstrap modals via a local signal, and a static sidebar user block ("Jane Doe" / `jane@acme.com`) that was purely presentational.

## Goals / Non-Goals

**Goals:**
- Client-side-only accounts (register/login/logout) and per-user task isolation, with zero backend and zero new external dependencies, matching the existing app's architecture.
- Reuse the existing signal-driven, no-router, hand-rolled-Bootstrap-modal patterns rather than introducing new architectural machinery (e.g. NgRx, Angular Router, a real backend) for this.

**Non-Goals:**
- Real security. Passwords and sessions live in `localStorage`; anyone with devtools access to the same browser profile can read or forge them. No hashing scheme applied here makes this "secure" — see Risks.
- Password reset / "forgot password" flows, email verification, multi-device sync, or account deletion. Not requested; would meaningfully expand scope.
- Migrating pre-existing global (`tasks_data`) task data into the new per-user scheme. See Migration Plan.

## Decisions

**Account & session storage shape**, two new top-level `localStorage` keys (alongside existing `tasks_data`, which becomes unused — see Migration Plan):
```ts
export interface UserAccount {
  id: string;          // crypto.randomUUID(), same approach as Task.id
  email: string;       // stored lowercased/trimmed for case-insensitive matching
  passwordHash: string; // hex SHA-256 digest — see security note in Risks
}
```
- `auth_accounts`: `UserAccount[]`, the full registered-account list.
- `auth_session`: the current user's `id` (string), or absent/null when logged out.

**`AuthService`** (`providedIn: 'root'`), modeled directly on the existing `TaskService`:
- Holds `accounts` and `sessionUserId` as private signals, loaded from `localStorage` at construction (same guarded-`JSON.parse`-defaulting-to-empty pattern `TaskService` already uses).
- Exposes `currentUser = computed(...)` (the account matching `sessionUserId`, or `null`) and `isAuthenticated = computed(() => currentUser() !== null)`.
- `register(email, password, confirmPassword)` and `login(email, password)` are `async` (password hashing uses `crypto.subtle.digest`, which is Promise-based) and return a discriminated result (`{ ok: true }` or `{ ok: false; message: string }`) rather than throwing, so calling components can show the message directly without a try/catch.
- `logout()` clears `sessionUserId` and persists.
- Every mutation persists both signals' current values back to their `localStorage` keys immediately, mirroring `TaskService.persist()`.

**Password hashing: unsalted SHA-256 via `crypto.subtle.digest`, not a real password-hashing algorithm (bcrypt/scrypt/Argon2).** Rationale: this repo has no backend and no package for a proper KDF; more importantly, hashing provides no real protection here regardless of algorithm, because the "attacker" in this threat model already has full read/write access to the same `localStorage` the hash would live in (see Risks). SHA-256 is used purely so a casual glance at devtools doesn't show a plaintext password string — hygiene, not security.

**Per-user task storage: `TaskService` injects `AuthService` and keys its storage on the current user's id** (`tasks_data_<userId>`), reacting to login/logout via an `effect()`:
- `TaskService` keeps its existing `WritableSignal<Task[]>` and CRUD methods unchanged in shape, but its `persist()`/`loadFromStorage()` now compute the storage key from `authService.currentUser()?.id` instead of using the fixed `tasks_data` constant.
- An `effect()` in `TaskService`'s constructor watches `authService.currentUser()`; whenever the id changes (including to/from `null`), it reloads the task signal from that user's key (or resets to `[]` when logged out), so switching accounts or logging out immediately swaps the visible task list without a page reload.
- Alternative considered: have `AppComponent` explicitly call a `TaskService.setActiveUser(id)` method on login/logout, instead of `TaskService` reactively watching `AuthService`. Rejected — the `effect()` approach can't be forgotten at a new call site (e.g. a future second login entry point) since it's driven by the signal itself, consistent with this codebase's existing signal-first style.
- `create`/`update`/`delete` no-op (with a `console.warn`) if called with no active user, as a safety net — in practice `AppComponent` never renders `<app-task-list>` while logged out, so this path shouldn't be reachable in normal use.

**Auth screens are full-page centered cards, not modals** (unlike the task-form/confirm-dialog pattern): there's no task list behind them to dim, since they replace the entire main content area while logged out. `LoginComponent` and `RegisterComponent` are standalone components using `ReactiveFormsModule`, styled with the same Bootstrap card/input/button conventions and `#7AB648` brand green already established by `TaskFormComponent`, so they read as part of the same app rather than a bolted-on flow.
- Unlike `TaskFormComponent` (a "dumb" form whose parent performs the actual service call), `LoginComponent`/`RegisterComponent` inject `AuthService` directly and call it from their own submit handlers. Rationale: login/register failures are business-logic errors from an async call (wrong password, duplicate email), not Reactive Forms validation errors, and need to be displayed inline immediately next to the form that produced them — round-tripping the attempt back out through `AppComponent` via `@Output()` and the result back in via `@Input()` adds a hop with no benefit. This mirrors how `TaskListComponent` already injects `TaskService` directly rather than being purely presentational.
- Each emits a simple `switchTo` output (e.g. `switchToRegister` / `switchToLogin`) so `AppComponent` can toggle which one is shown; `AppComponent` owns only a `authView = signal<'login' | 'register'>('login')`, the same lightweight pattern it already uses for `modalState`.

**`AppComponent` gates its existing template on `authService.isAuthenticated()`** via a top-level `@if`/`@else`: logged out renders `<app-login>`/`<app-register>`; logged in renders the existing sidebar + header + task list + modals unchanged. The sidebar's user block switches from the hardcoded "Jane Doe" / `jane@acme.com` to `authService.currentUser()?.email`, with the avatar's "JD" initials replaced by the first two characters of the email (uppercased) via a small pure helper alongside the existing `formatDueDate` utility. The logout icon gets `(click)="authService.logout()"`.

## Risks / Trade-offs

- **[This is not real security]** — passwords, hashes, and sessions are all plaintext-readable and writable via the browser's own devtools (`localStorage` is not encrypted or access-controlled beyond same-origin). Anyone using the same browser profile can log in as any account by editing `auth_session` directly, or read every account's hash. → Mitigation: none possible within a no-backend architecture; this must never be used for real user data, and the app should not claim otherwise anywhere in its UI or docs (per proposal.md).
- **[Unsalted SHA-256 is trivially reversible via rainbow tables for common passwords]** → Mitigation: irrelevant to the actual threat model here (see above — the attacker already has the plaintext-equivalent access), so not worth the complexity of adding a salt column; called out explicitly so it's never mistaken for adequate protection if this code is ever reused elsewhere.
- **[Breaking change: existing global `tasks_data` becomes orphaned]** → Mitigation: none provided (see Migration Plan) — acceptable because this is a local/demo app with no real users yet, per proposal.md.
- **[`effect()`-driven task reload on user switch must not fight `TaskService`'s own writes]** — logging out immediately after a create, before that create's `persist()` call resolves, could theoretically race. Since both `persist()` and the reload are synchronous (no real async I/O — `localStorage` is synchronous), there is no actual race window in practice, but this is worth a comment in the code so a future change (e.g. swapping in `IndexedDB`) doesn't introduce one silently.

## Migration Plan

No migration. The existing `tasks_data` global key is left in place but unread and unwritten by the app after this change ships — an inert, harmless orphaned entry, not deleted (deleting a key the app no longer owns isn't necessary and risks surprising anyone else inspecting that browser's storage). Any tasks created before this change simply won't appear again once a user logs in, since they weren't associated with any account. This is called out plainly in proposal.md as a **BREAKING** change rather than silently dropped.

Rollback: reverting this change restores the previous global-`tasks_data` behavior as-is (that key was never touched), so rollback is a plain code revert with no data-repair step needed.
