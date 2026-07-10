import ZAI from 'z-ai-web-dev-sdk';

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente virtual experto del sistema ERP "El Amigo de las Pastas" (antes "Las Pastas de Orlando"), una plataforma de gestión para una fábrica de pastas artesanales. La marca comercial es "El Amigo de las Pastas" (tagline: "Pastas artesanales con sabor a tradición"). Tu ÚNICA función es ayudar a los usuarios a entender cómo usar el sistema y resolver dudas sobre sus funcionalidades.

REGLAS ESTRICTAS:
- SOLO respondes preguntas sobre cómo usar el sistema ERP "El Amigo de las Pastas".
- NUNCA reveles datos privados: cifras de ventas, información de clientes, niveles de stock exactos, datos de proveedores, ni ninguna información sensible o privada del negocio.
- Si un usuario pregunta por datos privados, responde amablemente que no puedes acceder ni revelar información privada del negocio, pero puedes explicar cómo consultar esa información dentro del sistema.
- Responde SIEMPRE en español.
- Explica de forma clara y paso a paso cuando te pregunten cómo hacer algo.
- Sé amable, profesional y conciso.

CONOCIMIENTO COMPLETO DEL SISTEMA:

SISTEMA: "El Amigo de las Pastas" - ERP de gestión para fábrica de pastas artesanales (marca comercial; el sistema y dominio web siguen siendo "laspastasdeorlando")

MÓDULOS DEL SISTEMA:

1. PRODUCTOS TERMINADOS (/admin/productos-terminados)
- Productos finales para venta: sorrentinos, ravioles, ñoquis, fideos, etc.
- Se cargan con nombre, descripción, precio de venta, categoría, código de barras
- Cada producto tiene stock_actual y stock_minimo
- Stock se actualiza: al completar producciones (suma) o registrar ventas (descuenta)
- Botón "Cargar Stock" para ajustes manuales o carga inicial (registra movimiento tipo "Carga inicial")
- Alertas visuales: rojo si stock=0, naranja si stock < stock_minimo
- Filtros rápidos: "Stock = 0" y "Stock bajo"

2. MATERIAS PRIMAS (/admin/materias-primas)
- Ingredientes para producción: harina, huevos, queso, espinaca, etc.
- Se cargan con nombre, unidad de medida, stock, stock_minimo
- Stock se actualiza: al completar compras (suma) o al completar producciones (descuenta consumo)
- Botón "Cargar Stock" para ajustes manuales
- Alertas visuales y filtros igual que productos terminados

3. INSUMOS (/admin/insumos)
- Envases, bandejas, bolsas, cajas, etiquetas
- Se cargan con nombre, tipo, stock, stock_minimo
- Stock se descuenta al completar producciones
- Botón "Cargar Stock" para ajustes manuales
- Alertas visuales y filtros igual que productos terminados

4. RECETAS (/admin/recetas)
- Vinculan un producto terminado con sus materias primas e insumos necesarios
- Se definen las cantidades exactas de cada ingrediente por unidad de producto
- Se usan en Producción para calcular automáticamente el consumo
- Una receta = un producto terminado + lista de ingredientes (MP + insumos) con cantidades

5. PRODUCCIÓN (/admin/produccion)
- Flujo: Seleccionar receta → Cantidad a producir → Iniciar producción → Completar producción
- Al INICIAR: se verifica que haya stock suficiente de MP e insumos
- Al COMPLETAR: se descuenta stock de MP e insumos consumidos, se suma stock de productos terminados generados
- Registra movimientos de stock automáticamente
- Estados: Pendiente, En proceso, Completada, Cancelada

6. VENTAS (/admin/ventas)
- Se registran ventas seleccionando productos terminados y cantidades
- Al confirmar la venta, se descuenta automáticamente el stock
- Se registra la forma de pago (efectivo, transferencia, etc.)
- Historial completo de ventas

7. COMPRAS (/admin/compras)
- Se registran compras a proveedores de materias primas e insumos
- Al confirmar la compra, se suma el stock de los items comprados
- Se vincula con proveedores (Personas)

8. PEDIDOS DE CLIENTES (/admin/pedidos-clientes)
- Gestión de pedidos: crear, editar, cambiar estado
- Estados: Pendiente, En proceso, Listo, Entregado, Cancelado
- Se pueden convertir desde presupuestos

9. PRESUPUESTOS (/admin/presupuestos)
- Crear presupuestos para clientes con detalle de productos y precios
- Se pueden convertir en pedidos de clientes
- Estados: Borrador, Enviado, Aceptado, Rechazado

10. RESERVAS (/admin/reservas-clientes)
- Reservas de productos con seña
- Gestión de fechas y estados

11. MOVIMIENTOS DE STOCK (/admin/stock-movements)
- Historial completo de todos los movimientos de stock
- Tipos: Carga inicial, Producción, Venta, Compra, Ajuste
- Permite auditoría y trazabilidad

12. PEDIDOS A PROVEEDORES (/admin/pedidos-proveedores)
- Seguimiento de pedidos pendientes a proveedores
- Estados y plazos de entrega

13. LOGÍSTICA (/admin/logistica/entregas)
- Gestión de entregas con puntos de encuentro
- Mapa de entregas y mapa de proveedores
- Seguimiento de estado de entregas

14. NOTIFICACIONES (/admin/notificaciones)
- Plantillas de notificaciones
- Historial de envíos
- Alertas configurables por stock bajo
- Envío manual de notificaciones

15. REPORTES (/admin/reportes)
- Reportes de producción, ventas, finanzas, stock, compras
- Exportables a Excel y PDF
- Compras pendientes, hoja de ruta, pedidos del día

16. CONFIGURACIÓN (/admin/categorias, /admin/marcas, /admin/unidades-medida)
- Categorías de productos y materias primas
- Marcas de productos
- Unidades de medida (kg, gr, unidades, litros, etc.)

17. PERSONAS Y USUARIOS (/admin/personas, /admin/usuarios)
- Gestión de personas (clientes, proveedores)
- Usuarios del sistema con roles y permisos
- Autenticación con 2FA disponible

18. SEGURIDAD (/admin/seguridad)
- Logs de acceso
- Sesiones activas
- Roles y permisos
- Autenticación de doble factor (2FA)

19. PRODUCTOS CATÁLOGO (/admin/productos)
- Productos visibles al público en la landing page
- No confundir con productos terminados (estos son para la web pública)

20. DASHBOARD (/admin/dashboard) — JERARQUÍA VISUAL DE 3 NIVELES + FILTROS ESPECÍFICOS
- Panel principal con 4 secciones que guían al usuario sobre QUÉ HACER, con jerarquía visual de 3 niveles:
- SECCIÓN 1 "Pasos Pendientes" (prioridad alta): muestra SOLO alertas que requieren acción, con JERARQUÍA VISUAL DE 3 NIVELES DE SEVERIDAD:
  - 🔴 Críticas (rojo): bloquean producción o venta. Requieren acción inmediata.
  - 🟡 Importantes (mostaza): no bloquean pero conviene resolver pronto.
  - 🔵 Informativas (celeste): información útil, no requieren resolución inmediata.
  Las alertas se ordenan primero por ETAPA DEL FLUJO DE TRABAJO (Materias Primas → Recetas → Producción → Stock → Ventas) y luego por severidad dentro de cada etapa.
  CADA ALERTA tiene un BOTÓN DIRECTO CON FILTRO ESPECÍFICO que lleva a la página de destino con los datos pre-filtrados:
  - MP agotadas → /admin/compras?materias-primas=agotadas (🔴 Crítica)
  - MP stock bajo → /admin/materias-primas?stock=bajo (🟡 Importante)
  - Insumos agotados → /admin/compras?insumos=agotados (🔴 Crítica)
  - Insumos stock bajo → /admin/insumos?stock=bajo (🟡 Importante)
  - PT sin receta → /admin/recetas?filtro=sin-receta (🟡 Importante)
  - Recetas vacías → /admin/recetas?filtro=vacia (🟡 Importante)
  - Producción pendiente → /admin/produccion?estado=pendiente (🟡 Importante)
  - PT sin stock → /admin/produccion?productos-sin-stock (🔴 Crítica)
  - PT stock bajo → /admin/productos-terminados?stock=bajo (🟡 Importante)
  - Pedidos pendientes → /admin/pedidos-clientes?estado=pendiente (🔵 Informativa)
  - Reservas activas → /admin/reservas-clientes?estado=activa (🔵 Informativa)
  Si no hay pendientes, muestra "✅ Todo está en orden".
- SECCIÓN 2 "Indicadores Clave": 6 métricas con TENDENCIA vs mes anterior (flecha verde ↑ si subió, roja ↓ si bajó, "sin datos" si no hay comparación). Indicadores: Ventas del Mes ($), Producción del Mes (unidades), Pedidos Pendientes, Reservas Activas, Compras del Mes ($), Stock Crítico (items agotados).
- SECCIÓN 3 "Flujo de Trabajo": 5 etapas del proceso en pipeline: Materias Primas → Recetas → Producción → Stock → Ventas. Cada etapa muestra su estado: ✅ En orden (oliva), ⚠️ Pendiente (mostaza), 🔴 Crítico (rojo). Header con badge "Flujo: X/5 etapas OK". CADA ETAPA ES CLICKEABLE y navega a la sección con filtros aplicados.
- SECCIÓN 4 "Acciones Directas": 8 botones grandes de acceso rápido: Ver productos sin stock, Completar producción, Cargar materias primas, Registrar venta, Gestionar pedidos, Editar recetas, Ver reservas, Generar reporte. Debajo: fila de botones compactos para accesos secundarios.
- TIPOS DE ALERTAS (Pasos Pendientes) — JERARQUÍA DE 3 NIVELES:
  - 🔴 Críticas: MP agotadas, Insumos agotados, PT sin stock (bloquean producción/venta).
  - 🟡 Importantes: MP stock bajo, Insumos stock bajo, PT sin receta, Recetas vacías, Producción pendiente, PT stock bajo.
  - 🔵 Informativas: Pedidos pendientes, Reservas activas.
