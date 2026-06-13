import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/database';
import { authenticate, generateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ---- Schemas ----

const registerSchema = z.object({
  restaurant_name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---- POST /auth/register ----
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { restaurant_name, email, password } = req.body;

    // Check if email already exists
    const existing = await query('SELECT id FROM restaurants WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, data: null, error: 'Email ya registrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create restaurant
    const restaurantResult = await query(
      'INSERT INTO restaurants (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name',
      [restaurant_name, email, passwordHash]
    );
    const restaurant = restaurantResult.rows[0];

    // Create admin user for this restaurant
    await query(
      'INSERT INTO users (restaurant_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [restaurant.id, 'Administrador', email, passwordHash, 'admin']
    );

    // Get admin user
    const userResult = await query('SELECT id, role FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    const token = generateToken({
      userId: user.id,
      restaurantId: restaurant.id,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: { token, restaurant: { id: restaurant.id, name: restaurant.name } },
      error: null,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, data: null, error: 'Error al registrar' });
  }
});

// ---- POST /auth/login ----
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // First try users table
    const userResult = await query(
      'SELECT u.id, u.restaurant_id, u.name, u.email, u.password_hash, u.role FROM users u WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ success: false, data: null, error: 'Credenciales inválidas' });
      return;
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      res.status(401).json({ success: false, data: null, error: 'Credenciales inválidas' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      restaurantId: user.restaurant_id,
      role: user.role,
    });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, role: user.role },
      },
      error: null,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, data: null, error: 'Error al iniciar sesión' });
  }
});

export default router;
