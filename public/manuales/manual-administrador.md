# Manual de Administración – El Amigo de las Pastas

> *Pastas artesanales con sabor a tradición* · Posadas, Misiones, Argentina
> 📧 laspastasdeorlando@gmail.com · ☎ 3754-419324 · CUIT 20-12345678-9

---

## Índice

1. Introducción al panel de administración
2. Dashboard
3. Gestión de productos (terminados)
4. Gestión de recetas
5. Gestión de producción y compras
6. Gestión de ventas, presupuestos y pedidos
7. Gestión de promociones y descuentos por volumen
8. Gestión de usuarios y roles
9. Exportación e impresión (todos los módulos)
10. Editor de plantillas de documentos
11. Envío de documentos por email
12. Historial de documentos
13. Códigos QR en documentos
14. Reportes y auditoría
15. Backup y restauración
16. Configuración general
17. Seguridad

---

## 1. Introducción al panel de administración 📊

El panel de administración de **El Amigo de las Pastas** es el corazón del ERP. Desde acá gestionás productos, producción, compras, ventas, clientes, proveedores, reportes y toda la configuración del sistema. Es una aplicación **Next.js 16** con App Router que también alimenta la tienda online (landing page y e-commerce).

### 1.1 ¿Cómo ingresar?

1. Abrí el navegador y entrá a:

   ```
   https://www.laspastasdeorlando.com/admin/login
   ```

   (o el dominio de tu entorno: `localhost:3000/admin/login` en desarrollo).

2. Completá los campos:
   - **Email**: tu usuario registrado (por ejemplo, `admin@laspastasdeorlando.com`).
   - **Contraseña**: tu clave de acceso.

3. 👁️ **Mostrar / ocultar contraseña**: a la derecha del campo de contraseña hay un ícono de **ojo**. Hacé clic para alternar entre texto visible y oculto. Útil si te equivocás al tipear o si alguien está mirando.

4. Presioná **Ingresar** o la tecla `Enter`.

### 1.2 Doble factor de autenticación (2FA)

> 💡 **Tip de seguridad**: Activá 2FA apenas entres por primera vez. Es la mejor defensa contra accesos no autorizados.

- Si tu usuario tiene **2FA habilitado**, tras ingresar email y contraseña vas a ver una pantalla pidiendo un **código de 6 dígitos**.
- El código lo genera una app autenticadora (Google Authenticator, Authy, 1Password, etc.).
- El código se renueva cada 30 segundos. Si expiró, esperá al siguiente y probá de nuevo.
- Configurá tu 2FA desde **Seguridad → Mi 2FA** (ver sección 17).

### 1.3 Cerrar sesión

Arriba a la derecha, en la barra superior, encontrás tu avatar/nombre. Hacé clic y elegí **Cerrar sesión**. Te conviene hacerlo siempre que termines la jornada o uses un equipo compartido.

### 1.4 Estructura general

Una vez adentro, la pantalla se divide en:

- **Barra lateral izquierda** (menú): agrupa los módulos por secciones.
- **Barra superior**: buscador, notificaciones, usuario.
- **Área central**: el contenido del módulo activo.

Las secciones del menú son:

| Grupo | Módulos |
|---|---|
| Stock & Producción | Productos Terminados, Materias Primas, Insumos, Recetas, Producción |
| Compras | Compras, Pedidos a Proveedores |
| Ventas | Ventas, Presupuestos, Pedidos de Clientes, Reservas, Promociones, Descuentos por Volumen |
| Stock | Movimientos de Stock |
| Envíos y Logística | Entregas, Puntos de Encuentro, Mapa de Entregas, Mapa de Proveedores |
| Contenido | Recetas de Cocina |
| Notificaciones | Plantillas, Historial, Alertas, Enviar Manual |
| Configuración | Categorías, Marcas, Unidades de Medida, Formas de Pago, Estados Generales, Etiquetas, Documentos |
| Personas | Personas, Usuarios, Opiniones |
| Auditoría & Reportes | Reportes Generales, Auditoría, Logs de Acceso |
| Seguridad | Logs, Sesiones, Roles, Mi 2FA |

> 🧭 **Recomendado**: empezá siempre por el **Dashboard** para ver el estado general antes de operar.

---

## 2. Dashboard 📊

Ruta: `/admin/dashboard`

El Dashboard es la pantalla de inicio y tu centro de control diario. Está pensado para que **de un vistazo** sepas qué tareas tenés pendientes, cómo van los números y dónde hay que intervenir.

### 2.1 Las 4 secciones del Dashboard

#### (1) Pasos Pendientes 📋

Son **alertas accionables** que te indican qué falta hacer en el flujo de trabajo. Están ordenadas siguiendo la cadena productiva:

```
Materias Primas → Recetas → Producción → Stock → Ventas
```

Cada alerta tiene un **nivel de severidad** con su color:

| Nivel | Color | Significado |
|---|---|---|
| 🔴 Crítica | Rojo | Algo urgente: stock agotado, producción detenida, pedido sin despachar |
| 🟡 Importante | Amarillo | Requiere atención pronta: stock bajo, vencimiento próximo |
| 🔵 Informativa | Azul | Recordatorio: tarea rutinaria, novedad del sistema |

Cada alerta incluye un **botón directo** que te lleva a la pantalla correspondiente **con el filtro ya aplicado**. Por ejemplo, una alerta "3 productos con stock crítico" te abre el listado de productos filtrado solo por los críticos.

> 💡 **Trucó**: si querés que una alerta desaparezca, resolvé la causa (cargá stock, completá la producción, etc.). El Dashboard se recalcula en tiempo real.

#### (2) Indicadores Clave (KPIs) 📈

Son 6 tarjetas con métricas principales y la **tendencia vs. mes anterior** (▲ verde = subió, ▼ rojo = bajó):

| KPI | Unidad | Qué mide |
|---|---|---|
| Ventas | $ | Total facturado en el período |
| Producción | u (unidades) | Cantidad producida |
| Pedidos Pendientes | cant. | Pedidos de clientes sin entregar |
| Reservas Activas | cant. | Reservas vigentes |
| Compras | $ | Total comprado a proveedores |
| Stock Crítico | cant. | Productos por debajo del mínimo |

> 🎯 **Interpretación**: comparar con el mes anterior te ayuda a detectar estacionalidad y problemas. Si ventas ▼ y producción ▲, quizás estás acumulando stock.

