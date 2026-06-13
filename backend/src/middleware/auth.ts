import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  userId: number;
  restaurantId: number;
  role: 'admin' | 'waiter';
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware that verifies the JWT token from the Authorization header.
 * On success, attaches decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Token de autenticación requerido',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Token inválido o expirado',
    });
  }
}

/**
 * Generates a JWT token for a user.
 */
export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
}
