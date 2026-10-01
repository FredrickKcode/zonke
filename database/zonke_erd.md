# Zonke Database ERD

This documentnation is for our databse [`zonke_database (1).sql`](zonke_database%20(1).sql). We shows the main relationships and how the API writes and reads data.

The schema we use utlises MySQL 8.0.16 . The initializer executes a schema file that drops and recreates its tables, so use it only when setting up or intentionally resetting a development database and erases existing records.

## Marketplace Data

```mermaid
erDiagram
    USERS {
        int user_id PK
        string email UK
        string role
        string password_hash
    }
    CLIENTS {
        int client_id PK
        int user_id FK
        string company_name
    }
    RECRUITERS {
        int recruiter_id PK
        int user_id FK
        string agency_name
    }
    FREELANCERS {
        int freelancer_id PK
        int user_id FK
        int category_id FK
        string title
        decimal hourly_rate
    }
    CATEGORIES {
        int category_id PK
        string slug UK
        string name
    }
    JOBS {
        int job_id PK
        int client_id FK
        int recruiter_id FK
        int category_id FK
        string title
        decimal budget_min
        decimal budget_max
    }
    PROPOSALS {
        int proposal_id PK
        int job_id FK
        int freelancer_id FK
        decimal proposed_amount
        string status
    }
    PROJECTS {
        int project_id PK
        int job_id FK
        int proposal_id FK
        int client_id FK
        int freelancer_id FK
        decimal agreed_amount
    }
    PAYMENTS {
        int payment_id PK
        int project_id FK
        int payer_id FK
        decimal amount
        string status
    }

    USERS ||--o| CLIENTS : "has client profile"
    USERS ||--o| RECRUITERS : "has recruiter profile"
    USERS ||--o| FREELANCERS : "has freelancer profile"
    CATEGORIES o|--o{ FREELANCERS : "categorizes"
    CATEGORIES o|--o{ JOBS : "categorizes"
    CLIENTS ||--o{ JOBS : "posts"
    RECRUITERS ||--o{ JOBS : "posts"
    JOBS ||--o{ PROPOSALS : "receives"
    FREELANCERS ||--o{ PROPOSALS : "submits"
    JOBS ||--o| PROJECTS : "may become"
    PROPOSALS ||--o| PROJECTS : "may create"
    CLIENTS ||--o{ PROJECTS : "owns"
    FREELANCERS ||--o{ PROJECTS : "works on"
    PROJECTS ||--o{ PAYMENTS : "has payment records"
    USERS ||--o{ PAYMENTS : "pays"
```

A user has one account role and may have a matching client, recruiter, or freelancer profile. A client or recruiter posts a job; a freelancer can submit a proposal. A job and accepted proposal can be represented by a project. Payments refer to a project and the user who requested the payment.

## Other Activity

```mermaid
erDiagram
    USERS {
        int user_id PK
    }
    FREELANCERS {
        int freelancer_id PK
        int user_id FK
    }
    BOUNTIES {
        int bounty_id PK
        int category_id FK
        string title
        decimal reward
    }
    BOUNTY_SUBMISSIONS {
        int submission_id PK
        int bounty_id FK
        int user_id FK
        string solution_url
    }
    HIRE_REQUESTS {
        int request_id PK
        int requester_id FK
        int freelancer_id FK
        string status
    }
    MESSAGES {
        int message_id PK
        int sender_id FK
        int recipient_id FK
        string body
    }
    CATEGORIES {
        int category_id PK
    }
    CONTACT_MESSAGES {
        int contact_id PK
        string email
        string subject
    }

    CATEGORIES o|--o{ BOUNTIES : "categorizes"
    BOUNTIES ||--o{ BOUNTY_SUBMISSIONS : "receives"
    USERS ||--o{ BOUNTY_SUBMISSIONS : "submits"
    USERS ||--o{ HIRE_REQUESTS : "requests"
    FREELANCERS ||--o{ HIRE_REQUESTS : "receives"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ MESSAGES : "receives"
```

