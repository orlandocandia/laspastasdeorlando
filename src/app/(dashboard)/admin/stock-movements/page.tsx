'use client'

import { ArrowLeftRight } from 'lucide-react'
import StockMovementsTable from '@/components/admin/StockMovementsTable'
import ExcelExportButton from '@/components/admin/ExcelExportButton'
import StockMovementsPDFExport from '@/components/admin/StockMovementsPDFExport'

export default function StockMovementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-oliva/10 p-2">
          <ArrowLeftRight className="h-5 w-5 text-oliva" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Movimientos de Stock</h1>
          <p className="text-sm text-muted-foreground">
            Historial de entradas, salidas y ajustes de inventario
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <StockMovementsPDFExport />
        <ExcelExportButton
          fetchUrl="/api/stock-movements?limite=1000"
          filename="movimientos-stock"
          sheetName="Movimientos"
          label="Exportar Excel"
          className="border-oliva/30 text-oliva hover:bg-oliva/10"
          transform={(m) => ({
            'Fecha': new Date(m.createdAt).toLocaleDateString('es-AR'),
            'Tipo': m.tipo_movimiento,
            'Producto': m.productoTerminado?.nombre || m.materiaPrima?.nombre || '-',
            'Cantidad': m.cantidad,
            'Stock Antes': m.stock_antes,
            'Stock Después': m.stock_despues,
            'Referencia': m.referencia_tabla ? `${m.referencia_tabla} #${m.referencia_id || ''}` : '-',
            'Observación': m.observacion || '',
          })}
        />
      </div>
      <StockMovementsTable />
    </div>
  )
}
