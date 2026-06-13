# MesaFácil — Rutas API

Base URL: `/api/v1`  
Autenticación: Bearer JWT en header `Authorization` para todas las rutas marcadas con 🔒  
Formato de respuesta: `{ "success": boolean, "data": any, "error": string | null }`

---

## Auth

### POST /auth/register
Registra un nuevo restaurante con su cuenta de administrador.

**Body**
```json
{
  "restaurant_name": "string",
  "email": "string",
  "password": "string"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "token": "jwt_string",
    "restaurant": { "id": 1, "name": "Mi Restaurante" }
  },
  "error": null
}
```

---

### POST /auth/login
Login para administradores y meseros. El campo `role` del token determina qué puede hacer el usuario.

**Body**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "jwt_string",
    "user": { "id": 1, "name": "string", "role": "admin | waiter" }
  },
  "error": null
}
```

---

### POST /auth/forgot-password
Envía un email con enlace de recuperación. El token expira en 1 hora.

**Body**
```json
{ "email": "string" }
```

**Response 200**
```json
{ "success": true, "data": { "message": "Email enviado" }, "error": null }
```

---

### POST /auth/reset-password
Restablece la contraseña usando el token del email de recuperación.

**Body**
```json
{
  "reset_token": "string",
  "new_password": "string"
}
```

**Response 200**
```json
{ "success": true, "data": { "message": "Contraseña actualizada" }, "error": null }
```

---

## Usuarios (Admin y Meseros)

> 🔒 Todas las rutas de este grupo requieren JWT con `role: admin`.  
> El `restaurant_id` se extrae del JWT — nunca del body.

### GET /users
Lista todos los usuarios del restaurante (admins y meseros).

**Response 200**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "string", "email": "string", "role": "admin | waiter" }
  ],
  "error": null
}
```

---

### POST /users
Crea un nuevo usuario interno (típicamente un mesero).

**Body**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "admin | waiter"
}
```

**Response 201**
```json
{
  "success": true,
  "data": { "id": 2, "name": "string", "email": "string", "role": "waiter" },
  "error": null
}
```

---

### DELETE /users/:id
Elimina un usuario del restaurante.

**Response 200**
```json
{ "success": true, "data": { "message": "Usuario eliminado" }, "error": null }
```

---

## Categorías

> 🔒 Requiere JWT con `role: admin`.

### GET /categories
Lista todas las categorías del restaurante ordenadas por `sort_order`.

**Response 200**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Entradas", "sort_order": 1 }
  ],
  "error": null
}
```

---

### POST /categories

**Body**
```json
{ "name": "string", "sort_order": 1 }
```

**Response 201**
```json
{
  "success": true,
  "data": { "id": 1, "name": "Entradas", "sort_order": 1 },
  "error": null
}
```

---

### PATCH /categories/:id

**Body** (todos los campos opcionales)
```json
{ "name": "string", "sort_order": 2 }
```

**Response 200**
```json
{
  "success": true,
  "data": { "id": 1, "name": "Bebidas", "sort_order": 2 },
  "error": null
}
```

---

### DELETE /categories/:id
Solo se puede eliminar si no tiene platillos asociados.

**Response 200**
```json
{ "success": true, "data": { "message": "Categoría eliminada" }, "error": null }
```

---

## Platillos

> 🔒 Requiere JWT con `role: admin`.

### GET /dishes
Lista todos los platillos del restaurante (activos e inactivos).

