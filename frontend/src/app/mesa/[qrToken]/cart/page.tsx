"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, QuantitySelector, Chip } from '@/components/ui';

interface CartItem {
  dish_id: number;
  name: string;
  price: number;
  image_url?: string;
  quantity: number;
  note: string;
}

export default function ClientCartPage() {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem(`mesafacil_cart_${qrToken}`, JSON.stringify(items));
    setCartItems(items);
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleQuantityChange = (dishId: number, newQty: number) => {
    const updated = cartItems.map(item =>
      item.dish_id === dishId ? { ...item, quantity: newQty } : item
    );
    saveCart(updated);
  };

  const handleRemoveItem = (dishId: number) => {
    const updated = cartItems.filter(item => item.dish_id !== dishId);
    saveCart(updated);
  };

  const handleNoteChange = (dishId: number, note: string) => {
    const updated = cartItems.map(item =>
      item.dish_id === dishId ? { ...item, note } : item
    );
    saveCart(updated);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

  const subtotal = calculateSubtotal();

  return (
    <div className="animate-fade-in flex flex-col gap-6 select-none">
      <h3 className="text-xl font-extrabold text-on-surface tracking-tight font-heading">
        Tu Carrito de Compras
      </h3>

      {cartItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-secondary text-6xl mb-3">shopping_bag</span>
          <p className="text-on-surface font-extrabold font-heading text-lg">Tu carrito está vacío</p>
          <p className="text-secondary text-sm mt-1 max-w-xs">Explora nuestro delicioso menú y selecciona tus platillos favoritos.</p>
          <Button
            className="mt-6 font-bold"
            onClick={() => router.push(`/mesa/${qrToken}`)}
          >
            Ver Menú
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Cart items list */}
          <div className="flex flex-col gap-4">
            {cartItems.map((item) => (
              <Card key={item.dish_id} hoverable={false} className="p-4 border border-surface-container flex flex-col gap-3 relative">
                {/* Details layout */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-surface-container overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined">flatware</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-extrabold font-heading text-sm text-on-surface line-clamp-1">{item.name}</h4>
                      <p className="text-primary font-black text-xs mt-0.5">${item.price.toFixed(2)} c/u</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.dish_id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>

                {/* Adjuster and Custom note input */}
                <div className="flex justify-between items-center gap-3 bg-surface-container-low/50 p-2.5 rounded-xl">
                  <QuantitySelector
                    value={item.quantity}
                    onChange={(val) => handleQuantityChange(item.dish_id, val)}
                    size="sm"
                  />
                  <span className="font-black text-on-surface text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                </div>

                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-secondary text-base pointer-events-none">
                    edit_note
                  </span>
                  <input
                    type="text"
                    placeholder="Instrucciones especiales (ej: sin cebolla)"
                    value={item.note}
                    onChange={(e) => handleNoteChange(item.dish_id, e.target.value)}
                    className="w-full h-10 bg-surface-container-low text-on-surface font-body text-xs rounded-xl pl-9 pr-3 border border-transparent outline-none focus:border-primary transition-all shadow-inner"
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Totals Summary */}
          <Card hoverable={false} className="p-5 border border-surface-container flex flex-col gap-3 bg-surface-container-low/30">
            <div className="flex justify-between items-center text-sm font-semibold text-on-surface-variant">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-semibold text-on-surface-variant">
              <span>Servicio digital</span>
              <Chip variant="success" className="text-[9px]">Gratis</Chip>
            </div>
            <div className="h-[1px] bg-surface-container my-1" />
            <div className="flex justify-between items-center">
              <span className="font-extrabold font-heading text-base text-on-surface">Total de la orden</span>
              <span className="font-black text-primary text-xl">${subtotal.toFixed(2)}</span>
            </div>
          </Card>

          {/* Place order CTA */}
          <Button
            onClick={() => router.push(`/mesa/${qrToken}/checkout`)}
            fullWidth
            icon="shopping_bag_checkout"
            className="shadow-orange py-4 font-bold text-base mt-2"
          >
            Proceder al Pago
          </Button>
        </div>
      )}
    </div>
  );
}
