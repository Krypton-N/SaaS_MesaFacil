import { describe, it, expect } from 'vitest';
import { nextOrderStatus, isValidTransition } from './orderStatus';

describe('orderStatus — transiciones del flujo de cocina/servicio', () => {
  it('avanza paid → ready → delivered', () => {
    expect(nextOrderStatus('paid')).toBe('ready');
    expect(nextOrderStatus('ready')).toBe('delivered');
  });

  it('no permite avanzar desde estados finales o iniciales del personal', () => {
    expect(nextOrderStatus('delivered')).toBeNull();
    expect(nextOrderStatus('pending_payment')).toBeNull();
    expect(nextOrderStatus('inexistente')).toBeNull();
  });

  it('valida transiciones correctas', () => {
    expect(isValidTransition('paid', 'ready')).toBe(true);
    expect(isValidTransition('ready', 'delivered')).toBe(true);
  });

  it('rechaza transiciones inválidas (saltos o retrocesos)', () => {
    expect(isValidTransition('paid', 'delivered')).toBe(false);
    expect(isValidTransition('ready', 'paid')).toBe(false);
    expect(isValidTransition('delivered', 'ready')).toBe(false);
  });
});
