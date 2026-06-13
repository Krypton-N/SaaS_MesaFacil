# MesaFácil v1 — Plan de Desarrollo: Bases del Stack Tecnológico

Plan para dejar la infraestructura de la app lista para empezar a construir los módulos de negocio (Sprints 1-2 del backlog Jira).

---

## Resumen del Proyecto

MesaFácil es un sistema de pedidos para restaurantes con tres interfaces:

1. **PWA del Cliente** — Accede al menú via QR, arma pedido, paga (simulado), orden llega a cocina
2. **Panel de Administración** — Dashboard, CRUD menú/mesas/meseros/reservas, extracción de menú con IA (LM Studio)
3. **Vistas operativas** — Panel de cocina (Socket.io) y vista de mesero con alertas sonoras

**Arquitectura**: Multi-tenant por `restaurant_id`. Cada restaurante tiene su propio menú, mesas, meseros y órdenes.

---

## Decisiones de Stack (Confirmadas)

| Decisión | Elección | Justificación |
|---|---|---|
| **Base de datos** | **Supabase** (PostgreSQL hospedado, free tier) | 500MB gratis, dashboard visual, sin instalar Docker |
| **Almacenamiento de imágenes** | **Supabase Storage** (1GB gratis) | Centralizado con la DB, URLs públicas, zero config extra |
| **Pasarela de pago** | **Mock simulado** | Flujo UI completo pero el backend simula el cobro. Preparado para conectar OpenPay cuando sea necesario |
| **Frontend** | **Next.js 14+** (App Router, TypeScript, Tailwind) | SSR, routing automático, PWA con `next-pwa` |
| **Backend** | **Express + TypeScript** | API REST + Socket.io separado, fácil de entender y presentar |
| **Auth** | **JWT propio** (bcryptjs + jsonwebtoken) | Control total del sistema de roles (`admin`, `waiter`) |
| **Real-time** | **Socket.io** | Canales por restaurante para cocina y meseros |
| **IA / VLM** | **LM Studio local** | Extracción de menú desde fotos (sprint posterior) |

---

## Inventario de Wireframes Existentes

Los 15 wireframes en `wireframe_ui_designer/` son HTMLs estáticos con Tailwind CDN. Sirven como referencia visual — se re-implementan como componentes React/Next.js.

| Wireframe | Interfaz | Vista |
|---|---|---|
| `admin_login` / `admin_login_m_vil` | Admin | Login desktop y móvil |
| `dashboard_de_administraci_n` / `dashboard_admin_m_vil` | Admin | Dashboard desktop y móvil |
| `gesti_n_de_men` / `gesti_n_de_men_m_vil` | Admin | CRUD menú desktop y móvil |
| `gesti_n_de_mesas_y_qr_actualizada` / `gesti_n_de_mesas_m_vil` | Admin | Mesas y QR desktop y móvil |
| `gesti_n_de_reservas` / `gesti_n_de_reservas_m_vil` | Admin | Reservas desktop y móvil |
| `men_del_cliente` | Cliente PWA | Menú público |
| `carrito_de_compras` | Cliente PWA | Carrito |
| `pago_seguro` | Cliente PWA | Checkout (mock) |
| `confirmaci_n_de_pedido` | Cliente PWA | Confirmación de orden |
| `gourmet_flux` | — | Design System (DESIGN.md) |

---

## Proposed Changes

### Fase 0: Estructura del Monorepo

Crear la estructura base del proyecto dentro de `MesaFacil_v1/`:

