'use client';

import { useEffect } from 'react';

/**
 * Registra el Service Worker (`/sw.js`) que habilita el soporte offline y las
 * notificaciones push de la PWA. Solo se registra en producción para no
 * interferir con el hot-reload del entorno de desarrollo.
 *
 * No renderiza nada en el DOM.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch((err) => console.error('Error al registrar el Service Worker:', err));
    }
  }, []);

  return null;
}
