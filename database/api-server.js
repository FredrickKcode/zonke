const express = require('express');
const cors = require('cors');
const pool = require('./connection');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/jobs', async (_request, response) => {
  try {
    const [jobs] = await pool.query('SELECT * FROM v_open_jobs');
    response.json(jobs);
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: 'Could not load jobs' });
  }
});

app.listen(3001, () => {
  console.log('API listening at http://localhost:3001');
});