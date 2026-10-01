const express = require('express');
const cors = require('cors');
const pool = require('./connection');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/jobs', async (_request, response) => {
  try {
    const [jobs] = await pool.query('SELECT * FROM v_open_jobs ORDER BY created_at DESC');
    response.json(jobs);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load jobs' });
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

app.listen(3001, () => {
  console.log('API listening at http://localhost:3001');
});