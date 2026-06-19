import { describe, it, expect } from 'vitest';
import { processPayment, verifyPayment } from './payment.service';

describe('payment.service (mock)', () => {
  it('procesa un pago exitoso devolviendo un charge_id con prefijo mock_', async () => {
    const result = await processPayment(149.5, 'mock_token_abc');
    expect(result.success).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.amount).toBe(149.5);
    expect(result.charge_id).toMatch(/^mock_/);
  });

  it('genera charge_ids distintos en pagos distintos', async () => {
    const a = await processPayment(10, 't');
    const b = await processPayment(10, 't');
    expect(a.charge_id).not.toBe(b.charge_id);
  });

  it('verifica un pago existente', async () => {
    const verification = await verifyPayment('mock_123');
    expect(verification.success).toBe(true);
    expect(verification.charge_id).toBe('mock_123');
  });
});
