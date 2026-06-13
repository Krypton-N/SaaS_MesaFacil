# Backlog MesaFácil — Jira

Proyecto: **Mesa-facil Project AyDS** (`orcusdev.atlassian.net`, clave `SCRUM`)

---

## Conceptos clave

**Épica** — agrupa historias de un mismo módulo o área. Funciona como contenedor temático que no tiene fecha propia.

**Historia (Story)** — unidad de trabajo concreta con valor entregable. Pertenece a una épica y se asigna a un sprint.

**Sprint** — bloque de tiempo fijo (~2 semanas) en el que el equipo se compromete a completar un conjunto de historias. Al terminar el sprint se tiene algo funcional y demostrable.

**Backlog** — la lista completa de historias del proyecto, ordenadas por prioridad. Lo que no entra en el sprint activo queda en el backlog esperando el siguiente.

---

## Épicas creadas

| Key | Épica | Sprints |
|---|---|---|
| SCRUM-6 | E1 – Documentación y Diseño | 1 |
| SCRUM-7 | E2 – Configuración del Entorno | 1 |
| SCRUM-8 | E3 – Módulo de Administración | 2 y 3 |
| SCRUM-9 | E4 – Módulo del Cliente (PWA) | 4 |
| SCRUM-10 | E5 – Módulo de Cocina y Mesero | 5 |
| SCRUM-11 | E6 – Pruebas y Calidad | 5 |

---

## Sprints y lo más relevante de cada uno

### Sprint 1 — Análisis, Diseño y Setup (Semanas 1–2)
Cubre E1 y E2. El objetivo es tener toda la documentación lista y el entorno funcionando antes de escribir código de negocio.

Lo más importante: el **diagrama E-R** y el **modelo de datos** ya están completados (SCRUM-12 y SCRUM-13, se pueden cerrar). Quedan pendientes el **documento de rutas API** (SCRUM-14) y los **wireframes** de las tres interfaces (SCRUM-15, SCRUM-16, SCRUM-17) — sin estos dos el frontend y el backend no pueden avanzar en paralelo. También entra el setup del repositorio, las migraciones de PostgreSQL y el backend base con Express.

### Sprint 2 — Módulo de Administración: Backend (Semanas 3–4)
Cubre E3 (primera mitad). Todo lo que el panel de admin necesita del servidor: autenticación JWT, CRUD de categorías, platillos, mesas y usuarios, generación de QR, asignación de meseros y la integración con el VLM local (LM Studio) para extraer menús desde fotos.

### Sprint 3 — Módulo de Administración: Frontend + Reservas (Semanas 5–6)
Cubre E3 (segunda mitad). Las vistas del panel admin que consumen los endpoints del sprint anterior: login, dashboard, gestión de menú con el formulario de IA, gestión de mesas con descarga de QR, y el módulo completo de reservas (backend + frontend).

### Sprint 4 — Módulo del Cliente PWA (Semanas 7–8)
Cubre E4. La cara pública del sistema: setup de la PWA, la vista de menú accesible por QR, el carrito individual por dispositivo, el checkout embebido con OpenPay.js (los datos de tarjeta nunca tocan el backend propio) y la publicación de la orden a cocina vía Socket.io al confirmar el pago.

### Sprint 5 — Cocina, Mesero y Pruebas (Semanas 9–10)
Cubre E5 y E6. Panel de cocina minimalista con botón único "Listo", vista del mesero con alerta sonora, y el ciclo completo de estados de la orden (`paid → ready → delivered`). Cierra con pruebas end-to-end, compatibilidad Safari iOS / Chrome Android, y verificación de los requisitos no funcionales clave (carga PWA < 3s, órdenes en cocina < 2s).

---

## Total de issues creados

- 6 épicas
- 44 historias
- 50 issues en total (SCRUM-6 a SCRUM-55)