```
MesaFacil_v1/
├── docs/                          # (ya existe)
├── wireframe_ui_designer/         # (ya existe, referencia visual)
├── frontend/                      # [NEW] Next.js PWA
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   └── icons/                 # PWA icons (192x192, 512x512)
│   ├── src/
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── layout.tsx         # Root layout + fonts
│   │   │   ├── page.tsx           # Landing / redirect
│   │   │   ├── (admin)/           # Grupo rutas admin (protegidas JWT)
│   │   │   │   ├── layout.tsx     # Admin layout (SideNav + TopBar)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── menu/page.tsx
│   │   │   │   ├── tables/page.tsx
│   │   │   │   ├── waiters/page.tsx
│   │   │   │   └── reservations/page.tsx
│   │   │   ├── mesa/[qrToken]/    # Menú público por QR (sin auth)
│   │   │   │   ├── layout.tsx     # Cliente layout (TopBar + BottomNav)
│   │   │   │   ├── page.tsx       # Menú del restaurante
│   │   │   │   ├── cart/page.tsx
│   │   │   │   └── checkout/page.tsx
│   │   │   ├── kitchen/page.tsx   # Panel cocina (protegido)
│   │   │   └── waiter/page.tsx    # Vista mesero (protegido)
│   │   ├── components/
│   │   │   ├── ui/                # Design system (Button, Card, Input, Chip...)
│   │   │   ├── admin/             # Sidebar, TopBar admin
│   │   │   ├── client/            # BottomNav, CartButton, FoodCard
│   │   │   └── shared/            # Logo, LoadingSpinner, EmptyState
│   │   ├── lib/
│   │   │   ├── api.ts             # Cliente HTTP → backend
│   │   │   ├── auth.ts            # JWT helpers (guardar/leer token)
│   │   │   ├── socket.ts          # Cliente Socket.io
│   │   │   ├── cart.ts            # Estado del carrito (localStorage)
│   │   │   └── supabase.ts        # Cliente Supabase (Storage upload)
│   │   ├── hooks/                 # useAuth, useCart, useSocket
│   │   ├── styles/
│   │   │   └── globals.css        # Design tokens + base styles
│   │   └── types/
│   │       └── index.ts           # Tipos TypeScript compartidos
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                       # [NEW] Express API
│   ├── src/
│   │   ├── index.ts               # Entry point + Socket.io
│   │   ├── config/
│   │   │   ├── database.ts        # Pool PostgreSQL (Supabase connection string)
│   │   │   ├── env.ts             # Variables de entorno validadas con Zod
│   │   │   └── supabase.ts        # Cliente Supabase Admin (Storage)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification → req.user
│   │   │   ├── roleGuard.ts       # requireRole('admin') | requireRole('waiter')
│   │   │   ├── errorHandler.ts    # Error handler global
│   │   │   └── validate.ts        # Zod validation middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── categories.routes.ts
│   │   │   ├── dishes.routes.ts
│   │   │   ├── tables.routes.ts
│   │   │   ├── orders.routes.ts
│   │   │   └── reservations.routes.ts
│   │   ├── controllers/           # Lógica de cada ruta
│   │   ├── services/
│   │   │   ├── payment.service.ts # MOCK: simula cobro, retorna charge_id falso
│   │   │   └── vlm.service.ts     # Integración con LM Studio
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   │   └── 001_initial_schema.sql
│   │   │   └── seed.ts            # Restaurante demo con datos de prueba
│   │   └── types/
│   │       └── index.ts
│   ├── tsconfig.json
│   └── package.json
├── .gitignore
├── .env.example
└── README.md
```

---

### Fase 1: Inicialización del Backend (Express + TypeScript)

#### [NEW] [package.json](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/backend/package.json)

| Categoría | Paquetes |
|---|---|
| **Core** | `express`, `cors`, `helmet`, `morgan` |
| **Base de datos** | `pg` (node-postgres), `dotenv` |
| **Supabase** | `@supabase/supabase-js` (Storage de imágenes) |
| **Auth** | `bcryptjs`, `jsonwebtoken` |
| **Validación** | `zod` |
| **Real-time** | `socket.io` |
| **Uploads** | `multer` (recibir archivos antes de subirlos a Supabase) |
| **QR** | `qrcode` |
| **Dev** | `typescript`, `tsx`, `@types/*`, `nodemon` |

> [!NOTE]
> No se incluyen paquetes de OpenPay. El servicio de pagos es un mock que retorna éxito siempre.

#### [NEW] [001_initial_schema.sql](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/backend/src/db/migrations/001_initial_schema.sql)

Migración SQL con las 8 tablas del modelo de datos documentado:
- `restaurants`, `users`, `categories`, `dishes`, `tables`, `table_waiters`, `orders`, `order_items`, `reservations`
- ENUMs: `user_role` (`admin` | `waiter`), `order_status` (`pending_payment` | `paid` | `ready` | `delivered`), `reservation_status` (`pending` | `confirmed` | `cancelled`)
- Índices compuestos en `restaurant_id` para performance multi-tenant
- Se ejecuta directamente en el SQL Editor de Supabase

