/**
 * ============================================================
 * Proxy (middleware) — Detección de subdominio "cocinamovil"
 * ============================================================
 *
 * Nota: En Next.js 16, el archivo `middleware.ts` fue renombrado
 * a `proxy.ts` y la función exportada debe llamarse `proxy` (no
 * `middleware`). La API y el comportamiento son idénticos.
 *
 * El sistema principal "El Amigo de las Pastas" corre en
 *   https://laspastasdeorlando.com.ar
 *
 * El nuevo subsistema "Cocina Móvil" corre en
 *   https://cocinamovil.laspastasdeorlando.com.ar
 *
 * Reglas:
 *  1) En el subdominio `cocinamovil.*` (o en localhost para dev),
 *     la raíz `/` redirige a `/login` (página de login de la cocina móvil).
 *  2) Las rutas exclusivas de la cocina móvil (`/login`, `/recover-password`,
 *     y en el futuro `/dashboard`, `/pedidos`, `/stock`, `/perfil`, etc.)
 *     NO son accesibles desde el dominio principal en producción:
 *     se redirigen a `/` para no romper el sistema actual.
 *  3) En localhost (desarrollo), todas las rutas son accesibles para
 *     facilitar las pruebas sin necesidad de configurar el subdominio.
 *  4) Las rutas de la API (`/api/*`) y los archivos estáticos no se tocan.
 *
 * Nota: la "página de redirección por defecto" de la cocina móvil
 * (equivalente a `src/app/(cocina-movil)/page.tsx`) se implementa aquí
 * en el middleware, porque Next.js no permite que dos `page.tsx`
 * resuelvan a la misma URL `/` (incluso en route groups distintos).
 * ============================================================
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ----- Configuración de dominios -----
const MAIN_DOMAIN = 'laspastasdeorlando.com.ar'
const CM_SUBDOMAIN_PREFIX = 'cocinamovil.'

// Rutas exclusivas del subsistema Cocina Móvil.
// Cualquier path que empiece con uno de estos prefijos se considera
// "ruta de cocina móvil" y se bloquea en el dominio principal.
const CM_ROUTE_PREFIXES = [
  '/login',
  '/recover-password',
  '/dashboard',
  '/pedidos',
  '/stock',
  '/perfil',
  '/cm',              // prefijo exclusivo de cocina-movil (/cm/admin/*, /cm/cocina/*, etc.)
  '/cocina',          // reservado para uso futuro
  '/recepciones',     // reservado para uso futuro
  '/inventario-cm',   // reservado para uso futuro
]

function isCmRoute(pathname: string): boolean {
  return CM_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

function isCocinaMovilHost(host: string): boolean {
  // Cocina-movil subdomain: `cocinamovil.laspastasdeorlando.com.ar`
  // o cualquier subdominio que empiece con `cocinamovil.`
  return host.startsWith(CM_SUBDOMAIN_PREFIX)
}

function isLocalhost(host: string): boolean {
  // En desarrollo local no hay subdominio real, así que permitimos
  // todas las rutas para poder probar tanto el sistema principal
  // como la cocina móvil desde el mismo `localhost:3000`.
  return (
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('0.0.0.0') ||
    host.startsWith('::1')
  )
}

function isMainProductionDomain(host: string): boolean {
  // Dominio principal en producción (sin el subdominio cocina-movil).
  // Acepta `laspastasdeorlando.com.ar` y `www.laspastasdeorlando.com.ar`.
  // También acepta Vercel preview domains (*.vercel.app) como "main"
  // para no romper los deploys de prueba.
  if (isCocinaMovilHost(host) || isLocalhost(host)) return false
  if (host === MAIN_DOMAIN) return true
  if (host === `www.${MAIN_DOMAIN}`) return true
  if (host.endsWith(`.${MAIN_DOMAIN}`) && !isCocinaMovilHost(host)) return true
  if (host.endsWith('.vercel.app')) return true
  return false
}

export function proxy(request: NextRequest) {
  // En Vercel (y otros proxies inversos), el header `Host` puede ser el del
  // proxy interno, no el original del cliente. Vercel setea `X-Forwarded-Host`
  // con el host original que vio el navegador del usuario.
  // Prioridad: X-Forwarded-Host > Host
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  const { pathname, search, hash } = request.nextUrl

  // Detect cocina-movil subdomain: `cocinamovil.laspastasdeorlando.com.ar`
  // (or cualquier subdominio que empiece con `cocinamovil.`).
  const isCmHost = isCocinaMovilHost(host)
  const isLocal = isLocalhost(host)
  const isMain = isMainProductionDomain(host)

  // La cocina móvil es accesible desde el subdominio `cocinamovil.*`
  // y desde localhost (dev). En cualquier otro caso se considera
  // "dominio principal" y las rutas de cocina móvil se bloquean.
  const cmAccessible = isCmHost || isLocal

  // --------------------------------------------------------------
  // 1) En el subdominio `cocinamovil.*` (NO en localhost), la raíz
  //    `/` redirige a `/login`. Esto reemplaza al hipotético
  //    `src/app/(cocina-movil)/page.tsx` (que no puede existir
  //    porque conflicta con `src/app/page.tsx` del sistema principal).
  //
  //    IMPORTANTE: En localhost NO se aplica este redirect, para que
  //    el sistema principal siga siendo accesible en desarrollo.
  //    Las rutas de cocina móvil (`/login`, `/recover-password`) sí
  //    son accesibles en localhost para facilitar las pruebas.
  // --------------------------------------------------------------
  if (isCmHost && pathname === '/') {
    const loginUrl = new URL('/login', request.url)
    // Preservar query string (por si viene con parámetros como ?next=...)
    if (search) loginUrl.search = search
    if (hash) loginUrl.hash = hash
    return NextResponse.redirect(loginUrl)
  }

  // --------------------------------------------------------------
  // 2) En el dominio PRINCIPAL en producción, las rutas exclusivas
  //    de la cocina móvil se redirigen a `/` para evitar que el
  //    sistema principal las sirva por error.
  //    (Esto NO aplica a localhost para permitir pruebas.)
  // --------------------------------------------------------------
  if (isMain && !cmAccessible && isCmRoute(pathname)) {
    const mainUrl = new URL('/', request.url)
    return NextResponse.redirect(mainUrl)
  }

  // --------------------------------------------------------------
  // 3) En cualquier otro caso, dejar pasar la solicitud tal cual.
  //    Next.js resolverá la ruta normalmente.
  // --------------------------------------------------------------
  return NextResponse.next()
}

export const config = {
  // Aplicar el middleware a todas las rutas EXCEPTO:
  //  - API routes (/api/*)
  //  - Archivos estáticos de Next.js (_next/static, _next/image)
  //  - Archivos comunes (favicon.ico, robots.txt, sitemap.xml)
  //  - Assets con extensión conocida (svg, png, jpg, css, js, fonts, etc.)
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|txt|xml|map).*$).*)',
  ],
}
