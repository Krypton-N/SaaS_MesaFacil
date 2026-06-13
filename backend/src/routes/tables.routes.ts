import { Router, Request, Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';

const router = Router();

const createTableSchema = z.object({
  number: z.string().min(1).max(20),
});

const updateTableSchema = z.object({
  number: z.string().min(1).max(20).optional(),
});

const assignWaitersSchema = z.object({
  waiter_ids: z.array(z.number().int().positive()),
});

// ---- GET /tables ----
router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const tablesResult = await query(
      'SELECT id, number, qr_token FROM tables WHERE restaurant_id = $1 ORDER BY number',
      [req.user!.restaurantId]
    );

    // Get waiters for each table
    const tables = await Promise.all(
      tablesResult.rows.map(async (table) => {
        const waitersResult = await query(
          `SELECT u.id, u.name FROM users u 
           JOIN table_waiters tw ON u.id = tw.user_id 
           WHERE tw.table_id = $1`,
          [table.id]
        );
        return { ...table, waiters: waitersResult.rows };
      })
    );

    res.json({ success: true, data: tables, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener mesas' });
  }
});

// ---- POST /tables ----
router.post('/', authenticate, requireRole('admin'), validate(createTableSchema), async (req: Request, res: Response) => {
  try {
    const result = await query(
      'INSERT INTO tables (restaurant_id, number) VALUES ($1, $2) RETURNING id, number, qr_token',
      [req.user!.restaurantId, req.body.number]
    );
    res.status(201).json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al crear mesa' });
  }
});

// ---- PATCH /tables/:id ----
router.patch('/:id', authenticate, requireRole('admin'), validate(updateTableSchema), async (req: Request, res: Response) => {
  try {
    if (!req.body.number) {
      res.status(400).json({ success: false, data: null, error: 'No hay campos para actualizar' });
      return;
    }

    const result = await query(
      'UPDATE tables SET number = $1 WHERE id = $2 AND restaurant_id = $3 RETURNING id, number, qr_token',
      [req.body.number, req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada' });
      return;
    }

    res.json({ success: true, data: result.rows[0], error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al actualizar mesa' });
  }
});

// ---- DELETE /tables/:id ----
router.delete('/:id', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      'DELETE FROM tables WHERE id = $1 AND restaurant_id = $2 RETURNING id',
      [req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada' });
      return;
    }

    res.json({ success: true, data: { message: 'Mesa eliminada' }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al eliminar mesa' });
  }
});

// ---- POST /tables/:id/regenerate-qr ----
router.post('/:id/regenerate-qr', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      'UPDATE tables SET qr_token = gen_random_uuid() WHERE id = $1 AND restaurant_id = $2 RETURNING qr_token',
      [req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada' });
      return;
    }

    res.json({ success: true, data: { qr_token: result.rows[0].qr_token }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al regenerar QR' });
  }
});

// ---- GET /tables/:id/qr ----
router.get('/:id/qr', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT qr_token FROM tables WHERE id = $1 AND restaurant_id = $2',
      [req.params.id, req.user!.restaurantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada' });
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';
    const menuUrl = `${baseUrl}/mesa/${result.rows[0].qr_token}`;
    const qrImage = await QRCode.toBuffer(menuUrl, { type: 'png', width: 400, margin: 2 });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="mesa-${req.params.id}-qr.png"`);
    res.send(qrImage);
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al generar QR' });
  }
});

// ---- PUT /tables/:id/waiters ----
router.put('/:id/waiters', authenticate, requireRole('admin'), validate(assignWaitersSchema), async (req: Request, res: Response) => {
  try {
    const tableId = req.params.id;
    const { waiter_ids } = req.body;

    // Verify table belongs to this restaurant
    const tableCheck = await query(
      'SELECT id FROM tables WHERE id = $1 AND restaurant_id = $2',
      [tableId, req.user!.restaurantId]
    );
    if (tableCheck.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada' });
      return;
    }

    // Delete existing assignments
    await query('DELETE FROM table_waiters WHERE table_id = $1', [tableId]);

    // Insert new assignments
    for (const waiterId of waiter_ids) {
      await query('INSERT INTO table_waiters (table_id, user_id) VALUES ($1, $2)', [tableId, waiterId]);
    }

    res.json({ success: true, data: { table_id: parseInt(tableId as string), waiter_ids }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al asignar meseros' });
  }
});

export default router;
