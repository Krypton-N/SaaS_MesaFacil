# Documento Técnico — MesaFácil v1

> Elaborado para defensa en entrevista técnica.  
> Basado exclusivamente en el código fuente del repositorio.

---

## 1. Resumen ejecutivo

MesaFácil es un sistema de gestión de restaurantes multi-tenant que digitaliza tres flujos simultáneos: el pedido del comensal (vía QR sin instalación de app), el panel de administración del restaurante (menú, mesas, reservas) y los monitores de cocina/mesero con actualización en tiempo real. Resuelve la fricción del proceso papel+mesero sustituyéndolo por un ciclo QR → carrito → pago → cocina → entrega completamente digital.

---

## 2. Objetivo y problema que resuelve

**Problema:** En restaurantes pequeños/medianos, el proceso de toma de pedido depende de meseros que anotan en papel, acumulan errores de transcripción y crean cuellos de botella en horas pico.

**Solución:** El comensal escanea un QR en su mesa → ve el menú actualizado → arma su carrito → paga → el pedido aparece automáticamente en cocina sin intermediarios. El mesero solo recibe la alerta de "platillo listo para servir".

---

## 3. Funcionalidades principales

| Módulo | Funcionalidades |
|---|---|
| **Admin** | Registro/login de restaurante, CRUD de categorías y platillos, gestión de mesas + generación de QR, CRUD de meseros, gestión de reservas, dashboard con KPIs del día |
| **Cliente (PWA)** | Menú por QR sin login, navegación por categorías, carrito persistido en localStorage, checkout con tarjeta (simulado), recibo digital post-pago |
| **Cocina** | Monitor en tiempo real de órdenes pagadas, alerta sonora al llegar nuevo pedido, botón único "Marcar Listo" |
| **Mesero** | Monitor en tiempo real de órdenes listas en cocina, alerta sonora + tarjeta pop-over destacada, botón "Entregado a comensal" |

---

## 4. Arquitectura y flujo de datos

### Estructura de directorios (código fuente)

```
MesaFacil_v1/
├── backend/
│   └── src/
│       ├── config/        # database.ts (pg Pool), env.ts (Zod), supabase.ts
│       ├── db/
│       │   └── migrations/001_initial_schema.sql
│       ├── middleware/    # auth.ts, roleGuard.ts, validate.ts, errorHandler.ts
│       ├── routes/        # auth, users, categories, dishes, tables, orders, reservations
│       ├── services/      # payment.service.ts (mock OpenPay)
│       ├── types/         # index.ts — tipos compartidos + eventos Socket.io
│       └── index.ts       # Express + Socket.io init
└── frontend/
    └── src/
        ├── app/
        │   ├── (admin)/   # dashboard, menu, tables, waiters, reservations
        │   ├── mesa/[qrToken]/  # page (menú), cart, checkout
        │   ├── kitchen/   # monitor cocina
        │   ├── waiter/    # monitor mesero
        │   └── login/
        ├── components/    # ui/ (Button, Card, Input, Chip, Badge, QuantitySelector)
        │                  # admin/ (SideNavBar), client/ (BottomNavBar)
        └── lib/           # api.ts, socket.ts, supabase.ts
```

### Flujo extremo a extremo: pedido de un comensal

