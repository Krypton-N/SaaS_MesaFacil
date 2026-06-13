"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Button, Input } from '@/components/ui';

interface CartItem {
  dish_id: number;
  name: string;
  price: number;
  quantity: number;
  note: string;
}

export default function ClientCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Form states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, [qrToken]);

  const loadCart = () => {
    try {
      const stored = localStorage.getItem(`mesafacil_cart_${qrToken}`);
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPaymentLoading(true);

    const total = calculateTotal();
    if (total <= 0) return;

    try {
      // Create request payload
      const orderData = {
        qr_token: qrToken,
        openpay_token: 'mock_token_' + Math.random().toString(36).substring(2),
        items: cartItems.map(item => ({
          dish_id: item.dish_id,
          quantity: item.quantity,
          note: item.note || ''
        }))
      };

      const res = await api.post('/orders', orderData);
      if (res.success && res.data) {
        setSuccessOrder(res.data);
        // Clear local storage cart
        localStorage.removeItem(`mesafacil_cart_${qrToken}`);
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        setError(res.error || 'Pago rechazado o error al procesar orden');
      }
    } catch (err) {
      setError('Error al conectar con la pasarela de pago');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary-container">
          progress_activity
        </span>
      </div>
    );
  }

  const total = calculateTotal();

  if (successOrder) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center text-center p-4 select-none">
        <div className="w-16 h-16 rounded-full bg-success-light text-success flex items-center justify-center shadow-md animate-scale-in mb-5">
          <span className="material-symbols-outlined text-4xl font-extrabold">check</span>
        </div>

        <h3 className="text-2xl font-black text-on-surface font-heading leading-tight">
          ¡Pago Exitoso!
        </h3>
        <p className="text-secondary text-sm mt-1 max-w-xs">
          Tu orden #{successOrder.order_id} ha sido enviada a cocina.
        </p>

        {/* Dynamic receipt */}
        <Card hoverable={false} className="w-full border border-dashed border-surface-variant p-6 mt-6 bg-surface-container-lowest text-left flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-secondary uppercase tracking-wider">
            <span>Recibo de Pago</span>
            <span>Mesa #{successOrder.table_number || 'QR'}</span>
          </div>

          <div className="h-[1px] border-t border-dashed border-surface-variant my-1" />

          <div className="flex flex-col gap-2">
            {successOrder.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm font-semibold">
                <span className="text-on-surface-variant">{item.quantity}x {item.name}</span>
                <span className="text-on-surface">${parseFloat(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="h-[1px] border-t border-dashed border-surface-variant my-1" />

          <div className="flex justify-between items-center font-black">
            <span className="text-on-surface text-base">Monto Total</span>
            <span className="text-primary text-lg">${parseFloat(successOrder.total).toFixed(2)}</span>
          </div>
        </Card>

        <p className="text-secondary text-xs mt-6 leading-relaxed max-w-xs font-medium">
          Recibirás una alerta del mesero cuando tu platillo esté listo en la mesa. ¡Buen provecho!
        </p>

        <Button
          className="mt-6 font-extrabold w-full"
          onClick={() => router.push(`/mesa/${qrToken}`)}
        >
          Volver al Menú
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6 select-none">
      <h3 className="text-xl font-extrabold text-on-surface tracking-tight font-heading">
        Pago Seguro Simulado
      </h3>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container text-sm font-semibold rounded-xl flex items-center gap-2 border border-error/20 animate-scale-in">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePay} className="flex flex-col gap-5">
        {/* Payment summary */}
        <Card hoverable={false} className="p-4 bg-primary-fixed border border-primary/10 flex justify-between items-center">
          <span className="font-bold text-primary text-sm uppercase tracking-wider">Total a cobrar:</span>
          <span className="font-black text-primary text-xl">${total.toFixed(2)}</span>
        </Card>

        {/* Inputs */}
        <Input
          label="Titular de la tarjeta"
          placeholder="Ej: Sofía Gómez"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          required
        />

        <Input
          label="Número de tarjeta"
          placeholder="4152 •••• •••• ••••"
          maxLength={19}
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Expiración"
            placeholder="MM/AA"
            maxLength={5}
            value={cardExpiry}
            onChange={(e) => setCardExpiry(e.target.value)}
            required
          />
          <Input
            label="CVV"
            placeholder="123"
            maxLength={3}
            type="password"
            value={cardCvv}
            onChange={(e) => setCardCvv(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-secondary font-semibold uppercase tracking-wider justify-center mt-2">
          <span className="material-symbols-outlined text-success text-base">lock</span>
          <span>Conexión SSL encriptada</span>
        </div>

        <Button
          type="submit"
          loading={paymentLoading}
          fullWidth
          className="shadow-orange py-4 font-bold text-base mt-2"
        >
          Pagar Orden
        </Button>
      </form>
    </div>
  );
}
