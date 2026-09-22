'use client'

/**
 * ============================================================
 * SuperAdmin — Configuración Global
 * ============================================================
 * URL: /cm/superadmin/configuracion
 *
 * Shows global configuration options:
 *  - Gestión de Admins (link to /cm/admin/users)
 *  - Parámetros globales (moneda, IVA — read-only placeholder)
 *  - Gestión de Supervisores (link to /cm/admin/users)
 * ============================================================
 */

import * as React from 'react'
import Link from 'next/link'
import {
  Settings, Users, ShieldCheck, DollarSign, ArrowLeft, ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/cm/superadmin/dashboard" className="p-2 rounded-lg hover:bg-[#5C3A21]/8 text-[#5C3A21]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#5C3A21] flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#5C3A21]" />
            Configuración Global
          </h1>
          <p className="text-sm text-[#8A7E70]">Parámetros y gestión del sistema</p>
        </div>
      </div>

      {/* Gestión de Admins */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gestión de Usuarios
          </CardTitle>
          <CardDescription className="text-xs">Crear, editar y eliminar Admins y Supervisores</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" className="bg-[#E1AD01] hover:bg-[#E1AD01]/90 text-[#1F1611]">
            <Link href="/cm/admin/users">
              Ir al ABM de Usuarios <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Parámetros globales */}
      <Card className="border-[#5C3A21]/10 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-[#5C3A21] flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Parámetros Globales
          </CardTitle>
          <CardDescription className="text-xs">Configuración del sistema (solo lectura)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#5C3A21]/8">
            <span className="text-sm text-[#5C3A21]">Moneda</span>
            <span className="text-sm font-medium text-[#5C3A21]">Peso Argentino ($ARS)</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#5C3A21]/8">
            <span className="text-sm text-[#5C3A21]">IVA</span>
            <span className="text-sm font-medium text-[#5C3A21]">21%</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#5C3A21]/8">
            <span className="text-sm text-[#5C3A21]">Zona horaria</span>
            <span className="text-sm font-medium text-[#5C3A21]">America/Argentina/Buenos_Aires</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#5C3A21]">Sesión</span>
            <span className="text-sm font-medium text-[#5C3A21]">8 horas (stateless HMAC)</span>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-[#E1AD01]/20 bg-[#FFF8E7]/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-sm text-[#7a5c00]">
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              El SuperAdmin tiene acceso completo a todos los módulos. Los cambios de configuración avanzada (impresoras, etc.) se gestionan desde <Link href="/cm/admin/configuracion/impresoras" className="underline">Configuración de Impresoras</Link>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
