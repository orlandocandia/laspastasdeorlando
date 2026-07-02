import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const nombreSeguro = filename.replace(/[^a-zA-Z0-9._-]/g, '')
    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, nombreSeguro)

    if (!filePath.startsWith(backupDir)) {
      return NextResponse.json({ error: 'Ruta no permitida' }, { status: 403 })
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    fs.unlinkSync(filePath)
    return NextResponse.json({ mensaje: 'Backup eliminado' })
  } catch (error) {
    console.error('Error al eliminar backup:', error)
    return NextResponse.json({ error: 'Error al eliminar backup' }, { status: 500 })
  }
}
