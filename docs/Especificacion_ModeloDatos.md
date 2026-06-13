# Modelo de Datos — MesaFácil

Base de datos: **PostgreSQL**. Arquitectura multi-tenant: cada query filtra por `restaurant_id` para garantizar aislamiento total entre restaurantes.

---

## Entidades

### `restaurants`
El restaurante es la entidad raíz del sistema. Todo lo demás le pertenece.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `name` | varchar(100) | |
| `email` | varchar(100) | Único, usado para login del admin |
| `password_hash` | varchar | Bcrypt |
| `openpay_merchant_id` | varchar | ID del comercio en OpenPay |
| `created_at` | timestamp | |

---

### `users`
Usuarios internos del sistema (admin y meseros). Un usuario siempre pertenece a un restaurante. En v1.0 hay un solo admin por restaurante.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `restaurant_id` | integer FK → restaurants | |
| `name` | varchar(100) | |
| `email` | varchar(100) | Único |
| `password_hash` | varchar | |
| `role` | enum | `admin` \| `waiter` |
| `created_at` | timestamp | |

---

### `categories`
Agrupan los platillos del menú (Entradas, Bebidas, Postres, etc.). Son planas — no hay subcategorías.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `restaurant_id` | integer FK → restaurants | |
| `name` | varchar(100) | |
| `sort_order` | integer | Controla el orden de aparición en el menú |

---

### `dishes`
Los platillos del menú. Pertenecen a una categoría. Pueden desactivarse sin eliminarse (temporadas, agotados).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `category_id` | integer FK → categories | |
| `name` | varchar(150) | |
| `description` | text | |
| `price` | decimal(10,2) | Precio fijo, sin variantes |
| `image_url` | varchar | URL en Cloudinary o S3 |
| `active` | boolean | `true` por defecto. `false` = invisible en la PWA |
| `created_at` | timestamp | |

---

### `tables`
Las mesas físicas del restaurante. Cada una tiene un token único que genera su URL de QR.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `restaurant_id` | integer FK → restaurants | |
| `number` | varchar(20) | Puede ser "1", "Terraza A", etc. |
| `qr_token` | uuid | Único. Genera la URL `/mesa/:qr_token` |

---

### `table_waiters`
**Tabla junction** que resuelve la relación N:M entre mesas y meseros. El admin asigna qué meseros atienden qué mesas desde el panel.

| Campo | Tipo | Notas |
|---|---|---|
| `table_id` | integer FK → tables | PK compuesto |
| `user_id` | integer FK → users | PK compuesto |

> Un mesero puede atender múltiples mesas. Una mesa puede tener múltiples meseros.

---

### `orders`
Una orden por dispositivo/comensal. Varias órdenes pueden estar activas en paralelo en la misma mesa (cada comensal paga individualmente).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `table_id` | integer FK → tables | |
| `status` | enum | Ver estados abajo |
| `total` | decimal(10,2) | Suma de subtotales de los ítems |
| `openpay_charge_id` | varchar | ID del cobro exitoso en OpenPay. Null hasta que se paga |
| `created_at` | timestamp | |

**Estados de `status`:**

```
pending_payment → paid → ready → delivered
```

- `pending_payment`: el comensal está armando el pedido o en proceso de pago
- `paid`: cobro exitoso. La orden aparece en el panel de cocina
- `ready`: el cocinero presionó "Listo". Se notifica al mesero asignado
- `delivered`: el mesero confirmó la entrega desde su vista `/mesero`

---

### `order_items`
Los ítems individuales de una orden. Un ítem = un platillo con su cantidad y nota opcional.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `order_id` | integer FK → orders | |
| `dish_id` | integer FK → dishes | |
| `quantity` | integer | |
| `note` | text | Personalización libre ("sin cebolla", etc.) |
| `subtotal` | decimal(10,2) | `price * quantity` al momento del pedido |

> `subtotal` se guarda denormalizado para que un cambio de precio en el platillo no altere órdenes históricas.

---

### `reservations`
Reservas de mesa registradas por el admin. El cliente no hace reservas directamente desde la PWA (no está registrado).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | serial PK | |
| `restaurant_id` | integer FK → restaurants | |
| `table_id` | integer FK → tables | **Nullable** — una reserva puede no tener mesa asignada aún |
| `customer_name` | varchar(100) | Texto libre |
| `phone` | varchar(20) | Texto libre |
| `party_size` | integer | Número de comensales |
| `datetime` | timestamp | Fecha y hora de la reserva |
| `status` | enum | `pending` \| `confirmed` \| `cancelled` |
| `created_at` | timestamp | |

---

## Relaciones

```
restaurants ──< users              (1:N) un restaurante tiene muchos usuarios
restaurants ──< categories         (1:N) un restaurante tiene muchas categorías
restaurants ──< tables             (1:N) un restaurante tiene muchas mesas
restaurants ──< reservations       (1:N) un restaurante tiene muchas reservas

categories  ──< dishes             (1:N) una categoría tiene muchos platillos

tables      ──< table_waiters      (1:N) ─┐
users       ──< table_waiters      (1:N) ─┘ N:M entre mesas y meseros

tables      ──< orders             (1:N) una mesa tiene muchas órdenes activas en paralelo
tables      ──o< reservations      (1:N, nullable) una mesa puede tener reservas

orders      ──< order_items        (1:N) una orden tiene uno o más ítems
dishes      ──< order_items        (1:N) un platillo aparece en muchos ítems de orden
```

---

## Notas de implementación

- **Multi-tenant**: todas las queries deben filtrar por `restaurant_id`. En el backend, este valor siempre viene del JWT decodificado (`req.user.restauranteId`) — nunca del body del request.
- **Datos de tarjeta**: nunca se persisten. Solo se guarda el `openpay_charge_id` del cobro exitoso.
- **IDs públicos**: en URLs del cliente solo se expone `qr_token` (UUID). Los IDs internos nunca van en rutas públicas.
- **Precios históricos**: `order_items.subtotal` se guarda al momento del pedido para preservar el precio aunque el platillo cambie después.
