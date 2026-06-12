# 🍝 Pastas Orlando — ERP + Landing Page

![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?logo=prisma&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel&logoColor=white)

Sistema integral para **Pastas Orlando** — pastas artesanales en Posadas, Misiones, Argentina. Combina:

- 🏪 **Landing page** pública con catálogo de productos, opiniones, contacto por WhatsApp y formulario de consultas
- 🏭 **ERP completo** para gestión interna: producción, stock, compras, ventas, logística, notificaciones y auditoría
- 📊 **Dashboard administrativo** con roles, permisos, 2FA y reportes

---

## 🚀 Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Lenguaje** | TypeScript 5 |
| **Estilos** | Tailwind CSS 4 + shadcn/ui (New York) |
| **Base de datos** | Prisma ORM — SQLite (dev) / Turso libSQL (prod) |
| **Autenticación** | NextAuth.js v4 + 2FA (TOTP) |
| **Animaciones** | Framer Motion |
| **Mapas** | Leaflet + React-Leaflet |
| **Reportes** | @react-pdf/renderer, jsPDF, SheetJS (xlsx) |
| **Gráficos** | Recharts |
| **Imágenes** | Vercel Blob Storage + Sharp |
| **Email** | Nodemailer (SMTP) |
| **Estado** | Zustand + TanStack Query |
| **Formularios** | React Hook Form + Zod |
| **Deploy** | Vercel |

---

## 📂 Estructura del proyecto

```
pastas-orlando/
├── prisma/
│   ├── schema.prisma          # 63 modelos, 13 fases de desarrollo
│   ├── seed.ts                # Seeder principal
│   └── dev.db                 # SQLite local
├── public/
│   └── images/                # ~60 imágenes estáticas
│       ├── familias/          # Imágenes por categoría de producto
│       ├── nosotros/          # Sección "Nosotros"
│       └── pasos/             # Sección "Cómo pedir"
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page pública
│   │   ├── (auth)/            # Login, forgot/reset password
│   │   ├── (dashboard)/       # Panel admin completo
│   │   │   └── admin/         # 30+ páginas de gestión
│   │   └── api/               # 60+ endpoints REST
│   ├── components/
│   │   ├── sections/          # Secciones de la landing (Hero, Productos, etc.)
│   │   ├── products/          # ProductCard (flip card con modo cocción)
│   │   ├── admin/             # ~30 componentes de formulario y tablas
│   │   ├── logistica/         # Mapas Leaflet (entregas, proveedores)
│   │   ├── print/             # PDFs (etiquetas, órdenes, presupuestos)
│   │   └── ui/                # ~50 componentes shadcn/ui
│   ├── hooks/                 # use-mobile, use-toast
│   └── lib/
│       ├── db.ts              # Conexión DB (SQLite/Turso con auto-migrate)
│       ├── auth-helpers.ts    # Guards de autenticación
│       ├── email.ts           # Envío de emails
│       └── ...                # Auditoría, permisos, notificaciones, etc.
├── docs/
│   ├── MANUAL_USUARIO_PASTAS_ORLANDO.pdf
│   └── MANUAL_TECNICO_PASTAS_ORLANDO.pdf
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## ⚙️ Instalación local

### Requisitos

- **Node.js** 18+ o **Bun** 1.0+
- **Git**

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/orlandocandia/laspastasdeorlando.git
cd laspastasdeorlando

# 2. Instalar dependencias
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección "Variables de entorno")

# 4. Aplicar esquema a la base de datos local
bun run db:push

# 5. Poblar base de datos (seed)
bun run db:seed-notif

# 6. Iniciar servidor de desarrollo
bun run dev
```

La aplicación estará disponible en `http://localhost:3000`.

---

## 🔐 Variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# ── Base de datos ──
DATABASE_URL=file:./db/dev.db              # SQLite local
# DATABASE_URL=libsql://...turso.io        # Turso (producción)
DATABASE_AUTH_TOKEN=                       # Turso auth token (solo prod)

# ── Autenticación ──
NEXTAUTH_SECRET=tu-secret-aqui            # Generar con: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Para links de reset password

# ── Email (SMTP) ──
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password                 # App password de Google
SMTP_SECURE=false
SMTP_FROM="Pastas Orlando <tu-email@gmail.com>"

# ── Admin ──
ADMIN_EMAIL=tu-email@gmail.com
ADMIN_WHATSAPP=543754419324

# ── WhatsApp Bot (opcional) ──
TEXTMEBOT_APIKEY=
```

---

## 👤 Credenciales por defecto (desarrollo)

| Campo | Valor |
|-------|-------|
| **Email** | `admin@pastasorlando.com` |
| **Contraseña** | La generada en el seed (ver consola al correr `db:push`) |
| **URL** | `http://localhost:3000/admin/login` |

> ⚠️ Cambiar la contraseña en producción.

---

## 🛡️ Seguridad