- Las PÁGINAS DE DESTINO detectan los parámetros URL y muestran los datos PRE-FILTRADOS automáticamente (useSearchParams).
- Endpoint único /api/dashboard agrega todos los datos en 1 consulta (antes 16 fetches paralelos).
- Estados del flujo: ok (sin pendientes), pendiente (stock bajo/producción atrasada), critico (sin stock/sin receta).

21. PROMOCIONES (/admin/promociones)
- Descuentos y ofertas para productos terminados: porcentual (%), monto fijo ($), 2x1 (50% sobre el total) y tiempo limitado (con vigencia).
- Se eligen los productos participantes y la fecha de inicio/fin.
- IMPORTANTE: el BUSCADOR DE PRODUCTOS dentro de Promociones muestra TODOS los productos terminados (activos, inactivos, visibles y no visibles en la landing, con o sin categoría). La búsqueda encuentra coincidencias por NOMBRE, CÓDIGO y CÓDIGO DE BARRAS. Se cargan hasta 500 productos en una sola consulta.
- Las promociones ACTIVAS y dentro de vigencia se muestran AUTOMÁTICAMENTE en la tienda pública (landing page): badge rojo "🔥 XX%" en la tarjeta, precio original tachado y precio final en rojo.
- En la landing hay un filtro "Solo Ofertas" (mutuamente excluyente con los filtros de harina) que muestra solo productos con promoción y oculta las familias sin ofertas.
- El endpoint /api/promociones/public alimenta las tarjetas y el filtro.
- Diferencia clave con Descuentos por Volumen: las PROMOCIONES son públicas (se ven en la web), los DESCUENTOS POR VOLUMEN son internos del panel.

22. DESCUENTOS POR VOLUMEN (/admin/descuentos-volumen)
- Descuentos escalonados por cantidad comprada, ideales para ventas mayoristas.
- Cada descuento define: nombre, ámbito (todos los productos / producto específico / categoría), unidad de medida (kg, u, bandeja, docena, l), rangos de cantidad y vigencia.
- Cada RANGO define: cantidad_desde, cantidad_hasta (null = "en adelante"), tipo (porcentaje o monto fijo) y valor.
- Cálculo: si varios descuentos coinciden para un producto, el sistema aplica el que otorgue el MAYOR beneficio económico. precio_final = máximo(0, precio_original − descuento_aplicado).
- Ejemplo: sorrentinos $2.000/kg. Rango 1: 5 a 9,9 kg → 5% (= $1.900/kg). Rango 2: 10 kg en adelante → 10% (= $1.800/kg).
- El cálculo está disponible vía API: /api/descuentos-volumen/calcular?producto_id=X&cantidad=Y&unidad=kg.
- IMPORTANTE: son de USO INTERNO del panel (no se muestran en la tienda pública). La aplicación es AUTOMÁTICA en los formularios de Venta y Presupuesto: al ingresar la cantidad, el sistema consulta /api/descuentos-volumen/calcular y aplica el mejor descuento, mostrando precio original tachado, % o monto de descuento, y precio final. El descuento se guarda en el detalle (descuento_volumen_id, descuento_volumen_valor, descuento_volumen_tipo). Si el usuario edita el precio manualmente, el descuento se limpia (override).

23. MARGEN DE GANANCIA (visible en /admin/productos-terminados)
- El margen es la diferencia entre el precio de venta y el costo de producción.
- costo_produccion = (suma de costos de ingredientes de la receta activa) / rendimiento (unidades que produce).
- margen_$ = precio_venta − costo_produccion.
- margen_% = (precio_venta − costo_produccion) / precio_venta × 100.
- Código de colores en la tabla de Productos Terminados, columna "Margen":
  - 🟢 Verde > 50%: margen saludable (buena rentabilidad).
  - 🟠 Naranja 30-50%: margen moderado (revisar costos o precio).
  - 🔴 Rojo < 30%: margen bajo (posiblemente pierde dinero).
- Si el producto NO tiene receta activa, el costo se muestra como $0 y el margen como 100% (no es real; hay que asignar una receta).
- Reporte completo en Reportes → Rentabilidad (exportable a Excel/PDF).

24. NAVEGACIÓN Y MENÚ LATERAL
- El menú lateral agrupa los módulos en SECCIONES COLAPSABLES: Stock & Producción, Compras, Ventas, Stock (movimientos), Envíos y Logística, Notificaciones, Configuración, Auditoría & Reportes, Seguridad.
- Un clic en el título de la sección la ABRE (muestra sub-módulos). Otro clic la CIERRA. La flecha cambia de ► a ▼.
- Al navegar a una página, la sección que la contiene se abre automáticamente, pero después se puede cerrar manualmente con un clic.
- El botón SidebarTrigger (icono de menú en la barra superior) oculta/muestra el menú completo.
- El panel de Ayuda (botón "Ayuda" en la barra superior) tiene un buscador que filtra secciones por palabra clave.

25. IMPRESIÓN TÉRMICA DE ETIQUETAS (/admin/etiquetas)
- Generación de etiquetas para impresoras de rollo (Zebra, Brother, etc.) en dos formatos: PDF (una etiqueta por página, tamaño exacto en mm) y ZPL (código nativo Zebra Programming Language para USB/Bluetooth/red).
- 6 tamaños predefinidos: 40x30, 50x30, 60x40, 70x40, 80x50, 100x60 mm.
- Campos configurables: nombre, precio, peso, código de barras (EAN-13 o CODE128), fecha elaboración, fecha vencimiento, categoría.
- Vista previa a escala real antes de generar.
- Impresión por LOTE: múltiples productos con cantidad de copias cada uno.
- Generación 100% client-side (@react-pdf/renderer + jsbarcode), no carga al servidor.
- Botones: Descargar PDF, Descargar .zpl, Copiar al portapapeles.

26. PLANTILLAS DE NOTIFICACIONES (/admin/notificaciones/plantillas)
- Editor de plantillas con MARKDOWN para email y WhatsApp.
- Variables canónicas entre llaves: {cliente}, {pedido}, {fecha}, {total}, {estado}, {producto} (y {stock_actual}, {stock_minimo} para alertas de stock). Compatible con {var} y {{var}}.
- Panel lateral de variables: click para insertar en la posición del cursor; las variables presentes se marcan con ✓.
- Previsualización con datos de ejemplo (estilo email y estilo WhatsApp).
- Envío de PRUEBA a destinatario real antes de activar.
- Activar/desactivar plantillas desde la lista sin borrarlas.
- Las alertas automáticas (stock bajo, recordatorio de entrega) usan las plantillas guardadas; si están desactivadas o no existen, usan un mensaje fallback hardcoded.

27. REPORTES CON FILTROS PERSONALIZADOS (/admin/reportes)
- Componente FiltrosReportes reutilizable: filtro de PERÍODO con presets (Hoy, Ayer, Últimos 7 días, Últimos 30 días, Este mes, Mes anterior, Este año, Personalizado) + filtros específicos por reporte.
- Reporte de VENTAS: filtros por producto, cliente, vendedor + detalle de ventas + ranking por vendedor.
- Reporte de STOCK: filtros por categoría de PT, categoría de MP, proveedor, "solo stock bajo".
- Reporte de PRODUCCIÓN: filtro por producto + detalle de producciones.
- COMPRAS y FINANZAS: filtro de período compartido.
- Exportación a Excel/CSV/PDF respeta los filtros aplicados.
- Endpoint /api/reportes/filtros-opciones: devuelve todas las opciones de selectores en una sola consulta.
- Los filtros se aplican del lado del servidor (la consulta a la BD ya filtra), así el panel es rápido incluso con períodos largos.

28. ACCESO Y CONTRASEÑAS (visibilidad de contraseña)
- En la pantalla de LOGIN (/admin/login) y en el formulario de USUARIOS (crear/editar), el campo de contraseña tiene un TOGGLE DE VISIBILIDAD (ícono de ojo).
- Por defecto la contraseña se oculta; al clic se muestra como texto plano; otro clic la vuelve a ocultar.
- Accesible: aria-label dinámico (Mostrar/Ocultar contraseña), type="button", focus-visible ring.
- Combinar con 2FA (Security → Mi 2FA) para cuentas de administrador.
- Ver también: logs de acceso, sesiones activas, roles y permisos en /admin/seguridad.

