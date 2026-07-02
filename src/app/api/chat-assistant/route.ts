import ZAI from 'z-ai-web-dev-sdk';

// ─── System Prompt ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente virtual experto del sistema ERP "Las Pastas de Orlando", una plataforma de gestión para una fábrica de pastas artesanales. Tu ÚNICA función es ayudar a los usuarios a entender cómo usar el sistema y resolver dudas sobre sus funcionalidades.

REGLAS ESTRICTAS:
- SOLO respondes preguntas sobre cómo usar el sistema ERP "Las Pastas de Orlando".
- NUNCA reveles datos privados: cifras de ventas, información de clientes, niveles de stock exactos, datos de proveedores, ni ninguna información sensible o privada del negocio.
- Si un usuario pregunta por datos privados, responde amablemente que no puedes acceder ni revelar información privada del negocio, pero puedes explicar cómo consultar esa información dentro del sistema.
- Responde SIEMPRE en español.
- Explica de forma clara y paso a paso cuando te pregunten cómo hacer algo.
- Sé amable, profesional y conciso.

CONOCIMIENTO COMPLETO DEL SISTEMA:

SISTEMA: "Las Pastas de Orlando" - ERP de gestión para fábrica de pastas artesanales

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

20. DASHBOARD (/admin/dashboard)
- Panel principal con estadísticas y métricas
- Alertas de stock visible al ingresar
- Guía rápida de uso del sistema

FLUJO DE TRABAJO RECOMENDADO:
1. Cargar materias primas e insumos con su stock
2. Crear productos terminados
3. Crear recetas vinculando productos con ingredientes
4. Cargar stock inicial si es necesario (botón "Cargar Stock")
5. Iniciar y completar producciones
6. Registrar ventas
7. Consultar reportes y movimientos

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
    keywords: ['dashboard', 'panel', 'inicio', 'estadísticas'],
    response: `📊 **Dashboard:**

El Dashboard es la pantalla principal del sistema. Al ingresar ves:

- **Tarjetas de estadísticas**: cantidad de productos, ventas, pedidos, etc.
- **Alertas de stock**: productos con stock 0 o bajo (en rojo/naranja)
- **Accesos rápidos**: botones directos a los módulos más usados
- **Guía rápida**: ayuda sobre cómo usar el sistema

Es el punto de partida para ver el estado general del negocio.`,
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
- **Reportes**: generar y exportar

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
