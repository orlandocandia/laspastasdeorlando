import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'

interface AuthResult {
  authorized: boolean
  response?: NextResponse
  session?: {
    user: {
      id?: string
      email?: string
      role?: string
      roles?: string[]
      permisos?: string[]
    }
  }
}

/**
 * Verifies that the request has a valid authenticated session.
 * Returns { authorized: true, session } if valid, or { authorized: false, response } if not.
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'No autenticado' }, { status: 401 }),
      }
    }

    return {
      authorized: true,
      session: session as AuthResult['session'],
    }
  } catch (error) {
    console.error('[Auth] Error verifying session:', error)
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Error de autenticación' }, { status: 401 }),
    }
  }
}

/**
 * Verifies that the request has a valid session with one of the specified roles.
 */
export async function requireRole(roles: string[]): Promise<AuthResult> {
  const authResult = await requireAuth()

  if (!authResult.authorized) return authResult

  const userRoles = authResult.session!.user.roles || [authResult.session!.user.role].filter(Boolean)
  const hasRole = userRoles.some((r) => roles.includes(r))

  if (!hasRole) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'No tenés permisos para realizar esta acción' }, { status: 403 }),
    }
  }

  return authResult
}

/**
 * Verifies that the request has a valid session with admin role.
 * Shortcut for requireRole(['admin']).
 */
export async function requireAdmin(): Promise<AuthResult> {
  return requireRole(['admin'])
}