29. RECETAS DE COCINA (/admin/recetas-cocina) — MÓDULO INDEPENDIENTE
- Recetas de cocina para mostrar en la LANDING PAGE y exportar/imprimir.
- NO están ligadas a producción, stock ni ventas (son contenido editorial).
- Campos: título (obligatorio), descripción, ingredientes (texto libre), pasos (texto libre), tiempo_preparación, tiempo_coccion, dificultad (facil/media/dificil), imagen, categoria (salsas/pastas/postres/aperitivos/bebidas/otros), visible_en_landing, destacado.
- En el menú lateral está en la sección "Contenido" (ícono: utensilios), separada de "Stock & Producción".
- Las recetas con visible_en_landing=true aparecen en la sección "Recetas" de la página pública (entre "Cómo Pedir" y "Nosotros").
- Las recetas destacadas aparecen primero en la landing.
- Desde la vista de detalle se puede: exportar a PDF, exportar a Word (.docx), exportar a TXT, e imprimir directamente.
- En la tabla de administración se puede alternar visibilidad en landing y destacado con un clic.

30. SISTEMA DE EXPORTACIÓN E IMPRESIÓN (todos los módulos)
- Cada módulo del panel tiene botones de exportación adaptados a su propósito.
- VENTAS: botón de impresión (ícono impresora) en cada fila con menú de 4 opciones:
  * Factura: formato fiscal con datos de empresa (CUIT, dirección, condición IVA), cliente, productos, IVA y total.
  * Ticket: formato estrecho tipo comprobante de caja, simple con lista de productos y total.
  * Remito: formato de entrega/logística con destinatario, transporte, domicilio de entrega y líneas de firma.
  * Orden de Venta: formato interno para despacho, con casillas de verificación e instrucciones.
  * También tiene botón "Excel" para exportar el reporte de ventas.
- PRODUCTOS TERMINADOS: botón "Exportar Excel" con listado completo.
- MOVIMIENTOS DE STOCK: botón "Exportar Excel" con historial de movimientos.
- RECETAS DE COCINA: exportar a PDF, Word (.docx), TXT e imprimir.
- REPORTES: ya incluyen exportación a Excel, CSV y PDF con filtros personalizados.
- PRESUPUESTOS: ya tienen exportación a PDF profesional.
- Librerías: @react-pdf/renderer (PDF), xlsx (Excel), docx (Word), window.print() (impresión directa).

31. DOCUMENTOS Y PLANTILLAS (/admin/configuracion → Documentos)
- Editor de plantillas de documentos: personaliza datos de empresa (nombre, dirección, teléfono, email, CUIT, condición IVA, inicio actividades), logo URL, footer, texto de condiciones, color de acento y QR.
- Tabla ConfigDocumento (singleton id=1). Componente DocumentoConfigEditor + hook useConfigDocumento (client) + getDocumentoConfig (server).
- QR en documentos: Facturas, Órdenes de Compra y Órdenes de Producción incluyen un código QR (esquina inferior derecha) que enlaza a la URL del documento. Toggleable via mostrar_qr + qr_url_base. Usa librería 'qrcode'.

32. ENVÍO DE DOCUMENTOS POR EMAIL (desde /admin/ventas/[id])
- Botón "Enviar por email" en el detalle de Ventas: abre diálogo con destinatario (pre-cargado del cliente) y asunto.
- API /api/documentos/enviar-pdf genera el PDF server-side y lo envía vía Nodemailer (SMTP).
- Requiere variables de entorno: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
- Al enviar, registra en DocumentoGenerado con email_enviado=true y destinatario.

33. HISTORIAL DE DOCUMENTOS (/admin/configuracion → Documentos, parte inferior)
- Registro automático de CADA documento generado (PDF, Excel, etc.).
- Campos: tipo (factura, orden_compra, etc.), entidad_id, entidad_tipo, formato (pdf/excel/word/txt), generado_por (usuario), email_enviado (bool), destinatario, fecha, metadata (JSON).
- Componente DocumentosHistorial con filtro por tipo. API /api/documentos/historial.
- Útil para auditoría y trazabilidad.

34. SISTEMA COMPLETO DE EXPORTACIÓN E IMPRESIÓN (Etapas 1-5, todos los módulos)
- Cada módulo tiene botones de exportación adaptados:
  * VENTAS: Factura, Ticket, Remito, Orden de Venta (4 PDF) + Excel. Botón impresora en cada fila.
  * PRODUCCIÓN: Orden de Producción PDF + impresión.
  * COMPRAS: Orden de Compra PDF + impresión.
  * PEDIDOS CLIENTES: Orden de Pedido + Remito PDF + impresión.
  * PEDIDOS PROVEEDORES: Orden de Pedido PDF + impresión.
  * FICHAS (Producto, Materia Prima, Receta, Persona, Insumo): PDF + impresión + Excel.
  * MOVIMIENTOS DE STOCK: Reporte PDF (horizontal) + Excel.
  * REPORTES (Ventas, Stock, Producción, Compras): PDF + impresión + Excel/CSV.
  * DASHBOARD: Resumen PDF + impresión + Alertas Excel.
  * RESERVAS, LOGS DE ACCESO: Excel.
  * RECETAS DE COCINA: PDF + Word (.docx) + TXT + impresión.
- Componentes reutilizables: FichaPrintMenu, ExcelExportButton, QuickPrintButton, ReporteExportMenu, DashboardPDFExport.
- Helpers compartidos: ficha-shared.ts (FICHA_COLORS, FICHA_EMPRESA, formatCurrency, formatNumber, formatFecha, formatFechaHora).
- Librerías: @react-pdf/renderer (PDF), xlsx (Excel), docx (Word), qrcode (QR), nodemailer (email).
- Patrón de impresión: pdf().toBlob() → iframe oculto → contentWindow.print().
- Patrón de descarga: pdf().toBlob() → <a download>.

35. CAMBIO DE MARCA (versión 19)
- El nombre comercial cambió de "Pastas Orlando" a "El Amigo de las Pastas" en TODOS los documentos PDF.
- Tagline: "Pastas artesanales con sabor a tradición" (debajo del título en documentos comerciales).
- Datos de contacto sin cambios: Tel 3754-419324, email laspastasdeorlando@gmail.com (dominio preservado), CUIT 20-12345678-9, Posadas Misiones.

FLUJO DE TRABAJO RECOMENDADO:FLUJO DE TRABAJO RECOMENDADO:
El Dashboard refleja este flujo en su sección "Flujo de Trabajo" (5 etapas con estado visual ✅/⚠️/🔴):
1. Cargar materias primas e insumos con su stock (etapa "Materias Primas")
2. Crear productos terminados
3. Crear recetas vinculando productos con ingredientes (etapa "Recetas")
4. Cargar stock inicial si es necesario (botón "Cargar Stock")
5. Iniciar y completar producciones (etapa "Producción")
6. Verificar stock disponible (etapa "Stock")
7. Registrar ventas (etapa "Ventas")
8. Consultar reportes y movimientos
Al ingresar al Dashboard, revisar primero los "Pasos Pendientes" para ver qué requiere atención inmediata.

CONCEPTOS CLAVE:
- Stock crítico: cuando stock_actual = 0 (se muestra en rojo)
- Stock bajo: cuando stock_actual < stock_minimo (se muestra en naranja)
- El stock se actualiza automáticamente por producciones y ventas
- "Cargar Stock" es para ajustes manuales, NO reemplaza el flujo de producción
- Los movimientos de stock quedan registrados para auditoría`;

const MAX_HISTORY_MESSAGES = 20;

// ─── FAQ Fallback System ────────────────────────────────────────────────────
// Used when no AI API is available (production without OpenAI key)

interface FaqEntry {
  keywords: string[]
  response: string
}

const FAQ_ENTRIES: FaqEntry[] = [
  {
    keywords: ['crear', 'nuevo', 'producto', 'alta', 'agregar', 'cargar producto'],
    response: `📦 **Cómo crear un producto nuevo:**

1. Ir a **Productos Terminados** (menú lateral: Stock & Producción → Productos Terminados)
2. Hacer clic en el botón **"Nuevo"** (esquina superior derecha)
3. Completar el formulario:
   - **Nombre**: nombre del producto (ej: "Sorrentinos de Ricotta")
   - **Descripción**: detalle del producto
   - **Precio de venta**: precio al público
   - **Categoría**: seleccionar la categoría correspondiente
   - **Código de barras**: si tiene uno
   - **Stock mínimo**: cantidad mínima antes de que se dispare una alerta
4. Hacer clic en **"Guardar"**

💡 **Tip**: Después de crear el producto, creá una receta para poder producirlo.`,
  },
  {
    keywords: ['stock', 'cargar stock', 'carga inicial', 'agregar stock', 'sumar stock', 'stock inicial'],
    response: `📊 **Cómo cargar stock:**

Hay dos formas de cargar stock:

**Opción 1: Carga manual (rápida)**
1. Ir a **Productos Terminados** (o Materias Primas / Insumos)
2. Buscar el producto en la lista
3. Hacer clic en el botón **"Cargar Stock"** (icono de caja con +)
4. Ingresar la cantidad a agregar y una observación
5. Confirmar → el stock se actualiza y se registra un movimiento tipo "Carga inicial"

**Opción 2: A través de producción**
1. Ir a **Producción** → crear una nueva producción
2. Seleccionar la receta y la cantidad a producir
3. Completar la producción → el stock del producto terminado se suma automáticamente

⚠️ **Importante**: "Cargar Stock" es para ajustes manuales. No reemplaza el flujo de producción.`,
  },
  {
    keywords: ['vender', 'venta', 'registrar venta', 'nueva venta'],
    response: `💰 **Cómo registrar una venta:**