#### (3) Flujo de Trabajo 🔄

Una barra horizontal con 5 etapas clickeables. Cada etapa muestra un ícono de estado:

- ✅ **OK** — todo en orden.
- ⚠️ **Atención** — hay algo pendiente pero no crítico.
- 🔴 **Problema** — acción requerida.

Las etapas son:

1. **Materias Primas** → ¿tenés MP suficiente?
2. **Recetas** → ¿están cargadas las recetas de producción?
3. **Producción** → ¿hay órdenes activas?
4. **Stock** → ¿productos terminados en nivel correcto?
5. **Ventas** → ¿pedidos al día?

Hacé clic en cualquier etapa para ir al módulo correspondiente.

#### (4) Acciones Directas ⚡

8 botones de acceso rápido a las operaciones más frecuentes: **Nueva Venta**, **Nueva Compra**, **Iniciar Producción**, **Nuevo Producto**, **Nuevo Presupuesto**, **Nuevo Pedido**, **Cargar Stock**, **Exportar Reportes** (pueden variar según versión).

### 2.2 Uso diario recomendado

1. Entrá al Dashboard a primera hora.
2. Revisá las **alertas 🔴** y resolvé las críticas primero.
3. Mirá los **KPIs** y compará con el mes anterior.
4. Seguí el **flujo de trabajo** haciendo clic en cada etapa ⚠️ o 🔴.
5. Usá las **acciones directas** para operar sin navegar menús.

### 2.3 Exportación del Dashboard

Arriba a la derecha del Dashboard tenés tres botones:

- **📄 PDF Resumen** — genera un PDF con el estado completo (alertas, KPIs, flujo).
- **🖨️ Imprimir** — abre el diálogo de impresión del navegador.
- **📊 Alertas Excel** — descarga las alertas pendientes en un `.xlsx`.

> 💡 **Casos de uso**: el PDF de resumen es ideal para enviar a socios/gerencia. El Excel de alertas te sirve para asignar tareas al equipo.

---

## 3. Gestión de productos (terminados) 📦

Ruta: `/admin/productos-terminados`

Acá gestionás el **catálogo de pastas y productos finales** que vendés. Cada producto terminado (PT) tiene datos comerciales, stock, imágenes, costos y precios.

### 3.1 Listado

El listado muestra: nombre, categoría, marca, precio, stock actual, stock mínimo y **margen de ganancia** con código de color:

| Color del margen | Significado |
|---|---|
| 🟢 Verde | Margen > 50 % — saludable |
| 🟠 Naranja | Margen entre 30 % y 50 % — revisar |
| 🔴 Rojo | Margen < 30 % — crítico, podés estar perdiendo plata |

### 3.2 Crear un producto nuevo

1. Hacé clic en **➕ Nuevo Producto**.
2. Completá los campos del formulario:
   - **Nombre** (obligatorio).
   - **Categoría** y **Marca** (deben existir previamente en Configuración).
   - **Unidad de medida** (kg, unidad, paquete, etc.).
   - **Precio de venta** y **Costo** (el margen se calcula automático).
   - **Stock actual** y **Stock mínimo** (para alertas).
   - **Descripción** y **Modo de cocción** (se muestran en la landing).
   - **Imagen**: subí una foto del producto.
   - **Visible en tienda**: tildá si querés que aparezca en el e-commerce.
   - **Activo**: tildá si el producto está vigente.
3. Guardá.

> ⚠️ **Importante**: el costo se usa para calcular el margen. Si cambiás el costo de materias primas, recordá revisar y actualizar el costo del PT.

### 3.3 Editar / Eliminar

- **Editar**: hacé clic en el producto (o en el ícono ✏️) y modificá los campos.
- **Eliminar**: usá el menú de acciones del listado. Si el producto tiene movimientos asociados, el sistema puede bloquear el borrado o pedir confirmación.

### 3.4 Cargar stock

1. Desde el listado, abrí el menú de acciones del producto.
2. Elegí **Cargar stock**.
3. Ingresá la cantidad y, si querés, una observación.
4. Confirmá. El sistema registra un **movimiento de stock** automático de tipo "alta".

### 3.5 Alertas de stock

- Si el stock actual cae por debajo del mínimo, el producto aparece en el Dashboard con alerta 🔴/🟡.
- Revisá también el módulo **Stock → Movimientos de Stock** para ver el historial.

### 3.6 Exportación

- **📄 Ficha PDF**: detalle completo del producto (datos, imagen, stock, costos, descripción, modo de cocción).
- **🖨️ Imprimir**: imprime la ficha.
- **📊 Excel**: exporta el listado completo a `.xlsx`.

> 💡 **Tip**: la ficha PDF es perfecta para armar catálogos o enviar a clientes mayoristas.

---

## 4. Gestión de recetas 📜

Existen **dos tipos** de recetas en el sistema, con propósitos diferentes. No las mezcles.

### 4.1 Recetas de Producción 🏭

Ruta: `/admin/recetas`

Vinculan un **producto terminado** con las **materias primas e insumos** necesarios para fabricarlo. Son la base del cálculo de costos y del consumo automático en producción.

#### Crear una receta de producción

1. Andá a **Recetas** y hacé clic en **➕ Nueva Receta**.
2. Seleccioná el **producto terminado** al que pertenece.
3. Agregá los **ingredientes**:
   - Tipo: Materia Prima o Insumo.
   - Cantidad y unidad.
4. El sistema calcula el **costo total** de la receta en base a los precios de MP/insumos.
5. Definí los **pasos de producción** (texto libre o lista).
6. Guardá.

> 🔗 **Vinculación clave**: una receta de producción bien cargada permite que al **completar una orden de producción**, el sistema **descuente automáticamente** las MP/insumos usados del stock.

#### Exportación

- **📄 Ficha PDF**: ingredientes tabulados, costos, margen y pasos.
- **🖨️ Imprimir**.
- **📊 Excel** del listado.

### 4.2 Recetas de Cocina 🍝

Ruta: `/admin/recetas-de-cocina` (Contenido)

Son **contenido editorial** para la landing page: recetas que los clientes pueden cocinar en casa con tus pastas. **NO** están vinculadas a la producción ni a los costos. Son puramente marketing/comunicación.

#### Crear una receta de cocina

