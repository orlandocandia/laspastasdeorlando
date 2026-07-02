import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET /api/backup/download?archivo=backup-2024-01-01.db
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const archivo = searchParams.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'Nombre de archivo requerido' }, { status: 400 })
    }

    // Security: prevent directory traversal
    const nombreSeguro = archivo.replace(/[^a-zA-Z0-9._-]/g, '')
    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, nombreSeguro)

    // Verify the file is within the backup directory
    if (!filePath.startsWith(backupDir)) {
      return NextResponse.json({ error: 'Ruta no permitida' }, { status: 403 })
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const contentType = nombreSeguro.endsWith('.sql') ? 'application/sql' : 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${nombreSeguro}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error al descargar backup:', error)
    return NextResponse.json({ error: 'Error al descargar backup' }, { status: 500 })
  }
}
