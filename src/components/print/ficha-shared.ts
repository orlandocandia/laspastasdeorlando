// Constantes y helpers compartidos para documentos PDF de fichas (Etapa 3)
// No es un componente React, solo constantes/utilidades para reutilizar en los
// tres documentos de ficha: Producto, MateriaPrima y Receta.

export const FICHA_COLORS = {
  marron: '#5C3A21',
  mostaza: '#E1AD01',
  crema: '#FFF8E7',
  grisClaro: '#F3F4F6',
  grisOscuro: '#6B7280',
  blanco: '#FFFFFF',
  negro: '#111827',
  rojo: '#B91C1C',
  oliva: '#708238',
}

export const FICHA_EMPRESA = {
  nombre: 'El Amigo de las Pastas',
  direccion: 'Posadas, Misiones',
  telefono: '3754-419324',
  email: 'laspastasdeorlando@gmail.com',
  cuit: '20-12345678-9',
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(amount || 0)

export const formatNumber = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n || 0)

export const formatFecha = (dateStr: string | null) => {
  if (!dateStr) return '-'
  try { return new Date(dateStr).toLocaleDateString('es-AR') } catch { return dateStr }
}

export const formatFechaHora = (date: Date) => {
  try { return date.toLocaleString('es-AR') } catch { return String(date) }
}

// Convierte un valor string de tipo_harina a etiqueta legible
export const tipoHarinaLabel = (tipo: string | null | undefined): string => {
  if (!tipo) return '-'
  const map: Record<string, string> = {
    'con_gluten': 'Con gluten',
    'integral': 'Integral',
    'sin_gluten': 'Sin gluten',
  }
  return map[tipo] || tipo
}

// Convierte un valor string de seccion a etiqueta legible
export const seccionLabel = (seccion: string | null | undefined): string => {
  if (!seccion) return '-'
  const map: Record<string, string> = {
    'pastas': 'Pastas',
    'horneados': 'Horneados',
  }
  return map[seccion] || seccion
}