| Característica | Detalle |
|---------------|---------|
| **Autenticación** | NextAuth.js con credentials provider |
| **2FA** | TOTP opcional (Google Authenticator compatible) |
| **Roles** | admin, produccion, ventas, lectura |
| **Permisos** | Granulares por módulo (formato `modulo.accion`) |
| **Auditoría** | Log de todas las acciones administrativas |
| **Sesiones** | Tracking de sesiones activas + logs de acceso |
| **CSRF** | Protección nativa de Next.js |
| **Rate limiting** | En endpoints sensibles |

---

## 📋 Módulos del ERP

### Stock y Producción
- 📦 **Materias primas** — CRUD con stock, precio y categoría
- 🧪 **Insumos** — CRUD con stock, tipo y marca
- 🍝 **Productos terminados** — CRUD con código de barras EAN-13, imágenes, modo de cocción/uso
- 📝 **Recetas** — Ingredientes + insumos por producto terminado
- 🏭 **Producción** — Órdenes con consumo automático de stock y generación de producto terminado
- 🏷️ **Etiquetas** — Generación e impresión de etiquetas con código de barras

### Compras y Ventas
- 🛒 **Compras** — Registro de compras a proveedores
- 📋 **Pedidos a proveedores** — Seguimiento de pedidos pendientes
- 🛍️ **Pedidos de clientes** — Gestión completa con estados
- 📊 **Presupuestos** — Presupuestos con conversión a pedido
- 💰 **Ventas** — Registro y seguimiento
- 📅 **Reservas** — Reservas de clientes

### Logística
- 🚚 **Entregas** — Gestión con estados (pendiente, en camino, entregada)
- 📍 **Puntos de encuentro** — Lugares de entrega configurables
- 🗺️ **Mapa de entregas** — Visualización en mapa Leaflet
- 🗺️ **Mapa de proveedores** — Ubicación de proveedores

### Notificaciones
- 📨 **Plantillas** — Templates con variables dinámicas
- 📢 **Envío manual** — WhatsApp y email
- ⚠️ **Alertas** — Configuración automática (stock bajo, pedidos pendientes)
- 📜 **Historial** — Registro de todas las notificaciones enviadas

### Reportes
- 📈 **Stock** — Inventario actual con filtros
- 🛍️ **Compras pendientes** — Reporte de pedidos a proveedores
- 📋 **Hoja de ruta** — Reporte para repartidores
- 📊 **Pedidos del día** — Resumen diario
- 💹 **Finanzas** — Reporte de ventas y compras
- 🏭 **Producción** — Reporte de producción

---

## 🌐 Landing Page

La página pública incluye:

| Sección | Descripción |
|---------|-------------|
| **Hero** | Carrusel con imágenes por tipo de harina (con gluten, integral, sin gluten) |
| **Nosotros** | Historia y valores de la empresa |
| **Productos** | Catálogo con flip cards (modo cocción/uso en el reverso) |
| **Cómo pedir** | Paso a paso con íconos |
| **Opiniones** | Carrusel de reseñas verificadas + formulario |
| **Contacto** | Formulario + WhatsApp + mapa |
| **FAQ** | Preguntas frecuentes en acordeón |

### Flip Card de productos
- **Frente**: imagen, nombre, precio, badges (peso, tipo de harina, destacado)
- **Reverso**: modo de cocción o uso y conservación (dinámico por categoría)
- **Mobile**: indicador 👆 "Tocá para ver modo de cocción"
- **Hover desktop**: overlay con texto de invitación

---

## 🌐 Despliegue en Vercel

1. **Conectar repositorio** a [Vercel](https://vercel.com)
2. **Configurar variables de entorno** en el panel de Vercel:
   - `DATABASE_URL` → URL de Turso (`libsql://...`)
   - `DATABASE_AUTH_TOKEN` → Token de Turso
   - `NEXTAUTH_SECRET` → Secret para producción
   - `NEXTAUTH_URL` → URL de producción
   - Variables de SMTP, etc.
3. **Deploy automático** en cada push a `main`

> 💡 La base de datos de producción usa **Turso** (libSQL). El esquema se auto-migra en cada cold start vía `autoMigrateTurso()` en `src/lib/db.ts`.

---

## 🗃️ Base de datos

63 modelos organizados en 13 fases de desarrollo:

| Fase | Módulo | Modelos clave |
|------|--------|---------------|
| 1 | Web público | Producto, Opinion, InteraccionWhatsApp |
| 2 | Personas y auth | Persona, Usuario, Rol, Permiso, Sesion |
| 3 | Stock | MateriaPrima, Insumo, ProductoTerminado, Receta |
| 4 | Compras | Compra, PedidoProveedor |
| 5 | Ventas | PedidoCliente, Venta, ReservaCliente |
| 6 | Producción | Produccion, DetalleReceta |
| 8 | Auditoría | Auditoria |
| 9 | Seguridad | Usuario2FA, LogAcceso, SesionActiva |
| 10 | Logística | Entrega, PuntoEncuentro |
| 11 | Notificaciones | PlantillaNotificacion, AlertaConfiguracion |
| 13 | Presupuestos | Presupuesto, DetallePresupuesto |

---

## 📄 Licencia

Proyecto privado — **laspastasdeorlando** © 2026. Todos los derechos reservados.
