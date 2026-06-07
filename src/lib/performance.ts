'use client'

/**
 * Image Performance Monitor for Pastas Orlando
 *
 * Measures and logs image load times, detects off-screen loading,
 * duplicate loads, and hidden image waste.
 *
 * Usage: Call `initImagePerformanceMonitor()` once on app mount.
 * Access `getImagePerformanceReport()` anytime for a summary.
 */

interface ImageLoadRecord {
  src: string
  loadTimeMs: number
  timestamp: number
  wasOffScreen: boolean
  wasHidden: boolean
  naturalWidth: number
  naturalHeight: number
  renderedWidth: number
  renderedHeight: number
}

// In-memory store of all image loads
const imageLoads: ImageLoadRecord[] = []

// Track which src URLs have been seen (to detect duplicates)
const srcSeenCount = new Map<string, number>()

// PerformanceObserver for Resource Timing API
let observer: PerformanceObserver | null = null

/**
 * Check if an element is off-screen (below the fold or outside viewport)
 */
function isOffScreen(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  return (
    rect.bottom < 0 ||
    rect.top > window.innerHeight ||
    rect.right < 0 ||
    rect.left > window.innerWidth
  )
}

/**
 * Check if an element is hidden via CSS (display:none, visibility:hidden, opacity:0, etc.)
 */
function isHidden(el: HTMLElement): boolean {
  const style = getComputedStyle(el)
  return (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0' ||
    (el as HTMLElement).offsetParent === null
  )
}

/**
 * Handle an image load event — record timing and check for issues
 */
function onImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  if (!img || !img.src) return

  // Skip tiny tracking pixels and data URIs
  if (img.naturalWidth < 10 || img.src.startsWith('data:')) return

  // Get load time from Resource Timing API
  let loadTimeMs = 0
  const entries = performance.getEntriesByName(img.src, 'resource')
  const lastEntry = entries[entries.length - 1] as PerformanceResourceTiming | undefined
  if (lastEntry) {
    loadTimeMs = Math.round(lastEntry.responseEnd - lastEntry.startTime)
  }

  const src = img.src.split('?')[0] // Normalize without query params
  const offScreen = isOffScreen(img)
  const hidden = isHidden(img)

  // Extract a readable label from Next.js image proxy URLs
  let label = src.split('/').pop() || src
  if (img.src.includes('/_next/image?url=')) {
    try {
      const urlParam = new URL(img.src).searchParams.get('url')
      if (urlParam) label = decodeURIComponent(urlParam.split('/').pop() || label)
    } catch { /* ignore */ }
  }

  const record: ImageLoadRecord = {
    src,
    loadTimeMs,
    timestamp: Date.now(),
    wasOffScreen: offScreen,
    wasHidden: hidden,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    renderedWidth: img.clientWidth,
    renderedHeight: img.clientHeight,
  }

  imageLoads.push(record)

  // Track duplicates
  const count = (srcSeenCount.get(src) || 0) + 1
  srcSeenCount.set(src, count)

  // Log to console with color coding
  const sizeRatio = img.clientWidth > 0
    ? Math.round((img.naturalWidth / img.clientWidth) * 100) / 100
    : 0

  if (hidden) {
    console.warn(
      `%c🚫 Imagen oculta cargada: ${label} (${loadTimeMs}ms) — display:none o visibility:hidden`,
      'color: #ef4444; font-weight: bold'
    )
  } else if (offScreen) {
    console.warn(
      `%c⬇️ Imagen off-screen cargada: ${label} (${loadTimeMs}ms) — fuera del viewport`,
      'color: #f59e0b; font-weight: bold'
    )
  } else if (count > 1) {
    console.warn(
      `%c🔄 Imagen duplicada: ${label} (carga #${count}, ${loadTimeMs}ms)`,
      'color: #8b5cf6; font-weight: bold'
    )
  } else if (sizeRatio > 3) {
    console.warn(
      `%c📐 Imagen sobredimensionada: ${label} — ${img.naturalWidth}×${img.naturalHeight}px servida para ${img.clientWidth}×${img.clientHeight}px (${sizeRatio}x)`,
      'color: #f97316'
    )
  } else {
    console.log(
      `%c✅ Imagen cargada: ${label} en ${loadTimeMs}ms (${img.naturalWidth}×${img.naturalHeight}px)`,
      'color: #22c55e'
    )
  }
}

/**
 * Initialize the image performance monitor
 * Call once on app mount (in a client component)
 */
export function initImagePerformanceMonitor() {
  if (typeof window === 'undefined') return

  // Listen for all image load events via event delegation
  document.addEventListener('load', onImageLoad, true)

  // Also use PerformanceObserver for resource timing
  try {
    observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'img' && entry.name.includes('/_next/image')) {
          // Next.js optimized images — we already track via DOM load events
          // This is just for timing data enrichment
        }
      }
    })
    observer.observe({ type: 'resource', buffered: false })
  } catch {
    // PerformanceObserver not supported — fallback to DOM events only
  }

  // Log initial summary after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const report = getImagePerformanceReport()
      console.group('%c📊 Image Performance Report — Pastas Orlando', 'color: #E1AD01; font-size: 14px; font-weight: bold')
      console.log(`Total imágenes cargadas: ${report.totalImages}`)
      console.log(`Imágenes off-screen: ${report.offScreenImages}`)
      console.log(`Imágenes ocultas: ${report.hiddenImages}`)
      console.log(`Imágenes duplicadas: ${report.duplicateImages}`)
      console.log(`Tiempo total de carga: ${report.totalLoadTimeMs}ms`)
      console.log(`Tiempo promedio por imagen: ${report.avgLoadTimeMs}ms`)
      if (report.slowImages.length > 0) {
        console.warn('Imágenes lentas (>1s):', report.slowImages)
      }
      if (report.duplicateSrcs.length > 0) {
        console.warn('URLs duplicadas:', report.duplicateSrcs)
      }
      console.groupEnd()
    }, 3000) // Wait 3s for all images to settle
  })
}

/**
 * Get a summary report of all image loads
 */
export function getImagePerformanceReport() {
  const totalImages = imageLoads.length
  const offScreenImages = imageLoads.filter((r) => r.wasOffScreen).length
  const hiddenImages = imageLoads.filter((r) => r.wasHidden).length
  const totalLoadTimeMs = imageLoads.reduce((sum, r) => sum + r.loadTimeMs, 0)
  const avgLoadTimeMs = totalImages > 0 ? Math.round(totalLoadTimeMs / totalImages) : 0
  const slowImages = imageLoads
    .filter((r) => r.loadTimeMs > 1000)
    .map((r) => ({ src: r.src.split('/').pop(), ms: r.loadTimeMs }))
  const duplicateSrcs = Array.from(srcSeenCount.entries())
    .filter(([, count]) => count > 1)
    .map(([src, count]) => ({ src: src.split('/').pop(), count }))

  return {
    totalImages,
    offScreenImages,
    hiddenImages,
    duplicateImages: duplicateSrcs.length,
    totalLoadTimeMs,
    avgLoadTimeMs,
    slowImages,
    duplicateSrcs,
    records: imageLoads,
  }
}

/**
 * Cleanup the monitor (for unmount)
 */
export function cleanupImagePerformanceMonitor() {
  document.removeEventListener('load', onImageLoad, true)
  observer?.disconnect()
  observer = null
}
