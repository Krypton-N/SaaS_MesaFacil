"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { removeToken } from '@/lib/api';

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/menu', icon: 'restaurant_menu', label: 'Menú' },
  { href: '/tables', icon: 'table_bar', label: 'Mesas' },
  { href: '/waiters', icon: 'groups', label: 'Meseros' },
  { href: '/reservations', icon: 'event_available', label: 'Reservas' },
];

export function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.replace('/login');
  };

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 border-r border-surface-variant bg-surface-container-lowest shadow-sm flex flex-col p-4 z-50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 px-4 py-2">
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            restaurant
          </span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-primary font-heading">MesaFácil</h2>
          <p className="text-secondary text-xs">Panel de Administración</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95
                ${isActive
                  ? 'text-primary bg-primary-fixed font-bold'
                  : 'text-secondary hover:bg-surface-container-low'
                }
              `}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Bottom: Logout */}
      <div className="mt-auto pt-4 border-t border-surface-variant">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-secondary hover:bg-error-container hover:text-on-error-container w-full transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
