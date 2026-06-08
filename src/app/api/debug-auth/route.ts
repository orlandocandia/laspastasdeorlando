import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createClient } from '@libsql/client'

// GET /api/debug-auth - Diagnostic endpoint for authentication issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== 'laspastasdeorlando-debug-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const diagnosis: Record<string, unknown> = {}

  // 1. Check environment
  diagnosis.environment = {
    NODE_ENV: process.env.NODE_ENV,
    has_TURSO_DATABASE_URL: !!process.env.TURSO_DATABASE_URL,
    has_TURSO_AUTH_TOKEN: !!process.env.TURSO_AUTH_TOKEN,
    has_DATABASE_URL: !!process.env.DATABASE_URL,
    has_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    has_NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    NEXTAUTH_URL_value: process.env.NEXTAUTH_URL || '(not set)',
    TURSO_DATABASE_URL_prefix: process.env.TURSO_DATABASE_URL?.substring(0, 30) || '(not set)',
  }

  // 2. Check Prisma client configuration
  try {
    const tursoUrl = process.env.TURSO_DATABASE_URL || ''
    const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''
    const isTurso = tursoUrl.startsWith('libsql://') || tursoUrl.startsWith('http')
    
    // Try a simple DB query to verify Prisma + adapter connection
    const testCount = await db.usuario.count()
    
    diagnosis.database_connection = {
      prisma_adapter_type: isTurso ? 'Turso/libSQL' : 'Local SQLite',
      turso_url_prefix: tursoUrl.substring(0, 30) || '(not set)',
      has_auth_token: !!tursoAuthToken,
      connection_test: 'ok',
      user_count: testCount,
    }
  } catch (connErr) {
    diagnosis.database_connection = {
      connection_test: 'failed',
      error: connErr instanceof Error ? connErr.message : String(connErr),
    }
  }

  // 3. Test database connection - find user
  const testEmail = process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'admin@pastasorlando.com'
  try {
    const usuario = await db.usuario.findUnique({
      where: { email: testEmail },
      include: {
        persona: true,
        roles: { include: { rol: true } },
        twoFactor: true,
      },
    })

    if (usuario) {
      diagnosis.database = {
        status: 'connected',
        user_found: true,
        user_id: usuario.id,
        user_email: usuario.email,
        user_estado: usuario.estado,
        user_estado_type: typeof usuario.estado,
        persona_nombre: `${usuario.persona.nombre} ${usuario.persona.apellido}`,
        roles_count: usuario.roles.length,
        roles: usuario.roles.map(ur => ur.rol.nombre),
        twoFactor_activado: usuario.twoFactor?.activado ?? false,
        password_hash_prefix: usuario.password?.substring(0, 10) + '...',
        password_hash_length: usuario.password?.length,
      }

      // 4. Test bcrypt comparison
      try {
        const isValid = await bcrypt.compare('Pastas2026!', usuario.password)
        diagnosis.bcrypt_test = {
          status: 'ok',
          password_matches: isValid,
        }
      } catch (bcryptErr) {
        diagnosis.bcrypt_test = {
          status: 'error',
          error: bcryptErr instanceof Error ? bcryptErr.message : String(bcryptErr),
        }
      }
    } else {
      diagnosis.database = {
        status: 'connected',
        user_found: false,
        message: `User ${testEmail} not found in database`,
      }
    }
  } catch (dbError) {
    diagnosis.database = {
      status: 'error',
      error: dbError instanceof Error ? dbError.message : String(dbError),
      error_stack: dbError instanceof Error ? dbError.stack?.substring(0, 500) : undefined,
    }
  }

  // 5. Check user count
  try {
    const userCount = await db.usuario.count()
    diagnosis.user_count = userCount
  } catch {
    diagnosis.user_count = 'Error counting users'
  }

  return NextResponse.json(diagnosis, { status: 200 })
}
