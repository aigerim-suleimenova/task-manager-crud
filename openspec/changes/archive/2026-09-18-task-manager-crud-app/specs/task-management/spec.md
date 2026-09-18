## Purpose

Lets a user track work items end-to-end — creating, viewing, editing, and deleting tasks — with every change durably saved in the browser so the task list survives a page reload.

## ADDED Requirements

### Requirement: Create Task
The system SHALL allow a user to create a new task by supplying a title (required), an optional description, a status, a priority, and an optional due date. The system SHALL reject submission when the title is empty or blank.

#### Scenario: Successful creation
- **WHEN** the user opens the task form, enters a non-empty title, and submits
- **THEN** a new task is added to the task list with a unique identifier and the values entered, and the form closes

#### Scenario: Missing required title
- **WHEN** the user submits the task form with an empty or whitespace-only title
- **THEN** the system SHALL display a validation error, SHALL NOT create the task, and SHALL keep the form open

#### Scenario: Default status and priority
- **WHEN** the user opens the task form to create a task and does not change the status or priority fields
- **THEN** the form SHALL present a valid default status and priority so the task can be created without the user having to pick a value

### Requirement: View Task List
The system SHALL display all tasks with their title, status, priority, and due date, and SHALL visually distinguish status and priority using color-coded badges.

#### Scenario: List reflects current tasks
- **WHEN** the user views the task list
- **THEN** every task currently stored SHALL appear with its title, a status badge, a priority badge, and its due date (if set)

#### Scenario: Empty task list
- **WHEN** no tasks exist
- **THEN** the system SHALL display the list in an empty state without error

### Requirement: Edit Task
The system SHALL allow a user to edit an existing task's title, description, status, priority, and due date, pre-populating the form with that task's current values.

#### Scenario: Successful edit
- **WHEN** the user selects "Edit" on a task, changes one or more fields, and submits
- **THEN** the task's stored values are updated to match the submitted values and the task list reflects the change

#### Scenario: Edit form pre-population
- **WHEN** the user selects "Edit" on a task
- **THEN** the form SHALL open pre-filled with that task's current title, description, status, priority, and due date

#### Scenario: Edit rejects empty title
- **WHEN** the user clears the title field while editing a task and submits
- **THEN** the system SHALL display a validation error and SHALL NOT save the change

### Requirement: Delete Task Requires Confirmation
The system SHALL require explicit user confirmation before permanently removing a task, and SHALL NOT delete the task if the user cancels.

#### Scenario: Confirmed deletion
- **WHEN** the user selects "Delete" on a task and confirms the deletion in the confirmation dialog
- **THEN** the task SHALL be permanently removed from the task list and from storage

#### Scenario: Cancelled deletion
- **WHEN** the user selects "Delete" on a task and then cancels (or dismisses) the confirmation dialog
- **THEN** the task SHALL remain unchanged in the task list

### Requirement: Task Data Persistence
The system SHALL persist the full set of tasks to browser local storage after every create, update, or delete operation, and SHALL load previously saved tasks when the application starts.

#### Scenario: Persistence across reload
- **WHEN** the user creates, edits, or deletes a task and then reloads the application
- **THEN** the task list SHALL reflect the same tasks and values as immediately before the reload

#### Scenario: First run with no stored data
- **WHEN** the application starts and no tasks have previously been saved
- **THEN** the system SHALL initialize with an empty task list rather than erroring
