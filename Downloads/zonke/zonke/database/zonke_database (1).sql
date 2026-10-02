-- =====================================================================
-- ZONKE.ME DATABASE  (MySQL 8.0.16+)
-- Extends the original schema so every frontend feature has a table:
-- jobs (client + recruiter), freelancers, departments, hire requests,
-- shortlists, messages, bounties, payments, reviews, blog, contact form.
-- Run the whole file in one go. It is safe to re-run (drops first).
-- =====================================================================

-- No CREATE DATABASE / USE here: select the database your host gave you
-- (phpMyAdmin: click it first; CLI: mysql -u USER -p DBNAME < zonke_database.sql)


-- ---------------------------------------------------------------------
-- DROP (views first, then tables in reverse dependency order)
-- ---------------------------------------------------------------------
DROP VIEW  IF EXISTS v_open_bounties;
DROP VIEW  IF EXISTS v_open_jobs;
DROP VIEW  IF EXISTS v_freelancer_profiles;
DROP VIEW  IF EXISTS v_proposals_detail;
DROP VIEW  IF EXISTS v_projects_detail;

DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS blog_posts;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bounty_submissions;
DROP TABLE IF EXISTS bounties;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS shortlists;
DROP TABLE IF EXISTS hire_requests;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS proposals;
DROP TABLE IF EXISTS job_attachments;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS freelancer_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS freelancers;
DROP TABLE IF EXISTS recruiters;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- CORE TABLES
-- ---------------------------------------------------------------------
CREATE TABLE users (
    user_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name     VARCHAR(50)  NOT NULL,
    last_name      VARCHAR(50)  NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,          -- store a bcrypt/argon2 hash only
    phone          VARCHAR(20),
    role           VARCHAR(20)  NOT NULL,
    is_active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('client','recruiter','freelancer','admin'))
);

-- Departments used by the frontend (development, design, cybersecurity, marketing)
CREATE TABLE categories (
    category_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug         VARCHAR(50)  NOT NULL UNIQUE,     -- matches data-category in the frontend
    name         VARCHAR(100) NOT NULL
);

CREATE TABLE clients (
    client_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL UNIQUE,
    company_name  VARCHAR(150),
    industry      VARCHAR(100),
    website       VARCHAR(255),
    location      VARCHAR(150),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE recruiters (
    recruiter_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL UNIQUE,
    agency_name   VARCHAR(150),
    website       VARCHAR(255),
    location      VARCHAR(150),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE freelancers (
    freelancer_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NOT NULL UNIQUE,
    category_id    INT UNSIGNED,
    title          VARCHAR(150),
    bio            TEXT,
    hourly_rate    DECIMAL(10,2),
    location       VARCHAR(150),
    portfolio_url  VARCHAR(255),
    availability   VARCHAR(20) NOT NULL DEFAULT 'available',
    CONSTRAINT chk_freelancers_avail CHECK (availability IN ('available','busy','unavailable')),
    FOREIGN KEY (user_id)     REFERENCES users(user_id)           ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id)  ON DELETE SET NULL
);

CREATE TABLE skills (
    skill_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    category_id  INT UNSIGNED,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE freelancer_skills (
    freelancer_id     INT UNSIGNED NOT NULL,
    skill_id          INT UNSIGNED NOT NULL,
    proficiency       VARCHAR(20)  NOT NULL DEFAULT 'intermediate',
    years_experience  INT,
    PRIMARY KEY (freelancer_id, skill_id),
    CONSTRAINT chk_fs_prof CHECK (proficiency IN ('beginner','intermediate','expert')),
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)      REFERENCES skills(skill_id)           ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- JOBS, PROPOSALS, PROJECTS
-- A job is posted by a client OR a recruiter (exactly one of the two
-- ids should be set; the API layer enforces this).
-- ---------------------------------------------------------------------
CREATE TABLE jobs (
    job_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id     INT UNSIGNED,
    recruiter_id  INT UNSIGNED,
    category_id   INT UNSIGNED,
    title         VARCHAR(200) NOT NULL,
    description   TEXT NOT NULL,
    location      VARCHAR(150) NOT NULL DEFAULT 'Remote',
    budget_min    DECIMAL(12,2),
    budget_max    DECIMAL(12,2),
    deadline      DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_jobs_status CHECK (status IN ('open','in_progress','closed','cancelled')),
    CONSTRAINT chk_jobs_budget CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min),
    FOREIGN KEY (client_id)    REFERENCES clients(client_id)       ON DELETE CASCADE,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(recruiter_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id)  REFERENCES categories(category_id)  ON DELETE SET NULL
);

CREATE TABLE job_skills (
    job_id    INT UNSIGNED NOT NULL,
    skill_id  INT UNSIGNED NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id)   REFERENCES jobs(job_id)     ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);

