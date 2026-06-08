import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

function parseUserAgent(ua: string | null | undefined) {
  if (!ua) return { navegador: 'Desconocido', sistema_operativo: 'Desconocido', dispositivo: 'Desconocido' }

  let navegador = 'Desconocido'
  let sistema_operativo = 'Desconocido'
  let dispositivo = 'Desktop'

  // Detect OS
  if (ua.includes('Windows')) sistema_operativo = 'Windows'
  else if (ua.includes('Mac OS')) sistema_operativo = 'macOS'
  else if (ua.includes('Linux')) sistema_operativo = 'Linux'
  else if (ua.includes('Android')) { sistema_operativo = 'Android'; dispositivo = 'Mobile' }
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) { sistema_operativo = 'iOS'; dispositivo = ua.includes('iPad') ? 'Tablet' : 'Mobile' }

  // Detect Browser
  if (ua.includes('Firefox')) navegador = 'Firefox'
  else if (ua.includes('Edg/')) navegador = 'Edge'
  else if (ua.includes('Chrome')) navegador = 'Chrome'
  else if (ua.includes('Safari')) navegador = 'Safari'

  return { navegador, sistema_operativo, dispositivo }
}

async function logAcceso(data: {
  id_usuario?: number | null
  email_intento?: string | null
  resultado: string
  ip?: string | null
  user_agent?: string | null
  motivo?: string | null
}) {
  try {
    const ua = parseUserAgent(data.user_agent)
    await db.logAcceso.create({
      data: {
        id_usuario: data.id_usuario || null,
        email_intento: data.email_intento || null,
        resultado: data.resultado,
        ip: data.ip || null,
        user_agent: data.user_agent || null,
        navegador: ua.navegador,
        sistema_operativo: ua.sistema_operativo,
        dispositivo: ua.dispositivo,
        motivo: data.motivo || null,
      },
    })
  } catch (error) {
    console.error('Error logging access:', error)
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credenciales',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        codigo2fa: { label: 'Código 2FA', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[AUTH] Login attempt without email or password')
          return null
        }

        console.log(`[AUTH] Login attempt for: ${credentials.email}`)

        let usuario
        try {
          usuario = await db.usuario.findUnique({
            where: { email: credentials.email },
            include: {
              persona: true,
              roles: {
                include: {
                  rol: {
                    include: {
                      permisos: {
                        include: { permiso: true },
                      },
                    },
                  },
                },
              },
              twoFactor: true,
            },
          })
        } catch (dbError) {
          console.error('[AUTH] Database error during findUnique:', dbError)
          return null
        }

        if (!usuario) {
          console.warn(`[AUTH] User not found: ${credentials.email}`)
          await logAcceso({
            email_intento: credentials.email,
            resultado: 'FAIL',
            motivo: 'Usuario no encontrado',
          })
          return null
        }

        console.log(`[AUTH] User found: id=${usuario.id}, estado=${usuario.estado}`)

        if (!usuario.estado) {
          console.warn(`[AUTH] User deactivated: ${credentials.email}`)
          await logAcceso({
            id_usuario: usuario.id,
            email_intento: credentials.email,
            resultado: 'BLOCKED',
            motivo: 'Usuario desactivado',
          })
          return null
        }

        let isValid
        try {
          isValid = await bcrypt.compare(credentials.password, usuario.password)
        } catch (bcryptError) {
          console.error('[AUTH] bcrypt compare error:', bcryptError)
          return null
        }

        if (!isValid) {
          console.warn(`[AUTH] Invalid password for: ${credentials.email}`)
          await logAcceso({
            id_usuario: usuario.id,
            email_intento: credentials.email,
            resultado: 'FAIL',
            motivo: 'Contraseña incorrecta',
          })
          return null
        }

        console.log(`[AUTH] Password valid for: ${credentials.email}`)

        // Check if 2FA is activated
        if (usuario.twoFactor?.activado) {
          // For 2FA, we need the codigo2fa credential
          if (!credentials.codigo2fa) {
            await logAcceso({
              id_usuario: usuario.id,
              email_intento: credentials.email,
              resultado: '2FA_REQUIRED',
              motivo: 'Se requiere código 2FA',
            })
            // Return a special object to indicate 2FA is needed
            // NextAuth doesn't support this natively, so we return null
            // The frontend will handle this by checking the 2FA status
            return null
          }

          // Verify 2FA code
          const speakeasy = await import('speakeasy')
          const verified = speakeasy.totp.verify({
            secret: usuario.twoFactor.secret_2fa!,
            encoding: 'base32',
            token: credentials.codigo2fa,
            window: 2,
          })

          // Also check backup codes
          let usedBackupCode = false
          if (!verified && usuario.twoFactor.codigos_respaldo) {
            const codigos = JSON.parse(usuario.twoFactor.codigos_respaldo) as string[]
            const codeIndex = codigos.indexOf(credentials.codigo2fa)
            if (codeIndex !== -1) {
              usedBackupCode = true
              codigos.splice(codeIndex, 1)
              await db.usuario2FA.update({
                where: { id_usuario: usuario.id },
                data: {
                  codigos_respaldo: JSON.stringify(codigos),
                  fecha_ultimo_uso: new Date(),
                },
              })
            }
          }

          if (!verified && !usedBackupCode) {
            await logAcceso({
              id_usuario: usuario.id,
              email_intento: credentials.email,
              resultado: '2FA_FAIL',
              motivo: 'Código 2FA incorrecto',
            })
            return null
          }

          await logAcceso({
            id_usuario: usuario.id,
            email_intento: credentials.email,
            resultado: '2FA_OK',
          })

          // Update last use date
          await db.usuario2FA.update({
            where: { id_usuario: usuario.id },
            data: { fecha_ultimo_uso: new Date() },
          })
        } else {
          await logAcceso({
            id_usuario: usuario.id,
            email_intento: credentials.email,
            resultado: 'OK',
          })
        }

        // Create active session record
        const sessionId = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await db.sesionActiva.create({
          data: {
            id_sesion: sessionId,
            id_usuario: usuario.id,
            fecha_expiracion: expiresAt,
            estado: 'active',
          },
        })

        // Obtener roles y permisos
        const roles = usuario.roles.map((ur) => ur.rol.nombre)
        const permisos = usuario.roles.flatMap((ur) =>
          ur.rol.permisos.map((rp) => rp.permiso.nombre)
        )

        return {
          id: usuario.id.toString(),
          email: usuario.email,
          name: `${usuario.persona.nombre} ${usuario.persona.apellido}`,
          role: roles[0] || 'cliente',
          roles,
          permisos,
          imagen: usuario.imagen || usuario.persona.imagen,
          twoFactorEnabled: usuario.twoFactor?.activado || false,
          sessionId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role
        token.roles = (user as { roles: string[] }).roles
        token.permisos = (user as { permisos: string[] }).permisos
        token.id = user.id
        token.imagen = (user as { imagen?: string }).imagen
        token.twoFactorEnabled = (user as { twoFactorEnabled?: boolean }).twoFactorEnabled
        token.sessionId = (user as { sessionId?: string }).sessionId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string
        ;(session.user as { roles?: string[] }).roles = token.roles as string[]
        ;(session.user as { permisos?: string[] }).permisos = token.permisos as string[]
        ;(session.user as { id?: string }).id = token.id as string
        ;(session.user as { imagen?: string }).imagen = token.imagen as string
        ;(session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled = token.twoFactorEnabled as boolean
        ;(session.user as { sessionId?: string }).sessionId = token.sessionId as string
      }
      return session
    },
  },
  events: {
    async signOut({ token }) {
      // Mark session as expired on sign out
      const sessionId = token?.sessionId as string | undefined
      if (sessionId) {
        try {
          await db.sesionActiva.updateMany({
            where: { id_sesion: sessionId, estado: 'active' },
            data: { estado: 'revoked', fecha_fin: new Date() },
          })
        } catch {
          // Silently fail
        }
      }
    },
  },
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'laspastasdeorlando-secret-key-2026',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