**Query params opcionales:** `?category_id=1`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category_id": 1,
      "name": "Tacos de Canasta",
      "description": "string",
      "price": "45.00",
      "image_url": "https://...",
      "active": true
    }
  ],
  "error": null
}
```

---

### POST /dishes

**Body** (`multipart/form-data` si incluye imagen, `application/json` si no)
```json
{
  "category_id": 1,
  "name": "string",
  "description": "string",
  "price": 45.00,
  "active": true
}
```

**Response 201**
```json
{
  "success": true,
  "data": { "id": 5, "name": "string", "category_id": 1, "price": "45.00", "active": true },
  "error": null
}
```

---

### PATCH /dishes/:id

**Body** (todos los campos opcionales)
```json
{
  "name": "string",
  "description": "string",
  "price": 50.00,
  "active": false
}
```

**Response 200**
```json
{
  "success": true,
  "data": { "id": 5, "name": "string", "active": false },
  "error": null
}
```

---

### DELETE /dishes/:id
Eliminación física. Se recomienda usar `PATCH` con `active: false` en lugar de eliminar.

**Response 200**
```json
{ "success": true, "data": { "message": "Platillo eliminado" }, "error": null }
```

---

### POST /dishes/extract-from-image
Envía una foto de menú físico al VLM local (LM Studio) y devuelve los platillos detectados para revisión manual del admin.

**Body** (`multipart/form-data`)
```
image: File
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "extracted_dishes": [
      {
        "name": "string",
        "description": "string",
        "price": 45.00,
        "suggested_category": "string"
      }
    ]
  },
  "error": null
}
```

> El resultado pre-llena el formulario del admin. Ningún platillo se guarda automáticamente — el admin revisa y confirma cada uno antes de hacer `POST /dishes`.

---

### POST /dishes/:id/image
Sube o reemplaza la imagen de un platillo existente.

**Body** (`multipart/form-data`)
```
image: File
```

**Response 200**
```json
{
  "success": true,
  "data": { "image_url": "https://cdn.../imagen.jpg" },
  "error": null
}
```

---

## Mesas

> 🔒 Requiere JWT con `role: admin`.

### GET /tables
Lista todas las mesas del restaurante.

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "number": "Terraza A",
      "qr_token": "uuid-v4",
      "waiters": [{ "id": 2, "name": "Briseth" }]
    }
  ],
  "error": null
}
```

---

### POST /tables

**Body**
```json
{ "number": "string" }
```

**Response 201**
```json
{
  "success": true,
  "data": { "id": 3, "number": "5", "qr_token": "uuid-v4" },
  "error": null
}
```

---

### PATCH /tables/:id

**Body** (todos opcionales)
```json
{ "number": "string" }
```

---

### DELETE /tables/:id

**Response 200**
```json
{ "success": true, "data": { "message": "Mesa eliminada" }, "error": null }
```

---

### POST /tables/:id/regenerate-qr
Genera un nuevo `qr_token` para la mesa. El QR anterior deja de funcionar inmediatamente.

**Response 200**
```json
{
  "success": true,
  "data": { "qr_token": "nuevo-uuid-v4" },
  "error": null
}
```

---

### GET /tables/:id/qr
Devuelve la imagen PNG del QR de la mesa para descarga.

**Response:** imagen PNG directa (`Content-Type: image/png`)

---

## Asignación de Meseros a Mesas

> 🔒 Requiere JWT con `role: admin`.

### PUT /tables/:id/waiters
Reemplaza completamente la asignación de meseros de una mesa.

**Body**
```json
{ "waiter_ids": [2, 3] }
```

**Response 200**
```json
{
  "success": true,
  "data": { "table_id": 1, "waiter_ids": [2, 3] },
  "error": null
}
```

> Usar `PUT` (no `PATCH`) porque reemplaza la lista completa. Si se envía `[]` quita todos los meseros.

---

## Menú Público (PWA del cliente)

> ⚡ Sin autenticación. Accesible por cualquier dispositivo con el QR.

### GET /menu/:qr_token
Devuelve el menú completo del restaurante identificado por el token de mesa. Solo incluye categorías con al menos un platillo activo.

**Response 200**
```json
{
  "success": true,
  "data": {
    "restaurant_name": "Mi Restaurante",
    "table_number": "Terraza A",
    "table_id": 1,
    "categories": [
      {
        "id": 1,
        "name": "Entradas",
        "sort_order": 1,
        "dishes": [
          {
            "id": 1,
            "name": "Tacos de Canasta",
            "description": "string",
            "price": "45.00",
            "image_url": "https://..."
          }
        ]
      }
    ]
  },
  "error": null
}
```

**Response 404** si el `qr_token` no existe o está inactivo.

---

## Órdenes

### POST /orders
🔒 Sin autenticación de usuario — la mesa se identifica por `qr_token`.  
Crea la orden y ejecuta el cobro con OpenPay en un solo request. Si el cobro falla, la orden no se crea.