1. Andá a **Contenido → Recetas de Cocina** y hacé clic en **➕ Nueva Receta**.
2. Completá:
   - **Título**, **subtítulo**, **descripción**.
   - **Ingredientes** (lista).
   - **Pasos / preparación**.
   - **Tiempo de cocción**, **porciones**.
   - **Imagen principal** e imágenes adicionales.
   - **Visible en landing** (tildá para publicar).
3. Guardá.

#### Exportación (multi-formato)

Las recetas de cocina tienen el exportador más completo del sistema:

| Formato | Uso |
|---|---|
| 📄 **PDF** | Recetilable imprimible, ideal para regalar con la compra |
| 📝 **Word (.docx)** | Editable, para modificar y adaptar |
| 📄 **TXT** | Texto plano, para newsletters o sistemas externos |
| 🖨️ **Imprimir** | Salida directa a impresora |

> 💡 **Idea**: armá un recetario PDF con todas tus recetas de cocina y ofrecelo como lead magnet en la web.

---

## 5. Gestión de producción y compras 🏭

### 5.1 Producción

Ruta: `/admin/produccion`

Acá registrás las **órdenes de producción**: cuántas unidades de un PT vas a fabricar, cuándo y en qué estado están.

#### Estados típicos de una orden

- **Pendiente** — creada, sin iniciar.
- **En proceso** — producción activa.
- **Completada** — terminada, stock actualizado.
- **Cancelada** — descartada.

#### Crear una orden de producción

1. Hacé clic en **➕ Nueva Producción**.
2. Seleccioná el **producto terminado**.
3. Indicá la **cantidad a producir**.
4. Si el PT tiene **receta de producción** vinculada, el sistema muestra los ingredientes necesarios.
5. Elegí la **fecha planificada**.
6. Guardá.

#### Iniciar producción

1. Abrí la orden.
2. Cambiá el estado a **En proceso**.
3. (Opcional) Registrá responsable/observaciones.

#### Completar producción (¡importante!)

1. Cuando terminaste de fabricar, abrí la orden.
2. Cambiá el estado a **Completada**.
3. El sistema:
   - **Suma** las unidades producidas al stock del PT.
   - **Descuenta** automáticamente las MP/insumos según la receta de producción.
   - Registra los **movimientos de stock** correspondientes.

> ⚠️ **Atención**: si el PT **no tiene receta de producción** cargada, el descuento de MP no se hace automáticamente. Vas a tener que registrar los movimientos a mano.

#### Exportación

- **📄 Orden de Producción PDF**: documento formal con datos de la orden, ingredientes y cantidades.
- **🖨️ Imprimir**.

### 5.2 Compras

Ruta: `/admin/compras`

Registrás las **compras a proveedores** de materias primas e insumos. Cada compra **suma stock** a los productos correspondientes.

#### Registrar una compra

1. Hacé clic en **➕ Nueva Compra**.
2. Seleccioná el **proveedor** (Persona con rol proveedor).
3. Elegí la **fecha** y la **forma de pago**.
4. Agregá los **ítems** (MP/insumos), cantidad, precio unitario.
5. El sistema calcula el total.
6. Guardá.

Al guardar, el sistema **suma el stock** de cada MP/insumo comprado y registra los movimientos.

#### Exportación

- **📄 Orden de Compra PDF** (con QR si está habilitado).
- **🖨️ Imprimir**.
- **📊 Excel** del listado.

### 5.3 Pedidos a Proveedores

Ruta: `/admin/pedidos-proveedores`

Son **solicitudes** de compra (todavía no concretadas). Útiles para gestionar el flujo: primero generás el pedido, el proveedor lo confirma y después lo convertís en compra.

#### Flujo típico

1. Creás un **Pedido a Proveedor** con los ítems que necesitás.
2. Generás el **PDF de Orden de Pedido** y se lo enviás (por email o impreso).
3. Cuando el proveedor entrega, convertís el pedido en **Compra**.

#### Exportación

- **📄 Orden de Pedido PDF** (proveedores).
- **🖨️ Imprimir**.

> 💡 **Tip**: usá los pedidos a proveedores para planificar la producción. Si sabés que el lunes arrancás con 50 kg de ñoquis, el viernes generás el pedido de harina y huevos.

---

## 6. Gestión de ventas, presupuestos y pedidos 💰

### 6.1 Ventas

Ruta: `/admin/ventas`

Es el módulo central del facturero. Cada venta registra cliente, ítems, totales, forma de pago y estado.

#### Crear una venta

1. Hacé clic en **➕ Nueva Venta**.
2. Seleccioná el **cliente** (o crealo al toque).
3. Agregá los **productos** con cantidad.
4. Aplicá **descuentos** o **promociones** si corresponde (los descuentos por volumen se aplican solos, ver sección 7).
5. Elegí la **forma de pago**.
6. Guardá. El sistema descuenta stock y registra el movimiento.

#### Los 4 formatos PDF de venta

Desde el detalle de la venta (`/admin/ventas/[id]`) podés generar:

| Formato | Uso |
|---|---|
| 🧾 **Factura** | Documento fiscal formal (con QR) |
| 🎟️ **Ticket** | Comprobante corto, tipo mostrador |
| 📦 **Remito** | Para acompañar la mercadería entregada |
| 📑 **Orden de Venta** | Pedido interno / confirmación al cliente |

Cada formato tiene su propio diseño y datos. Todos incluyen el nombre **El Amigo de las Pastas**, tagline y datos de contacto.

#### Exportación y envío

- 📊 **Excel** del listado de ventas.
- 📧 **Enviar por email** (ver sección 11): abre un diálogo donde elegís destinatario, asunto y formato.

> 🔐 **Tip fiscal**: si emitís facturas reales para AFIP, recordá que este sistema es de gestión interna. Para facturación electrónica formal, integrá con un servicio certificado.

### 6.2 Presupuestos

Ruta: `/admin/presupuestos`

Cotizaciones que armás para clientes sin comprometer stock.

#### Flujo

1. Creás un **presupuesto** con ítems, cantidades y precios.
2. Generás el **PDF** y se lo enviás al cliente.
3. Si el cliente confirma, lo **convertís en Pedido de Cliente** (y después en Venta).

#### Exportación

- 📄 **Presupuesto PDF** (formato profesional con datos de empresa).
- 🖨️ Imprimir.

### 6.3 Pedidos de Clientes

Ruta: `/admin/pedidos-clientes`

Órdenes formalizadas por los clientes (vía web, teléfono o mostrador). Intermedio entre presupuesto y venta.

