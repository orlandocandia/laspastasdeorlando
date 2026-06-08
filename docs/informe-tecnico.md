# Informe Técnico — Sistema "Pastas Orlando"

> **Versión:** 1.0.0  
> **Fecha:** Marzo 2026  
> **Autor:** Equipo de Desarrollo  
> **URL Producción:** [https://laspastasdeorlando.vercel.app](https://laspastasdeorlando.vercel.app)  
> **Repositorio:** [https://github.com/orlandocandia/laspastasdeorlando](https://github.com/orlandocandia/laspastasdeorlando)

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulos y Funcionalidades](#3-módulos-y-funcionalidades)
4. [Estructura de la Base de Datos](#4-estructura-de-la-base-de-datos)
5. [Guía de Instalación y Configuración Local](#5-guía-de-instalación-y-configuración-local)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción General

**Pastas Orlando** es un sistema integral de gestión empresarial diseñado específicamente para un emprendimiento artesanal de pastas frescas ubicado en Argentina. La plataforma combina un sitio web público (landing page) orientado a la venta directa con un panel administrativo completo que cubre todo el ciclo operativo del negocio: desde la compra de materias primas e insumos, pasando por la producción basada en recetas, hasta la venta, logística de entregas y atención al cliente.

### 1.2 Problemática Resuelta

El sistema resuelve la necesidad de digitalizar y centralizar las operaciones de un emprendimiento de pastas artesanales que previamente se gestionaban de forma manual o con herramientas dispersas (hojas de cálculo, mensajería informal, etc.). Las principales problemáticas abordadas son:

- **Gestión de stock descoordinada**: Sin visibilidad sobre materias primas, insumos y productos terminados.
- **Producción sin trazabilidad**: Imposibilidad de conocer costos reales de producción ni rastrear consumos.
- **Proceso de ventas manual**: Pedidos tomados por WhatsApp sin registro formal ni seguimiento.
- **Logística informal**: Entregas coordinadas verbalmente sin control de rutas ni puntos de encuentro.
- **Falta de auditoría**: Sin registro de quién hizo qué y cuándo en el sistema.
- **Comunicación reactiva**: Sin sistema de notificaciones proactivas a clientes ni alertas internas.

### 1.3 Alcance del Sistema

El sistema comprende **13 módulos funcionales** que cubren:

| Área | Módulos |
|------|---------|
| Identidad y Acceso | Personas/Usuarios, Autenticación 2FA, Roles y Permisos |
| Catálogo Público | Productos (landing page), Opiniones |
| Producción | Productos de Producción (PT/MP/Insumos), Recetas, Producción |
| Comercial | Compras, Ventas, Presupuestos |
| Operaciones | Envíos/Logística, Notificaciones |
| Gobernanza | Auditoría, Reportes |

### 1.4 Cifras Clave del Sistema

| Métrica | Valor |
|---------|-------|
| Modelos Prisma (tablas BD) | 53 |
| Rutas API | 72 archivos |
| Páginas Admin | 41 páginas |
| Componentes UI (shadcn/ui) | 40+ |
| Librerías de producción | 60+ |
| Módulos funcionales | 13 |
| Fases de desarrollo | 13 |

### 1.5 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript | 5.x |
| Estilado | Tailwind CSS | 4.x |
| Componentes UI | shadcn/ui (New York) | — |
| Iconos | Lucide React | 0.525+ |
| ORM | Prisma | 6.x |
| BD Desarrollo | SQLite | — |
| BD Producción | Turso (libSQL) | — |
| Autenticación | NextAuth.js | 4.x |
| 2FA | speakeasy + qrcode | 2.0 / 1.5 |
| Estado cliente | Zustand | 5.x |
| Datos servidor | TanStack Query | 5.x |
| Formularios | React Hook Form + Zod | 7.x / 4.x |
| Animaciones | Framer Motion | 12.x |
| Carruseles | Embla Carousel | 8.x |
| Gráficos | Recharts | 2.x |
| Mapas | react-leaflet | 5.x |
| PDF | jsPDF / @react-pdf/renderer | 4.x |
| Excel | xlsx (SheetJS) | 0.18 |
| Email | nodemailer | 7.x |
| Tareas programadas | node-cron | 4.x |
| Deploy | Vercel + GitHub auto-deploy | — |

### 1.6 Paleta de Colores

| Nombre | Hex | Uso principal |
|--------|-----|---------------|
| Mostaza | `#E1AD01` | Color primario, CTAs, acentos |
| Crema | `#FFF8E7` | Fondo principal, secciones claras |
| Marrón | `#5C3A21` | Texto principal, encabezados |
| Rojo | `#C41E3A` | Alertas, errores, indicadores de urgencia |
| Oliva | `#6B7B3C` | Éxito, confirmaciones, elementos naturales |
| WhatsApp | `#25D366` | Botón WhatsApp, comunicación directa |

---

## 2. Arquitectura del Sistema

### 2.1 Visión General de la Arquitectura

El sistema sigue una arquitectura **monolítica modular** basada en Next.js App Router, donde el frontend y el backend coexisten en una misma aplicación. Las API Routes actúan como capa de servidor (BFF — Backend for Frontend), y Prisma ORM proporciona la abstracción de base de datos.

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Producción)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Next.js 16 App Router                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │  Landing     │  │  Admin Panel │  │  API Routes  │  │  │
│  │  │  (Público)   │  │  (Autenticado)│  │  (72 rutas)  │  │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │  │
│  │         │                 │                  │          │  │
│  │  ┌──────▼─────────────────▼──────────────────▼───────┐  │  │
│  │  │              Capa de Servicios (lib/)              │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │  │  │
│  │  │  │ Auditoría│ │ Permisos │ │ Notificaciones   │  │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────────────┘  │  │  │
│  │  └──────────────────────┬────────────────────────────┘  │  │
│  │                         │                               │  │
│  │  ┌──────────────────────▼────────────────────────────┐  │  │
│  │  │              Prisma ORM (Client)                  │  │  │
│  │  └──────────────────────┬────────────────────────────┘  │  │
│  └─────────────────────────┼───────────────────────────────┘  │
│                            │                                  │
│  ┌─────────────────────────▼───────────────────────────────┐  │
│  │           Turso (libSQL) — Base de Datos                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │           Servicios Externos                             │  │
│  │  ┌──────────┐  ┌───────────┐  ┌────────────────────┐   │  │
│  │  │ SMTP     │  │ CallMeBot │  │ Leaflet/OSM Maps   │   │  │
│  │  │ (Email)  │  │ (WhatsApp)│  │ (Mapas interactivos)│   │  │
│  │  └──────────┘  └───────────┘  └────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Patrón de Arquitectura: Server-First con ISR

El sistema utiliza el patrón **Server-First** propio de Next.js App Router:

- **Server Components** (por defecto): Renderizado en servidor, mínimo JavaScript enviado al cliente.
- **Client Components** (`"use client"`): Solo para interactividad (formularios, mapas, carruseles, gráficos).
- **API Routes** (`app/api/`): Endpoints REST que actúan como backend, con validación Zod y manejo de errores centralizado.
- **Server Actions**: Para mutaciones desde formularios del admin panel.

### 2.3 Estructura de Directorios

```
src/
├── app/
│   ├── page.tsx                    # Landing page pública
│   ├── layout.tsx                  # Layout raíz
│   ├── globals.css                 # Estilos globales + Tailwind
│   ├── (auth)/                     # Grupo de rutas: autenticación
│   │   ├── layout.tsx
│   │   └── admin/login/page.tsx
│   ├── (dashboard)/                # Grupo de rutas: panel admin
│   │   ├── layout.tsx
│   │   └── admin/                  # 41 páginas admin
│   │       ├── dashboard/
│   │       ├── materias-primas/
│   │       ├── insumos/
│   │       ├── productos-terminados/
│   │       ├── recetas/
│   │       ├── produccion/
│   │       ├── compras/
│   │       ├── pedidos-proveedores/
│   │       ├── pedidos-clientes/
│   │       ├── presupuestos/
│   │       ├── ventas/
│   │       ├── reservas-clientes/
│   │       ├── stock-movements/
│   │       ├── logistica/
│   │       ├── notificaciones/
│   │       ├── categorias/
│   │       ├── marcas/
│   │       ├── unidades-medida/
│   │       ├── configuracion/
│   │       ├── auditoria/
│   │       ├── reportes/
│   │       ├── seguridad/
│   │       ├── usuarios/
│   │       ├── perfil/2fa/
│   │       ├── personas/
│   │       ├── opiniones/
│   │       ├── consultas/
│   │       ├── estadisticas/
│   │       └── productos/
│   └── api/                        # 72 rutas API
│       ├── auth/[...nextauth]/
│       ├── 2fa/
│       ├── seguridad/
│       ├── usuarios/
│       ├── productos/
│       ├── productos-terminados/
│       ├── materias-primas/
│       ├── insumos/
│       ├── stock-movements/
│       ├── recetas/
│       ├── produccion/
│       ├── compras/
│       ├── ventas/
│       ├── pedidos-clientes/
│       ├── pedidos-proveedores/
│       ├── presupuestos/
│       ├── reservas-clientes/
│       ├── personas/
│       ├── geografia/
│       ├── categorias/
│       ├── marcas/
│       ├── unidades-medida/
│       ├── formas-pago/
│       ├── estados-generales/
│       ├── contacto/
│       ├── opiniones/
│       ├── consultas/
│       ├── reportes/
│       ├── notificaciones/
│       ├── logistica/
│       ├── auditoria/
│       ├── seed/
│       ├── seed-turso/
│       ├── db-push-turso/
│       └── route.ts (health check)
├── components/
│   ├── ui/                         # 40+ componentes shadcn/ui
│   ├── sections/                   # Secciones landing page
│   │   ├── Hero.tsx
│   │   ├── Productos.tsx
│   │   ├── ComoPedir.tsx
│   │   ├── Nosotros.tsx
│   │   ├── Opiniones.tsx
│   │   ├── FAQ.tsx
│   │   └── Contacto.tsx
│   ├── admin/                      # Componentes del panel admin
│   ├── logistica/                  # Componentes de mapas
│   ├── opiniones/                  # Componentes de reviews
│   ├── print/                      # Componentes de impresión PDF
│   ├── products/                   # Tarjetas de producto
│   ├── layout/                     # Navbar, Footer, ScrollToTop
│   └── skeletons/                  # Loading skeletons
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── db.ts                       # Prisma client singleton + Turso
│   ├── db-env.ts                   # Configuración de entorno BD
│   ├── providers.tsx               # SessionProvider + QueryClientProvider
│   ├── auditoria-service.ts        # Servicio de auditoría
│   ├── permisos-service.ts         # Servicio de permisos
│   ├── notificaciones-service.ts   # Servicio de notificaciones
│   ├── notifications.ts            # Nodemailer + CallMeBot
│   ├── plantillas.ts               # Motor de plantillas
│   └── utils.ts                    # Utilidades generales
└── instrumentation.ts              # Instrumentación Next.js
```

### 2.4 Flujo de Autenticación

```
┌──────────┐     POST /api/auth/[...nextauth]     ┌──────────────┐
│  Login    │ ──────────────────────────────────── │  NextAuth.js │
│  Page     │     (email + password)               │  v4          │
└──────────┘                                       └──────┬───────┘
                                                          │
                                                   ┌──────▼───────┐
                                                   │ ¿2FA activo? │
                                                   └──────┬───────┘
                                                    Sí    │    No
                                               ┌──────────┴──────────┐
                                               ▼                     ▼
                                    ┌──────────────────┐   ┌──────────────┐
                                    │ POST /api/2fa/   │   │ Sesión       │
                                    │ verify (TOTP)    │   │ creada       │
                                    └────────┬─────────┘   │ directamente │
                                             │              └──────┬───────┘
                                    ┌────────▼─────────┐          │
                                    │ Código válido?    │          │
                                    └──┬──────────┬─────┘          │
                                    Sí │          │ No              │
                                       ▼          ▼                │
                               ┌───────────┐  ┌──────────┐        │
                               │ Sesión    │  │ LogAcceso│        │
                               │ creada    │  │ FAIL     │        │
                               └─────┬─────┘  └──────────┘        │
                                     │                             │
                                     └──────────┬──────────────────┘
                                                ▼
                                    ┌───────────────────────┐
                                    │ SesionActiva creada   │
                                    │ LogAcceso OK          │
                                    │ Redirigir a Dashboard │
                                    └───────────────────────┘
```

### 2.5 Modelo de Permisos (RBAC)

El sistema implementa un modelo **RBAC** (Role-Based Access Control) con granularidad a nivel de módulo y acción:

- **Roles**: `admin`, `produccion`, `ventas`, `lectura` (extensibles)
- **Permisos**: Formato `modulo.accion` (ej: `productos.ver`, `compras.crear`, `usuarios.editar`)
- **Relaciones**: Muchos a muchos (Rol ↔ Permiso, Usuario ↔ Rol)
- **Verificación**: Middleware en API Routes + hook `usePermissions()` en frontend

### 2.6 Patrones de Diseño Utilizados

| Patrón | Implementación |
|--------|---------------|
| Singleton | `db.ts` — Prisma client único por proceso |
| Repository | API Routes abstraen acceso a datos vía Prisma |
| Service Layer | `auditoria-service.ts`, `permisos-service.ts`, `notificaciones-service.ts` |
| Observer | TanStack Query invalida caché automáticamente ante mutaciones |
| Provider | `providers.tsx` envuelve la app con Session + QueryClient |
| Strategy | Motor de plantillas `plantillas.ts` con reemplazo de variables `{{var}}` |
| Factory | Componentes admin reutilizables (Tables, Forms) con configuración |

### 2.7 Despliegue y CI/CD

```
┌─────────────┐    git push     ┌──────────────┐    auto-build    ┌─────────────┐
│  Desarrollador│ ────────────── │   GitHub      │ ─────────────── │   Vercel     │
│              │                 │   Repo        │                 │   Deploy     │
└─────────────┘                 └──────┬───────┘                 └──────┬──────┘
                                       │                                │
                                       │                                ▼
                                       │                       ┌───────────────┐
                                       │                       │ Build Next.js │
                                       │                       │ prisma generate│
                                       │                       │ DB Push Turso │
                                       │                       └───────┬───────┘
                                       │                               │
                                       ▼                               ▼
                                ┌──────────────┐              ┌───────────────┐
                                │ GitHub       │              │ App lista en  │
                                │ Actions (opc)│              │ laspastasde   │
                                └──────────────┘              │ orlando.vercel│
                                                              │ .app         │
                                                              └───────────────┘
```

**Pipeline de despliegue:**
1. `git push` a la rama `main` en GitHub
2. Vercel detecta el cambio y dispara el build
3. `postinstall` ejecuta `prisma generate`
4. Next.js compila la aplicación
5. Si hay migraciones pendientes, se ejecuta `/api/db-push-turso`
6. La aplicación queda disponible en la URL de producción

---

## 3. Módulos y Funcionalidades

### 3.1 Módulo: Personas/Usuarios (Autenticación + Gestión de Personas)

#### Propósito

Gestiona la identidad de todas las personas que interactúan con el sistema (proveedores, clientes, supervisores) y el acceso autenticado del panel administrativo. Integra autenticación con credenciales, soporte de 2FA TOTP, roles y permisos granulares, y auditoría de sesiones.

#### Funcionalidades Clave

- **Registro y edición de personas**: Alta de proveedores, clientes y otros tipos de persona con datos fiscales (CUIT, condición IVA, razón social) y de contacto múltiple.
- **Gestión de usuarios**: Vinculación de un usuario del sistema a una persona. Alta/baja/modificación de credenciales de acceso.
- **Autenticación con credenciales**: Login vía NextAuth.js con email y contraseña hasheada (bcryptjs).
- **Autenticación de dos factores (2FA)**: Activación, verificación y desactivación de TOTP mediante speakeasy + qrcode. Códigos de respaldo generados al activar.
- **Roles y permisos (RBAC)**: Asignación de roles a usuarios. Cada rol tiene permisos definidos por módulo y acción. Verificación en API routes y frontend.
- **Gestión de sesiones**: Visualización de sesiones activas, cierre remoto de sesiones, expiración automática.
- **Logs de acceso**: Registro de intentos de login (exitosos/fallidos), detección de navegador, SO, IP, geolocalización aproximada.
- **Ubicación en mapa**: Cada persona puede tener coordenadas (lat/lng) para visualización en mapas.
- **Múltiples contactos y direcciones**: Una persona puede tener varios teléfonos, emails, redes sociales y direcciones con tipificación.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `POST /api/auth/[...nextauth]` | Autenticación NextAuth |
| API | `POST /api/2fa/activate` | Activar 2FA |
| API | `POST /api/2fa/verify` | Verificar código TOTP |
| API | `POST /api/2fa/disable` | Desactivar 2FA |
| API | `GET /api/2fa/status` | Estado del 2FA del usuario |
| API | `GET/POST /api/usuarios` | Listar/crear usuarios |
| API | `GET/PUT/DELETE /api/usuarios/[id]` | CRUD usuario |
| API | `GET /api/usuarios/permisos` | Permisos del usuario actual |
| API | `PUT /api/usuarios/[id]/roles` | Asignar roles a usuario |
| API | `GET/POST /api/personas` | Listar/crear personas |
| API | `GET/PUT/DELETE /api/personas/[id]` | CRUD persona |
| API | `PUT /api/personas/[id]/ubicacion` | Actualizar ubicación en mapa |
| API | `GET /api/geografia` | Datos geográficos (país/prov/depto/muni) |
| API | `GET/DELETE /api/seguridad/sesiones` | Listar/cerrar sesiones |
| API | `GET /api/seguridad/sesiones/[id]` | Detalle de sesión |
| API | `GET/POST /api/seguridad/roles` | Listar/crear roles |
| API | `GET /api/seguridad/logs-acceso` | Logs de acceso |
| API | `GET /api/debug-auth` | Debug de autenticación |
| Página | `/admin/login` | Login |
| Página | `/admin/usuarios` | Lista de usuarios |
| Página | `/admin/usuarios/permisos` | Gestión de permisos |
| Página | `/admin/personas` | Lista de personas |
| Página | `/admin/personas/[id]` | Detalle/editar persona |
| Página | `/admin/perfil/2fa` | Configuración 2FA |
| Página | `/admin/seguridad/sesiones` | Sesiones activas |
| Página | `/admin/seguridad/logs-acceso` | Logs de acceso |

#### Tablas de BD Relacionadas

`TipoPersona`, `Persona`, `TipoContacto`, `Contacto`, `TipoDireccion`, `Direccion`, `Usuario`, `Rol`, `UsuarioRol`, `Permiso`, `RolPermiso`, `Sesion`, `SesionActiva`, `LogAcceso`, `Usuario2FA`, `Pais`, `Provincia`, `Departamento`, `Municipio`

---

### 3.2 Módulo: Productos (Catálogo Landing Page)

#### Propósito

Muestra el catálogo de productos al público general a través de la landing page. Permite visualizar productos destacados, navegar por categorías, e iniciar contacto vía WhatsApp para realizar pedidos.

#### Funcionalidades Clave

- **Catálogo público**: Grilla de productos con imagen, nombre, categoría, precio y peso. Visible en la sección "Productos" de la landing.
- **Carrusel de productos**: Componente Embla Carousel que muestra productos destacados con animaciones.
- **Filtrado por categoría**: Navegación por pestañas de categorías (frescos, rellenos, salsas, etc.).
- **Integración WhatsApp**: Botón flotante y enlaces directos que abren conversación de WhatsApp con mensaje preconfigurado.
- **SEO optimizado**: Metadatos dinámicos, imágenes con alt text, datos estructurados.
- **Producto model original**: Tabla `Producto` de la Fase 1, con campos simplificados para la landing.
- **Interacción WhatsApp registrada**: Cada click en WhatsApp se registra con IP y fecha para estadísticas.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET /api/productos` | Listar productos landing |
| API | `GET /api/productos-terminados/public` | Productos terminados visibles en landing |
| API | `POST /api/contacto` | Formulario de contacto público |
| Página | `/` (sección Productos) | Catálogo en landing page |

#### Tablas de BD Relacionadas

`Producto`, `InteraccionWhatsApp`, `ProductoTerminado` (lectura para landing)

---

### 3.3 Módulo: Productos de Producción (PT, MP, Insumos)

#### Propósito

Gestiona el inventario completo de materias primas, insumos y productos terminados utilizados en el proceso productivo. Cada ítem tiene código, categoría, unidad de medida, stock actual/mínimo y precio de referencia.

#### Funcionalidades Clave

- **Materias primas (MP)**: CRUD completo con código, nombre, categoría, unidad base, stock actual y mínimo, precio de compra referencia, imagen.
- **Insumos**: Similar a MP pero con tipo de insumo (envases, bolsas, etiquetas, etc.). Código, stock, precio referencia.
- **Productos terminados (PT)**: CRUD con código, categoría, peso aproximado, precio de venta, stock actual/mínimo, destacado, visible en landing, imagen.
- **Categorías**: Gestión de categorías para MP (harinas, huevos, quesos), insumos (envases) y PT (frescos, rellenos, salsas).
- **Unidades de medida**: Configuración de unidades con conversión a base (kg, g, l, ml, unidad, docena).
- **Marcas**: Registro de marcas de productos comprados.
- **Alertas de stock bajo**: Comparación automática stock actual vs stock mínimo.
- **Movimientos de stock**: Trazabilidad completa de entradas y salidas de inventario.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/productos-terminados` | Listar/crear PT |
| API | `GET/PUT/DELETE /api/productos-terminados/[id]` | CRUD PT |
| API | `GET /api/productos-terminados/public` | PT visibles en landing |
| API | `GET/POST /api/materias-primas` | Listar/crear MP |
| API | `GET/PUT/DELETE /api/materias-primas/[id]` | CRUD MP |
| API | `GET/POST /api/insumos` | Listar/crear insumos |
| API | `GET/PUT/DELETE /api/insumos/[id]` | CRUD insumo |
| API | `GET/POST /api/stock-movements` | Movimientos de stock |
| API | `GET/POST /api/categorias` | Categorías |
| API | `GET/POST /api/marcas` | Marcas |
| API | `GET/POST /api/unidades-medida` | Unidades de medida |
| Página | `/admin/materias-primas` | Lista MP |
| Página | `/admin/materias-primas/[id]` | Detalle/editar MP |
| Página | `/admin/insumos` | Lista insumos |
| Página | `/admin/insumos/[id]` | Detalle/editar insumo |
| Página | `/admin/productos-terminados` | Lista PT |
| Página | `/admin/productos-terminados/[id]` | Detalle/editar PT |
| Página | `/admin/stock-movements` | Movimientos de stock |
| Página | `/admin/categorias` | Gestión de categorías |
| Página | `/admin/marcas` | Gestión de marcas |
| Página | `/admin/unidades-medida` | Gestión de unidades |

#### Tablas de BD Relacionadas

`UnidadMedida`, `CategoriaMateriaPrima`, `MateriaPrima`, `TipoInsumo`, `Insumo`, `Marca`, `CategoriaProductoTerminado`, `ProductoTerminado`, `StockMovement`

---

### 3.4 Módulo: Recetas

#### Propósito

Permite definir las recetas de producción de cada producto terminado, indicando qué materias primas e insumos se consumen, en qué cantidades y con qué costo estimado. Una receta es la base para cada orden de producción.

#### Funcionalidades Clave

- **CRUD de recetas**: Crear recetas vinculadas a un producto terminado, con nombre y rendimiento (unidades producidas por tanda).
- **Detalle de ingredientes**: Cada receta tiene múltiples líneas de detalle que referencian materias primas o insumos, con cantidad necesaria, unidad y costo estimado.
- **Cálculo de costo automático**: El costo estimado de cada ingrediente se calcula según el precio de compra referencia y la cantidad.
- **Activación/desactivación**: Una receta puede marcarse como inactiva sin eliminarse (para versiones anteriores).
- **Impresión de órdenes**: Componente `OrdenProduccionPrint` para imprimir la receta como orden de producción.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/recetas` | Listar/crear recetas |
| API | `GET/PUT/DELETE /api/recetas/[id]` | CRUD receta |
| Página | `/admin/recetas` | Gestión de recetas |

#### Tablas de BD Relacionadas

`Receta`, `DetalleReceta`, `ProductoTerminado`, `MateriaPrima`, `Insumo`, `UnidadMedida`

---

### 3.5 Módulo: Compras

#### Propósito

Registra las compras de materias primas e insumos a proveedores, incluyendo facturación, detalle de ítems, marcas, lotes y fechas de vencimiento. También gestiona los pedidos a proveedores como paso previo a la compra.

#### Funcionalidades Clave

- **Pedidos a proveedores**: Crear pedidos con fecha estimada de entrega, detalle de ítems solicitados (MP o insumos), precios estimados y seguimiento de estado.
- **Registro de compras**: Una vez recibido el pedido, se registra la compra con número de factura, forma de pago, detalle exacto (cantidades, precios unitarios, marca, lote, vencimiento).
- **Conversión automática de unidades**: Al registrar una compra, se convierte la cantidad a la unidad base para actualizar stock correctamente.
- **Actualización de stock**: Cada compra actualiza automáticamente el `stock_actual` de las materias primas e insumos involucrados.
- **Estados de pedido**: Pendiente → Enviado → Recibido → Cancelado (configurables vía `EstadoGeneral`).
- **Relación proveedor**: Cada compra/pedido se vincula a una persona con tipo "proveedor".

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/compras` | Listar/crear compras |
| API | `GET/PUT/DELETE /api/compras/[id]` | CRUD compra |
| API | `GET/POST /api/pedidos-proveedores` | Listar/crear pedidos proveedor |
| API | `GET/PUT/DELETE /api/pedidos-proveedores/[id]` | CRUD pedido proveedor |
| API | `GET/POST /api/formas-pago` | Formas de pago |
| API | `PUT/DELETE /api/formas-pago/[id]` | CRUD forma de pago |
| API | `GET/POST /api/estados-generales` | Estados generales |
| API | `PUT/DELETE /api/estados-generales/[id]` | CRUD estado |
| Página | `/admin/compras` | Lista de compras |
| Página | `/admin/compras/[id]` | Detalle/editar compra |
| Página | `/admin/pedidos-proveedores` | Lista pedidos proveedor |
| Página | `/admin/pedidos-proveedores/[id]` | Detalle/editar pedido |

#### Tablas de BD Relacionadas

`FormaPago`, `EstadoGeneral`, `Compra`, `DetalleCompra`, `PedidoProveedor`, `DetallePedidoProveedor`, `Persona` (proveedor), `MateriaPrima`, `Insumo`, `Marca`, `UnidadMedida`

---

### 3.6 Módulo: Ventas (Pedidos + Ventas + Reservas)

#### Propósito

Gestiona todo el ciclo comercial de venta: desde el pedido del cliente, pasando por las reservas de productos, hasta la venta formal con comprobante. Incluye manejo de señas (señas) y vinculación con entregas logísticas.

#### Funcionalidades Clave

- **Pedidos de clientes**: Registro de pedidos con fecha de entrega solicitada, detalle de productos terminados, cantidades, precios, subtotal y seña. Seguimiento de estados.
- **Reservas de clientes**: Reserva de productos terminados con cantidad, seña y fecha de validez. Se puede vincular a un pedido existente. Confirmación parcial posible.
- **Ventas formales**: Registro de la venta con cliente, vendedor, forma de pago, comprobante, IVA. Se puede vincular a un pedido previo.
- **Cambio de estado de pedidos**: Transiciones de estado controladas (Pendiente → Confirmado → En producción → Listo → Entregado → Cancelado).
- **Actualización de stock**: Cada venta decrementa el stock de productos terminados.
- **Señas (anticipos)**: Registro de montos de seña tanto en pedidos como en reservas.
- **Vinculación venta-pedido**: Una venta puede estar asociada a un pedido de cliente (relación 1:1).
- **Relación con entregas**: Un pedido puede tener una o más entregas programadas (módulo Logística).

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/pedidos-clientes` | Listar/crear pedidos cliente |
| API | `GET/PUT/DELETE /api/pedidos-clientes/[id]` | CRUD pedido |
| API | `PUT /api/pedidos-clientes/[id]/estado` | Cambiar estado de pedido |
| API | `GET/POST /api/ventas` | Listar/crear ventas |
| API | `GET/PUT/DELETE /api/ventas/[id]` | CRUD venta |
| API | `GET/POST /api/reservas-clientes` | Listar/crear reservas |
| API | `GET/PUT/DELETE /api/reservas-clientes/[id]` | CRUD reserva |
| Página | `/admin/pedidos-clientes` | Lista pedidos |
| Página | `/admin/ventas` | Lista ventas |
| Página | `/admin/reservas-clientes` | Lista reservas |

#### Tablas de BD Relacionadas

`PedidoCliente`, `DetallePedidoCliente`, `ReservaCliente`, `Venta`, `DetalleVenta`, `EstadoGeneral`, `FormaPago`, `Persona` (cliente), `Usuario` (vendedor), `ProductoTerminado`

---

### 3.7 Módulo: Producción

#### Propósito

Registra las órdenes de producción ejecutadas, consumiendo materias primas e insumos según las recetas y generando productos terminados. Calcula costos reales de producción y actualiza el inventario automáticamente.

#### Funcionalidades Clave

- **Registro de producción**: Crear una orden de producción asociada a una receta, indicando cantidad producida y fecha.
- **Validación de stock previo**: Antes de producir, verificar que hay suficiente stock de MP e insumos (endpoint `/api/produccion/validar-stock`).
- **Consumo automático**: Al registrar producción, se descuenta del stock las materias primas e insumos consumidos (DetalleProduccionConsumo).
- **Generación de PT**: Se incrementa el stock de productos terminados generados (DetalleProduccionGenerado).
- **Cálculo de costos**: Costo total de MP, costo total de insumos y costo total de la producción, basado en precios de compra referencia.
- **Supervisor**: Cada producción puede tener un supervisor asignado (persona).
- **Completar producción**: Endpoint dedicado para marcar una producción como completada.
- **Estados**: Planificada → En proceso → Completada → Cancelada.
- **Impresión**: Componente `OrdenProduccionPrint` para imprimir la orden.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/produccion` | Listar/crear producciones |
| API | `PUT /api/produccion/[id]/completar` | Completar producción |
| API | `POST /api/produccion/validar-stock` | Validar stock disponible |
| Página | `/admin/produccion` | Gestión de producción |

#### Tablas de BD Relacionadas

`Produccion`, `DetalleProduccionConsumo`, `DetalleProduccionGenerado`, `Receta`, `EstadoGeneral`, `Persona` (supervisor), `MateriaPrima`, `Insumo`, `ProductoTerminado`, `UnidadMedida`, `StockMovement`

---

### 3.8 Módulo: Envíos/Logística

#### Propósito

Gestiona la logística de entregas de pedidos a clientes, incluyendo puntos de encuentro, programación de entregas, seguimiento de estado y notificaciones al cliente. Integra mapas interactivos para visualización geográfica.

#### Funcionalidades Clave

- **Puntos de encuentro**: Lugares predefinidos donde se realizan entregas (ferias, puntos de venta, etc.) con dirección, coordenadas y horarios (JSON).
- **Programación de entregas**: Asignar entregas a pedidos con fecha programada, rango horario, punto de encuentro o dirección alternativa.
- **Mapa interactivo de entregas**: Visualización en mapa Leaflet de entregas programadas/realizadas con estados por color.
- **Mapa interactivo de proveedores**: Visualización geográfica de proveedores con coordenadas.
- **Seguimiento de estado**: programado → en_camino → entregado → cancelado → reagendado.
- **Datos de quien recibe**: Nombre y teléfono de la persona que recibe la entrega.
- **Notificaciones de entrega**: Envío automático de recordatorios y confirmaciones vía WhatsApp/email.
- **Coordenadas de entrega**: Cada entrega puede tener coordenadas GPS propias (diferentes del punto de encuentro).
- **Hoja de ruta**: Reporte imprimible de entregas del día con orden optimizado.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/logistica/entregas` | Listar/crear entregas |
| API | `GET/PUT/DELETE /api/logistica/entregas/[id]` | CRUD entrega |
| API | `PUT /api/logistica/entregas/[id]/estado` | Cambiar estado entrega |
| API | `GET/POST /api/logistica/puntos-encuentro` | Listar/crear puntos |
| API | `GET/PUT/DELETE /api/logistica/puntos-encuentro/[id]` | CRUD punto |
| API | `GET /api/logistica/mapa/entregas` | Datos mapa entregas |
| API | `GET /api/logistica/mapa/proveedores` | Datos mapa proveedores |
| Página | `/admin/logistica/entregas` | Gestión de entregas |
| Página | `/admin/logistica/puntos-encuentro` | Puntos de encuentro |
| Página | `/admin/logistica/mapa-entregas` | Mapa entregas |
| Página | `/admin/logistica/mapa-proveedores` | Mapa proveedores |

#### Tablas de BD Relacionadas

`PuntoEncuentro`, `Entrega`, `NotificacionEntrega`, `PedidoCliente`

---

### 3.9 Módulo: Notificaciones

#### Propósito

Sistema de notificaciones multicanal (email + WhatsApp) que permite enviar comunicaciones a clientes y proveedores, tanto manuales como automáticas basadas en alertas configurables. Incluye un motor de plantillas con variables dinámicas.

#### Funcionalidades Clave

- **Plantillas de notificación**: CRUD de plantillas con variables `{{nombre}}`, `{{pedido}}`, etc. Soporte para email, WhatsApp o ambos canales.
- **Motor de plantillas**: Servicio `plantillas.ts` que reemplaza variables dinámicamente en el contenido.
- **Envío manual**: Envío de notificaciones ad-hoc desde el panel admin.
- **Envío programado**: Notificaciones con fecha programada de envío.
- **Alertas configurables**: Configuración de alertas automáticas por: stock bajo, pedido pendiente, producción atrasada, entrega próxima. Con umbral, destinatarios y frecuencia.
- **Ejecución de alertas**: Endpoint que ejecuta las alertas activas y envía notificaciones según configuración (invocable por cron).
- **Historial**: Registro completo de notificaciones enviadas con estado (pendiente, enviado, error, cancelado).
- **Canal email**: Envío vía SMTP (nodemailer) con soporte HTML.
- **Canal WhatsApp**: Envío vía CallMeBot API.
- **Notificaciones de entrega**: Subsistema específico para recordatorios y confirmaciones de entregas.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/notificaciones/plantillas` | CRUD plantillas |
| API | `GET/PUT/DELETE /api/notificaciones/plantillas/[id]` | CRUD plantilla |
| API | `POST /api/notificaciones/enviar` | Enviar notificación |
| API | `GET /api/notificaciones/historial` | Historial de envíos |
| API | `GET/PUT /api/notificaciones/historial/[id]` | Detalle/envío |
| API | `GET/POST /api/notificaciones/alertas/config` | Configurar alertas |
| API | `POST /api/notificaciones/alertas/ejecutar` | Ejecutar alertas |
| Página | `/admin/notificaciones/plantillas` | Gestión plantillas |
| Página | `/admin/notificaciones/historial` | Historial |
| Página | `/admin/notificaciones/alertas` | Configuración alertas |
| Página | `/admin/notificaciones/enviar` | Envío manual |

#### Tablas de BD Relacionadas

`PlantillaNotificacion`, `Notificacion`, `AlertaConfiguracion`, `NotificacionEntrega`

---

### 3.10 Módulo: Auditoría

#### Propósito

Registra de forma inmutable todas las acciones significativas realizadas en el sistema, proporcionando trazabilidad completa de quién hizo qué, cuándo y desde dónde. Esencial para control interno y resolución de conflictos.

#### Funcionalidades Clave

- **Registro automático**: Toda creación, modificación, eliminación, login, logout y exportación se registra automáticamente.
- **Detalle de cambios**: Campo JSON `detalles` almacena el estado anterior y posterior de las entidades modificadas.
- **Filtrado por módulo y acción**: Búsqueda de auditorías por módulo (productos, ventas, etc.) y tipo de acción.
- **Filtrado por usuario**: Ver todas las acciones de un usuario específico.
- **Filtrado por fecha**: Rango de fechas para consultas.
- **Información de contexto**: IP, user agent, fecha/hora exacta.
- **Servicio centralizado**: `auditoria-service.ts` utilizado por todas las API routes para registrar eventos.
- **Visualización admin**: Panel con tabla paginada y filtros avanzados.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET /api/auditoria` | Listar registros de auditoría |
| API | `GET /api/auditoria/[id]` | Detalle de registro |
| Página | `/admin/auditoria` | Panel de auditoría |

#### Tablas de BD Relacionadas

`Auditoria`, `Usuario`

---

### 3.11 Módulo: Reportes

#### Propósito

Genera reportes operativos y financieros del negocio en múltiples formatos de exportación (PDF, Excel, CSV). Incluye reportes de producción, ventas, compras, stock, hoja de ruta y pedidos del día.

#### Funcionalidades Clave

- **Reporte de producción**: Resumen de producciones por período, costos, rendimientos.
- **Reporte de finanzas**: Ingresos vs egresos, márgenes, evolución temporal.
- **Reporte de compras**: Compras realizadas por proveedor, por período, pendientes de entrega.
- **Compras pendientes**: Listado específico de pedidos a proveedores pendientes con días de demora.
- **Reporte de ventas**: Ventas por cliente, por período, por forma de pago.
- **Pedidos del día**: Listado de pedidos con entrega programada para el día actual.
- **Hoja de ruta**: Entregas programadas con punto de encuentro, horario, datos del cliente. Imprimible.
- **Reporte de stock**: Inventario actual con alertas de stock bajo.
- **Exportación PDF**: Componente `ExportadorPDF` usando jsPDF / @react-pdf/renderer.
- **Exportación Excel**: Componente `ExportadorExcel` usando SheetJS (xlsx).
- **Exportación CSV**: Componente `ExportadorCSV` para datos tabulares simples.
- **Gráficos**: Visualizaciones con Recharts (barras, líneas, tortas).

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET /api/reportes/produccion` | Reporte producción |
| API | `GET /api/reportes/finanzas` | Reporte finanzas |
| API | `GET /api/reportes/compras` | Reporte compras |
| API | `GET /api/reportes/compras-pendientes` | Compras pendientes |
| API | `GET /api/reportes/ventas` | Reporte ventas |
| API | `GET /api/reportes/pedidos-dia` | Pedidos del día |
| API | `GET /api/reportes/hoja-ruta` | Hoja de ruta |
| API | `GET /api/reportes/stock` | Reporte stock |
| Página | `/admin/reportes` | Panel de reportes |
| Página | `/admin/reportes/compras-pendientes` | Compras pendientes |
| Página | `/admin/reportes/hoja-ruta` | Hoja de ruta |
| Página | `/admin/reportes/pedidos-dia` | Pedidos del día |

#### Tablas de BD Relacionadas

`Produccion`, `Venta`, `Compra`, `PedidoProveedor`, `PedidoCliente`, `Entrega`, `MateriaPrima`, `Insumo`, `ProductoTerminado`, `StockMovement`

---

### 3.12 Módulo: Presupuestos

#### Propósito

Permite generar cotizaciones/presupuestos para clientes potenciales antes de confirmar un pedido. Los presupuestos tienen validez temporal y pueden convertirse en pedidos de cliente con un solo click.

#### Funcionalidades Clave

- **Creación de presupuestos**: Selección de cliente, productos terminados con cantidades y precios, observaciones.
- **Numeración automática**: Cada presupuesto recibe un número único secuencial.
- **Vigencia temporal**: Fecha de validez configurable. Presupuestos expirados se marcan automáticamente.
- **Estados**: pendiente → aprobado → rechazado → expirado → convertido.
- **Conversión a pedido**: Endpoint dedicado que convierte un presupuesto aprobado en un pedido de cliente, copiando todos los detalles.
- **Cálculo automático**: Subtotal, IVA y total calculados automáticamente.
- **Impresión PDF**: Componente `PresupuestoPDF` para generar documento profesional.
- **Vinculación pedido**: Una vez convertido, el presupuesto queda vinculado al pedido generado (relación 1:1).
- **Formulario dedicado**: Página `/admin/presupuestos/nuevo` con selección de cliente y productos.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/presupuestos` | Listar/crear presupuestos |
| API | `GET/PUT/DELETE /api/presupuestos/[id]` | CRUD presupuesto |
| API | `PUT /api/presupuestos/[id]/estado` | Cambiar estado |
| API | `POST /api/presupuestos/[id]/convertir-pedido` | Convertir a pedido |
| Página | `/admin/presupuestos` | Lista de presupuestos |
| Página | `/admin/presupuestos/nuevo` | Nuevo presupuesto |
| Página | `/admin/presupuestos/[id]` | Detalle/editar presupuesto |

#### Tablas de BD Relacionadas

`Presupuesto`, `DetallePresupuesto`, `Persona` (cliente), `ProductoTerminado`, `PedidoCliente`

---

### 3.13 Módulo: Opiniones

#### Propósito

Gestiona las opiniones y calificaciones de clientes que se muestran en la landing page. Incluye moderación (aprobación/rechazo), respuestas del negocio y destaque de opiniones positivas.

#### Funcionalidades Clave

- **Envío público**: Formulario en la landing page (sección Opiniones) donde cualquier visitante puede dejar su calificación (1-5 estrellas) y comentario.
- **Moderación**: Las opiniones llegan con estado "pending" y deben ser aprobadas por un administrador antes de mostrarse públicamente.
- **Carrusel de opiniones**: Componente Embla Carousel en la landing que muestra opiniones aprobadas y destacadas.
- **Respuesta del negocio**: El admin puede responder a cada opinión, mostrando la respuesta públicamente.
- **Destaque**: Las opiniones especialmente positivas pueden marcarse como "destacadas" para aparecer primero.
- **Ordenamiento**: Control del orden de visualización.
- **Registro de IP**: Se almacena la IP del autor para prevención de spam.
- **Aprobación con auditoría**: Se registra quién aprobó cada opinión y cuándo.
- **Grilla de estrellas**: Componente `StarRating` para calificación visual.

#### Rutas Principales

| Tipo | Ruta | Descripción |
|------|------|-------------|
| API | `GET/POST /api/opiniones` | Listar (admin) / crear (público) opiniones |
| Página | `/admin/opiniones` | Panel de moderación |
| Página | `/` (sección Opiniones) | Carrusel + formulario público |

#### Tablas de BD Relacionadas

`Opinion`

---

## 4. Estructura de la Base de Datos

### 4.1 Descripción General

La base de datos del sistema contiene **53 tablas** organizadas en los siguientes grupos funcionales:

| Grupo | Tablas | Cantidad |
|-------|--------|----------|
| Originales (Fase 1) | Producto, Opinion, InteraccionWhatsApp | 3 |
| Geografía | Pais, Provincia, Departamento, Municipio | 4 |
| Personas y Contactos | TipoPersona, Persona, TipoContacto, Contacto, TipoDireccion, Direccion | 6 |
| Usuarios y Seguridad | Usuario, Rol, UsuarioRol, Permiso, RolPermiso, Sesion, SesionActiva, LogAcceso, Usuario2FA | 9 |
| Producción (Inventario) | UnidadMedida, CategoriaMateriaPrima, MateriaPrima, TipoInsumo, Insumo, Marca, CategoriaProductoTerminado, ProductoTerminado | 8 |
| Recetas | Receta, DetalleReceta | 2 |
| Compras | FormaPago, EstadoGeneral, Compra, DetalleCompra, PedidoProveedor, DetallePedidoProveedor | 6 |
| Ventas | PedidoCliente, DetallePedidoCliente, ReservaCliente, Venta, DetalleVenta | 5 |
| Producción (Órdenes) | Produccion, DetalleProduccionConsumo, DetalleProduccionGenerado | 3 |
| Stock | StockMovement | 1 |
| Logística | PuntoEncuentro, Entrega, NotificacionEntrega | 3 |
| Notificaciones | PlantillaNotificacion, Notificacion, AlertaConfiguracion | 3 |
| Auditoría | Auditoria | 1 |
| Referencia | EmpresaTelefonica, ServicioCorreoElectronico, TipoPlataforma, TipoEntidad, EstadoSesion | 5 |
| Presupuestos | Presupuesto, DetallePresupuesto | 2 |
| Consultas | Consulta | 1 |
| **TOTAL** | | **53** |

### 4.2 Esquema SQL Completo (MySQL / InnoDB / UTF8MB4)

A continuación se presenta el esquema completo convertido a sentencias `CREATE TABLE` compatibles con MySQL 8.x, usando InnoDB y charset `utf8mb4`. Este esquema es equivalente al modelo Prisma del sistema y puede utilizarse como base para una migración a MySQL.

```sql
-- ============================================================
-- PASTAS ORLANDO — ESQUEMA MySQL COMPLETO
-- Equivalente al schema.prisma (53 tablas)
-- Motor: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABLAS ORIGINALES (FASE 1)
-- ============================================================

CREATE TABLE `Producto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `categoria` VARCHAR(255) NOT NULL,
  `precio` DOUBLE NOT NULL,
  `peso` VARCHAR(255) NOT NULL DEFAULT '500g',
  `imagen` VARCHAR(255),
  `stock` BOOLEAN NOT NULL DEFAULT TRUE,
  `destacado` BOOLEAN NOT NULL DEFAULT FALSE,
  `orden` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Opinion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255),
  `calificacion` INT NOT NULL,
  `comentario` TEXT NOT NULL,
  `estado` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `ip` VARCHAR(255),
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_aprobacion` DATETIME(3),
  `id_aprobador` INT,
  `respuesta` TEXT,
  `fecha_respuesta` DATETIME(3),
  `destacado` BOOLEAN NOT NULL DEFAULT FALSE,
  `orden` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `InteraccionWhatsApp` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo` VARCHAR(255) NOT NULL,
  `mensaje_enviado` TEXT NOT NULL,
  `ip` VARCHAR(255),
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO GEOGRÁFICO
-- ============================================================

CREATE TABLE `Pais` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Pais_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Provincia` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pais` INT NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Provincia_id_pais_nombre_key` (`id_pais`, `nombre`),
  KEY `Provincia_id_pais_idx` (`id_pais`),
  CONSTRAINT `Provincia_id_pais_fkey` FOREIGN KEY (`id_pais`) REFERENCES `Pais`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Departamento` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_provincia` INT NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Departamento_id_provincia_nombre_key` (`id_provincia`, `nombre`),
  KEY `Departamento_id_provincia_idx` (`id_provincia`),
  CONSTRAINT `Departamento_id_provincia_fkey` FOREIGN KEY (`id_provincia`) REFERENCES `Provincia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Municipio` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_departamento` INT NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Municipio_id_departamento_nombre_key` (`id_departamento`, `nombre`),
  KEY `Municipio_id_departamento_idx` (`id_departamento`),
  CONSTRAINT `Municipio_id_departamento_fkey` FOREIGN KEY (`id_departamento`) REFERENCES `Departamento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MÓDULO PERSONAS
-- ============================================================

CREATE TABLE `TipoPersona` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TipoPersona_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Persona` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_municipio` INT,
  `nombre` VARCHAR(255) NOT NULL,
  `apellido` VARCHAR(255) NOT NULL,
  `numero_documento` VARCHAR(255) NOT NULL,
  `fecha_nacimiento` DATETIME(3),
  `observaciones` TEXT,
  `tipo_persona` VARCHAR(255) NOT NULL,
  `razon_social` VARCHAR(255),
  `cuit` VARCHAR(255),
  `condicion_iva` VARCHAR(255),
  `imagen` VARCHAR(255),
  `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `latitud` DOUBLE,
  `longitud` DOUBLE,
  `direccion_mapa` VARCHAR(255),
  `ubicacion_valida` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Persona_numero_documento_key` (`numero_documento`),
  KEY `Persona_tipo_persona_idx` (`tipo_persona`),
  KEY `Persona_numero_documento_idx` (`numero_documento`),
  KEY `Persona_id_municipio_idx` (`id_municipio`),
  CONSTRAINT `Persona_id_municipio_fkey` FOREIGN KEY (`id_municipio`) REFERENCES `Municipio`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONTACTOS
-- ============================================================

CREATE TABLE `TipoContacto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TipoContacto_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Contacto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_persona` INT NOT NULL,
  `id_tipo_contacto` INT NOT NULL,
  `valor` VARCHAR(255) NOT NULL,
  `es_principal` BOOLEAN NOT NULL DEFAULT FALSE,
  `verificado` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Contacto_id_persona_idx` (`id_persona`),
  KEY `Contacto_id_tipo_contacto_idx` (`id_tipo_contacto`),
  CONSTRAINT `Contacto_id_persona_fkey` FOREIGN KEY (`id_persona`) REFERENCES `Persona`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Contacto_id_tipo_contacto_fkey` FOREIGN KEY (`id_tipo_contacto`) REFERENCES `TipoContacto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DIRECCIONES
-- ============================================================

CREATE TABLE `TipoDireccion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TipoDireccion_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Direccion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_persona` INT NOT NULL,
  `id_tipo_direccion` INT NOT NULL,
  `id_municipio` INT,
  `direccion` VARCHAR(255) NOT NULL,
  `referencia` VARCHAR(255),
  `latitud` DOUBLE,
  `longitud` DOUBLE,
  `es_principal` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Direccion_id_persona_idx` (`id_persona`),
  KEY `Direccion_id_tipo_direccion_idx` (`id_tipo_direccion`),
  KEY `Direccion_id_municipio_idx` (`id_municipio`),
  CONSTRAINT `Direccion_id_persona_fkey` FOREIGN KEY (`id_persona`) REFERENCES `Persona`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Direccion_id_tipo_direccion_fkey` FOREIGN KEY (`id_tipo_direccion`) REFERENCES `TipoDireccion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Direccion_id_municipio_fkey` FOREIGN KEY (`id_municipio`) REFERENCES `Municipio`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USUARIOS
-- ============================================================

CREATE TABLE `Usuario` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_persona` INT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `estado` BOOLEAN NOT NULL DEFAULT TRUE,
  `imagen` VARCHAR(255),
  `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_actualizacion` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Usuario_id_persona_key` (`id_persona`),
  UNIQUE KEY `Usuario_email_key` (`email`),
  KEY `Usuario_email_idx` (`email`),
  CONSTRAINT `Usuario_id_persona_fkey` FOREIGN KEY (`id_persona`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ROLES Y PERMISOS
-- ============================================================

CREATE TABLE `Rol` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `es_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Rol_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UsuarioRol` (
  `id_usuario` INT NOT NULL,
  `id_rol` INT NOT NULL,
  PRIMARY KEY (`id_usuario`, `id_rol`),
  KEY `UsuarioRol_id_rol_idx` (`id_rol`),
  CONSTRAINT `UsuarioRol_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UsuarioRol_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Permiso` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `modulo` VARCHAR(255) NOT NULL DEFAULT 'general',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Permiso_nombre_key` (`nombre`),
  KEY `Permiso_modulo_idx` (`modulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `RolPermiso` (
  `id_rol` INT NOT NULL,
  `id_permiso` INT NOT NULL,
  PRIMARY KEY (`id_rol`, `id_permiso`),
  KEY `RolPermiso_id_permiso_idx` (`id_permiso`),
  CONSTRAINT `RolPermiso_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RolPermiso_id_permiso_fkey` FOREIGN KEY (`id_permiso`) REFERENCES `Permiso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SESIONES (AUDITORÍA)
-- ============================================================

CREATE TABLE `Sesion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `ip` VARCHAR(255),
  `dispositivo` VARCHAR(255),
  `fecha_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_fin` DATETIME(3),
  PRIMARY KEY (`id`),
  KEY `Sesion_id_usuario_idx` (`id_usuario`),
  CONSTRAINT `Sesion_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- UNIDADES DE MEDIDA
-- ============================================================

CREATE TABLE `UnidadMedida` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(255) NOT NULL,
  `conversion_a_base` DOUBLE NOT NULL DEFAULT 1.0,
  `tipo_medida` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UnidadMedida_codigo_key` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CATEGORÍAS DE MATERIAS PRIMAS
-- ============================================================

CREATE TABLE `CategoriaMateriaPrima` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CategoriaMateriaPrima_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MATERIAS PRIMAS
-- ============================================================

CREATE TABLE `MateriaPrima` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(255),
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `id_categoria` INT NOT NULL,
  `id_unidad_base` INT NOT NULL,
  `stock_actual` DOUBLE NOT NULL DEFAULT 0,
  `stock_minimo` DOUBLE NOT NULL DEFAULT 0,
  `precio_compra_referencia` DOUBLE NOT NULL DEFAULT 0,
  `imagen` VARCHAR(255),
  `estado` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `MateriaPrima_codigo_key` (`codigo`),
  KEY `MateriaPrima_codigo_idx` (`codigo`),
  KEY `MateriaPrima_nombre_idx` (`nombre`),
  KEY `MateriaPrima_id_categoria_idx` (`id_categoria`),
  KEY `MateriaPrima_id_unidad_base_idx` (`id_unidad_base`),
  CONSTRAINT `MateriaPrima_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `CategoriaMateriaPrima`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `MateriaPrima_id_unidad_base_fkey` FOREIGN KEY (`id_unidad_base`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TIPOS DE INSUMOS
-- ============================================================

CREATE TABLE `TipoInsumo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TipoInsumo_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INSUMOS
-- ============================================================

CREATE TABLE `Insumo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(255),
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `id_tipo_insumo` INT NOT NULL,
  `id_unidad_base` INT NOT NULL,
  `stock_actual` DOUBLE NOT NULL DEFAULT 0,
  `stock_minimo` DOUBLE NOT NULL DEFAULT 0,
  `precio_compra_referencia` DOUBLE NOT NULL DEFAULT 0,
  `imagen` VARCHAR(255),
  `estado` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Insumo_codigo_key` (`codigo`),
  KEY `Insumo_codigo_idx` (`codigo`),
  KEY `Insumo_nombre_idx` (`nombre`),
  KEY `Insumo_id_tipo_insumo_idx` (`id_tipo_insumo`),
  KEY `Insumo_id_unidad_base_idx` (`id_unidad_base`),
  CONSTRAINT `Insumo_id_tipo_insumo_fkey` FOREIGN KEY (`id_tipo_insumo`) REFERENCES `TipoInsumo`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Insumo_id_unidad_base_fkey` FOREIGN KEY (`id_unidad_base`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MARCAS
-- ============================================================

CREATE TABLE `Marca` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Marca_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CATEGORÍAS DE PRODUCTOS TERMINADOS
-- ============================================================

CREATE TABLE `CategoriaProductoTerminado` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CategoriaProductoTerminado_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCTOS TERMINADOS
-- ============================================================

CREATE TABLE `ProductoTerminado` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `codigo` VARCHAR(255),
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` TEXT,
  `id_categoria` INT NOT NULL,
  `peso_unitario_aprox` DOUBLE NOT NULL DEFAULT 0,
  `precio_venta` DOUBLE NOT NULL DEFAULT 0,
  `stock_actual` DOUBLE NOT NULL DEFAULT 0,
  `stock_minimo` DOUBLE NOT NULL DEFAULT 0,
  `destacado` BOOLEAN NOT NULL DEFAULT FALSE,
  `orden` INT NOT NULL DEFAULT 0,
  `visible_en_landing` BOOLEAN NOT NULL DEFAULT TRUE,
  `imagen` VARCHAR(255),
  `estado` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductoTerminado_codigo_key` (`codigo`),
  KEY `ProductoTerminado_codigo_idx` (`codigo`),
  KEY `ProductoTerminado_nombre_idx` (`nombre`),
  KEY `ProductoTerminado_id_categoria_idx` (`id_categoria`),
  CONSTRAINT `ProductoTerminado_id_categoria_fkey` FOREIGN KEY (`id_categoria`) REFERENCES `CategoriaProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RECETAS
-- ============================================================

CREATE TABLE `Receta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_producto_terminado` INT NOT NULL,
  `nombre_receta` VARCHAR(255) NOT NULL,
  `rendimiento_unidades` INT NOT NULL DEFAULT 1,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Receta_id_producto_terminado_idx` (`id_producto_terminado`),
  CONSTRAINT `Receta_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetalleReceta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_receta` INT NOT NULL,
  `id_materia_prima` INT,
  `id_insumo` INT,
  `cantidad_necesaria` DOUBLE NOT NULL,
  `id_unidad` INT NOT NULL,
  `costo_estimado` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetalleReceta_id_receta_idx` (`id_receta`),
  KEY `DetalleReceta_id_materia_prima_idx` (`id_materia_prima`),
  KEY `DetalleReceta_id_insumo_idx` (`id_insumo`),
  KEY `DetalleReceta_id_unidad_idx` (`id_unidad`),
  CONSTRAINT `DetalleReceta_id_receta_fkey` FOREIGN KEY (`id_receta`) REFERENCES `Receta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DetalleReceta_id_materia_prima_fkey` FOREIGN KEY (`id_materia_prima`) REFERENCES `MateriaPrima`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleReceta_id_insumo_fkey` FOREIGN KEY (`id_insumo`) REFERENCES `Insumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleReceta_id_unidad_fkey` FOREIGN KEY (`id_unidad`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FORMAS DE PAGO
-- ============================================================

CREATE TABLE `FormaPago` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre_forma` VARCHAR(255) NOT NULL,
  `requiere_identificacion` BOOLEAN NOT NULL DEFAULT FALSE,
  `requiere_cuenta` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `FormaPago_nombre_forma_key` (`nombre_forma`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ESTADOS GENERALES
-- ============================================================

CREATE TABLE `EstadoGeneral` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre_estado` VARCHAR(255) NOT NULL,
  `entidad_aplicable` VARCHAR(255),
  `es_final` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EstadoGeneral_nombre_estado_key` (`nombre_estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- COMPRAS A PROVEEDORES
-- ============================================================

CREATE TABLE `Compra` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_proveedor` INT NOT NULL,
  `id_forma_pago` INT NOT NULL,
  `numero_factura` VARCHAR(255),
  `fecha_compra` DATETIME(3) NOT NULL,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `iva` DOUBLE NOT NULL DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `id_estado` INT NOT NULL,
  `observaciones` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Compra_fecha_compra_idx` (`fecha_compra`),
  KEY `Compra_id_proveedor_idx` (`id_proveedor`),
  KEY `Compra_id_forma_pago_idx` (`id_forma_pago`),
  KEY `Compra_id_estado_idx` (`id_estado`),
  CONSTRAINT `Compra_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Compra_id_forma_pago_fkey` FOREIGN KEY (`id_forma_pago`) REFERENCES `FormaPago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Compra_id_estado_fkey` FOREIGN KEY (`id_estado`) REFERENCES `EstadoGeneral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetalleCompra` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_compra` INT NOT NULL,
  `id_materia_prima` INT,
  `id_insumo` INT,
  `id_marca` INT,
  `cantidad_comprada` DOUBLE NOT NULL,
  `id_unidad_compra` INT NOT NULL,
  `precio_unitario` DOUBLE NOT NULL,
  `precio_total` DOUBLE NOT NULL,
  `fecha_vencimiento` DATETIME(3),
  `lote` VARCHAR(255),
  `cantidad_base` DOUBLE NOT NULL DEFAULT 0,
  `precio_por_unidad_base` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetalleCompra_id_compra_idx` (`id_compra`),
  KEY `DetalleCompra_id_materia_prima_idx` (`id_materia_prima`),
  KEY `DetalleCompra_id_insumo_idx` (`id_insumo`),
  KEY `DetalleCompra_id_marca_idx` (`id_marca`),
  KEY `DetalleCompra_id_unidad_compra_idx` (`id_unidad_compra`),
  CONSTRAINT `DetalleCompra_id_compra_fkey` FOREIGN KEY (`id_compra`) REFERENCES `Compra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetalleCompra_id_materia_prima_fkey` FOREIGN KEY (`id_materia_prima`) REFERENCES `MateriaPrima`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleCompra_id_insumo_fkey` FOREIGN KEY (`id_insumo`) REFERENCES `Insumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleCompra_id_marca_fkey` FOREIGN KEY (`id_marca`) REFERENCES `Marca`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleCompra_id_unidad_compra_fkey` FOREIGN KEY (`id_unidad_compra`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PEDIDOS A PROVEEDORES
-- ============================================================

CREATE TABLE `PedidoProveedor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_proveedor` INT NOT NULL,
  `fecha_pedido` DATETIME(3) NOT NULL,
  `fecha_entrega_estimada` DATETIME(3),
  `fecha_entrega_real` DATETIME(3),
  `observaciones` TEXT,
  `id_estado` INT NOT NULL,
  `total_estimado` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PedidoProveedor_fecha_pedido_idx` (`fecha_pedido`),
  KEY `PedidoProveedor_id_proveedor_idx` (`id_proveedor`),
  KEY `PedidoProveedor_id_estado_idx` (`id_estado`),
  CONSTRAINT `PedidoProveedor_id_proveedor_fkey` FOREIGN KEY (`id_proveedor`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PedidoProveedor_id_estado_fkey` FOREIGN KEY (`id_estado`) REFERENCES `EstadoGeneral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetallePedidoProveedor` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pedido` INT NOT NULL,
  `id_materia_prima` INT,
  `id_insumo` INT,
  `cantidad_pedida` DOUBLE NOT NULL,
  `id_unidad` INT NOT NULL,
  `precio_estimado` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetallePedidoProveedor_id_pedido_idx` (`id_pedido`),
  KEY `DetallePedidoProveedor_id_materia_prima_idx` (`id_materia_prima`),
  KEY `DetallePedidoProveedor_id_insumo_idx` (`id_insumo`),
  KEY `DetallePedidoProveedor_id_unidad_idx` (`id_unidad`),
  CONSTRAINT `DetallePedidoProveedor_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `PedidoProveedor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetallePedidoProveedor_id_materia_prima_fkey` FOREIGN KEY (`id_materia_prima`) REFERENCES `MateriaPrima`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetallePedidoProveedor_id_insumo_fkey` FOREIGN KEY (`id_insumo`) REFERENCES `Insumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetallePedidoProveedor_id_unidad_fkey` FOREIGN KEY (`id_unidad`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PEDIDOS DE CLIENTES
-- ============================================================

CREATE TABLE `PedidoCliente` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_cliente` INT NOT NULL,
  `fecha_pedido` DATETIME(3) NOT NULL,
  `fecha_entrega_solicitada` DATETIME(3) NOT NULL,
  `fecha_entrega_real` DATETIME(3),
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `senia` DOUBLE NOT NULL DEFAULT 0,
  `id_estado` INT NOT NULL,
  `observaciones` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `PedidoCliente_fecha_pedido_idx` (`fecha_pedido`),
  KEY `PedidoCliente_id_cliente_idx` (`id_cliente`),
  KEY `PedidoCliente_id_estado_idx` (`id_estado`),
  CONSTRAINT `PedidoCliente_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PedidoCliente_id_estado_fkey` FOREIGN KEY (`id_estado`) REFERENCES `EstadoGeneral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetallePedidoCliente` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pedido` INT NOT NULL,
  `id_producto_terminado` INT NOT NULL,
  `cantidad` DOUBLE NOT NULL,
  `precio_unitario` DOUBLE NOT NULL,
  `subtotal` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetallePedidoCliente_id_pedido_idx` (`id_pedido`),
  KEY `DetallePedidoCliente_id_producto_terminado_idx` (`id_producto_terminado`),
  CONSTRAINT `DetallePedidoCliente_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `PedidoCliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetallePedidoCliente_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- RESERVAS DE CLIENTES
-- ============================================================

CREATE TABLE `ReservaCliente` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_cliente` INT NOT NULL,
  `id_pedido` INT,
  `fecha_reserva` DATETIME(3) NOT NULL,
  `fecha_validez_hasta` DATETIME(3) NOT NULL,
  `id_producto_terminado` INT NOT NULL,
  `cantidad_reservada` DOUBLE NOT NULL,
  `cantidad_confirmada` DOUBLE NOT NULL DEFAULT 0,
  `senia` DOUBLE NOT NULL DEFAULT 0,
  `id_estado` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ReservaCliente_fecha_reserva_idx` (`fecha_reserva`),
  KEY `ReservaCliente_id_cliente_idx` (`id_cliente`),
  KEY `ReservaCliente_id_pedido_idx` (`id_pedido`),
  KEY `ReservaCliente_id_producto_terminado_idx` (`id_producto_terminado`),
  KEY `ReservaCliente_id_estado_idx` (`id_estado`),
  CONSTRAINT `ReservaCliente_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ReservaCliente_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `PedidoCliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ReservaCliente_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ReservaCliente_id_estado_fkey` FOREIGN KEY (`id_estado`) REFERENCES `EstadoGeneral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- VENTAS
-- ============================================================

CREATE TABLE `Venta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_cliente` INT NOT NULL,
  `id_vendedor` INT NOT NULL,
  `id_forma_pago` INT NOT NULL,
  `id_pedido` INT,
  `numero_comprobante` VARCHAR(255),
  `fecha_venta` DATETIME(3) NOT NULL,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `iva` DOUBLE NOT NULL DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `id_estado` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Venta_id_pedido_key` (`id_pedido`),
  KEY `Venta_fecha_venta_idx` (`fecha_venta`),
  KEY `Venta_id_cliente_idx` (`id_cliente`),
  KEY `Venta_id_vendedor_idx` (`id_vendedor`),
  KEY `Venta_id_forma_pago_idx` (`id_forma_pago`),
  KEY `Venta_id_estado_idx` (`id_estado`),
  CONSTRAINT `Venta_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Venta_id_vendedor_fkey` FOREIGN KEY (`id_vendedor`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Venta_id_forma_pago_fkey` FOREIGN KEY (`id_forma_pago`) REFERENCES `FormaPago`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Venta_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `PedidoCliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Venta_id_estado_fkey` FOREIGN KEY (`id_estado`) REFERENCES `EstadoGeneral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetalleVenta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_venta` INT NOT NULL,
  `id_producto_terminado` INT NOT NULL,
  `cantidad` DOUBLE NOT NULL,
  `precio_unitario` DOUBLE NOT NULL,
  `subtotal` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetalleVenta_id_venta_idx` (`id_venta`),
  KEY `DetalleVenta_id_producto_terminado_idx` (`id_producto_terminado`),
  CONSTRAINT `DetalleVenta_id_venta_fkey` FOREIGN KEY (`id_venta`) REFERENCES `Venta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetalleVenta_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRODUCCIÓN
-- ============================================================

CREATE TABLE `Produccion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_receta` INT NOT NULL,
  `id_supervisor` INT,
  `cantidad_producida` INT NOT NULL,
  `fecha_produccion` DATETIME(3) NOT NULL,
  `costo_total_materias_primas` DOUBLE NOT NULL DEFAULT 0,
  `costo_total_insumos` DOUBLE NOT NULL DEFAULT 0,
  `costo_total` DOUBLE NOT NULL DEFAULT 0,
  `id_estado` INT NOT NULL,
  `observaciones` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Produccion_fecha_produccion_idx` (`fecha_produccion`),
  KEY `Produccion_id_receta_idx` (`id_receta`),
  KEY `Produccion_id_supervisor_idx` (`id_supervisor`),
  KEY `Produccion_id_estado_idx` (`id_estado`),
  CONSTRAINT `Produccion_id_receta_fkey` FOREIGN KEY (`id_receta`) REFERENCES `Receta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Produccion_id_supervisor_fkey` FOREIGN KEY (`id_supervisor`) REFERENCES `Persona`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Produccion_id_estado_fkey` FOREIGN KEY (`id_estado`) REFERENCES `EstadoGeneral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetalleProduccionConsumo` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_produccion` INT NOT NULL,
  `id_materia_prima` INT,
  `id_insumo` INT,
  `cantidad_consumida` DOUBLE NOT NULL,
  `id_unidad` INT NOT NULL,
  `costo_unitario` DOUBLE NOT NULL,
  `costo_total` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetalleProduccionConsumo_id_produccion_idx` (`id_produccion`),
  KEY `DetalleProduccionConsumo_id_materia_prima_idx` (`id_materia_prima`),
  KEY `DetalleProduccionConsumo_id_insumo_idx` (`id_insumo`),
  KEY `DetalleProduccionConsumo_id_unidad_idx` (`id_unidad`),
  CONSTRAINT `DetalleProduccionConsumo_id_produccion_fkey` FOREIGN KEY (`id_produccion`) REFERENCES `Produccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetalleProduccionConsumo_id_materia_prima_fkey` FOREIGN KEY (`id_materia_prima`) REFERENCES `MateriaPrima`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleProduccionConsumo_id_insumo_fkey` FOREIGN KEY (`id_insumo`) REFERENCES `Insumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DetalleProduccionConsumo_id_unidad_fkey` FOREIGN KEY (`id_unidad`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetalleProduccionGenerado` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_produccion` INT NOT NULL,
  `id_producto_terminado` INT NOT NULL,
  `cantidad_generada` DOUBLE NOT NULL,
  `costo_unitario` DOUBLE NOT NULL,
  `costo_total` DOUBLE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetalleProduccionGenerado_id_produccion_idx` (`id_produccion`),
  KEY `DetalleProduccionGenerado_id_producto_terminado_idx` (`id_producto_terminado`),
  CONSTRAINT `DetalleProduccionGenerado_id_produccion_fkey` FOREIGN KEY (`id_produccion`) REFERENCES `Produccion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetalleProduccionGenerado_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- STOCK MOVEMENTS
-- ============================================================

CREATE TABLE `StockMovement` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo_movimiento` VARCHAR(255) NOT NULL,
  `id_materia_prima` INT,
  `id_insumo` INT,
  `id_producto_terminado` INT,
  `cantidad` DOUBLE NOT NULL,
  `id_unidad` INT NOT NULL,
  `stock_antes` DOUBLE NOT NULL,
  `stock_despues` DOUBLE NOT NULL,
  `referencia_id` INT,
  `referencia_tabla` VARCHAR(255),
  `observacion` VARCHAR(255),
  `id_usuario` INT,
  `fecha_movimiento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockMovement_id_materia_prima_idx` (`id_materia_prima`),
  KEY `StockMovement_id_insumo_idx` (`id_insumo`),
  KEY `StockMovement_id_producto_terminado_idx` (`id_producto_terminado`),
  KEY `StockMovement_id_unidad_idx` (`id_unidad`),
  KEY `StockMovement_id_usuario_idx` (`id_usuario`),
  CONSTRAINT `StockMovement_id_materia_prima_fkey` FOREIGN KEY (`id_materia_prima`) REFERENCES `MateriaPrima`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StockMovement_id_insumo_fkey` FOREIGN KEY (`id_insumo`) REFERENCES `Insumo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StockMovement_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StockMovement_id_unidad_fkey` FOREIGN KEY (`id_unidad`) REFERENCES `UnidadMedida`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `StockMovement_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUTENTICACIÓN 2FA
-- ============================================================

CREATE TABLE `Usuario2FA` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `secret_2fa` VARCHAR(255),
  `activado` BOOLEAN NOT NULL DEFAULT FALSE,
  `codigos_respaldo` TEXT,
  `fecha_activacion` DATETIME(3),
  `fecha_ultimo_uso` DATETIME(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Usuario2FA_id_usuario_key` (`id_usuario`),
  CONSTRAINT `Usuario2FA_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LOGS DE ACCESO
-- ============================================================

CREATE TABLE `LogAcceso` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT,
  `email_intento` VARCHAR(255),
  `resultado` VARCHAR(255) NOT NULL,
  `ip` VARCHAR(255),
  `user_agent` TEXT,
  `navegador` VARCHAR(255),
  `sistema_operativo` VARCHAR(255),
  `dispositivo` VARCHAR(255),
  `pais` VARCHAR(255),
  `ciudad` VARCHAR(255),
  `motivo` VARCHAR(255),
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `LogAcceso_fecha_idx` (`fecha`),
  KEY `LogAcceso_email_intento_idx` (`email_intento`),
  KEY `LogAcceso_resultado_idx` (`resultado`),
  KEY `LogAcceso_id_usuario_idx` (`id_usuario`),
  CONSTRAINT `LogAcceso_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SESIONES ACTIVAS
-- ============================================================

CREATE TABLE `SesionActiva` (
  `id_sesion` VARCHAR(255) NOT NULL,
  `id_usuario` INT NOT NULL,
  `ip` VARCHAR(255),
  `user_agent` TEXT,
  `fecha_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_expiracion` DATETIME(3) NOT NULL,
  `fecha_fin` DATETIME(3),
  `estado` VARCHAR(255) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id_sesion`),
  KEY `SesionActiva_id_usuario_idx` (`id_usuario`),
  KEY `SesionActiva_estado_idx` (`estado`),
  CONSTRAINT `SesionActiva_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- AUDITORÍA
-- ============================================================

CREATE TABLE `Auditoria` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_usuario` INT,
  `accion` VARCHAR(255) NOT NULL,
  `modulo` VARCHAR(255) NOT NULL,
  `entidad_id` INT,
  `entidad_nombre` VARCHAR(255),
  `detalles` TEXT,
  `ip` VARCHAR(255),
  `user_agent` TEXT,
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Auditoria_fecha_idx` (`fecha`),
  KEY `Auditoria_modulo_idx` (`modulo`),
  KEY `Auditoria_accion_idx` (`accion`),
  KEY `Auditoria_id_usuario_idx` (`id_usuario`),
  CONSTRAINT `Auditoria_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ENVÍOS Y LOGÍSTICA
-- ============================================================

CREATE TABLE `PuntoEncuentro` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `latitud` DOUBLE,
  `longitud` DOUBLE,
  `horarios` TEXT,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Entrega` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_pedido` INT NOT NULL,
  `id_punto_encuentro` INT,
  `direccion_alternativa` VARCHAR(255),
  `fecha_programada` DATETIME(3) NOT NULL,
  `fecha_realizada` DATETIME(3),
  `hora_desde` VARCHAR(255),
  `hora_hasta` VARCHAR(255),
  `nombre_recibe` VARCHAR(255),
  `telefono_recibe` VARCHAR(255),
  `estado` VARCHAR(255) NOT NULL DEFAULT 'programado',
  `observaciones` TEXT,
  `latitud_entrega` DOUBLE,
  `longitud_entrega` DOUBLE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Entrega_fecha_programada_idx` (`fecha_programada`),
  KEY `Entrega_estado_idx` (`estado`),
  KEY `Entrega_id_pedido_idx` (`id_pedido`),
  KEY `Entrega_id_punto_encuentro_idx` (`id_punto_encuentro`),
  CONSTRAINT `Entrega_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `PedidoCliente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Entrega_id_punto_encuentro_fkey` FOREIGN KEY (`id_punto_encuentro`) REFERENCES `PuntoEncuentro`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `NotificacionEntrega` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_entrega` INT NOT NULL,
  `tipo` VARCHAR(255) NOT NULL,
  `canal` VARCHAR(255) NOT NULL,
  `destinatario` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `estado` VARCHAR(255) NOT NULL,
  `fecha_envio` DATETIME(3),
  `error` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `NotificacionEntrega_id_entrega_idx` (`id_entrega`),
  CONSTRAINT `NotificacionEntrega_id_entrega_fkey` FOREIGN KEY (`id_entrega`) REFERENCES `Entrega`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

CREATE TABLE `PlantillaNotificacion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `canal` VARCHAR(255) NOT NULL,
  `asunto` VARCHAR(255),
  `mensaje` TEXT NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PlantillaNotificacion_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Notificacion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_plantilla` INT,
  `tipo` VARCHAR(255) NOT NULL,
  `destinatario` VARCHAR(255) NOT NULL,
  `asunto` VARCHAR(255),
  `mensaje` TEXT NOT NULL,
  `estado` VARCHAR(255) NOT NULL DEFAULT 'pendiente',
  `fecha_programada` DATETIME(3),
  `fecha_envio` DATETIME(3),
  `error` VARCHAR(255),
  `metadata` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notificacion_estado_idx` (`estado`),
  KEY `Notificacion_tipo_idx` (`tipo`),
  KEY `Notificacion_createdAt_idx` (`createdAt`),
  KEY `Notificacion_id_plantilla_idx` (`id_plantilla`),
  CONSTRAINT `Notificacion_id_plantilla_fkey` FOREIGN KEY (`id_plantilla`) REFERENCES `PlantillaNotificacion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `AlertaConfiguracion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tipo` VARCHAR(255) NOT NULL,
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `umbral` INT,
  `destinatarios` TEXT,
  `frecuencia` VARCHAR(255),
  `ultimo_envio` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AlertaConfiguracion_tipo_key` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLAS DE REFERENCIA ADICIONALES
-- ============================================================

CREATE TABLE `EmpresaTelefonica` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `codigo` VARCHAR(255),
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmpresaTelefonica_nombre_key` (`nombre`),
  UNIQUE KEY `EmpresaTelefonica_codigo_key` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ServicioCorreoElectronico` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `dominio` VARCHAR(255),
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ServicioCorreoElectronico_nombre_key` (`nombre`),
  UNIQUE KEY `ServicioCorreoElectronico_dominio_key` (`dominio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TipoPlataforma` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TipoPlataforma_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TipoEntidad` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `activo` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TipoEntidad_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `EstadoSesion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `descripcion` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EstadoSesion_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PRESUPUESTOS / COTIZACIONES
-- ============================================================

CREATE TABLE `Presupuesto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_cliente` INT NOT NULL,
  `numero` VARCHAR(255) NOT NULL,
  `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fecha_validez` DATETIME(3) NOT NULL,
  `subtotal` DOUBLE NOT NULL DEFAULT 0,
  `iva` DOUBLE NOT NULL DEFAULT 0,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `observaciones` TEXT,
  `estado` VARCHAR(255) NOT NULL DEFAULT 'pendiente',
  `id_pedido` INT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Presupuesto_numero_key` (`numero`),
  UNIQUE KEY `Presupuesto_id_pedido_key` (`id_pedido`),
  KEY `Presupuesto_numero_idx` (`numero`),
  KEY `Presupuesto_id_cliente_idx` (`id_cliente`),
  KEY `Presupuesto_estado_idx` (`estado`),
  CONSTRAINT `Presupuesto_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Persona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Presupuesto_id_pedido_fkey` FOREIGN KEY (`id_pedido`) REFERENCES `PedidoCliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DetallePresupuesto` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `id_presupuesto` INT NOT NULL,
  `id_producto_terminado` INT NOT NULL,
  `cantidad` DOUBLE NOT NULL,
  `precio_unitario` DOUBLE NOT NULL,
  `subtotal` DOUBLE NOT NULL,
  `observaciones` VARCHAR(255),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `DetallePresupuesto_id_presupuesto_idx` (`id_presupuesto`),
  KEY `DetallePresupuesto_id_producto_terminado_idx` (`id_producto_terminado`),
  CONSTRAINT `DetallePresupuesto_id_presupuesto_fkey` FOREIGN KEY (`id_presupuesto`) REFERENCES `Presupuesto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DetallePresupuesto_id_producto_terminado_fkey` FOREIGN KEY (`id_producto_terminado`) REFERENCES `ProductoTerminado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CONSULTAS DESDE LA WEB
-- ============================================================

CREATE TABLE `Consulta` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telefono` VARCHAR(255) NOT NULL,
  `mensaje` TEXT NOT NULL,
  `leido` BOOLEAN NOT NULL DEFAULT FALSE,
  `respondido` BOOLEAN NOT NULL DEFAULT FALSE,
  `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Consulta_fecha_idx` (`fecha`),
  KEY `Consulta_leido_idx` (`leido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
```

### 4.3 Descripción de Tablas Clave

#### Persona — Tabla Central del Sistema

La tabla `Persona` es la entidad transversal más importante del sistema. Toda persona que interactúa con el negocio (cliente, proveedor, supervisor, empleado) es registrada aquí, independientemente de su rol. Los roles se determinan por el campo `tipo_persona` y las relaciones funcionales (una persona puede ser simultáneamente cliente y proveedor).

**Campos destacados:**
- `numero_documento`: Identificador único (DNI, CUIT, etc.)
- `tipo_persona`: Clasificación (cliente, proveedor, empleado, otro)
- `cuit`, `razon_social`, `condicion_iva`: Datos fiscales para facturación
- `latitud`, `longitud`, `ubicacion_valida`: Coordenadas para mapas
- Relación 1:1 con `Usuario` (si la persona tiene acceso al sistema)

#### ProductoTerminado — Inventario de Venta

Tabla central del módulo de producción y ventas. Cada producto terminado tiene categoría, código, precio de venta, stock actual/mínimo y visibilidad en la landing page. Se vincula con recetas (para saber cómo se produce) y con detalles de pedidos, ventas y presupuestos (para saber cómo se comercializa).

#### StockMovement — Trazabilidad de Inventario

Tabla de auditoría de stock que registra cada movimiento con tipo (compra, venta, produccion_consumo, produccion_genera, ajuste_in, ajuste_out, devolucion), cantidades antes/después, referencia a la entidad origen y usuario responsable. Permite reconstruir el historial completo de cualquier ítem del inventario.

#### Auditoria — Trazabilidad del Sistema

Registro inmutable de todas las acciones significativas. El campo `detalles` almacena un JSON con el estado anterior y posterior de la entidad, permitiendo reconstruir cualquier cambio. Los índices sobre `fecha`, `modulo`, `accion` e `id_usuario` permiten consultas eficientes.

---

## 5. Guía de Instalación y Configuración Local

### 5.1 Requisitos Previos

| Requisito | Versión mínima | Verificación |
|-----------|---------------|--------------|
| Node.js | 18.x+ | `node --version` |
| Bun (recomendado) o npm | 1.x+ / 8.x+ | `bun --version` o `npm --version` |
| Git | 2.x+ | `git --version` |
| Un editor de código | VS Code recomendado | — |

### 5.2 Clonar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/orlandocandia/laspastasdeorlando.git
cd laspastasdeorlando

# Instalar dependencias
bun install
# o alternativamente: npm install
```

### 5.3 Configurar Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto basándose en `.env.example`:

```bash
cp .env.example .env
```

Variables requeridas:

```env
# ═══════════════════════════════════════════
# BASE DE DATOS
# ═══════════════════════════════════════════
# Desarrollo local (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Producción (Turso/libSQL)
# DATABASE_URL="libsql://tu-db-name.turso.co"
# DATABASE_AUTH_TOKEN="tu-auth-token"

# ═══════════════════════════════════════════
# AUTENTICACIÓN
# ═══════════════════════════════════════════
NEXTAUTH_SECRET="genera-un-secreto-seguro-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# ═══════════════════════════════════════════
# CORREO ELECTRÓNICO (SMTP)
# ═══════════════════════════════════════════
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_APP_PASSWORD="tu-app-password-de-gmail"

# ═══════════════════════════════════════════
# WHATSAPP (CallMeBot)
# ═══════════════════════════════════════════
CALLMEBOT_API_KEY="tu-api-key-callmebot"
WHATSAPP_PHONE="5493810000000"
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Configurar App Password de Gmail:**
1. Ir a [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Activar verificación en 2 pasos (si no está activada)
3. Ir a "Contraseñas de aplicación"
4. Generar una nueva contraseña para "Correo" en "Otra"
5. Usar esa contraseña en `SMTP_APP_PASSWORD`

**Configurar CallMeBot:**
1. Agregar el número +34 644 52 74 88 a tus contactos de WhatsApp
2. Enviar el mensaje "I allow callmebot to send me messages"
3. Recibirás tu API key por WhatsApp

### 5.4 Inicializar la Base de Datos

```bash
# Generar el cliente Prisma
bunx prisma generate
# o: npx prisma generate

# Crear la base de datos SQLite local y aplicar el esquema
bunx prisma db push
# o: npx prisma db push

# (Opcional) Ejecutar el seed para datos iniciales
# Esto crea: roles, permisos, usuario admin, categorías, unidades, estados, etc.
bunx prisma db seed
# o: npx tsx prisma/seed.ts
```

**Alternativa con seed para Turso (producción):**
```bash
# Solo si usas Turso como BD
npx tsx prisma/seed-turso.ts
```

### 5.5 Iniciar el Servidor de Desarrollo

```bash
# Iniciar en modo desarrollo
bun run dev
# o: npm run dev

# La aplicación estará disponible en:
# http://localhost:3000
```

### 5.6 Acceso al Panel Administrativo

1. Navegar a `http://localhost:3000/admin/login`
2. Ingresar con las credenciales del usuario admin creado por el seed:
   - **Email:** (el configurado en el seed, típicamente `admin@pastasorlando.com`)
   - **Contraseña:** (la configurada en el seed)
3. Si el usuario tiene 2FA activado, se solicitará el código TOTP

### 5.7 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Inicia el servidor de desarrollo en puerto 3000 |
| `bun run build` | Compila la aplicación para producción |
| `bun run start` | Inicia el servidor de producción |
| `bun run lint` | Ejecuta ESLint para verificar código |
| `bunx prisma studio` | Abre Prisma Studio (GUI para la BD) |
| `bunx prisma db push` | Aplica cambios del schema a la BD sin migraciones |
| `bunx prisma db seed` | Ejecuta los scripts de seed |
| `bunx prisma generate` | Regenera el cliente Prisma |
| `bunx prisma migrate dev` | Crea una migración (para BD con migraciones) |
| `bunx prisma migrate reset` | Resetea la BD y ejecuta todas las migraciones + seed |
| `bun run db:seed-notif` | Ejecuta el seed específico de notificaciones |

### 5.8 Estructura del Seed

El archivo `prisma/seed-completo.ts` (y `seed.ts`) inicializa:

- **Roles**: admin, produccion, ventas, lectura
- **Permisos**: ~40 permisos en formato `modulo.accion` para todos los módulos
- **Rol-Permiso**: Asignación completa de permisos al rol admin
- **Usuario admin**: Con contraseña hasheada (bcryptjs) y rol admin asignado
- **Categorías MP**: Harinas, Huevos, Lácteos, Condimentos, Rellenos, Otros
- **Categorías PT**: Frescos, Rellenos, Salsas, Postres
- **Tipos de insumo**: Envases, Bolsas, Etiquetas, Otros
- **Unidades de medida**: kg, g, l, ml, unidad, docena
- **Formas de pago**: Efectivo, Transferencia, MercadoPago
- **Estados generales**: Pendiente, Confirmado, En proceso, Completado, Cancelado, etc.
- **Tipos de contacto**: Teléfono, Email, WhatsApp, Instagram, Facebook
- **Tipos de dirección**: Casa, Trabajo, Otro
- **Datos geográficos**: Argentina > Tucumán > departamentos y municipios
- **Plantillas de notificación**: pedido_confirmado, stock_bajo, entrega_recordatorio
- **Alertas**: stock_bajo, pedido_pendiente, produccion_atrasada, entrega_proxima
- **Productos de ejemplo**: Varios productos para la landing page

### 5.9 Despliegue a Producción

El despliegue se realiza automáticamente mediante Vercel al hacer `git push` a la rama `main`.

**Configuración en Vercel:**

1. Conectar el repositorio GitHub a Vercel
2. Configurar las variables de entorno en el dashboard de Vercel:
   - `DATABASE_URL` → URL de Turso (libsql://...)
   - `DATABASE_AUTH_TOKEN` → Token de autenticación de Turso
   - `NEXTAUTH_SECRET` → Secreto de producción
   - `NEXTAUTH_URL` → `https://laspastasdeorlando.vercel.app`
   - Variables SMTP, CallMeBot, WhatsApp
3. Configurar Build Command: `next build` (automático)
4. Configurar Output Directory: `.next` (automático)

**Base de datos Turso:**

1. Crear una cuenta en [turso.tech](https://turso.tech)
2. Crear una base de datos
3. Obtener la URL y el auth token
4. Para sincronizar el esquema: visitar `/api/db-push-turso` una vez desplegado
5. Para seed inicial: visitar `/api/seed-turso`

**Health check:**
- `GET /api/route` → Devuelve estado del sistema y conexión a BD

### 5.10 Solución de Problemas Comunes

| Problema | Solución |
|----------|----------|
| Error "Prisma Client not generated" | Ejecutar `bunx prisma generate` |
| Error de conexión a BD | Verificar `DATABASE_URL` en `.env` |
| Error "NEXTAUTH_SECRET is required" | Agregar la variable en `.env` |
| La landing no muestra productos | Ejecutar el seed o crear productos desde el admin |
| No se envían emails | Verificar credenciales SMTP y App Password de Gmail |
| Error al hacer push a Turso | Verificar `DATABASE_AUTH_TOKEN` y que la BD exista |
| Puerto 3000 ocupado | Cambiar con `bun run dev -- -p 3001` |
| Pantalla blanca en producción | Verificar logs en Vercel Dashboard, puede faltar una variable de entorno |
| Mapas no cargan | Verificar conexión a internet (Leaflet carga tiles de OpenStreetMap) |

### 5.11 Convenciones de Desarrollo

- **Commits**: Seguir [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
- **Branches**: `main` para producción, `develop` para desarrollo, `feature/*` para nuevas funcionalidades
- **API Routes**: Siempre validar input con Zod, manejar errores con try/catch, devolver respuestas tipadas
- **Componentes**: Un componente por archivo, nombres PascalCase, usar shadcn/ui como base
- **Base de datos**: Usar Prisma Client desde `@/lib/db`, nunca acceso directo a SQL
- **Auditoría**: Registrar toda mutación usando `auditoria-service.ts`
- **Permisos**: Verificar permisos en API routes con `permisos-service.ts`

---

> **Fin del Informe Técnico — Pastas Orlando v1.0.0**
>
> Para consultas técnicas adicionales, contactar al equipo de desarrollo o consultar el repositorio en [GitHub](https://github.com/orlandocandia/laspastasdeorlando).
