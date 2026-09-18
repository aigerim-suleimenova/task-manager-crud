## 1. Account Model & AuthService

- [x] 1.1 Add `src/app/models/user-account.model.ts` with the `UserAccount` interface (`id`, `email`, `passwordHash`) per design.md and verify it compiles
- [x] 1.2 Add `src/app/shared/password-hash.ts` with an async `hashPassword(password: string): Promise<string>` using `crypto.subtle.digest('SHA-256', ...)` returning a hex string, and verify via a unit test that the same input always hashes to the same output and different inputs hash differently
- [x] 1.3 Add `src/app/services/auth.service.ts` (`providedIn: 'root'`) with private `accounts`/`sessionUserId` signals loaded from `localStorage` (`auth_accounts`, `auth_session`) via the same guarded-JSON.parse pattern as `TaskService`, and public `currentUser`/`isAuthenticated` computed signals, and verify via a unit test that a corrupt/missing stored value yields no accounts and no session instead of throwing
- [x] 1.4 Implement `AuthService.register(email, password, confirmPassword)` (trims/lowercases email, hashes the password, creates and persists a new `UserAccount`, sets the session, returns `{ ok: true }`) and verify via a unit test that registering logs the new account in and persists both `auth_accounts` and `auth_session`
- [x] 1.5 Implement registration's validation failures — empty email/password, mismatched confirmation, password under 8 characters, duplicate email (case-insensitive) — each returning `{ ok: false; message }` without creating an account or changing the session, and verify each case via a unit test
- [x] 1.6 Implement `AuthService.login(email, password)` (hashes the supplied password and compares to the stored hash) returning `{ ok: true }` and setting the session on match, or `{ ok: false; message }` on unknown email or wrong password without revealing which, and verify both success and each failure case via unit tests
- [x] 1.7 Implement `AuthService.logout()` clearing the session and persisting, and verify via a unit test that `isAuthenticated()` becomes false and `auth_session` no longer names a user afterward

## 2. Per-User Task Storage

- [x] 2.1 Change `TaskService`'s storage key from the fixed `tasks_data` to `tasks_data_<userId>` computed from an injected `AuthService.currentUser()`, and verify via a unit test that two different logged-in users' tasks are read from and written to different `localStorage` keys
- [x] 2.2 Add an `effect()` in `TaskService`'s constructor that reloads the task signal whenever the current user id changes (including to/from no user, resetting to `[]` when logged out), and verify via a unit test that creating a task as user A, then switching the active session to user B, shows an empty (or B's own) list, and switching back shows A's task unchanged
- [x] 2.3 Make `create`/`update`/`delete` no-op with a `console.warn` when there is no active user, and verify via a unit test that calling them while logged out does not throw and does not write to `localStorage`

## 3. Login & Registration Screens

- [x] 3.1 Build `LoginComponent` (`ReactiveFormsModule`, injects `AuthService` directly) with email/password fields, required validation, and a `switchToRegister` output, styled as a centered Bootstrap card matching the existing brand green/form conventions from `TaskFormComponent`, and verify via a component test that submitting valid credentials for an existing account results in `authService.isAuthenticated()` becoming true
- [x] 3.2 Display an inline error message on failed login (unknown email or wrong password) without clearing the entered email, and verify via a component test that a wrong password shows an error and leaves `isAuthenticated()` false
- [x] 3.3 Build `RegisterComponent` (mirroring `LoginComponent`'s structure) with email/password/confirm-password fields and a `switchToLogin` output, and verify via a component test that valid input creates an account and logs the user in
- [x] 3.4 Display inline errors for each registration failure case (mismatched confirmation, short password, duplicate email) without creating an account, and verify each via a component test
- [x] 3.5 Wire `switchToLogin`/`switchToRegister` in `AppComponent` via an `authView` signal (`'login' | 'register'`), defaulting to `'login'`, and verify via a component test that triggering the output on one screen shows the other

## 4. Gating the App Behind Authentication

- [x] 4.1 In `AppComponent`, wrap the existing sidebar/header/task-list/modals template in `@if (authService.isAuthenticated())`, with `@else` rendering `<app-login>`/`<app-register>` per `authView()`, and verify via a component test that a logged-out `AppComponent` renders no task list, task form trigger, or task data, only the auth screens
- [x] 4.2 Verify via a component test that logging in (through the real login form) reveals the task list and header, and that the previously-static sidebar user block now shows the logged-in account's email
- [x] 4.3 Wire the sidebar's logout icon to `authService.logout()`, and verify via a component test that clicking it returns to the login screen and hides task data
- [x] 4.4 Replace the sidebar's hardcoded "Jane Doe" / `jane@acme.com` and "JD" avatar initials with the current user's email and an initials helper (first two characters of the email, uppercased) in `src/app/shared/`, and verify via a unit test that the helper produces the expected initials for a few sample emails

## 5. Session Persistence

- [x] 5.1 Write a test that logs in, then re-creates `AuthService`/`AppComponent` against the same `localStorage` (simulating a reload), and verifies the user is still authenticated as the same account without logging in again
- [x] 5.2 Write a test that, with no stored session, re-creates `AppComponent` against `localStorage` and verifies the login screen is shown

## 6. Final Verification

- [x] 6.1 Run the full test suite and `ng build` and verify both succeed with no errors
- [x] 6.2 Manually drive the app (register a new account, create a task, log out, log back in, confirm the task is still there, register a second account, confirm its task list starts empty and does not show the first account's task) and verify each step behaves as specified
