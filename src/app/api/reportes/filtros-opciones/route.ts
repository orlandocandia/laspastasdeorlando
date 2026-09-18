import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reportes/filtros-opciones
// Devuelve las listas de opciones para los filtros de los reportes en una sola
// petición: productos terminados, clientes, vendedores, categorías de PT,
// categorías de MP y proveedores.
export async function GET() {
  try {
    const [
      productosTerminados,
      clientes,
      vendedores,
      categoriasPT,
      categoriasMP,
      proveedores,
    ] = await Promise.all([
      db.productoTerminado.findMany({
        where: { estado: true },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      db.persona.findMany({
        where: { tipo_persona: 'cliente' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          razon_social: true,
        },
        orderBy: [{ nombre: 'asc' }],
      }),
      db.usuario.findMany({
        where: { estado: true },
        select: {
          id: true,
          email: true,
          persona: { select: { nombre: true, apellido: true } },
        },
        orderBy: { email: 'asc' },
      }),
      db.categoriaProductoTerminado.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      db.categoriaMateriaPrima.findMany({
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      }),
      db.persona.findMany({
        where: { tipo_persona: 'proveedor' },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          razon_social: true,
        },
        orderBy: [{ nombre: 'asc' }],
      }),
    ])

    return NextResponse.json({
      productos: productosTerminados.map((p) => ({
        value: String(p.id),
        label: p.nombre,
      })),
      clientes: clientes.map((c) => ({
        value: String(c.id),
        label: c.razon_social || `${c.nombre} ${c.apellido}`.trim(),
      })),
      vendedores: vendedores.map((v) => ({
        value: String(v.id),
        label: v.persona
          ? `${v.persona.nombre} ${v.persona.apellido}`.trim() || v.email
          : v.email,
      })),
      categoriasPT: categoriasPT.map((c) => ({
        value: String(c.id),
        label: c.nombre,
      })),
      categoriasMP: categoriasMP.map((c) => ({
        value: String(c.id),
        label: c.nombre,
      })),
      proveedores: proveedores.map((p) => ({
        value: String(p.id),
        label: p.razon_social || `${p.nombre} ${p.apellido}`.trim(),
      })),
    })
  } catch (error) {
    console.error('Error al obtener opciones de filtros:', error)
    return NextResponse.json(
      { error: 'Error al obtener opciones de filtros' },
      { status: 500 }
    )
  }
}
