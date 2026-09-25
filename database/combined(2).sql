DROP VIEW  IF EXISTS v_open_jobs;
DROP VIEW  IF EXISTS v_freelancer_profiles;
DROP VIEW  IF EXISTS v_proposals_detail;
DROP VIEW  IF EXISTS v_projects_detail;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS proposals;
DROP TABLE IF EXISTS job_skills;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS freelancer_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS freelancers;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name     VARCHAR(50)  NOT NULL,
    last_name      VARCHAR(50)  NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    phone          VARCHAR(20),
    role           VARCHAR(20) NOT NULL,
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
CREATE TABLE freelancers (
    freelancer_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id        INT UNSIGNED NOT NULL UNIQUE,
    title          VARCHAR(150),
    bio            TEXT,
    hourly_rate    DECIMAL(10,2),
    location       VARCHAR(150),
    availability   VARCHAR(20) NOT NULL DEFAULT 'available',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE skills (
    skill_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL UNIQUE,
    category  VARCHAR(100)
);
CREATE TABLE freelancer_skills (
    freelancer_id      INT UNSIGNED NOT NULL,
    skill_id           INT UNSIGNED NOT NULL,
    proficiency        VARCHAR(20) NOT NULL DEFAULT 'intermediate',
    years_experience   INT,
    PRIMARY KEY (freelancer_id, skill_id),
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id)      REFERENCES skills(skill_id)           ON DELETE CASCADE
);
CREATE TABLE jobs (
    job_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id    INT UNSIGNED NOT NULL,
    title        VARCHAR(200) NOT NULL,
    description  TEXT NOT NULL,
    budget_min   DECIMAL(12,2),
    budget_max   DECIMAL(12,2),
    deadline     DATE,
    status       VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);
CREATE TABLE job_skills (
    job_id    INT UNSIGNED NOT NULL,
    skill_id  INT UNSIGNED NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id)   REFERENCES jobs(job_id)     ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id) ON DELETE CASCADE
);
CREATE TABLE proposals (
    proposal_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id            INT UNSIGNED NOT NULL,
    freelancer_id     INT UNSIGNED NOT NULL,
    cover_letter      TEXT NOT NULL,
    proposed_amount   DECIMAL(12,2) NOT NULL,
    estimated_days    INT,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    submitted_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, freelancer_id),
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
    start_date     DATE NOT NULL DEFAULT (CURRENT_DATE),
    end_date       DATE,
    status         VARCHAR(20) NOT NULL DEFAULT 'active',
    FOREIGN KEY (job_id)        REFERENCES jobs(job_id)               ON DELETE CASCADE,
    FOREIGN KEY (proposal_id)   REFERENCES proposals(proposal_id)     ON DELETE CASCADE,
    FOREIGN KEY (client_id)     REFERENCES clients(client_id)         ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES freelancers(freelancer_id) ON DELETE CASCADE
);
CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_jobs_client           ON jobs(client_id);
CREATE INDEX idx_jobs_status           ON jobs(status);
CREATE INDEX idx_proposals_job         ON proposals(job_id);
CREATE INDEX idx_proposals_freelancer  ON proposals(freelancer_id);
CREATE INDEX idx_projects_client       ON projects(client_id);
CREATE INDEX idx_projects_freelancer   ON projects(freelancer_id);
CREATE INDEX idx_freelancer_skills_sk  ON freelancer_skills(skill_id);
CREATE INDEX idx_job_skills_sk         ON job_skills(skill_id);
CREATE VIEW v_open_jobs AS
SELECT j.job_id, j.title, j.description, j.budget_min, j.budget_max, j.deadline,
       j.created_at, c.client_id,
       COALESCE(c.company_name, CONCAT(u.first_name, ' ', u.last_name)) AS client_name,
       (SELECT GROUP_CONCAT(s.name SEPARATOR ', ')
          FROM job_skills js JOIN skills s ON s.skill_id = js.skill_id
         WHERE js.job_id = j.job_id) AS required_skills,
       (SELECT COUNT(*) FROM proposals p WHERE p.job_id = j.job_id) AS proposal_count
  FROM jobs j
  JOIN clients c ON c.client_id = j.client_id
  JOIN users   u ON u.user_id   = c.user_id
 WHERE j.status = 'open';
