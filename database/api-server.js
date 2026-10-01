require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const pool = require('./connection');

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

function validateJobPayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid payload';
  if (!payload.title || String(payload.title).trim().length < 3) return 'Title is required';
  if (!payload.description || String(payload.description).trim().length < 10) return 'Description is required';
  if (!payload.category || String(payload.category).trim().length < 2) return 'Category is required';
  return null;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  return String(password) === String(storedHash);
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

app.post('/api/login', async (request, response) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return response.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [String(email).trim()]);
    const user = rows[0];

    if (!user || !verifyPassword(String(password), user.password_hash)) {
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

app.post('/api/jobs', requireAuth, async (request, response) => {
  const message = validateJobPayload(request.body);

  if (message) {
    return response.status(400).json({ error: message });
  }

  try {
    const { title, description, category, budget_min, budget_max, location, deadline } = request.body;
    const [result] = await pool.query(
      `INSERT INTO jobs (client_id, title, description, category_id, location, budget_min, budget_max, deadline, status)
       SELECT c.client_id, ?, ?, cat.category_id, ?, ?, ?, ?, 'open'
       FROM clients c
       LEFT JOIN categories cat ON cat.slug = ?
       WHERE c.user_id = ?
       LIMIT 1`,
      [
        String(title).trim(),
        String(description).trim(),
        String(location || 'Remote'),
        budget_min ?? null,
        budget_max ?? null,
        deadline || null,
        String(category).trim(),
        request.user.userId || null
      ]
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

app.post('/api/payments', requireAuth, async (request, response) => {
  const { project_id, amount, method, provider_ref } = request.body || {};

  if (!project_id || !amount || !method) {
    return response.status(400).json({ error: 'project_id, amount and method are required' });
  }

  if (Number(amount) <= 0) {
    return response.status(400).json({ error: 'Amount must be greater than zero' });
  }

  if (!['card', 'bank_transfer', 'wallet'].includes(method)) {
    return response.status(400).json({ error: 'Invalid payment method' });
  }

  try {
    const [projectRows] = await pool.query(
      'SELECT project_id FROM projects WHERE project_id = ? AND (client_id IN (SELECT client_id FROM clients WHERE user_id = ?) OR freelancer_id IN (SELECT freelancer_id FROM freelancers WHERE user_id = ?)) LIMIT 1',
      [project_id, request.user.userId, request.user.userId]
    );

    if (!projectRows.length) {
      return response.status(403).json({ error: 'You are not allowed to pay for this project' });
    }

    const [result] = await pool.query(
      'INSERT INTO payments (project_id, payer_id, amount, method, status, provider_ref) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, request.user.userId, Number(amount), method, 'pending', provider_ref || null]
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