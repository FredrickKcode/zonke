
Zonke Marketplace - WIL Software Development Project
# Zonke Marketplace

## About the Project

Zonke is being redeveloped from scratch as a marketplace where clients can find service providers, request services, communicate, complete work and handle payments.

This is a **WIL Software Development Project at Tobb Technologies**.

**One project. One application. One GitHub repository. Five teams.**

---

## Project Oversight

**F.S. Kato - WIL Facilitator & Project Manager**

Responsible for the overall WIL programme and project oversight, including:

* Coordinating the five teams
* Monitoring project progress
* Providing guidance and direction
* Reviewing team work and deliverables
* Ensuring the teams work together as one project
* Supporting students throughout the development process
* Ensuring the project remains aligned with its objectives and workplace standards

---

## Project Goal

The goal is to redevelop Zonke into a working marketplace where:

* Clients can find service providers
* Clients can request services
* Service providers can manage requests
* Users can communicate through the platform
* Work can be completed through the platform
* Payments can be handled appropriately
* Users can create and manage accounts
* Authentication and authorisation are supported
* Cardano is integrated where it provides a clear purpose
* The system is tested for functionality and security

---

## Team Structure

| Team       | Responsibility                            |
| ---------- | ----------------------------------------- |
| **Team 1** | Requirements, Marketplace Flow & Planning |
| **Team 2** | UI/UX Design                              |
| **Team 3** | Frontend Development                      |
| **Team 4** | Backend, Database & Cardano               |
| **Team 5** | Testing & Security                        |

---

# How the Teams Work Together

The five teams are **not five separate projects**.

They are five parts of **one Zonke application**.

### Development Flow

**Team 1 — What are we building?**
↓
**Team 2 — What should it look like?**
↓
**Team 3 — Build what the user sees**
↓
**Team 4 — Make it work behind the scenes**
↓
**Team 5 — Test it**
↓
**Fix problems**
↓
**Retest**
↓
**DONE**

---

# Team 1 — Requirements, Marketplace Flow & Planning

### Main responsibility

Define what Zonke needs to do.

### Team 1 works on:

* Client journey
* Service provider journey
* Requirements
* Required features
* Required screens
* User stories
* Acceptance criteria
* Open questions and decisions
* GitHub Issues

### Example

**Client**

→ Login

→ Search for service

→ Select service provider

→ Request service

→ Communicate

→ Complete work

→ Payment

### Team 1 output

The other teams should be able to look at Team 1's work and understand **what needs to be built**.

---

# Team 2 — UI/UX Design

### Main responsibility

Design how Zonke looks and how users move through the application.

### Team 2 works on:

* Wireframes
* Figma designs
* Screen layouts
* Navigation
* Forms
* Buttons and interactions
* Responsive layouts
* Clickable prototype

### Team 2 works from:

**Team 1 requirements → Team 2 designs**

---

# Team 3 — Frontend Development

### Main responsibility

Build what the user sees and interacts with.

### Team 3 works on:

* Frontend application
* Pages
* Components
* Navigation
* Forms
* Buttons
* User interactions
* Responsive interface
* Connecting the frontend to backend APIs

### Team 3 works from:

**Team 1 requirements + Team 2 designs**

---

# Team 4 — Backend, Database & Cardano

### Main responsibility

Build what happens behind the scenes.

### Team 4 works on:

* Backend application
* APIs
* Database
* User authentication
* Authorisation
* Business logic
* Data validation
* Security controls
* Cardano integration

Cardano should only be used where it provides a clear purpose within the application.

### Security

Never store or commit:

* Wallet seed phrases
* Private keys
* Passwords in plain text
* API keys
* Other sensitive secrets

Use development/test environments and test funds for blockchain-related development.

---

# Team 5 — Testing & Security

### Main responsibility

Check that Zonke works correctly and safely.

### Team 5 works on:

* Test cases
* Functional testing
* Test results
* Bug reports
* Evidence/screenshots
* Retesting
* Regression testing
* Basic security checks
* Permission/access checks
* Input validation checks

### Testing Flow

**Feature built**

↓

**Test**

↓

**Bug found?**

↓

**Report bug**

↓

**Developer fixes it**

↓

**Retest**

↓

**Done**

---

# GitHub Workflow

All teams use the same GitHub repository.

### Standard workflow

**GitHub Issue**

↓

**Create branch**

↓

**Do the work**

↓

**Commit**

↓

**Push**

↓

**Pull Request**

↓

**Review**

↓

**Merge**

↓

**Test**

---

# Project Board

The project board is used to track the work.

### Statuses

**BACKLOG → TODO → IN PROGRESS → REVIEW → TESTING → DONE**

### What they mean

| Status          | Meaning                                  |
| --------------- | ---------------------------------------- |
| **BACKLOG**     | Work identified but not ready to start   |
| **TODO**        | Ready to be worked on                    |
| **IN PROGRESS** | Someone is currently working on it       |
| **REVIEW**      | Work has been completed and needs review |
| **TESTING**     | Feature is being tested                  |
| **DONE**        | Completed and tested                     |

---

# Repository Structure

```text
zonke/
│
├── frontend/
├── backend/
├── database/
├── tests/
├── docs/
│
├── README.md
└── .gitignore
```

### Folders

**frontend/**
Everything the user sees and interacts with.

**backend/**
Behind-the-scenes application logic and APIs.

**database/**
Database structure and related work.

**tests/**
Testing scripts, results and evidence.

**docs/**
Requirements, designs, technical notes and project documentation.

---

# Example: Building a Service Request

A feature moves through all teams.

### Team 1

Defines:

> A client must be able to request a service.

↓

### Team 2

Designs:

> Request Service screen and confirmation screen.

↓

### Team 3

Builds:

> The screens, forms and user interactions.

↓

### Team 4

Builds:

> API, database and request-processing logic.

↓

### Team 5

Tests:

> Can the client successfully submit a service request?

↓

### Problem found

↓

**Developer fixes it**

↓

**Team 5 retests**

↓

**DONE**

---

# First Development Target

The project should move into development immediately.

By the end of the first week, the teams should have:

* Initial requirements
* Initial UI designs
* Frontend project running
* Backend project running
* Database connected
* Initial APIs
* Initial test cases
* GitHub workflow working

The goal is to have a **real working foundation**, not only documentation.

---

# Definition of Done

A feature is not finished simply because the code has been written.

A feature is considered done when:

**Requirement defined**

↓

**Design completed**

↓

**Frontend built**

↓

**Backend/database connected**

↓

**Feature tested**

↓

**Bugs fixed**

↓

**Retested**

↓

**Merged**

↓

**DONE**

---

# GitHub Rules

1. `main` is the stable version.
2. Do not work directly on `main`.
3. Use branches for development.
4. Make meaningful commits.
5. Create Pull Requests before merging.
6. Review changes before merging.
7. Test changes after development.
8. Keep work connected to GitHub Issues.
9. Do not commit passwords, API keys, private keys or seed phrases.
10. Use development/test environments for Cardano work.

---

# Project Principle

## One Project. One Application. One Repository.

The success of Zonke depends on the teams working together.

**Requirements → Design → Development → Testing → Fix → Retest → Done**

Everyone contributes to the same application and every team is responsible for delivering their part of the project.
