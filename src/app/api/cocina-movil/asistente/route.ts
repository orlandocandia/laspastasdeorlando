/**
 * ============================================================
 * API — Asistente IA de la Cocina Móvil
 * ============================================================
 * POST /api/cocina-movil/asistente
 *
 * Body: { messages: [{role, content}] }
 * Returns: { response: string }
 *
 * Usa z-ai-web-dev-sdk (LLM) con el manual del sistema como
 * base de conocimiento. Si el SDK no está disponible, usa
 * fallback con respuestas predefinidas (FAQ matching).
 * ============================================================
 */
import { getManualAsText, AYUDA_SECCIONES } from '@/lib/cocina-movil/ayuda-data'
import { requireAuth } from '@/lib/cocina-movil/auth-middleware'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Eres el asistente virtual de "Cocina Móvil — El Amigo de las Pastas". Tu función es ayudar a los usuarios a entender cómo usar el sistema y resolver dudas sobre sus funcionalidades.

REGLAS:
- SOLO respondes preguntas sobre cómo usar el sistema Cocina Móvil.
- NUNCA reveles datos privados del negocio.
- Responde SIEMPRE en español.
- Explica de forma clara y paso a paso.
- Sé amable, profesional y conciso.

MANUAL DEL SISTEMA:

${getManualAsText()}

