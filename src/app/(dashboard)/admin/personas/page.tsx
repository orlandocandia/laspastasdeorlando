'use client'

import { useState } from 'react'
import { UserCircle } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PersonasTable from '@/components/admin/PersonasTable'
import ExcelExportButton from '@/components/admin/ExcelExportButton'
import PersonaForm from '@/components/admin/PersonaForm'

export default function PersonasPage() {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <UserCircle className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Personas</h1>
          <p className="text-sm text-muted-foreground">
            Gestión de clientes, proveedores y empleados
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <ExcelExportButton
          fetchUrl="/api/personas?limite=1000"
          filename="personas"
          sheetName="Personas"
          label="Exportar Excel"
          className="border-oliva/30 text-oliva hover:bg-oliva/10"
          transform={(p) => ({
            'Nombre': p.nombre,
            'Apellido': p.apellido,
            'Documento': p.numero_documento,
            'Tipo': p.tipo_persona,
            'Razon Social': p.razon_social || '',
            'CUIT': p.cuit || '',
            'Telefono': p.contactos?.find((c) => c.es_principal)?.valor || p.contactos?.[0]?.valor || '',
          })}
        />
      </div>

      <PersonasTable onNewPersona={() => setFormOpen(true)} />

      {/* Create Persona Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-marron">Nueva Persona</DialogTitle>
          </DialogHeader>
          <PersonaForm
            onSuccess={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
