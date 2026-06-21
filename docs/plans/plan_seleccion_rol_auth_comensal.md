# Plan: Pantalla de selección de rol, autenticación completa y experiencia de comensal

## Contexto

Hoy MesaFácil solo se opera desde una "consola de desarrollo" (`app/page.tsx`) con botones directos a `/dashboard`, `/kitchen`, `/waiter` (sin protección de rol) y un simulador de QR. No existe forma sana de que un usuario "normal" abra la PWA: no hay pantalla de elección de rol, el registro de restaurante está en el backend pero el enlace del frontend está muerto, no hay UI para gestionar meseros, no hay logout, y `/kitchen` / `/waiter` los abre cualquiera.

El objetivo es que al abrir la app **sin** escanear un QR, el usuario elija su rol:
- **Comensal** — disponible para todos, **sin cuenta** (entra como invitado): lista de restaurantes registrados + escaneo de QR.
- **Administrador** — funciona si tiene un restaurante registrado (inicia sesión → dashboard).
- **Mesero** — funciona solo si un dueño le dio ese derecho en su gestión de meseros (inicia sesión → monitor de meseros).

**Decisiones confirmadas con el usuario:**
1. **Identidad = comensal anónimo.** Cada cuenta sigue siendo 1 rol en 1 restaurante (sin migración de BD). El escenario "el mesero va a comer el finde" se cubre porque entra como invitado sin loguearse.
2. **Comensal desde la lista** puede **ver el menú** (descubrimiento); para **ordenar/pagar debe escanear el QR** de su mesa.
3. **Escaneo QR = cámara real + entrada manual** de respaldo.

## Arquitectura actual (referencia)

- **BD** (`backend/src/db/migrations/001_initial_schema.sql`): `restaurants(email, password_hash)`, `users(restaurant_id, email UNIQUE global, role enum admin|waiter)`, `table_waiters` (N:M), etc. El comensal no es un rol (anónimo vía `/mesa/[qr_token]`).
- **Auth backend** (`auth.routes.ts`): `POST /auth/register` (crea restaurante + user admin), `POST /auth/login` (solo tabla `users`, token `{userId, restaurantId, role}`), `POST /auth/refresh`. JWT en `middleware/auth.ts`, gating en `middleware/roleGuard.ts`.
- **Gestión de personal backend** (`users.routes.ts`): `GET/POST/DELETE /users` (solo admin) — **sin UI**.
- **Frontend**: `app/login/page.tsx` (siempre redirige a `/dashboard`, enlaces de registro/olvido muertos), `app/(admin)/layout.tsx` (solo checa que exista token, **no** el rol), `/kitchen` y `/waiter` **sin guard**. El patrón de decodificar el token (`atob`) está duplicado en kitchen/waiter/dashboard. `lib/api.ts` ya tiene `setTokens` y `removeToken`. `lib/socket.ts` tiene `connectToRestaurant`.

## Cambios propuestos (Opción A — sin migración de BD)

### Backend

1. **Endpoints públicos de restaurantes** — nuevo `backend/src/routes/restaurants.routes.ts`, montado sin `authenticate` en `src/index.ts`:
   - `GET /restaurants` → `[{ id, name }]` (descubrimiento del comensal).
   - `GET /restaurants/:id/menu` → categorías + platillos activos. **Reutilizar** la lógica de armado de menú que ya existe en `orders.routes.ts` (`GET /menu/:qr_token`): extraerla a un helper compartido `buildRestaurantMenu(restaurantId)` y usarla en ambos endpoints (evita duplicar y el N+1 ya conocido se resuelve con `json_agg` igual que en `GET /orders`).

2. **`GET /auth/me`** (autenticado) en `auth.routes.ts`: devuelve `{ user: {name, role}, restaurant: {id, name} }` haciendo join `users`→`restaurants`. Sirve para el header del admin (hoy hardcodeado "Administrador / La Terraza"), el saludo del mesero, y revalidar sesión tras recargar.

3. Sin migración de BD para el flujo principal. *(Opcional, marcar como deuda técnica: limpiar la duplicación de credenciales `restaurants.email/password_hash` vs `users`; y campos de branding `logo_url/description` en `restaurants` para una lista de comensal más rica.)*

### Frontend — Infraestructura de auth

4. **`lib/auth.ts`** (nuevo): centraliza lo duplicado.
   - `getCurrentUser()` → decodifica el JWT a `{ userId, restaurantId, role }` (reemplaza los `atob(...)` repetidos en kitchen/waiter/dashboard).
   - `logout()` → `removeToken()` (ya existe en `lib/api.ts`) + redirige a `/`.

5. **Guards por rol**:
   - `app/(admin)/layout.tsx`: exigir `role === 'admin'`; si es `waiter` → redirigir a `/waiter`; sin token → `/login`.
   - `app/kitchen/page.tsx` y `app/waiter/page.tsx`: agregar guard (requiere `waiter` o `admin`); hoy están abiertos. Patrón compartido reutilizable (pequeño componente/HOC o un hook `useRequireRole`).

6. **Login con rol** (`app/login/page.tsx`): tras `POST /auth/login`, ramificar por `role` (admin→`/dashboard`, waiter→`/waiter`). Aceptar `?role=` (pista del selector) para el copy y validar incongruencias ("esta cuenta no es de mesero"). Conectar los enlaces muertos (registro / —olvido se deja como pendiente fuera de alcance—).

