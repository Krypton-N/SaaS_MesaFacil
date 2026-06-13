"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, Button, Input } from '@/components/ui';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'waiter';
  created_at: string;
}

export default function WaitersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAddWaiter, setShowAddWaiter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get<User[]>('/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await api.post<User>('/users', {
        name,
        email,
        password,
        role: 'waiter'
      });

      if (res.success && res.data) {
        setUsers([res.data, ...users]);
        setName('');
        setEmail('');
        setPassword('');
        setShowAddWaiter(false);
      } else {
        setError(res.error || 'No se pudo registrar el mesero');
      }
    } catch (err) {
      setError('Error al registrar mesero');
    }
  };

  const handleDeleteWaiter = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este mesero? Su acceso será revocado.')) return;
    try {
      const res = await api.delete(`/users/${id}`);
      if (res.success) {
        setUsers(users.filter(u => u.id !== id));
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

  const waiters = users.filter(u => u.role === 'waiter');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="animate-fade-in flex flex-col gap-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-heading">
            Gestión de Meseros
          </h1>
          <p className="text-secondary mt-1">Registra personal operativo y controla las cuentas de acceso del sistema para mesas.</p>
        </div>

        <Button icon="add" onClick={() => setShowAddWaiter(true)}>
          Nuevo Mesero
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-error-container text-on-error-container text-sm font-semibold rounded-xl flex items-center gap-2 border border-error/20 animate-scale-in">
          <span className="material-symbols-outlined text-lg">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main personal sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Waiters Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-lg font-extrabold text-on-surface tracking-tight font-heading flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">groups</span>
            <span>Personal de Piso (Meseros)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waiters.length === 0 ? (
              <Card hoverable={false} className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-secondary text-5xl mb-2">face</span>
                <p className="text-on-surface font-bold">No hay meseros registrados</p>
                <p className="text-secondary text-xs mt-1">Registra personal de piso para poder asignar sus servicios a las mesas.</p>
              </Card>
            ) : (
              waiters.map((waiter) => (
                <Card key={waiter.id} hoverable={false} className="p-5 border border-surface-container flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-lg">
                      {waiter.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold font-heading text-sm text-on-surface">{waiter.name}</h4>
                      <p className="text-secondary text-xs">{waiter.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteWaiter(waiter.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Admins Column */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-extrabold text-on-surface tracking-tight font-heading flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">shield_person</span>
            <span>Administradores</span>
          </h3>

          <div className="flex flex-col gap-4">
            {admins.map((admin) => (
              <Card key={admin.id} hoverable={false} className="p-5 border border-surface-container flex items-center gap-3 bg-surface-container-low">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-black text-lg">
                  {admin.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold font-heading text-sm text-on-surface">{admin.name}</h4>
                  <p className="text-secondary text-xs">{admin.email}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Waiter Modal */}
      {showAddWaiter && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6 animate-fade-in">
          <Card hoverable={false} className="w-full max-w-md bg-surface-container-lowest shadow-lifted p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold tracking-tight font-heading">Registrar Nuevo Mesero</h3>
              <button
                onClick={() => setShowAddWaiter(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddWaiter} className="flex flex-col gap-4">
              <Input
                label="Nombre completo"
                placeholder="Ej: Carlos Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="carlos@mesafacil.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Contraseña temporal"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" fullWidth>Guardar Registro</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
