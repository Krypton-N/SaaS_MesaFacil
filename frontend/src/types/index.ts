// ============================================================
// MesaFácil — Frontend TypeScript Types
// ============================================================

export type UserRole = 'admin' | 'waiter';
export type OrderStatus = 'pending_payment' | 'paid' | 'ready' | 'delivered';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Restaurant {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  dishes?: Dish[];
}

export interface Dish {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  active: boolean;
}

export interface Table {
  id: number;
  number: string;
  qr_token: string;
  waiters: Pick<User, 'id' | 'name'>[];
}

export interface Order {
  order_id: number;
  table_number: string;
  status: OrderStatus;
  total: string;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  dish_id: number;
  name: string;
  quantity: number;
  note?: string;
  subtotal: string;
}

export interface Reservation {
  id: number;
  table_id: number | null;
  table_number?: string;
  customer_name: string;
  phone: string;
  party_size: number;
  datetime: string;
  status: ReservationStatus;
}

export interface CartItem {
  dish_id: number;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  note: string;
}

export interface MenuData {
  restaurant_name: string;
  table_number: string;
  table_id: number;
  categories: Category[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: string | null;
}
