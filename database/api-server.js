require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const pool = require('./connection');
const scrypt = promisify(crypto.scrypt);

const app = express();
const allowedOrigins = ['http://localhost:8080', 'http://127.0.0.1:8080'];

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');

app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
}));

function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return response.status(500).json({ error: 'Auth not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    request.user = decoded;
    next();
  } catch (error) {
    return response.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(request, response, next) {
  if (!request.user || request.user.role !== 'admin') {
    return response.status(403).json({ error: 'Forbidden' });
  }

  next();
}

function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function validateJobPayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid payload';
  if (!payload.title || String(payload.title).trim().length < 3) return 'Title is required';
  if (!payload.description || String(payload.description).trim().length < 10) return 'Description is required';
  if (!payload.category || String(payload.category).trim().length < 2) return 'Category is required';
  return null;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [scheme, salt, storedKey] = String(storedHash).split('$');
  if (scheme !== 'scrypt' || !salt || !storedKey) return false;
  const expected = Buffer.from(storedKey, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user.user_id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

app.post('/api/register', async (request, response) => {
  const { full_name, email, password, role, hourly_rate, title, bio, portfolio_url, skills } = request.body || {};
  const names = String(full_name || '').trim().split(/\s+/).filter(Boolean);
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (names.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return response.status(400).json({ error: 'Enter your full name and a valid email address' });
  }
  if (typeof password !== 'string' || password.length < 10) {
    return response.status(400).json({ error: 'Password must be at least 10 characters' });
  }
  if (!['client', 'freelancer', 'recruiter'].includes(role)) {
    return response.status(400).json({ error: 'Invalid account type' });
  }
  if (role === 'freelancer' && hourly_rate != null && (!Number.isFinite(Number(hourly_rate)) || Number(hourly_rate) < 0)) {
    return response.status(400).json({ error: 'Hourly rate must be a valid non-negative number' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const passwordHash = await hashPassword(password);
    const [userResult] = await connection.query(
      'INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [names[0], names.slice(1).join(' '), normalizedEmail, passwordHash, role]
    );

    if (role === 'client') {
      await connection.query('INSERT INTO clients (user_id) VALUES (?)', [userResult.insertId]);
    } else if (role === 'recruiter') {
      await connection.query('INSERT INTO recruiters (user_id) VALUES (?)', [userResult.insertId]);
    } else {
      const [profileResult] = await connection.query(
        'INSERT INTO freelancers (user_id, title, bio, hourly_rate, location, portfolio_url, availability) VALUES (?, ?, ?, ?, ?, ?, \'available\')',
        [userResult.insertId, String(title || 'Freelancer').trim().slice(0, 150), String(bio || '').trim() || null,
          hourly_rate || null, 'South Africa', String(portfolio_url || '').trim() || null]
      );
      const skillNames = [...new Set((Array.isArray(skills) ? skills : String(skills || '').split(','))
        .map(skill => String(skill).trim()).filter(Boolean).slice(0, 30))];
      for (const skillName of skillNames) {
        await connection.query('INSERT IGNORE INTO skills (name) VALUES (?)', [skillName.slice(0, 100)]);
        const [[skill]] = await connection.query('SELECT skill_id FROM skills WHERE name = ?', [skillName.slice(0, 100)]);
        await connection.query('INSERT IGNORE INTO freelancer_skills (freelancer_id, skill_id) VALUES (?, ?)', [profileResult.insertId, skill.skill_id]);
      }
    }

    await connection.commit();
    const user = {
      user_id: userResult.insertId,
      first_name: names[0],
      last_name: names.slice(1).join(' '),
      email: normalizedEmail,
      role
    };
    response.status(201).json({ token: createToken(user), user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role
    } });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ error: 'An account with this email already exists' });
    }
    console.error(error);
    response.status(500).json({ error: 'Could not create account' });
  } finally {
    connection.release();
  }
});

app.post('/api/login', async (request, response) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return response.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [String(email).trim()]);
    const user = rows[0];

    if (!user || !user.is_active || !(await verifyPassword(String(password), user.password_hash))) {
      return response.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createToken(user);

    response.json({
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not log in' });
  }
});

app.get('/api/jobs', async (_request, response) => {
  try {
    const [jobs] = await pool.query('SELECT * FROM v_open_jobs ORDER BY created_at DESC');
    response.json(jobs);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load jobs' });
  }
});

app.post('/api/jobs', requireAuth, requireRole('client', 'recruiter'), async (request, response) => {
  const message = validateJobPayload(request.body);

  if (message) {
    return response.status(400).json({ error: message });
  }

  try {
    const { title, description, category, budget_min, budget_max, location, deadline } = request.body;
    const [result] = request.user.role === 'client'
      ? await pool.query(
        `INSERT INTO jobs (client_id, title, description, category_id, location, budget_min, budget_max, deadline, status)
         SELECT c.client_id, ?, ?, cat.category_id, ?, ?, ?, ?, 'open'
         FROM clients c JOIN categories cat ON cat.slug = ?
         WHERE c.user_id = ? LIMIT 1`,
        [String(title).trim(), String(description).trim(), String(location || 'Remote'), budget_min ?? null,
          budget_max ?? null, deadline || null, String(category).trim(), request.user.userId]
      )
      : await pool.query(
        `INSERT INTO jobs (recruiter_id, title, description, category_id, location, budget_min, budget_max, deadline, status)
         SELECT r.recruiter_id, ?, ?, cat.category_id, ?, ?, ?, ?, 'open'
         FROM recruiters r JOIN categories cat ON cat.slug = ?
         WHERE r.user_id = ? LIMIT 1`,
        [String(title).trim(), String(description).trim(), String(location || 'Remote'), budget_min ?? null,
          budget_max ?? null, deadline || null, String(category).trim(), request.user.userId]
      );

    if (!result.insertId) {
      return response.status(400).json({ error: 'Could not create job for this user' });
    }

    response.status(201).json({ message: 'Job created', jobId: result.insertId });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not create job' });
  }
});

app.get('/api/freelancers', async (_request, response) => {
  try {
    const [freelancers] = await pool.query(`
      SELECT * FROM v_freelancer_profiles
      ORDER BY projects_completed DESC, avg_rating DESC, freelancer_id DESC
    `);
    response.json(freelancers);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load freelancers' });
  }
});

app.get('/api/blog', async (_request, response) => {
  try {
    const [posts] = await pool.query(`
      SELECT bp.*, CONCAT(u.first_name, ' ', u.last_name) AS author_name
      FROM blog_posts bp
      LEFT JOIN users u ON u.user_id = bp.author_id
      ORDER BY bp.published_at DESC, bp.post_id DESC
    `);
    response.json(posts);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load blog posts' });
  }
});

app.get('/api/bounties', async (_request, response) => {
  try {
    const [bounties] = await pool.query(`
      SELECT b.*, c.slug AS category, c.name AS category_name,
             (SELECT COUNT(*) FROM bounty_submissions bs WHERE bs.bounty_id = b.bounty_id) AS submission_count
      FROM bounties b
      LEFT JOIN categories c ON c.category_id = b.category_id
      WHERE b.status = 'open'
      ORDER BY b.deadline ASC, b.created_at DESC
    `);
    response.json(bounties);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load bounties' });
  }
});

app.post('/api/bounty-submissions', requireAuth, requireRole('freelancer'), async (request, response) => {
  const { bounty_id, solution_url } = request.body || {};
  let parsedUrl;
  try {
    parsedUrl = new URL(String(solution_url || ''));
  } catch (_error) {
    return response.status(400).json({ error: 'Enter a valid solution URL' });
  }
  if (!Number.isInteger(Number(bounty_id)) || !['http:', 'https:'].includes(parsedUrl.protocol)) {
    return response.status(400).json({ error: 'A bounty and valid HTTP(S) solution URL are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO bounty_submissions (bounty_id, user_id, solution_url)
       SELECT b.bounty_id, ?, ? FROM bounties b
       WHERE b.bounty_id = ? AND b.status = 'open'`,
      [request.user.userId, parsedUrl.toString(), Number(bounty_id)]
    );
    if (!result.insertId) return response.status(404).json({ error: 'Open bounty not found' });
    response.status(201).json({ message: 'Solution submitted', submissionId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'You already submitted to this bounty' });
    console.error(error);
    response.status(500).json({ error: 'Could not submit solution' });
  }
});

app.post('/api/proposals', requireAuth, requireRole('freelancer'), async (request, response) => {
  const { job_id, cover_letter, proposed_amount } = request.body || {};
  if (!Number.isInteger(Number(job_id)) || !cover_letter || String(cover_letter).trim().length < 10 ||
      !Number.isFinite(Number(proposed_amount)) || Number(proposed_amount) <= 0) {
    return response.status(400).json({ error: 'A job, cover letter and positive proposed amount are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO proposals (job_id, freelancer_id, cover_letter, proposed_amount)
       SELECT j.job_id, f.freelancer_id, ?, ?
       FROM jobs j JOIN freelancers f ON f.user_id = ?
       WHERE j.job_id = ? AND j.status = 'open'`,
      [String(cover_letter).trim(), Number(proposed_amount), request.user.userId, Number(job_id)]
    );
    if (!result.insertId) return response.status(404).json({ error: 'Open job or freelancer profile not found' });
    response.status(201).json({ message: 'Application saved', proposalId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return response.status(409).json({ error: 'You already applied to this job' });
    console.error(error);
    response.status(500).json({ error: 'Could not submit application' });
  }
});

app.get('/api/proposals/mine', requireAuth, requireRole('freelancer'), async (request, response) => {
  try {
    const [proposals] = await pool.query(
      `SELECT p.proposal_id, p.proposed_amount, p.status, p.submitted_at, j.title AS job_title
       FROM proposals p JOIN freelancers f ON f.freelancer_id = p.freelancer_id
       JOIN jobs j ON j.job_id = p.job_id WHERE f.user_id = ?
       ORDER BY p.submitted_at DESC`,
      [request.user.userId]
    );
    response.json(proposals);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load applications' });
  }
});

app.put('/api/freelancer/profile', requireAuth, requireRole('freelancer'), async (request, response) => {
  const { title, hourly_rate, category, skills } = request.body || {};
  if (!title || String(title).trim().length < 2 || !Number.isFinite(Number(hourly_rate)) || Number(hourly_rate) <= 0) {
    return response.status(400).json({ error: 'Job title and a positive hourly rate are required' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [update] = await connection.query(
      `UPDATE freelancers f LEFT JOIN categories c ON c.slug = ?
       SET f.title = ?, f.hourly_rate = ?, f.category_id = c.category_id
       WHERE f.user_id = ?`,
      [String(category || '').trim(), String(title).trim().slice(0, 150), Number(hourly_rate), request.user.userId]
    );
    if (!update.affectedRows) {
      await connection.rollback();
      return response.status(404).json({ error: 'Freelancer profile not found' });
    }
    const [profileRows] = await connection.query('SELECT freelancer_id FROM freelancers WHERE user_id = ?', [request.user.userId]);
    await connection.query('DELETE FROM freelancer_skills WHERE freelancer_id = ?', [profileRows[0].freelancer_id]);
    const skillNames = [...new Set((Array.isArray(skills) ? skills : String(skills || '').split(','))
      .map(skill => String(skill).trim()).filter(Boolean).slice(0, 30))];
    for (const skillName of skillNames) {
      const safeSkill = skillName.slice(0, 100);
      await connection.query('INSERT IGNORE INTO skills (name) VALUES (?)', [safeSkill]);
      const [[skill]] = await connection.query('SELECT skill_id FROM skills WHERE name = ?', [safeSkill]);
      await connection.query('INSERT IGNORE INTO freelancer_skills (freelancer_id, skill_id) VALUES (?, ?)', [profileRows[0].freelancer_id, skill.skill_id]);
    }
    await connection.commit();
    response.json({ message: 'Profile updated' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    response.status(500).json({ error: 'Could not update profile' });
  } finally {
    connection.release();
  }
});

app.post('/api/hire-requests', requireAuth, requireRole('client', 'recruiter'), async (request, response) => {
  const { freelancer_id, project_details } = request.body || {};
  if (!Number.isInteger(Number(freelancer_id)) || !project_details || String(project_details).trim().length < 10) {
    return response.status(400).json({ error: 'A freelancer and project details are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO hire_requests (requester_id, freelancer_id, project_details)
       SELECT ?, f.freelancer_id, ? FROM freelancers f JOIN users u ON u.user_id = f.user_id
       WHERE f.freelancer_id = ? AND u.is_active = 1`,
      [request.user.userId, String(project_details).trim(), Number(freelancer_id)]
    );
    if (!result.insertId) return response.status(404).json({ error: 'Freelancer not found' });
    response.status(201).json({ message: 'Hire request saved', requestId: result.insertId });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not send hire request' });
  }
});

app.get('/api/projects/mine', requireAuth, requireRole('client'), async (request, response) => {
  try {
    const [projects] = await pool.query(
      `SELECT DISTINCT pr.project_id, j.title, pr.agreed_amount, pr.status
       FROM projects pr JOIN jobs j ON j.job_id = pr.job_id
      JOIN clients c ON c.client_id = pr.client_id
      WHERE c.user_id = ?
       ORDER BY pr.project_id DESC`,
          [request.user.userId]
    );
    response.json(projects);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load projects' });
  }
});

app.post('/api/contact', async (request, response) => {
  const { full_name, email, subject, message } = request.body || {};
  if (!full_name || !email || !subject || !message || String(message).trim().length < 10) {
    return response.status(400).json({ error: 'Name, email, subject and a message of at least 10 characters are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO contact_messages (full_name, email, subject, message) VALUES (?, ?, ?, ?)',
      [String(full_name).trim().slice(0, 100), String(email).trim().slice(0, 150), String(subject).trim().slice(0, 200), String(message).trim()]
    );
    response.status(201).json({ message: 'Message saved', contactId: result.insertId });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not save contact message' });
  }
});

app.post('/api/payments', requireAuth, requireRole('client'), async (request, response) => {
  const { project_id, amount, method } = request.body || {};

  if (!Number.isInteger(Number(project_id)) || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !method) {
    return response.status(400).json({ error: 'project_id, amount and method are required' });
  }

  if (!['card', 'bank_transfer', 'wallet'].includes(method)) {
    return response.status(400).json({ error: 'Invalid payment method' });
  }

  try {
    const [projectRows] = await pool.query(
      'SELECT project_id FROM projects WHERE project_id = ? AND client_id IN (SELECT client_id FROM clients WHERE user_id = ?) LIMIT 1',
      [project_id, request.user.userId]
    );

    if (!projectRows.length) {
      return response.status(403).json({ error: 'You are not allowed to pay for this project' });
    }

    const [result] = await pool.query(
      'INSERT INTO payments (project_id, payer_id, amount, method, status) VALUES (?, ?, ?, ?, ?)',
      [project_id, request.user.userId, Number(amount), method, 'pending']
    );

    response.status(201).json({
      message: 'Payment request created',
      paymentId: result.insertId,
      status: 'pending'
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not create payment' });
  }
});

app.get('/api/admin/health', requireAuth, requireAdmin, (_request, response) => {
  response.json({ ok: true, message: 'Admin access granted' });
});

app.listen(3001, () => {
  console.log('API listening at http://localhost:3001');
});

app.post('/api/messages', requireAuth, async (request, response) => {
  const { recipient_id, body } = request.body || {};
  if (!Number.isInteger(Number(recipient_id)) || !body || String(body).trim().length < 2) {
    return response.status(400).json({ error: 'A recipient and message are required' });
  }
  if (Number(recipient_id) === Number(request.user.userId)) {
    return response.status(400).json({ error: 'You cannot message yourself' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, body)
       SELECT ?, user_id, ? FROM users WHERE user_id = ? AND is_active = 1`,
      [request.user.userId, String(body).trim(), Number(recipient_id)]
    );
    if (!result.insertId) return response.status(404).json({ error: 'Recipient not found' });
    response.status(201).json({ message: 'Message saved', messageId: result.insertId });
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not send message' });
  }
});