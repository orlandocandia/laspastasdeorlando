'use client'

import { forwardRef } from 'react'

interface ProductoItem {
  nombre: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

interface PresupuestoPDFProps {
  presupuesto: {
    numero: string
    fecha_creacion: string
    fecha_validez: string
    subtotal: number
    iva: number
    total: number
    observaciones?: string | null
    estado: string
  }
  cliente: {
    nombre: string
    apellido: string
    razon_social?: string | null
    cuit?: string | null
    condicion_iva?: string | null
  }
  productos: ProductoItem[]
  empresa?: {
    nombre: string
    direccion: string
    telefono: string
    email: string
  }
}

const PresupuestoPDF = forwardRef<HTMLDivElement, PresupuestoPDFProps>(
  ({ presupuesto, cliente, productos, empresa }, ref) => {
    const empresaData = empresa || {
      nombre: 'El Amigo de las Pastas',
      direccion: 'Posadas, Misiones',
      telefono: '3754-419324',
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'laspastasdeorlando@gmail.com',
    }

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('es-AR')
      } catch {
        return dateStr
      }
    }

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

    return (
      <div ref={ref} className="p-8 max-w-[210mm] mx-auto bg-white text-marron font-sans" style={{ fontSize: '11px' }}>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-marron pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-marron">{empresaData.nombre}</h1>
            <p className="text-sm text-gray-600">{empresaData.direccion}</p>
            <p className="text-sm text-gray-600">Tel: {empresaData.telefono}</p>
            <p className="text-sm text-gray-600">{empresaData.email}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-mostaza">PRESUPUESTO</h2>
            <p className="font-semibold">N° {presupuesto.numero}</p>
            <p>Fecha: {formatDate(presupuesto.fecha_creacion)}</p>
            <p>Válido hasta: {formatDate(presupuesto.fecha_validez)}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="mb-6 p-3 bg-gray-50 rounded">
          <h3 className="font-semibold text-sm mb-1">DATOS DEL CLIENTE</h3>
          <p><strong>Nombre:</strong> {cliente.razon_social || `${cliente.nombre} ${cliente.apellido}`}</p>
          {cliente.cuit && <p><strong>CUIT:</strong> {cliente.cuit}</p>}
          {cliente.condicion_iva && <p><strong>Cond. IVA:</strong> {cliente.condicion_iva}</p>}
        </div>

        {/* Productos */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-marron text-white">
              <th className="border border-marron px-3 py-2 text-left">Producto</th>
              <th className="border border-marron px-3 py-2 text-center w-20">Cantidad</th>
              <th className="border border-marron px-3 py-2 text-right w-28">Precio Unit.</th>
              <th className="border border-marron px-3 py-2 text-right w-28">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-3 py-1.5">{prod.nombre}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-center">{prod.cantidad}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right">{formatCurrency(prod.precio_unitario)}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right">{formatCurrency(prod.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>{formatCurrency(presupuesto.subtotal)}</span>
            </div>
            {presupuesto.iva > 0 && (
              <div className="flex justify-between py-1">
                <span>IVA:</span>
                <span>{formatCurrency(presupuesto.iva)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t-2 border-marron font-bold text-base">
              <span>TOTAL:</span>
              <span>{formatCurrency(presupuesto.total)}</span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {presupuesto.observaciones && (
          <div className="mb-6 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-1">OBSERVACIONES</h4>
            <p>{presupuesto.observaciones}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-8 text-center text-xs text-gray-500">
          <p>Presupuesto válido hasta el {formatDate(presupuesto.fecha_validez)}. Los precios pueden sufrir modificaciones.</p>
          <p className="mt-1">{empresaData.nombre} — {empresaData.direccion}</p>
        </div>
      </div>
    )
  }
)

PresupuestoPDF.displayName = 'PresupuestoPDF'
export default PresupuestoPDF