```
[Mesa física] → QR impreso en mesa
       │
       ▼
[Comensal escanea QR]
       │  GET /api/v1/menu/{qr_token}  (sin auth)
       ▼
[Backend: busca table por qr_token → extrae restaurant_id → devuelve categorías+platillos activos]
       │
       ▼
[Cliente: carrito en localStorage → mesafacil_cart_{qrToken}]
       │
       ▼
[Checkout: POST /api/v1/orders]
  body: { qr_token, openpay_token, items[] }
       │
       ├── 1. Lookup table por qr_token (verifica que pertenezca a un restaurante)
       ├── 2. Valida precios server-side (evita tampering del cliente)
       ├── 3. processPayment() → mock: siempre OK + genera charge_id
       ├── 4. INSERT orders (status='paid') + INSERT order_items
       └── 5. io.to('restaurant:{id}').emit('order:new', {...})
                            │
                            ▼
             [Socket.io — room restaurant:{id}]
                  ┌─────────────────────┐
                  │    Kitchen page     │  recibe 'order:new' → muestra tarjeta + sonido
                  └─────────────────────┘

[Cocina presiona "Marcar Listo"]
       │  PATCH /api/v1/orders/{id}/status  body: {status:'ready'}
       ├── Valida transición de estado (paid → ready)
       └── io.to('restaurant:{id}').emit('order:ready', {...})
                            │
                            ▼
                  ┌─────────────────────┐
                  │    Waiter page      │  recibe 'order:ready' → alerta + pop-over + sonido
                  └─────────────────────┘

[Mesero presiona "Entregado"]
       │  PATCH /api/v1/orders/{id}/status  body: {status:'delivered'}
       └── Valida transición (ready → delivered)
```

### Diagrama de capas

```
┌─────────────────────────────────────────────────┐
│            Frontend — Next.js 16 (App Router)    │
│  (admin)/  |  mesa/[qrToken]/  |  kitchen/ waiter/│
│            lib/api.ts (HTTP)                      │
│            lib/socket.ts (WebSocket)              │
└───────────────────┬──────────────────────────────┘
                    │ HTTP + WS (localhost:3001)
┌───────────────────▼──────────────────────────────┐
│              Backend — Express 5 + Socket.io      │
│  Middleware: helmet, cors, morgan, auth, validate │
│  Routes: /auth /users /categories /dishes        │
│          /tables /orders /reservations           │
│  Services: payment.service.ts (mock)             │
└───────────────────┬──────────────────────────────┘
                    │ pg Pool (max 20 conn)
┌───────────────────▼──────────────────────────────┐
│         PostgreSQL en Supabase (cloud)           │
│  8 tablas con multi-tenant via restaurant_id     │
└──────────────────────────────────────────────────┘
                    │ (solo para imágenes)
┌───────────────────▼──────────────────────────────┐
│         Supabase Storage (opcional)              │
│  supabase.ts — upload/getPublicUrl               │
└──────────────────────────────────────────────────┘
```

---

## 5. Stack técnico (versiones reales del package.json)

### Backend (`backend/package.json`)

| Tecnología | Versión | Rol |
|---|---|---|
| TypeScript | ^6.0.3 | Lenguaje principal |
| Node.js | (runtime, sin versión fijada) | Runtime |
| Express | ^5.2.1 | Framework HTTP |
| Socket.io | ^4.8.3 | Comunicación en tiempo real |
| pg | ^8.21.0 | Driver PostgreSQL (node-postgres) |
| @supabase/supabase-js | ^2.106.2 | Cliente Storage de Supabase |
| jsonwebtoken | ^9.0.3 | Generación/verificación de JWT |
| bcryptjs | ^3.0.3 | Hash de contraseñas |
| zod | ^4.4.3 | Validación de schemas (request body + env vars) |
| qrcode | ^1.5.4 | Generación de imagen QR (PNG buffer) |
| helmet | ^8.2.0 | Headers de seguridad HTTP |
| cors | ^2.8.6 | CORS |
| morgan | ^1.10.1 | Logging de requests HTTP |
| multer | ^2.1.1 | Upload de archivos (imágenes de platillos) |
| dotenv | ^17.4.2 | Variables de entorno |
| uuid | ^14.0.0 | Generación de UUIDs |
| tsx | ^4.22.4 | Ejecutor TypeScript en dev (sin compilar) |

### Frontend (`frontend/package.json`)

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 16.2.7 | Framework React con App Router |
| React | 19.2.4 | UI library |
| TypeScript | ^5 | Tipado estático |
| Tailwind CSS | ^4 | Estilos utilitarios |
| socket.io-client | ^4.8.3 | Conexión Socket.io |
| @supabase/supabase-js | ^2.106.2 | Cliente Supabase (frontend) |

---

