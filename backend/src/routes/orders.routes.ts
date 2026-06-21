import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { validate } from '../middleware/validate';
import { processPayment } from '../services/payment.service';
import { isValidTransition } from '../utils/orderStatus';
import { getPagination } from '../utils/pagination';

const router = Router();

const createOrderSchema = z.object({
  qr_token: z.string().uuid(),
  openpay_token: z.string().default('mock_token'),
  items: z.array(z.object({
    dish_id: z.number().int().positive(),
    quantity: z.number().int().positive(),
    note: z.string().default(''),
  })).min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(['ready', 'delivered']),
});

// ---- POST /orders (public — no auth, identified by qr_token) ----
router.post('/', validate(createOrderSchema), async (req: Request, res: Response) => {
  try {
    const { qr_token, openpay_token, items } = req.body;

    // Find table by qr_token
    const tableResult = await query(
      `SELECT t.id, t.number, t.restaurant_id FROM tables t WHERE t.qr_token = $1`,
      [qr_token]
    );

    if (tableResult.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada — QR inválido' });
      return;
    }

    const table = tableResult.rows[0];

    // Fetch dish prices and calculate total
    let total = 0;
    const orderItems: Array<{ dish_id: number; quantity: number; note: string; subtotal: number; name: string }> = [];

    for (const item of items) {
      const dishResult = await query(
        `SELECT d.id, d.name, d.price FROM dishes d 
         JOIN categories c ON d.category_id = c.id 
         WHERE d.id = $1 AND c.restaurant_id = $2 AND d.active = true`,
        [item.dish_id, table.restaurant_id]
      );

      if (dishResult.rows.length === 0) {
        res.status(400).json({ success: false, data: null, error: `Platillo ${item.dish_id} no disponible` });
        return;
      }

      const dish = dishResult.rows[0];
      const subtotal = parseFloat(dish.price) * item.quantity;
      total += subtotal;

      orderItems.push({
        dish_id: dish.id,
        quantity: item.quantity,
        note: item.note,
        subtotal,
        name: dish.name,
      });
    }

    // Process payment (mock)
    const payment = await processPayment(total, openpay_token);
    if (!payment.success) {
      res.status(402).json({ success: false, data: null, error: 'Pago rechazado' });
      return;
    }

    // Create order
    const orderResult = await query(
      'INSERT INTO orders (table_id, status, total, openpay_charge_id) VALUES ($1, $2, $3, $4) RETURNING id, status, total, created_at',
      [table.id, 'paid', total, payment.charge_id]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await query(
        'INSERT INTO order_items (order_id, dish_id, quantity, note, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.dish_id, item.quantity, item.note, item.subtotal]
      );
    }

    // Emit Socket.io event — order:new
    const io = req.app.get('io');
    if (io) {
      io.to(`restaurant:${table.restaurant_id}`).emit('order:new', {
        order_id: order.id,
        table_number: table.number,
        items: orderItems.map((i) => ({ dish_name: i.name, quantity: i.quantity, note: i.note })),
        created_at: order.created_at,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        order_id: order.id,
        total: order.total,
        status: order.status,
        items: orderItems.map((i) => ({
          dish_id: i.dish_id,
          name: i.name,
          quantity: i.quantity,
          subtotal: i.subtotal.toFixed(2),
        })),
      },
      error: null,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, data: null, error: 'Error al crear orden' });
  }
});

// ---- PATCH /orders/:id/status (authenticated staff) ----
router.patch('/:id/status', authenticate, requireRole('admin', 'waiter'), validate(updateStatusSchema), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Get current order + table info
    const orderResult = await query(
      `SELECT o.id, o.status, o.table_id, t.number as table_number, t.restaurant_id
       FROM orders o
       JOIN tables t ON o.table_id = t.id
       WHERE o.id = $1 AND t.restaurant_id = $2`,
      [orderId, req.user!.restaurantId]
    );

    if (orderResult.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Orden no encontrada' });
      return;
    }

    const order = orderResult.rows[0];

    // Validate state transition: paid → ready → delivered
    if (!isValidTransition(order.status, status)) {
      res.status(409).json({
        success: false,
        data: null,
        error: `Transición inválida: ${order.status} → ${status}`,
      });
      return;
    }

    await query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);

    const io = req.app.get('io');
    if (io) {
      const room = `restaurant:${order.restaurant_id}`;

      // Evento genérico en CADA transición — lo consume el dashboard para
      // mantener en vivo el conteo de pedidos activos (incl. delivered).
      io.to(room).emit('order:status', {
        order_id: parseInt(orderId as string),
        status,
        table_number: order.table_number,
      });

      // Evento específico para la alerta del mesero cuando el platillo está listo
      if (status === 'ready') {
        const itemsResult = await query(
          `SELECT d.name as dish_name, oi.quantity FROM order_items oi
           JOIN dishes d ON oi.dish_id = d.id WHERE oi.order_id = $1`,
          [orderId]
        );

        io.to(room).emit('order:ready', {
          order_id: parseInt(orderId as string),
          table_number: order.table_number,
          table_id: order.table_id,
          items: itemsResult.rows,
        });
      }
    }

    res.json({ success: true, data: { order_id: parseInt(orderId as string), status }, error: null });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al actualizar estado' });
  }
});

