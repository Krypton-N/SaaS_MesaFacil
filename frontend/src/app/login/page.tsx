"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setTokens } from '@/lib/api';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (localStorage.getItem('mesafacil_token')) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data?.token) {
        setTokens(res.data.token, res.data.refreshToken);
        router.push('/dashboard');
      } else {
        setError(res.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 select-none relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-[400px] h-[400px] bg-primary-container/10 blur-[120px] rounded-full -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-tertiary-container/10 blur-[120px] rounded-full -bottom-40 -right-40 pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-surface-container-lowest shadow-lifted rounded-2xl border border-surface-variant p-8 sm:p-10 z-10 animate-slide-up">
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center shadow-orange animate-pulse-dot mb-4">
            <span className="material-symbols-outlined text-on-primary text-3xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
              restaurant
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-primary font-heading tracking-tight">MesaFácil</h1>
          <p className="text-secondary text-sm font-medium mt-1">Ingresa a tu panel administrativo</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container text-sm font-semibold rounded-xl flex items-center gap-2 border border-error/20 animate-scale-in">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Correo electrónico"
            type="email"
            icon="mail"
            placeholder="ejemplo@mesafacil.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            icon="lock"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Remember me & Forgot password */}
          <div className="flex justify-between items-center text-sm font-medium">
            <label className="flex items-center gap-2 text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-primary border-surface-variant cursor-pointer"
              />
              <span>Recordarme</span>
            </label>
            <a href="#" className="text-primary hover:underline">¿Olvidaste tu contraseña?</a>
          </div>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            className="mt-2 text-base font-bold shadow-orange active:scale-[0.97]"
          >
            Iniciar Sesión
          </Button>
        </form>

        {/* Register suggestion */}
        <div className="mt-8 text-center text-sm font-medium text-secondary">
          ¿No tienes una cuenta? <a href="#" className="text-primary hover:underline">Registra tu restaurante</a>
        </div>
      </div>

      {/* Footer copyright */}
      <p className="mt-8 text-xs text-secondary-container text-center max-w-xs font-semibold uppercase tracking-wider">
        © 2026 MesaFácil. Todos los derechos reservados.
      </p>
    </div>
  );
}
