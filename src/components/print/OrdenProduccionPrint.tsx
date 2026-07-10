'use client'

import { forwardRef } from 'react'

interface IngredienteItem {
  nombre: string
  tipo: 'materia_prima' | 'insumo'
  cantidad_necesaria: number
  unidad: string
  costo_estimado: number
}

interface OrdenProduccionPrintProps {
  orden: {
    id: number
    producto: string
    cantidad: number
    fecha_produccion: string
    estado: string
    observaciones?: string | null
  }
  ingredientes: IngredienteItem[]
  costoTotalEstimado: number
  empresa?: {
    nombre: string
    direccion: string
  }
}

const OrdenProduccionPrint = forwardRef<HTMLDivElement, OrdenProduccionPrintProps>(
  ({ orden, ingredientes, costoTotalEstimado, empresa }, ref) => {
    const empresaData = empresa || {
      nombre: 'El Amigo de las Pastas',
      direccion: 'Posadas, Misiones',
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

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount)

    const costoMateriasPrimas = ingredientes
      .filter(i => i.tipo === 'materia_prima')
      .reduce((sum, i) => sum + i.costo_estimado, 0)

    const costoInsumos = ingredientes
      .filter(i => i.tipo === 'insumo')
      .reduce((sum, i) => sum + i.costo_estimado, 0)

    return (
      <div ref={ref} className="p-8 max-w-[210mm] mx-auto bg-white text-marron font-sans" style={{ fontSize: '11px' }}>
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-marron pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-marron">{empresaData.nombre}</h1>
            <p className="text-sm text-gray-600">{empresaData.direccion}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-mostaza">ORDEN DE PRODUCCIÓN</h2>
            <p className="font-semibold">N° {orden.id.toString().padStart(6, '0')}</p>
            <p className="capitalize">{formatDate(orden.fecha_produccion)}</p>
          </div>
        </div>

        {/* Producto info */}
        <div className="mb-6 p-3 bg-gray-50 rounded grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-sm mb-1">PRODUCTO</h3>
            <p className="text-lg font-bold text-marron">{orden.producto}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">CANTIDAD A PRODUCIR</h3>
            <p className="text-lg font-bold text-mostaza">{orden.cantidad} unidades</p>
          </div>
        </div>

        {/* Ingredientes */}
        <h3 className="font-semibold text-sm mb-2">INGREDIENTES NECESARIOS</h3>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-marron text-white">
              <th className="border border-marron px-3 py-2 text-left">Ingrediente</th>
              <th className="border border-marron px-3 py-2 text-center w-24">Tipo</th>
              <th className="border border-marron px-3 py-2 text-center w-24">Cantidad</th>
              <th className="border border-marron px-3 py-2 text-center w-20">Unidad</th>
              <th className="border border-marron px-3 py-2 text-right w-28">Costo Est.</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((ing, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-3 py-1.5">{ing.nombre}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-center">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${ing.tipo === 'materia_prima' ? 'bg-oliva/20 text-oliva' : 'bg-mostaza/20 text-marron'}`}>
                    {ing.tipo === 'materia_prima' ? 'MP' : 'Insumo'}
                  </span>
                </td>
                <td className="border border-gray-300 px-3 py-1.5 text-center">{ing.cantidad_necesaria}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-center">{ing.unidad}</td>
                <td className="border border-gray-300 px-3 py-1.5 text-right">{formatCurrency(ing.costo_estimado)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Costos Resumen */}
        <div className="flex justify-end mb-6">
          <div className="w-72">
            <div className="flex justify-between py-1">
              <span>Costo Materias Primas:</span>
              <span>{formatCurrency(costoMateriasPrimas)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Costo Insumos:</span>
              <span>{formatCurrency(costoInsumos)}</span>
            </div>
            <div className="flex justify-between py-1 border-t-2 border-marron font-bold text-base">
              <span>COSTO TOTAL ESTIMADO:</span>
              <span>{formatCurrency(costoTotalEstimado)}</span>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {orden.observaciones && (
          <div className="mb-6 p-3 bg-gray-50 rounded">
            <h4 className="font-semibold text-sm mb-1">OBSERVACIONES</h4>
            <p>{orden.observaciones}</p>
          </div>
        )}

        {/* Firmas */}
        <div className="border-t border-gray-300 pt-6 mt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="mb-8">Supervisor: _________________________</p>
            <p>Firma y Aclaración</p>
          </div>
          <div>
            <p className="mb-8">Responsable Producción: _________________________</p>
            <p>Firma y Aclaración</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-6 text-center text-xs text-gray-500">
          <p>Documento generado el {new Date().toLocaleDateString('es-AR')} — {empresaData.nombre}</p>
        </div>
      </div>
    )
  }
)

OrdenProduccionPrint.displayName = 'OrdenProduccionPrint'
export default OrdenProduccionPrint
