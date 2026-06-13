import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();

// All routes require admin role
router.use(authenticate, requireRole('admin'));

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'waiter']),
});

// ---- GET /users ----
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [req.user!.restaurantId]
    );
    res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener usuarios' });
  }
});

// ---- POST /users ----
router.post('/', validate(createUserSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await query(
      'INSERT INTO users (restaurant_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      [req.user!.restaurantId, name, email, passwordHash, role]
    );

    res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(409).json({ success: false, data: null, error: 'Email ya registrado' });
      return;
    }
    res.status(500).json({ success: false, data: null, error: 'Error al crear usuario' });
  }
});

// ---- DELETE /users/:id ----
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 AND restaurant_id = $2 RETURNING id',
      [req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Usuario no encontrado' });
      return;
    }

    res.json({ success: true, data: { message: 'Usuario eliminado' }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al eliminar usuario' });
  }
});

export default router;
