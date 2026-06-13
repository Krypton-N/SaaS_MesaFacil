"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, Chip, Button, Input } from '@/components/ui';

interface Waiter {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'waiter';
}

interface Table {
  id: number;
  number: string;
  qr_token: string;
  waiters: Array<{ id: number; name: string }>;
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newTableNum, setNewTableNum] = useState('');
  const [showAddTable, setShowAddTable] = useState(false);

  // QR Modal state
  const [activeQRTable, setActiveQRTable] = useState<Table | null>(null);

  // Waiter assignment state
  const [activeAssignTable, setActiveAssignTable] = useState<Table | null>(null);
  const [selectedWaiterIds, setSelectedWaiterIds] = useState<number[]>([]);

  useEffect(() => {
    fetchTablesAndWaiters();
  }, []);

  const fetchTablesAndWaiters = async () => {
    try {
      const [tablesRes, usersRes] = await Promise.all([
        api.get<Table[]>('/tables'),
        api.get<Waiter[]>('/users')
      ]);

      if (tablesRes.success && tablesRes.data) {
        setTables(tablesRes.data);
      }
      if (usersRes.success && usersRes.data) {
        setWaiters(usersRes.data.filter(u => u.role === 'waiter'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    try {
      const res = await api.post<Table>('/tables', { number: newTableNum });
      if (res.success && res.data) {
        setTables([...tables, { ...res.data, waiters: [] }]);
        setNewTableNum('');
        setShowAddTable(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTable = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta mesa?')) return;
    try {
      const res = await api.delete(`/tables/${id}`);
      if (res.success) {
        setTables(tables.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAssignModal = (table: Table) => {
    setActiveAssignTable(table);
    setSelectedWaiterIds(table.waiters.map(w => w.id));
  };

  const handleToggleWaiterSelection = (waiterId: number) => {
    if (selectedWaiterIds.includes(waiterId)) {
      setSelectedWaiterIds(selectedWaiterIds.filter(id => id !== waiterId));
    } else {
      setSelectedWaiterIds([...selectedWaiterIds, waiterId]);
    }
  };

  const handleSaveAssignments = async () => {
    if (!activeAssignTable) return;
    try {
      const res = await api.put(`/tables/${activeAssignTable.id}/waiters`, {
        waiter_ids: selectedWaiterIds
      });
      if (res.success) {
        const updatedWaiters = waiters.filter(w => selectedWaiterIds.includes(w.id)).map(w => ({ id: w.id, name: w.name }));
        setTables(tables.map(t => t.id === activeAssignTable.id ? { ...t, waiters: updatedWaiters } : t));
        setActiveAssignTable(null);
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

  // Calculate full client PWA link for the QR table preview
  const getFullClientLink = (qrToken: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/mesa/${qrToken}`;
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-heading">
            Gestión de Mesas y Códigos QR
          </h1>
          <p className="text-secondary mt-1">Crea nuevas mesas, obtén sus códigos QR descargables y asigna meseros de servicio.</p>
        </div>

        <Button icon="add" onClick={() => setShowAddTable(true)}>
          Agregar Mesa
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {tables.length === 0 ? (
          <Card hoverable={false} className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-secondary text-6xl mb-2">table_restaurant</span>
            <p className="text-on-surface font-extrabold font-heading text-lg">No hay mesas registradas</p>
            <p className="text-secondary text-sm mt-1">Agrega tu primera mesa para generar su código QR interactivo.</p>
          </Card>
        ) : (
          tables.map((table) => (
            <Card key={table.id} hoverable={false} className="p-6 border border-surface-container flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold font-heading text-xl">Mesa #{table.number}</h3>
                  <p className="text-secondary text-xs font-semibold mt-0.5 truncate max-w-[200px]">QR Token: {table.qr_token}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveQRTable(table)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-fixed text-primary hover:brightness-95 transition-all"
                    title="Mostrar Código QR"
                  >
                    <span className="material-symbols-outlined text-xl">qr_code_2</span>
                  </button>
                  <button
                    onClick={() => handleOpenAssignModal(table)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all"
                    title="Asignar Meseros"
                  >
                    <span className="material-symbols-outlined text-xl">person_add</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-error-container/20 text-error hover:bg-error-container/30 transition-all"
                    title="Eliminar Mesa"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-surface-container" />

              {/* Assigned waiters */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-secondary">Meseros Asignados</span>
                {table.waiters.length === 0 ? (
                  <span className="text-xs text-secondary italic">Sin mesero asignado</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {table.waiters.map((w) => (
                      <Chip key={w.id} variant="default" className="text-[10px]">
                        {w.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Table Dialog */}
      {showAddTable && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 animate-fade-in">
          <Card hoverable={false} className="w-full max-w-md bg-surface-container-lowest shadow-lifted p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold tracking-tight font-heading">Agregar Mesa</h3>
              <button
                onClick={() => setShowAddTable(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTable} className="flex flex-col gap-4">
              <Input
                label="Número o nombre de Mesa"
                placeholder="Ej: 5, VIP-1"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                required
              />
              <Button type="submit" fullWidth>Crear Mesa</Button>
            </form>
          </Card>
        </div>
      )}

      {/* QR Code Presentation Modal */}
      {activeQRTable && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest shadow-lifted rounded-2xl p-8 flex flex-col items-center gap-6 animate-scale-in text-center select-none relative">
            <button
              onClick={() => setActiveQRTable(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight font-heading text-on-surface">Código QR — Mesa #{activeQRTable.number}</h3>
              <p className="text-secondary text-xs mt-1">Coloca este código en la mesa física.</p>
            </div>

            {/* QR display container */}
            <div className="w-64 h-64 border-4 border-primary rounded-2xl bg-white p-4 flex items-center justify-center shadow-md relative overflow-hidden">
              <img
                src={`http://localhost:3001/api/v1/tables/${activeQRTable.id}/qr`}
                alt={`Mesa ${activeQRTable.number} QR`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to static QR API if backend is not currently running
                  e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getFullClientLink(activeQRTable.qr_token))}`;
                }}
              />
            </div>

            <p className="text-secondary text-xs break-all max-w-[280px]">
              {getFullClientLink(activeQRTable.qr_token)}
            </p>

            <a
              href={`http://localhost:3001/api/v1/tables/${activeQRTable.id}/qr`}
              download={`mesa-${activeQRTable.number}-qr.png`}
              className="w-full"
            >
              <Button fullWidth icon="download" className="shadow-orange py-3 font-bold text-sm">
                Descargar QR Imprimible
              </Button>
            </a>
          </div>
        </div>
      )}

      {/* Waiter Assignment Modal */}
      {activeAssignTable && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 animate-fade-in">
          <Card hoverable={false} className="w-full max-w-md bg-surface-container-lowest shadow-lifted p-6 flex flex-col gap-5 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold tracking-tight font-heading">Asignar Meseros — Mesa #{activeAssignTable.number}</h3>
              <button
                onClick={() => setActiveAssignTable(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {waiters.length === 0 ? (
              <div className="text-center py-6 text-secondary text-sm">
                No hay meseros registrados. Agrégalos primero en el panel de Meseros.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {waiters.map((w) => {
                  const isSelected = selectedWaiterIds.includes(w.id);
                  return (
                    <div
                      key={w.id}
                      onClick={() => handleToggleWaiterSelection(w.id)}
                      className={`
                        px-4 py-3 rounded-xl flex items-center gap-3 border cursor-pointer select-none active:scale-[0.98] transition-all
                        ${isSelected
                          ? 'bg-primary-fixed border-primary text-primary font-bold shadow-sm'
                          : 'bg-surface-container-low border-surface-variant text-on-surface-variant'
                        }
                      `}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {isSelected ? 'check_box' : 'check_box_outline_blank'}
                      </span>
                      <span>{w.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <Button onClick={handleSaveAssignments} fullWidth>
              Guardar Cambios
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