## 6. Dependencias clave y razón de cada una

**`pg` (node-postgres) en vez de ORM:**  
Se eligió acceso directo a PostgreSQL con el driver nativo para tener control total sobre las queries y evitar la magia/overhead de un ORM. El trade-off es que hay que construir queries SQL dinámicas manualmente (PATCH de dishes) y se introducen N+1 queries en listados.

**`zod` para doble propósito:**  
Se usa tanto para validar `process.env` al iniciar el servidor (`env.ts`) como para validar los request bodies en los middlewares. Esto permite un modelo de validación uniforme y fail-fast: si faltan variables de entorno críticas, el proceso termina con `process.exit(1)` antes de aceptar tráfico.

**`socket.io` en mismo servidor que Express:**  
La instancia de Socket.io se monta sobre el mismo `http.Server` de Express. Esto simplifica el deployment (un solo puerto/proceso) y permite que los route handlers accedan a `io` via `req.app.get('io')` sin necesidad de pasar la instancia por toda la cadena.

**`qrcode` server-side:**  
El QR se genera en backend como buffer PNG y se sirve directamente como `image/png`. El cliente solo hace `GET /tables/{id}/qr` y puede descargar o imprimir. Esto centraliza la lógica de URL del menú (`/mesa/{qr_token}`) en el servidor.

**`@supabase/supabase-js` solo para Storage:**  
Supabase se usa exclusivamente como CDN de imágenes de platillos. La autenticación y la base de datos se gestionan de forma independiente (JWT propio + pg directo). Esto evita el vendor lock-in de Supabase Auth y da control total sobre el modelo multi-tenant.

**`bcryptjs` con rounds=12:**  
Se eligió bcryptjs (JS puro) sobre el módulo nativo `bcrypt` (C++) para evitar dependencias de compilación nativa en Windows/CI. Cost factor 12 es el estándar actual para producción.

---

## 7. Técnicas, algoritmos y patrones de diseño

### Patrones de diseño

**Middleware factory (Strategy):**  
`requireRole(...allowedRoles)` y `validate(schema)` son factory functions que devuelven middlewares con parámetros cerrados en closure. Esto permite composición declarativa en las rutas:
```ts
router.get('/', authenticate, requireRole('admin'), handler)
```

**Singleton con lazy init (socket.ts):**  
La conexión Socket.io del frontend se crea una sola vez via `getSocket()`. Las llamadas subsecuentes retornan la misma instancia, evitando conexiones duplicadas al navegar entre páginas en Next.js.

**Repository informal via `query()` wrapper:**  
`database.ts` exporta un helper `query(text, params)` que centraliza el logging de queries en desarrollo y el manejo del pool. No es un repositorio completo pero sí una capa de abstracción mínima.

**Respuesta envolvente (Envelope/Wrapper) consistente:**  
Todos los endpoints devuelven `{ success: boolean, data: T | null, error: string | null }`, tipado en `ApiResponse<T>`. Esto permite al cliente hacer `if (res.success)` sin inspeccionar el status code para lógica de negocio.

### State Machine para órdenes

Los estados de una orden forman una máquina de estados unidireccional validada en el servidor:

```
pending_payment → paid → ready → delivered
```

El mapa de transiciones válidas en `orders.routes.ts` línea 150:
```ts
const validTransitions: Record<string, string> = {
  paid: 'ready',
  ready: 'delivered',
};
```

Si se intenta una transición inválida, responde `409 Conflict` con descripción de la transición fallida.

### Multi-tenant isolation

Cada query que accede a datos de negocio filtra por `restaurant_id` extraído del JWT (`req.user!.restaurantId`). No se usa Row Level Security de PostgreSQL — la aislación está en la capa de aplicación. Ejemplo del patrón en dishes:
```sql
WHERE category_id IN (SELECT id FROM categories WHERE restaurant_id = $N)
```

### Precio validado server-side

Al crear una orden, el servidor re-consulta el precio de cada platillo desde la base de datos (no confía en el precio enviado por el cliente). Solo así calcula el total real a cobrar. Esto previene que un cliente modifique precios en el frontend.

