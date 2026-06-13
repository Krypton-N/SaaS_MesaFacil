import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  console.log('🌱 Seeding MesaFácil database...\n');

  const passwordHash = await bcrypt.hash('password123', 12);

  try {
    // ---- 1. Restaurant ----
    const restaurantResult = await pool.query(
      `INSERT INTO restaurants (name, email, password_hash) 
       VALUES ($1, $2, $3) RETURNING id`,
      ['La Terraza de MesaFácil', 'admin@mesafacil.com', passwordHash]
    );
    const restaurantId = restaurantResult.rows[0].id;
    console.log(`✅ Restaurant created (id: ${restaurantId})`);

    // ---- 2. Users (1 admin + 2 waiters) ----
    const adminResult = await pool.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [restaurantId, 'Administrador', 'admin@mesafacil.com', passwordHash, 'admin']
    );
    console.log(`✅ Admin user created (id: ${adminResult.rows[0].id})`);

    const waiter1Result = await pool.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [restaurantId, 'Carlos Mesero', 'carlos@mesafacil.com', passwordHash, 'waiter']
    );

    const waiter2Result = await pool.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [restaurantId, 'Briseth Mesera', 'briseth@mesafacil.com', passwordHash, 'waiter']
    );
    console.log(`✅ 2 waiters created`);

    // ---- 3. Categories ----
    const categories = [
      { name: 'Entradas', sort_order: 1 },
      { name: 'Platos Fuertes', sort_order: 2 },
      { name: 'Bebidas', sort_order: 3 },
      { name: 'Postres', sort_order: 4 },
    ];

    const categoryIds: number[] = [];
    for (const cat of categories) {
      const result = await pool.query(
        'INSERT INTO categories (restaurant_id, name, sort_order) VALUES ($1, $2, $3) RETURNING id',
        [restaurantId, cat.name, cat.sort_order]
      );
      categoryIds.push(result.rows[0].id);
    }
    console.log(`✅ ${categories.length} categories created`);

    // ---- 4. Dishes ----
    const dishes = [
      // Entradas (categoryIds[0])
      { category_id: categoryIds[0], name: 'Guacamole con Totopos', description: 'Aguacate fresco, tomate, cilantro, cebolla y limón', price: 85.00 },
      { category_id: categoryIds[0], name: 'Queso Fundido', description: 'Queso Oaxaca gratinado con chorizo y tortillas de maíz', price: 120.00 },
      // Platos Fuertes (categoryIds[1])
      { category_id: categoryIds[1], name: 'Tacos al Pastor', description: 'Carne al pastor con piña, cilantro y cebolla (4 pzas)', price: 95.00 },
      { category_id: categoryIds[1], name: 'Enchiladas Verdes', description: 'Pollo desmenuzado, salsa verde, crema y queso fresco', price: 110.00 },
      { category_id: categoryIds[1], name: 'Arrachera a la Parrilla', description: 'Corte de res marinado, frijoles charros, guacamole y tortillas', price: 220.00 },
      // Bebidas (categoryIds[2])
      { category_id: categoryIds[2], name: 'Agua de Horchata', description: 'Bebida tradicional de arroz con canela y vainilla', price: 45.00 },
      { category_id: categoryIds[2], name: 'Limonada Natural', description: 'Limón fresco con agua mineral o natural', price: 40.00 },
      // Postres (categoryIds[3])
      { category_id: categoryIds[3], name: 'Flan Napolitano', description: 'Flan casero con caramelo, receta de la casa', price: 65.00 },
    ];

    for (const dish of dishes) {
      await pool.query(
        'INSERT INTO dishes (category_id, name, description, price, active) VALUES ($1, $2, $3, $4, true)',
        [dish.category_id, dish.name, dish.description, dish.price]
      );
    }
    console.log(`✅ ${dishes.length} dishes created`);

    // ---- 5. Tables ----
    const tableNames = ['1', '2', '3', 'Terraza A', 'Terraza B'];
    const tableIds: number[] = [];

    for (const name of tableNames) {
      const result = await pool.query(
        'INSERT INTO tables (restaurant_id, number) VALUES ($1, $2) RETURNING id, qr_token',
        [restaurantId, name]
      );
      tableIds.push(result.rows[0].id);
      console.log(`  🪑 Table "${name}" → QR token: ${result.rows[0].qr_token}`);
    }
    console.log(`✅ ${tableNames.length} tables created`);

    // ---- 6. Table-Waiter Assignments ----
    // Carlos serves tables 1, 2, 3
    for (let i = 0; i < 3; i++) {
      await pool.query('INSERT INTO table_waiters (table_id, user_id) VALUES ($1, $2)', [tableIds[i], waiter1Result.rows[0].id]);
    }
    // Briseth serves Terraza A, Terraza B
    for (let i = 3; i < 5; i++) {
      await pool.query('INSERT INTO table_waiters (table_id, user_id) VALUES ($1, $2)', [tableIds[i], waiter2Result.rows[0].id]);
    }
    console.log(`✅ Waiter assignments configured`);

    // ---- 7. Reservations ----
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0);

    const reservations = [
      { table_id: tableIds[0], customer_name: 'Familia García', phone: '55-1234-5678', party_size: 4, datetime: tomorrow.toISOString(), status: 'confirmed' },
      { table_id: null, customer_name: 'Juan Pérez', phone: '55-8765-4321', party_size: 2, datetime: new Date(tomorrow.getTime() + 3600000).toISOString(), status: 'pending' },
      { table_id: tableIds[3], customer_name: 'María López', phone: '55-1111-2222', party_size: 6, datetime: new Date(tomorrow.getTime() + 7200000).toISOString(), status: 'pending' },
    ];

    for (const res of reservations) {
      await pool.query(
        `INSERT INTO reservations (restaurant_id, table_id, customer_name, phone, party_size, datetime, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [restaurantId, res.table_id, res.customer_name, res.phone, res.party_size, res.datetime, res.status]
      );
    }
    console.log(`✅ ${reservations.length} reservations created`);

    console.log(`
  ─────────────────────────────────
  🎉 Seed completed successfully!
  ─────────────────────────────────
  
  📧 Admin login:   admin@mesafacil.com
  🔑 Password:      password123
  
  📧 Waiter 1:      carlos@mesafacil.com
  📧 Waiter 2:      briseth@mesafacil.com
  🔑 All passwords: password123
  ─────────────────────────────────
    `);
  } catch (err: any) {
    if (err.code === '23505') {
      console.error('❌ Seed data already exists. Run the migration fresh first.');
    } else {
      console.error('❌ Seed error:', err.message);
    }
  } finally {
    await pool.end();
  }
}

seed();