#### Estados típicos

- **Pendiente**, **Confirmado**, **En preparación**, **Entregado**, **Cancelado**.

#### Exportación

- 📄 **Orden de Pedido PDF** (cliente).
- 📦 **Remito PDF** (para acompañar la entrega).
- 🖨️ Imprimir.

### 6.4 Reservas

Ruta: `/admin/reservas`

Reservas de productos para retiro o entrega futura. Mantienen stock comprometido sin generar venta inmediata.

#### Exportación

- 📊 **Excel** del listado de reservas (útil para planificar producción semanal).

> 💡 **Buen uso**: si los sábados vendés mucho, abrí reservas los jueves y viernes para garantizar stock a los clientes que confirmaron.

---

## 7. Gestión de promociones y descuentos por volumen 🏷️

Son dos mecanismos distintos. No los mezcles.

### 7.1 Promociones

Ruta: `/admin/promociones`

Ofertas **públicas** que se muestran en la landing page y aplican en el carrito del e-commerce.

#### Tipos de promoción

| Tipo | Cómo funciona |
|---|---|
| **Porcentaje (%)** | Descuento sobre el total o el ítem (ej. 15 % off) |
| **Monto fijo ($)** | Resta un importe (ej. $500 de descuento) |
| **2x1** | Llevás dos, pagás uno |
| **Tiempo limitado** | Válida solo entre fechas (ej. semana de aniversario) |

#### Crear una promoción

1. Andá a **Ventas → Promociones** y hacé clic en **➕ Nueva Promoción**.
2. Elegí el **tipo**.
3. Definí el **valor** (porcentaje, monto, etc.).
4. Seleccioná los **productos** o categorías a las que aplica.
5. Configurá las **fechas** de vigencia.
6. Tildá **visible en landing** si querés que aparezca publicada.
7. Guardá.

> ⚠️ **Atención**: la búsqueda de productos en promociones muestra **TODOS** los productos (activos/inactivos/visibles/ocultos). Esto es así para que puedas armar promos de productos que tenés en stock pero no están a la venta online todavía. Pensalo dos veces antes de promocionar algo inactivo.

### 7.2 Descuentos por volumen

Ruta: `/admin/descuentos-volumen`

Descuentos **internos** escalonados por cantidad. **No** se muestran en la landing. Se **aplican automáticamente** cuando armás una Venta o Presupuesto desde el panel.

#### Ejemplo de escalas

| Cantidad | Descuento |
|---|---|
| 1–9 u | 0 % |
| 10–49 u | 5 % |
| 50–99 u | 10 % |
| 100+ u | 15 % |

#### Crear un descuento por volumen

1. Andá a **Ventas → Descuentos por Volumen**.
2. Seleccioná el **producto** (o categoría).
3. Definí las **escalas** (cantidad mínima → % descuento).
4. Guardá.

> 💡 **Diferencia clave**:
> - **Promociones** → públicas, para clientes finales, landing.
> - **Descuentos por volumen** → internos, para mayoristas, se aplican solos al vender.

---

## 8. Gestión de usuarios y roles 🔐

### 8.1 Usuarios

Ruta: `/admin/usuarios`

Cada persona que accede al panel necesita un usuario. Un usuario tiene:

- **Email** (identificador único).
- **Contraseña** (encriptada).
- **Rol** (define qué puede hacer).
- **Estado** (activo/inactivo).
- **2FA** (habilitado o no).
- **Persona vinculada** (datos personales).

#### Crear un usuario

1. Andá a **Personas → Usuarios** y hacé clic en **➕ Nuevo Usuario**.
2. Completá email y contraseña inicial.
3. Asigná un **rol**.
4. Vinculá una **persona** (opcional pero recomendado).
5. Guardá.
6. Pedile al usuario que cambie la contraseña en su primer ingreso y que active 2FA.

### 8.2 Roles

Ruta: `/admin/roles` (Seguridad)

Los roles agrupan **permisos**. En vez de asignar permisos uno por uno a cada usuario, les asignás un rol.

#### Roles típicos

| Rol | Permisos sugeridos |
|---|---|
| **Administrador** | Acceso total a todos los módulos |
| **Gerente** | Todo excepto configuración crítica y usuarios |
| **Vendedor** | Ventas, presupuestos, pedidos, clientes |
| **Producción** | Producción, recetas, stock |
| **Compras** | Compras, pedidos a proveedores, MP/insumos |
| **Depósito** | Stock, movimientos, etiquetas |

#### Crear / editar un rol

1. Andá a **Seguridad → Roles**.
2. Hacé clic en **➕ Nuevo Rol** o editá uno existente.
3. Tildá los **permisos** por módulo (ver, crear, editar, eliminar, exportar).
4. Guardá.

> 🛡️ **Principio de mínimo privilegio**: dale a cada usuario solo los permisos que necesita para su trabajo. Si vendés a un empleado, podés **desactivar** su usuario sin borrarlo, para preservar la auditoría.

### 8.3 2FA por usuario

Cada usuario puede activar su propio 2FA desde **Seguridad → Mi 2FA**. Ver sección 17 para el detalle.

---

## 9. Exportación e impresión (todos los módulos) 📄

La exportación profesional es una característica transversal del sistema. **Todos los módulos** tienen al menos una opción de exportación. Usamos `@react-pdf/renderer` para PDFs, `xlsx` para Excel, `docx` para Word y la API nativa del navegador para impresión.

### 9.1 Matriz completa de exportación