#### [NEW] [index.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/backend/src/index.ts)

- Express app con middlewares (CORS, Helmet, Morgan, JSON parser)
- Rutas montadas bajo `/api/v1`
- Socket.io en el mismo HTTP server con canales `restaurant:{id}`
- Formato de respuesta estándar: `{ success, data, error }`
- Endpoint de salud: `GET /api/v1/health`

#### [NEW] [payment.service.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/backend/src/services/payment.service.ts)

```typescript
// Mock payment service — simula OpenPay
export async function processPayment(amount: number, token: string) {
  // Simula latencia de pasarela real
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    success: true,
    charge_id: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    amount,
    status: 'completed'
  };
}
```

> [!TIP]
> Cuando quieras conectar OpenPay real, solo reemplazas la implementación de este archivo. Ni las rutas ni los controllers cambian.

#### [NEW] [auth.ts middleware](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/backend/src/middleware/auth.ts)

- Extrae token del header `Authorization: Bearer <token>`
- Decodifica JWT → adjunta `req.user = { userId, restaurantId, role }`
- `requireRole('admin')` — rechaza si el rol no coincide
- `requireRole('waiter')` — para endpoints de mesero
- Rutas públicas (menú, crear orden) no pasan por este middleware

---

### Fase 2: Inicialización del Frontend (Next.js + PWA)

#### [NEW] Proyecto Next.js

```bash
npx -y create-next-app@latest ./frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

#### [NEW] [tailwind.config.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/tailwind.config.ts)

Todos los design tokens del sistema "Gourmet Flux" extraídos del DESIGN.md:

- **Colores**: 40+ tokens Material Design 3 (primary `#a04100`, primary-container `#ff6b00`, surfaces, on-surfaces, etc.)
- **Typography**: Plus Jakarta Sans (headings h1-h3) + Inter (body, labels, buttons)
- **Spacing**: Escala rítmica de 8px (`xs: 4px`, `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px`)
- **Border radius**: `sm: 4px`, `DEFAULT: 8px`, `md: 12px`, `lg: 16px`, `full: 9999px`
- **Touch targets**: Mínimo `48px` para todos los interactivos

#### [NEW] [globals.css](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/src/styles/globals.css)

- CSS custom properties como fallback del design system
- Sombras ambientales (`shadow-lifted: 0 8px 16px rgba(26,26,26,0.06)`)
- Animaciones base: `fadeIn`, `slideUp`, `pulse`
- Scrollbar oculto para tabs horizontales

#### [NEW] [layout.tsx](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/src/app/layout.tsx)

- Google Fonts: Plus Jakarta Sans + Inter
- Meta tags PWA: `theme-color: #ff6b00`, `apple-mobile-web-app-capable`
- Link a `manifest.json`
- Wrapper con clases base del design system

#### [NEW] [manifest.json](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/public/manifest.json)

