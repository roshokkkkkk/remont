import { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({
      error: 'auth_required',
      message: 'Authorization is required'
    });
  }

  next();
};
