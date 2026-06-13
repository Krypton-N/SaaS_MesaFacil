"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BottomNavBar } from '@/components/client/BottomNavBar';

interface MenuData {
  restaurant_name: string;
  table_number: string;
  table_id: number;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const qrToken = params.qrToken as string;

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync cart count
  const syncCartCount = () => {
    try {
      const cartKey = `mesafacil_cart_${qrToken}`;
      const stored = localStorage.getItem(cartKey);
      if (stored) {
        const items = JSON.parse(stored);
        const count = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error('Failed to sync cart count:', err);
    }
  };

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const res = await api.get<MenuData>(`/menu/${qrToken}`);
        if (res.success && res.data) {
          setMenuData(res.data);
        } else {
          setError(res.error || 'Mesa o restaurante no encontrado');
        }
      } catch (err) {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [qrToken]);

  useEffect(() => {
    syncCartCount();

    // Set up local storage listener to update cart badges in real-time
    const handleStorage = () => syncCartCount();
    window.addEventListener('storage', handleStorage);

    // Custom event listener for within the same page changes
    window.addEventListener('cart-updated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart-updated', handleStorage);
    };
  }, [qrToken]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background select-none">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary-container">
            progress_activity
          </span>
          <span className="text-secondary font-bold font-heading">Cargando Menú...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center select-none animate-fade-in">
        <span className="material-symbols-outlined text-error text-6xl mb-4">qr_code_scanner</span>
        <h1 className="text-2xl font-black text-on-surface font-heading">QR Inválido o mesa inactiva</h1>
        <p className="text-secondary text-sm mt-2 max-w-xs">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-xl active:scale-95 transition-all shadow-orange"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const basePath = `/mesa/${qrToken}`;

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col pb-20 select-none max-w-md mx-auto shadow-lifted relative">
      {/* Top App Bar Client */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-variant px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center shadow-orange">
            <span className="material-symbols-outlined text-on-primary text-xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              restaurant
            </span>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-on-surface font-heading leading-tight">{menuData?.restaurant_name}</h2>
            <p className="text-secondary text-[10px] font-bold uppercase tracking-wider">Servicio Digital</p>
          </div>
        </div>

        <div className="bg-primary-fixed text-primary px-3 py-1 rounded-full text-xs font-black font-heading shadow-inner">
          Mesa #{menuData?.table_number}
        </div>
      </header>

      {/* Main client container */}
      <main className="flex-1 p-5 bg-surface-container-low/30 overflow-y-auto no-scrollbar">
        {children}
      </main>

      {/* PWA Bottom Navigation */}
      <BottomNavBar basePath={basePath} cartCount={cartCount} />
    </div>
  );
}