```json
{
  "name": "MesaFácil — Pedidos Inteligentes",
  "short_name": "MesaFácil",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f9f9f9",
  "theme_color": "#ff6b00",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### [NEW] [supabase.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/src/lib/supabase.ts)

Cliente Supabase para upload de imágenes desde el admin:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Upload imagen de platillo al bucket "dish-images"
export async function uploadDishImage(file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name}`
  const { data } = await supabase.storage
    .from('dish-images')
    .upload(filename, file, { upsert: true })
  
  return supabase.storage.from('dish-images').getPublicUrl(data!.path).data.publicUrl
}
```

---

### Fase 3: Componentes Base del Design System

Componentes UI reutilizables fieles al design system "Gourmet Flux":

| Componente | Descripción | Referencia wireframe |
|---|---|---|
| `Button` | Primary (orange fill), Secondary (charcoal outline), Ghost | Todos |
| `Card` | "Appetite Card" con imagen, sombra ambiental, 16px radius | `men_del_cliente` |
| `Input` | Off-white fill, 16px radius, focus border orange, icono opcional | `admin_login`, `pago_seguro` |
| `Chip` | Pill-shape para tags ("Vegetarian", "Gluten-Free") y estados | `men_del_cliente` |
| `TopAppBar` | Header con backdrop-blur, branding, info de mesa | `men_del_cliente` |
| `BottomNavBar` | Nav inferior con 4 tabs + iconos Material Symbols | `men_del_cliente` |
| `SideNavBar` | Sidebar admin con avatar, tabs, botón CTA | `dashboard_de_administraci_n` |
| `Drawer` | Bottom-sheet animado para modales | Reservas, detalles |
| `Badge` | Contador circular (ej: items en carrito) | `men_del_cliente` |
| `QuantitySelector` | Botones +/- con contador | `carrito_de_compras` |

---

### Fase 4: Scaffolding de Rutas y Layouts

#### Admin Layout (`(admin)/layout.tsx`)
- `SideNavBar` fija a la izquierda (desktop, 256px)
- Colapsa a hamburger en pantallas < 768px
- `TopAppBar` con barra de búsqueda, notificaciones, perfil
- **Protección JWT**: si no hay token válido → redirect a `/login`
- Roles: solo `admin` puede acceder al CRUD completo

#### Cliente PWA Layout (`mesa/[qrToken]/layout.tsx`)
- `TopAppBar` con nombre del restaurante + número de mesa (viene del `qr_token`)
- `BottomNavBar` con tabs: Menu, Cart, Orders
- **Sin autenticación** — la mesa se identifica por `qr_token` en la URL
- El carrito se guarda en `localStorage` por dispositivo

#### Kitchen / Waiter Layouts
- Minimalistas, full-screen
- Protegidos con JWT + role check
- Socket.io para recibir eventos en tiempo real

#### [NEW] [api.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/src/lib/api.ts)

- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api/v1`)
- Interceptor: agrega `Authorization: Bearer <token>` automáticamente
- Parsea respuestas `{ success, data, error }`
- En caso de 401 → limpia token y redirige a login

#### [NEW] [socket.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/frontend/src/lib/socket.ts)

- Se conecta a `NEXT_PUBLIC_SOCKET_URL`
- Join al canal `restaurant:{restaurantId}` al autenticarse
- Listeners: `order:new` (cocina) y `order:ready` (mesero)
- Auto-reconnect

---

### Fase 5: Configuración de Entorno y DevEx

#### [NEW] [.env.example](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/.env.example)

```env
# === SUPABASE ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...        # Backend (admin, nunca exponer)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... # Frontend (public, safe)

# === DATABASE (Supabase PostgreSQL) ===
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# === AUTH ===
JWT_SECRET=tu-clave-secreta-larga-aqui
JWT_EXPIRES_IN=24h

# === LM STUDIO (VLM para extracción de menú) ===
LM_STUDIO_URL=http://localhost:1234/v1

# === FRONTEND ===
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# === BACKEND ===
PORT=3001
NODE_ENV=development
```

> [!NOTE]
> **No hay variables de OpenPay** porque el pago es simulado. Cuando se conecte la pasarela real, se agregan aquí.

#### [NEW] [.gitignore](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/.gitignore)

Gitignore para Node.js, Next.js, `.env`, y archivos de sistema.

#### [NEW] [seed.ts](file:///c:/Disco%20D/ESCOM/4%20semestre/AyDS/MesaFacil_v1/backend/src/db/seed.ts)

Datos de prueba para desarrollo:
- 1 restaurante demo ("La Terraza de MesaFácil")
- 1 admin (`admin@mesafacil.com` / `password123`)
- 2 meseros
- 4 categorías (Entradas, Platos Fuertes, Bebidas, Postres)
- 8 platillos con imágenes placeholder
- 5 mesas con QR tokens generados
- 3 reservas de ejemplo

---

## Diagrama de Arquitectura

