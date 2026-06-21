import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { env } from '../config/env';
import { extractDishesFromImage } from '../services/vlm.service';
import { getPagination } from '../utils/pagination';

const router = Router();

const createDishSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  description: z.string().optional().default(''),
  price: z.number().positive(),
  active: z.boolean().default(true),
  image_url: z.string().url().optional(),
});

const updateDishSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  active: z.boolean().optional(),
  category_id: z.number().int().positive().optional(),
  image_url: z.string().url().optional(),
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

    // Paginación opt-in (no rompe al frontend: data sigue siendo arreglo)
    const { limit, offset } = getPagination(req.query as Record<string, unknown>);
    let total = 0;
    if (limit !== null) {
      const countResult = await query(
        `SELECT COUNT(*)::int AS total FROM (${sql}) AS sub`,
        params
      );
      total = countResult.rows[0]?.total ?? 0;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const result = await query(sql, params);
    res.json({
      success: true,
      data: result.rows,
      error: null,
      ...(limit !== null && { meta: { total, limit, offset } }),
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener platillos' });
  }
});

// ---- POST /dishes ----
router.post('/', authenticate, requireRole('admin'), validate(createDishSchema), async (req: Request, res: Response) => {
  try {
    const { category_id, name, description, price, active, image_url } = req.body;

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
      'INSERT INTO dishes (category_id, name, description, price, active, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [category_id, name, description, price, active, image_url ?? null]
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
    if (data.image_url !== undefined) { fields.push(`image_url = $${paramIndex++}`); values.push(data.image_url); }

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
const extractImageSchema = z.object({
  image: z.string().min(1, 'La imagen del menú es requerida'),
});

router.post('/extract-from-image', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const parsed = extractImageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Debes enviar la imagen del menú (campo "image" como data URL base64)',
    });
    return;
  }

  try {
    const dishes = await extractDishesFromImage(parsed.data.image);
    res.json({
      success: true,
      data: {
        extracted_dishes: dishes,
        message: dishes.length > 0
          ? `Se detectaron ${dishes.length} platillo(s) en la imagen`
          : 'La IA no detectó platillos legibles en la imagen',
      },
      error: null,
    });
  } catch (err) {
    console.error('VLM extract error:', err);
    res.status(502).json({
      success: false,
      data: null,
      error: `No se pudo conectar con el servicio de IA (LM Studio en ${env.LM_STUDIO_URL}). Verifica que esté en ejecución con un modelo de visión cargado.`,
    });
  }
});

export default router;