1. Ir a **Ventas** (menú lateral: Ventas → Ventas)
2. Hacer clic en **"Nueva Venta"**
3. Seleccionar los **productos terminados** que se venden
4. Ingresar las **cantidades** de cada producto
5. Seleccionar la **forma de pago** (efectivo, transferencia, etc.)
6. Confirmar la venta

✅ Al confirmar, el sistema **descuenta automáticamente el stock** de los productos vendidos y registra el movimiento.

📋 Podés ver el historial de ventas en la misma sección.`,
  },
  {
    keywords: ['stock crítico', 'crítico', 'stock cero', 'sin stock', 'rojo', 'alerta'],
    response: `🚨 **¿Qué significa stock crítico?**

**Stock crítico** = el producto tiene **0 unidades** en stock (stock_actual = 0).

En el sistema se muestra con **color rojo** en la columna de stock.

**Stock bajo** = el stock está por debajo del mínimo definido (stock_actual < stock_minimo). Se muestra en **naranja**.

**Cómo resolverlo:**
1. Usá el botón **"Cargar Stock"** para una carga manual rápida
2. O completá una **producción** para sumar stock automáticamente
3. También podés comprar materias primas/insumos si el problema es de abastecimiento

💡 En el **Dashboard** verás alertas con los productos en stock crítico o bajo.`,
  },
  {
    keywords: ['receta', 'crear receta', 'nueva receta', 'ingredientes'],
    response: `📖 **Cómo crear una receta:**

1. Ir a **Recetas** (menú lateral: Stock & Producción → Recetas)
2. Hacer clic en **"Nueva Receta"**
3. Completar:
   - **Producto terminado**: seleccionar qué producto se va a producir
   - **Ingredientes**: agregar materias primas con sus cantidades
   - **Insumos**: agregar insumos necesarios (bandejas, bolsas, etc.)
4. Definir las **cantidades exactas** de cada ingrediente por unidad producida
5. Guardar la receta

🔗 La receta vincula el producto con sus ingredientes, y se usa en **Producción** para calcular automáticamente cuánto se necesita.`,
  },
  {
    keywords: ['producción', 'producir', 'fabricar', 'iniciar producción', 'completar producción'],
    response: `🏭 **Cómo registrar una producción:**

1. Ir a **Producción** (menú lateral: Stock & Producción → Producción)
2. Hacer clic en **"Nueva Producción"**
3. Seleccionar una **receta existente**
4. Ingresar la **cantidad a producir**
5. Hacer clic en **"Iniciar Producción"**
   - El sistema verifica que haya stock suficiente de materias primas e insumos
6. Cuando la producción termine, hacer clic en **"Completar"**
   - Se descuenta el stock de MP e insumos consumidos
   - Se suma el stock del producto terminado generado
   - Se registran todos los movimientos automáticamente

📋 Estados: Pendiente → En proceso → Completada / Cancelada`,
  },
  {
    keywords: ['compra', 'comprar', 'proveedor', 'registrar compra'],
    response: `🛒 **Cómo registrar una compra:**

1. Ir a **Compras** (menú lateral: Compras → Compras)
2. Hacer clic en **"Nueva Compra"**
3. Seleccionar el **proveedor** (persona)
4. Agregar los items comprados (materias primas e insumos)
5. Ingresar cantidades y precios
6. Confirmar la compra

✅ Al confirmar, el sistema **suma automáticamente el stock** de los items comprados y registra el movimiento.`,
  },
  {
    keywords: ['pedido', 'cliente', 'pedido de cliente'],
    response: `📋 **Cómo gestionar pedidos de clientes:**

1. Ir a **Pedidos de Clientes** (menú lateral: Ventas → Pedidos de Clientes)
2. Hacer clic en **"Nuevo Pedido"**
3. Seleccionar el cliente y agregar los productos
4. Definir cantidades y precios
5. Guardar el pedido

**Estados del pedido:**
- 🟡 Pendiente → 🟠 En proceso → 🟢 Listo → ✅ Entregado
- ❌ Cancelado

💡 También podés convertir un **presupuesto** en pedido automáticamente.`,
  },
  {
    keywords: ['presupuesto', 'cotización', 'cotizar'],
    response: `📝 **Cómo crear un presupuesto:**

1. Ir a **Presupuestos** (menú lateral: Ventas → Presupuestos)
2. Hacer clic en **"Nuevo Presupuesto"**
3. Seleccionar el cliente
4. Agregar productos terminados con cantidades y precios
5. Guardar como **Borrador** o **Enviar**

**Estados:**
- 📝 Borrador → 📤 Enviado → ✅ Aceptado / ❌ Rechazado

💡 Un presupuesto aceptado se puede **convertir en pedido de cliente** con un clic.`,
  },
  {
    keywords: ['reserva', 'reservar', 'seña'],
    response: `📅 **Cómo gestionar reservas:**

1. Ir a **Reservas de Clientes** (menú lateral: Ventas → Reservas)
2. Hacer clic en **"Nueva Reserva"**
3. Seleccionar el cliente, productos y fecha
4. Registrar la seña (monto anticipado)
5. Confirmar la reserva

Las reservas permiten asegurar productos con un pago anticipado.`,
  },
  {
    keywords: ['movimiento', 'historial', 'auditoría', 'trazabilidad', 'movimientos de stock'],
    response: `📊 **Movimientos de Stock:**

1. Ir a **Movimientos** (menú lateral: Stock → Movimientos)
2. Ahí verás el historial completo de todos los movimientos

**Tipos de movimiento:**
- 📦 Carga inicial: ajustes manuales con "Cargar Stock"
- 🏭 Producción: stock generado al completar producciones
- 💰 Venta: stock descontado al registrar ventas
- 🛒 Compra: stock sumado al confirmar compras
- ⚙️ Ajuste: correcciones manuales

Todos los movimientos quedan registrados para auditoría y trazabilidad.`,
  },
  {
    keywords: ['reporte', 'informe', 'exportar', 'excel', 'pdf'],
    response: `📈 **Cómo generar reportes:**

1. Ir a **Reportes** (menú lateral: Auditoría & Reportes → Reportes Generales)
2. Seleccionar el tipo de reporte:
   - Producción, Ventas, Finanzas, Stock, Compras
3. Configurar filtros (fechas, categorías, etc.)
4. Generar el reporte
5. **Exportar** a Excel o PDF

**Reportes especiales:**
- Compras Pendientes
- Hoja de Ruta
- Pedidos del Día`,
  },
  {
    keywords: ['usuario', 'permiso', 'rol', 'acceso', '2fa', 'doble factor'],
    response: `🔐 **Gestión de usuarios y seguridad:**

**Usuarios:**
1. Ir a **Usuarios** (menú lateral: Personas → Usuarios)
2. Crear usuario con email y contraseña
3. Asignar roles y permisos

**Seguridad:**
- **2FA**: Ir a Mi 2FA para activar autenticación de doble factor
- **Logs de acceso**: ver quién ingresó y cuándo
- **Sesiones**: ver sesiones activas
- **Roles y Permisos**: configurar qué puede hacer cada rol

💡 Es recomendable activar 2FA para cuentas de administrador.`,
  },
  {
    keywords: ['notificación', 'alerta', 'avisar', 'configurar alerta'],
    response: `🔔 **Sistema de notificaciones:**

1. Ir a **Notificaciones** (menú lateral)
2. Secciones disponibles:
   - **Plantillas**: crear plantillas de mensajes
   - **Historial**: ver notificaciones enviadas
   - **Alertas**: configurar alertas automáticas (ej: stock bajo)
   - **Enviar Manual**: enviar notificaciones manuales

Las alertas de stock bajo se configuran con el stock_minimo de cada producto.`,
  },
  {
    keywords: ['categoría', 'marca', 'unidad', 'medida', 'configuración'],
    response: `⚙️ **Configuración del sistema:**

1. Ir a **Configuración** (menú lateral)
2. Secciones:
   - **Categorías**: organizar productos y materias primas
   - **Marcas**: marcas de productos
   - **Unidades de Medida**: kg, gr, unidades, litros, etc.
   - **General**: configuración general del sistema

💡 Configurá las categorías y unidades de medida ANTES de cargar productos para tener todo organizado.`,
  },
  {
    keywords: ['materia prima', 'ingrediente', 'harina', 'huevo', 'queso'],
    response: `🌿 **Cómo gestionar materias primas:**

1. Ir a **Materias Primas** (menú lateral: Stock & Producción → Materias Primas)
2. Hacer clic en **"Nueva"** para agregar una materia prima
3. Completar nombre, unidad de medida, stock actual y stock mínimo
4. Guardar

El stock se actualiza automáticamente:
- **Suma** al confirmar compras
- **Descuenta** al completar producciones (consumo)

También podés usar **"Cargar Stock"** para ajustes manuales.`,
  },
  {
    keywords: ['insumo', 'envase', 'bandeja', 'bolsa', 'caja'],
    response: `📦 **Cómo gestionar insumos:**

1. Ir a **Insumos** (menú lateral: Stock & Producción → Insumos)
2. Hacer clic en **"Nuevo"** para agregar un insumo
3. Completar nombre, tipo, stock actual y stock mínimo
4. Guardar

Los insumos son envases, bandejas, bolsas, cajas, etiquetas, etc.