---

## 8. Metodología de desarrollo

- **Marco:** Scrum gestionado en Jira (proyecto `SCRUM` en `orcusdev.atlassian.net`)
- **Sprints:** 5 sprints de 2 semanas cada uno
- **Épicas:** 6 (Documentación/Diseño, Entorno, Administración, PWA Cliente, Cocina/Mesero, Pruebas)
- **Issues:** 50 totales (6 épicas + 44 historias de usuario)
- **Entrega incremental:** Cada sprint entrega un módulo funcional demostrable
- **Sprint 1:** Solo análisis, diseño del modelo de datos y setup del entorno
- **Sprints 2-3:** Backend + frontend del panel admin
- **Sprint 4:** PWA del cliente (el flujo QR → pago)
- **Sprint 5:** Cocina, mesero, pruebas E2E

---

## 9. Decisiones técnicas clave y sus trade-offs

### 1. Express 5 (no estable en npm como default) vs Express 4

**Decisión:** `express@^5.2.1`  
**Por qué:** Express 5 maneja `async/await` en route handlers de forma nativa sin necesidad de `try/catch` wrapper manual o librerías como `express-async-handler`. Los errores en handlers async se propagan automáticamente al error handler.  
**Trade-off:** La versión 5 tiene menos recursos en Stack Overflow y algunos middlewares de terceros pueden tener incompatibilidades.

### 2. Raw SQL vs ORM (Prisma, TypeORM, Drizzle)

**Decisión:** `pg` directamente con queries parametrizadas.  
**Por qué:** Proyecto académico con esquema bien definido desde el inicio (una migración). El ORM añadiría complejidad de configuración y abstracciones que no se necesitan en un equipo que conoce SQL.  
**Trade-off:** Se introduce el **problema N+1** en varios listados. Por ejemplo, en `GET /tables` se hace una query por tabla para buscar sus meseros. Con un JOIN o un ORM con eager loading, sería una sola query.

### 3. JWT propio vs Supabase Auth

**Decisión:** JWT generado con `jsonwebtoken`, sin usar Supabase Auth.  
**Por qué:** Supabase Auth maneja usuarios como entidades globales (uno por email a nivel plataforma). El modelo multi-tenant de MesaFácil requiere que el mismo email pueda existir como admin en un restaurante y como mesero en otro. Además, el JWT del proyecto lleva `{ userId, restaurantId, role }` — un payload imposible de personalizar fácilmente con Supabase Auth.  
**Trade-off:** Hay que implementar y mantener el ciclo de vida del token manualmente (no hay refresh token implementado — la sesión expira en 24h y el usuario tiene que re-loguear).

### 4. Cart en localStorage vs sesión en backend

**Decisión:** `localStorage.getItem('mesafacil_cart_{qrToken}')`  
**Por qué:** El cliente no tiene cuenta ni sesión. Almacenar el carrito en el servidor requeriría identificar al comensal de alguna forma (cookie, session ID) y añade estado al backend.  
**Trade-off:** El carrito se pierde si el usuario limpia el localStorage o cambia de dispositivo. No hay sincronización entre pestañas (aunque hay un evento DOM custom `cart-updated` para sincronizar el badge de la barra inferior).

### 5. Socket.io rooms vs broadcasting global

**Decisión:** Los clientes (cocina, mesero) hacen `socket.join('restaurant:{id}')` y los eventos se emiten a ese room.  
**Por qué:** Permite que múltiples restaurantes compartan el mismo servidor Socket.io sin que los eventos de un restaurante lleguen a las pantallas de otro. Escala horizontalmente en diseño aunque no en implementación actual (single process).  
**Trade-off:** Si se escala a múltiples instancias del backend, se necesita un adapter de Socket.io (ej: Redis Adapter) para que los rooms funcionen entre procesos.

### 6. Supabase solo para Storage, not for DB access

