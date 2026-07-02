import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// POST /api/backup/restore - Restore from a backup file
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { archivo } = body

    if (!archivo) {
      return NextResponse.json({ error: 'Nombre de archivo requerido' }, { status: 400 })
    }

    // Security: prevent directory traversal
    const nombreSeguro = archivo.replace(/[^a-zA-Z0-9._-]/g, '')
    const backupDir = path.join(process.cwd(), 'backups')
    const backupPath = path.join(backupDir, nombreSeguro)

    if (!backupPath.startsWith(backupDir)) {
      return NextResponse.json({ error: 'Ruta no permitida' }, { status: 403 })
    }

    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: 'Archivo de backup no encontrado' }, { status: 404 })
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    // Create a safety backup before restoring
    const safetyBackup = path.join(backupDir, `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.db`)
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, safetyBackup)
    }

    if (nombreSeguro.endsWith('.db')) {
      // Restore from DB copy
      fs.copyFileSync(backupPath, dbPath)
    } else if (nombreSeguro.endsWith('.sql')) {
      // Restore from SQL dump - requires sqlite3 CLI
      const bakPath = dbPath + '.bak'
      try {
        fs.copyFileSync(dbPath, bakPath)
        await execAsync(`sqlite3 "${dbPath}" < "${backupPath}"`)
      } catch {
        // Revert to backup
        if (fs.existsSync(bakPath)) {
          fs.copyFileSync(bakPath, dbPath)
          fs.unlinkSync(bakPath)
        }
        return NextResponse.json({ error: 'Error al restaurar SQL. Se revirtió al estado anterior.' }, { status: 500 })
      }
      // Clean up temp file
      if (fs.existsSync(bakPath)) {
        fs.unlinkSync(bakPath)
      }
    }

    return NextResponse.json({ mensaje: 'Base de datos restaurada correctamente' })
  } catch (error) {
    console.error('Error al restaurar backup:', error)
    return NextResponse.json({ error: 'Error al restaurar backup' }, { status: 500 })
  }
}