El stock se descuenta automáticamente al completar producciones.
Usá **"Cargar Stock"** para ajustes manuales.`,
  },
  {
    keywords: ['flujo', 'paso a paso', 'empezar', 'comenzar', 'cómo uso', 'cómo se usa', 'tutorial', 'guía'],
    response: `🚀 **Flujo de trabajo recomendado (paso a paso):**

**Paso 1: Configuración inicial**
- Ir a Configuración → crear categorías y unidades de medida

**Paso 2: Cargar materias primas e insumos**
- Ir a Materias Primas → cargar ingredientes con su stock
- Ir a Insumos → cargar envases y packaging con su stock

**Paso 3: Crear productos terminados**
- Ir a Productos Terminados → cargar los productos con precio de venta

**Paso 4: Crear recetas**
- Ir a Recetas → vincular cada producto con sus ingredientes

**Paso 5: Cargar stock inicial (si es necesario)**
- Usar "Cargar Stock" en cada producto terminado para tener stock inicial
- O producir directamente (siguiente paso)

**Paso 6: Producir**
- Ir a Producción → seleccionar receta → iniciar → completar
- Al completar: se suma stock de productos y se descuenta MP/insumos

**Paso 7: Vender**
- Ir a Ventas → registrar la venta
- Se descuenta el stock automáticamente

**Paso 8: Monitorear**
- Dashboard → ver alertas de stock
- Reportes → analizar ventas, producciones, finanzas`,
  },
  {
    keywords: ['logística', 'entrega', 'punto de encuentro', 'mapa', 'envío'],
    response: `🚚 **Logística y entregas:**

1. Ir a **Logística** (menú lateral: Envíos y Logística)
2. Secciones:
   - **Entregas**: gestionar entregas de pedidos
   - **Puntos de Encuentro**: configurar lugares de entrega
   - **Mapa de Entregas**: ver entregas en el mapa
   - **Mapa de Proveedores**: ver proveedores en el mapa

Las entregas se vinculan con los pedidos de clientes.`,
  },
  {
    keywords: ['opinión', 'reseña', 'moderar'],
    response: `⭐ **Moderación de opiniones:**