| Módulo | PDF | Excel | Word | TXT | Imprimir |
|---|---|---|---|---|---|
| **Dashboard** (Resumen) | ✅ | ✅ (Alertas) | — | — | ✅ |
| **Productos Terminados** (Ficha) | ✅ | ✅ | — | — | ✅ |
| **Materias Primas** (Ficha) | ✅ | ✅ | — | — | ✅ |
| **Insumos** (Ficha) | ✅ | ✅ | — | — | ✅ |
| **Recetas** (de Producción, Ficha) | ✅ | ✅ | — | — | ✅ |
| **Recetas de Cocina** | ✅ | — | ✅ (.docx) | ✅ | ✅ |
| **Personas** (Ficha) | ✅ | ✅ | — | — | ✅ |
| **Producción** (Orden) | ✅ | — | — | — | ✅ |
| **Compras** (Orden de Compra) | ✅ | ✅ | — | — | ✅ |
| **Pedidos a Proveedores** (Orden) | ✅ | — | — | — | ✅ |
| **Ventas** (Factura) | ✅ | — | — | — | ✅ |
| **Ventas** (Ticket) | ✅ | — | — | — | ✅ |
| **Ventas** (Remito) | ✅ | — | — | — | ✅ |
| **Ventas** (Orden de Venta) | ✅ | — | — | — | ✅ |
| **Ventas** (listado) | — | ✅ | — | — | — |
| **Presupuestos** | ✅ | — | — | — | ✅ |
| **Pedidos de Clientes** (Orden + Remito) | ✅ | — | — | — | ✅ |
| **Reservas** | — | ✅ | — | — | — |
| **Movimientos de Stock** | ✅ (Reporte) | ✅ | — | — | — |
| **Reportes** (Ventas/Stock/Producción/Compras) | ✅ | ✅/CSV | — | — | ✅ |
| **Logs de Acceso** | — | ✅ | — | — | — |

> 🧾 **Tip**: en los listados, los botones de exportación suelen estar arriba a la derecha. En los detalles, en la barra de acciones. Algunos formatos (Ficha PDF, Orden PDF) se generan con `@react-pdf/renderer`; los reportes jsPDF también aparecen en algunos módulos.

### 9.2 Cómo usar las exportaciones

#### PDF

1. Abrí el registro o listado.
2. Hacé clic en **📄 PDF** (o el nombre específico: Factura, Ficha, Orden, etc.).
3. El navegador descarga el archivo `.pdf` o lo abre en una pestaña nueva.

#### Excel

1. En el listado, hacé clic en **📊 Excel**.
2. Se descarga un `.xlsx` con todos los registros visibles (respeta filtros aplicados).

#### Word (.docx)

1. Solo disponible en **Recetas de Cocina**.
2. Hacé clic en **📝 Word**.
3. Se descarga un `.docx` editable.

#### TXT

1. Solo disponible en **Recetas de Cocina**.
2. Hacé clic en **📄 TXT**.
3. Se descarga un archivo de texto plano.

#### Imprimir

1. Hacé clic en **🖨️ Imprimir**.
2. Se abre el diálogo de impresión del navegador.
3. Elegí impresora, cantidad de copias y orientación.
4. Imprimí.

> 💡 **Para etiquetas térmicas**: la impresión de etiquetas tiene su propio módulo (`/admin/etiquetas`) con soporte ZPL para impresoras Zebra/Brother. Ver sección 16.

---

## 10. Editor de plantillas de documentos ⚙️

Ruta: `/admin/configuracion` → pestaña **Documentos**

El editor de plantillas te permite configurar los **datos de empresa** y el **aspecto** de los documentos PDF generados por el sistema. Los datos se guardan en la tabla `ConfigDocumento` (registro único con `id = 1`).

### 10.1 Campos editables

| Campo | Descripción |
|---|---|
| **Nombre de la empresa** | "El Amigo de las Pastas" (por defecto) |
| **Dirección** | Posadas, Misiones |
| **Teléfono** | 3754-419324 |
| **Email** | laspastasdeorlando@gmail.com |
| **CUIT** | 20-12345678-9 |
| **Condición IVA** | Monotributista / Responsable Inscripto / etc. |
| **Inicio de actividades** | Fecha de inicio del negocio |
| **Logo URL** | URL pública del logo (se incrusta en los PDFs) |
| **Texto del pie** | Mensaje al pie de los documentos (ej. "Gracias por su compra") |
| **Toggle QR** | Activar/desactivar códigos QR en documentos |
| **Base URL del QR** | URL base que codifica el QR (ej. `https://www.laspastasdeorlando.com`) |
| **Texto de condiciones** | Condiciones de venta, plazos, garantías, etc. |
| **Color de acento** | Color principal de los documentos (hex) |

### 10.2 Cómo editar

1. Andá a **Configuración → Documentos**.
2. Modificá los campos que quieras cambiar.
3. Subí el logo a un servidor / CDN y pegá la URL (no se sube al sistema directamente).
4. Elegí el **color de acento** (recomendado: mostaza de marca, pero podés personalizar).
5. Hacé clic en **Guardar**.

> ⚠️ **Importante**: algunos documentos PDF del sistema usan constantes propias (no leen esta config en runtime). Si cambiás un dato acá y no se refleja en algún PDF, revisá la sección 13 y la nota sobre `ConfigDocumento`.

### 10.3 Toggle de QR

- **Activado**: los documentos compatibles (Factura, Orden de Compra, Orden de Producción) muestran un QR abajo a la derecha.
- **Desactivado**: el QR no se renderiza, ahorrando espacio.

Ver sección 13 para el detalle de QR.

### 10.4 Color de acento

El color que elijas se aplica a:

- Encabezados de tablas.
- Títulos de sección.
- Líneas separadoras.
- Iconografía decorativa.

Recomendado: usar el color de marca (mostaza) para mantener coherencia visual.

---

## 11. Envío de documentos por email 📨

Desde el **detalle de una venta** (`/admin/ventas/[id]`) podés enviar el documento PDF por email directamente desde el panel. El sistema usa **Nodemailer** del lado del servidor para generar el PDF y enviarlo.

### 11.1 Pasos

1. Abrí la venta desde **Ventas** → hacé clic en la venta deseada.
2. En la barra de acciones del detalle, hacé clic en **📧 Enviar por email**.
3. Se abre un **diálogo** con estos campos:
   - **Destinatario**: email del cliente (se autocompleta si la venta tiene cliente).
   - **Asunto**: asunto del email (editable).
   - **Formato**: elegí cuál PDF enviar (Factura, Ticket, Remito u Orden de Venta).
   - **Cuerpo del mensaje** (opcional): texto que acompaña el PDF.
4. Confirmá con **Enviar**.
5. El sistema:
   - Genera el PDF en el servidor.
   - Adjunta el PDF al email.
   - Envía vía SMTP (Nodemailer).
   - Registra el envío en el **Historial de Documentos** (ver sección 12).

### 11.2 Requisitos previos

> ⚙️ **Configuración SMTP**: para que el envío funcione, el servidor debe tener configuradas las variables de entorno de email:
>
> - `SMTP_HOST` (ej. `smtp.gmail.com`)
> - `SMTP_PORT` (ej. `587`)
> - `SMTP_USER` (email remitente)
> - `SMTP_PASS` (password o app password)
> - `SMTP_FROM` (dirección "From" visible)
>
> Si no están configuradas, el botón de envío puede mostrar un error o estar deshabilitado. Consultá con el administrador del sistema.

