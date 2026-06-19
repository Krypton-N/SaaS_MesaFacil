/**
 * Lógica de transición de estados de una orden.
 *
 * Flujo válido: pending_payment → paid → ready → delivered
 * (pending_payment → paid lo realiza el pago al crear la orden; el personal
 *  solo avanza paid → ready → delivered).
 *
 * Función pura, sin dependencias, para reutilizar en rutas y probar con tests.
 */

export type OrderStatus = 'pending_payment' | 'paid' | 'ready' | 'delivered';

const STAFF_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: 'ready',
  ready: 'delivered',
};

/** Devuelve el siguiente estado permitido para el personal, o null si no hay. */
export function nextOrderStatus(current: string): OrderStatus | null {
  return STAFF_TRANSITIONS[current as OrderStatus] ?? null;
}

/** Indica si avanzar de `current` a `next` es una transición válida. */
export function isValidTransition(current: string, next: string): boolean {
  return nextOrderStatus(current) === next;
}
