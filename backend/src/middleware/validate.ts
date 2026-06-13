import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Factory function that creates a validation middleware using a Zod schema.
 * Validates req.body against the provided schema.
 * 
 * Usage:
 *   router.post('/dishes', validate(createDishSchema), controller);
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          data: null,
          error: 'Datos inválidos',
          details: errors,
        });
        return;
      }
      next(err);
    }
  };
}
