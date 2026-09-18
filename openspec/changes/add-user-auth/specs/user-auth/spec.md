## Purpose

Lets more than one person use the Task Manager on the same device, each with their own account and their own private task list, gated behind a login screen.

## ADDED Requirements

### Requirement: Register a New Account
The system SHALL allow a visitor to create an account by supplying an email address, a password, and a matching password confirmation. The system SHALL reject submission when the email or password is empty, or when the password and confirmation do not match.

#### Scenario: Successful registration
- **WHEN** a visitor submits the registration form with a non-empty email, a password meeting the minimum length, and a matching confirmation
- **THEN** a new account is created, the visitor is logged in as that account, and the Task Manager is shown with an empty task list

#### Scenario: Password confirmation does not match
- **WHEN** a visitor submits the registration form with a password and confirmation that differ
- **THEN** the system SHALL display a validation error, SHALL NOT create the account, and SHALL keep the form open

### Requirement: Reject Duplicate Email Registration
The system SHALL reject registration when the supplied email address already belongs to an existing account.

#### Scenario: Registering an email already in use
- **WHEN** a visitor submits the registration form with an email address that already has an account
- **THEN** the system SHALL display an error indicating the email is already registered and SHALL NOT create a second account

### Requirement: Enforce Minimum Password Length
The system SHALL require a password of at least 8 characters when registering.

#### Scenario: Password too short
- **WHEN** a visitor submits the registration form with a password shorter than 8 characters
- **THEN** the system SHALL display a validation error and SHALL NOT create the account

### Requirement: Log In With Valid Credentials
The system SHALL allow a visitor to log in by supplying the email and password of an existing account.

#### Scenario: Successful login
- **WHEN** a visitor submits the login form with the email and correct password of an existing account
- **THEN** the visitor is logged in as that account and the Task Manager is shown with that account's tasks

### Requirement: Reject Invalid Login Credentials
The system SHALL reject login when the email does not match a registered account or the password does not match that account's password.

#### Scenario: Unknown email
- **WHEN** a visitor submits the login form with an email that has no matching account
- **THEN** the system SHALL display an error and SHALL NOT log the visitor in

#### Scenario: Wrong password
- **WHEN** a visitor submits the login form with a registered email and an incorrect password
- **THEN** the system SHALL display an error and SHALL NOT log the visitor in, without revealing whether the email or the password was the mismatch

### Requirement: Log Out
The system SHALL allow a logged-in user to log out, ending their session and returning to the login screen.

#### Scenario: Logging out
- **WHEN** a logged-in user selects the logout action
- **THEN** the session ends, the Task Manager is no longer shown, and the login screen is shown in its place

### Requirement: Session Persists Across Reload
The system SHALL keep a user logged in across a page reload until they explicitly log out.

#### Scenario: Reload while logged in
- **WHEN** a logged-in user reloads the application
- **THEN** the user remains logged in as the same account and the Task Manager is shown, without requiring them to log in again

#### Scenario: Reload while logged out
- **WHEN** no one is logged in and the application is reloaded
- **THEN** the login screen is shown

### Requirement: Task Manager Requires Authentication
The system SHALL show only the login and registration screens to a visitor who is not logged in, and SHALL NOT display any task data or task management controls until a user is authenticated.

#### Scenario: Visiting while logged out
- **WHEN** a visitor with no active session opens the application
- **THEN** the system SHALL show the login screen (with a way to reach registration) and SHALL NOT show the task list, task form, or any existing task data

### Requirement: Per-User Task Data Isolation
The system SHALL keep each account's tasks separate from every other account's tasks, so that a user only ever sees and modifies their own tasks.

#### Scenario: Two accounts have separate task lists
- **WHEN** one account creates tasks, then logs out, and a second account logs in
- **THEN** the second account's task list SHALL NOT include any tasks created by the first account

#### Scenario: Switching accounts on the same device
- **WHEN** a user logs out and a different user logs in on the same device
- **THEN** the task list shown SHALL update to the newly logged-in user's own tasks
