## Why

Right now the Task Manager has no concept of a user: anyone who opens it sees and edits one shared task list, and the sidebar's user block ("Jane Doe") is static placeholder content. To make the app usable by more than one person on the same device — each with their own private task list — it needs lightweight accounts.

## What Changes

- Add a registration screen: email + password + confirm password, rejecting duplicate emails and enforcing a minimum password length.
- Add a login screen: email + password checked against stored accounts, with a clear error on mismatch.
- Wire up the sidebar's existing (currently decorative) logout icon to actually log the user out.
- Add session persistence: the logged-in user stays logged in across a page reload, until they log out, following the same "persist to localStorage, reload on init" pattern already used for tasks.
- Gate the whole Task Manager UI behind authentication: logged-out visitors see login/register screens instead of the task list. No Angular Router is introduced — gating is done the same way existing modal state is (a signal in `AppComponent`), consistent with the app's current single-view architecture.
- Replace the sidebar's static "Jane Doe" / `jane@acme.com` placeholder with the actual logged-in user's info.
- **BREAKING**: task data currently stored under the single global `tasks_data` localStorage key is not migrated. Once this change ships, tasks are stored per-user under a new key scheme; any tasks created before this change (under the old global key) will no longer appear once a user logs in. Given this is a local/demo app with no production users, no migration path is provided — this is called out here rather than silently dropping data unannounced.
- This is explicitly **not real security**: accounts, password material, and sessions all live in browser `localStorage`, which anyone with devtools access to that same browser can read or tamper with. This is appropriate only for a local/demo app, never for real user data. No backend or third-party auth service is introduced.

## Capabilities

### New Capabilities
- `user-auth`: Registration, login, logout, session persistence across reload, and per-user isolation of task data — all implemented client-side against `localStorage`, with no backend.

### Modified Capabilities
- `task-management`: "View Task List" and "Task Data Persistence" currently describe a single global task list ("all tasks currently stored", "the full set of tasks"). Both are scoped to mean the current logged-in user's tasks, since multiple users' data can now coexist on one device.

## Impact

- New `AuthService` (localStorage-backed: an accounts list and a current-session pointer), `LoginComponent`, and `RegisterComponent`.
- `TaskService` changes its storage key from the single global `tasks_data` to a per-user key, and must reload its task list when the active user changes (login/logout/switch account).
- `AppComponent` changes to gate its existing Task Manager UI behind an authenticated-session check, and to render the real logged-in user's name/email in the sidebar instead of the static placeholder.
- No new external dependencies; no backend; no routing added.
