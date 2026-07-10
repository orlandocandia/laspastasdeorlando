'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, Loader2, FileText, Image as ImageIcon, QrCode } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ConfigData {
  empresa_nombre: string
  empresa_direccion: string
  empresa_telefono: string
  empresa_email: string
  empresa_cuit: string
  empresa_condicion: string
  empresa_inicio_act: string
  logo_url: string | null
  footer_texto: string
  mostrar_qr: boolean
  qr_url_base: string
  texto_condiciones: string
  color_acento: string
}

export default function DocumentoConfigEditor() {
  const [config, setConfig] = useState<ConfigData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/config-documentos')
      if (!res.ok) throw new Error('Error al cargar configuración')
      const data = await res.json()
      setConfig(data)
    } catch {
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/config-documentos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }
      toast.success('Configuración guardada')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const update = (field: keyof ConfigData, value: string | boolean | null) => {
    setConfig((prev) => prev ? { ...prev, [field]: value } : prev)
  }

  if (loading || !config) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Datos de la empresa */}
      <Card className="border-marron/10">
        <CardHeader>
          <CardTitle className="text-base text-marron flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Datos de la Empresa (para PDFs)
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-marron">Nombre</Label>
            <Input value={config.empresa_nombre} onChange={(e) => update('empresa_nombre', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-marron">CUIT</Label>
            <Input value={config.empresa_cuit} onChange={(e) => update('empresa_cuit', e.target.value)} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-marron">Dirección</Label>
            <Input value={config.empresa_direccion} onChange={(e) => update('empresa_direccion', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-marron">Teléfono</Label>
            <Input value={config.empresa_telefono} onChange={(e) => update('empresa_telefono', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-marron">Email</Label>
            <Input value={config.empresa_email} onChange={(e) => update('empresa_email', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-marron">Condición IVA</Label>
            <Input value={config.empresa_condicion} onChange={(e) => update('empresa_condicion', e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-marron">Inicio de Actividades</Label>
            <Input value={config.empresa_inicio_act} onChange={(e) => update('empresa_inicio_act', e.target.value)} className="mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card className="border-marron/10">
        <CardHeader>
          <CardTitle className="text-base text-marron flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Logo (URL)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-marron">URL del logo (se mostrará en los PDFs si se especifica)</Label>
          <Input
            value={config.logo_url || ''}
            onChange={(e) => update('logo_url', e.target.value || null)}
            placeholder="https://ejemplo.com/logo.png"
            className="mt-1"
          />
          {config.logo_url ? (
            <div className="mt-3 flex items-center gap-3">
              <img src={config.logo_url} alt="Logo" className="h-16 w-16 object-contain border rounded" />
              <Button variant="ghost" size="sm" className="text-rojo" onClick={() => update('logo_url', null)}>
                Quitar logo
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* QR y personalización */}
      <Card className="border-marron/10">
        <CardHeader>
          <CardTitle className="text-base text-marron flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Códigos QR y Personalización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-marron">Mostrar código QR en PDFs</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Genera un QR en Facturas, Órdenes de Compra y Producción con un enlace de verificación.
              </p>
            </div>
            <Switch checked={config.mostrar_qr} onCheckedChange={(v) => update('mostrar_qr', v)} />
          </div>
          <div>
            <Label className="text-marron">URL base para el QR (opcional)</Label>
            <Input
              value={config.qr_url_base}
              onChange={(e) => update('qr_url_base', e.target.value)}
              placeholder="https://laspastasdeorlando.vercel.app"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si se especifica, el QR apuntará a esta URL + /admin/... Si está vacío, el QR contendrá un código de verificación.
            </p>
          </div>
          <div>
            <Label className="text-marron">Color de acento (hex)</Label>
            <Input
              value={config.color_acento}
              onChange={(e) => update('color_acento', e.target.value)}
              placeholder="#E1AD01"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Textos */}
      <Card className="border-marron/10">
        <CardHeader>
          <CardTitle className="text-base text-marron">Textos de Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-marron">Texto del pie de página</Label>
            <Textarea
              value={config.footer_texto}
              onChange={(e) => update('footer_texto', e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label className="text-marron">Texto de condiciones de entrega</Label>
            <Textarea
              value={config.texto_condiciones}
              onChange={(e) => update('texto_condiciones', e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar configuración
        </Button>
      </div>
    </div>
  )
}
