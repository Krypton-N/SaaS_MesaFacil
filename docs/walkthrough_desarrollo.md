# 🍽️ MesaFácil v1 — Documentación del Desarrollo & Walkthrough Técnico

Este documento recopila de manera detallada todo el trabajo de desarrollo de infraestructura, base de datos e interfaces realizado hoy en el proyecto **MesaFácil v1**. Utiliza este archivo como contexto y guía de verificación para tus pruebas operativas y entregas académicas.

---

## 1. Arquitectura y Stack Tecnológico Implementado

Hemos estructurado el proyecto bajo una arquitectura de **Monorepo** moderna, modular y escalable, dividida de la siguiente manera:

*   **Backend (API REST + WebSockets)**:
    *   **Tecnología**: Node.js, Express, TypeScript, Socket.io y node-postgres.
    *   **Autenticación**: JWT propio firmado con algoritmos criptográficos (`bcryptjs` + `jsonwebtoken`).
    *   **Validación**: Validación de esquemas y payloads con `Zod` (en tiempo de compilación y ejecución).
*   **Frontend (Next.js PWA)**:
    *   **Tecnología**: Next.js 15 (App Router), TypeScript, y Tailwind CSS v4.
    *   **Diseño**: Fiel al sistema visual **Gourmet Flux** (naranjas enérgicos `#ff6b00`, tipografía Plus Jakarta Sans e Inter, radios de curvatura de 16px y animaciones fluidas).
    *   **Estrategia PWA**: Archivos de manifiesto configurados y logotipos móviles listos para emulación standalone.
*   **Persistencia y Nube (Supabase)**:
    *   **Base de datos**: PostgreSQL hospedado en la nube con soporte multi-tenant mediante claves foráneas por `restaurant_id`.
    *   **Almacenamiento (Storage)**: Bucket en Supabase Storage para carga de imágenes de platillos.

---

## 2. Paso a Paso del Desarrollo y Retos Superados

### Fase A: Infraestructura y Base de Datos (Supabase)
1.  **Migración del Esquema Inicial**:
    Diseñamos y ejecutamos en el editor de SQL de Supabase un esquema compuesto por **8 tablas relacionales** conectadas con cascada de eliminación, restricciones avanzadas de grupo (`CHECK quantity > 0`), e índices eficientes en campos multi-tenant (`restaurant_id`):
    *   `restaurants`, `users` (roles `admin` y `waiter`), `categories`, `dishes`, `tables`, `table_waiters` (relación N:M de asignación de meseros), `orders`, `order_items` y `reservations`.
2.  **Resolución de Conexión de Red (IPv4 Pooler)**:
    *   *Reto*: El servidor backend arrojó un error de DNS `ENOTFOUND` al intentar conectarse directamente a `db.fxsvuimvjnnctmtpqfsh.supabase.co`. Esto ocurre porque Supabase restringe las conexiones directas IPv4 y exige IPv6, el cual no está habilitado por defecto en la mayoría de ISPs y redes Windows locales.
    *   *Solución*: Reconfiguramos la variable `DATABASE_URL` en el `.env` para usar el **Connection Pooler de Supavisor** en la dirección IPv4 compatible a través de balanceo seguro en puerto `6543` (`aws-1-us-east-1.pooler.supabase.com`), resolviendo la conexión de red de inmediato.
3.  **Semilla de Datos (Seeding)**:
    *   Corregimos una ruta del paquete `dotenv` dentro del script de semilla (`backend/src/db/seed.ts`) que causaba errores de lectura de variables relativas a directorios externos.
    *   La carga semilla se ejecutó con **éxito total**, insertando el restaurante demo "La Terraza de MesaFácil", el usuario admin (`admin@mesafacil.com`), dos meseros de piso, categorías de menú, platillos con precios reales y **5 mesas operativas** con identificadores únicos UUID.

### Fase B: Backend Express & TypeScript (Type Safety)
Corregimos múltiples discrepancias en el tipado de TypeScript bajo Express 5:
*   **Parámetros de Ruta**: En Express 5, `req.params.id` se tipa como `string | string[]`. Aplicamos casting explícito (`as string`) en los enrutadores de órdenes y mesas antes de las funciones `parseInt` para cumplir con las exigencias del compilador.
*   **Manejo de Errores de Zod**: Corregimos el middleware de validación para usar la propiedad oficial `.issues` del error de Zod en lugar de la propiedad obsoleta `.errors`.
*   **JWT Options**: Castamos de forma segura a `any` el parámetro de expiración del token para acoplarlo a las firmas de la biblioteca `jsonwebtoken`.

### Fase C: Frontend Next.js & PWA
1.  **Design System "Gourmet Flux"**:
    Definimos todas las propiedades CSS personalizadas y clases de utilidad en `@theme` dentro de `src/app/globals.css`, estableciendo la escala tipográfica, sombras de elevación (`shadow-card`, `shadow-orange`), curvas e interfaces del tema de forma centralizada.