FIN DEL MANUAL.`

// Respuestas predefinidas para fallback (cuando el SDK no está disponible)
const FALLBACK_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['crear', 'receta', 'nueva', 'recetas'],
    response: 'Para crear una receta:\n1. Ve a Recetas → "Nueva Receta"\n2. Completa: título, categoría (Pastas, Salsas, Guisos, Sopas, Horneados, Postres, Acompañamientos, Bebidas, Otros)\n3. Ingresa tiempo estimado y porciones\n4. Agrega ingredientes (materias primas) con cantidad\n5. Agrega insumos si es necesario\n6. El sistema calcula automáticamente el costo total y por porción\n7. Click en "Crear"\n\nNota: Ya no hay campo "Dificultad" ni "Tiempo de Cocción". Se usa "Tiempo Estimado" en su lugar.',
  },
  {
    keywords: ['produccion', 'producciones', 'registrar'],
    response: 'Para registrar una producción:\n1. Ve a Producciones → "Nueva Producción"\n2. Selecciona la receta y el lugar\n3. Ingresa la cantidad de porciones\n4. El costo se calcula automáticamente\n5. Click en "Crear" (queda como "Pendiente")\n6. El Admin puede confirmar o rechazar la producción',
  },
  {
    keywords: ['presupuesto', 'presupuestos', 'cotizar', 'margen'],
    response: 'Para crear un presupuesto:\n1. Ve a Presupuestos → "Nuevo Presupuesto"\n2. Completa datos del cliente y validez (días)\n3. Agrega items (recetas con cantidad y precio)\n4. Ingresa el "Margen deseado (%)" — el sistema calcula automáticamente el precio sugerido\n5. Opcional: agrega descuento (% o $) e IVA (%)\n6. El sistema calcula: costo total, subtotal, descuento, IVA, total final, ganancia y margen real\n7. Click en "Crear" (queda como "Borrador")\n8. Puedes Enviar, Aprobar o Convertir en Venta\n\nUn presupuesto aprobado se puede convertir directamente en Venta o en un Pedido de Cliente.',
  },
  {
    keywords: ['venta', 'ventas', 'vender', 'ticket'],
    response: 'Para registrar una venta:\n1. Ve a Ventas → "Nueva Venta"\n2. Selecciona el cliente (con botón "+" para crear uno nuevo) o "Consumidor Final"\n3. Selecciona el lugar\n4. Agrega items (recetas con cantidad y precio unitario)\n5. Opcional: agrega descuento (% o $) e IVA (%)\n6. El sistema calcula: costo, subtotal, descuento, IVA, total final, ganancia y margen\n7. Click en "Crear" (se genera un ticket único)\n\nTambién podés cargar ventas desde Pedidos de Clientes o Presupuestos aprobados con los botones "Ver Pedidos Disponibles" y "Ver Presupuestos Aprobados".',
  },
  {
    keywords: ['compra', 'compras', 'proveedor'],
    response: 'Para registrar una compra:\n1. Ve a Compras → "Nueva Compra"\n2. Selecciona el proveedor y el lugar\n3. Agrega items (materias primas o insumos) con tipo de unidad, cantidad, peso y precio total\n4. El sistema calcula precio por unidad automáticamente\n5. También podés cargar un Pedido a Proveedor pendiente con el botón "Ver Pedidos Pendientes"\n6. Click en "Crear"',
  },
  {
    keywords: ['pedido', 'proveedor', 'pedidos a proveedores'],
    response: 'Pedidos a Proveedores:\n\n1. Ve a Pedidos a Proveedores → "Nuevo Pedido"\n2. Selecciona proveedor, agrega items (materias primas/insumos)\n3. Cambia el estado: Pendiente → Enviado → Recibido\n4. Cuando está "Recibido", aparece el botón "Convertir en Compra"\n5. Al convertir: se crea una Compra con los items del pedido y se marca como "Comprado"\n\nTambién desde Compras → "Ver Pedidos Pendientes" podés cargar un pedido directamente en una nueva compra.',
  },
  {
    keywords: ['pedido', 'cliente', 'pedidos de clientes'],
    response: 'Pedidos de Clientes:\n\n1. Ve a Pedidos de Clientes → "Nuevo Pedido"\n2. Completa datos del cliente y agrega items (recetas)\n3. Cambia el estado: Pendiente → En Preparación → Entregado\n4. Cuando está "Entregado", aparece el botón "Convertir en Venta"\n5. Al convertir: se crea una Venta con los items del pedido y se marca como "Vendido"\n\nTambién desde Presupuestos podés convertir un presupuesto aprobado en un Pedido de Cliente.',
  },
  {
    keywords: ['cliente', 'clientes', 'crear cliente'],
    response: 'Para gestionar clientes:\n1. Ve a Clientes → "Nuevo Cliente"\n2. Sección 1: Subí una imagen/avatar (opcional)\n3. Sección 2: Datos personales (nombre, apellido, DNI, teléfono, email)\n4. Sección 3: Domicilio completo con mapa (dirección, país, provincia, departamento, municipio)\n5. Sección 4: Notas internas\n6. Click en "Crear"\n\nLos clientes aparecen en los selects de Ventas, Presupuestos y Pedidos de Clientes. También podés crear clientes rápidos desde el botón "+" en el formulario de Ventas.',
  },
  {
    keywords: ['cocinero', 'panel del cocinero', 'dashboard del cocinero'],
    response: 'El Panel del Cocinero tiene 6 módulos:\n\n• Mi Dashboard: alertas pendientes, resumen del día, últimas producciones y lugares\n• Mis Recetas: listado con búsqueda y creación inline\n• Mis Producciones: listado con creación inline (receta, lugar, cantidad)\n• Mis Lugares: listado con creación inline\n• Consultar Stock: stock de materias primas e insumos (solo lectura)\n• Mi Perfil: datos personales con edición\n\nEl Cocinero NO tiene acceso a Compras, Ventas, Presupuestos, Usuarios, Clientes ni Configuración. Si intenta acceder a /cm/admin/*, es redirigido al Dashboard del Cocinero.',
  },
  {
    keywords: ['presupuesto', 'convertir', 'venta'],
    response: 'Para convertir un Presupuesto en Venta:\n1. Ve a Presupuestos → abre el detalle de un presupuesto aprobado\n2. Aparece el botón verde "Convertir en Venta"\n3. Al hacer clic: se crea una Venta con los items, descuento e IVA del presupuesto\n4. El presupuesto queda vinculado a la venta\n\nTambién desde Ventas → "Ver Presupuestos Aprobados" podés cargar un presupuesto en una nueva venta.',
  },
  {
    keywords: ['usuario', 'usuarios', 'crear', 'admin'],
    response: 'Para gestionar usuarios:\n1. Ve a Usuarios → "Nuevo Usuario"\n2. Completa datos personales (nombre, DNI, etc.)\n3. Completa domicilio (con mapa)\n4. Define email, contraseña y rol (admin/cocinero)\n5. Click en "Crear"\n\nPara editar o cambiar contraseña: usa el menú de acciones (⋮) en la tabla.',
  },
  {
    keywords: ['lugar', 'lugares', 'cocina', 'carrito'],
    response: 'Para gestionar lugares:\n1. Ve a Lugares → "Nuevo Lugar"\n2. Completa datos del lugar (nombre, contacto)\n3. Completa domicilio con mapa\n4. Sube una imagen\n5. Define costos fijos (propio/alquilado, alquiler, servicios)\n6. Click en "Crear"',
  },
  {
    keywords: ['imprimir', 'ticket', 'etiqueta', 'impresora', 'termica'],
    response: 'Impresión térmica:\n\n- Tickets de venta: desde el detalle de una venta → "Imprimir Ticket"\n- Etiquetas de producción: desde el detalle de una producción → "Imprimir Etiqueta"\n- Configuración: Configuración → Impresoras Térmicas (tipo, ancho, puerto, etc.)',
  },
  {
    keywords: ['ayuda', 'manual', 'como', 'funciona'],
    response: 'El sistema tiene 15 módulos para el Admin: Dashboard, Usuarios, Lugares, Clientes, Materias Primas, Insumos, Proveedores, Pedidos a Proveedores, Compras, Recetas, Producciones, Presupuestos, Pedidos de Clientes, Ventas y Configuración.\n\nEl rol Cocinero tiene 6 módulos: Mi Dashboard, Mis Recetas, Mis Producciones, Mis Lugares, Consultar Stock y Mi Perfil.\n\nPuedes preguntarme sobre cualquiera de ellos. Por ejemplo: "¿Cómo creo un pedido a proveedor?" o "¿Cómo funciona el margen deseado?"',
  },
]

function getFallbackResponse(text: string): string {
  const lower = text.toLowerCase()
  for (const item of FALLBACK_RESPONSES) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.response
    }
  }
  return 'No estoy seguro de cómo responder a eso. Te sugiero consultar el manual en la sección Ayuda, o intentar con preguntas como:\n\n• "¿Cómo creo una receta?"\n• "¿Cómo registro una producción?"\n• "¿Cómo genero un presupuesto?"\n• "¿Qué es el margen de ganancia?"'
}

export async function POST(request: Request) {
  const auth = requireAuth(request)
  if (!auth.authorized) return auth.response!
  try {
    const body = await request.json()

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json({ error: 'El campo "messages" es requerido' }, { status: 400 })
    }

    const messages = body.messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }))

    // Add system prompt
    const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]

    // Try z-ai-web-dev-sdk
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const zai = await ZAI.create()

      const completion = await zai.chat.completions.create({
        messages: fullMessages,
        thinking: { type: 'disabled' },
      })

      const responseContent = completion.choices?.[0]?.message?.content ?? ''

      if (responseContent && responseContent.trim().length > 0) {
        return Response.json({ response: responseContent })
      }
    } catch (zaiError) {
      console.warn('[CocinaMóvil-Asistente] z-ai SDK no disponible, usando fallback:', zaiError instanceof Error ? zaiError.message : 'Unknown')
    }

    // Fallback: FAQ matching
    const lastMessage = messages[messages.length - 1]
    const fallbackResponse = getFallbackResponse(lastMessage.content)
    return Response.json({ response: fallbackResponse })
  } catch (error) {
    console.error('[CocinaMóvil-Asistente] Error:', error)
    return Response.json({ error: 'Error al procesar la consulta' }, { status: 500 })
  }
}
