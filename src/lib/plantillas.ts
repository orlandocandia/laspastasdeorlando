/**
 * Utilidades para manejo de plantillas de notificación.
 *
 * Soporta DOS formatos de variables:
 *   - `{variable}`   (formato canónico, recomendado para nuevas plantillas)
 *   - `{{variable}}` (formato heredado, mantenido por compatibilidad)
 *
 * Ambos formatos pueden coexistir en la misma plantilla.
 */

// ---------------------------------------------------------------------------
// Definición de variables canónicas
// ---------------------------------------------------------------------------

export interface VariablePlantilla {
  /** Nombre de la variable (sin llaves). */
  nombre: string
  /** Descripción legible de qué representa. */
  descripcion: string
  /** Valor de ejemplo para previsualización. */
  ejemplo: string
  /** Contextos donde aplica: 'pedido' | 'stock' | 'general'. */
  contexto: 'pedido' | 'stock' | 'general'
}

/**
 * Lista de variables canónicas disponibles en todas las plantillas.
 * Se muestran en el editor para que el usuario las inserte con un click.
 */
export const VARIABLES_PLANTILLA: VariablePlantilla[] = [
  { nombre: 'cliente', descripcion: 'Nombre del cliente', ejemplo: 'Juan Pérez', contexto: 'general' },
  { nombre: 'pedido', descripcion: 'Número de pedido', ejemplo: '1234', contexto: 'pedido' },
  { nombre: 'fecha', descripcion: 'Fecha del evento', ejemplo: '15/01/2025', contexto: 'general' },
  { nombre: 'total', descripcion: 'Total del pedido', ejemplo: '$ 4.500', contexto: 'pedido' },
  { nombre: 'estado', descripcion: 'Estado del pedido', ejemplo: 'Confirmado', contexto: 'pedido' },
  { nombre: 'producto', descripcion: 'Nombre del producto (alertas de stock)', ejemplo: 'Sorrentinos', contexto: 'stock' },
  // Variables adicionales heredadas del sistema
  { nombre: 'stock_actual', descripcion: 'Stock actual del producto', ejemplo: '3', contexto: 'stock' },
  { nombre: 'stock_minimo', descripcion: 'Stock mínimo del producto', ejemplo: '10', contexto: 'stock' },
  { nombre: 'punto_encuentro', descripcion: 'Punto de entrega', ejemplo: 'Plaza 9 de Julio', contexto: 'pedido' },
  { nombre: 'hora_desde', descripcion: 'Hora inicial de entrega', ejemplo: '09:00', contexto: 'pedido' },
  { nombre: 'hora_hasta', descripcion: 'Hora final de entrega', ejemplo: '12:00', contexto: 'pedido' },
]

/**
 * Conjunto de datos de ejemplo para previsualización de plantillas.
 * Incluye todos los nombres canónicos + alias heredados.
 */
export const VARIABLES_EJEMPLO: Record<string, string> = {
  // Canónicas
  cliente: 'Juan Pérez',
  pedido: '1234',
  fecha: '15/01/2025',
  total: '$ 4.500',
  estado: 'Confirmado',
  producto: 'Sorrentinos',
  stock_actual: '3',
  stock_minimo: '10',
  punto_encuentro: 'Plaza 9 de Julio',
  hora_desde: '09:00',
  hora_hasta: '12:00',
  // Alias heredados (compatibilidad)
  nombre: 'Juan Pérez',
  pedido_id: '1234',
  fecha_entrega: '15/01/2025',
}

// ---------------------------------------------------------------------------
// Extracción y renderizado
// ---------------------------------------------------------------------------

/**
 * Extrae las variables de una plantilla de notificación.
 * Detecta tanto `{variable}` como `{{variable}}`.
 * Devuelve los nombres sin llaves ni duplicados.
 */
export function extraerVariables(template: string): string[] {
  const variables: string[] = []
  // Regex unificada: captura {{var}} (doble) O {var} (simple), en un solo pase.
  // El orden de las alternativas importa: {{var}} debe ir primero para no capturarla como dos {var}.
  const regex = /\{\{(\w+)\}\}|\{(\w+)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    const variable = match[1] || match[2]
    if (variable && !variables.includes(variable)) {
      variables.push(variable)
    }
  }

  return variables
}