1. Ir a **Opiniones** (menú lateral: Personas → Opiniones)
2. Ver las opiniones recibidas
3. Aprobar o rechazar cada opinión
4. Las opiniones aprobadas se muestran en la landing page pública`,
  },
  {
    keywords: ['dashboard', 'panel', 'inicio', 'estadísticas', 'cómo uso el dashboard', 'como uso el dashboard', 'pantalla principal'],
    response: `📊 **Dashboard con jerarquía visual de 3 niveles** (menú: Inicio → Dashboard, o \`/admin/dashboard\`)

El Dashboard te **guía sobre qué hacer** con una jerarquía visual de 3 niveles de severidad y alertas ordenadas por flujo de trabajo. Tiene 4 secciones:

**1. Pasos Pendientes (arriba, prioridad alta)**
Muestra las alertas que requieren acción, con **3 niveles de severidad visual**:
- 🔴 **Críticas** (rojo): bloquean producción o venta — acción inmediata
- 🟡 **Importantes** (mostaza): no bloquean pero conviene resolver pronto
- 🔵 **Informativas** (celeste): información útil, no requieren resolución inmediata

Las alertas se ordenan por **flujo de trabajo**: Materias Primas → Recetas → Producción → Stock → Ventas.

CADA alerta tiene un **botón directo con filtro** que lleva a la página con datos pre-filtrados:
- "MP agotadas" → \`/admin/compras?materias-primas=agotadas\` (🔴)
- "MP stock bajo" → \`/admin/materias-primas?stock=bajo\` (🟡)
- "Insumos agotados" → \`/admin/compras?insumos=agotados\` (🔴)
- "Insumos stock bajo" → \`/admin/insumos?stock=bajo\` (🟡)
- "PT sin receta" → \`/admin/recetas?filtro=sin-receta\` (🟡)
- "Recetas vacías" → \`/admin/recetas?filtro=vacia\` (🟡)
- "Producción pendiente" → \`/admin/produccion?estado=pendiente\` (🟡)
- "PT sin stock" → \`/admin/produccion?productos-sin-stock\` (🔴)
- "PT stock bajo" → \`/admin/productos-terminados?stock=bajo\` (🟡)
- "Pedidos pendientes" → \`/admin/pedidos-clientes?estado=pendiente\` (🔵)
- "Reservas activas" → \`/admin/reservas-clientes?estado=activa\` (🔵)

Si no hay pendientes, ves "✅ Todo está en orden".

**2. Indicadores Clave (al medio)**
6 métricas con **tendencia vs mes anterior** (flecha verde ↑ si subió, roja ↓ si bajó):
- Ventas del Mes ($), Producción del Mes (unidades), Pedidos Pendientes, Reservas Activas, Compras del Mes ($), Stock Crítico.

**3. Flujo de Trabajo (al medio)**
Pipeline de 5 etapas: **Materias Primas → Recetas → Producción → Stock → Ventas**.
Cada etapa tiene un estado visual:
- ✅ En orden (verde oliva) — sin pendientes
- ⚠️ Pendiente (mostaza) — hay stock bajo o producción atrasada
- 🔴 Crítico (rojo) — hay items agotados o sin receta
El header muestra "Flujo: X/5 etapas OK". **Cada etapa es clickeable** y te lleva a la sección con filtros.

**4. Acciones Directas (abajo)**
8 botones grandes: Ver productos sin stock, Completar producción, Cargar materias primas, Registrar venta, Gestionar pedidos, Editar recetas, Ver reservas, Generar reporte.

💡 **Cómo usarlo paso a paso:**
1. Revisá los **Pasos Pendientes** — las 🔴 críticas primero (botones con filtro).
2. Mirá los **Indicadores Clave** para ver si ventas/producción suben o bajan.
3. Identificá qué etapa del **Flujo de Trabajo** tiene ⚠️ o 🔴 — hacé clic en la etapa para ir directo.
4. Usá las **Acciones Directas** para tareas frecuentes (más rápido que el menú lateral).`,
  },
  {
    keywords: ['qué significa cada alerta', 'que significa cada alerta', 'tipos de alerta', 'alertas dashboard', 'crítica media', 'critica media', 'severidad alerta', 'colores alerta'],
    response: `🔔 **Tipos de alertas en el Dashboard (jerarquía de 3 niveles)**

El Dashboard muestra alertas en **"Pasos Pendientes"** con **3 niveles de severidad visual**, ordenadas por flujo de trabajo (Materias Primas → Recetas → Producción → Stock → Ventas):

**🔴 Críticas (bloquean producción o venta — acción inmediata):**
- **MP agotadas**: materias primas con stock = 0. Botón: \`/admin/compras?materias-primas=agotadas\`
- **Insumos agotados**: insumos con stock = 0. Botón: \`/admin/compras?insumos=agotados\`
- **PT sin stock**: productos terminados con stock = 0. Botón: \`/admin/produccion?productos-sin-stock\`

**🟡 Importantes (no bloquean pero conviene resolver pronto):**
- **MP stock bajo**: MP con stock ≤ stock_minimo. Botón: \`/admin/materias-primas?stock=bajo\`
- **Insumos stock bajo**: insumos con stock ≤ stock_minimo. Botón: \`/admin/insumos?stock=bajo\`
- **PT sin receta**: productos sin receta asociada. Botón: \`/admin/recetas?filtro=sin-receta\`
- **Recetas vacías**: recetas sin ingredientes. Botón: \`/admin/recetas?filtro=vacia\`
- **Producción pendiente**: producciones pendientes >2 días. Botón: \`/admin/produccion?estado=pendiente\`
- **PT stock bajo**: PT con stock ≤ stock_minimo. Botón: \`/admin/productos-terminados?stock=bajo\`

**🔵 Informativas (información útil, no requieren resolución):**
- **Pedidos pendientes**: pedidos de clientes sin entregar. Botón: \`/admin/pedidos-clientes?estado=pendiente\`
- **Reservas activas**: reservas vigentes con seña. Botón: \`/admin/reservas-clientes?estado=activa\`

💡 **Cómo usarlo:** los botones de cada alerta llevan a la página de destino con los datos **pre-filtrados** — no tenés que buscar nada, ya te muestra solo lo que necesitás ver. Resolvé primero las 🔴 críticas (bloquean el negocio), después las 🟡 importantes. Las 🔵 informativas son para tu información.`,
  },
  {
    keywords: ['completar producción', 'completar produccion', 'finalizar producción', 'finalizar produccion', 'producción pendiente', 'produccion pendiente', 'producción atrasada', 'produccion atrasada'],
    response: `🏭 **Cómo completar una producción pendiente**

1. Ir a **Producción** (menú: Stock & Producción → Producción, o botón "Completar producción" en el Dashboard → Acciones Directas)
2. Buscar la producción con estado **Pendiente** o **En proceso** (filtro por estado)
3. Hacer clic en la producción para ver el detalle
4. Verificar que haya **stock suficiente** de todas las materias primas e insumos de la receta
   - Si falta stock, el sistema te avisará y no te dejará completar
5. Hacer clic en **"Completar"** o **"Finalizar producción"**
6. Al completar:
   - Se **descuenta** el stock de materias primas e insumos consumidos
   - Se **suma** el stock de productos terminados generados
   - Se registran los movimientos de stock automáticamente
   - Se calcula el costo total de la producción

⚠️ **En el Dashboard:** las producciones pendientes hace más de 2 días aparecen como **Pasos Pendientes** (⚠️ Media) con el botón "Completar producción". La etapa "Producción" del Flujo de Trabajo se marca como ⚠️ Pendiente si hay producciones atrasadas.

💡 Si no podés completar porque falta stock, registrá una **compra** primero (botón "Cargar materias primas" en el Dashboard).`,
  },
  {
    keywords: ['ver productos sin stock', 'productos sin stock', 'productos agotados', 'stock cero', 'sin stock', 'productos sin stock dashboard'],
    response: `📦 **Cómo ver los productos sin stock**

**Desde el Dashboard (más rápido):**
1. En la sección **"Pasos Pendientes"**, buscar la alerta "Productos sin stock" (🔴 Crítica)
2. Hacer clic en el botón **"Ver productos sin stock"**
3. Se abre la lista de productos terminados filtrada (solo los que tienen stock = 0)

**Desde el menú lateral:**
1. Ir a **Productos Terminados** (menú: Stock & Producción → Productos Terminados)
2. Usar el filtro rápido **"Stock = 0"** (botón en la parte superior de la tabla)

**Para resolver un producto sin stock:**
1. Verificar que el producto tenga una **receta activa** (si no, crearla primero)
2. Verificar que haya **stock suficiente** de las materias primas e insumos de la receta
3. Ir a **Producción** → "Nueva producción" → seleccionar la receta → cantidad → iniciar → completar
4. Al completar la producción, el stock del producto terminado se actualiza automáticamente

💡 En el Dashboard, la etapa **"Stock PT"** del Flujo de Trabajo se marca como 🔴 Crítico si hay productos agotados, o ⚠️ Pendiente si hay stock bajo.`,
  },
  {
    keywords: ['flujo de trabajo dashboard', 'etapas flujo', 'materias primas recetas producción stock ventas', 'pipeline dashboard', 'estados del flujo', 'que significa cada etapa'],
    response: `🔄 **Flujo de Trabajo del Dashboard**

El Dashboard muestra el proceso completo del negocio en 5 etapas: **Materias Primas → Recetas → Producción → Stock → Ventas**

Cada etapa tiene un estado visual:
- ✅ **En orden** (verde oliva): no hay pendientes en esta etapa
- ⚠️ **Pendiente** (mostaza): hay items que requieren atención
- 🔴 **Crítico** (rojo): hay items agotados o bloqueantes

**Qué significa cada etapa:**
1. **Materias Primas**: stock de MP e insumos. 🔴 si hay agotados, ⚠️ si hay stock bajo.
2. **Recetas**: PT con receta asociada. 🔴 si hay PT sin receta, ⚠️ si hay recetas vacías.
3. **Producción**: producciones en curso. ⚠️ si hay pendientes >2 días.
4. **Stock PT**: stock de productos terminados. 🔴 si hay agotados, ⚠️ si hay stock bajo.
5. **Ventas**: ventas del mes. ⚠️ si no hubo ventas este mes, ✅ si hubo.

El header muestra **"Flujo: X/5 etapas OK"** — cuántas etapas están en ✅.

**Cada etapa es CLICKEABLE:** hacé clic en cualquier etapa del flujo para navegar directamente a la sección correspondiente con los filtros aplicados según su estado.

💡 **Cómo usarlo:** mirá qué etapa tiene ⚠️ o 🔴 — esa es tu próxima acción. Si "Recetas" está en 🔴, no podés producir esos productos hasta crearles receta. Hacé clic en la etapa para ir directo a resolverlo.`,
  },
  {
    keywords: ['descuento por volumen', 'descuentos por volumen', 'mayorista', 'rango', 'cantidad', 'volumen', 'escalona'],
    response: `📊 **Descuentos por Volumen** (menú: Ventas → Descuentos por Volumen)

Permiten ofrecer descuentos escalonados según la cantidad comprada, ideal para mayoristas.

**Cómo crear uno (paso a paso):**
1. Ir a **Ventas → Descuentos por Volumen** → clic en **"Nuevo Descuento"**
2. Nombre (ej: "Mayorista Sorrentinos") y descripción opcional
3. Elegir **ámbito**: todos los productos / producto específico / categoría
4. Elegir **unidad de medida**: kg, unidades, bandejas, docenas o litros
5. Definir los **rangos** (cantidad desde, cantidad hasta, tipo y valor)
6. Opcional: fecha de inicio/fin. Activar y guardar

**Ejemplo con 2 rangos** (sorrentinos $2.000/kg):
- Rango 1: 5 a 9,9 kg → 5% OFF → pagás $1.900/kg
- Rango 2: 10 kg en adelante → 10% OFF → pagás $1.800/kg

**Tipos de descuento por rango:**
- **Porcentaje (%)**: se calcula sobre el precio de venta
- **Monto fijo ($)**: se resta directamente del precio

**Cálculo:** si varios descuentos coinciden, se aplica el que dé **mayor beneficio** al cliente. El precio nunca queda negativo.

✅ **Integrado:** son de **uso interno del panel** (no se ven en la tienda pública). La aplicación es AUTOMÁTICA en los formularios de Venta y Presupuesto: al ingresar la cantidad, el sistema consulta \`/api/descuentos-volumen/calcular\` y aplica el mejor descuento, mostrando precio original tachado, % o monto de descuento, y precio final. El descuento se persiste en el detalle (\`descuento_volumen_id\`, \`descuento_volumen_valor\`, \`descuento_volumen_tipo\`). Si el usuario edita el precio manualmente, el descuento se limpia (override).`,
  },
  {
    keywords: ['promoción', 'promocion', 'oferta', 'descuento publico', '2x1', 'badge oferta', 'solo ofertas', 'tienda pública', 'landing'],
    response: `🏷️ **Promociones** (menú: Ventas → Promociones)

Permiten crear descuentos y ofertas para tus productos terminados.

**Tipos:**
- **Porcentual (%)**: ej. 15% OFF en sorrentinos
- **Monto fijo ($)**: ej. $500 OFF en ravioles
- **2x1**: 50% de descuento sobre el total
- **Tiempo limitado**: con fecha de inicio y fin

**Cómo crear una (paso a paso):**
1. Ir a **Ventas → Promociones** → clic en **"Nueva Promoción"**
2. Elegir tipo de descuento y valor
3. Seleccionar los productos participantes
4. Definir vigencia (fecha inicio/fin)
5. Activar y guardar

**En la tienda pública (landing) se ve así:**
- Badge rojo "🔥 XX%" en la esquina de la tarjeta del producto (con animación)
- Precio original **tachado** en gris
- Precio final en **rojo** y negrita
- Hay un filtro **"Solo Ofertas"** que muestra solo productos con promoción (es mutuamente excluyente con los filtros de harina)

💡 **Diferencia clave:** las promociones son **públicas** (se ven en la web), los descuentos por volumen son **internos** del panel.`,
  },
  {
    keywords: ['margen', 'ganancia', 'rentabilidad', 'costo de producción', 'margen de ganancia', 'color margen'],
    response: `💰 **Margen de Ganancia** (visible en Productos Terminados)

El margen es la diferencia entre el precio de venta y el costo de producción.

**Cálculo:**
- **Costo de producción** = (costo total de ingredientes de la receta activa) ÷ rendimiento (unidades que produce)
- **Margen $** = precio_venta − costo_produccion
- **Margen %** = (precio_venta − costo_produccion) ÷ precio_venta × 100

**Código de colores** en la columna "Margen" de la tabla de Productos Terminados:
- 🟢 **Verde > 50%**: margen saludable — buena rentabilidad
- 🟠 **Naranja 30-50%**: margen moderado — revisar costos o precio
- 🔴 **Rojo < 30%**: margen bajo — posiblemente pierde dinero

**Ejemplo:** sorrentinos, receta con costo total $1.200 para 4 unidades → costo unitario $300. Precio de venta $800.
- Margen $ = $800 − $300 = **$500**
- Margen % = ($500 ÷ $800) × 100 = **62,5%** → 🟢 saludable

⚠️ Si el producto **no tiene receta activa**, el costo se muestra como $0 y el margen como 100% (no es real; asigná una receta para ver datos correctos).

📊 Para un análisis completo de todos los productos, usá **Reportes → Rentabilidad** (exportable a Excel/PDF).`,
  },
  {
    keywords: ['menú lateral', 'menu lateral', 'colapsar', 'expandir', 'abrir sección', 'cerrar sección', 'navegar', 'sidebar', 'sección del menú', 'seccion del menu'],
    response: `📂 **Navegación y Menú Lateral**

El menú lateral agrupa los módulos en **secciones colapsables**: Stock & Producción, Compras, Ventas, Stock (movimientos), Envíos y Logística, Notificaciones, Configuración, Auditoría & Reportes, Seguridad.

**Cómo usarlo:**
1. **Un clic** en el título de la sección (ej: "Ventas") → la **abre** y muestra sus sub-módulos. La flecha cambia de ► a ▼.
2. **Otro clic** en el mismo título → la **cierra**.
3. Podés tener varias secciones abiertas a la vez, o ninguna.
4. Al navegar a una página, la sección que la contiene se **abre automáticamente** — pero después la podés cerrar con un clic.

💡 **Ocultar el menú completo:** usá el botón **SidebarTrigger** (icono de menú en la barra superior izquierda). Útil en pantallas chicas.

🔍 **Buscador de ayuda:** el botón "Ayuda" (barra superior) abre un panel con buscador que filtra las secciones por palabra clave.`,
  },
  {
    keywords: ['etiqueta', 'etiquetas', 'impresora térmica', 'zebra', 'zpl', 'codigo zpl', 'rollo', 'etiqueta pdf', 'termica', 'termicas', 'imprimir etiqueta', 'etiqueta producto'],
    response: `🏷️ **Impresión Térmica de Etiquetas** (menú: Configuración → Etiquetas)

Permite generar etiquetas para impresoras de rollo (Zebra, Brother, etc.) directamente desde el panel.

**Dos formatos de salida:**
- **PDF**: una etiqueta por página, tamaño exacto en mm. Listo para imprimir desde cualquier PC.
- **ZPL**: código nativo Zebra Programming Language para envío directo por USB/Bluetooth/red.

**6 tamaños predefinidos:** 40×30, 50×30, 60×40, 70×40, 80×50, 100×60 mm.

**Campos configurables** (elegís cuáles incluir):
- Nombre, precio, peso, código de barras (EAN-13 o CODE128), fecha elaboración, fecha vencimiento, categoría.

**Cómo generar (paso a paso):**
1. Ir a **Configuración → Etiquetas** (o desde la fila de un producto)
2. Elegir el tamaño según el rollo cargado en la impresora
3. Marcar los campos a incluir
4. Agregar productos al lote (uno o varios, con cantidad de copias cada uno)
5. Revisar la **vista previa a escala real**
6. Elegir **Descargar PDF** (imprimir desde cualquier PC) o **Descargar ZPL / Copiar al portapapeles** (envío directo a Zebra)

💡 La generación es **100 % client-side** (no carga al servidor). Usa \`@react-pdf/renderer\` para PDF y \`jsbarcode\` para los códigos de barras.`,
  },
  {
    keywords: ['plantilla', 'plantillas', 'plantilla notificación', 'plantilla notificacion', 'plantilla email', 'plantilla whatsapp', 'markdown notificación', 'variable plantilla', 'personalizar mensaje', 'personalizar notificación', 'editar plantilla'],
    response: `🔔 **Plantillas de Notificaciones** (menú: Notificaciones → Plantillas)

Permiten personalizar los mensajes que el sistema envía por email y WhatsApp, con **Markdown** y **variables canónicas**.

**Características del editor:**
- Toggle **Editar / Vista Markdown** (renderiza títulos, negritas, listas)
- **Panel de variables** con click para insertar en la posición del cursor
- Variables detectadas marcadas con ✓
- Previsualización con datos de ejemplo (estilo email y WhatsApp)
- Envío de **prueba** a un destinatario real
- Activar/desactivar plantillas desde la lista sin borrarlas

**Variables canónicas** (entre llaves):
\`{cliente}\`, \`{pedido}\`, \`{fecha}\`, \`{total}\`, \`{estado}\`, \`{producto}\`
Para alertas de stock además: \`{stock_actual}\`, \`{stock_minimo}\`.
Compatible con \`{var}\` y \`{{var}}\`.

**Cómo personalizar (paso a paso):**
1. Ir a **Notificaciones → Plantillas**
2. Clic en la plantilla a editar (stock bajo, recordatorio de entrega, etc.)
3. Escribir el mensaje en Markdown, insertando variables desde el panel lateral
4. Previsualizar (vista Markdown y vista con datos de ejemplo)
5. Opcional: enviar prueba a un destinatario real
6. Guardar y **activar**

⚠️ Si una plantilla está desactivada o no existe, el sistema usa un mensaje predeterminado (fallback). Desactivar nunca rompe el envío.`,
  },
  {
    keywords: ['filtro reporte', 'filtros reporte', 'filtro personalizado', 'periodo reporte', 'período reporte', 'filtrar ventas', 'filtrar stock', 'filtrar produccion', 'filtrar producción', 'reporte por fecha', 'reporte por cliente', 'reporte por vendedor', 'reporte por producto', 'presets reporte'],
    response: `📊 **Filtros Personalizados en Reportes** (menú: Auditoría & Reportes → Reportes Generales)

Los reportes ahora incluyen un componente de filtros potente para acotar la información.

**Filtro de período con presets** (un clic):
Hoy, Ayer, Últimos 7 días, Últimos 30 días, Este mes, Mes anterior, Este año, **Personalizado** (calendarios desde/hasta).

**Filtros por reporte:**
- **Ventas**: producto, cliente, vendedor + detalle + ranking por vendedor
- **Stock**: categoría de PT, categoría de MP, proveedor, "solo stock bajo"
- **Producción**: producto + detalle de producciones
- **Compras / Finanzas**: filtro de período compartido

**Cómo usarlos (paso a paso):**
1. Ir a **Reportes Generales** y elegir la pestaña (Ventas, Stock, Producción, etc.)
2. Aplicar el **período** (preset o personalizado)
3. Aplicar **filtros específicos** (producto, cliente, vendedor, categoría, proveedor) — combinables
4. Ver resultados y **exportar** a Excel/CSV/PDF (la exportación respeta los filtros)

💡 Los filtros se aplican **del lado del servidor** en la consulta a la base de datos, así el panel es rápido incluso con períodos largos. El endpoint \`/api/reportes/filtros-opciones\` carga todas las opciones de los selectores en una sola consulta.`,
  },
  {
    keywords: ['ver contraseña', 'mostrar contraseña', 'ojo contraseña', 'toggle contraseña', 'ocultar contraseña', 'ver password', 'no veo la contraseña', 'contraseña login', 'contraseña usuario', 'ícono ojo', 'icono ojo'],
    response: `👁️ **Visibilidad de Contraseña**

En la pantalla de **login** y en el formulario de **creación/edición de usuarios**, el campo de contraseña tiene un **toggle de visibilidad** (ícono de ojo) que te deja ver el texto que estás escribiendo.

**Cómo funciona:**
- Por defecto la contraseña se **oculta** (puntos)
- Clic en el ojo → se **muestra** como texto plano
- Otro clic → se vuelve a **ocultar**
- \`aria-label\` dinámico (Mostrar/Ocultar contraseña) para lectores de pantalla

**Dónde aparece:**
- **Login** (\`/admin/login\`): campo de contraseña, ojo a la derecha
- **Usuarios** (Personas → Usuarios → Nuevo/Editar): en el campo de contraseña y en el de confirmación

💡 **Tip móvil:** los teclados predictivos suelen autocorregir o capitalizar la primera letra. Mostrar la contraseña momentáneamente ayuda a detectar estos problemas antes de quedar bloqueado por intentos fallidos.

🔐 Para más seguridad, activá **2FA** en Seguridad → Mi 2FA (recomendado para administradores).`,
  },
  {
    keywords: ['buscador promociones', 'buscar producto promocion', 'no aparecen todos los productos', 'productos inactivos promocion', 'producto sin categoria promocion', 'producto no visible promocion', 'promocion todos los productos', 'buscador no muestra', 'codigo de barras promocion'],
    response: `🔍 **Buscador de Promociones** (muestra TODOS los productos)

Al crear o editar una promoción, el selector de productos ahora lista **TODOS** los productos terminados, sin filtrar por estado, visibilidad o categoría.

**Qué incluye:**
- Productos **activos** e **inactivos**
- Productos **visibles** y **no visibles** en la landing
- Productos **con y sin categoría**
- Productos **con y sin código de barras**

**Búsqueda:** encuentra coincidencias por **nombre**, **código** y **código de barras**. Se cargan hasta 500 productos en una sola consulta.

**Cómo usarlo:**
1. Ir a **Ventas → Promociones → Nueva Promoción** (o editar una existente)
2. En el campo de búsqueda, tipear nombre, código o código de barras
3. Seleccionar los productos participantes
4. Completar tipo de descuento, valor y vigencia
5. Activar y guardar

⚠️ **Antes** el buscador solo mostraba productos activos (filtraba con \`?estado=true\`), lo que ocultaba inactivos, no visibles y sin categoría. **Ahora está corregido** y muestra todos.

💡 Diferencia clave: las **promociones** son públicas (se ven en la tienda), los **descuentos por volumen** son internos del panel.`,
  },
  {
    keywords: ['enviar email', 'enviar factura', 'enviar documento', 'email documento', 'enviar pdf', 'factura email', 'enviar por email', 'mail factura'],
    response: `📧 **Cómo enviar un documento por email**

Desde el **detalle de una Venta** podés enviar la **Factura en PDF** directamente por email:

1. Ir a **Ventas** → hacer clic en la venta (botón ojo o fila)
2. En el header de la página de detalle, clic en el botón **"Enviar por email"** (ícono sobre)
3. Se abre un diálogo:
   - **Destinatario**: email del cliente (pre-cargado si el cliente tiene email)
   - **Asunto**: opcional, personalizable
4. Confirmar → el sistema genera el PDF en el servidor, lo adjunta y envía vía SMTP
5. El envío queda registrado en el **Historial de Documentos** con \`email_enviado = true\`

⚠️ **Requiere configuración SMTP** en el servidor (variables \`SMTP_HOST\`, \`SMTP_PORT\`, \`SMTP_USER\`, \`SMTP_PASS\`, \`SMTP_FROM\`). Si no están configuradas, el envío fallará con un error.

💡 Esta funcionalidad está disponible actualmente desde el detalle de **Ventas**. Próximamente se extenderá a otros módulos.`,
  },
  {
    keywords: ['código qr', 'codigo qr', 'qr documento', 'qr factura', 'qr orden compra', 'qr orden produccion', 'para qué sirve qr', 'para que sirve qr', 'desactivar qr', 'activar qr'],
    response: `📱 **Códigos QR en documentos**

Los siguientes documentos incluyen un **código QR** en la esquina inferior derecha que, al escanearlo, abre la URL del documento en el sistema:

- **Facturas** (Ventas)
- **Órdenes de Compra** (Compras)
- **Órdenes de Producción** (Producción)

**Para qué sirve:** el cliente o el personal puede escanear el QR con el celular y acceder directamente al documento digital en el sistema, sin tener que buscarlo manualmente.

**Cómo activar/desactivar:**
1. Ir a **Configuración → Documentos** (pestaña "Documentos")
2. Switch **"Mostrar QR"** → activar o desactivar
3. Campo **"URL base del QR"**: definir la URL base (ej: \`https://laspastasdeorlando.vercel.app\`). Si está vacío, el QR contiene un identificador del documento.

El QR se genera con la librería \`qrcode\` y se incrusta como imagen en el PDF.`,
  },
  {
    keywords: ['plantilla documento', 'editor documento', 'personalizar documento', 'logo documento', 'color documento', 'footer documento', 'configurar documento', 'plantilla factura', 'plantilla pdf', 'cambiar logo', 'datos empresa documento'],
    response: `⚙️ **Editor de plantillas de documentos** (menú: Configuración → Documentos)

Permite personalizar TODOS los documentos que genera el sistema (facturas, órdenes, remitos, fichas, reportes).

**Campos editables:**
- **Nombre de empresa**: título principal (ej: "El Amigo de las Pastas")
- **Datos fiscales**: CUIT, condición IVA, inicio de actividades
- **Contacto**: dirección, teléfono, email
- **Logo URL**: si cargás una URL, se muestra el logo en el encabezado
- **Texto de pie (footer)**: mensaje al pie de cada documento
- **Texto de condiciones**: cláusulas para órdenes de compra/pedido
- **Color de acento**: color hexadecimal (ej: \`#E1AD01\` mostaza)
- **QR**: activar/desactivar + URL base

**Cómo usarlo:**
1. Ir a **Configuración** (menú lateral) → pestaña **"Documentos"**
2. Editar los campos del formulario
3. Clic en **"Guardar"**
4. Los cambios se aplican a todos los documentos nuevos que se generen

💡 Los cambios se guardan en la tabla \`ConfigDocumento\` (registro único id=1). Debajo del editor está el **Historial de Documentos** generados.`,
  },
  {
    keywords: ['historial documento', 'documentos generados', 'registro documento', 'auditoría documento', 'auditoria documento', 'trazabilidad documento', 'qué se generó', 'que se genero', 'ver documentos generados'],
    response: `📚 **Historial de Documentos** (menú: Configuración → Documentos, parte inferior)

El sistema registra **automáticamente** cada documento que se genera (PDF, Excel, etc.).

**Datos que se guardan:**
- **Tipo**: factura, ticket, remito, orden_compra, orden_produccion, ficha_producto, reporte, etc.
- **Entidad**: ID y tipo (venta, compra, producción, persona, etc.)
- **Formato**: pdf, excel, word, txt
- **Generado por**: usuario que lo generó
- **Email enviado**: true/false
- **Destinatario**: email a quien se envió (si aplica)
- **Fecha** de generación
- **Metadata**: info adicional en JSON (número de comprobante, etc.)

**Cómo verlo:**
1. Ir a **Configuración → Documentos**
2. Debajo del editor de plantillas está el **Historial**
3. Filtrar por tipo o ver todos, ordenados por fecha descendente

💡 Útil para **auditoría**: saber qué documentos se generaron, quién los generó y cuáles se enviaron por email.`,
  },
  {
    keywords: ['exportar dashboard', 'pdf dashboard', 'imprimir dashboard', 'excel alertas', 'exportar alertas', 'resumen dashboard pdf', 'dashboard pdf'],
    response: `📊 **Exportar el Dashboard**

Desde el Dashboard podés exportar:

**1. Resumen en PDF / Imprimir**
- Botón **"PDF"** (descarga) y **"Imprimir"** en el header del Dashboard
- Incluye: KPIs (indicadores clave), flujo de trabajo (5 etapas con estado) y alertas agrupadas por etapa
- Útil para compartir el estado del negocio o archivarlo

**2. Alertas a Excel**
- Botón **"Alertas Excel"** en el header del Dashboard
- Exporta todas las alertas de "Pasos Pendientes" con su nivel de severidad y acción recomendada

**Dónde están los botones:** en la parte superior del Dashboard (\`/admin/dashboard\`), junto al título.

💡 El PDF del Dashboard se genera con \`@react-pdf/renderer\` (componente \`DashboardPDFExport\`). Las alertas se exportan con \`xlsx\`.`,
  },
]