### 11.3 Buenas prácticas

- Verificá el **destinatario** antes de enviar (un error de tipeo manda el PDF a otro).
- Personalizá el **asunto** para que el cliente sepa qué es ("Factura El Amigo de las Pastas – Pedido #1234").
- Para clientes frecuentes, podés armar **plantillas de email** en **Notificaciones → Plantillas**.

---

## 12. Historial de documentos 📚

Ruta: `/admin/configuracion` → pestaña **Documentos** (sección inferior)

Cada vez que el sistema genera un documento (PDF, Excel, Word, envío por email), se registra en el **Historial de Documentos** (tabla `DocumentosHistorial`). Esto te da trazabilidad total.

### 12.1 Qué se registra

| Campo | Descripción |
|---|---|
| **tipo** | Tipo de documento (Factura, Orden de Compra, Ficha Producto, etc.) |
| **entidad_id** | ID del registro asociado (ej. ID de la venta) |
| **entidad_tipo** | Tipo de entidad (Venta, Compra, Producto, Producción…) |
| **formato** | PDF, Excel, Word, TXT |
| **generado_por** | Usuario que generó el documento |
| **email_enviado** | true/false — si se envió por email |
| **destinatario** | Email del destinatario (si aplica) |
| **fecha** | Fecha y hora de generación |
| **metadata** | Datos adicionales en JSON |

### 12.2 Cómo usarlo

1. Andá a **Configuración → Documentos**.
2. Hacé scroll hacia abajo hasta **Historial de Documentos**.
3. Vas a ver una tabla con todos los documentos generados, ordenados por fecha descendente.
4. Podés **filtrar** por tipo, formato, fecha o usuario.
5. Cada fila te muestra el detalle del documento generado.

### 12.3 Casos de uso

- **Auditoría**: ¿quién generó la factura #1234 y cuándo?
- **Control de envíos**: ¿se envió por email el remito al cliente X?
- **Estadísticas**: cuántos PDFs se generaron este mes, qué formatos son los más usados.

> 💡 **Tip de cumplimiento**: si tenés que demostrar trazabilidad (por ejemplo, para una inspección), el Historial de Documentos es tu fuente de verdad. Exportalo periódicamente.

---

## 13. Códigos QR en documentos 🔲

Algunos documentos PDF incluyen un **código QR** en la esquina inferior derecha que codifica la **URL del documento** en el sistema. Esto permite que un cliente o inspector escanee el QR y acceda al documento online.

### 13.1 Documentos con QR

| Documento | ¿Tiene QR? |
|---|---|
| **Factura** (Ventas) | ✅ |
| **Orden de Compra** (Compras) | ✅ |
| **Orden de Producción** (Producción) | ✅ |
| Ticket / Remito / Orden de Venta | — |
| Pedidos (Clientes / Proveedores) | — |
| Fichas (Producto, MP, Receta, Persona, Insumo) | — |
| Recetas de Cocina | — |
| Reportes | — |

### 13.2 Cómo activar / desactivar el QR

1. Andá a **Configuración → Documentos**.
2. Buscá el toggle **"Incluir QR en documentos"**.
3. Activá o desactivá según prefieras.
4. Guardá.

Cuando está **activado**, los documentos compatibles muestran el QR abajo a la derecha. Cuando está **desactivado**, no se renderiza (queda más espacio para contenido).

### 13.3 ¿Qué URL codifica el QR?

El QR codifica una **URL completa** formada por:

```
{base_url}/admin/{modulo}/{id}
```

Por ejemplo:

```
https://www.laspastasdeorlando.com/admin/ventas/1234
```

> 🔐 **Nota de acceso**: la URL del QR apunta al panel de administración, que requiere login. Esto significa que el QR es útil **internamente** (para que tu equipo acceda rápido al documento) o para clientes que tengan usuario. Para un enlace público, considerá implementar una vista pública de documentos en el futuro.

### 13.4 Personalizar la base URL

En **Configuración → Documentos**, el campo **Base URL del QR** define el dominio base. Si cambiás de dominio (ej. de staging a producción), actualizá este campo para que los QR nuevos apunten al lugar correcto.

---

## 14. Reportes y auditoría 📊

### 14.1 Reportes Generales

Ruta: `/admin/reportes`

El módulo de Reportes Generales te permite generar informes con **filtros personalizados** y exportarlos.

#### Cuatro tipos de reporte

| Reporte | Qué incluye |
|---|---|
| **Ventas** | Total facturado, cantidad de ventas, ticket promedio, top productos |
| **Stock** | Inventario actual, valor de stock, productos críticos, rotación |
| **Producción** | Unidades producidas, costos, eficiencia, MP consumida |
| **Compras** | Total comprado, proveedores principales, evolución mensual |

#### Filtros de período (presets)

Disponibles para todos los reportes:

- **Hoy**
- **Ayer**
- **Últimos 7 días**
- **Últimos 30 días**
- **Este mes**
- **Mes anterior**
- **Este año**
- **Personalizado** (elegí fecha desde y hasta)

#### Filtros específicos

Cada reporte tiene además filtros propios:

- **Ventas**: por cliente, forma de pago, estado.
- **Stock**: por categoría, marca, estado de stock.
- **Producción**: por producto, estado de orden.
- **Compras**: por proveedor, forma de pago.

#### Exportación

- 📄 **PDF** del reporte (formato profesional con tablas y resumen).
- 📊 **Excel** (.xlsx) — datos crudos para analizar en tu planilla.
- 📄 **CSV** — texto delimitado para importar a otros sistemas.
- 🖨️ **Imprimir**.

> 💡 **Flujo recomendado**: al cerrar el mes, generá el reporte de Ventas y el de Producción en PDF, y guardalos en una carpeta `Reportes / YYYY-MM`. Te va a servir para comparar meses y para temas impositivos.

### 14.2 Auditoría

Ruta: `/admin/auditoria`

Registra **todas las acciones importantes** del sistema: quién creó/editó/eliminó qué, y cuándo. Cada entrada incluye:

- **Usuario** responsable.
- **Acción** (CREATE, UPDATE, DELETE, LOGIN, etc.).
- **Entidad** afectada (Producto, Venta, Usuario, etc.).
- **ID** de la entidad.
- **Fecha y hora**.
- **Detalle / cambios** (campo anterior → campo nuevo).

