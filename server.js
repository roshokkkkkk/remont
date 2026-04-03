const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
const pagesDir = path.join(__dirname, 'pages');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'remont',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const allowedStatuses = new Set(['new', 'viewed', 'in_work', 'ready']);

app.post('/api/requests', async (req, res) => {
  const fullName = asTrimmedString(req.body?.full_name);
  const email = asTrimmedString(req.body?.email).toLowerCase();
  const address = asTrimmedString(req.body?.address);
  const details = asTrimmedString(req.body?.details);

  if (!fullName || !email || !address) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'full_name, email and address are required',
    });
  }

  if (!isEmailValid(email)) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'email is invalid',
    });
  }

  if (fullName.length > 255 || email.length > 255 || address.length > 255) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'full_name, email and address length must be <= 255',
    });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO repair_requests (full_name, email, address, details) VALUES (?, ?, ?, ?)',
      [fullName, email, address, details || null]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, address, details, status, created_at FROM repair_requests ORDER BY created_at DESC'
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.put('/api/requests/:id/status', async (req, res) => {
  const id = Number(req.params.id);
  const status = asTrimmedString(req.body?.status);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'validation_error', message: 'id is invalid' });
  }

  if (!allowedStatuses.has(status)) {
    return res.status(400).json({ error: 'validation_error', message: 'status is invalid' });
  }

  try {
    const [result] = await pool.query('UPDATE repair_requests SET status = ? WHERE id = ?', [
      status,
      id,
    ]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'not_found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'db_error' });
  }
});

const pageRoutes = ['about', 'team', 'works', 'review', 'contacts', 'admin'];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

for (const page of pageRoutes) {
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(pagesDir, `${page}.html`));
  });
}

app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

