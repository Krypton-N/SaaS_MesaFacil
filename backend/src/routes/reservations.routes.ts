import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();

router.use(authenticate, requireRole('admin'));

const createReservationSchema = z.object({
  table_id: z.number().int().positive().optional(),
  customer_name: z.string().min(1).max(100),
  phone: z.string().max(20).optional().default(''),
  party_size: z.number().int().positive(),
  datetime: z.string().datetime(),
});

const updateReservationSchema = z.object({
  table_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  datetime: z.string().datetime().optional(),
  customer_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  party_size: z.number().int().positive().optional(),
});

// ---- GET /reservations ----
router.get('/', async (req: Request, res: Response) => {
  try {
    const { date, table_id, status } = req.query;
    let sql = `
      SELECT r.*, t.number as table_number
      FROM reservations r
      LEFT JOIN tables t ON r.table_id = t.id
      WHERE r.restaurant_id = $1
    `;
    const params: any[] = [req.user!.restaurantId];
    let paramIndex = 2;

    if (date) {
      sql += ` AND DATE(r.datetime) = $${paramIndex++}`;
      params.push(date);
    }
    if (table_id) {
      sql += ` AND r.table_id = $${paramIndex++}`;
      params.push(table_id);
    }
    if (status) {
      sql += ` AND r.status = $${paramIndex++}`;
      params.push(status);
    }

    sql += ' ORDER BY r.datetime ASC';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener reservas' });
  }
});

// ---- POST /reservations ----
router.post('/', validate(createReservationSchema), async (req: Request, res: Response) => {
  try {
    const { table_id, customer_name, phone, party_size, datetime } = req.body;

    const result = await query(
      `INSERT INTO reservations (restaurant_id, table_id, customer_name, phone, party_size, datetime)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, status`,
      [req.user!.restaurantId, table_id || null, customer_name, phone, party_size, datetime]
    );

    res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al crear reserva' });
  }
});

// ---- PATCH /reservations/:id ----
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const parsed = updateReservationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, data: null, error: 'Datos inválidos' });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    const data = parsed.data;

    if (data.table_id !== undefined) { fields.push(`table_id = $${paramIndex++}`); values.push(data.table_id); }
    if (data.status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(data.status); }
    if (data.datetime !== undefined) { fields.push(`datetime = $${paramIndex++}`); values.push(data.datetime); }
    if (data.customer_name !== undefined) { fields.push(`customer_name = $${paramIndex++}`); values.push(data.customer_name); }
    if (data.phone !== undefined) { fields.push(`phone = $${paramIndex++}`); values.push(data.phone); }
    if (data.party_size !== undefined) { fields.push(`party_size = $${paramIndex++}`); values.push(data.party_size); }

    if (fields.length === 0) {
      res.status(400).json({ success: false, data: null, error: 'No hay campos para actualizar' });
      return;
    }

    values.push(req.params.id, req.user!.restaurantId);
    const result = await query(
      `UPDATE reservations SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND restaurant_id = $${paramIndex} RETURNING id, status`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Reserva no encontrada' });
      return;
    }

    res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al actualizar reserva' });
  }
});

export default router;