2.  **Componentes Atómicos Base**:
    Desarrollamos componentes reutilizables con soporte de carga e interacciones táctiles:
    *   `Button`: Variantes primaria, secundaria, ghost y danger con micro-animaciones.
    *   `Input`: Entrada responsiva off-white con soporte de iconos Material Design.
    *   `Card`: Contenedor "Appetite Card" con sombra ambiental.
    *   `Chip`: Píldoras coloridas para categorías de comida o estados de órdenes.
    *   `Badge`: Indicador de items en el carrito.
    *   `QuantitySelector`: Ajustador rápido de cantidades +/- con control de límites.
3.  **Páginas y Vistas Scaffolding**:
    El frontend ya tiene el código completo e interactivo para todas las interfaces de negocio:
    *   `page.tsx` (Root): Welcome launchpad del proyecto para saltar rápido entre vistas de prueba.
    *   `(admin)/login`: Entrada estilizada del administrador de restaurante.
    *   `(admin)/dashboard`: Panel en tiempo real con estadísticas y monitoreo de órdenes activas con mutación de estados.
    *   `(admin)/menu`: CRUD completo de platillos por categorías, con carga de imágenes (Supabase Storage) y simulador de escáner VLM de menús con Inteligencia Artificial.
    *   `(admin)/tables`: Generador y visor interactivo de códigos QR de mesas y asignador de meseros.
    *   `(admin)/reservations`: Control de reservas con asignador de mesas.
    *   `mesa/[qrToken]/page`: Menú interactivo PWA del cliente, filtrable por categorías en chips horizontales y carrito.
    *   `mesa/[qrToken]/cart`: Detalle de items de compra con soporte de instrucciones de platillos o notas personalizadas a cocina.
    *   `mesa/[qrToken]/checkout`: Simulador de pasarela de pago seguro (OpenPay mock) y recibo de compra final en diseño de ticket térmico.
    *   `kitchen/page`: Monitor de cocina horizontal optimizado para tablets, conectado en tiempo real con Socket.io.
    *   `waiter/page`: Monitor móvil de meseros que emite sonidos de campana cuando un platillo está listo para ser servido.

---

## 3. Códigos de Prueba Semilla Generados

Utiliza estos códigos y correos de prueba en tu simulador local para recrear flujos reales:

*   **Acceso Administrador**:
    *   **Email**: `admin@mesafacil.com`
    *   **Contraseña**: `password123`
*   **Acceso Meseros**:
    *   *Mesero 1*: `carlos@mesafacil.com` (Contraseña: `password123`)
    *   *Mesero 2*: `briseth@mesafacil.com` (Contraseña: `password123`)
*   **Tokens QR de Mesas (Simulador Comensal)**:
    *   **Mesa 1**: `bec42428-bb9a-44bc-a5ae-2756b4f915e6`
    *   **Mesa 2**: `d3602bed-2edb-4928-88e1-c07296b72b38`
    *   **Mesa 3**: `587faaf3-efef-4a21-9958-365f469769c0`
    *   **Terraza A**: `4997287c-7748-4965-a473-bff5a76e6ba3`
    *   **Terraza B**: `1830bee4-08cb-43fe-a957-bf681797bab3`

---

## 4. Guía Rápida para Levantar y Probar el Proyecto

### Paso 1: Levantar el Backend
Asegúrate de estar en la carpeta `backend` y ejecuta:
```bash
npm run dev
```
*(Mantén esta terminal abierta. Debería mostrar la consola de MesaFácil Backend en puerto 3001).*

### Paso 2: Levantar el Frontend (PWA)
En otra terminal diferente, navega a la carpeta `frontend` y ejecuta:
```bash
cd frontend
npm install
npm run dev
```

### Paso 3: Probar el flujo completo en tu Navegador
1.  Abre tu navegador en **[http://localhost:3000](http://localhost:3000)** (Launchpad).
2.  **Verificación del Comensal**:
    *   Copia el token de la **Mesa 1** (`bec42428-bb9a-44bc-a5ae-2756b4f915e6`).
    *   Pégalo en el recuadro "Simulador Comensal" y presiona "Simular Escaneo".
    *   Navega por las categorías, agrega tacos o guacamole, ponles notas (ej. "sin cebolla") y haz clic en "Proceder al Pago" desde tu Carrito.
    *   Rellena los datos de la tarjeta en el checkout seguro y presiona "Pagar Orden". Recibirás tu confirmación y ticket.
3.  **Verificación del Dashboard / Cocina / Mesero**:
    *   Abre [http://localhost:3000/kitchen](http://localhost:3000/kitchen) en otra pestaña. Verás llegar el pedido del comensal instantáneamente en tiempo real.
    *   Haz clic en "Marcar como Listo" en la cocina.
    *   Abre [http://localhost:3000/waiter](http://localhost:3000/waiter) en otra pestaña. ¡Escucharás una alerta de campana y verás el aviso parpadeante para servir a la Mesa 1!
    *   Abre [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (iniciando sesión como `admin@mesafacil.com`) para ver las analíticas de ventas sumadas del día, ocupación de mesas y ticket promedio actualizados.

---
*Documento elaborado exitosamente por el asistente de desarrollo Antigravity.*
