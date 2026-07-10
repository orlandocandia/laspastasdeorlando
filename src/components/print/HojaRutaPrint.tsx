'use client'

import { forwardRef } from 'react'

interface EntregaItem {
  numero: number
  cliente: string
  direccion: string
  telefono: string
  pedido: string
  horario: string
  entregado?: boolean
}

interface HojaRutaPrintProps {
  fecha: string
  entregas: EntregaItem[]
  empresa?: {
    nombre: string
    direccion: string
    telefono: string
  }
}

const HojaRutaPrint = forwardRef<HTMLDivElement, HojaRutaPrintProps>(
  ({ fecha, entregas, empresa }, ref) => {
    const empresaData = empresa || {
      nombre: 'El Amigo de las Pastas',
      direccion: 'Posadas, Misiones',
      telefono: '3754-419324',
    }

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-AR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      } catch {
        return dateStr
      }
    }

    return (
      <div ref={ref} className="p-8 max-w-[210mm] mx-auto bg-white text-marron font-sans" style={{ fontSize: '11px' }}>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-marron pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-marron">{empresaData.nombre}</h1>
            <p className="text-sm text-gray-600">{empresaData.direccion}</p>
            <p className="text-sm text-gray-600">Tel: {empresaData.telefono}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-mostaza">HOJA DE RUTA</h2>
            <p className="font-semibold capitalize">{formatDate(fecha)}</p>
            <p>Total entregas: {entregas.length}</p>
          </div>
        </div>

        {/* Entregas Table */}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-marron text-white">
              <th className="border border-marron px-2 py-2 text-center w-10">N°</th>
              <th className="border border-marron px-2 py-2 text-left">Cliente</th>
              <th className="border border-marron px-2 py-2 text-left">Dirección</th>
              <th className="border border-marron px-2 py-2 text-center w-24">Teléfono</th>
              <th className="border border-marron px-2 py-2 text-left">Pedido</th>
              <th className="border border-marron px-2 py-2 text-center w-20">Horario</th>
              <th className="border border-marron px-2 py-2 text-center w-20">Entregado</th>
            </tr>
          </thead>
          <tbody>
            {entregas.map((entrega) => (
              <tr key={entrega.numero} className={entrega.numero % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-2 py-2 text-center font-semibold">{entrega.numero}</td>
                <td className="border border-gray-300 px-2 py-2">{entrega.cliente}</td>
                <td className="border border-gray-300 px-2 py-2">{entrega.direccion}</td>
                <td className="border border-gray-300 px-2 py-2 text-center">{entrega.telefono}</td>
                <td className="border border-gray-300 px-2 py-2">{entrega.pedido}</td>
                <td className="border border-gray-300 px-2 py-2 text-center">{entrega.horario}</td>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <span className="inline-block w-5 h-5 border-2 border-gray-400 rounded-sm align-middle" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="border-t border-gray-300 pt-4 text-sm">
          <p><strong>Total de entregas:</strong> {entregas.length}</p>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-6 text-center text-xs text-gray-500">
          <p>Documento generado el {new Date().toLocaleDateString('es-AR')} — {empresaData.nombre}</p>
          <p className="mt-1">Receptor: _________________________ Firma: _________________________</p>
        </div>
      </div>
    )
  }
)

HojaRutaPrint.displayName = 'HojaRutaPrint'
export default HojaRutaPrint
