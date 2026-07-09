'use client'

import { PackageOpen } from 'lucide-react'
import InsumosTable from '@/components/admin/InsumosTable'
import ExcelExportButton from '@/components/admin/ExcelExportButton'

export default function InsumosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <PackageOpen className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Insumos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los insumos y materiales de empaque
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <ExcelExportButton
          fetchUrl="/api/insumos?limite=1000"
          filename="insumos"
          sheetName="Insumos"
          label="Exportar Excel"
          className="border-oliva/30 text-oliva hover:bg-oliva/10"
          transform={(ins) => ({
            'Codigo': ins.codigo || '',
            'Nombre': ins.nombre,
            'Tipo': ins.tipoInsumo?.nombre || '',
            'Unidad': ins.unidadBase?.codigo || '',
            'Stock Actual': ins.stock_actual,
            'Stock Minimo': ins.stock_minimo,
            'Precio Ref.': ins.precio_compra_referencia,
            'Estado': ins.estado ? 'Activo' : 'Inactivo',
          })}
        />
      </div>

      <InsumosTable />
    </div>
  )
}
