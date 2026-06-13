# MesaFácil v1 — Task Tracker

## Fase 0: Estructura del Monorepo
- [x] Crear estructura de carpetas + `.gitignore` + `.env.example` + `README.md`
- [ ] Crear cuenta Supabase + proyecto (manual por el usuario)

## Fase 1: Backend (Express + TypeScript)
- [x] Init backend: `npm init`, instalar deps, configurar TypeScript
- [x] Crear migración SQL `001_initial_schema.sql`
- [x] Scaffold Express: entry point, middlewares, response wrapper, health
- [x] Middleware JWT + role guards
- [x] Mock payment service
- [x] Scaffold de rutas (auth, users, categories, dishes, tables, orders, reservations)
- [ ] Seed de datos de prueba

## Fase 2: Frontend (Next.js + PWA)
- [/] Init frontend: `create-next-app` con TS + Tailwind (instalando...)
- [ ] Configurar Tailwind con design tokens Gourmet Flux
- [ ] `globals.css`: variables CSS, sombras, animaciones
- [ ] Root layout + Google Fonts + PWA manifest + icons

## Fase 3: Componentes UI Base
- [ ] Componentes UI base (Button, Card, Input, Chip, Badge, QuantitySelector)
- [ ] Admin Layout: SideNavBar + TopAppBar
- [ ] Cliente Layout: TopAppBar + BottomNavBar

## Fase 4: Scaffolding de Páginas
- [ ] Scaffold de páginas vacías con layouts correctos
- [ ] `api.ts` (cliente HTTP) + `socket.ts` + `supabase.ts`

## Fase 5: Verificación
- [ ] Verificar: backend arranca, DB conecta, frontend corre, comunicación OK
