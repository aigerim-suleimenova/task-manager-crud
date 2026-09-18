# Task Manager

A CRUD task manager built with Angular (standalone components, Signals, Reactive Forms) and Bootstrap 5, persisted entirely to `localStorage` — no backend.

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

## Running tests

```bash
ng test                                 # unit/component tests (Vitest)
npx tsc --noEmit -p tsconfig.app.json   # type-check
ng build                                 # production build
npm run e2e                             # end-to-end tests (Playwright, run once: npx playwright install --with-deps chromium)
```

CI (`.github/workflows/ci.yml`) runs all four on every push/PR: type-check, unit tests, and build in one job, e2e in a separate job.