**Decisión:** La base de datos se accede vía `pg` (conexión directa al PostgreSQL de Supabase), no vía el cliente Supabase (que usaría el PostgREST de Supabase).  
**Por qué:** El cliente Supabase de datos requeriría Row Level Security bien configurada. Con `pg` directo se tiene SQL completo y control fino, a costa de gestionar el pool manualmente.  
**Trade-off:** Si Supabase cambia la URL de conexión o las políticas de conexión directa, hay que actualizar la configuración.

### 7. Mock de OpenPay vs integración real

**Decisión:** `payment.service.ts` simula la pasarela con delay aleatorio (500-1200ms) y devuelve siempre éxito.  
**Por qué:** Proyecto escolar. La interfaz (`PaymentResult`) y la firma de `processPayment()` están diseñadas para que reemplazar el mock por la SDK real de OpenPay requiera cambiar **solo** el cuerpo de la función, no los callers.  
**Evidencia:** El comentario en el archivo lo dice explícitamente. El diseño cumple el principio Open/Closed.

---

## 10. Retos enfrentados y cómo se resolvieron

### Acceso a `io` desde los route handlers

**Problema:** Socket.io se inicializa en `index.ts`, pero los handlers de rutas están en módulos separados. Pasarlo como parámetro rompería la firma de Express.  
**Solución:** `app.set('io', io)` almacena la instancia en el objeto `app` de Express, y los handlers la recuperan via `req.app.get('io')`. Patrón de "service locator" acoplado al framework pero efectivo para el alcance del proyecto.

### Validación de variables de entorno al arranque

**Problema:** Un `.env` incompleto provoca errores crípticos en runtime.  
**Solución:** `env.ts` usa `z.object(...).safeParse(process.env)`. Si falla, imprime los campos inválidos y hace `process.exit(1)` antes de que el servidor acepte conexiones. Fail-fast explícito.

### Multi-tenant sin Row Level Security

**Problema:** PostgreSQL en Supabase soporta RLS, pero configurarlo para todos los queries requería tiempo extra de setup.  
**Solución:** Toda query de datos de negocio filtra explícitamente por `restaurant_id` del JWT. La revisión de código garantizaría que ningún handler olvide este filtro — aunque no está automatizado.

### Sincronización del badge del carrito en Next.js

**Problema:** La página del menú y el layout (que muestra el badge con el count del carrito) son componentes distintos. Actualizar el carrito en la página no notifica al layout.  
**Solución:** `window.dispatchEvent(new Event('cart-updated'))`. El layout escucha ese evento y re-lee localStorage. Solución simple sin estado global (no se usa Zustand, Context ni Redux).

---

## 11. Estado actual y limitaciones conocidas

| Aspecto | Estado |
|---|---|
| Panel admin (CRUD menú, mesas, users) | **Funcional** |
| Flujo QR → menú → carrito → pago → cocina | **Funcional** (pago mock) |
| Monitor cocina y mesero en tiempo real | **Funcional** |
| Reservas | **Funcional** (backend + frontend) |
| Pago real con OpenPay | **NO implementado** — mock |
| Extracción de menú por IA (VLM / LM Studio) | **NO implementado** — endpoint stub que devuelve datos hardcodeados |
| Upload de imágenes de platillos | **Parcialmente** — código de Supabase Storage existe, multer configurado, integración en el route de dishes no completa |
| Refresh token | **NO** — el JWT expira en 24h y no hay renovación automática |
| Paginación en endpoints | **NO** — todos los listados devuelven registros sin límite |
| N+1 queries | **Presente** en tablas (waiters por tabla), órdenes (items por orden) |
| `reservationsToday` en dashboard | **Hardcodeado en 3** — es un placeholder para demo |
| Pruebas automatizadas | **NO** — no hay test suite implementada en el código fuente |
| HTTPS / producción | **NO configurado** — todo en `localhost` |

---

## 12. Posibles mejoras / siguiente iteración

1. **Integración real OpenPay:** Reemplazar el body de `processPayment()` con la SDK de OpenPay.js. El frontend ya tiene el formulario de tarjeta; solo falta tokenizar client-side y enviar el token al backend.