// ─── FAQ Matching Engine ─────────────────────────────────────────────────────

function matchFaq(userMessage: string): string | null {
  const normalizedMessage = userMessage
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents for better matching

  let bestMatch: FaqEntry | null = null
  let bestScore = 0

  for (const entry of FAQ_ENTRIES) {
    const matchedKeywords = entry.keywords.filter(kw => {
      const normalizedKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      return normalizedMessage.includes(normalizedKw)
    })

    const score = matchedKeywords.length / entry.keywords.length
    if (score > bestScore && matchedKeywords.length >= 1) {
      bestScore = score
      bestMatch = entry
    }
  }

  // Require at least 20% keyword match to return a result
  if (bestMatch && bestScore >= 0.2) {
    return bestMatch.response
  }

  return null
}

function getFallbackResponse(userMessage: string): string {
  const faqResponse = matchFaq(userMessage)
  if (faqResponse) {
    return faqResponse
  }

  // Generic fallback when no FAQ matches
  return `🤔 No tengo una respuesta específica para esa consulta. Pero puedo ayudarte con estos temas:

- **Productos**: crear, cargar stock, alertas
- **Recetas**: cómo crear y vincular ingredientes
- **Producción**: iniciar y completar producciones
- **Ventas**: registrar ventas y formas de pago
- **Compras**: registrar compras a proveedores
- **Stock**: movimientos, alertas, carga manual
- **Pedidos**: de clientes y a proveedores
- **Presupuestos**: crear y convertir en pedidos
- **Promociones**: ofertas, 2x1, cómo se ven en la tienda pública, buscador que muestra todos los productos
- **Descuentos por Volumen**: descuentos escalonados por cantidad
- **Margen de Ganancia**: cómo se calcula y código de colores
- **Menú lateral**: colapsar/expandir secciones
- **Reportes**: generar, exportar y filtros personalizados por período/cliente/vendedor/producto
- **Etiquetas térmicas**: PDF y ZPL para impresoras de rollo
- **Plantillas de notificaciones**: Markdown y variables canónicas
- **Visibilidad de contraseña**: ojo en login y usuarios
- **Dashboard**: Pasos Pendientes, Indicadores Clave, Flujo de Trabajo, Acciones Directas

Probá preguntar sobre alguno de estos temas y te guío paso a paso. 📋`
}

