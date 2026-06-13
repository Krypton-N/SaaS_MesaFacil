/**
 * Mock Payment Service
 * 
 * Simulates OpenPay payment processing for development/school project.
 * The full UI checkout flow works, but no real charges are made.
 * 
 * To connect a real payment gateway later, replace the implementation
 * of processPayment() — no changes needed in routes or controllers.
 */

export interface PaymentResult {
  success: boolean;
  charge_id: string;
  amount: number;
  status: 'completed' | 'failed';
  message: string;
}

/**
 * Simulates processing a payment.
 * Always succeeds after a short delay to mimic real gateway latency.
 * 
 * @param amount - Total amount to charge
 * @param token - Payment token (from OpenPay.js in the frontend — mocked)
 * @returns PaymentResult with a fake charge_id
 */
export async function processPayment(amount: number, token: string): Promise<PaymentResult> {
  // Simulate gateway latency (500-1200ms)
  const delay = 500 + Math.random() * 700;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Generate a realistic-looking mock charge ID
  const chargeId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  console.log(`💳 [MOCK] Payment processed: $${amount.toFixed(2)} → ${chargeId}`);

  return {
    success: true,
    charge_id: chargeId,
    amount,
    status: 'completed',
    message: 'Pago simulado exitoso',
  };
}

/**
 * Simulates verifying a payment status.
 */
export async function verifyPayment(chargeId: string): Promise<PaymentResult> {
  return {
    success: true,
    charge_id: chargeId,
    amount: 0,
    status: 'completed',
    message: 'Pago verificado (mock)',
  };
}
