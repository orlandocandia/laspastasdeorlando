'use client'

import { CalendarCheck } from 'lucide-react'
import ReservasClientesTable from '@/components/admin/ReservasClientesTable'
import ExcelExportButton from '@/components/admin/ExcelExportButton'

export default function ReservasClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <CalendarCheck className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Reservas de Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las reservas de productos para clientes
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <ExcelExportButton
          fetchUrl="/api/reservas-clientes?limite=1000"
          filename="reservas-clientes"
          sheetName="Reservas"
          label="Exportar Excel"
          className="border-oliva/30 text-oliva hover:bg-oliva/10"
          transform={(r) => ({
            'Cliente': r.cliente?.razon_social || `${r.cliente?.nombre || ''} ${r.cliente?.apellido || ''}`.trim(),
            'Producto': r.productoTerminado?.nombre || '-',
            'Cantidad Reservada': r.cantidad_reservada,
            'Cantidad Confirmada': r.cantidad_confirmada,
            'Fecha Reserva': r.fecha_reserva ? new Date(r.fecha_reserva).toLocaleDateString('es-AR') : '-',
            'Validez Hasta': r.fecha_validez_hasta ? new Date(r.fecha_validez_hasta).toLocaleDateString('es-AR') : '-',
            'Senia': r.senia,
            'Estado': r.estado?.nombre_estado || '-',
          })}
        />
      </div>

      <ReservasClientesTable />
    </div>
  )
}
