# Task Manager

**Live demo:** https://aigerim-suleimenova.github.io/task-manager-crud/

A CRUD task manager built with Angular (standalone components, Signals, Reactive Forms) and Bootstrap 5, persisted entirely to `localStorage` — no backend.

> **Note to the reviewer:** For this CRUD task, I chose Angular and TypeScript and focused on building a clean, maintainable, component-based application. Beyond the core CRUD requirements, I implemented login and authorization to go above and beyond, and to demonstrate that I can deliver quickly and learn fast.

## Getting started

This project requires Node **v22.22.3+**, **v24.15.0+**, or **v26+** (Angular CLI 22's minimum). A `.nvmrc` is included:

```bash
nvm use
npm install
npm run dev   # or: ng serve
```

Then open `http://localhost:4200`.

## First run: you'll land on a login screen

The app includes account registration and per-user task lists — this goes beyond the base assignment, added to demonstrate a more complete app (auth state, gated routes via signals, per-user data isolation) rather than just the CRUD screen in isolation.

**To try it:** click **Register**. Any email works, no verification step; password just needs to be 8+ characters. You'll be logged in immediately and land on the task list.

This auth is intentionally **client-side only** — accounts and password hashes live in `localStorage`, the same as the tasks. It's a demo of the auth *flow* (registration, login, session persistence, logout, per-user data), not a real security boundary: anyone with devtools access to that browser profile can read or edit the stored data. There's no backend, by design, matching the assignment's "no backend required" constraint.

## Core features (the assignment requirements)

- **Create** — Title (required), Description (optional), Status (To Do / In Progress / Done), Priority (Low / Medium / High, radio buttons), Due date (date picker)
- **Read** — task list with color-coded Status/Priority badges, search, filter, and sort
- **Update** — edit any field of an existing task via the same form, pre-filled
- **Delete** — confirmation step before removal
- **Persistence** — every create/edit/delete survives a page refresh, via `localStorage`

## Beyond the requirements

- Account registration/login/logout, with each user's tasks stored separately
- Search, filter (by status/priority), and sort (by title/due date/priority/status)
- Responsive layout down to mobile width
- Full unit/component test suite (Vitest via `ng test`) covering both services and every component
- End-to-end tests (Playwright) driving a real browser against a production build

## Architecture & decisions

**Stack:** Angular 22 (standalone components, no NgModules), Signals for state, Reactive Forms, Bootstrap 5 for layout/styling, TypeScript, Vitest for unit/component tests, Playwright for e2e. RxJS is a transitive Angular dependency but isn't used for app state — Signals cover it.

- **No Angular Router.** The app has exactly two screens (auth, task list) plus modals, so `AppComponent` gates what renders with a signal-backed discriminated union (`ModalState`, `AuthView`) instead of route config. This also sidesteps the usual GitHub Pages SPA-routing workaround (404.html redirect trick / hash routing) — see the comment in `deploy-pages.yml`. If the app grew more top-level views, this would be the first thing to swap for the Router.
- **Signals over NgRx/a state library.** `AuthService` and `TaskService` (`src/app/core/services/`) hold state in signals and expose `computed()` derivations (`currentUser`, `isAuthenticated`, `tasks`). At this scale a store adds indirection without paying for itself; the services are the single source of truth and are still easily unit-testable.
- **Feature-based folder structure:** `core/` (services, models — no UI), `features/auth` and `features/tasks` (screen-specific components), `shared/` (reusable UI components and pure helper functions like `date-format.ts`, `user-initials.ts`). Keeps ownership of a concept in one place rather than splitting by file type.
- **Persistence is `localStorage`, namespaced per user.** Tasks are stored under `tasks_data_<userId>`, filter/sort view preferences under `task_view_prefs_<userId>`, accounts/session under fixed keys. `TaskService` re-reads from storage via an `effect()` whenever the logged-in user changes, so switching accounts can't leak one user's tasks into another's view.
- **Auth is deliberately client-side only.** Passwords are SHA-256-hashed (unsalted) before being written to `localStorage` (`shared/password-hash.ts`) purely so a devtools glance doesn't show plaintext — it is explicitly *not* a real security boundary, since anyone with access to read that hash already has access to everything it would protect. This was a scope call: the assignment allows "no backend," and a real auth boundary requires a backend to enforce it.
- **CI/CD is two GitHub Actions workflows:** `ci.yml` runs type-check, unit tests, and build on every push/PR, plus a separate e2e job (Playwright against a real build); `deploy-pages.yml` builds with `--base-href /task-manager-crud/` and publishes to GitHub Pages on push to `main`.

## Running tests

```bash
ng test                                 # unit/component tests (Vitest)
npx tsc --noEmit -p tsconfig.app.json   # type-check
ng build                                 # production build
npm run e2e                             # end-to-end tests (Playwright, run once: npx playwright install --with-deps chromium)
```

CI (`.github/workflows/ci.yml`) runs all four on every push/PR: type-check, unit tests, and build in one job, e2e in a separate job.
