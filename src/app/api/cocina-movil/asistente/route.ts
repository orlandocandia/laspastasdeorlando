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
    response: 'Para crear una receta:\n1. Ve a Recetas → "Nueva Receta"\n2. Completa los datos (título, categoría, porciones)\n3. Agrega ingredientes (materias primas) con cantidad\n4. Agrega insumos si es necesario\n5. El sistema calcula automáticamente el costo total y por porción\n6. Click en "Crear"',
  },
  {
    keywords: ['produccion', 'producciones', 'registrar'],
    response: 'Para registrar una producción:\n1. Ve a Producciones → "Nueva Producción"\n2. Selecciona la receta y el lugar\n3. Ingresa la cantidad de porciones\n4. El costo se calcula automáticamente\n5. Click en "Crear" (queda como "Pendiente")\n6. El Admin puede confirmar o rechazar la producción',
  },
  {
    keywords: ['presupuesto', 'presupuestos', 'cotizar'],
    response: 'Para crear un presupuesto:\n1. Ve a Presupuestos → "Nuevo Presupuesto"\n2. Selecciona la receta e ingresa el cliente\n3. Define porciones y precio de venta\n4. El sistema calcula costo, ganancia y margen %\n5. Click en "Crear" (queda como "Borrador")\n6. Puedes Enviar, Aprobar o Rechazar el presupuesto',
  },
  {
    keywords: ['venta', 'ventas', 'vender', 'ticket'],
    response: 'Para registrar una venta:\n1. Ve a Ventas → "Nueva Venta"\n2. Selecciona la receta y el lugar\n3. Ingresa cantidad y precio unitario\n4. El sistema calcula total, costo y ganancia\n5. Click en "Crear" (se genera un ticket único)\n6. Puedes imprimir el ticket desde el detalle de la venta',
  },
  {
    keywords: ['margen', 'ganancia', 'rentabilidad'],
    response: 'El margen de ganancia se calcula automáticamente en presupuestos y ventas:\n\nMargen % = (Ganancia / Precio Total) × 100\n\n- Verde: >30% (rentable)\n- Mostaza: 10-30% (moderado)\n- Rojo: <10% (bajo)\n\nEl costo se obtiene del costo por porción de la receta.',
  },
  {
    keywords: ['compra', 'compras', 'proveedor'],
    response: 'Para registrar una compra:\n1. Ve a Compras → "Nueva Compra"\n2. Selecciona el proveedor y el lugar\n3. Agrega items (materias primas o insumos)\n4. La unidad y precio se autocompletan al seleccionar el producto\n5. El sistema calcula subtotales y total\n6. Click en "Crear"',
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
    response: 'El sistema tiene 12 módulos: Dashboard, Usuarios, Lugares, Materias Primas, Insumos, Proveedores, Compras, Recetas, Producciones, Presupuestos, Ventas y Configuración.\n\nPuedes preguntarme sobre cualquiera de ellos. Por ejemplo: "¿Cómo creo una receta?" o "¿Cómo registro una venta?"',
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
