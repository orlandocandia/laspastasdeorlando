'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { FileSearch, Search, Loader2, ChevronLeft, ChevronRight, AlertTriangle, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LogAcceso {
  id: number
  email: string
  resultado: string
  ip: string
  navegador: string | null
  so: string | null
  dispositivo: string | null
  motivo: string | null
  fecha: string
}

interface SuspiciousIP {
  ip: string
  failed_count: number
  last_attempt: string
}

interface LogsResponse {
  data: LogAcceso[]
  total: number
  pagina: number
  totalPaginas: number
  suspicious_ips?: SuspiciousIP[]
}

const resultadoColors: Record<string, string> = {
  OK: 'bg-oliva/10 text-oliva',
  FAIL: 'bg-rojo/10 text-rojo',
  BLOCKED: 'bg-orange-500/10 text-orange-600',
  '2FA_REQUIRED': 'bg-mostaza/10 text-mostaza',
  '2FA_OK': 'bg-oliva/10 text-oliva',
  '2FA_FAIL': 'bg-rojo/10 text-rojo',
}

const resultadoLabels: Record<string, string> = {
  OK: 'OK',
  FAIL: 'Fallido',
  BLOCKED: 'Bloqueado',
  '2FA_REQUIRED': '2FA Requerido',
  '2FA_OK': '2FA OK',
  '2FA_FAIL': '2FA Fallido',
}

export default function LogsAccesoPage() {
  const [logs, setLogs] = useState<LogAcceso[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [resultado, setResultado] = useState<string>('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [total, setTotal] = useState(0)
  const [suspiciousIPs, setSuspiciousIPs] = useState<SuspiciousIP[]>([])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagina.toString())
      params.set('limit', '20')
      if (email) params.set('email', email)
      if (resultado) params.set('resultado', resultado)
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)

      const res = await fetch(`/api/seguridad/logs-acceso?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar logs')
      const data: LogsResponse = await res.json()
      setLogs(data.data || [])
      setTotal(data.total || 0)
      setTotalPaginas(data.totalPaginas || 1)
      setSuspiciousIPs(data.suspicious_ips || [])
    } catch {
      toast.error('Error al cargar logs de acceso')
    } finally {
      setLoading(false)
    }
  }, [pagina, email, resultado, fechaDesde, fechaHasta])

  useEffect(() => { fetchLogs() }, [fetchLogs])
  useEffect(() => { setPagina(1) }, [email, resultado, fechaDesde, fechaHasta])

  const [exporting, setExporting] = useState(false)

  const exportExcel = async () => {
    setExporting(true)
    try {
      toast.info('Generando Excel...')
      // Fetch all logs matching current filters (sin paginacion)
      const params = new URLSearchParams()
      params.set('page', '1')
      params.set('limit', '10000')
      if (email) params.set('email', email)
      if (resultado) params.set('resultado', resultado)
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)
      const res = await fetch(`/api/seguridad/logs-acceso?${params.toString()}`)
      if (!res.ok) throw new Error('Error al cargar logs')
      const data: LogsResponse = await res.json()
      const logsAll = data.data || []
      if (logsAll.length === 0) {
        toast.warning('No hay registros para exportar')
        return
      }
      const rows = logsAll.map((l) => ({
        'Fecha': new Date(l.fecha).toLocaleString('es-AR'),
        'Email': l.email || '-',
        'Resultado': resultadoLabels[l.resultado] || l.resultado,
        'IP': l.ip || '-',
        'Navegador': l.navegador || '-',
        'SO': l.so || '-',
        'Dispositivo': l.dispositivo || '-',
        'Motivo': l.motivo || '-',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Logs de Acceso')
      XLSX.writeFile(wb, `logs-acceso-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel generado')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Error al generar Excel')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-mostaza/10 p-2">
          <FileSearch className="h-5 w-5 text-mostaza" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-marron">Logs de Acceso</h1>
          <p className="text-sm text-muted-foreground">
            Registro de todos los intentos de acceso al sistema
          </p>
        </div>
      </div>

      {/* Suspicious IPs */}
      {suspiciousIPs.length > 0 && (
        <Card className="border-rojo/20 bg-rojo/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rojo" />
              <CardTitle className="text-rojo text-base">Actividad Sospechosa Detectada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Las siguientes IPs tienen múltiples intentos de acceso fallidos:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {suspiciousIPs.map(sip => (
                <div key={sip.ip} className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-rojo/10">
                  <div>
                    <span className="font-mono text-sm text-marron">{sip.ip}</span>
                    <p className="text-xs text-muted-foreground">
                      Último intento: {new Date(sip.last_attempt).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge className="bg-rojo/10 text-rojo border-rojo/20">
                    {sip.failed_count} fallo{sip.failed_count !== 1 ? 's' : ''}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={resultado} onValueChange={setResultado}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Resultado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="OK">OK</SelectItem>
            <SelectItem value="FAIL">Fallido</SelectItem>
            <SelectItem value="BLOCKED">Bloqueado</SelectItem>
            <SelectItem value="2FA_REQUIRED">2FA Requerido</SelectItem>
            <SelectItem value="2FA_OK">2FA OK</SelectItem>
            <SelectItem value="2FA_FAIL">2FA Fallido</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="w-full lg:w-40"
          placeholder="Desde"
        />
        <Input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="w-full lg:w-40"
          placeholder="Hasta"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={exportExcel}
          disabled={exporting}
          className="gap-1.5 border-oliva/30 text-oliva hover:bg-oliva/10"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          Excel
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="hidden md:table-cell">IP</TableHead>
                <TableHead className="hidden lg:table-cell">Navegador</TableHead>
                <TableHead className="hidden xl:table-cell">SO</TableHead>
                <TableHead className="hidden xl:table-cell">Dispositivo</TableHead>
                <TableHead className="hidden md:table-cell">Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-mostaza mx-auto" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros de acceso
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-mostaza/5">
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="font-medium text-marron text-sm">
                      {log.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${resultadoColors[log.resultado] || 'bg-muted text-muted-foreground'} text-xs`}>
                        {resultadoLabels[log.resultado] || log.resultado}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                      {log.ip || '-'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[120px] truncate">
                      {log.navegador || '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {log.so || '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                      {log.dispositivo || '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[150px] truncate">
                      {log.motivo || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} registro{total !== 1 ? 's' : ''} — Página {pagina} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => setPagina(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => p + 1)}
            >
              Siguiente <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
