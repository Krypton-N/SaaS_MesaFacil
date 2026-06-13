"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '', icon: 'restaurant_menu', label: 'Menú' },
  { href: '/cart', icon: 'shopping_bag', label: 'Carrito' },
  { href: '/orders', icon: 'receipt_long', label: 'Pedidos' },
];

interface BottomNavBarProps {
  basePath: string; // e.g. "/mesa/abc-123"
  cartCount?: number;
}

export function BottomNavBar({ basePath, cartCount = 0 }: BottomNavBarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-50 rounded-t-2xl bg-surface-container-lowest border-t border-surface-variant shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex justify-around items-center h-20 px-4 pb-2">
      {tabs.map((tab) => {
        const fullHref = `${basePath}${tab.href}`;
        const isActive = pathname === fullHref || (tab.href === '' && pathname === basePath);

        return (
          <Link
            key={tab.href}
            href={fullHref}
            className={`
              flex flex-col items-center justify-center w-16 h-full pt-2 transition-all duration-200 active:scale-90 relative
              ${isActive ? 'text-primary-container scale-110' : 'text-secondary hover:text-primary-container'}
            `}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="font-heading text-[10px] font-bold uppercase tracking-wider mt-1">
              {tab.label}
            </span>
            {/* Cart badge */}
            {tab.href === '/cart' && cartCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-primary-container text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