### Frontend — Selección de rol (landing)

7. **Reemplazar `app/page.tsx`** por el **selector de rol**: 3 tarjetas con el estilo actual (Card `rounded-2xl`, botones `rounded-xl`):
   - **Administrador** → `/login?role=admin` (con enlace a `/register` si no tiene cuenta).
   - **Mesero** → `/login?role=waiter`.
   - **Comensal** → `/explore`.
   - Conservar los accesos directos de desarrollo (kitchen/dashboard/waiter) **solo** si `process.env.NODE_ENV !== 'production'`, para no perder la consola operativa del equipo.

### Frontend — Registro y gestión de meseros

8. **Página de registro** `app/register/page.tsx`: form (`restaurant_name`, `email`, `password`) → `POST /auth/register` → `setTokens` → `/dashboard`. Reutiliza componentes `Input`/`Button`.

9. **Gestión de meseros** `app/(admin)/staff/page.tsx` (nuevo): listar (`GET /users`), crear mesero (`POST /users` con `role: 'waiter'`), borrar (`DELETE /users/:id`) — todo ya existe en backend. Agregar ítem en `components/admin/SideNavBar.tsx`. (La asignación mesero↔mesa ya vive en la página de mesas.) Reusar el **modal de confirmación de borrado** del estilo ya creado en la página de menú.

### Frontend — Experiencia de comensal

10. **`app/explore/page.tsx`**: `GET /restaurants` → lista de tarjetas; botón **"Escanear QR"** (cámara) + entrada manual de token/enlace; al elegir restaurante → `/restaurant/[id]`.

11. **`app/restaurant/[id]/page.tsx`**: menú **solo lectura** (`GET /restaurants/:id/menu`), **reutilizando** el render de platillos de `app/mesa/[qrToken]/page.tsx` (extraer a un componente compartido p.ej. `components/client/DishList`). CTA prominente "Escanea el QR de tu mesa para ordenar" (sin carrito).

12. **Escáner QR con cámara** — componente nuevo `components/client/QrScanner.tsx` usando una librería ligera (p.ej. `@zxing/browser` o `html5-qrcode`; **agregar dependencia**). Al leer, extraer el `qr_token` de la URL/*token* y enrutar a `/mesa/[token]`. Mantener la entrada manual como respaldo (ya existe en `app/page.tsx`, se mueve a `/explore`). Nota: la cámara requiere HTTPS o `localhost`.

### Frontend — Pulido

13. **Logout** en `SideNavBar` y en los headers de `/kitchen` y `/waiter`.
14. Header del admin con datos reales desde `GET /auth/me` (en vez de "Administrador / La Terraza" hardcodeado).

## Archivos críticos

- **Backend nuevo/modificado**: `src/routes/restaurants.routes.ts` (nuevo), `src/routes/auth.routes.ts` (+`/me`), `src/routes/orders.routes.ts` (extraer `buildRestaurantMenu`), `src/index.ts` (montar `/restaurants`).
- **Frontend nuevo**: `lib/auth.ts`, `app/register/page.tsx`, `app/explore/page.tsx`, `app/restaurant/[id]/page.tsx`, `app/(admin)/staff/page.tsx`, `components/client/QrScanner.tsx`, `components/client/DishList.tsx`.
- **Frontend modificado**: `app/page.tsx` (selector de rol), `app/login/page.tsx`, `app/(admin)/layout.tsx`, `app/kitchen/page.tsx`, `app/waiter/page.tsx`, `components/admin/SideNavBar.tsx`, `app/mesa/[qrToken]/page.tsx` (extraer DishList).

## Fases sugeridas

1. **Fundamentos de auth**: `lib/auth.ts`, guards por rol (admin/kitchen/waiter), logout, `GET /auth/me`, login ramificado por rol, página de registro.
2. **Selector de rol + gestión de meseros**: nuevo `app/page.tsx`, `app/(admin)/staff` + ítem en SideNav.
3. **Descubrimiento de comensal**: endpoints `/restaurants`, `/explore`, `/restaurant/[id]`, escáner QR con cámara, extracción de `DishList`.

## Verificación (end-to-end)

- **Registro**: `/register` crea restaurante → cae en `/dashboard`. (Backend: `npm test` sigue verde; `tsc --noEmit` en front y back.)
- **Roles/guard**: el admin crea un mesero en `/staff`; logout; login como mesero → cae en `/waiter` y **no** puede abrir `/dashboard` (redirige). Abrir `/kitchen` sin sesión redirige a login/selector.
- **Comensal**: landing → "Comensal" → `/explore` → lista de restaurantes → ver menú (sin poder ordenar) → "Escanear QR" (cámara o manual) → `/mesa/[token]` → ordenar/pagar → el pedido aparece en cocina y mesero en tiempo real (flujo ya existente).
- **Login por rol**: una cuenta admin que entra por "Mesero" recibe mensaje claro de incongruencia.
- Revisar que el comensal-mesero (mismo correo) puede comer como invitado sin cerrar/abrir su sesión de trabajo (son contextos separados: invitado no usa token).
