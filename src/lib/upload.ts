import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const ENTITY_SUBDIRS: Record<string, string> = {
  'producto-terminado': 'productos-terminados',
  'materia-prima': 'materias-primas',
  'insumo': 'insumos',
  'persona': 'personas',
  'usuario': 'usuarios',
  'producto': 'productos',
  'categoria': 'categorias',
}

export interface UploadResult {
  url: string
  size: number
}

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten JPG, PNG, WEBP y GIF.`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo supera el límite de 5MB (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
  }
}

function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.jpg'
  return `${uuidv4()}${ext}`
}

/**
 * Upload a file using Vercel Blob Storage (production) or local filesystem (development).
 *
 * Strategy:
 * - If BLOB_READ_WRITE_TOKEN is set → use Vercel Blob (works on Vercel)
 * - Otherwise → save to public/images/uploads/{entity}/ (works locally)
 */
export async function uploadImage(
  file: File,
  entity?: string
): Promise<UploadResult> {
  validateFile(file)

  const subdir = entity ? (ENTITY_SUBDIRS[entity] || entity) : 'general'
  const filename = generateFilename(file.name)
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  if (blobToken) {
    // ─── Vercel Blob Storage (production) ───
    try {
      const { put } = await import('@vercel/blob')
      const blobPath = `uploads/${subdir}/${filename}`
      const blob = await put(blobPath, file, {
        access: 'public',
        contentType: file.type,
        token: blobToken,
      })

      return {
        url: blob.url,
        size: file.size,
      }
    } catch (blobError) {
      console.error('[Vercel Blob Error]', blobError)
      console.warn('[Upload] Falling back to local filesystem...')
      // Fall through to local filesystem
    }
  }

  // ─── Local filesystem (development / fallback) ───
  const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads', subdir)

  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true })

  const filePath = path.join(uploadDir, filename)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  await writeFile(filePath, buffer)

  // Return relative URL path (served by Next.js from public/)
  const url = `/images/uploads/${subdir}/${filename}`

  return {
    url,
    size: file.size,
  }
}

/**
 * Delete an uploaded file. Best-effort — won't throw on failure.
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Only delete local files (Vercel Blob requires separate API call)
    if (imageUrl.startsWith('/images/uploads/')) {
      const { unlink } = await import('fs/promises')
      const filePath = path.join(process.cwd(), 'public', imageUrl)
      await unlink(filePath)
    }
    // Vercel Blob files are not auto-deleted (could be referenced elsewhere)
  } catch {
    // Silently ignore — old files are cleaned up separately
  }
}
