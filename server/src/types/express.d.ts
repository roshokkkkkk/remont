import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: number | string;
    username?: string;
    loginTime?: string;
  }
}