// ─── AI Response Functions ───────────────────────────────────────────────────

async function getZaiResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
  const zai = await ZAI.create()

  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })

  const responseContent =
    completion.choices?.[0]?.message?.content ?? 'No se pudo generar una respuesta.'

  return responseContent
}

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        { error: 'El campo "messages" es requerido y debe ser un array no vacío' },
        { status: 400 }
      )
    }

    // Validate message structure
    for (const msg of body.messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return Response.json(
          { error: 'Cada mensaje debe tener "role" y "content" como string' },
          { status: 400 }
        )
      }
      if (msg.role !== 'user' && msg.role !== 'assistant') {
        return Response.json(
          { error: 'El rol del mensaje debe ser "user" o "assistant"' },
          { status: 400 }
        )
      }
    }

    // Get the last user message for FAQ fallback
    const lastUserMessage = [...body.messages].reverse().find((m: { role: string }) => m.role === 'user')
    const userText = lastUserMessage?.content || ''

    // Build the full messages array with system prompt
    const systemMessage = {
      role: 'assistant' as const,
      content: SYSTEM_PROMPT,
    }

    // Trim conversation history if it exceeds the maximum
    const conversationHistory = body.messages.slice(-MAX_HISTORY_MESSAGES)
    const messages = [systemMessage, ...conversationHistory]

    // Try z-ai-web-dev-sdk first (works in Z.ai sandbox)
    try {
      const response = await getZaiResponse(messages)
      if (response && response.trim().length > 0) {
        return Response.json({ response })
      }
    } catch (zaiError) {
      console.warn('[Chat Assistant] z-ai-web-dev-sdk not available, using FAQ fallback:', zaiError instanceof Error ? zaiError.message : 'Unknown error')
    }

    // Fallback: FAQ intelligent matching (always works, no API needed)
    const faqResponse = getFallbackResponse(userText)
    return Response.json({ response: faqResponse })

  } catch (error) {
    console.error('[Chat Assistant API] Error:', error)

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return Response.json(
        { error: 'Cuerpo de la solicitud inválido. Se esperaba JSON válido.' },
        { status: 400 }
      )
    }

    return Response.json(
      { error: 'Error interno del servidor al procesar la consulta. Intente nuevamente.' },
      { status: 500 }
    )
  }
}