> 🔍 **Cuándo usarla**: si algo "se rompió solo" o un dato desapareció, andá a Auditoría y filtrá por la entidad. Vas a ver quién tocó qué y cuándo.

### 14.3 Logs de Acceso

Ruta: `/admin/logs-acceso`

Registra los **inicios de sesión** (exitosos y fallidos) de todos los usuarios.

- 📊 **Excel**: exportá el listado para analizar patrones de acceso.

> 🛡️ **Alerta de seguridad**: si ves muchos intentos fallidos de login desde una IP desconocida, puede ser un ataque de fuerza bruta. Considerá bloquear la IP o pedir a los usuarios que cambien la contraseña.

---

## 15. Backup y restauración 💾

Ruta: `/admin/backup`

El backup te permite **exportar** toda la base de datos a un archivo y **restaurarla** cuando lo necesites. Es tu red de seguridad ante desastres.

### 15.1 Exportar (backup)

1. Andá a **Configuración → Backup** (o `/admin/backup`).
2. Hacé clic en **Exportar base de datos**.
3. El sistema genera un archivo con todas las tablas y datos.
4. Se descarga automáticamente.
5. Guardalo en un lugar seguro (preferentemente **fuera del servidor**: Google Drive, Dropbox, disco externo).

> ⏰ **Frecuencia recomendada**:
> - **Diaria** si operás todos los días con volumen alto.
> - **Semanal** si el volumen es bajo.
> - **Antes de cualquier cambio importante** (migración, actualización, importación masiva).

### 15.2 Importar (restauración)

1. Andá a **Configuración → Backup**.
2. Hacé clic en **Importar base de datos**.
3. Seleccioná el archivo de backup.
4. Confirmá.

> ⚠️ **PELIGRO**: la importación **sobrescribe** los datos actuales. Asegurate de:
> 1. Hacer un backup del estado actual **antes** de importar.
> 2. Probar la importación en un entorno de staging primero.
> 3. Avisar a todo el equipo: durante la importación, el sistema puede quedar inconsistente.

### 15.3 Buenas prácticas

- Mantené al menos **3 copias** (regla 3-2-1): 3 copias, 2 medios distintos, 1 fuera del sitio.
- Nombrá los archivos con fecha: `backup-YYYY-MM-DD.sql` o `.db`.
- Testeá la restauración al menos **una vez al semestre**. Un backup que no se puede restaurar no sirve.

---

## 16. Configuración general ⚙️

Ruta: `/admin/configuracion`

La configuración general agrupa todos los **maestros** y **parámetros** del sistema. Cada submódulo gestiona un catálogo base que después se usa en el resto del ERP.

### 16.1 Categorías

- Sirven para clasificar productos terminados, materias primas y recetas.
- Ejemplos: "Pastas Secas", "Pastas Frescas", "Salsas", "Pre-pizzas".
- Operaciones: crear, editar, eliminar (si no tiene productos asociados).

### 16.2 Marcas

- Marca comercial de productos y MP.
- Ejemplos: "El Amigo", "Marolio" (para MP compradas).

### 16.3 Unidades de Medida

- Unidades usadas en todo el sistema: kg, g, l, ml, unidad, paquete, docena.
- Importante para que los cálculos de stock y costos sean consistentes.

### 16.4 Formas de Pago

- Medios de pago disponibles en ventas y compras: Efectivo, Transferencia, Tarjeta Débito, Tarjeta Crédito, Mercado Pago, Cuenta Corriente.

### 16.5 Estados Generales

- Definen los estados que pueden tener las entidades (Pedidos, Producción, Compras, etc.).
- Cada estado puede tener un color y un orden de flujo.

### 16.6 Etiquetas térmicas

Ruta: `/admin/etiquetas`

Generación de **etiquetas para productos** con soporte para impresoras térmicas Zebra y Brother.

#### Características

- **6 tamaños**: de 40×30 mm hasta 100×60 mm.
- **Códigos de barras**: EAN-13 y CODE128.
- **Formatos de salida**:
  - 📄 **PDF** — para imprimir desde cualquier impresora.
  - **ZPL** — lenguaje nativo de impresoras Zebra/Brother (envío directo).
- **Impresión por lotes**: generá muchas etiquetas de una (ideal para reposición de góndola).

#### Generar etiquetas

1. Andá a **Configuración → Etiquetas** (o `/admin/etiquetas`).
2. Seleccioná los **productos** (uno o varios).
3. Elegí el **tamaño** de etiqueta.
4. Elegí el **tipo de código de barras** (EAN-13 si tenés código asignado, CODE128 si no).
5. Elegí el **formato**: PDF o ZPL.
6. Generá e imprimí.

> 💡 **Tip**: si tu impresora Zebra está conectada por red, podés enviar el ZPL directamente vía sockets. Consultá con el administrador técnico.

### 16.7 Documentos

Editor de plantillas de documentos y historial. Ver secciones **10** y **12**.

---

## 17. Seguridad 🔐

Ruta: grupo **Seguridad** del menú lateral

La seguridad es transversal al sistema. Acá gestionás logs, sesiones, roles y el 2FA de tu usuario.

### 17.1 Logs

Ruta: `/admin/logs` (Seguridad)

Registro de **eventos del sistema** (más técnico que la Auditoría). Incluye:

- Errores de aplicación.
- Llamadas a APIs.
- Eventos de seguridad (intentos de login, cambios de permisos).
- Tareas programadas.

> 💡 **Uso**: si algo no funciona como esperabas, los logs pueden darte pistas. Si no sos técnico, compartí el log con el equipo de soporte.

### 17.2 Sesiones

Ruta: `/admin/sesiones` (Seguridad)

Lista de **sesiones activas** de todos los usuarios. Para cada sesión ves:

- Usuario.
- IP de origen.
- User agent (navegador / dispositivo).
- Fecha de inicio.
- Última actividad.

#### Cerrar sesiones

- Podés **cerrar sesiones individuales** (por ejemplo, si un usuario olvidó cerrar sesión en un equipo compartido).
- También podés **cerrar todas las sesiones de un usuario** (útil si te robaron credenciales).

> 🛡️ **Recomendación**: si desactivás un usuario, cerrá también todas sus sesiones activas. Si no, el usuario sigue teniendo acceso hasta que expire el token.

