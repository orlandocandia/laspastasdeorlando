import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// GET /api/backup - List available backups
export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), 'backups')

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db') || f.endsWith('.sql'))
      .map(f => {
        const filePath = path.join(backupDir, f)
        const stats = fs.statSync(filePath)
        return {
          nombre: f,
          tamaño: stats.size,
          fecha: stats.mtime.toISOString(),
          tamañoLegible: formatBytes(stats.size),
        }
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error('Error al listar backups:', error)
    return NextResponse.json({ error: 'Error al listar backups' }, { status: 500 })
  }
}

// POST /api/backup - Create a new backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const tipo = body.tipo || 'completo' // completo or sql

    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Base de datos no encontrada' }, { status: 404 })
    }

    if (tipo === 'sql') {
      // Export as SQL dump using sqlite3
      const sqlFileName = `backup-${timestamp}.sql`
      const sqlPath = path.join(backupDir, sqlFileName)
      try {
        await execAsync(`sqlite3 "${dbPath}" .dump > "${sqlPath}"`)
      } catch {
        // Fallback: copy the db file instead
        const dbFileName = `backup-${timestamp}.db`
        const dbBackupPath = path.join(backupDir, dbFileName)
        fs.copyFileSync(dbPath, dbBackupPath)
        return NextResponse.json({
          mensaje: 'Backup creado (copia DB - sqlite3 no disponible)',
          archivo: dbFileName,
        })
      }
      return NextResponse.json({ mensaje: 'Backup SQL creado', archivo: sqlFileName })
    } else {
      // Full DB copy
      const dbFileName = `backup-${timestamp}.db`
      const dbBackupPath = path.join(backupDir, dbFileName)
      fs.copyFileSync(dbPath, dbBackupPath)
      return NextResponse.json({ mensaje: 'Backup completo creado', archivo: dbFileName })
    }
  } catch (error) {
    console.error('Error al crear backup:', error)
    return NextResponse.json({ error: 'Error al crear backup' }, { status: 500 })
  }
}
