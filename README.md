# 🍽️ MesaFácil v1

Sistema de pedidos inteligente para restaurantes — PWA + Panel de Administración.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| **Backend** | Express.js, TypeScript, Socket.io |
| **Base de datos** | PostgreSQL (Supabase) |
| **Almacenamiento** | Supabase Storage |
| **Auth** | JWT (bcryptjs + jsonwebtoken) |
| **Real-time** | Socket.io |
| **IA** | LM Studio (VLM local) |
| **PWA** | next-pwa, Service Worker |

## Estructura del Proyecto

```
MesaFacil_v1/
├── frontend/          # Next.js PWA
├── backend/           # Express API + Socket.io
├── docs/              # Documentación del proyecto
└── wireframe_ui_designer/  # Wireframes de referencia (HTML)
```

## Requisitos Previos

- Node.js 18+
- npm 9+
- Cuenta de Supabase (gratuita)
- LM Studio (opcional, para extracción de menú con IA)

## Instalación

### 1. Clonar y configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

El servidor inicia en `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app inicia en `http://localhost:3000`

### 4. Base de datos

Ejecutar el contenido de `backend/src/db/migrations/001_initial_schema.sql` en el SQL Editor de Supabase.

## Design System

El proyecto usa el sistema de diseño **"Gourmet Flux"** con paleta de colores naranja vibrante + charcoal. Tipografía: Plus Jakarta Sans (headings) + Inter (body).

Referencia completa: `wireframe_ui_designer/gourmet_flux/DESIGN.md`

## Módulos

- **PWA del Cliente** — Menú por QR, carrito, checkout
- **Panel de Administración** — Dashboard, CRUD menú/mesas/meseros/reservas
- **Panel de Cocina** — Recibe órdenes en tiempo real
- **Vista de Mesero** — Alertas de órdenes listas

## Licencia

Proyecto académico — ESCOM IPN, Análisis y Diseño de Sistemas.
