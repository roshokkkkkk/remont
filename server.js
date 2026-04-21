const express = require('express');
const session = require('express-session'); 
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

const pagesDir = path.join(__dirname, 'pages');

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, 
    httpOnly: true,              
    secure: false,               
    sameSite: 'lax'             
  }
}));

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'auth_required', message: 'Требуется авторизация' });
  }
  next();
};

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

app.put('/api/requests/:id/status', requireAuth, async (req, res) => { // 👈 защищено
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

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'validation_error', message: 'username and password required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, password FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'session_error' });
      }

      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.loginTime = new Date().toISOString();

      res.json({
        success: true,
        user: { id: user.id, username: user.username },
        message: 'Успешный вход'
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/session', (req, res) => {
  res.json({
    isAuthenticated: !!req.session.userId,
    user: req.session.userId ? {
      id: req.session.userId,
      username: req.session.username
    } : null,
    sessionId: req.sessionID,
    expiresAt: req.session.cookie.expires
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'logout_failed' });
    }
    res.clearCookie('connect.sid'); // имя cookie по умолчанию
    res.json({ success: true, message: 'Выход выполнен' });
  });
});

const pageRoutes = ['about', 'team', 'works', 'review', 'contacts', 'admin'];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

for (const page of pageRoutes) {
  // 👈 admin.html защищаем проверкой сессии
  if (page === 'admin') {
    app.get(`/${page}.html`, (req, res, next) => {
      if (!req.session.userId) {
        // Перенаправляем на вход или показываем 403
        return res.status(403).sendFile(path.join(pagesDir, 'auth-required.html')) || 
               res.status(403).json({ error: 'access_denied' });
      }
      res.sendFile(path.join(pagesDir, `${page}.html`));
    });
  } else {
    app.get(`/${page}.html`, (req, res) => {
      res.sendFile(path.join(pagesDir, `${page}.html`));
    });
  }
}

app.use(express.static(path.join(__dirname), { dotfiles: 'ignore' }));

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`⏱ Sessions: 24 hours`);
});