-- "Attach Files" on the Post a Job form (store the path/URL, not the file)
CREATE TABLE job_attachments (
    attachment_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id         INT UNSIGNED NOT NULL,
    file_name      VARCHAR(255) NOT NULL,
    file_path      VARCHAR(500) NOT NULL,
    uploaded_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);

CREATE TABLE proposals (
    proposal_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id           INT UNSIGNED NOT NULL,
    freelancer_id    INT UNSIGNED NOT NULL,
    cover_letter     TEXT NOT NULL,                -- "Why are you a good fit?"
    proposed_amount  DECIMAL(12,2) NOT NULL,
    estimated_days   INT,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, freelancer_id),
    CONSTRAINT chk_proposals_status CHECK (status IN ('pending','accepted','rejected','withdrawn')),
    FOREIGN KEY (job_id)        REFERENCES jobs(job_id)               ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE
);

CREATE TABLE projects (
    project_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id         INT UNSIGNED NOT NULL UNIQUE,
    proposal_id    INT UNSIGNED NOT NULL UNIQUE,
    client_id      INT UNSIGNED NOT NULL,
    freelancer_id  INT UNSIGNED NOT NULL,
    agreed_amount  DECIMAL(12,2) NOT NULL,
    start_date     DATE NOT NULL DEFAULT (CURRENT_DATE),   -- needs MySQL 8.0.13+
    end_date       DATE,
    status         VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT chk_projects_status CHECK (status IN ('active','completed','cancelled')),
    FOREIGN KEY (job_id)        REFERENCES jobs(job_id)               ON DELETE CASCADE,
    FOREIGN KEY (proposal_id)   REFERENCES proposals(proposal_id)     ON DELETE CASCADE,
    FOREIGN KEY (client_id)     REFERENCES clients(client_id)         ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- HIRING, SHORTLISTS, MESSAGES
-- ---------------------------------------------------------------------
-- "Hire Now" on a freelancer profile
CREATE TABLE hire_requests (
    request_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    requester_id     INT UNSIGNED NOT NULL,        -- users.user_id of the client/recruiter
    freelancer_id    INT UNSIGNED NOT NULL,
    project_details  TEXT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hire_status CHECK (status IN ('pending','accepted','declined')),
    FOREIGN KEY (requester_id)  REFERENCES users(user_id)               ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id)   ON DELETE CASCADE
);

-- Recruiter "Shortlist" button
CREATE TABLE shortlists (
    recruiter_id   INT UNSIGNED NOT NULL,
    freelancer_id  INT UNSIGNED NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recruiter_id, freelancer_id),
    FOREIGN KEY (recruiter_id)  REFERENCES recruiters(recruiter_id)   ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE
);

-- "Send Message" on a freelancer profile
CREATE TABLE messages (
    message_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sender_id     INT UNSIGNED NOT NULL,
    recipient_id  INT UNSIGNED NOT NULL,
    body          TEXT NOT NULL,
    is_read       TINYINT(1) NOT NULL DEFAULT 0,
    sent_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id)    REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- BOUNTIES
