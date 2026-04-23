import session from 'express-session';

export const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false,
    sameSite: 'lax'
  }
});