// ---- GET /orders (admin) ----
router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const { status, table_id, date } = req.query;

    // WHERE compartido por la consulta de conteo y la de datos
    const params: any[] = [req.user!.restaurantId];
    let where = ' WHERE t.restaurant_id = $1';
    let paramIndex = 2;

    if (status) {
      where += ` AND o.status = $${paramIndex++}`;
      params.push(status);
    }
    if (table_id) {
      where += ` AND o.table_id = $${paramIndex++}`;
      params.push(table_id);
    }
    if (date) {
      where += ` AND DATE(o.created_at) = $${paramIndex++}`;
      params.push(date);
    }

    const fromClause = ` FROM orders o JOIN tables t ON o.table_id = t.id${where}`;

    // Una sola consulta: los items se agregan con json_agg (sin N+1)
    let sql = `
      SELECT o.id as order_id, t.number as table_number, o.status, o.total, o.created_at,
        COALESCE((
          SELECT json_agg(json_build_object(
            'dish_id', oi.dish_id,
            'name', d.name,
            'quantity', oi.quantity,
            'note', oi.note,
            'subtotal', oi.subtotal
          ))
          FROM order_items oi JOIN dishes d ON oi.dish_id = d.id
          WHERE oi.order_id = o.id
        ), '[]'::json) AS items
      ${fromClause}
      ORDER BY o.created_at DESC
    `;

    // Paginación opt-in (data sigue siendo arreglo; meta se agrega si hay limit)
    const { limit, offset } = getPagination(req.query as Record<string, unknown>);
    let total = 0;
    if (limit !== null) {
      const countResult = await query(`SELECT COUNT(*)::int AS total${fromClause}`, params);
      total = countResult.rows[0]?.total ?? 0;
      sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    const result = await query(sql, params);
    const orders = result.rows;

    res.json({
      success: true,
      data: orders,
      error: null,
      ...(limit !== null && { meta: { total, limit, offset } }),
    });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ success: false, data: null, error: 'Error al obtener órdenes' });
  }
});

// ---- GET /menu/:qr_token (public — client PWA) ----
router.get('/menu/:qr_token', async (req: Request, res: Response) => {
  try {
    const { qr_token } = req.params;

    const tableResult = await query(
      `SELECT t.id, t.number, t.restaurant_id, r.name as restaurant_name
       FROM tables t JOIN restaurants r ON t.restaurant_id = r.id
       WHERE t.qr_token = $1`,
      [qr_token]
    );

    if (tableResult.rows.length === 0) {
      res.status(404).json({ success: false, data: null, error: 'Mesa no encontrada' });
      return;
    }

    const table = tableResult.rows[0];

    const categoriesResult = await query(
      `SELECT c.id, c.name, c.sort_order FROM categories c
       WHERE c.restaurant_id = $1
       AND EXISTS (SELECT 1 FROM dishes d WHERE d.category_id = c.id AND d.active = true)
       ORDER BY c.sort_order`,
      [table.restaurant_id]
    );

    const categories = await Promise.all(
      categoriesResult.rows.map(async (cat) => {
        const dishesResult = await query(
          'SELECT id, name, description, price, image_url FROM dishes WHERE category_id = $1 AND active = true ORDER BY name',
          [cat.id]
        );
        return { ...cat, dishes: dishesResult.rows };
      })
    );

    res.json({
      success: true,
      data: {
        restaurant_name: table.restaurant_name,
        table_number: table.number,
        table_id: table.id,
        categories,
      },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: 'Error al obtener menú' });
  }
});

export default router;
