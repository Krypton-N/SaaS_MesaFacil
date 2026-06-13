-- ============================================================
-- MesaFácil v1 — Initial Database Schema
-- PostgreSQL (Supabase)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ---- ENUMS ----

CREATE TYPE user_role AS ENUM ('admin', 'waiter');
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'ready', 'delivered');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- ---- TABLES ----

-- Restaurants: Root entity, everything belongs to a restaurant
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  openpay_merchant_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users: Internal staff (admin, waiters). Always belong to a restaurant.
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role user_role NOT NULL DEFAULT 'waiter',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_restaurant ON users(restaurant_id);
CREATE INDEX idx_users_email ON users(email);

-- Categories: Menu groupings (Entradas, Bebidas, Postres, etc.)
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);

-- Dishes: Menu items belonging to a category
CREATE TABLE dishes (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dishes_category ON dishes(category_id);

-- Tables: Physical restaurant tables with QR tokens
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,
  qr_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE
);

CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_tables_qr_token ON tables(qr_token);

-- Table-Waiters: N:M junction between tables and waiters
CREATE TABLE table_waiters (
  table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (table_id, user_id)
);

-- Orders: One order per device/guest, multiple can be active per table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending_payment',
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  openpay_charge_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Order Items: Individual items within an order
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id INTEGER NOT NULL REFERENCES dishes(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  note TEXT,
  subtotal DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Reservations: Table reservations managed by admin
CREATE TABLE reservations (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_reservations_datetime ON reservations(datetime);
CREATE INDEX idx_reservations_status ON reservations(status);