/**
 * Renderiza una plantilla reemplazando las variables con los valores proporcionados.
 * Reemplaza tanto `{variable}` como `{{variable}}`.
 * Las variables sin valor se dejan tal cual (no se eliminan).
 */
export function renderPlantilla(
  template: string,
  variables: Record<string, string> = {}
): string {
  let rendered = template

  for (const [key, value] of Object.entries(variables)) {
    // Reemplazar {{key}} (doble llave)
    const regexDoble = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    rendered = rendered.replace(regexDoble, value)
    // Reemplazar {key} (llave simple) — usar negative lookahead para no romper {{key}} ya reemplazado
    const regexSimple = new RegExp(`(?<!\\{)\\{${key}\\}(?!\\})`, 'g')
    rendered = rendered.replace(regexSimple, value)
  }

  return rendered
}

// ---------------------------------------------------------------------------
// Renderizado de Markdown (ligero)
// ---------------------------------------------------------------------------

/**
 * Convierte un texto con Markdown básico a HTML.
 * Soporta: # encabezados, **negrita**, *cursiva*, `código`,
 * - listas con viñetas, saltos de línea dobles → <p>, saltos simples → <br>.
 *
 * Es intencionalmente minimalista y sin dependencias externas para evitar
 * peso en el bundle. El email se envía como texto plano o HTML simple;
 * WhatsApp no interpreta Markdown pero respeta los *asteriscos* para negrita.
 */
export function renderMarkdownToHtml(text: string): string {
  if (!text) return ''

  // Escapar HTML para evitar inyección
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Encabezados (#, ##, ###)
  html = html.replace(/^###\s+(.+)$/gm, '<h3 style="font-size:1.1em;font-weight:700;margin:0.5em 0;">$1</h3>')
  html = html.replace(/^##\s+(.+)$/gm, '<h2 style="font-size:1.25em;font-weight:700;margin:0.5em 0;">$1</h2>')
  html = html.replace(/^#\s+(.+)$/gm, '<h1 style="font-size:1.4em;font-weight:700;margin:0.5em 0;">$1</h1>')

  // Negrita y cursiva
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Código inline
  html = html.replace(/`(.+?)`/g, '<code style="background:#f4f4f4;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:0.9em;">$1</code>')

  // Listas con viñetas (- item)
  html = html.replace(/(?:^|\n)((?:-\s+.+(?:\n|$))+)/g, (match, group: string) => {
    const items = group
      .trim()
      .split('\n')
      .map((line: string) => line.replace(/^-\s+/, '').trim())
      .map((item: string) => `<li style="margin-left:1.2em;">${item}</li>`)
      .join('')
    return `\n<ul style="margin:0.5em 0;padding-left:1em;">${items}</ul>\n`
  })

  // Bloques de texto separados por doble salto de línea → <p>
  const bloques = html.split(/\n{2,}/)
  html = bloques
    .map((bloque) => {
      const trimmed = bloque.trim()
      if (!trimmed) return ''
      // No envolver en <p> si ya es un bloque HTML (h1/h2/h3/ul)
      if (/^<(h[1-3]|ul|ol|blockquote)/.test(trimmed)) return trimmed
      // Saltos de línea simples dentro del bloque → <br>
      return `<p style="margin:0.5em 0;">${trimmed.replace(/\n/g, '<br>')}</p>`
    })
    .join('\n')

  return html
}

/**
 * Devuelve la lista de variables canónicas que aplican a un contexto dado.
 * Si no se especifica contexto, devuelve todas.
 */
export function getVariablesPorContexto(contexto?: 'pedido' | 'stock' | 'general'): VariablePlantilla[] {
  if (!contexto) return VARIABLES_PLANTILLA
  // 'general' aplica a todos los contextos; los específicos se suman
  return VARIABLES_PLANTILLA.filter((v) => v.contexto === 'general' || v.contexto === contexto)
}
