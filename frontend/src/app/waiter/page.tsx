"use client";

import React, { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { api } from '@/lib/api';
import { Card, Chip, Button } from '@/components/ui';

interface ReadyOrder {
  order_id: number;
  table_number: number;
  items: Array<{ dish_name: string; quantity: number }>;
}

export default function WaiterPage() {
  const [orders, setOrders] = useState<ReadyOrder[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertOrder, setAlertOrder] = useState<ReadyOrder | null>(null);

  // Audio alert bell
  const playBellAlert = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2047/2047-84.wav');
      audio.volume = 0.6;
      audio.play();
    } catch (err) {
      console.log('Audio bell alert failed to play', err);
    }
  };

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

  const fetchReadyOrders = async () => {
    try {
      const res = await api.get<any[]>('/orders');
      if (res.success && res.data) {
        // Only ready orders wait for waitstaff delivery
        const readyList = res.data
          .filter(o => o.status === 'ready')
          .map(o => ({
            order_id: o.order_id,
            table_number: o.table_number,
            items: o.items.map((i: any) => ({ dish_name: i.name, quantity: i.quantity }))
          }));
        setOrders(readyList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadyOrders();

    if (!restaurantId) return;

    // Connect to Socket
    const socket = getSocket();
    socket.emit('join:restaurant', restaurantId);

    // Listen for kitchen completion alerts
    socket.on('order:ready', (data: any) => {
      const newReady: ReadyOrder = {
        order_id: data.order_id,
        table_number: data.table_number,
        items: data.items
      };
      setOrders(prev => [...prev, newReady]);
      setAlertOrder(newReady);
      playBellAlert();
    });

    return () => {
      socket.off('order:ready');
    };
  }, [restaurantId]);

  const handleMarkDelivered = async (orderId: number) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: 'delivered' });
      if (res.success) {
        setOrders(prev => prev.filter(o => o.order_id !== orderId));
        if (alertOrder?.order_id === orderId) {
          setAlertOrder(null);
        }
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
    <div className="min-h-screen bg-background text-on-background flex flex-col p-6 select-none max-w-md mx-auto shadow-lifted relative">
      {/* Waiter Header */}
      <header className="flex justify-between items-center pb-4 border-b border-surface-variant h-16">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-orange animate-pulse-dot">
            <span className="material-symbols-outlined text-on-primary text-2xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              groups
            </span>
          </div>
          <div>
            <h1 className="text-base font-extrabold font-heading text-on-surface">MesaFácil 🧑‍🍳 Meseros</h1>
            <p className="text-secondary text-[10px] font-bold uppercase tracking-wider">Servicio de mesas activo</p>
          </div>
        </div>

        <Chip variant="success" className="text-[10px] py-1">En Línea</Chip>
      </header>

      {/* Main waiter board */}
      <main className="flex-1 mt-6 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        {/* Real-time alert card popover */}
        {alertOrder && (
          <div className="bg-primary/10 border-2 border-primary rounded-2xl p-5 animate-scale-in flex flex-col gap-3 relative shadow-orange">
            <button
              onClick={() => setAlertOrder(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-primary hover:bg-primary/20"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <div className="flex items-center gap-2 text-primary font-heading font-black">
              <span className="material-symbols-outlined animate-bounce">notifications_active</span>
              <span>¡PLATILLO LISTO EN COCINA!</span>
            </div>
            <div>
              <p className="text-2xl font-black text-on-surface font-heading leading-tight">Llevar a Mesa #{alertOrder.table_number}</p>
              <p className="text-secondary text-xs mt-0.5">Orden #{alertOrder.order_id}</p>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {alertOrder.items.map((i, idx) => (
                <div key={idx} className="text-sm font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <span className="bg-primary/20 text-primary font-black px-1.5 py-0.5 rounded text-[11px]">{i.quantity}x</span>
                  <span>{i.dish_name}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleMarkDelivered(alertOrder.order_id)}
              className="shadow-orange py-3 font-bold text-sm mt-2"
            >
              Entregado a comensal
            </Button>
          </div>
        )}

        {/* Deliveries list */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold tracking-wider uppercase text-secondary">Pendientes de Servir ({orders.length})</h3>

          {orders.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-secondary">
              <span className="material-symbols-outlined text-5xl mb-2">done_all</span>
              <p className="text-on-surface font-extrabold font-heading">Todas las mesas servidas</p>
              <p className="text-xs mt-1">No hay platillos esperando en el mostrador de cocina.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((o) => (
                <Card key={o.order_id} hoverable={false} className="p-5 border border-surface-container flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold font-heading text-lg">Mesa #{o.table_number}</h4>
                      <p className="text-secondary text-[10px] font-semibold mt-0.5">Orden #{o.order_id}</p>
                    </div>
                    <Chip variant="success">Listo en Cocina</Chip>
                  </div>

                  <div className="h-[1px] bg-surface-container" />

                  <div className="flex flex-col gap-2">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded text-[10px]">
                            {item.quantity}x
                          </span>
                          <span className="text-on-surface">{item.dish_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleMarkDelivered(o.order_id)}
                    fullWidth
                    size="sm"
                    icon="check"
                  >
                    Entregado a comensal
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
