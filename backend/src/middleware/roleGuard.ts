import { Request, Response, NextFunction } from 'express';

/**
 * Factory function that creates a middleware to check user role.
 * Must be used AFTER the authenticate middleware.
 * 
 * Usage:
 *   router.get('/admin-only', authenticate, requireRole('admin'), controller);
 *   router.get('/any-staff', authenticate, requireRole('admin', 'waiter'), controller);
 */
export function requireRole(...allowedRoles: Array<'admin' | 'waiter'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        error: 'Autenticación requerida',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        data: null,
        error: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`,
      });
      return;
    }

    next();
  };
}
