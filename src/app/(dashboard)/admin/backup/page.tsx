'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Database, Download, Upload, Trash2, Loader2, HardDrive, Clock, AlertTriangle, Shield, FileDown, FileText } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface BackupFile {
  nombre: string
  tamaño: number
  fecha: string
  tamañoLegible: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<BackupFile | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackupFile | null>(null)

  const fetchBackups = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/backup')
      if (!res.ok) throw new Error('Error al cargar backups')
      const data = await res.json()
      setBackups(data.data || [])
    } catch {
      toast.error('Error al cargar los backups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBackups()
  }, [fetchBackups])

  const createBackup = async (tipo: 'completo' | 'sql') => {
    setCreating(true)
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear backup')
      }
      const data = await res.json()
      toast.success(data.mensaje || 'Backup creado correctamente')
      fetchBackups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear backup')
    } finally {
      setCreating(false)
    }
  }

  const downloadBackup = (archivo: string) => {
    const link = document.createElement('a')
    link.href = `/api/backup/download?archivo=${encodeURIComponent(archivo)}`
    link.download = archivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Descarga iniciada')
  }

  const restoreBackup = async () => {
    if (!restoreTarget) return
    setRestoring(restoreTarget.nombre)
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivo: restoreTarget.nombre }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al restaurar')
      }
      const data = await res.json()
      toast.success(data.mensaje || 'Base de datos restaurada correctamente')
      fetchBackups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al restaurar backup')
    } finally {
      setRestoring(null)
      setRestoreTarget(null)
    }
  }

  const deleteBackup = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.nombre)
    try {
      const res = await fetch(`/api/backup/${encodeURIComponent(deleteTarget.nombre)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Backup eliminado correctamente')
      fetchBackups()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar backup')
    } finally {
      setDeleting(null)
      setDeleteTarget(null)
    }
  }

  // Summary calculations
  const totalBackups = backups.length
  const ultimoBackup = backups.length > 0 ? backups[0] : null
  const espacioTotal = backups.reduce((sum, b) => sum + b.tamaño, 0)
  const espacioLegible = totalBackups > 0
    ? (() => {
        if (espacioTotal === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(espacioTotal) / Math.log(k))
        return parseFloat((espacioTotal / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      })()
    : '0 B'

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileTypeBadge = (nombre: string) => {
    if (nombre.endsWith('.sql')) {
      return <Badge className="bg-oliva/10 text-oliva text-xs">SQL</Badge>
    }
    return <Badge className="bg-mostaza/10 text-mostaza text-xs">DB</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-marron">Backup y Restauración</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los respaldos de la base de datos del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => createBackup('completo')}
            disabled={creating}
            className="bg-mostaza hover:bg-mostaza/90 text-marron gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Backup Completo (.db)
          </Button>
          <Button
            onClick={() => createBackup('sql')}
            disabled={creating}
            variant="outline"
            className="border-oliva text-oliva hover:bg-oliva/10 gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Backup SQL (.sql)
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-marron/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Backups</CardTitle>
            <Database className="h-4 w-4 text-mostaza" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-marron">{totalBackups}</div>
            <p className="text-xs text-muted-foreground mt-1">archivos de respaldo</p>
          </CardContent>
        </Card>

        <Card className="border-marron/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Último Backup</CardTitle>
            <Clock className="h-4 w-4 text-oliva" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-marron">
              {ultimoBackup ? formatDate(ultimoBackup.fecha) : 'Sin backups'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ultimoBackup ? ultimoBackup.nombre : 'Cree un backup para comenzar'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-marron/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Espacio Utilizado</CardTitle>
            <HardDrive className="h-4 w-4 text-rojo" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-marron">{espacioLegible}</div>
            <p className="text-xs text-muted-foreground mt-1">en archivos de backup</p>
          </CardContent>
        </Card>
      </div>

      {/* Backup List Table */}
      <div className="rounded-lg border border-marron/10 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-marron/10">
          <h2 className="text-lg font-semibold text-marron">Archivos de Backup</h2>
          <p className="text-sm text-muted-foreground">Lista de todos los respaldos disponibles</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-mostaza mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Cargando backups...</p>
                  </TableCell>
                </TableRow>
              ) : backups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay backups disponibles</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Cree un backup para comenzar</p>
                  </TableCell>
                </TableRow>
              ) : (
                backups.map((backup) => (
                  <TableRow key={backup.nombre} className="hover:bg-mostaza/5">
                    <TableCell className="font-medium text-marron text-sm max-w-[250px] truncate">
                      {backup.nombre}
                    </TableCell>
                    <TableCell>{getFileTypeBadge(backup.nombre)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {backup.tamañoLegible}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(backup.fecha)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-oliva/10"
                          onClick={() => downloadBackup(backup.nombre)}
                          title="Descargar"
                        >
                          <Download className="h-4 w-4 text-oliva" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-mostaza/10"
                          onClick={() => setRestoreTarget(backup)}
                          disabled={restoring === backup.nombre}
                          title="Restaurar"
                        >
                          {restoring === backup.nombre ? (
                            <Loader2 className="h-4 w-4 animate-spin text-mostaza" />
                          ) : (
                            <Upload className="h-4 w-4 text-mostaza" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-rojo/10"
                          onClick={() => setDeleteTarget(backup)}
                          disabled={deleting === backup.nombre}
                          title="Eliminar"
                        >
                          {deleting === backup.nombre ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rojo" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-rojo" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Auto-backup Configuration Section (visual only) */}
      <Card className="border-marron/10">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-marron/10">
              <Shield className="h-5 w-5 text-marron" />
            </div>
            <div>
              <CardTitle className="text-marron">Configuración de Backup Automático</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Información sobre la programación de respaldos
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-oliva/5 border border-oliva/20">
                <Clock className="h-5 w-5 text-oliva mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-marron">Respaldo diario automático</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se recomienda programar un backup completo (.db) todos los días fuera del horario laboral.
                    Configure un cron job en el servidor para ejecutar la creación de backup automáticamente.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-mostaza/5 border border-mostaza/20">
                <HardDrive className="h-5 w-5 text-mostaza mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-marron">Política de retención</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se recomienda conservar los backups de los últimos 30 días y al menos un backup mensual
                    durante 12 meses. Elimine los backups antiguos manualmente desde la tabla superior.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-marron/5 border border-marron/20">
                <AlertTriangle className="h-5 w-5 text-marron mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-marron">Antes de restaurar</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    El sistema crea automáticamente un backup de seguridad antes de cada restauración
                    (prefijo &quot;pre-restore-&quot;). Esto permite revertir si la restauración no es la deseada.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-rojo/5 border border-rojo/20">
                <Database className="h-5 w-5 text-rojo mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-marron">Tipos de backup</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Completo (.db):</strong> Copia exacta de la base de datos SQLite. Recomendado para la mayoría de los casos.<br />
                    <strong>SQL (.sql):</strong> Volcado SQL legible. Útil para inspección o migración a otro motor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(open) => { if (!open) setRestoreTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-marron">
              <AlertTriangle className="h-5 w-5 text-rojo" />
              Confirmar Restauración
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                ¿Está seguro de que desea restaurar la base de datos desde el archivo{' '}
                <strong className="text-marron">{restoreTarget?.nombre}</strong>?
              </p>
              <div className="p-3 bg-rojo/5 border border-rojo/20 rounded-lg">
                <p className="text-sm text-rojo font-medium">Advertencia</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta acción reemplazará la base de datos actual con el backup seleccionado.
                  Todos los cambios realizados después de este backup se perderán.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Se creará un backup de seguridad automático antes de la restauración.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-marron/20">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={restoreBackup}
              className="bg-rojo hover:bg-rojo/90 text-white"
            >
              Sí, Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-marron">
              <Trash2 className="h-5 w-5 text-rojo" />
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar el backup{' '}
              <strong className="text-marron">{deleteTarget?.nombre}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-marron/20">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBackup}
              className="bg-rojo hover:bg-rojo/90 text-white"
            >
              Sí, Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
