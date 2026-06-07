'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

interface ImageUploaderProductoProps {
  currentImage?: string | null
  onUpload: (url: string) => void
  uploadUrl: string
}

export default function ImageUploaderProducto({ currentImage, onUpload, uploadUrl }: ImageUploaderProductoProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5MB')
      return
    }

    setUploading(true)

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreview(localPreview)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Error al subir imagen')
      }

      const data = await res.json()
      onUpload(data.url)
      toast.success('Imagen subida correctamente')
    } catch {
      toast.error('Error al subir la imagen')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }, [currentImage, onUpload, uploadUrl])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const removeImage = useCallback(() => {
    setPreview(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }, [onUpload])

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group rounded-lg overflow-hidden border border-marron/10">
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="Vista previa"
              fill
              loading="lazy"
              className="object-cover"
              sizes="192px"
            />
          </div>
          {!uploading && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Cambiar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeImage}
              >
                <X className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-sm">Subiendo...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? 'border-mostaza bg-mostaza/5'
              : 'border-marron/20 hover:border-mostaza/50 hover:bg-mostaza/5'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-mostaza" />
              <p className="mt-2 text-sm text-muted-foreground">Subiendo imagen...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Arrastrá una imagen o hacé clic para seleccionar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP hasta 5MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
