# 🍽️ MesaFácil v1

Sistema de pedidos inteligente para restaurantes — PWA + Panel de Administración.

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS |
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

### 1. Variables de entorno (.env)

El desarrollador principal te proporcionará el contenido del archivo `.env` de forma privada (ya que contiene las credenciales reales de Supabase). Debes crear y pegar este contenido en dos rutas del proyecto:

1. Crea un archivo `.env` en la **raíz** del proyecto (`MesaFacil_v1/.env`) y pega el contenido provisto.
2. Crea otro archivo `.env` en la carpeta **frontend** (`MesaFacil_v1/frontend/.env`) y pega el mismo contenido provisto.

*(Esto es fundamental ya que el backend lee las variables de la raíz y Next.js del directorio frontend).*

### 2. Backend

Como la base de datos en la nube (Supabase) **ya está creada, estructurada y poblada con datos de prueba**, **no necesitas ejecutar scripts SQL ni correr comandos de seed**. Solo debes instalar las dependencias y arrancar el servidor:

```bash
cd backend
npm install
npm run dev
```

El servidor de la API y WebSockets iniciará en `http://localhost:3001`

### 3. Frontend

En una **segunda terminal**, instalar dependencias e iniciar el servidor de desarrollo de Next.js:

```bash
cd frontend
npm install
npm run dev
```

La aplicación iniciará en `http://localhost:3000`

---

## 🚀 Cómo probar la Demo (Flujos y Credenciales)

Una vez que tengas ambos servidores corriendo, abre `http://localhost:3000` en tu navegador. Verás la **Consola de MesaFácil** para redirigirte a todos los roles de la app:

### 1. Panel de Administración (CRUDs & Gestión)
- **Ruta:** `http://localhost:3000/dashboard` (o clic en el botón de la página de inicio)
- **Credenciales Demo (ya registradas en la nube):**
  - **Email:** `admin@mesafacil.com`
  - **Contraseña:** `password123`
- *Qué probar:* Administra categorías, platillos, mesas y reservas.

### 2. Vista del Comensal (PWA Cliente)
- **Ruta:** `http://localhost:3000/` -> Sección "Simulador PWA"
- *Cómo entrar:* Copia uno de los siguientes tokens UUID de mesa que ya están guardados en la base de datos de Supabase y pégalo en el simulador:
  - **Mesa 1:** `bec42428-bb9a-44bc-a5ae-2756b4f915e6`
  - **Mesa 2:** `d3602bed-2edb-4928-88e1-c07296b72b38`
  - **Mesa 3:** `587faaf3-efef-4a21-9958-365f469769c0`
  - **Mesa Terraza A:** `4997287c-7748-4965-a473-bff5a76e6ba3`
  - **Mesa Terraza B:** `1830bee4-08cb-43fe-a957-bf681797bab3`
  *(Nota: Si dejas el campo vacío o usas un token inexistente, el sistema mostrará una pantalla de error de "QR Inválido").*
- *Qué probar:* Añade platillos al carrito, ve al checkout y simula un pago.

### 3. Monitor de Cocina
- **Ruta:** `http://localhost:3000/kitchen`
- *Qué probar:* Cuando pidas algo desde la PWA del cliente, verás llegar la orden aquí en tiempo real. Da clic en "Marcar Listo" para enviarlo al mesero.

### 4. Monitor de Meseros (Servicio)
- **Ruta:** `http://localhost:3000/waiter`
- **Credenciales Demo:**
  - **Email:** `carlos@mesafacil.com` (o `briseth@mesafacil.com`)
  - **Contraseña:** `password123`
- *Qué probar:* Recibe alertas sonoras y visuales cuando la cocina termine de preparar un platillo. Haz clic en "Entregado" para completar el flujo de servicio.

---

## Funcionalidades técnicas destacadas

- **Extracción de menú con IA (VLM):** En *Gestión del Menú → Escanear Menú con IA*, el admin sube
  la foto de una carta impresa y un modelo de visión servido localmente por **LM Studio** extrae los
  platillos (nombre, descripción, precio y categoría sugerida). Requiere LM Studio corriendo en
  `LM_STUDIO_URL` con un modelo de visión cargado; si no está disponible, la UI muestra un aviso claro.
- **Tiempo real (Socket.io):** Canales por restaurante (`restaurant:{id}`) para cocina y meseros.
- **Autenticación con refresh token:** Login y registro emiten un *access token* (corto) y un
  *refresh token* (largo). El cliente renueva la sesión automáticamente ante un 401 vía `POST /auth/refresh`.
- **Paginación opt-in:** Los listados `GET /orders`, `/dishes` y `/reservations` aceptan
  `?limit=&offset=` y devuelven `meta: { total, limit, offset }`.
- **PWA con soporte offline:** Service worker (`public/sw.js`) con caché del app shell y notificaciones
  push, registrado en producción.

> **Nota sobre el pago:** la pasarela es un *mock* (no se realizan cobros reales). El servicio de pago
> está aislado en `backend/src/services/payment.service.ts` y se puede sustituir por OpenPay sin tocar
> rutas ni controladores.

## Pruebas automatizadas

El backend incluye pruebas unitarias de la lógica de negocio crítica con **Vitest**:

```bash
cd backend
npm test
```

Cubren: el servicio de pago mock, el parseo de la respuesta del VLM, la máquina de transición de
estados de la orden y el helper de paginación.

## Design System

El proyecto usa el sistema de diseño **"Gourmet Flux"** con paleta de colores naranja vibrante + charcoal. Tipografía: Plus Jakarta Sans (headings) + Inter (body).

Referencia completa: `wireframe_ui_designer/gourmet_flux/DESIGN.md`

## Licencia

Proyecto académico — ESCOM IPN, Análisis y Diseño de Sistemas.


