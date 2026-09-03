'use client'

/**
 * ============================================================
 * Cocina Móvil — Selector de Ubicación (Leaflet)
 * ============================================================
 * Componente de mapa interactivo para seleccionar una ubicación
 * (lat, lng) al crear/editar un usuario.
 *
 * Props:
 *  - location: string | null  ("lat,lng" format, ej: "-27.3675,-55.8967")
 *  - onLocationChange: (location: string | null) => void
 *
 * Usa react-leaflet (ya instalado en el sistema principal).
 * Centrado por defecto en Posadas, Misiones (-27.3675, -55.8967).
 * ============================================================
 */

import * as React from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPin, X, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom mostaza marker for cocina-movil
const cmIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.716 23.284 0 15 0z" fill="#E1AD01"/>
    <circle cx="15" cy="14" r="6" fill="#5C3A21"/>
  </svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
  className: '',
})

const POSADAS_CENTER: [number, number] = [-27.3675, -55.8967]

function parseLoc(loc: string | null): [number, number] | null {
  if (!loc) return null
  const parts = loc.split(',').map((s) => parseFloat(s.trim()))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts as [number, number]
  }
  return null
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({
  location,
  onLocationChange,
}: {
  location: string | null
  onLocationChange: (location: string | null) => void
}) {
  const parsed = parseLoc(location)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searching, setSearching] = React.useState(false)
  const mapRef = React.useRef<L.Map | null>(null)

  const handleMapClick = (lat: number, lng: number) => {
    onLocationChange(`${lat.toFixed(6)},${lng.toFixed(6)}`)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      // Use Nominatim (OpenStreetMap) geocoding — free, no API key needed
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      if (data && data[0]) {
        const { lat, lon } = data[0]
        onLocationChange(`${parseFloat(lat).toFixed(6)},${parseFloat(lon).toFixed(6)}`)
        // Fly to the location
        if (mapRef.current) {
          mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 15, { duration: 1.5 })
        }
      } else {
        alert('No se encontró la ubicación. Probá con otra búsqueda.')
      }
    } catch {
      alert('Error al buscar la ubicación. Verificá tu conexión.')
    } finally {
      setSearching(false)
    }
  }

  const handleClear = () => {
    onLocationChange(null)
    setSearchQuery('')
  }

  return (
    <div className="space-y-2">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7E70]" />
          <Input
            placeholder="Buscar dirección (ej: Posadas, Misiones)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            className="pl-8 h-9 text-sm border-[#5C3A21]/15"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleSearch}
          disabled={searching}
          className="border-[#5C3A21]/20 text-[#5C3A21]"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Buscar
        </Button>
        {location && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="text-[#B91C1C]"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-[#5C3A21]/15" style={{ height: '300px' }}>
        <MapContainer
          center={parsed || POSADAS_CENTER}
          zoom={parsed ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
          ref={(map) => {
            if (map) mapRef.current = map
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <ClickHandler onClick={handleMapClick} />
          {parsed && <Marker position={parsed} icon={cmIcon} />}
        </MapContainer>
      </div>

      {/* Coordinates display */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[#8A7E70]">
          <MapPin className="h-3 w-3" />
          {parsed ? (
            <span>
              Ubicación: <strong className="text-[#5C3A21]">{parsed[0].toFixed(4)}, {parsed[1].toFixed(4)}</strong>
            </span>
          ) : (
            <span>Hacé clic en el mapa para seleccionar una ubicación</span>
          )}
        </div>
      </div>
    </div>
  )
}
