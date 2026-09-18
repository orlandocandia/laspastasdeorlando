'use client'

/**
 * ============================================================
 * Cocina Móvil — Image Uploader (rectangular)
 * ============================================================
 * Componente para subir imágenes rectangulares (lugares, etc.).
 * Similar al AvatarUploader pero con vista previa rectangular.
 *
 * Props:
 *  - value: string | null  (URL de la imagen actual)
 *  - onChange: (url: string | null) => void
 *  - uploadUrl: string  (endpoint de subida, ej: /api/cocina-movil/places/upload-image)
 *  - label?: string  (ej: "Imagen del lugar")
 *  - aspectRatio?: '16/9' | '4/3' | '1/1'  (default: '4/3')
 *  - disabled?: boolean
 * ============================================================
 */

import * as React from 'react'
import { Camera, Trash2, Loader2, Upload, ImagePlus, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  value: string | null
  onChange: (url: string | null) => void
  uploadUrl: string
  label?: string
  aspectRatio?: '16/9' | '4/3' | '1/1'
  disabled?: boolean
}

const ASPECT_CLASS = {
  '16/9': 'aspect-video',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
}

export default function ImageUploader({
  value,
  onChange,
  uploadUrl,
  label = 'Imagen',
  aspectRatio = '4/3',
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    if (!file.type.startsWith('image/')) { setError('Debe ser una imagen.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5MB.'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(uploadUrl, { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Error al subir.')
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClick = () => { if (!disabled && !uploading) inputRef.current?.click() }

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-[#5C3A21]">{label}</p>}
      <div className="flex items-start gap-4">
        {/* Image preview */}
        <div
          className={cn(
            'relative rounded-lg overflow-hidden border-2 border-dashed border-[#5C3A21]/20 bg-[#FBF1DC] cursor-pointer group w-40 shrink-0',
            ASPECT_CLASS[aspectRatio],
            !disabled && 'hover:border-[#E1AD01]/50'
          )}
          onClick={handleClick}
        >
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-[#8A7E70]/60">
              <ImagePlus className="h-8 w-8 mb-1" />
              <span className="text-[10px]">Sin imagen</span>
            </div>
          )}
          {/* Hover overlay */}
          {!disabled && !uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#E1AD01]" />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 pt-1">
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
              onClick={() => { setError(null); onChange(null) }}
              disabled={disabled || uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md hover:bg-[#B91C1C]/10 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={disabled} />

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-[#B91C1C] bg-[#B91C1C]/5 border border-[#B91C1C]/20 rounded-md px-2.5 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}
      <p className="text-[10px] text-[#8A7E70]/70">JPG, PNG, GIF o WebP · Máx 5MB</p>
    </div>
  )
}
