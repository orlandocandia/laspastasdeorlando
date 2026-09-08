/**
 * ============================================================
 * Cocina Móvil — Rate Limiter (demo, in-memory)
 * ============================================================
 * Simple rate limiter for authentication endpoints.
 * Limits by IP address + email combination.
 * In production, use Redis or Upstash Ratelimit.
 * ============================================================
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (IP + email).
 * Returns { allowed: true } if within limit, { allowed: false } if exceeded.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  // Clean up expired entries periodically
  if (entry && now > entry.resetAt) {
    rateLimitMap.delete(key)
  }

  const current = rateLimitMap.get(key)

  if (!current) {
    // First request
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: now + options.windowMs,
    }
  }

  if (current.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count++
  return {
    allowed: true,
    remaining: options.maxRequests - current.count,
    resetAt: current.resetAt,
  }
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Rate limit config for login endpoint.
 * 5 attempts per 15 minutes per IP.
 */
export const LOGIN_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
}

/**
 * Rate limit config for password recovery endpoint.
 * 3 attempts per hour per IP.
 */
export const RECOVER_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
}
