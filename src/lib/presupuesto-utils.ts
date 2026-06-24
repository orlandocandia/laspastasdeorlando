'use client'

/**
 * Utilidades para Presupuestos:
 * - Generación y descarga de PDF con @react-pdf/renderer
 * - Generación de enlace de WhatsApp con teléfono del cliente
 */

import { pdf } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

interface PresupuestoWhatsAppData {
  clienteNombre: string
  clienteTelefono?: string | null
  numero: string
  total: number
  fechaValidez: string
  detalles: Array<{
    nombre: string
    cantidad: number
    subtotal: number
  }>
}

/**
 * Descarga un PDF generado con @react-pdf/renderer.
 * @param documentElement Elemento <Document> de react-pdf
 * @param fileName Nombre del archivo sin extensión
 */
export async function downloadPresupuestoPDF(
  documentElement: ReactElement,
  fileName: string
): Promise<void> {
  const blob = await pdf(documentElement).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Liberar memoria después de 1s
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Abre un PDF generado con @react-pdf/renderer en una nueva pestaña.
 * Útil cuando se quiere imprimir o previsualizar antes de descargar.
 */
export async function openPresupuestoPDFInNewTab(
  documentElement: ReactElement
): Promise<void> {
  const blob = await pdf(documentElement).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Liberar memoria después de 60s (tiempo suficiente para imprimir)
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/**
 * Formatea un número de teléfono para usar en wa.me.
 * - Elimina espacios, guiones, paréntesis, puntos
 * - Elimina el "+" inicial
 * - Si empieza con 0 y tiene 10+ dígitos, quita el 0 inicial (ej: 03754 -> 3754)
 * - Si no tiene código de país y tiene 10 dígitos (ej: 3754419324), antepone 54 (Argentina)
 * - Si empieza con 15 (celular argentina), lo quita y antepone 54 9
 */
export function normalizePhoneForWhatsApp(phone: string | null | undefined): string | null {
  if (!phone) return null
  let p = phone.trim()
  if (!p) return null

  // Eliminar todo lo que no sea dígito
  p = p.replace(/\D/g, '')

  if (!p) return null

  // Si ya tiene código de país (54 o 549) al inicio, dejar así
  if (p.startsWith('549') || p.startsWith('54')) {
    return p
  }

  // Si empieza con +549 o +54 ya fue manejado arriba (los + se eliminan)

  // Si empieza con 15 (prefijo celular antiguo), quitarlo y agregar 549
  // Ej: 153754419324 -> 5493754419324 (pero esto rara vez aplica)
  if (p.startsWith('15') && p.length === 12) {
    return `549${p.substring(2)}`
  }

  // Si tiene 10 dígitos (3754419324) -> agregar 549 (celular AR) o 54 (fijo AR)
  // Por defecto en Argentina los celulares usan 9 después del 54
  if (p.length === 10) {
    // Asumir celular AR (9 después de 54)
    return `549${p}`
  }

  // Si tiene 11 dígitos y empieza con 0 (011xxxxxxxx o 03754xxxxxxxx)
  if (p.length === 11 && p.startsWith('0')) {
    // Quitar el 0 inicial y agregar 54
    return `54${p.substring(1)}`
  }

  // Si tiene 13 dígitos y empieza con 0 (00xx...)
  if (p.length === 13 && p.startsWith('0')) {
    return p.substring(1)
  }

  // Devolver tal cual si no coincide con patrones conocidos
  return p
}

/**
 * Genera un enlace de WhatsApp con el mensaje del presupuesto.
 * Si el cliente tiene teléfono, lo usa; si no, abre WhatsApp sin número.
 */
export function buildPresupuestoWhatsAppLink(data: PresupuestoWhatsAppData): {
  url: string
  hasPhone: boolean
} {
  const productos = data.detalles
    .map((d) => `• ${d.nombre} x${d.cantidad}: ${formatCurrency(d.subtotal)}`)
    .join('%0A')

  const mensaje =
    `Hola ${data.clienteNombre}, te envío el presupuesto N° ${data.numero}%0A%0A` +
    `${productos}%0A%0A` +
    `Total: ${formatCurrency(data.total)}%0A` +
    `Válido hasta: ${formatDate(data.fechaValidez)}%0A%0A` +
    `Quedo atento a tu consulta. Saludos!`

  const phone = normalizePhoneForWhatsApp(data.clienteTelefono)

  if (phone) {
    return {
      url: `https://wa.me/${phone}?text=${mensaje}`,
      hasPhone: true,
    }
  }

  // Sin teléfono: abrir WhatsApp sin número predefinido
  return {
    url: `https://wa.me/?text=${mensaje}`,
    hasPhone: false,
  }
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount || 0)

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('es-AR')
  } catch {
    return dateStr
  }
}
