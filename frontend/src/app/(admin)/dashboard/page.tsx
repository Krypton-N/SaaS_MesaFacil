"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, Chip, Button } from '@/components/ui';

interface DashboardStats {
  salesToday: number;
  activeOrdersCount: number;
  reservationsToday: number;
  avgTicket: number;
}

interface OrderItem {
  dish_name: string;
  quantity: number;
  note?: string;
}

interface Order {
  order_id: number;
  table_number: number;
  status: 'pending_payment' | 'paid' | 'ready' | 'delivered';
  total: string;
  created_at: string;
  items: Array<{ name: string; quantity: number; note: string }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    activeOrdersCount: 0,
    reservationsToday: 0,
    avgTicket: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fecha de hoy (local) en formato YYYY-MM-DD para filtrar reservas
      const today = new Date().toLocaleDateString('en-CA');

      const [ordersRes, reservationsRes] = await Promise.all([
        api.get<Order[]>('/orders'),
        api.get<Array<{ status: string }>>(`/reservations?date=${today}`),
      ]);

      if (ordersRes.success && ordersRes.data) {
        const fetchedOrders = ordersRes.data;
        setOrders(fetchedOrders);

        // Calculate simple metrics for today
        const totalSales = fetchedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
        const activeOrders = fetchedOrders.filter(o => o.status === 'paid' || o.status === 'ready').length;
        const avg = fetchedOrders.length > 0 ? totalSales / fetchedOrders.length : 0;

        // Reservas reales de hoy (excluyendo las canceladas)
        const reservationsToday = reservationsRes.success && reservationsRes.data
          ? reservationsRes.data.filter(r => r.status !== 'cancelled').length
          : 0;

        setStats({
          salesToday: totalSales,
          activeOrdersCount: activeOrders,
          reservationsToday,
          avgTicket: avg,
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'paid' ? 'ready' : 'delivered';
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: nextStatus });
      if (res.success) {
        fetchDashboardData();
      } else {
        alert(res.error || 'No se pudo actualizar el pedido');
      }
    } catch (err) {
      console.error('Failed to update status:', err);
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

  const getStatusChipVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'primary';
      case 'ready':
        return 'success';
      case 'delivered':
        return 'default';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado (Preparando)';
      case 'ready':
        return 'Listo para servir';
      case 'delivered':
        return 'Entregado';
      default:
        return status;
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Welcome banner */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-heading">
          ¡Hola, Administrador!
        </h1>
        <p className="text-secondary mt-1">Este es el estado de tu restaurante "La Terraza de MesaFácil" el día de hoy.</p>
      </div>

      {/* Grid KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverable={false} className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              monetization_on
            </span>
          </div>
          <div>
            <p className="text-secondary text-xs font-bold tracking-wider uppercase">Ventas del Día</p>
            <p className="text-2xl font-black font-heading mt-1 text-on-surface">
              ${stats.salesToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </Card>

        <Card hoverable={false} className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              restaurant
            </span>
          </div>
          <div>
            <p className="text-secondary text-xs font-bold tracking-wider uppercase">Pedidos Activos</p>
            <p className="text-2xl font-black font-heading mt-1 text-on-surface">
              {stats.activeOrdersCount}
            </p>
          </div>
        </Card>

        <Card hoverable={false} className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-success-light text-success flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              event_available
            </span>
          </div>
          <div>
            <p className="text-secondary text-xs font-bold tracking-wider uppercase">Reservas Hoy</p>
            <p className="text-2xl font-black font-heading mt-1 text-on-surface">
              {stats.reservationsToday}
            </p>
          </div>
        </Card>

        <Card hoverable={false} className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              receipt
            </span>
          </div>
          <div>
            <p className="text-secondary text-xs font-bold tracking-wider uppercase">Ticket Promedio</p>
            <p className="text-2xl font-black font-heading mt-1 text-on-surface">
              ${stats.avgTicket.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </Card>
      </div>

      {/* Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Orders List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-extrabold text-on-surface tracking-tight font-heading">
              Pedidos en tiempo real
            </h3>
            <Button size="sm" variant="ghost" onClick={fetchDashboardData} icon="refresh">
              Actualizar
            </Button>
          </div>

          <div className="flex flex-col gap-4 max-h-[500px] overflow-y-auto no-scrollbar">
            {orders.length === 0 ? (
              <Card hoverable={false} className="py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-secondary text-5xl mb-2">
                  inbox
                </span>
                <p className="text-on-surface font-bold font-heading">No hay pedidos hoy</p>
                <p className="text-secondary text-sm mt-1">Los pedidos de tus mesas aparecerán aquí en tiempo real.</p>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.order_id} hoverable={false} className="p-6 relative flex flex-col gap-4 border border-surface-container hover:shadow-ambient transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold font-heading text-lg">Mesa #{order.table_number}</h4>
                      <p className="text-secondary text-xs font-medium">Orden #{order.order_id} • {new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip variant={getStatusChipVariant(order.status)}>
                        {getStatusText(order.status)}
                      </Chip>
                      <span className="text-lg font-black text-primary">${parseFloat(order.total).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="h-[1px] bg-surface-container" />

                  {/* Items List */}
                  <div className="flex flex-col gap-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <span className="bg-surface-container text-on-surface-variant font-bold text-xs px-2 py-0.5 rounded">
                            {item.quantity}x
                          </span>
                          <span className="text-on-surface font-semibold">{item.name}</span>
                          {item.note && (
                            <span className="text-secondary text-xs italic">({item.note})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action button */}
                  {order.status !== 'delivered' && (
                    <div className="flex justify-end pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.order_id, order.status)}
                        icon={order.status === 'paid' ? 'soup_kitchen' : 'check_circle'}
                      >
                        {order.status === 'paid' ? 'Marcar listo en cocina' : 'Marcar como entregado'}
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Quick Utilities / Table Status Map */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-extrabold text-on-surface tracking-tight font-heading">
            Ocupación de mesas
          </h3>

          <Card hoverable={false} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((tableNum) => {
                // simple layout logic for demo
                const isOccupied = orders.some(o => o.table_number === tableNum && o.status !== 'delivered');
                return (
                  <div
                    key={tableNum}
                    className={`
                      aspect-square rounded-2xl flex flex-col items-center justify-center p-3 border font-heading select-none
                      ${isOccupied
                        ? 'bg-primary-fixed border-primary-container text-primary font-black shadow-sm'
                        : 'bg-surface-container-low border-surface-variant text-secondary font-bold hover:bg-surface-container-high cursor-pointer'
                      }
                    `}
                  >
                    <span className="text-xs uppercase font-extrabold text-secondary-fixed-dim">Mesa</span>
                    <span className="text-xl">{tableNum}</span>
                    <div className="mt-1 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${isOccupied ? 'bg-primary animate-pulse' : 'bg-secondary'}`} />
                      <span className="text-[10px] tracking-wide uppercase font-bold">{isOccupied ? 'Activa' : 'Libre'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-[1px] bg-surface-container" />

            <div className="flex flex-col gap-2.5 text-sm font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-primary rounded-full" />
                <span className="text-on-surface">Mesa con pedido en curso</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-surface-container-dim rounded-full" />
                <span className="text-on-surface">Mesa vacía / disponible</span>
              </div>
            </div>
          </Card>

          {/* Quick links */}
          <Card hoverable={false} className="p-5 flex flex-col gap-3">
            <h4 className="font-extrabold font-heading text-sm uppercase tracking-wider text-secondary">Enlaces rápidos</h4>
            <a href="/menu" className="flex items-center justify-between text-sm font-semibold text-primary hover:underline py-1">
              <span>Administrar menú digital</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
            <a href="/tables" className="flex items-center justify-between text-sm font-semibold text-primary hover:underline py-1">
              <span>Generar códigos QR de mesas</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
