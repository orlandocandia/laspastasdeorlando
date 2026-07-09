'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { FileSpreadsheet, Loader2, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ExcelExportButtonProps {
  fetchUrl: string
  filename: string
  sheetName?: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  // Transform function to map API data to Excel rows
  transform?: (item: any) => Record<string, any>
}

export default function ExcelExportButton({
  fetchUrl,
  filename,
  sheetName = 'Datos',
  label = 'Excel',
  variant = 'outline',
  size = 'sm',
  className = '',
  transform,
}: ExcelExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      toast.info('Generando Excel...')
      const res = await fetch(fetchUrl)
      if (!res.ok) throw new Error('Error al cargar datos')
      const data = await res.json()
      const items = data.data || data.personas || data || []

      const XLSX = await import('xlsx')
      const rows = Array.isArray(items)
        ? items.map((item: any) => (transform ? transform(item) : item))
        : []

      if (rows.length === 0) {
        toast.warning('No hay datos para exportar')
        return
      }

      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel generado')
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast.error('Error al generar Excel')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={exporting}
      className={className}
    >
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
