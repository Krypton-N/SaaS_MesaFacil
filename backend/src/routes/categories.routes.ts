import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireRole('admin'));

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sort_order: z.number().int().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sort_order: z.number().int().optional(),
});

// ---- GET /categories ----
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, name, sort_order FROM categories WHERE restaurant_id = $1 ORDER BY sort_order ASC',
      [req.user!.restaurantId]
    );
    res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener categorías' });
  }
});

// ---- POST /categories ----
router.post('/', validate(createCategorySchema), async (req: Request, res: Response) => {
  try {
    const { name, sort_order } = req.body;
    const result = await query(
      'INSERT INTO categories (restaurant_id, name, sort_order) VALUES ($1, $2, $3) RETURNING id, name, sort_order',
      [req.user!.restaurantId, name, sort_order]
    );
    res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al crear categoría' });
  }
});

// ---- PATCH /categories/:id ----
router.patch('/:id', validate(updateCategorySchema), async (req: Request, res: Response) => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.body.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(req.body.name);
    }
    if (req.body.sort_order !== undefined) {
      fields.push(`sort_order = $${paramIndex++}`);
      values.push(req.body.sort_order);
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, data: null, error: 'No hay campos para actualizar' });
      return;
    }

    values.push(req.params.id, req.user!.restaurantId);
    const result = await query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND restaurant_id = $${paramIndex} RETURNING id, name, sort_order`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Categoría no encontrada' });
      return;
    }

    res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al actualizar categoría' });
  }
});

// ---- DELETE /categories/:id ----
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // Check if category has dishes
    const dishes = await query(
      `SELECT COUNT(*) FROM dishes d 
       JOIN categories c ON d.category_id = c.id 
       WHERE c.id = $1 AND c.restaurant_id = $2`,
      [req.params.id, req.user!.restaurantId]
    );

    if (parseInt(dishes.rows[0].count) > 0) {
      res.status(409).json({ success: false, data: null, error: 'No se puede eliminar: la categoría tiene platillos asociados' });
      return;
    }

    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND restaurant_id = $2 RETURNING id',
      [req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Categoría no encontrada' });
      return;
    }

    res.json({ success: true, data: { message: 'Categoría eliminada' }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al eliminar categoría' });
  }
});

export default router;
