'use client'

/**
 * ============================================================
 * Configuración de Impresoras Térmicas — Cocina Móvil
 * ============================================================
 * URL: /cm/admin/configuracion/impresoras
 * Configura el tipo de impresora, formato de ticket, etiquetas, etc.
 * ============================================================
 */

import * as React from 'react'
import { Printer, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface PrinterSettings {
  printerType: 'zebra' | 'epson' | 'generic'
  ticketWidth: '80mm' | '58mm'
  labelSize: '50x30' | '70x40' | '100x60'
  port: 'usb' | 'ip' | 'bluetooth'
  ipAddress: string | null
  copies: number
  logoEnabled: boolean
  logoUrl: string | null
  thankYouMessage: string
  footerText: string
}

export default function CmPrinterSettingsPage() {
  const [settings, setSettings] = React.useState<PrinterSettings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch('/api/cocina-movil/settings/printer')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.settings) setSettings(data.settings) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const setField = <K extends keyof PrinterSettings>(key: K, value: PrinterSettings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s))
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/cocina-movil/settings/printer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      toast.success('Configuración guardada')
    } catch {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#E1AD01]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
          <Printer className="h-6 w-6" />
          Impresoras Térmicas
        </h1>
        <p className="text-sm text-[#8A7E70]">Configuración de impresoras para tickets y etiquetas</p>
      </div>

      {/* Impresora */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Tipo de Impresora</CardTitle>
          <CardDescription className="text-xs">Selecciona el tipo de impresora térmica conectada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Tipo de Impresora</Label>
              <Select value={settings.printerType} onValueChange={(v) => setField('printerType', v as 'zebra' | 'epson' | 'generic')}>
                <SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="epson">Epson (ESC/POS)</SelectItem>
                  <SelectItem value="zebra">Zebra (ZPL)</SelectItem>
                  <SelectItem value="generic">Genérica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Puerto de Conexión</Label>
              <Select value={settings.port} onValueChange={(v) => setField('port', v as 'usb' | 'ip' | 'bluetooth')}>
                <SelectTrigger className="border-[#5C3A21]/15"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB</SelectItem>
                  <SelectItem value="ip">IP (Red)</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {settings.port === 'ip' && (
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">Dirección IP</Label>
              <Input
                value={settings.ipAddress || ''}
                onChange={(e) => setField('ipAddress', e.target.value)}
                placeholder="192.168.1.100"
                className="border-[#5C3A21]/15"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Copias por defecto</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={settings.copies}
              onChange={(e) => setField('copies', parseInt(e.target.value) || 1)}
              className="border-[#5C3A21]/15 w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Formato de Ticket</CardTitle>
          <CardDescription className="text-xs">Configuración de los tickets de venta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Ancho de Ticket</Label>
            <Select value={settings.ticketWidth} onValueChange={(v) => setField('ticketWidth', v as '80mm' | '58mm')}>
              <SelectTrigger className="border-[#5C3A21]/15 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="80mm">80mm (estándar)</SelectItem>
                <SelectItem value="58mm">58mm (mini)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[#5C3A21]">Incluir Logo en Ticket</Label>
              <p className="text-xs text-[#8A7E70] mt-0.5">Muestra el logo al inicio del ticket</p>
            </div>
            <Switch checked={settings.logoEnabled} onCheckedChange={(v) => setField('logoEnabled', v)} />
          </div>
          {settings.logoEnabled && (
            <div className="space-y-1.5">
              <Label className="text-[#5C3A21]">URL del Logo</Label>
              <Input
                value={settings.logoUrl || ''}
                onChange={(e) => setField('logoUrl', e.target.value)}
                placeholder="https://..."
                className="border-[#5C3A21]/15"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Mensaje de Agradecimiento</Label>
            <Input
              value={settings.thankYouMessage}
              onChange={(e) => setField('thankYouMessage', e.target.value)}
              className="border-[#5C3A21]/15"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Texto del Pie</Label>
            <Input
              value={settings.footerText}
              onChange={(e) => setField('footerText', e.target.value)}
              className="border-[#5C3A21]/15"
            />
          </div>
        </CardContent>
      </Card>

      {/* Etiquetas */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21]">Formato de Etiquetas</CardTitle>
          <CardDescription className="text-xs">Configuración de las etiquetas de producción</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-[#5C3A21]">Tamaño de Etiqueta</Label>
            <Select value={settings.labelSize} onValueChange={(v) => setField('labelSize', v as '50x30' | '70x40' | '100x60')}>
              <SelectTrigger className="border-[#5C3A21]/15 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50x30">50 × 30 mm (pequeña)</SelectItem>
                <SelectItem value="70x40">70 × 40 mm (mediana)</SelectItem>
                <SelectItem value="100x60">100 × 60 mm (grande)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
