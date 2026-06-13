"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SideNavBar } from '@/components/admin/SideNavBar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('mesafacil_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary-container">
            progress_activity
          </span>
          <span className="text-secondary font-bold font-heading">Cargando MesaFácil...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-on-background flex">
      {/* Sidebar Nav */}
      <SideNavBar />

      {/* Main Content Area */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-surface-variant px-8 h-20 flex items-center justify-between shadow-sm">
          {/* Search bar */}
          <div className="relative flex items-center w-96">
            <span className="material-symbols-outlined absolute left-4 text-secondary pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar órdenes, platillos, mesas..."
              className="w-full h-11 bg-surface-container-low text-on-surface font-body text-sm rounded-xl pl-12 pr-4 border-2 border-transparent outline-none focus:border-primary transition-all duration-200"
            />
          </div>

          {/* User profile & Actions */}
          <div className="flex items-center gap-5">
            {/* Real-time status dot */}
            <div className="flex items-center gap-2 bg-success-light text-success px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse-dot" />
              <span>Conectado</span>
            </div>

            {/* Notifications */}
            <button className="relative w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full" />
            </button>

            <div className="h-8 w-[1px] bg-surface-variant" />

            {/* Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary font-bold text-lg font-heading shadow-inner">
                A
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-extrabold text-on-surface leading-tight font-heading">Administrador</p>
                <p className="text-xs text-secondary">La Terraza</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-8 bg-surface-container-low/50">
          {children}
        </main>
      </div>
    </div>
  );
}
