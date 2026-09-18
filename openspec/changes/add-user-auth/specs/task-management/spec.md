## MODIFIED Requirements

### Requirement: View Task List
The system SHALL display the current logged-in user's tasks with their title, status, priority, and due date, and SHALL visually distinguish status and priority using color-coded badges.

#### Scenario: List reflects current tasks
- **WHEN** the user views the task list
- **THEN** every task currently stored for that user SHALL appear with its title, a status badge, a priority badge, and its due date (if set)

#### Scenario: Empty task list
- **WHEN** the current user has no tasks
- **THEN** the system SHALL display the list in an empty state without error

### Requirement: Task Data Persistence
The system SHALL persist the current logged-in user's tasks to browser local storage after every create, update, or delete operation, and SHALL load that user's previously saved tasks when they log in or the application starts with an active session.

#### Scenario: Persistence across reload
- **WHEN** the user creates, edits, or deletes a task and then reloads the application
- **THEN** the task list SHALL reflect the same tasks and values as immediately before the reload

#### Scenario: First run with no stored data
- **WHEN** a user has never saved any tasks
- **THEN** the system SHALL initialize their task list as empty rather than erroring