**Body**
```json
{
  "qr_token": "uuid-v4",
  "openpay_token": "tok_xxxx",
  "items": [
    { "dish_id": 1, "quantity": 2, "note": "sin cebolla" },
    { "dish_id": 3, "quantity": 1, "note": "" }
  ]
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "order_id": 42,
    "total": "135.00",
    "status": "paid",
    "items": [
      { "dish_id": 1, "name": "Tacos de Canasta", "quantity": 2, "subtotal": "90.00" }
    ]
  },
  "error": null
}
```

> Al confirmar el cobro, el backend emite el evento `order:new` vía Socket.io al canal del restaurante. La orden aparece en el panel de cocina en menos de 2 segundos.

**Response 402** si OpenPay rechaza el cobro:
```json
{
  "success": false,
  "data": null,
  "error": "Pago rechazado: fondos insuficientes"
}
```

---

### PATCH /orders/:id/status
🔒 Requiere JWT (`role: admin`, `waiter`, o sistema de cocina).  
Transiciona el estado de una orden. Las transiciones válidas son: `paid → ready → delivered`.

**Body**
```json
{ "status": "ready | delivered" }
```

**Response 200**
```json
{
  "success": true,
  "data": { "order_id": 42, "status": "ready" },
  "error": null
}
```

> Al pasar a `ready`, el backend emite el evento `order:ready` vía Socket.io a los meseros asignados a esa mesa.

---

### GET /orders
🔒 Requiere JWT con `role: admin`.  
Lista órdenes del restaurante con filtros opcionales.

**Query params opcionales:** `?status=paid&table_id=1&date=2026-04-21`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "order_id": 42,
      "table_number": "Terraza A",
      "status": "paid",
      "total": "135.00",
      "created_at": "2026-04-21T20:00:00Z",
      "items": []
    }
  ],
  "error": null
}
```

---

## Reservas

> 🔒 Todas las rutas requieren JWT con `role: admin`.

### GET /reservations
**Query params opcionales:** `?date=2026-04-21&table_id=1&status=pending`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "table_id": 2,
      "customer_name": "string",
      "phone": "string",
      "party_size": 4,
      "datetime": "2026-04-21T20:00:00Z",
      "status": "pending | confirmed | cancelled"
    }
  ],
  "error": null
}
```

---

### POST /reservations

**Body**
```json
{
  "table_id": 2,
  "customer_name": "string",
  "phone": "string",
  "party_size": 4,
  "datetime": "2026-04-21T20:00:00Z"
}
```

> `table_id` es opcional — una reserva puede registrarse sin mesa asignada aún.

**Response 201**
```json
{
  "success": true,
  "data": { "id": 1, "status": "pending" },
  "error": null
}
```

---

### PATCH /reservations/:id

**Body** (todos opcionales)
```json
{
  "table_id": 3,
  "status": "confirmed | cancelled",
  "datetime": "2026-04-21T21:00:00Z"
}
```

**Response 200**
```json
{
  "success": true,
  "data": { "id": 1, "status": "confirmed" },
  "error": null
}
```

---

## Eventos Socket.io

El servidor mantiene canales por `restaurant_id`. Los clientes se suscriben al conectarse.

| Evento | Dirección | Canal | Payload | Descripción |
|---|---|---|---|---|
| `order:new` | server → client | `restaurant:{id}` | `{ order_id, table_number, items, created_at }` | Nueva orden pagada. El panel de cocina lo recibe y muestra la orden. |
| `order:ready` | server → client | `restaurant:{id}` | `{ order_id, table_number, table_id, items }` | Cocina marcó "Listo". Lo reciben los meseros asignados a esa mesa. |

---

## Códigos de error comunes

| Código | Significado |
|---|---|
| 400 | Body inválido o parámetros faltantes |
| 401 | Token ausente o inválido |
| 403 | Token válido pero sin permisos para esa acción |
| 404 | Recurso no encontrado (o `qr_token` inexistente) |
| 402 | Cobro rechazado por OpenPay |
| 409 | Conflicto (ej. email ya registrado, transición de estado inválida) |
| 500 | Error interno del servidor |
