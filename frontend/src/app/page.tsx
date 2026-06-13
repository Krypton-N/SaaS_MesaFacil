"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';

export default function WelcomePage() {
  const router = useRouter();
  const [qrTokenInput, setQrTokenInput] = useState('');

  const handleLaunchClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrTokenInput.trim()) {
      router.push(`/mesa/${qrTokenInput.trim()}`);
    } else {
      // Use a sample UUID table token just for demonstration
      router.push(`/mesa/db5eb1e4-3cae-4f36-932b-4e0078733353`);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Dynamic Glowing Accents */}
      <div className="absolute w-[500px] h-[500px] bg-primary-container/10 blur-[130px] rounded-full -top-40 -left-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-tertiary-container/10 blur-[130px] rounded-full -bottom-40 -right-20 pointer-events-none" />

      {/* Hero Branding */}
      <div className="flex flex-col items-center mb-12 text-center animate-fade-in z-10">
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-orange mb-5 animate-pulse-dot">
          <span className="material-symbols-outlined text-on-primary text-4xl font-extrabold" style={{ fontVariationSettings: "'FILL' 1" }}>
            restaurant
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight text-white">MesaFácil v1</h1>
        <p className="text-zinc-400 text-base max-w-sm mt-3 leading-relaxed">
          Plataforma modular e inteligente de pedidos para restaurantes.
        </p>
      </div>

      {/* Main launch grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 z-10 animate-slide-up">
        {/* Operations Panels Card */}
        <Card hoverable={false} className="p-8 bg-zinc-900 border border-zinc-800 flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center gap-2 text-primary-container font-heading font-black tracking-wider uppercase text-xs">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span>Consola Operativa</span>
            </div>
            <h2 className="text-2xl font-black font-heading mt-2 text-white">Personal & Administración</h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Accede a los módulos del negocio para administrar menús, mesas, personal operativo y monitorear pedidos.
            </p>

            <div className="flex flex-col gap-3.5 mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center justify-between px-5 py-4 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">dashboard</span>
                  <span>Panel de Administración (CRUDs & IA)</span>
                </div>
                <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
              </button>

              <button
                onClick={() => router.push('/kitchen')}
                className="flex items-center justify-between px-5 py-4 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">soup_kitchen</span>
                  <span>Monitor de Cocina (Preparando)</span>
                </div>
                <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
              </button>

              <button
                onClick={() => router.push('/waiter')}
                className="flex items-center justify-between px-5 py-4 bg-zinc-800 hover:bg-zinc-700/80 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">groups</span>
                  <span>Monitor de Meseros (Servicio)</span>
                </div>
                <span className="material-symbols-outlined text-zinc-500">chevron_right</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Client PWA QR Simulator Card */}
        <Card hoverable={false} className="p-8 bg-zinc-900 border border-zinc-800 flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center gap-2 text-primary-container font-heading font-black tracking-wider uppercase text-xs">
              <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span>Simulador PWA</span>
            </div>
            <h2 className="text-2xl font-black font-heading mt-2 text-white">Comensal Inteligente</h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Simula el escaneo de un código QR físico en una mesa para ingresar al menú dinámico de comida, ordenar y realizar el pago seguro.
            </p>

            <form onSubmit={handleLaunchClient} className="flex flex-col gap-4 mt-6">
              <div className="relative flex items-center w-full text-white">
                <span className="material-symbols-outlined absolute left-4 text-zinc-500 pointer-events-none">
                  qr_code_2
                </span>
                <input
                  type="text"
                  placeholder="Pegar Token de Mesa (UUID)"
                  value={qrTokenInput}
                  onChange={(e) => setQrTokenInput(e.target.value)}
                  className="w-full h-12 bg-zinc-800 border border-zinc-700 text-white font-body text-sm rounded-xl pl-12 pr-4 outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>

              <Button
                type="submit"
                fullWidth
                icon="qr_code_scanner"
                className="shadow-orange py-3.5 font-bold text-sm"
              >
                Simular Escaneo de Mesa
              </Button>
            </form>
          </div>

          <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider text-center pt-6">
            Tip: Genera mesas en el Panel Admin y copia sus UUIDs para probar.
          </div>
        </Card>
      </div>

      {/* Technical footprint footer */}
      <footer className="mt-16 text-center text-xs text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
        Next.js PWA • Express • PostgreSQL (Supabase) • Socket.io
      </footer>
    </div>
  );
}
