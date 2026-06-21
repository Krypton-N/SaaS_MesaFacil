"use client";

import React, { useEffect, useState } from 'react';
import { connectToRestaurant } from '@/lib/socket';
import { api } from '@/lib/api';
import { playAlertBeep, unlockAudio, isAudioUnlocked } from '@/lib/sound';
import { Card, Chip, Button } from '@/components/ui';

interface OrderItem {
  dish_name: string;
  quantity: number;
  note?: string;
}

interface KitchenOrder {
  order_id: number;
  table_number: number;
  items: OrderItem[];
  created_at: string;
  status: 'paid' | 'ready';
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  const enableSound = () => {
    unlockAudio();
    setSoundOn(isAudioUnlocked());
  };

  // Browsers block audio until the user interacts with the page. Unlock on the
  // first interaction anywhere so the kitchen attendant doesn't have to click a button.
  useEffect(() => {
    const handler = () => {
      enableSound();
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('pointerdown', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);

  useEffect(() => {
    // Read user token to extract restaurantId
    const token = localStorage.getItem('mesafacil_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRestaurantId(payload.restaurantId);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const fetchActiveOrders = async () => {
    try {
      const res = await api.get<any[]>('/orders');
      if (res.success && res.data) {
        // Only paid orders should appear in kitchen (preparando)
        const kitchenList = res.data
          .filter(o => o.status === 'paid')
          .map(o => ({
            order_id: o.order_id,
            table_number: o.table_number,
            items: o.items.map((i: any) => ({ dish_name: i.name, quantity: i.quantity, note: i.note })),
            created_at: o.created_at,
            status: o.status
          }));
        setOrders(kitchenList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();

    if (!restaurantId) return;

    // Connect to Socket (autoConnect is disabled, so this opens the connection
    // AND joins the restaurant room — getSocket() alone never connects)
    const socket = connectToRestaurant(restaurantId);

    // Listen for new orders
    socket.on('order:new', (newOrder: any) => {
      setOrders(prev => [...prev, {
        order_id: newOrder.order_id,
        table_number: newOrder.table_number,
        items: newOrder.items,
        created_at: newOrder.created_at,
        status: 'paid'
      }]);
      playAlertBeep();
    });

    return () => {
      socket.off('order:new');
    };
  }, [restaurantId]);

  const handleMarkReady = async (orderId: number) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: 'ready' });
      if (res.success) {
        setOrders(prev => prev.filter(o => o.order_id !== orderId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary-container">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col p-8 select-none">
      {/* Kitchen header */}
      <header className="flex justify-between items-center pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-orange animate-pulse-dot">
            <span className="material-symbols-outlined text-on-primary text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              soup_kitchen
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-black font-heading tracking-tight text-primary-container">MesaFácil 🍳 Cocina</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Monitor de pedidos activos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!soundOn && (
            <button
              onClick={enableSound}
              className="flex items-center gap-2 bg-primary-container text-on-primary px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95"
            >
              <span className="material-symbols-outlined text-base">notifications_active</span>
              Activar sonido
            </button>
          )}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl">
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
            <span className="text-xs font-bold text-zinc-400">Canal Activo en tiempo real</span>
          </div>
        </div>
      </header>

      {/* Orders Grid board */}
      <main className="flex-1 mt-8">
        {orders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center text-zinc-500">
            <span className="material-symbols-outlined text-6xl mb-3">restaurant</span>
            <p className="font-extrabold font-heading text-lg">No hay órdenes pendientes</p>
            <p className="text-xs mt-1">Los platillos pagados por los comensales se listarán aquí en tiempo real.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div
                key={order.order_id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between min-h-[300px] shadow-lg animate-scale-in"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black font-heading text-primary-container">Mesa #{order.table_number}</h3>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5 block">Orden #{order.order_id}</span>
                    </div>

                    {/* Timer count since creation */}
                    <div className="bg-primary/20 text-primary border border-primary/20 px-2 py-1 rounded-lg text-xs font-bold font-heading">
                      {new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="h-[1px] bg-zinc-800 my-4" />

                  {/* Items to prepare */}
                  <div className="flex flex-col gap-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex flex-col gap-1 text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="bg-zinc-800 text-white font-black text-xs px-2.5 py-1 rounded border border-zinc-700">
                            {item.quantity}x
                          </span>
                          <span className="text-zinc-100 font-bold">{item.dish_name}</span>
                        </div>
                        {item.note && (
                          <span className="text-[11px] text-primary font-bold italic ml-9 bg-primary/5 px-2 py-0.5 rounded border border-primary/10 w-fit">
                            Nota: {item.note}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => handleMarkReady(order.order_id)}
                    fullWidth
                    className="bg-primary-container text-on-primary py-3.5 font-bold shadow-orange active:scale-95"
                    icon="check"
                  >
                    Marcar como Listo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
