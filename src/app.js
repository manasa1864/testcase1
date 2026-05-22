const express = require('express');
const { Pool } = require('pg');
const app = express();
app.use(express.json());

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

app.get('/health', async (_req, res) => {
  const db = pool ? await pool.query('SELECT 1').then(() => 'ok').catch(() => 'error') : 'no-db';
  res.json({ ok: true, db, version: process.env.APP_VERSION || '0.0.0' });
});

app.get('/users', async (_req, res) => {
  if (!pool) return res.json({ users: [] });
  const { rows } = await pool.query('SELECT id, name, email FROM users ORDER BY id');
  res.json({ users: rows });
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email required' });
  if (!pool) return res.status(503).json({ error: 'db unavailable' });
  const { rows } = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]
  );
  res.status(201).json(rows[0]);
});

if (require.main === module) app.listen(3000, () => console.log('running on :3000'));
module.exports = app;
