'use client'

/**
 * ============================================================
 * Cocina Móvil — Avatar Uploader
 * ============================================================
 * Componente profesional para subir avatares de usuarios.
 *
 * Características:
 *  - Vista previa circular (100x100px)
 *  - Si hay avatar: muestra la imagen
 *  - Si no hay avatar: muestra las iniciales del usuario
 *  - Botón "Seleccionar imagen" (abre explorador de archivos)
 *  - En modo edición: botones "Cambiar" y "Eliminar"
 *  - Subida a Vercel Blob via API route
 *  - Loading spinner durante la subida
 *  - Validación: solo imágenes, máx 5MB
 *
 * Props:
 *  - value: string | null  (URL del avatar actual)
 *  - onChange: (url: string | null) => void
 *  - initials: string  (ej: "OC" para Orlando Candia)
 *  - role?: CmRole  (para color del fallback)
 *  - size?: 'sm' | 'md' | 'lg'  (default: 'lg')
 * ============================================================
 */

import * as React from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2, Upload, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type CmRole = 'admin' | 'cocinero' | 'supervisor'

interface AvatarUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  initials: string
  role?: CmRole
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const SIZE_MAP = {
  sm: { container: 'h-12 w-12', text: 'text-sm', icon: 'h-5 w-5' },
  md: { container: 'h-16 w-16', text: 'text-base', icon: 'h-6 w-6' },
  lg: { container: 'h-24 w-24', text: 'text-2xl', icon: 'h-8 w-8' },
}

function avatarBg(role?: CmRole): string {
  switch (role) {
    case 'admin':
      return 'bg-[#5C3A21] text-[#FFF8E7]'
    case 'cocinero':
      return 'bg-[#708238] text-[#FFF8E7]'
    case 'supervisor':
      return 'bg-[#E1AD01] text-[#1F1611]'
    default:
      return 'bg-[#5C3A21] text-[#FFF8E7]'
  }
}

export default function AvatarUploader({
  value,
  onChange,
  initials,
  role,
  size = 'lg',
  disabled = false,
}: AvatarUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const dims = SIZE_MAP[size]

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen (JPG, PNG, GIF, WebP).')
      return
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/cocina-movil/users/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir la imagen.')
      }

      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      setUploading(false)
      // Reset input para permitir seleccionar el mismo archivo nuevamente
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setError(null)
    onChange(null)
  }

  const handleClick = () => {
    if (!disabled && !uploading) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div
            className={cn(
              'rounded-full overflow-hidden ring-4 ring-offset-2 ring-offset-[#FFF8E7] transition-all cursor-pointer',
              dims.container,
              value ? 'ring-[#E1AD01]/30' : `ring-[#5C3A21]/10 ${avatarBg(role)}`,
              !disabled && 'hover:ring-[#E1AD01]/50'
            )}
            onClick={handleClick}
          >
            {value ? (
              <Image
                src={value}
                alt="Avatar"
                fill
                sizes="96px"
                className="object-cover rounded-full"
                unoptimized
              />
            ) : (
              <div className={cn('h-full w-full flex items-center justify-center font-bold', dims.text, avatarBg(role))}>
                {initials || '?'}
              </div>
            )}

            {/* Overlay on hover */}
            {!disabled && !uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className={cn('text-white', dims.icon)} />
              </div>
            )}

            {/* Loading overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className={cn('animate-spin text-[#E1AD01]', dims.icon)} />
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5C3A21] bg-[#FFF8E7] border border-[#5C3A21]/20 rounded-md hover:bg-[#FBF1DC] hover:border-[#E1AD01]/40 disabled:opacity-50 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {value ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md hover:bg-[#B91C1C]/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-2.5 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Help text */}
      <p className="text-[10px] text-[#8A7E70]/70 text-center">
        JPG, PNG, GIF o WebP · Máx 5MB
      </p>
    </div>
  )
}
