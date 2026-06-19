# MesaFácil v1 — Task Tracker

## Fase 0: Estructura del Monorepo
- [x] Crear estructura de carpetas + `.gitignore` + `.env.example` + `README.md`
- [x] Crear cuenta Supabase + proyecto (BD en la nube ya creada y poblada)

## Fase 1: Backend (Express + TypeScript)
- [x] Init backend: `npm init`, instalar deps, configurar TypeScript
- [x] Crear migración SQL `001_initial_schema.sql`
- [x] Scaffold Express: entry point, middlewares, response wrapper, health
- [x] Middleware JWT + role guards
- [x] Mock payment service
- [x] Rutas (auth, users, categories, dishes, tables, orders, reservations)
- [x] Seed de datos de prueba (`npm run seed`)

## Fase 2: Frontend (Next.js 16 + PWA)
- [x] Init frontend: `create-next-app` con TS + Tailwind
- [x] Configurar Tailwind con design tokens Gourmet Flux
- [x] `globals.css`: variables CSS, sombras, animaciones
- [x] Root layout + Google Fonts + PWA manifest + icons

## Fase 3: Componentes UI Base
- [x] Componentes UI base (Button, Card, Input, Chip, Badge, QuantitySelector)
- [x] Admin Layout: SideNavBar + TopAppBar
- [x] Cliente Layout: TopAppBar + BottomNavBar

## Fase 4: Páginas y librerías
- [x] Páginas: dashboard, menú, mesas, meseros, reservas, login, PWA cliente, cocina, mesero
- [x] `api.ts` (cliente HTTP) + `socket.ts` + `supabase.ts`

## Fase 5: Verificación de bases
- [x] Backend arranca, DB conecta, frontend corre, comunicación OK

---

## Fase 6: Cierre de la aplicación web (completado)
- [x] **IA / VLM real con LM Studio** — `vlm.service.ts` + endpoint `POST /dishes/extract-from-image`
      conectado a la API de LM Studio; el escáner del admin sube la foto y muestra los platillos detectados
- [x] **Dashboard "Reservas Hoy" real** — se elimina el valor hardcodeado; ahora consulta
      `GET /reservations?date=hoy` (excluye canceladas)
- [x] **Pruebas automatizadas (Vitest)** — 18 tests: `payment.service`, `parseVlmResponse`,
      transición de estados de orden y paginación. Ejecutar con `npm test` (en `backend/`)
- [x] **PWA completa** — `public/sw.js` (caché offline del app shell + push) + registro vía
      `ServiceWorkerRegister` + headers del SW en `next.config.ts`
- [x] **Refresh token** — `POST /auth/refresh`, tokens de acceso + refresh emitidos en login/registro,
      renovación automática transparente desde `api.ts` ante un 401
- [x] **Paginación** — opt-in (`?limit=&offset=`) en `GET /orders`, `/dishes` y `/reservations`,
      con metadatos `meta: { total, limit, offset }` (no rompe a los consumidores actuales)

## Limitaciones conocidas restantes (fuera de alcance de esta iteración)
- [ ] Pago real con OpenPay (sigue siendo mock por diseño del proyecto académico)
- [ ] Optimizar consultas N+1 en algunos listados (orders, menú)
- [ ] Tests de integración con BD (los actuales son unitarios de lógica de negocio)