### 17.3 Roles

Ruta: `/admin/roles` (Seguridad)

Ver sección **8.2** para el detalle de gestión de roles y permisos.

### 17.4 Mi 2FA

Ruta: `/admin/mi-2fa` (Seguridad)

Acá configurás el **doble factor de autenticación para tu usuario**.

#### Activar 2FA

1. Andá a **Seguridad → Mi 2FA**.
2. Hacé clic en **Activar 2FA**.
3. Se muestra un **código QR** en pantalla.
4. Escanealo con tu app autenticadora:
   - **Google Authenticator** (Android / iOS)
   - **Authy**
   - **1Password**
   - **Microsoft Authenticator**
   - Cualquier app compatible con TOTP.
5. La app genera un código de 6 dígitos. Ingresalo en el campo de verificación.
6. **Guardá los códigos de recuperación** en un lugar seguro. Te permiten entrar si perdés el teléfono.

> ⚠️ **CRÍTICO**: si perdés el teléfono y no tenés los códigos de recuperación, **no vas a poder entrar**. Un administrador con permisos puede desactivar tu 2FA, pero es un trámite. Guardá los códigos.

#### Desactivar 2FA

1. Andá a **Seguridad → Mi 2FA**.
2. Hacé clic en **Desactivar 2FA**.
3. Confirmá con tu contraseña o un código 2FA vigente.

> 🚫 **No recomendado**: mantener 2FA desactivado, especialmente para usuarios administradores.

### 17.5 Buenas prácticas de seguridad

1. **Contraseñas fuertes**: mínimo 12 caracteres, con mayúsculas, minúsculas, números y símbolos. No reutilices contraseñas.
2. **2FA para todos** los usuarios con acceso a datos sensibles (ventas, finanzas, configuración).
3. **Principio de mínimo privilegio**: cada usuario con el rol más restrictivo posible.
4. **Revisión periódica** (mensual):
   - Revisá usuarios inactivos y desactivá los que ya no laburan.
   - Revisá sesiones abiertas y cerrá las que no correspondan.
   - Revisá los logs de acceso por intentos fallidos.
5. **Backup periódico** (ver sección 15) como medida de resiliencia.
6. **No compartas credenciales**: cada usuario, su propia cuenta. Si alguien necesita acceso, creale un usuario.
7. **Cerrá sesión** siempre que termines, especialmente en equipos compartidos.

---

## Apéndice A — Mapa de rutas principales

| Ruta | Módulo |
|---|---|
| `/admin/login` | Inicio de sesión |
| `/admin/dashboard` | Dashboard |
| `/admin/productos-terminados` | Productos Terminados |
| `/admin/materias-primas` | Materias Primas |
| `/admin/insumos` | Insumos |
| `/admin/recetas` | Recetas de Producción |
| `/admin/produccion` | Producción |
| `/admin/compras` | Compras |
| `/admin/pedidos-proveedores` | Pedidos a Proveedores |
| `/admin/ventas` | Ventas |
| `/admin/ventas/[id]` | Detalle de Venta (con envío por email) |
| `/admin/presupuestos` | Presupuestos |
| `/admin/pedidos-clientes` | Pedidos de Clientes |
| `/admin/reservas` | Reservas |
| `/admin/promociones` | Promociones |
| `/admin/descuentos-volumen` | Descuentos por Volumen |
| `/admin/movimientos-stock` | Movimientos de Stock |
| `/admin/entregas` | Entregas |
| `/admin/puntos-encuentro` | Puntos de Encuentro |
| `/admin/mapa-entregas` | Mapa de Entregas |
| `/admin/mapa-proveedores` | Mapa de Proveedores |
| `/admin/recetas-de-cocina` | Recetas de Cocina |
| `/admin/plantillas` | Plantillas de Notificación |
| `/admin/historial-notificaciones` | Historial de Notificaciones |
| `/admin/alertas` | Alertas |
| `/admin/enviar-manual` | Enviar Notificación Manual |
| `/admin/categorias` | Categorías |
| `/admin/marcas` | Marcas |
| `/admin/unidades-medida` | Unidades de Medida |
| `/admin/formas-pago` | Formas de Pago |
| `/admin/estados-generales` | Estados Generales |
| `/admin/etiquetas` | Etiquetas Térmicas |
| `/admin/configuracion` | Configuración (incluye Documentos) |
| `/admin/personas` | Personas |
| `/admin/usuarios` | Usuarios |
| `/admin/opiniones` | Opiniones |
| `/admin/reportes` | Reportes Generales |
| `/admin/auditoria` | Auditoría |
| `/admin/logs-acceso` | Logs de Acceso |
| `/admin/logs` | Logs del Sistema |
| `/admin/sesiones` | Sesiones |
| `/admin/roles` | Roles |
| `/admin/mi-2fa` | Mi 2FA |
| `/admin/backup` | Backup y Restauración |

---

## Apéndice B — Datos de la empresa

| Dato | Valor |
|---|---|
| **Nombre comercial** | El Amigo de las Pastas |
| **Tagline** | Pastas artesanales con sabor a tradición |
| **Email** | laspastasdeorlando@gmail.com |
| **Teléfono** | 3754-419324 |
| **Ubicación** | Posadas, Misiones, Argentina |
| **CUIT** | 20-12345678-9 |

---

## Apéndice C — Glosario rápido

| Término | Significado |
|---|---|
| **PT** | Producto Terminado |
| **MP** | Materia Prima |
| **Insumo** | Material auxiliar (envases, etiquetas, etc.) |
| **Receta de Producción** | Fórmula técnica que vincula PT con MP/insumos |
| **Receta de Cocina** | Contenido editorial para la landing |
| **2FA** | Doble factor de autenticación |
| **QR** | Código de barras bidimensional |
| **ZPL** | Lenguaje de impresión Zebra |
| **EAN-13** | Código de barras estándar de 13 dígitos |
| **CODE128** | Código de barras alfanumérico |
| **SMTP** | Protocolo de envío de emails |
| **KPI** | Indicador clave de desempeño |
| **CSV** | Archivo de valores separados por comas |

---

> 📖 **Fin del Manual de Administración – El Amigo de las Pastas**
>
> *Pastas artesanales con sabor a tradición* — Posadas, Misiones, Argentina.
>
> Para consultas técnicas o soporte, escribinos a **laspastasdeorlando@gmail.com**.