2. **VLM con LM Studio:** El endpoint `POST /dishes/extract-from-image` ya existe como stub. Se necesita: multipart upload de imagen via multer → llamada a la API OpenAI-compatible de LM Studio (`LM_STUDIO_URL` ya está en `env.ts`) → parsear la respuesta a `{ name, price, category }`.

3. **Resolver N+1 queries:** Reemplazar loops de queries individuales por JOINs o `IN` clauses. Ejemplo para tables+waiters:
   ```sql
   SELECT t.*, u.id as waiter_id, u.name as waiter_name
   FROM tables t LEFT JOIN table_waiters tw ON t.id = tw.table_id
   LEFT JOIN users u ON tw.user_id = u.id
   WHERE t.restaurant_id = $1
   ```

4. **Refresh token:** Añadir un endpoint `POST /auth/refresh` y almacenar un refresh token (HttpOnly cookie) para renovar el access token sin re-login.

5. **Paginación:** Añadir `LIMIT` y `OFFSET` (o cursor-based pagination) a `/orders` y `/dishes`, con metadatos `{ total, page, limit }` en la respuesta.

6. **Socket.io Redis Adapter:** Para escalar a múltiples instancias del backend detrás de un load balancer.

7. **PWA real:** Añadir `manifest.json` y un Service Worker para que la página del cliente sea instalable offline y cargue el menú en caché.

---

## 13. Preguntas técnicas probables y respuestas ancladas en el código

---

**P: ¿Cómo previenen que un cliente manipule el precio en el frontend para pagar menos?**

R: En `orders.routes.ts` líneas 47-71, al crear una orden el servidor **re-consulta el precio de cada platillo** desde la base de datos (`SELECT d.price FROM dishes WHERE d.id = $1`). El cliente solo envía `dish_id` y `quantity`. El `total` y los `subtotales` los calcula el servidor, nunca confía en los valores del body del request.

---

**P: ¿Cómo aseguran que un mesero de restaurante A no vea los pedidos del restaurante B?**

R: El JWT contiene `{ userId, restaurantId, role }` (ver `auth.ts` y `JwtPayload`). El middleware `authenticate` verifica la firma y pone `req.user` con esos valores. Cada query de datos de negocio filtra por `req.user.restaurantId`. En `orders.routes.ts` línea 139: `WHERE t.restaurant_id = $2` donde `$2 = req.user.restaurantId`. La aislación es a nivel de aplicación, no de RLS de PostgreSQL.

---

**P: ¿Por qué usaron Socket.io en vez de WebSockets nativos?**

R: Socket.io provee: salas (rooms) que permiten aislar eventos por restaurante sin lógica manual, reconexión automática (configurado con `reconnectionAttempts: 10, reconnectionDelay: 1000` en `socket.ts`), y fallback a long-polling si WebSocket no está disponible. El overhead es mínimo para este caso de uso.

---

**P: ¿Cómo funciona el sistema de QR? ¿Qué pasa si imprimen el QR y después lo regeneran?**

R: Cada mesa tiene un `qr_token UUID` generado por PostgreSQL con `gen_random_uuid()`. El QR codifica la URL `http://localhost:3000/mesa/{qr_token}`. El endpoint `POST /tables/{id}/regenerate-qr` ejecuta `UPDATE tables SET qr_token = gen_random_uuid()`. Esto **invalida el QR impreso anterior** — cualquier comensal que escanee el QR viejo recibirá 404. La consecuencia es que al regenerar hay que reimprimir y recolocar el QR en la mesa. Es una limitación de diseño conocida.

---

**P: ¿Cómo está diseñada la máquina de estados de las órdenes?**

R: Los estados son un ENUM PostgreSQL: `pending_payment | paid | ready | delivered`. Las transiciones válidas están en un mapa en `orders.routes.ts`:
```ts
const validTransitions: Record<string, string> = { paid: 'ready', ready: 'delivered' };
```
Si `validTransitions[order.status] !== status` el endpoint devuelve `409 Conflict` con el mensaje `"Transición inválida: {actual} → {solicitado}"`. La orden nunca puede ir hacia atrás ni saltar estados.

