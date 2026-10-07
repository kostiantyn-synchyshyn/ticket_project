# Summary

Your task is to create a lightweight Jira-like ticketing system for creating projects and tracking work. Users can create tickets, assign owners, update ticket status, and view all tickets within a project.

## Tech Stack

Programming Language: C# .NET
Database: Postgres
Docker (use Docker to spin-up database)

## Requirements

- If ANYTHING is unclear, please ask!
- Don't use AI for this project!
- Think about all decisions on your own, make sure you can explain your decisions and why you took them.
- Write unit tests to make sure the system works as expected
- As a hint: Start with the DB design

## User Stories

### US-01 - Users

As an administrator, I want to create a user so that people can be assigned work.

Acceptance Criteria:
A user can be created with name and email address. Email addresses must be unique. The created user appears in the available assignees list.

### US-02 - Projects

As an administrator, I want to create a project so that tickets can be grouped by feature.

Acceptance Criteria:
A project has a name and unique project key (for example, PAY). The project is visible in the projects list.

### US-03 - Tickets

As a user, I want to create a ticket in a project so that work can be tracked.

Acceptance Criteria:
A ticket requires a project and summary. It can optionally include a description. New tickets start in To Do and receive a unique ticket key, such as PAY-123

### US-04 - Assign Tickets

As a user, I want to assign a ticket to a user so that ownership is clear.

Acceptance Criteria:
I can select any existing user as assignee. I can also remove the assignee. The selected assignee is shown when viewing the ticket.

### US-05 - Ticket Status

As a user, I want to change a ticket’s status so that its progress is visible.

Acceptance Criteria:
I can move a ticket between To Do, In Progress, and Done. The new status is displayed immediately in ticket details and lists.

### US-06 - Dashboard

As a user, I want to list all tickets for a project so that I can see the project’s work.

Acceptance Criteria:
From a project, I can see its tickets with ticket key, summary, status, and assignee. Tickets from other projects are not shown. An empty project displays a clear empty state.

### US-07 - Ticket Details

As a user, I want to view a ticket’s details so that I can understand and update its work item.	

Acceptance Criteria:
The detail view shows project, ticket key, summary, description, status, and assignee. From this view, I can change status and assignee.