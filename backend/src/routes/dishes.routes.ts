import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();

const createDishSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  description: z.string().optional().default(''),
  price: z.number().positive(),
  active: z.boolean().default(true),
});

const updateDishSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  active: z.boolean().optional(),
  category_id: z.number().int().positive().optional(),
});

// ---- GET /dishes (admin) ----
router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { category_id } = req.query;
    let sql = `
      SELECT d.* FROM dishes d
      JOIN categories c ON d.category_id = c.id
      WHERE c.restaurant_id = $1
    `;
    const params: any[] = [req.user!.restaurantId];

    if (category_id) {
      sql += ' AND d.category_id = $2';
      params.push(category_id);
    }

    sql += ' ORDER BY c.sort_order, d.name';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener platillos' });
  }
});

// ---- POST /dishes ----
router.post('/', authenticate, requireRole('admin'), validate(createDishSchema), async (req: Request, res: Response) => {
  try {
    const { category_id, name, description, price, active } = req.body;

    // Verify category belongs to this restaurant
    const catCheck = await query(
      'SELECT id FROM categories WHERE id = $1 AND restaurant_id = $2',
      [category_id, req.user!.restaurantId]
    );
    if (catCheck.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Categoría no encontrada' });
      return;
    }

    const result = await query(
      'INSERT INTO dishes (category_id, name, description, price, active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category_id, name, description, price, active]
    );

    res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al crear platillo' });
  }
});

// ---- PATCH /dishes/:id ----
router.patch('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const parsed = updateDishSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: 'Datos inválidos' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const data = parsed.data;
    if (data.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(data.name); }
    if (data.description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(data.description); }
    if (data.price !== undefined) { fields.push(`price = $${paramIndex++}`); values.push(data.price); }
    if (data.active !== undefined) { fields.push(`active = $${paramIndex++}`); values.push(data.active); }
    if (data.category_id !== undefined) { fields.push(`category_id = $${paramIndex++}`); values.push(data.category_id); }

    if (fields.length === 0) {
      res.status(400).json({ success: false, data: null, error: 'No hay campos para actualizar' });
      return;
    }

    // Verify dish belongs to this restaurant
    values.push(req.params.id, req.user!.restaurantId);
    const result = await query(
      `UPDATE dishes SET ${fields.join(', ')} 
       WHERE id = $${paramIndex++} AND category_id IN (SELECT id FROM categories WHERE restaurant_id = $${paramIndex})
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Platillo no encontrado' });
      return;
    }

    res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al actualizar platillo' });
  }
});

// ---- DELETE /dishes/:id ----
router.delete('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      `DELETE FROM dishes WHERE id = $1 AND category_id IN (SELECT id FROM categories WHERE restaurant_id = $2) RETURNING id`,
      [req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Platillo no encontrado' });
      return;
    }

    res.json({ success: true, data: { message: 'Platillo eliminado' }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al eliminar platillo' });
  }
});

// ---- POST /dishes/extract-from-image (VLM / LM Studio) ----
router.post('/extract-from-image', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  // TODO: Integrate with LM Studio VLM in a later sprint
  res.json({
    success: true,
    data: {
      extracted_dishes: [
        { name: 'Platillo detectado (demo)', description: 'Extraído por IA', price: 0, suggested_category: 'Sin categoría' },
      ],
      message: 'Endpoint de extracción con IA — pendiente de integración con LM Studio',
    },
    error: null,
  });
});

export default router;
