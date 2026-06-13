// ============================================================
// MesaFácil — Shared TypeScript Types
// ============================================================

// ---- Enums ----

export type UserRole = 'admin' | 'waiter';
export type OrderStatus = 'pending_payment' | 'paid' | 'ready' | 'delivered';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

// ---- Entities ----

export interface Restaurant {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  openpay_merchant_id?: string;
  created_at: string;
}

export interface User {
  id: number;
  restaurant_id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: number;
  restaurant_id: number;
  name: string;
  sort_order: number;
}

export interface Dish {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string; // decimal comes as string from pg
  image_url: string | null;
  active: boolean;
  created_at: string;
}

export interface Table {
  id: number;
  restaurant_id: number;
  number: string;
  qr_token: string;
}

export interface TableWithWaiters extends Table {
  waiters: Pick<User, 'id' | 'name'>[];
}

export interface Order {
  id: number;
  table_id: number;
  status: OrderStatus;
  total: string;
  openpay_charge_id: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  dish_id: number;
  quantity: number;
  note: string | null;
  subtotal: string;
}

export interface Reservation {
  id: number;
  restaurant_id: number;
  table_id: number | null;
  customer_name: string;
  phone: string | null;
  party_size: number;
  datetime: string;
  status: ReservationStatus;
  created_at: string;
}

// ---- API Response ----

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ---- Socket.io Events ----

export interface OrderNewEvent {
  order_id: number;
  table_number: string;
  items: Array<{
    dish_name: string;
    quantity: number;
    note: string | null;
  }>;
  created_at: string;
}

export interface OrderReadyEvent {
  order_id: number;
  table_number: string;
  table_id: number;
  items: Array<{
    dish_name: string;
    quantity: number;
  }>;
}
