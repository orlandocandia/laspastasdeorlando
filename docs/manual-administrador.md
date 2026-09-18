# 🛠️ Manual de Administración – Pastas Orlando

---

> **Sistema de gestión para la producción y venta de pastas artesanales**
>
> Este manual está pensado para **Orlando y su equipo**, que administran el sistema a través del panel de administración. Cubre todo lo necesario para operar el sistema en el día a día: desde el dashboard hasta backups, reportes y configuración avanzada.

---

## 📑 Índice

1. [Introducción al panel de administración](#1-introducción-al-panel-de-administración)
2. [El Dashboard: jerarquía visual, flujo de trabajo y acciones directas](#2-el-dashboard-jerarquía-visual-flujo-de-trabajo-y-acciones-directas)
3. [Gestión de productos](#3-gestión-de-productos)
4. [Gestión de recetas y producción](#4-gestión-de-recetas-y-producción)
5. [Gestión de ventas, presupuestos y pedidos](#5-gestión-de-ventas-presupuestos-y-pedidos)
6. [Gestión de promociones y descuentos por volumen](#6-gestión-de-promociones-y-descuentos-por-volumen)
7. [Gestión de usuarios y roles](#7-gestión-de-usuarios-y-roles)
8. [Reportes y auditoría](#8-reportes-y-auditoría)
9. [Backup y restauración](#9-backup-y-restauración)
10. [Configuración general](#10-configuración-general)

---

## 1. Introducción al panel de administración

### 🎯 ¿Qué es el panel de administración?

El **panel de administración** (o *admin panel*) es la parte privada del sistema donde vos y tu equipo gestionan TODO el negocio: productos, stock, recetas, producción, ventas, pedidos, reportes y configuración.

Es distinto de la **web pública** (la que ven los clientes en `laspastasdeorlando.vercel.app`), que solo muestra el catálogo y permite hacer pedidos o reservas.

El panel te permite:

- 📊 **Ver el estado del negocio** en un solo vistazo (dashboard)
- 📦 **Administrar productos**, materias primas, insumos y stock
- 🏭 **Controlar la producción** con recetas automáticas
- 💰 **Registrar ventas, presupuestos y pedidos**
- 🏷️ **Configurar promociones** para la web pública
- 👥 **Gestionar usuarios y permisos** del equipo
- 📈 **Generar reportes y exportarlos** a Excel/PDF
- 🔧 **Configurar el sistema** (categorías, marcas, formas de pago, etc.)

---

### 🔐 Cómo acceder al panel

Hay dos formas de entrar:

**Opción 1 – Desde la web pública:**

1. Ingresá a **https://laspastasdeorlando.vercel.app**
2. Hacé scroll hasta el final de la página (el **footer**)
3. Hacé clic en el **ícono de corazón ❤️** que está en el footer
4. Se abre la pantalla de inicio de sesión

**Opción 2 – Acceso directo:**

1. Ingresá a **https://laspastasdeorlando.vercel.app/admin/login**

> **💡 Tip:** Guardá el link directo en favoritos para entrar más rápido cada mañana.

---

### 📧 Credenciales por defecto

Cuando entrés por primera vez, usá estas credenciales:

| Campo          | Valor                    |
|----------------|--------------------------|
| **Email**      | orlando.candia@gmail.com |
| **Contraseña** | Pastas2026!              |

> **⚠️ MUY IMPORTANTE:** Cambiá la contraseña por defecto **lo antes posible**. Una contraseña débil o conocida pone en riesgo todo tu negocio. Véase la sección [7. Gestión de usuarios y roles](#7-gestión-de-usuarios-y-roles) para saber cómo cambiarla y activar 2FA.

---

### 🧭 Estructura general del panel

Una vez dentro, vas a ver una pantalla dividida en dos partes:

```
┌─────────────────┬───────────────────────────────────────────┐
│                 │                                           │
│   MENÚ LATERAL  │            ÁREA DE CONTENIDO              │
│   (colapsable)  │         (cambia según la opción)          │
│                 │                                           │
│   📊 Dashboard  │                                           │
│   📦 Productos  │                                           │
│   🏭 Producción │                                           │
│   💰 Ventas     │                                           │
│   👥 Usuarios   │                                           │
│   📈 Reportes   │                                           │
│   🔧 Config.    │                                           │
│                 │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

**Menú lateral (izquierda):**

- Es **colapsable**: podés contraerlo para ganar espacio en pantallas chicas o celulares
- Está agrupado por áreas temáticas (Productos, Producción, Ventas, etc.)
- Las opciones con ▸ tienen submenús desplegables
- En la parte inferior está tu perfil y el botón de cerrar sesión

**Área de contenido (derecha):**

- Muestra la página correspondiente a la opción del menú seleccionada
- Tiene una barra superior con breadcrumbs, búsqueda y notificaciones
- Cada módulo tiene su propia estructura (tablas, formularios, filtros)

> **💡 Tip:** Si estás en un celular o tablet, el menú lateral se oculta automáticamente. Tocá el ícono de ☰ (hamburguesa) arriba a la izquierda para abrirlo.

---

## 2. El Dashboard: jerarquía visual, flujo de trabajo y acciones directas

El **dashboard** es la pantalla principal del panel. Es lo primero que ves al entrar y funciona como el **centro de control** del negocio. Desde acá podés ver el estado general y **actuar directamente** sobre los problemas, sin tener que navegar por todo el sistema.

---

### 🚦 Jerarquía visual de 3 niveles (3-tier)

El dashboard usa un **sistema de colores** para que identifiques rápidamente la urgencia de cada alerta o indicador. Hay 3 niveles:

| Nivel          | Color                    | Emoji | Significado                              |
|----------------|--------------------------|-------|------------------------------------------|
| 🔴 **Crítico** | Rojo                     | 🔴    | Requiere **acción inmediata**            |
| 🟡 **Importante** | Mostaza / amarillo    | 🟡    | Requiere **atención pronta**             |
| 🔵 **Informativo** | Sky / celeste         | 🔵    | **Información útil**, sin urgencia       |

**Cómo interpretar los colores:**

- 🔴 **Rojo (Crítico):** Algo se rompió o se va a romper ya. Stock agotado, productos sin stock para vender, pedidos que no se pueden cumplir. **Actuá ahora.**
- 🟡 **Amarillo/Mostaza (Importante):** Algo está por convertirse en problema. Stock bajo, recetas faltantes, producción pendiente. **Planificá resolverlo hoy o mañana.**
- 🔵 **Celeste (Informativo):** Datos útiles para tu día. Pedidos pendientes de procesar, reservas activas. **Revisalo cuando puedas.**

> **💡 Cómo se ordena:** Las alertas siempre aparecen **ordenadas por severidad** (críticas primero) y, dentro de cada severidad, por **etapa del flujo de trabajo** (ver abajo).

---

### 🔄 Flujo de trabajo: 5 etapas

El sistema organiza la operación en **5 etapas secuenciales**, que reflejan cómo funciona el negocio de pastas:

```
   1️⃣                2️⃣                3️⃣              4️⃣             5️⃣
Materias Primas → Recetas → Producción → Stock → Ventas
   (MP)                      (PT)        (PT)    (Pedidos/Reservas)
```

| #  | Etapa            | Qué involucra                                            |
|----|------------------|----------------------------------------------------------|
| 1️⃣ | Materias Primas  | Harina, huevos, queso, insumos (envoltorios, etiquetas) |
| 2️⃣ | Recetas          | Definir cómo se hace cada producto (qué y cuánto lleva)  |
| 3️⃣ | Producción       | Fabricar los productos terminados (PT)                   |
| 4️⃣ | Stock            | Controlar cuántos PT hay disponibles para vender         |
| 5️⃣ | Ventas           | Pedidos, reservas y ventas del día                       |

**Por qué importa este orden:**

- Las alertas del dashboard se ordenan según esta secuencia
- Si hay un problema en etapa 1 (MP agotada), afecta a todo lo demás → por eso aparece primero
- El flujo de trabajo visual (ver abajo) muestra el estado de cada etapa

---

### ⚠️ Sección "Pasos Pendientes"

Es la **parte más importante del dashboard**. Acá se listan todas las alertas activas, cada una con:

- El **emoji y color** de severidad (🔴/🟡/🔵)
- El **título** descriptivo de la alerta
- Un **botón de acción directa** que te lleva a la vista correspondiente **ya filtrada** para resolverla

> **🔑 Clave:** Cada botón te lleva a una URL con un filtro específico. No tenés que perder tiempo buscando — el sistema ya te posiciona en el lugar exacto.

**Lista completa de las 11 alertas:**

#### 🔴 Alertas críticas (rojo)

| # | Alerta                | Botón te lleva a                                              | Cuándo aparece                                       |
|---|-----------------------|---------------------------------------------------------------|------------------------------------------------------|
| 1 | MP agotadas           | `/admin/compras?materias-primas=agotadas`                     | Cuando alguna materia prima tiene stock = 0          |
| 2 | Insumos agotados      | `/admin/compras?insumos=agotados`                             | Cuando algún insumo (envoltorios, etiquetas) está en 0 |
| 3 | PT sin stock          | `/admin/produccion?productos-sin-stock`                       | Cuando un producto terminado para vender está en 0   |

#### 🟡 Alertas importantes (mostaza/amarillo)

| #  | Alerta                | Botón te lleva a                                              | Cuándo aparece                                       |
|----|-----------------------|---------------------------------------------------------------|------------------------------------------------------|
| 4  | MP stock bajo         | `/admin/materias-primas?stock=bajo`                           | Cuando una MP está por debajo del mínimo             |
| 5  | Insumos stock bajo   | `/admin/insumos?stock=bajo`                                   | Cuando un insumo está por debajo del mínimo          |
| 6  | PT sin receta        | `/admin/recetas?filtro=sin-receta`                            | Cuando un PT no tiene receta definida                 |
| 7  | Recetas vacías       | `/admin/recetas?filtro=vacia`                                 | Cuando una receta existe pero no tiene ingredientes  |
| 8  | Producción pendiente | `/admin/produccion?estado=pendiente`                          | Cuando hay lotes de producción en estado "pendiente" |
| 9  | PT stock bajo        | `/admin/productos-terminados?stock=bajo`                      | Cuando un PT está por debajo del mínimo de venta     |

#### 🔵 Alertas informativas (celeste)

| #  | Alerta                | Botón te lleva a                                              | Cuándo aparece                                       |
|----|-----------------------|---------------------------------------------------------------|------------------------------------------------------|
| 10 | Pedidos pendientes   | `/admin/pedidos-clientes?estado=pendiente`                    | Cuando hay pedidos de clientes sin procesar          |
| 11 | Reservas activas     | `/admin/reservas-clientes?estado=activa`                      | Cuando hay reservas con seña activas                 |

> **💡 Consejo de uso:** Empezá siempre el día revisando las alertas **de arriba hacia abajo**. Las de arriba son las más urgentes. Si no hay rojas, podés avanzar con las amarillas con más calma.

---

### 📊 Indicadores Clave (KPIs)

Debajo de las alertas, el dashboard muestra **6 indicadores principales** con su tendencia (comparado con el período anterior):

| Indicador              | Qué muestra                                     | Tendencia                     |
|------------------------|-------------------------------------------------|-------------------------------|
| 💵 **Ventas**          | Total facturado en el período                   | ↑ o ↓ con % de variación      |
| 🏭 **Producción**      | Cantidad de lotes producidos                    | ↑ o ↓ con % de variación      |
| 📋 **Pedidos Pendientes** | Cuántos pedidos están sin completar           | ↑ o ↓ con número absoluto     |
| 📅 **Reservas Activas** | Reservas con seña confirmadas                   | ↑ o ↓ con número absoluto     |
| 🛒 **Compras**         | Total comprado a proveedores                    | ↑ o ↓ con % de variación      |
| 🚨 **Stock Crítico**   | Cantidad de productos/MP en estado crítico      | ↑ o ↓ con número absoluto     |

> **💡 Cómo leerlo:** Una flecha verde ↑ no siempre es buena (ej: si suben los pedidos pendientes, quizás estás demorando entregas). Una flecha roja ↓ no siempre es mala (ej: si baja el stock crítico, mejoraste el reabastecimiento). **Pensá el contexto.**

---

### ⚡ Acciones Directas

El dashboard tiene **8 botones de acceso rápido** a las tareas más frecuentes. Están pensados para que no tengas que navegar por el menú:

1. ➕ **Nuevo Producto** → `/admin/productos-terminados/nuevo`
2. 📝 **Nueva Receta** → `/admin/recetas/nueva`
3. 🏭 **Nueva Producción** → `/admin/produccion/nueva`
4. 💰 **Nueva Venta** → `/admin/ventas/nueva`
5. 🧾 **Nuevo Presupuesto** → `/admin/presupuestos/nuevo`
6. 📦 **Nuevo Pedido** → `/admin/pedidos-clientes/nuevo`
7. 📅 **Nueva Reserva** → `/admin/reservas-clientes/nueva`
8. 🛒 **Nueva Compra** → `/admin/compras/nueva`

---

### 🔄 Flujo de Trabajo visual (pipeline)

En la parte inferior del dashboard hay un **pipeline visual** con las 5 etapas del flujo de trabajo. Cada etapa muestra un **estado**:

- ✅ **OK (verde):** Todo en orden, no hay alertas en esta etapa
- ⚠️ **Atención (amarillo):** Hay alertas importantes (amarillas) pendientes
- 🔴 **Crítico (rojo):** Hay alertas críticas (rojas) pendientes

**Etapas mostradas:**

```
[1️⃣ Materias Primas]  →  [2️⃣ Recetas]  →  [3️⃣ Producción]  →  [4️⃣ Stock]  →  [5️⃣ Ventas]
       ✅ / ⚠️ / 🔴         ✅ / ⚠️ / 🔴        ✅ / ⚠️ / 🔴        ✅ / ⚠️ / 🔴     ✅ / ⚠️ / 🔴
```

**Importante:** Cada etapa es **clickeable**. Si hacés clic en una etapa, te lleva a la sección correspondiente con los filtros aplicados según el estado:

- Si está 🔴, te lleva filtrando solo los items críticos
- Si está ⚠️, te lleva filtrando solo los items con problemas
- Si está ✅, te lleva a la vista general de esa etapa

> **💡 Tip de productividad:** Usá el pipeline para diagnosticar dónde está el cuello de botella. Si las etapas 1 y 2 están en rojo pero la 3 está en verde, significa que tenés MP/recetas para producir pero igual no estás produciendo — el problema está en gestión de producción.

---

## 3. Gestión de productos

El módulo de productos te permite administrar TODO lo que el negocio vende o usa. Hay varios tipos:

- **Productos Terminados (PT):** los sorrentinos, ravioles, fideos, etc. que vendés al cliente
- **Productos Catálogo:** los que se muestran en la web pública (con fotos, descripciones, precios)
- **Materias Primas (MP):** harina, huevos, queso, etc. — insumos para producir
- **Insumos:** envoltorios, etiquetas, bolsas — consumibles no comestibles

---

### 🍝 Productos Terminados (PT)

#### Crear un nuevo producto terminado

1. Andá a **Productos → Productos Terminados** en el menú lateral
2. Hacé clic en el botón **➕ Nuevo Producto** (arriba a la derecha)
3. Completá el formulario:
   - **Nombre:** ej. "Sorrentinos de Queso"
   - **Categoría:** seleccioná del desplegable (ej. "Pasta Rellena")
   - **Marca:** opcional, si querés diferenciar líneas
   - **Unidad de medida:** unidad, kilo, paquete, etc.
   - **Stock mínimo:** el nivel que dispara la alerta 🟡
   - **Precio de venta:** precio al público
   - **Código de barras:** opcional (ver sección "Código de barras" abajo)
4. Hacé clic en **Guardar**

> **💡 Tip:** El stock mínimo es CLAVE para que el dashboard te avise con tiempo. Si vendés 20 sorrentinos por semana y tardás 3 días en producir, poné el mínimo en 10.

#### Editar un producto

1. Andá a **Productos → Productos Terminados**
2. Buscá el producto en la lista (usá el buscador superior si hace falta)
3. Hacé clic en el ícono de ✏️ (lápiz) a la derecha
4. Modificá lo que necesites
5. Hacé clic en **Guardar cambios**

#### Cargar / ajustar stock

El stock de PT se actualiza **automáticamente** cuando:

- ✅ Completás una **producción** (suma stock)
- 🔻 Registrás una **venta** o entregás un **pedido** (resta stock)
- 📤 Hacés un **ajuste manual** (por pérdida, merma, regalo, etc.)

**Para hacer un ajuste manual:**

1. Andá a **Productos → Productos Terminados**
2. Buscá el producto y hacé clic en el ícono 📦 (stock)
3. Elegí el tipo de ajuste:
   - **➕ Entrada:** sumar stock (producción no registrada, devolución)
   - **➖ Salida:** restar stock (merma, rotura, degustación)
4. Indicá la **cantidad** y una **nota** explicativa (obligatoria)
5. Confirmá con **Guardar**

> **⚠️ Importante:** Siempre dejá una nota en los ajustes manuales. Sirve para la trazabilidad y para los reportes de auditoría.

#### Cargar imágenes

1. Andá a **Productos → Productos Terminados**
2. Abrí el producto a editar
3. En la sección **Imagen**, hacé clic en **Subir imagen** o arrastrá una foto
4. Esperá a que se cargue (verás una miniatura)
5. Podés subir varias imágenes y elegir cuál es la **principal** (la que se ve primero)
6. Guardá los cambios

**Recomendaciones para las fotos:**

- 📐 **Tamaño:** mínimo 800x800 px, ideal 1200x1200 px
- 📸 **Formato:** JPG o PNG (preferí JPG para fotos, PNG para logos)
- 🎨 **Fondo:** preferí fondo blanco o neutro para destacar el producto
- 🍝 **Estilo:** foto cenital (desde arriba) o 45°, bien iluminada, sin sombras duras

> **💡 Tip:** Si el producto es del catálogo público, una buena foto **aumenta las ventas**. Invertí tiempo en sacar fotos prolijas.

---

### 🛒 Productos Catálogo (web pública)

Los **Productos Catálogo** son los que se muestran en la web pública `laspastasdeorlando.vercel.app`. Suelen estar vinculados a un Producto Terminado, pero tienen información "de mostrador": foto, descripción larga, precio destacado, promociones.

#### Crear producto de catálogo

1. Andá a **Productos → Catálogo Público**
2. Hacé clic en **➕ Nuevo Producto Catálogo**
3. Vinculá un Producto Terminado (buscador)
4. Completá los campos de catálogo:
   - **Título comercial** (puede ser más vendedor que el nombre interno)
   - **Descripción larga** (lo que ven los clientes en la web)
   - **Imagen destacada** (la principal)
   - **Galería** (hasta 6 fotos adicionales)
   - **Etiquetas** (ej. "Sin TACC", "Vegetariano", "Nuevo")
5. Elegí si está **visible** en la web (interruptor)
6. Guardá

> **💡 Tip:** Si desactivás "visible", el producto desaparece de la web pero sigue en el sistema. Útil para productos de temporada.

---

### 🏷️ Categorías y marcas

#### Categorías

Las categorías agrupan productos (ej. "Pasta Rellena", "Pasta Seca", "Salsas"). Para gestionarlas:

1. Andá a **Configuración → Categorías**
2. Para crear: **➕ Nueva Categoría** → nombre → guardar
3. Para editar: clic en ✏️
4. Para eliminar: clic en 🗑️ (solo si no tiene productos asociados)

#### Marcas

Las marcas diferencian líneas dentro del negocio (ej. "Línea Premium", "Línea Clásica"). Se gestionan igual que las categorías desde **Configuración → Marcas**.

> **⚠️ Importante:** No podés eliminar una categoría o marca que tenga productos asociados. Primero reasigná los productos o desactivá la categoría.

---

### 🔢 Código de barras

Cada producto puede tener un **código de barras** (SKU/EAN). Sirve para:

- Identificar productos al vender o contar stock
- Imprimir etiquetas térmicas (ver sección 10)
- Escanear con lector en el punto de venta

**Para asignar código de barras:**

1. Editá el producto
2. En el campo **Código de barras**, escribí el código (ej. EAN-13 de 13 dígitos)
3. O hacé clic en **🔄 Generar automáticamente** para que el sistema cree uno único
4. Guardá

> **💡 Tip:** Si comprás códigos oficiales (GS1), usalos. Si no, el sistema puede generar códigos internos que funcionan perfecto para uso interno.

---

## 4. Gestión de recetas y producción

La **receta** es la definición de cómo se hace un producto: qué materias primas y insumos lleva, y en qué cantidad. La **producción** es el acto de fabricar un lote de productos siguiendo una receta.

---

### 📝 Crear una receta

1. Andá a **Producción → Recetas** en el menú lateral
2. Hacé clic en **➕ Nueva Receta**
3. Seleccioná el **producto terminado** al que pertenece
4. Agregá los **ingredientes** (MP e insumos):
   - Buscá cada MP/insumo
   - Indicá la cantidad necesaria por **1 unidad de PT** (o por lote, según configures)
   - Agregá todos los ingredientes que lleva
5. Opcional: agregá **notas de preparación** (pasos, tiempos, temperatura)
6. Guardá

**Ejemplo de receta:**

| Producto: Sorrentinos de Queso (1 kg) |              |
|---------------------------------------|--------------|
| Ingrediente                           | Cantidad     |
| Harina 000                            | 500 g        |
| Huevos                                | 4 unidades   |
| Queso Ricota                          | 300 g        |
| Queso Parmesano                       | 100 g        |
| Especias                              | 5 g          |
| Insumo: Caja x12                      | 1 unidad     |

> **💡 Importante:** Sin receta, no podés registrar producción. Por eso el dashboard te avisa con 🟡 "PT sin receta" cuando un producto no la tiene.

---

### 🟢 Recetas activas vs inactivas

Cada receta puede estar **activa** o **inactiva**:

- **✅ Activa:** se puede usar para producir. Aparece en el selector de recetas al iniciar una producción.
- **⏸️ Inactiva:** no se puede usar. Útil para recetas antiguas, de temporada, o en revisión.

**Para cambiar el estado:**

1. Andá a **Producción → Recetas**
2. Buscá la receta y hacé clic en el interruptor **Activo**
3. Confirmá

> **💡 Tip:** Cuando cambias una receta, mejor desactivá la anterior y creá una nueva activa. Así conservás el histórico de cómo se hacía antes.

---

### 🏭 Producción: iniciar, completar, cancelar

#### Iniciar una producción

1. Andá a **Producción → Lotes de Producción**
2. Hacé clic en **➕ Nueva Producción**
3. Seleccioná la **receta** (solo aparecen activas)
4. Indicá la **cantidad a producir** (en unidades del PT)
5. El sistema calcula automáticamente **qué MP e insumos se van a consumir** y verifica que haya stock suficiente
6. Si falta stock, te avisa y te ofrece:
   - **Cancelar** y resolver la falta primero
   - **Forzar** (solo admins) y registrar el faltante como pendiente
7. Asigná un **responsable** (quién hace la producción)
8. Confirmá con **Iniciar Producción**

La producción queda en estado **🔴 Pendiente**.

#### Completar una producción

1. Andá a **Producción → Lotes de Producción**
2. Filtrá por estado **Pendiente** (o usá la alerta del dashboard 🟡 "Producción pendiente")
3. Abrí el lote
4. Verificá las cantidades reales producidas (pueden diferir por merma)
5. Hacé clic en **✅ Completar**
6. Confirmá

> **🔑 Qué pasa al completar:**
> - El stock de **MP e insumos** se **descuenta** automáticamente
> - El stock de **PT** se **suma** automáticamente
> - Se registra en el historial de movimientos
> - El lote pasa a estado **✅ Completado**

#### Cancelar una producción

1. Abrí el lote pendiente
2. Hacé clic en **❌ Cancelar**
3. Escribí el motivo de cancelación (obligatorio)
4. Confirmá

> **⚠️ Importante:** Solo se pueden cancelar producciones **pendientes**. Una producción completada no se puede cancelar (solo ajustar stock manualmente con nota explicativa).

---

### 🔄 Cómo se actualiza el stock automáticamente

El sistema maneja el stock de forma **automática** en cada operación. Acá tenés el resumen:

| Operación                | MP / Insumos         | PT (producto terminado) |
|--------------------------|----------------------|--------------------------|
| ➕ Completar producción  | ⬇️ Descuenta         | ⬆️ Suma                  |
| ➖ Registrar venta       | (sin cambio)         | ⬇️ Descuenta             |
| 📦 Entregar pedido       | (sin cambio)         | ⬇️ Descuenta             |
| 🛒 Registrar compra MP   | ⬆️ Suma              | (sin cambio)             |
| 🔧 Ajuste manual         | según tipo           | según tipo               |

> **💡 Consejo:** Confiá en el stock del sistema. Siempre que hagas una operación (producción, venta, compra), registrá en el sistema **en el momento**. Así los números siempre cierran y las alertas son confiables.

---

## 5. Gestión de ventas, presupuestos y pedidos

Este módulo cubre todo el ciclo comercial: desde que un cliente pide un presupuesto hasta que recibe el producto.

---

### 💵 Ventas

#### Registrar una venta

1. Andá a **Ventas → Ventas** en el menú lateral
2. Hacé clic en **➕ Nueva Venta**
3. Seleccioná el **cliente** (o creá uno nuevo al vuelo)
4. Agregá los **productos**:
   - Buscá el PT por nombre o código de barras
   - Indicá la cantidad
   - El sistema verifica stock disponible
5. Aplicá **descuentos** si corresponde (por promoción o por volumen — ver sección 6)
6. Elegí la **forma de pago** (ver abajo)
7. Confirmá con **Registrar Venta**

> **🔑 Qué pasa al registrar:**
> - Se descuenta el stock de PT automáticamente
> - Se genera un comprobante (puedes imprimir ticket o factura)
> - Se actualizan los KPIs del dashboard (💰 Ventas)

#### Formas de pago

Las formas de pago se configuran en **Configuración → Formas de Pago** (ver sección 10). Las típicas:

- 💵 **Efectivo**
- 💳 **Tarjeta de débito**
- 💳 **Tarjeta de crédito** (con opción de cuotas)
- 📱 **Transferencia bancaria**
- 📱 **Mercado Pago / QR**
- 🧾 **Cuenta corriente** (para clientes mayoristas)

> **💡 Tip:** Si activás "Cuenta corriente", el saldo queda registrado en la cuenta del cliente y podés cobrarlo después.

---

### 📝 Presupuestos

Los **presupuestos** son cotizaciones que le armás a un cliente antes de confirmar la venta. Sirven para clientes mayoristas o pedidos grandes.

#### Crear un presupuesto

1. Andá a **Ventas → Presupuestos**
2. Hacé clic en **➕ Nuevo Presupuesto**
3. Seleccioná el cliente
4. Agregá los productos y cantidades
5. Aplicá descuentos si corresponde
6. Indicá la **validez** del presupuesto (ej. 15 días)
7. Guardá

#### Enviar el presupuesto

1. Abrí el presupuesto
2. Hacé clic en **📧 Enviar por Email**
3. El sistema genera un PDF y lo envía al email del cliente
4. Podés agregar un mensaje personalizado

#### Convertir presupuesto en pedido

1. Abrí el presupuesto
2. Hacé clic en **🔄 Convertir en Pedido**
3. Confirmá los datos (puede ajustar cantidades si el cliente modificó algo)
4. El sistema crea un **Pedido de Cliente** con los datos del presupuesto
5. El presupuesto queda marcado como **✅ Convertido**

> **💡 Tip:** Si el cliente no confirma, el presupuesto vence automáticamente pasado el plazo. Queda en estado "Vencido" pero podés reactivarlo.

---

### 📦 Pedidos de clientes

Los **pedidos** son solicitudes concretas de productos que el cliente quiere recibir. Pueden venir de:

- Una venta directa (en el local)
- Un presupuesto convertido
- La web pública (los clientes pueden hacer pedidos online)
- Una reserva con seña

#### Estados de un pedido

El flujo de estados es:

```
📋 Pendiente → 🔄 En Proceso → ✅ Listo → 📦 Entregado
```

| Estado          | Qué significa                                    | Acción siguiente                  |
|-----------------|--------------------------------------------------|------------------------------------|
| 📋 **Pendiente** | Recibido, sin empezar a preparar                | Confirmar stock y pasar a proceso |
| 🔄 **En Proceso** | Preparando el pedido                            | Terminar preparación → marcar listo |
| ✅ **Listo**    | Listo para entregar / esperar retiro del cliente | Coordinar entrega o espera retiro  |
| 📦 **Entregado** | El cliente ya recibió el pedido                 | Cerrá el pedido                    |

**Para cambiar de estado:**

1. Andá a **Ventas → Pedidos de Clientes**
2. Abrí el pedido
3. Hacé clic en el botón del siguiente estado (ej. "Pasar a En Proceso")
4. Confirmá

> **💡 Tip del dashboard:** La alerta 🔵 "Pedidos pendientes" te lleva directo a los pedidos en estado Pendiente. Revisalos al empezar el día.

---

### 📅 Reservas con seña

Las **reservas** son pedidos para una fecha futura, donde el cliente deja una **seña** (pago anticipado parcial). Típicas para:

- Fiestas y eventos
- Pedidos grandes para fechas específicas
- Productos de temporada (ej. pan dulce)

#### Crear una reserva

1. Andá a **Ventas → Reservas**
2. Hacé clic en **➕ Nueva Reserva**
3. Seleccioná el cliente
4. Agregá los productos y cantidades
5. Indicá la **fecha de retiro/entrega**
6. Indicá el **monto de la seña** y la **forma de pago**
7. Guardá

La reserva queda en estado **🔵 Activa**.

#### Gestionar la reserva

- ✅ **Confirmar entrega:** cuando el cliente retira, marcá como entregada. El sistema genera la venta final con el saldo pendiente.
- ❌ **Cancelar:** si el cliente cancela, indicá si se devuelve la seña o no (según política).

> **💡 Tip del dashboard:** La alerta 🔵 "Reservas activas" te lleva directo a las reservas activas. Mirá las fechas de retiro para planificar la producción.

---

## 6. Gestión de promociones y descuentos por volumen

El sistema tiene **dos mecanismos** de descuento que sirven para cosas distintas. Es importante entender la diferencia para no mezclarlas.

---

### 🎯 Diferencia clave: promociones vs descuentos por volumen

| Característica       | 🏷️ Promociones              | 📊 Descuentos por volumen       |
|----------------------|------------------------------|----------------------------------|
| **Visibilidad**      | Públicas (web, clientes)     | Internas (solo admin)            |
| **Audiencia**        | Todos los clientes           | Mayoristas / clientes específicos |
| **Tipo**             | Marketing, ofertas           | Comercial, precio escalonado     |
| **Se ve en web**     | ✅ Sí                         | ❌ No                             |
| **Ejemplo**          | "2x1 en sorrentinos"         | "10% off comprando +5 kg"        |

> **💡 Regla práctica:** Si querés que el cliente lo vea en la web → **promoción**. Si es un acuerdo interno con mayoristas → **descuento por volumen**.

---

### 🏷️ Promociones (públicas)

#### Tipos de promoción

Hay **4 tipos** disponibles:

1. **📈 Porcentual:** descuento en % (ej. "20% OFF en sorrentinos")
2. **💰 Fijo:** monto fijo de descuento (ej. "$500 off en compras +$5000")
3. **🎁 2x1 (NxN):** llevás N, pagás menos (ej. "2x1", "3x2", "4x3")
4. **⏰ Tiempo limitado:** oferta con fecha de inicio y fin (ej. "Solo este fin de semana")

#### Crear una promoción

1. Andá a **Ventas → Promociones**
2. Hacé clic en **➕ Nueva Promoción**
3. Elegí el **tipo** (porcentual, fijo, 2x1, tiempo limitado)
4. Completá los campos según el tipo:
   - **Porcentual:** % de descuento
   - **Fijo:** monto fijo y monto mínimo de compra
   - **2x1:** cantidad que llevás / cantidad que pagás
   - **Tiempo limitado:** fechas de inicio y fin + tipo de descuento
5. Seleccioná a qué **productos** aplica (todos, una categoría, productos específicos)
6. Indicá si tiene **límite de uso** (ej. "100 veces" o "1 por cliente")
7. Activala con el interruptor **Activa**
8. Guardá

#### Cómo se ven en la landing

Las promociones activas aparecen automáticamente en la web pública:

- 🏠 **Banner principal:** las promociones de "tiempo limitado" se destacan arriba
- 🏷️ **Badge en producto:** los productos con descuento muestran una etiqueta (ej. "20% OFF")
- 🛒 **Carrito:** el descuento se aplica automáticamente al agregar productos
- 📣 **Sección "Ofertas":** todas las promos activas se listan en una sección dedicada

> **⚠️ Importante:** Si desactivás una promoción, desaparece automáticamente de la web. No hace falta borrarla.

---

### 📊 Descuentos por volumen (internos / mayoristas)

Los **descuentos por volumen** aplican automáticamente cuando un cliente compra más cantidad. No se ven en la web, se aplican al armar un presupuesto o venta.

#### Cómo funcionan

Se configuran por **rangos escalonados**. Ejemplo para "Sorrentinos de Queso":

| Cantidad         | Descuento |
|------------------|-----------|
| 1–4 kg           | 0%        |
| 5–9 kg           | 5%        |
| 10–24 kg         | 10%       |
| 25+ kg           | 15%       |

Cuando armás un presupuesto o venta con 12 kg, el sistema aplica automáticamente el 10% de descuento.

#### Configurar descuentos por volumen

1. Andá a **Productos → Productos Terminados**
2. Abrí el producto a configurar
3. Andá a la pestaña **Descuentos por Volumen**
4. Hacé clic en **➕ Agregar rango**
5. Indicá:
   - **Cantidad mínima** (ej. 5)
   - **Cantidad máxima** (ej. 9) o "sin límite"
   - **% de descuento** (ej. 5)
6. Agregá todos los rangos que necesites
7. Guardá

> **💡 Tip:** Estos descuentos son ideales para restaurantes y revendedores. Configuralos en los productos que más venden al por mayor.

---

## 7. Gestión de usuarios y roles

El sistema permite crear **usuarios** para tu equipo y asignarles **roles** con distintos permisos. Así cada persona ve y hace solo lo que le corresponde.

---

### 👥 Crear un usuario

1. Andá a **Usuarios → Usuarios** en el menú lateral
2. Hacé clic en **➕ Nuevo Usuario**
3. Completá los datos:
   - **Nombre y apellido**
   - **Email** (será su usuario para entrar)
   - **Contraseña temporal** (el sistema le pedirá cambiarla al primer login)
   - **Rol** (ver abajo)
4. Opcional: marcá **"Enviar invitación por email"** para que reciba un mail con instrucciones
5. Guardá

> **💡 Consejo:** Cuando des de alta a alguien nuevo, usá una contraseña temporal segura y pedile que la cambie ese mismo día.

---

### 🎭 Roles y permisos

Un **rol** es un conjunto de permisos. El sistema viene con roles predefinidos:

| Rol              | Qué puede hacer                                            |
|------------------|------------------------------------------------------------|
| 👑 **Administrador** | TODO: ver, crear, editar, eliminar, configurar          |
| 📦 **Gerente**    | Gestión operativa (productos, stock, ventas), sin configuración del sistema |
| 🏭 **Producción** | Ver y gestionar recetas, producción, stock de MP          |
| 💰 **Vendedor**   | Registrar ventas, pedidos, presupuestos. No ve costos     |
| 👁️ **Consultor**  | Solo lectura: ve todo pero no puede modificar              |

**Para asignar o cambiar un rol:**

1. Andá a **Usuarios → Usuarios**
2. Editá el usuario
3. En el campo **Rol**, elegí el correspondiente
4. Guardá

**Permisos personalizados (avanzado):**

Si necesitás un rol a medida (ej. "Vendedor que también puede ver costos"):

1. Andá a **Usuarios → Roles**
2. Hacé clic en **➕ Nuevo Rol**
3. Nombrá el rol
4. Tildá/destildá cada permiso por módulo
5. Guardá y asigná a los usuarios que corresponda

> **⚠️ Importante:** El rol **Administrador** no se puede modificar ni eliminar. Es el rol de Orlando (o quien tenga acceso total).

---

### 🔐 Autenticación de doble factor (2FA)

El **2FA** agrega una capa extra de seguridad: además de la contraseña, pedís un código de un solo uso que llega por app (Google Authenticator, Authy) o SMS.

#### Activar 2FA en tu cuenta

1. Andá a tu **Perfil** (arriba a la derecha, en tu avatar)
2. Hacé clic en **Seguridad**
3. En la sección **2FA**, hacé clic en **Activar**
4. Escaneá el **código QR** con tu app de autenticación
5. Ingresá el código de 6 dígitos que te genera la app
6. **Guardá los códigos de recuperación** en un lugar seguro (te sirven si perdés el celular)
7. Confirmá

> **⚠️ MUY RECOMENDADO:** Activá 2FA **sí o sí** en la cuenta de Administrador. Es la cuenta más sensible del sistema.

#### Exigir 2FA a todo el equipo

Como administrador, podés obligar a que todos los usuarios tengan 2FA activo:

1. Andá a **Configuración → Seguridad**
2. Activá la opción **"Exigir 2FA a todos los usuarios"**
3. Guardá

A partir de ese momento, los usuarios que no tengan 2FA van a ser forzados a configurarlo en su próximo login.

---

### 🔑 Cambiar tu contraseña

1. Andá a tu **Perfil**
2. Hacé clic en **Seguridad**
3. En **Cambiar contraseña**:
   - Escribí tu contraseña actual
   - Escribí la nueva (mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo)
   - Repetí la nueva
4. Guardá

> **💡 Buenas prácticas:**
> - Cambiá la contraseña cada 90 días
> - No uses la misma que en otros sitios
> - Usá un gestor de contraseñas (Bitwarden, 1Password, KeePass)
> - Nunca compartas tu contraseña por mensajería o email

---

## 8. Reportes y auditoría

El módulo de **Reportes** te permite analizar la información del sistema. Podés generar reportes predefinidos o personalizados, y exportarlos para compartir o archivar.

---

### 📈 Tipos de reportes

El sistema ofrece **5 tipos principales** de reportes:

#### 💵 Reporte de Ventas

- Total facturado por período
- Ventas por producto
- Ventas por cliente
- Ventas por vendedor
- Formas de pago utilizadas

#### 📦 Reporte de Stock

- Stock actual de MP, insumos y PT
- Movimientos de stock (entradas/salidas) por período
- Productos con stock bajo / crítico
- Valorización del inventario

#### 🏭 Reporte de Producción

- Lotes producidos por período
- Producción por producto
- Producción por responsable
- Mermas y diferencias

#### 💼 Reporte de Finanzas

- Ingresos por ventas
- Egresos por compras
- Margen bruto
- Cuentas corrientes de clientes
- Flujo de caja

#### 🛒 Reporte de Compras

- Compras a proveedores por período
- Compras por MP/insumo
- Compras por proveedor
- Comparativo de precios

---

### 🎛️ Filtros personalizados

Cada reporte permite filtrar por múltiples criterios:

| Filtro         | Qué hace                                          |
|----------------|---------------------------------------------------|
| 📅 **Período** | Rango de fechas (desde / hasta)                   |
| 📦 **Producto** | Un producto específico o una categoría            |
| 👤 **Cliente** | Un cliente específico o todos                     |
| 🧑‍💼 **Vendedor** | Un vendedor específico o todos                   |
| 🏷️ **Categoría** | Filtra por categoría de producto                  |
| 💳 **Forma de pago** | Filtra ventas por forma de pago               |

**Cómo usar filtros:**

1. Andá a **Reportes** y elegí el tipo de reporte
2. En el panel superior, configurá los filtros que necesites
3. Hacé clic en **Generar reporte**
4. El resultado aparece en pantalla (tabla + gráficos)
5. Para exportar, usá los botones de arriba a la derecha

---

### 📤 Exportación

Podés exportar cualquier reporte en **3 formatos**:

| Formato | Cuándo usarlo                                        |
|---------|------------------------------------------------------|
| 📊 **Excel (.xlsx)** | Cuando querés seguir trabajando los datos (ordenar, sumar, etc.) |
| 📄 **PDF**           | Cuando necesitás un documento para imprimir o compartir |
| 📝 **CSV**           | Para importar a otros sistemas o para análisis avanzado |

**Para exportar:**

1. Generá el reporte con los filtros deseados
2. Hacé clic en el botón del formato (📊 Excel / 📄 PDF / 📝 CSV)
3. El archivo se descarga a tu computadora
4. Abrilo o compartilo según necesites

> **💡 Tip:** El Excel es el más flexible. Si no estás seguro, exportá en Excel y desde ahí podés armar lo que necesites.

---

### 🔍 Auditoría

El sistema registra **todas las acciones importantes** que hacen los usuarios. Esto se llama **log de auditoría** y sirve para:

- Saber quién hizo qué y cuándo
- Detectar errores o uso indebido
- Cumplir con requisitos de trazabilidad

#### Qué se registra

- 🔑 **Inicios de sesión** (login exitoso o fallido)
- ✏️ **Creaciones, ediciones y eliminaciones** de registros
- 🔧 **Cambios de configuración** del sistema
- 💰 **Operaciones críticas:** ventas, ajustes de stock, producciones
- 🔐 **Cambios de contraseña y activación/desactivación de 2FA**

#### Cómo ver los logs

1. Andá a **Reportes → Auditoría** (o **Configuración → Logs**)
2. Filtrá por:
   - **Usuario** (quién)
   - **Acción** (qué hizo)
   - **Fecha** (cuándo)
   - **Módulo** (dónde)
3. Hacé clic en una entrada para ver el detalle (valores antes/después)

> **💡 Consejo:** Revisá los logs de login fallidos de vez en cuando. Si ves muchos intentos fallidos de un email desconocido, puede ser un ataque — cambialo a un usuario inactivo o bloquealo.

---

## 9. Backup y restauración

Los **backups** (copias de seguridad) son copias del estado completo del sistema en un momento dado. Sirven para recuperar la información si algo sale mal: borrado accidental, falla técnica, error de carga masiva, etc.

> **⚠️ CRÍTICO:** Hacer backups regularmente es la mejor garantía contra pérdida de datos. **No saltes esta sección.**

---

### 💾 Cómo hacer un backup

1. Andá a **Configuración → Backup y Restauración**
2. Hacé clic en **🟢 Crear Backup**
3. El sistema comprime toda la base de datos y genera un archivo `.sql` (o `.zip`)
4. Cuando termina, aparece en la lista de backups con:
   - Fecha y hora
   - Tamaño del archivo
   - Usuario que lo creó
5. Opcional: hacé clic en **⬇️ Descargar** para guardar una copia en tu computadora

> **💡 Tip:** El archivo descargado es tu "seguro" contra todo. Si el sistema se cae o se corrompe, podés restaurar desde ese archivo.

---

### 🔄 Cómo restaurar un backup

> **⚠️ IMPORTANTE:** Restaurar **reemplaza** todos los datos actuales por los del backup. Usalo con cuidado.

**Pasos:**

1. Andá a **Configuración → Backup y Restauración**
2. Antes de restaurar, el sistema te ofrece hacer un **backup de seguridad previo** (¡aceptá siempre!)
3. Elegí el backup a restaurar de la lista, o subí un archivo `.sql` desde tu computadora
4. Hacé clic en **Restaurar**
5. Confirmá la advertencia (te muestra qué fecha/hora vas a restaurar)
6. Esperá a que termine el proceso (no cierres la ventana)
7. Cuando termine, vas a tener que **volver a iniciar sesión**

> **💡 Por qué el "safety backup" previo:** Si restaurás y te equivocaste de backup, podés "deshacer" restaurando el safety backup que se hizo automáticamente antes. Es una red de seguridad clave.

---

### 📅 Frecuencia recomendada

| Tipo de backup       | Frecuencia sugerida                              |
|----------------------|--------------------------------------------------|
| 🟢 **Automático**    | Diario (configurarlo en horario nocturno)        |
| 🟡 **Manual**        | Antes de operaciones críticas (migraciones, cambios masivos) |
| 🔵 **Descarga local** | Semanal (descargá el backup a tu computadora)    |
| 🟣 **Copia externa** | Mensual (copiá los backups a un disco externo o nube) |

**Para configurar backups automáticos:**

1. Andá a **Configuración → Backup y Restauración**
2. Activá **Backup automático**
3. Elegí la **hora** (recomendado: 3 AM, cuando no hay actividad)
4. Elegí **cuántos backups conservar** (ej. 30 días)
5. Guardá

> **💡 Mejor práctica:** Hacé backup automático diario Y descargá una copia a tu compu/nube al menos una vez por semana. Si el servidor se cae, vas a tener la copia local.

---

## 10. Configuración general

Acá se gestionan todos los parámetros del sistema. Es la sección que te permite adaptar el sistema a tu negocio.

---

### 🏷️ Categorías y marcas

Ya vimos cómo gestionarlas en la [sección 3](#🏷️-categorías-y-marcas). Recordá:

- **Categorías:** agrupan productos (Pasta Rellena, Pasta Seca, Salsas, etc.)
- **Marcas:** diferencian líneas (Premium, Clásica, etc.)
- No se pueden eliminar si tienen productos asociados

**Acceso:** Configuración → Categorías / Configuración → Marcas

---

### 📏 Unidades de medida

Las unidades de medida definen cómo se cuentan los productos y MP:

- **Unidad** (cada producto individual)
- **Kilo (kg)**
- **Gramo (g)**
- **Litro (L)**
- **Mililitro (ml)**
- **Paquete / Caja**

**Para gestionarlas:**

1. Andá a **Configuración → Unidades de Medida**
2. Para crear: **➕ Nueva Unidad** → nombre → abreviatura → guardar
3. Para editar o eliminar: clic en ✏️ o 🗑️

> **💡 Tip:** Definí unidades claras y consistentes. Si un producto se vende por kilo pero se produce por unidad, configurá la conversión correcta en la receta.

---

### 💳 Formas de pago

Las formas de pago aparecen al registrar ventas y reservas con seña.

**Para gestionarlas:**

1. Andá a **Configuración → Formas de Pago**
2. Para crear: **➕ Nueva Forma de Pago**
3. Completá:
   - **Nombre** (ej. "Mercado Pago QR")
   - **Tipo** (efectivo, tarjeta, transferencia, digital, cuenta corriente)
   - **¿Acepta cuotas?** (solo tarjetas)
   - **¿Activa?** (interruptor)
4. Guardá

> **💡 Tip:** Si desactivás una forma de pago, no se puede seleccionar en nuevas ventas pero queda registrada en ventas históricas.

---

### 🩺 Estado general del sistema

En **Configuración → Estado del Sistema** podés ver:

- ✅ Estado de los servicios (base de datos, almacenamiento, email)
- 📊 Espacio usado / disponible
- 🔢 Versión del sistema
- 📈 Métricas de rendimiento
- 📋 Últimos errores registrados

> **💡 Cuándo revisarlo:** Si el sistema anda lento o algo no funciona, mirá esta página primero. Si hay algo en rojo, contactá a soporte técnico.

---

### 🏷️ Etiquetas térmicas

El sistema puede imprimir **etiquetas térmicas** para los productos. Hay **dos formatos**:

#### 📄 Formato PDF

- Genera un PDF con las etiquetas listas para imprimir en cualquier impresora
- Útil si no tenés impresora térmica dedicada
- Podés elegir tamaño de etiqueta (ej. 50x30mm, 70x50mm)

**Para imprimir etiquetas PDF:**

1. Andá al producto o lote de producción
2. Hacé clic en **🏷️ Imprimir Etiquetas**
3. Elegí formato **PDF**
4. Indicá cuántas etiquetas querés
5. Hacé clic en **Generar** → se descarga el PDF
6. Imprimilo

#### 🖨️ Formato ZPL

- Genera código ZPL (Zebra Programming Language) para impresoras térmicas Zebra y compatibles
- Impresión directa, más rápida
- Requiere una impresora térmica conectada

**Para imprimir etiquetas ZPL:**

1. Andá al producto o lote de producción
2. Hacé clic en **🏷️ Imprimir Etiquetas**
3. Elegí formato **ZPL**
4. Indicá cantidad
5. Hacé clic en **Enviar a impresora** (si está configurada) o **Descargar ZPL**

**Para configurar la impresora ZPL:**

1. Andá a **Configuración → Etiquetas Térmicas**
2. Indicá la **IP** o **puerto** de la impresora
3. Elegí el **tamaño de etiqueta**
4. Hacé una **prueba de impresión**
5. Guardá

> **💡 Tip:** La impresión ZPL es mucho más rápida si imprimís muchas etiquetas por día. Si solo imprimís de vez en cuando, con PDF alcanza.

---

### 📨 Plantillas de notificaciones

El sistema envía **notificaciones automáticas** por email o mensaje a clientes y al equipo (ej. "Tu pedido está listo", "Confirmación de reserva"). Estas notificaciones usan **plantillas** que vos podés personalizar.

#### Cómo editar una plantilla

1. Andá a **Configuración → Plantillas de Notificaciones**
2. Elegí la plantilla a editar (ej. "Pedido Listo")
3. Editá el contenido usando **Markdown** para formato:
   - `**negrita**` → **negrita**
   - `*cursiva*` → *cursiva*
   - `# Título` → título grande
   - `- item` → lista con viñetas
4. Usá **variables** para personalizar (ver abajo)
5. Hacé clic en **Vista previa** para ver cómo queda
6. Guardá

#### Variables disponibles

Las variables se reemplazan automáticamente con los datos reales al enviar:

| Variable             | Se reemplaza por                          |
|----------------------|--------------------------------------------|
| `{{cliente_nombre}}` | Nombre del cliente                         |
| `{{cliente_email}}`  | Email del cliente                          |
| `{{pedido_numero}}`  | Número de pedido                           |
| `{{pedido_total}}`   | Monto total del pedido                     |
| `{{pedido_fecha}}`   | Fecha del pedido                           |
| `{{reserva_fecha}}`  | Fecha de la reserva                        |
| `{{reserva_senia}}`  | Monto de la seña                           |
| `{{producto_nombre}}` | Nombre del producto                       |
| `{{producto_precio}}` | Precio del producto                       |
| `{{negocio_nombre}}` | Nombre del negocio ("Pastas Orlando")      |
| `{{negocio_telefono}}` | Teléfono de contacto                     |
| `{{negocio_direccion}}` | Dirección del negocio                    |

**Ejemplo de plantilla:**

```markdown
# ¡Tu pedido está listo! 🍝

Hola **{{cliente_nombre}}**,

Tu pedido **#{{pedido_numero}}** ya está listo para retirar.

📅 Fecha del pedido: {{pedido_fecha}}
💰 Total: ${{pedido_total}}

Podés pasar a retirarlo cuando quieras en:
📍 {{negocio_direccion}}
📞 {{negocio_telefono}}

¡Gracias por elegirnos!
— {{negocio_nombre}}
```

> **💡 Tip:** Mantené las plantillas cortas y amables. Los clientes valoran la claridad. Usá emojis con moderación para dar calidez sin recargar.

---

## 🎯 Cierre

Este manual cubre todas las funcionalidades principales del panel de administración de **Pastas Orlando**. Si tenés dudas sobre algo específico:

- 📖 Consultá el [Manual de Usuario](./manual-usuario.md) para tareas del día a día
- 📧 Escribí a soporte técnico si hay algo que no funciona como esperabas
- 🔄 Revisá este manual de vez en cuando — el sistema se actualiza y pueden sumarse funciones nuevas

> **💡 Recordatorio final:** El sistema es tan bueno como lo sea la **disciplina** con la que lo uses. Registrá cada operación en el momento, hacé backups, revisá el dashboard cada mañana. Con esos tres hábitos, vas a tener el negocio siempre bajo control. 🍝✨

---

*Manual de Administración – Pastas Orlando*  
*Última actualización: 2025*  
*Versión del documento: 1.0*