---

**P: ¿Por qué el backend expone el `io` via `app.set()`? ¿No es un antipatrón?**

R: Es un trade-off pragmático. Las alternativas serían: (a) pasar `io` como parámetro a cada función de router — contamina todas las firmas; (b) exportar `io` como singleton — crea dependencias circulares entre módulos porque `index.ts` importa los routers y los routers importarían `index.ts`; (c) inyección de dependencias formal — excesivo para un proyecto de este alcance. `app.set/get` es el patrón que recomienda la documentación de Express para compartir instancias con los handlers. El acoplamiento es con el framework, no con un módulo propio.

---

**P: ¿Cómo validan las variables de entorno?**

R: `env.ts` usa `z.object({...}).safeParse(process.env)`. El schema define tipos, valores por defecto y mensajes de error. Si `parsed.success === false`, imprime los errores por campo y llama `process.exit(1)`. Esto garantiza que el servidor nunca arranca con configuración inválida — es un fail-fast explícito en el límite del sistema (lectura de entorno).

---

**P: ¿Qué pasa si la BD cae mientras hay un request en vuelo?**

R: El pool `pg` tiene `connectionTimeoutMillis: 10000`. Si no puede obtener una conexión en 10 segundos, `pool.query()` lanza un error. El `try/catch` en cada handler lo captura y devuelve `500 Internal Server Error` con el mensaje genérico. El error handler global (`errorHandler.ts`) también maneja los errores no capturados en handlers. El endpoint `/api/v1/health` consulta `SELECT NOW()` y devuelve `503` si falla — útil para health checks de infraestructura.

---

**P: ¿Cómo se comunican el panel de admin (Next.js) y el backend? ¿Usan Server Actions o fetch puro?**

R: Fetch puro desde el cliente (browser). `lib/api.ts` es un cliente HTTP tipado que envuelve `fetch`, agrega automáticamente el header `Authorization: Bearer {token}` desde `localStorage`, y maneja el 401 redirigiendo a `/login`. No se usan Server Actions de Next.js — toda la lógica de negocio está en el backend Express y el frontend es un cliente REST tradicional.

---

## 3 cosas más impresionantes desde el punto de vista de ingeniería

### 1. Arquitectura multi-tenant completa en un proyecto académico
El sistema no es un CRUD simple: cada restaurante es un tenant completamente aislado. El JWT lleva `restaurantId` y **cada** query de datos filtra por esa clave. Esto requirió diseñar el esquema de BD, el modelo de autenticación y los middlewares pensando en multi-tenancy desde el día uno. Es un patrón que se usa en SaaS reales (Slack, Notion, Linear) y haberlo implementado correctamente en un semestre es significativo.

### 2. Event-driven real-time con Socket.io rooms bien diseñadas
El flujo `comensal paga → cocina recibe alerta → mesero recibe alerta` no usa polling: es un pipeline de eventos en tiempo real. La arquitectura de rooms (`restaurant:{id}`) permite que múltiples restaurantes compartan la misma instancia de Socket.io sin contaminar sus eventos. El código de emisión (`io.to('restaurant:${id}').emit(...)`) está integrado directamente en los handlers de los endpoints REST — el mismo request HTTP que crea la orden también dispara el evento en tiempo real.

### 3. Diseño para sustitución: el servicio de pago como interfaz
`payment.service.ts` es un ejemplo textbook del principio Open/Closed. Tiene una interfaz bien definida (`PaymentResult`), una implementación mock documentada explícitamente, y está diseñado para que la integración real con OpenPay requiera cambiar **solo** el cuerpo de `processPayment()` — sin tocar ningún route handler. Esto demuestra que el autor pensó en extensibilidad futura sin sobre-ingenierizar el presente.

---

*Documento generado el 2026-06-09 a partir del análisis directo del código fuente.*
