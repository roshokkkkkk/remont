import { Request, Response } from 'express';
import { pool } from '../config/database';

const DEV_ADMIN_USER = { username: 'admin', password: 'skebob', id: 1 };

const getConfiguredAdmin = () => {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (username && password) {
    return { username, password, id: 1 };
  }

  return process.env.NODE_ENV === 'production' ? null : DEV_ADMIN_USER;
};

export const login = async (req: Request, res: Response) => {
  const username = (req.body?.username || '').toString().trim();
  const password = (req.body?.password || '').toString().trim();

  if (!username || !password) {
    return res.status(400).json({ error: 'validation_error', message: 'username and password required' });
  }

  const configuredAdmin = getConfiguredAdmin();
  if (configuredAdmin && username === configuredAdmin.username && password === configuredAdmin.password) {
    return regenerateAndRespond(req, res, configuredAdmin);
  }

  try {
    const [rows]: any = await pool.query(
      'SELECT id, username, password FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    const user = rows[0];
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }

    return regenerateAndRespond(req, res, user);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'db_error' });
  }
};

const regenerateAndRespond = (req: Request, res: Response, user: any) => {
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
      message: 'Login successful'
    });
  });
};

export const getSession = (req: Request, res: Response) => {
  res.json({
    isAuthenticated: !!req.session.userId,
    user: req.session.userId
      ? { id: req.session.userId, username: req.session.username }
      : null,
    sessionId: req.sessionID,
    expiresAt: req.session.cookie.expires
  });
};

export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'logout_failed' });
    }

    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout successful' });
  });
};
