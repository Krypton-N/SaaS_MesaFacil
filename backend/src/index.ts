import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './config/env';
import { pool } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import categoriesRoutes from './routes/categories.routes';
import dishesRoutes from './routes/dishes.routes';
import tablesRoutes from './routes/tables.routes';
import ordersRoutes from './routes/orders.routes';
import reservationsRoutes from './routes/reservations.routes';

// ---- Express App ----
const app = express();
const httpServer = createServer(app);

// ---- Socket.io ----
const io = new SocketServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join restaurant channel
  socket.on('join:restaurant', (restaurantId: number) => {
    const room = `restaurant:${restaurantId}`;
    socket.join(room);
    console.log(`🏠 Socket ${socket.id} joined ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ---- Middlewares ----
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Health Check ----
app.get('/api/v1/health', async (_req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      data: {
        status: 'ok',
        db: 'connected',
        timestamp: dbResult.rows[0].now,
        environment: env.NODE_ENV,
      },
      error: null,
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      data: { status: 'error', db: 'disconnected' },
      error: 'Database connection failed',
    });
  }
});

// ---- API Routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/dishes', dishesRoutes);
app.use('/api/v1/tables', tablesRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/reservations', reservationsRoutes);

// Public menu route (mounted on orders router but accessed publicly)
app.use('/api/v1', ordersRoutes);

// ---- 404 Handler ----
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'Ruta no encontrada',
  });
});

// ---- Global Error Handler ----
app.use(errorHandler);

// ---- Start Server ----
const PORT = parseInt(env.PORT);

httpServer.listen(PORT, () => {
  console.log(`
  🍽️  MesaFácil Backend
  ─────────────────────────
  🌐 API:       http://localhost:${PORT}/api/v1
  🔌 Socket.io: http://localhost:${PORT}
  💚 Health:    http://localhost:${PORT}/api/v1/health
  🔧 Env:       ${env.NODE_ENV}
  ─────────────────────────
  `);
});

export { app, httpServer, io };
