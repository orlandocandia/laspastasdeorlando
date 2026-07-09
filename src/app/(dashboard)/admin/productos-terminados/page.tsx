'use client'

import { UtensilsCrossed } from 'lucide-react'
import ProductosTerminadosTable from '@/components/admin/ProductosTerminadosTable'
import ExcelExportButton from '@/components/admin/ExcelExportButton'

export default function ProductosTerminadosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-rojo/10 p-2">
          <UtensilsCrossed className="h-5 w-5 text-rojo" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Productos Terminados</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los productos terminados para producción y ventas
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <ExcelExportButton
          fetchUrl="/api/productos-terminados?limite=1000"
          filename="productos-terminados"
          sheetName="Productos"
          label="Exportar Excel"
          className="border-oliva/30 text-oliva hover:bg-oliva/10"
          transform={(p) => ({
            'Código': p.codigo || '',
            'Nombre': p.nombre,
            'Categoría': p.categoria?.nombre || '',
            'Stock Actual': p.stock_actual,
            'Stock Mínimo': p.stock_minimo,
            'Precio Venta': p.precio_venta,
            'Destacado': p.destacado ? 'Sí' : 'No',
            'Visible Landing': p.visible_en_landing ? 'Sí' : 'No',
            'Estado': p.estado ? 'Activo' : 'Inactivo',
          })}
        />
      </div>
      <ProductosTerminadosTable />
    </div>
  )
}