CREATE VIEW v_freelancer_profiles AS
SELECT f.freelancer_id, u.user_id, u.first_name, u.last_name, u.email,
       f.title, f.bio, f.hourly_rate, f.location, f.availability,
       (SELECT GROUP_CONCAT(s.name SEPARATOR ', ')
          FROM freelancer_skills fs JOIN skills s ON s.skill_id = fs.skill_id
         WHERE fs.freelancer_id = f.freelancer_id) AS skills
  FROM freelancers f
  JOIN users u ON u.user_id = f.user_id
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
INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES
 ('Thabo',  'Mokoena', 'thabo@acmebuild.co.za',  'DUMMY_HASH_1', '0821234567', 'client'),
 ('Lerato', 'Dlamini', 'lerato@brightretail.co.za','DUMMY_HASH_2','0839876543', 'client'),
 ('Sipho',  'Nkosi',   'sipho.dev@example.com',   'DUMMY_HASH_3', '0711112222', 'freelancer'),
 ('Naledi', 'Khumalo', 'naledi.design@example.com','DUMMY_HASH_4','0723334444', 'freelancer'),
 ('Ayanda', 'Zulu',    'ayanda.data@example.com', 'DUMMY_HASH_5', '0745556666', 'freelancer'),
 ('Admin',  'User',    'admin@zonke.co.za',       'DUMMY_HASH_6', NULL,         'admin');
INSERT INTO clients (user_id, company_name, industry, website, location) VALUES
 (1, 'Acme Build',    'Construction', 'https://acmebuild.example',  'Johannesburg'),
 (2, 'Bright Retail', 'Retail',       'https://brightretail.example','Cape Town');
INSERT INTO freelancers (user_id, title, bio, hourly_rate, location, availability) VALUES
 (3, 'Full-Stack Developer', 'Builds web apps with Node and SQL.', 350.00, 'Pretoria',     'available'),
 (4, 'UI/UX Designer',       'Designs clean, usable interfaces.',   300.00, 'Durban',       'available'),
 (5, 'Data Analyst',         'Dashboards, SQL and reporting.',      280.00, 'Johannesburg', 'busy');
INSERT INTO skills (name, category) VALUES
 ('JavaScript', 'Development'), ('Node.js', 'Development'), ('SQL', 'Data'),
 ('HTML/CSS', 'Development'),   ('Figma', 'Design'),        ('UI Design', 'Design'),
 ('Data Analysis', 'Data'),     ('Power BI', 'Data');
INSERT INTO freelancer_skills (freelancer_id, skill_id, proficiency, years_experience) VALUES
 (1, 1, 'expert', 5), (1, 2, 'expert', 4), (1, 3, 'intermediate', 3), (1, 4, 'expert', 5),
 (2, 5, 'expert', 4), (2, 6, 'expert', 5), (2, 4, 'intermediate', 2),
 (3, 3, 'expert', 6), (3, 7, 'expert', 5), (3, 8, 'intermediate', 3);
INSERT INTO jobs (client_id, title, description, budget_min, budget_max, deadline, status) VALUES
 (1, 'Company website rebuild', 'Modern responsive website for our construction company.', 15000, 25000, '2026-11-30', 'open'),
 (1, 'Sales dashboard',         'Power BI dashboard for monthly project sales.',           8000, 12000, '2026-10-31', 'open'),
 (2, 'Online store UI design',  'Design mobile-first UI for our online store.',            10000, 18000, '2026-11-15', 'open');
INSERT INTO job_skills (job_id, skill_id) VALUES
 (1, 1), (1, 4), (1, 2),
 (2, 7), (2, 8), (2, 3),
 (3, 5), (3, 6);
INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_amount, estimated_days, status) VALUES
 (1, 1, 'I can deliver a fast, responsive site using Node and modern CSS.', 20000, 30, 'pending'),
 (1, 2, 'I can design and build the front end with a strong UX focus.',    22000, 35, 'pending'),
 (2, 3, 'I will build an interactive Power BI dashboard from your data.',  10000, 14, 'pending'),
 (3, 2, 'I will deliver Figma designs for all key store screens.',         14000, 21, 'pending');

SELECT * FROM users;
SELECT * FROM clients;
SELECT * FROM freelancers;
SELECT * FROM skills;
SELECT * FROM jobs;
SELECT * FROM proposals;
SELECT * FROM v_open_jobs;
SELECT * FROM v_freelancer_profiles;
