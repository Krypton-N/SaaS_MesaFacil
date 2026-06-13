"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, Chip, Button, Input } from '@/components/ui';

interface Reservation {
  id: number;
  table_id: number | null;
  table_number: string | null;
  customer_name: string;
  phone: string;
  party_size: number;
  datetime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Table {
  id: number;
  number: string;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState('');
  const [datetime, setDatetime] = useState('');
  const [tableId, setTableId] = useState('');
  const [showAddRes, setShowAddRes] = useState(false);

  useEffect(() => {
    fetchReservationsAndTables();
  }, []);

  const fetchReservationsAndTables = async () => {
    try {
      const [resResult, tablesResult] = await Promise.all([
        api.get<Reservation[]>('/reservations'),
        api.get<Table[]>('/tables')
      ]);

      if (resResult.success && resResult.data) {
        setReservations(resResult.data);
      }
      if (tablesResult.success && tablesResult.data) {
        setTables(tablesResult.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !partySize.trim() || !datetime.trim()) return;

    try {
      const isoDatetime = new Date(datetime).toISOString();
      const res = await api.post<Reservation>('/reservations', {
        customer_name: customerName,
        phone,
        party_size: parseInt(partySize),
        datetime: isoDatetime,
        table_id: tableId ? parseInt(tableId) : undefined
      });

      if (res.success) {
        fetchReservationsAndTables(); // Refresh lists
        setCustomerName('');
        setPhone('');
        setPartySize('');
        setDatetime('');
        setTableId('');
        setShowAddRes(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: number, nextStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const res = await api.patch(`/reservations/${id}`, { status: nextStatus });
      if (res.success) {
        setReservations(reservations.map(r => r.id === id ? { ...r, status: nextStatus } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignTable = async (resId: number, selectedTableId: string) => {
    try {
      const parsedTableId = selectedTableId ? parseInt(selectedTableId) : null;
      const res = await api.patch(`/reservations/${resId}`, { table_id: parsedTableId });
      if (res.success) {
        const tableNum = tables.find(t => t.id === parsedTableId)?.number || null;
        setReservations(reservations.map(r => r.id === resId ? { ...r, table_id: parsedTableId, table_number: tableNum } : r));
      }
    } catch (err) {
      console.error(err);
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
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-heading">
            Gestión de Reservas
          </h1>
          <p className="text-secondary mt-1">Lleva el control de reservaciones de mesas, asigna locaciones físicas y confirma asistencias.</p>
        </div>

        <Button icon="add" onClick={() => setShowAddRes(true)}>
          Nueva Reserva
        </Button>
      </div>

      {/* Grid listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {reservations.length === 0 ? (
          <Card hoverable={false} className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-secondary text-6xl mb-2">event_available</span>
            <p className="text-on-surface font-extrabold font-heading text-lg">No hay reservas programadas</p>
            <p className="text-secondary text-sm mt-1">Comienza registrando reservaciones para la jornada actual.</p>
          </Card>
        ) : (
          reservations.map((res) => (
            <Card key={res.id} hoverable={false} className="p-6 border border-surface-container flex flex-col gap-4 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold font-heading text-lg text-on-surface">{res.customer_name}</h3>
                  <p className="text-secondary text-xs font-semibold">{res.phone || 'Sin número telefónico'}</p>
                </div>
                <Chip variant={getStatusChipVariant(res.status)}>
                  {getStatusText(res.status)}
                </Chip>
              </div>

              <div className="h-[1px] bg-surface-container" />

              <div className="flex flex-col gap-2 text-sm font-semibold text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">schedule</span>
                  <span>{new Date(res.datetime).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">groups</span>
                  <span>{res.party_size} personas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">table_restaurant</span>
                  {res.table_number ? (
                    <span className="text-primary font-bold">Mesa #{res.table_number}</span>
                  ) : (
                    <span className="text-secondary italic">Sin mesa asignada</span>
                  )}
                </div>
              </div>

              {/* Table assignment selector */}
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[10px] font-bold tracking-wider uppercase text-secondary">Mesa asignada</label>
                <select
                  value={res.table_id || ''}
                  onChange={(e) => handleAssignTable(res.id, e.target.value)}
                  className="w-full min-h-[38px] bg-surface-container-low border border-surface-variant rounded-lg px-2 text-xs font-semibold"
                >
                  <option value="">-- Asignar Mesa --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Mesa #{t.number}</option>
                  ))}
                </select>
              </div>

              <div className="h-[1px] bg-surface-container mt-1" />

              {/* Status Actions */}
              <div className="flex justify-end gap-2 pt-1">
                {res.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'cancelled')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-error bg-error-container/20 hover:bg-error-container/30 transition-all"
                  >
                    Cancelar
                  </button>
                )}
                {res.status !== 'confirmed' && (
                  <button
                    onClick={() => handleUpdateStatus(res.id, 'confirmed')}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-success bg-success-light hover:brightness-95 transition-all"
                  >
                    Confirmar
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Booking Modal */}
      {showAddRes && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 animate-fade-in">
          <Card hoverable={false} className="w-full max-w-md bg-surface-container-lowest shadow-lifted p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold tracking-tight font-heading">Nueva Reservación</h3>
              <button
                onClick={() => setShowAddRes(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="flex flex-col gap-4">
              <Input
                label="Nombre del Cliente"
                placeholder="Ej: Sofía Gómez"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                label="Teléfono"
                placeholder="Ej: 5512345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Personas (Tamaño grupo)"
                type="number"
                min="1"
                placeholder="Ej: 4"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                required
              />
              <Input
                label="Fecha y hora de reserva"
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="font-body text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant ml-1">Mesa inicial (opcional)</label>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full min-h-[48px] bg-surface-container-low border border-transparent rounded-xl px-4 text-sm font-semibold shadow-sm"
                >
                  <option value="">-- Sin Asignar --</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Mesa #{t.number}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" fullWidth>Crear Reservación</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
