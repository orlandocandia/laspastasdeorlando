'use client'

/**
 * ============================================================
 * Cocina Móvil — Geography Select (chained combos)
 * ============================================================
 * 4 selects encadenados: País → Provincia → Departamento → Municipio.
 * Reutiliza el endpoint /api/geografia de "El Amigo de las Pastas"
 * (que consulta la base Prisma compartida).
 *
 * Almacena los NOMBRES (strings) en el form, no los IDs, para ser
 * compatible con el modelo CmUserRecord que usa campos string.
 *
 * Props:
 *  - country, province, department, municipality: string (nombres actuales)
 *  - onChange: (field, value) => void
 * ============================================================
 */

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface GeoOption {
  id: number
  nombre: string
}

interface GeographySelectProps {
  country: string
  province: string
  department: string
  municipality: string
  onChange: (field: 'country' | 'province' | 'department' | 'municipality', value: string) => void
}

export default function GeographySelect({ country, province, department, municipality, onChange }: GeographySelectProps) {
  const [paises, setPaises] = React.useState<GeoOption[]>([])
  const [provincias, setProvincias] = React.useState<GeoOption[]>([])
  const [departamentos, setDepartamentos] = React.useState<GeoOption[]>([])
  const [municipios, setMunicipios] = React.useState<GeoOption[]>([])
  const [loadingPaises, setLoadingPaises] = React.useState(true)
  const [loadingProv, setLoadingProv] = React.useState(false)
  const [loadingDep, setLoadingDep] = React.useState(false)
  const [loadingMun, setLoadingMun] = React.useState(false)

  // IDs seleccionados (para encadenar los fetches)
  const [paisId, setPaisId] = React.useState<number | null>(null)
  const [provinciaId, setProvinciaId] = React.useState<number | null>(null)
  const [departamentoId, setDepartamentoId] = React.useState<number | null>(null)

  // Cargar países al montar
  React.useEffect(() => {
    let mounted = true
    setLoadingPaises(true)
    fetch('/api/geografia?tipo=paises')
      .then((r) => r.json())
      .then((data: GeoOption[]) => {
        if (!mounted || !Array.isArray(data)) return
        setPaises(data)
        // Si ya hay un país seleccionado (ej. "Argentina"), resolver su ID
        if (country) {
          const found = data.find((p) => p.nombre === country)
          if (found) setPaisId(found.id)
        }
      })
      .catch(() => {
        if (mounted) setPaises([])
      })
      .finally(() => {
        if (mounted) setLoadingPaises(false)
      })
    return () => {
      mounted = false
    }
  }, []) // solo al montar

  // Cargar provincias cuando cambia paisId
  React.useEffect(() => {
    if (paisId === null) {
      setProvincias([])
      return
    }
    let mounted = true
    setLoadingProv(true)
    setProvincias([])
    setProvinciaId(null)
    fetch(`/api/geografia?tipo=provincias&id=${paisId}`)
      .then((r) => r.json())
      .then((data: GeoOption[]) => {
        if (!mounted || !Array.isArray(data)) return
        setProvincias(data)
        // Si ya hay una provincia seleccionada, resolver su ID
        if (province) {
          const found = data.find((p) => p.nombre === province)
          if (found) setProvinciaId(found.id)
        }
      })
      .catch(() => {
        if (mounted) setProvincias([])
      })
      .finally(() => {
        if (mounted) setLoadingProv(false)
      })
    return () => {
      mounted = false
    }
  }, [paisId])

  // Cargar departamentos cuando cambia provinciaId
  React.useEffect(() => {
    if (provinciaId === null) {
      setDepartamentos([])
      return
    }
    let mounted = true
    setLoadingDep(true)
    setDepartamentos([])
    setDepartamentoId(null)
    fetch(`/api/geografia?tipo=departamentos&id=${provinciaId}`)
      .then((r) => r.json())
      .then((data: GeoOption[]) => {
        if (!mounted || !Array.isArray(data)) return
        setDepartamentos(data)
        // Si ya hay un departamento seleccionado, resolver su ID
        if (department) {
          const found = data.find((d) => d.nombre === department)
          if (found) setDepartamentoId(found.id)
        }
      })
      .catch(() => {
        if (mounted) setDepartamentos([])
      })
      .finally(() => {
        if (mounted) setLoadingDep(false)
      })
    return () => {
      mounted = false
    }
  }, [provinciaId])

  // Cargar municipios cuando cambia departamentoId
  React.useEffect(() => {
    if (departamentoId === null) {
      setMunicipios([])
      return
    }
    let mounted = true
    setLoadingMun(true)
    setMunicipios([])
    fetch(`/api/geografia?tipo=municipios&id=${departamentoId}`)
      .then((r) => r.json())
      .then((data: GeoOption[]) => {
        if (!mounted || !Array.isArray(data)) return
        setMunicipios(data)
      })
      .catch(() => {
        if (mounted) setMunicipios([])
      })
      .finally(() => {
        if (mounted) setLoadingMun(false)
      })
    return () => {
      mounted = false
    }
  }, [departamentoId])

  // Handlers: al seleccionar, guardar el NOMBRE y resolver el ID para encadenar
  const handlePaisChange = (value: string) => {
    const found = paises.find((p) => String(p.id) === value)
    const nombre = found ? found.nombre : ''
    onChange('country', nombre)
    onChange('province', '')
    onChange('department', '')
    onChange('municipality', '')
    setPaisId(found ? found.id : null)
  }

  const handleProvinciaChange = (value: string) => {
    const found = provincias.find((p) => String(p.id) === value)
    const nombre = found ? found.nombre : ''
    onChange('province', nombre)
    onChange('department', '')
    onChange('municipality', '')
    setProvinciaId(found ? found.id : null)
  }

  const handleDepartamentoChange = (value: string) => {
    const found = departamentos.find((d) => String(d.id) === value)
    const nombre = found ? found.nombre : ''
    onChange('department', nombre)
    onChange('municipality', '')
    setDepartamentoId(found ? found.id : null)
  }

  const handleMunicipioChange = (value: string) => {
    const found = municipios.find((m) => String(m.id) === value)
    const nombre = found ? found.nombre : ''
    onChange('municipality', nombre)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* País */}
      <div className="space-y-1.5">
        <Label className="text-[#5C3A21]">País</Label>
        <Select
          value={paisId !== null ? String(paisId) : ''}
          onValueChange={handlePaisChange}
          disabled={loadingPaises}
        >
          <SelectTrigger className="border-[#5C3A21]/15">
            <SelectValue placeholder={loadingPaises ? 'Cargando…' : 'Seleccionar país'} />
          </SelectTrigger>
          <SelectContent>
            {paises.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provincia */}
      <div className="space-y-1.5">
        <Label className="text-[#5C3A21]">Provincia</Label>
        <Select
          value={provinciaId !== null ? String(provinciaId) : ''}
          onValueChange={handleProvinciaChange}
          disabled={paisId === null || loadingProv}
        >
          <SelectTrigger className="border-[#5C3A21]/15">
            <SelectValue placeholder={paisId === null ? 'Seleccioná país primero' : loadingProv ? 'Cargando…' : 'Seleccionar provincia'} />
          </SelectTrigger>
          <SelectContent>
            {provincias.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Departamento */}
      <div className="space-y-1.5">
        <Label className="text-[#5C3A21]">Departamento</Label>
        <Select
          value={departamentoId !== null ? String(departamentoId) : ''}
          onValueChange={handleDepartamentoChange}
          disabled={provinciaId === null || loadingDep}
        >
          <SelectTrigger className="border-[#5C3A21]/15">
            <SelectValue placeholder={provinciaId === null ? 'Seleccioná provincia primero' : loadingDep ? 'Cargando…' : 'Seleccionar departamento'} />
          </SelectTrigger>
          <SelectContent>
            {departamentos.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>{d.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Municipio */}
      <div className="space-y-1.5">
        <Label className="text-[#5C3A21]">Municipio</Label>
        <Select
          value={municipios.find((m) => m.nombre === municipality) ? String(municipios.find((m) => m.nombre === municipality)!.id) : ''}
          onValueChange={handleMunicipioChange}
          disabled={departamentoId === null || loadingMun}
        >
          <SelectTrigger className="border-[#5C3A21]/15">
            <SelectValue placeholder={departamentoId === null ? 'Seleccioná depto. primero' : loadingMun ? 'Cargando…' : 'Seleccionar municipio'} />
          </SelectTrigger>
          <SelectContent>
            {municipios.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