```mermaid
graph TB
    subgraph "Cliente PWA - Next.js"
        QR["📱 Escanea QR"] --> MENU["Menú Público"]
        MENU --> CART["Carrito (localStorage)"]
        CART --> CHECKOUT["Checkout (Mock)"]
    end

    subgraph "Panel Admin - Next.js"
        LOGIN["Login JWT"] --> DASH["Dashboard"]
        DASH --> CRUD_MENU["Gestión Menú"]
        DASH --> CRUD_TABLES["Gestión Mesas + QR"]
        DASH --> CRUD_RES["Reservas"]
        DASH --> CRUD_WAIT["Meseros"]
        CRUD_MENU --> VLM["Extracción con IA"]
    end

    subgraph "Backend - Express + Socket.io"
        API["REST API /api/v1"]
        WS["Socket.io"]
        AUTH["JWT Middleware"]
        MOCK["Mock Payment"]
    end

    subgraph "Supabase (Free Tier)"
        DB[("PostgreSQL")]
        STORAGE["Storage (imágenes)"]
    end

    subgraph "Local"
        LMSTUDIO["LM Studio VLM"]
    end

    subgraph "Operaciones"
        KITCHEN["🍳 Panel Cocina"]
        WAITER["🧑‍🍳 Vista Mesero"]
    end

    CHECKOUT -->|"POST /orders"| API
    API --> MOCK
    API -->|"order:new"| WS
    WS --> KITCHEN
    KITCHEN -->|"PATCH status"| API
    API -->|"order:ready"| WS
    WS --> WAITER
    
    CRUD_MENU --> API
    VLM --> API --> LMSTUDIO
    API --> DB
    CRUD_MENU -->|"upload"| STORAGE
    API --> AUTH
```

---

## Orden de Ejecución

| # | Tarea | Fase | Tiempo Est. |
|---|---|---|---|
| 1 | Crear estructura monorepo + `.gitignore` + `.env.example` + `README.md` | 0 | 15 min |
| 2 | Crear cuenta Supabase + proyecto + obtener credenciales | 0 | 10 min |
| 3 | Init backend: `npm init`, deps, TypeScript config | 1 | 20 min |
| 4 | Crear migración SQL `001_initial_schema.sql` | 1 | 30 min |
| 5 | Ejecutar migración en Supabase SQL Editor | 1 | 5 min |
| 6 | Scaffold Express: entry, middlewares, response wrapper, health endpoint | 1 | 30 min |
| 7 | Middleware JWT + role guards | 1 | 20 min |
| 8 | Mock payment service | 1 | 10 min |
| 9 | Scaffold rutas vacías (todos los endpoints del API spec) | 1 | 25 min |
| 10 | Seed de datos de prueba | 1 | 20 min |
| 11 | Init frontend: `create-next-app` con TS + Tailwind | 2 | 10 min |
| 12 | Configurar Tailwind con design tokens Gourmet Flux | 2 | 30 min |
| 13 | `globals.css`: variables CSS, sombras, animaciones | 2 | 20 min |
| 14 | Root layout + Google Fonts + PWA manifest + icons | 2 | 20 min |
| 15 | Componentes UI base (Button, Card, Input, Chip, Badge) | 3 | 45 min |
| 16 | Admin Layout: SideNavBar + TopAppBar | 3 | 30 min |
| 17 | Cliente Layout: TopAppBar + BottomNavBar | 3 | 25 min |
| 18 | Scaffold de páginas vacías con layouts correctos | 4 | 20 min |
| 19 | `api.ts` (cliente HTTP) + `socket.ts` (Socket.io) + `supabase.ts` | 4 | 25 min |
| 20 | Crear bucket `dish-images` en Supabase Storage | 4 | 5 min |
| 21 | Verificar: frontend ↔ backend conectados, DB funcionando | 5 | 15 min |

**Total estimado: ~6 horas** para tener las bases completas del stack.

---

## Verification Plan

### Automated Tests

1. **Backend arranca**: `cd backend && npm run dev` → servidor en `localhost:3001` sin errores
2. **DB conectada**: `GET /api/v1/health` → `{ success: true, data: { db: "connected" } }`
3. **Migración OK**: Las 8 tablas visibles en el dashboard de Supabase
4. **Seed OK**: Restaurante demo con datos en todas las tablas
5. **Frontend arranca**: `cd frontend && npm run dev` → app en `localhost:3000`
6. **Design tokens**: Abrir cualquier página → colores y tipografía Gourmet Flux aplicados
7. **PWA manifest**: Chrome DevTools → Application → manifest válido, installable
8. **Comunicación**: Frontend hace `GET /api/v1/health` → CORS OK, respuesta exitosa
9. **Supabase Storage**: Upload de una imagen de prueba → URL pública accesible

### Manual Verification

- Abrir la app en Chrome móvil → verificar responsive
- Verificar que el diseño coincide visualmente con los wireframes
- Instalar la PWA desde Chrome → se abre como app standalone con `theme_color` naranja
- Navegar entre rutas admin y cliente → layouts correctos se cargan