-- ---------------------------------------------------------------------
CREATE TABLE bounties (
    bounty_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id  INT UNSIGNED,
    title        VARCHAR(200) NOT NULL,
    description  TEXT NOT NULL,
    reward       DECIMAL(12,2) NOT NULL,
    difficulty   VARCHAR(20) NOT NULL DEFAULT 'medium',
    deadline     DATE,
    status       VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bounty_diff   CHECK (difficulty IN ('easy','medium','hard')),
    CONSTRAINT chk_bounty_status CHECK (status IN ('open','closed')),
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE bounty_submissions (
    submission_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bounty_id      INT UNSIGNED NOT NULL,
    user_id        INT UNSIGNED NOT NULL,
    solution_url   VARCHAR(500) NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'submitted',
    submitted_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (bounty_id, user_id),
    CONSTRAINT chk_sub_status CHECK (status IN ('submitted','accepted','rejected')),
    FOREIGN KEY (bounty_id) REFERENCES bounties(bounty_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)   REFERENCES users(user_id)      ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- PAYMENTS AND REVIEWS
-- Never store card numbers or CVVs here. Keep only the method, status and
-- the reference returned by your payment provider.
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    payment_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id     INT UNSIGNED NOT NULL,
    payer_id       INT UNSIGNED NOT NULL,          -- users.user_id
    amount         DECIMAL(12,2) NOT NULL,
    method         VARCHAR(20) NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'pending',
    provider_ref   VARCHAR(100),
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at        TIMESTAMP NULL,
    CONSTRAINT chk_pay_amount CHECK (amount > 0),
    CONSTRAINT chk_pay_method CHECK (method IN ('card','bank_transfer','wallet')),
    CONSTRAINT chk_pay_status CHECK (status IN ('pending','paid','failed','refunded')),
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (payer_id)   REFERENCES users(user_id)       ON DELETE CASCADE
);

CREATE TABLE reviews (
    review_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id    INT UNSIGNED NOT NULL,
    reviewer_id   INT UNSIGNED NOT NULL,
    reviewee_id   INT UNSIGNED NOT NULL,
    rating        TINYINT UNSIGNED NOT NULL,
    comment_text  TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (project_id, reviewer_id),
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (project_id)  REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(user_id)       ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(user_id)       ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- BLOG AND CONTACT FORM
-- ---------------------------------------------------------------------
CREATE TABLE blog_posts (
    post_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    author_id      INT UNSIGNED,
    title          VARCHAR(200) NOT NULL,
    slug           VARCHAR(200) NOT NULL UNIQUE,
    body           TEXT NOT NULL,
    image_url      VARCHAR(255),
    published_at   DATE NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE contact_messages (
    contact_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL,
    subject      VARCHAR(200) NOT NULL,
    message      TEXT NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- INDEXES
-- (primary keys, UNIQUE columns and foreign keys are indexed already)
-- ---------------------------------------------------------------------
CREATE INDEX idx_users_role             ON users(role);
CREATE INDEX idx_jobs_status            ON jobs(status);
CREATE INDEX idx_jobs_category          ON jobs(category_id);
CREATE INDEX idx_freelancers_category   ON freelancers(category_id);
CREATE INDEX idx_proposals_freelancer   ON proposals(freelancer_id);
CREATE INDEX idx_projects_freelancer    ON projects(freelancer_id);
CREATE INDEX idx_freelancer_skills_sk   ON freelancer_skills(skill_id);
CREATE INDEX idx_job_skills_sk          ON job_skills(skill_id);
CREATE INDEX idx_messages_recipient     ON messages(recipient_id, is_read);
CREATE INDEX idx_payments_project       ON payments(project_id);
CREATE INDEX idx_reviews_reviewee       ON reviews(reviewee_id);
CREATE INDEX idx_blog_published         ON blog_posts(published_at);

-- ---------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------
CREATE VIEW v_open_jobs AS
SELECT j.job_id, j.title, j.description, j.location, j.budget_min, j.budget_max,
       j.deadline, j.created_at, cat.slug AS category,
       j.client_id, j.recruiter_id,
       COALESCE(c.company_name, r.agency_name, CONCAT(u.first_name, ' ', u.last_name)) AS poster_name,
       (SELECT GROUP_CONCAT(s.name SEPARATOR ', ')
          FROM job_skills js JOIN skills s ON s.skill_id = js.skill_id
         WHERE js.job_id = j.job_id) AS required_skills,
       (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.job_id) AS proposal_count
  FROM jobs j
  LEFT JOIN categories cat ON cat.category_id = j.category_id
  LEFT JOIN clients    c   ON c.client_id     = j.client_id
  LEFT JOIN recruiters r   ON r.recruiter_id  = j.recruiter_id
  JOIN users u ON u.user_id = COALESCE(c.user_id, r.user_id)
 WHERE j.status = 'open';

CREATE VIEW v_freelancer_profiles AS
SELECT f.freelancer_id, u.user_id, u.first_name, u.last_name, u.email,
       f.title, f.bio, f.hourly_rate, f.location, f.portfolio_url, f.availability,
       cat.slug AS category,
       (SELECT GROUP_CONCAT(s.name SEPARATOR ', ')
          FROM freelancer_skills fs JOIN skills s ON s.skill_id = fs.skill_id
         WHERE fs.freelancer_id = f.freelancer_id) AS skills,
       (SELECT ROUND(AVG(rv.rating), 1) FROM reviews rv WHERE rv.reviewee_id = u.user_id) AS avg_rating,
       (SELECT COUNT(*) FROM projects pr
         WHERE pr.freelancer_id = f.freelancer_id AND pr.status = 'completed') AS projects_completed
  FROM freelancers f
  JOIN users u ON u.user_id = f.user_id
  LEFT JOIN categories cat ON cat.category_id = f.category_id
 WHERE u.is_active = 1;

CREATE VIEW v_proposals_detail AS
SELECT p.proposal_id, p.job_id, j.title AS job_title, p.freelancer_id,
       CONCAT(fu.first_name, ' ', fu.last_name) AS freelancer_name,
       p.proposed_amount, p.estimated_days, p.status, p.submitted_at, p.cover_letter
  FROM proposals p
  JOIN jobs        j  ON j.job_id        = p.job_id
  JOIN freelancers f  ON f.freelancer_id = p.freelancer_id
  JOIN users       fu ON fu.user_id      = f.user_id;

CREATE VIEW v_projects_detail AS
SELECT pr.project_id, pr.job_id, j.title AS job_title,
       pr.client_id,     CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
       pr.freelancer_id, CONCAT(fu.first_name, ' ', fu.last_name) AS freelancer_name,
       pr.agreed_amount, pr.start_date, pr.end_date, pr.status
  FROM projects pr
  JOIN jobs        j  ON j.job_id        = pr.job_id
  JOIN clients     c  ON c.client_id     = pr.client_id
  JOIN users       cu ON cu.user_id      = c.user_id
  JOIN freelancers f  ON f.freelancer_id = pr.freelancer_id
  JOIN users       fu ON fu.user_id      = f.user_id;

CREATE VIEW v_open_bounties AS
SELECT b.bounty_id, b.title, b.description, b.reward, b.difficulty, b.deadline,
       cat.slug AS category,
       (SELECT COUNT(*) FROM bounty_submissions bs WHERE bs.bounty_id = b.bounty_id) AS submission_count
  FROM bounties b
  LEFT JOIN categories cat ON cat.category_id = b.category_id
 WHERE b.status = 'open';

-- ---------------------------------------------------------------------
-- SEED DATA (dummy values only; replace hashes with real bcrypt hashes)
-- ---------------------------------------------------------------------
INSERT INTO categories (slug, name) VALUES
 ('development',   'Development'),   -- 1
 ('design',        'Design'),        -- 2
 ('cybersecurity', 'Cybersecurity'), -- 3
 ('marketing',     'Marketing'),     -- 4
 ('data',          'Data');          -- 5

INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES
 ('Thabo',  'Mokoena', 'thabo@acmebuild.co.za',      'DUMMY_HASH_1', '0821234567', 'client'),      -- 1
 ('Lerato', 'Dlamini', 'lerato@brightretail.co.za',  'DUMMY_HASH_2', '0839876543', 'client'),      -- 2
 ('Sipho',  'Nkosi',   'sipho.dev@example.com',      'DUMMY_HASH_3', '0711112222', 'freelancer'),  -- 3
 ('Naledi', 'Khumalo', 'naledi.design@example.com',  'DUMMY_HASH_4', '0723334444', 'freelancer'),  -- 4
 ('Ayanda', 'Zulu',    'ayanda.data@example.com',    'DUMMY_HASH_5', '0745556666', 'freelancer'),  -- 5
 ('Admin',  'User',    'admin@zonke.co.za',          'DUMMY_HASH_6', NULL,         'admin'),       -- 6
 ('Pieter', 'van Wyk', 'pieter@talentbridge.co.za',  'DUMMY_HASH_7', '0768889999', 'recruiter');   -- 7

INSERT INTO clients (user_id, company_name, industry, website, location) VALUES
 (1, 'Acme Build',    'Construction', 'https://acmebuild.example',   'Johannesburg'),
 (2, 'Bright Retail', 'Retail',       'https://brightretail.example','Cape Town');

INSERT INTO recruiters (user_id, agency_name, website, location) VALUES
 (7, 'TalentBridge', 'https://talentbridge.example', 'Pretoria');

INSERT INTO freelancers (user_id, category_id, title, bio, hourly_rate, location, portfolio_url, availability) VALUES
 (3, 1, 'Full-Stack Developer', 'Builds web apps with Node and SQL.', 350.00, 'Pretoria',     'https://sipho.example',  'available'),
 (4, 2, 'UI/UX Designer',       'Designs clean, usable interfaces.',   300.00, 'Durban',       'https://naledi.example', 'available'),
 (5, 5, 'Data Analyst',         'Dashboards, SQL and reporting.',      280.00, 'Johannesburg', NULL,                     'busy');

INSERT INTO skills (name, category_id) VALUES
 ('JavaScript', 1), ('Node.js', 1), ('SQL', 5), ('HTML/CSS', 1),
 ('Figma', 2), ('UI Design', 2), ('Data Analysis', 5), ('Power BI', 5),
 ('SIEM', 3), ('OWASP', 3), ('SEO', 4), ('Copywriting', 4);

INSERT INTO freelancer_skills (freelancer_id, skill_id, proficiency, years_experience) VALUES
 (1, 1, 'expert', 5), (1, 2, 'expert', 4), (1, 3, 'intermediate', 3), (1, 4, 'expert', 5),
 (2, 5, 'expert', 4), (2, 6, 'expert', 5), (2, 4, 'intermediate', 2),
 (3, 3, 'expert', 6), (3, 7, 'expert', 5), (3, 8, 'intermediate', 3);

INSERT INTO jobs (client_id, recruiter_id, category_id, title, description, location, budget_min, budget_max, deadline, status) VALUES
 (1,    NULL, 1, 'Company website rebuild', 'Modern responsive website for our construction company.', 'Remote',       15000, 25000, '2026-11-30', 'open'),   -- 1
 (1,    NULL, 5, 'Sales dashboard',         'Power BI dashboard for monthly project sales.',           'Johannesburg', 8000,  12000, '2026-10-31', 'closed'), -- 2
 (2,    NULL, 2, 'Online store UI design',  'Design mobile-first UI for our online store.',            'Remote',       10000, 18000, '2026-11-15', 'open'),   -- 3
 (NULL, 1,    3, 'Network Security Audit',  'Audit the network of a mid-size logistics company.',      'Remote',       12000, 12000, '2026-12-05', 'open');   -- 4

INSERT INTO job_skills (job_id, skill_id) VALUES
 (1, 1), (1, 4), (1, 2),
 (2, 7), (2, 8), (2, 3),
 (3, 5), (3, 6),
 (4, 9), (4, 10);

INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_amount, estimated_days, status) VALUES
 (1, 1, 'I can deliver a fast, responsive site using Node and modern CSS.', 20000, 30, 'pending'),
 (1, 2, 'I can design and build the front end with a strong UX focus.',    22000, 35, 'pending'),
 (2, 3, 'I will build an interactive Power BI dashboard from your data.',  10000, 14, 'accepted'),
 (3, 2, 'I will deliver Figma designs for all key store screens.',         14000, 21, 'pending');

INSERT INTO projects (job_id, proposal_id, client_id, freelancer_id, agreed_amount, start_date, end_date, status) VALUES
 (2, 3, 1, 3, 10000, '2026-09-01', '2026-09-15', 'completed');

INSERT INTO payments (project_id, payer_id, amount, method, status, provider_ref, paid_at) VALUES
 (1, 1, 10000, 'bank_transfer', 'paid', 'DEMO-REF-0001', '2026-09-15 10:00:00');

INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment_text) VALUES
 (1, 1, 5, 5, 'Clear dashboard, delivered on time.'),
 (1, 5, 1, 5, 'Great client, quick feedback.');

INSERT INTO hire_requests (requester_id, freelancer_id, project_details) VALUES
 (2, 1, 'We need a small API built for our store. Can we talk this week?');

INSERT INTO shortlists (recruiter_id, freelancer_id) VALUES (1, 1), (1, 3);

INSERT INTO messages (sender_id, recipient_id, body) VALUES
 (2, 4, 'Hi Naledi, are you free to start on the store UI next week?');

INSERT INTO bounties (category_id, title, description, reward, difficulty, deadline) VALUES
 (3, 'Security Challenge', 'Identify potential security weaknesses in a sample system.',        2500, 'medium', '2026-11-10'),
 (1, 'Frontend Challenge', 'Create a responsive interface for a digital marketplace.',          1500, 'easy',   '2026-11-18'),
 (2, 'UX Design Challenge','Design an accessible mobile experience for a new platform.',        2000, 'medium', '2026-11-25');

INSERT INTO bounty_submissions (bounty_id, user_id, solution_url) VALUES
 (2, 3, 'https://github.com/example/frontend-challenge');

INSERT INTO blog_posts (author_id, title, slug, body, image_url, published_at) VALUES
 (6, 'How to Win Your First Freelance Job',        'win-first-freelance-job',   'Start with a clear profile, explain how you will solve the client''s problem, and reply quickly.', 'images/developer.jpg',     '2026-09-20'),
 (6, 'Staying Safe Online as a Freelancer',        'staying-safe-online',       'Use strong unique passwords, turn on two-factor login and keep payments on the platform.',        'images/cybersecurity.jpg', '2026-09-12'),
 (6, 'Why Good UX Matters for Every Business',     'why-good-ux-matters',       'Simple navigation, readable text and fast pages make customers feel confident.',                 'images/uiux.jpg',          '2026-09-03');

INSERT INTO contact_messages (full_name, email, subject, message) VALUES
 ('Test Visitor', 'visitor@example.com', 'Question about bounties', 'How are bounty rewards paid out?');

-- ---------------------------------------------------------------------
-- QUICK CHECKS
-- ---------------------------------------------------------------------
SELECT * FROM v_open_jobs;
SELECT * FROM v_freelancer_profiles;
SELECT * FROM v_proposals_detail;
SELECT * FROM v_projects_detail;
SELECT * FROM v_open_bounties;
SELECT COUNT(*) AS total_users FROM users;