`CONTACT_MESSAGES` stores the user's name and email directly, so it does not require an account. Other supporting tables connect skills to freelancer profiles and jobs, record job attachments, recruiter shortlists, reviews, and blog posts.

## How Data Moves

1. The browser sends form data as JSON to the Express API.
2. Public reads, such as open jobs and freelancer profiles, use API `GET` routes. The API reads the database views `v_open_jobs` and `v_freelancer_profiles` to return display-ready data.
3. Write routes validate the request. Routes for private actions also check the JWT and the user's role.
4. The API runs parameterized SQL statements. MySQL keys and constraints keep related records connected and reject invalid relationships.
5. After a successful write, the API returns a success response and the page can reload the saved data from the API. The database, not browser `localStorage`, is the persistent source of truth.

## Connected API Actions

| User action | API route | Database records |
| --- | --- | --- |
| Register or log in | `POST /api/register`, `POST /api/login` | `users` plus the role profile; passwords are stored as salted `scrypt` hashes |
| Post a job | `POST /api/jobs` | `jobs` |
| Update freelancer profile | `PUT /api/freelancer/profile` | `freelancers`, `skills`, `freelancer_skills` |
| Apply to a job | `POST /api/proposals` | `proposals` |
| Request to hire | `POST /api/hire-requests` | `hire_requests` |
| Send a message | `POST /api/messages` | `messages` |
| Submit a bounty solution | `POST /api/bounty-submissions` | `bounty_submissions` |
| Request a payment | `POST /api/payments` | `payments` with `pending` status |
| Contact the team | `POST /api/contact` | `contact_messages` |


## Security in the API

- **Passwords:** registration stores salted `scrypt` hashes. Login verifies hashes with a timing-safe comparison; seed accounts with placeholder hashes cannot log in.
- **Authentication:** login and registration return a signed JWT that expires after 8 hours. Private write routes require a valid bearer token.
- **Role checks:** job posting is limited to clients and recruiters; proposals and bounty submissions to freelancers; profile updates to freelancers; payments to clients.
- **Request handling:** SQL values use placeholders, JSON request bodies are limited to 1 MB, and `/api` is rate-limited to 200 requests per 15 minutes.
- **Browser/API protections:** Helmet sets security headers, and CORS allows the local frontend origins used for development.
- **Database protections:** foreign keys, unique keys, and checks protect relationships and values such as payment amount and status.

For deployment, replace the development `JWT_SECRET` with a strong private value, serve the app over HTTPS, and set CORS to the real frontend domain. Payments are not processed by a provider yet; keep card numbers and CVVs out of the app and database.

## Components and Setup

| Component | Purpose | Locked version or requirement |
| --- | --- | --- |
| MySQL Server | Stores the Zonke schema and records | 8.0.16+ |
| Node.js and npm | Runs the API and installs its packages | Node.js 18+ |
| Express | HTTP API | 5.2.1 |
| `mysql2` | Promise-based MySQL connection pool | 3.24.4 |
| `dotenv` | Loads database and JWT settings from `.env` | 16.6.1 |
| `cors` | Allows the local frontend to call the API | 2.8.6 |
| `helmet` | Sets HTTP security headers | 8.3.0 |
| `express-rate-limit` | Limits API request frequency | 8.7.0 |
| `jsonwebtoken` | Creates and verifies login tokens | 9.0.3 |
| Node.js `crypto` | Generates salts and `scrypt` password hashes | Built into Node.js |

The SQL schema is the source of truth. `init-zonke-db.js` loads `.env` and executes that schema; `connection.js` creates the API's MySQL connection pool. The database initializer and connection check are project scripts.

For a local setup, from the `database` directory:

```sh
npm install
npm run db:init
npm run check:db
npm start
```

Serve the frontend over HTTP at `http://localhost:8080`; its API requests use `http://localhost:3001`. Run `npm run db:init` only to reset the database because it recreates the tables and seed data.
