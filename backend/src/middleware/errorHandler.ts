import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('❌ Unhandled error:', err.message);
  console.error(err.stack);

  const statusCode = (err as any).statusCode || 500;
  const message = statusCode === 500 ? 'Error interno del servidor' : err.message;

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
}

/**
 * Custom error class with HTTP status code.
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}
