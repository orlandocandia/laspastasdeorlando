import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...\n')

  // ============================================
  // 1. TIPOS DE PERSONA
  // ============================================
  const tiposPersona = [
    { nombre: 'cliente' },
    { nombre: 'proveedor' },
    { nombre: 'empleado' },
  ]

  for (const tipo of tiposPersona) {
    await prisma.tipoPersona.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    })
  }
  console.log('✅ Tipos de persona: cliente, proveedor, empleado')

  // ============================================
  // 2. TIPOS DE CONTACTO
  // ============================================
  const tiposContacto = [
    { nombre: 'email' },
    { nombre: 'teléfono' },
    { nombre: 'WhatsApp' },
  ]

  for (const tipo of tiposContacto) {
    await prisma.tipoContacto.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    })
  }
  console.log('✅ Tipos de contacto: email, teléfono, WhatsApp')

  // ============================================
  // 3. TIPOS DE DIRECCIÓN
  // ============================================
  const tiposDireccion = [
    { nombre: 'particular' },
    { nombre: 'comercial' },
    { nombre: 'entrega' },
  ]

  for (const tipo of tiposDireccion) {
    await prisma.tipoDireccion.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    })
  }
  console.log('✅ Tipos de dirección: particular, comercial, entrega')

  // ============================================
  // 4. PERSONA ADMIN
  // ============================================
  const personaAdmin = await prisma.persona.upsert({
    where: { numero_documento: '00000000' },
    update: {},
    create: {
      nombre: 'Orlando',
      apellido: 'Candia',
      numero_documento: '00000000',
      tipo_persona: 'empleado',
      observaciones: 'Administrador del sistema',
    },
  })
  console.log(`✅ Persona admin: ${personaAdmin.nombre} ${personaAdmin.apellido} (ID: ${personaAdmin.id})`)

  // ============================================
  // 5. USUARIO ADMIN
  // ============================================
  const hashedPassword = await bcrypt.hash('Pastas2026!', 10)

  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: 'orlando.candia@gmail.com' },
    update: {},
    create: {
      id_persona: personaAdmin.id,
      email: 'orlando.candia@gmail.com',
      password: hashedPassword,
      estado: true,
    },
  })
  console.log(`✅ Usuario admin: ${usuarioAdmin.email} (ID: ${usuarioAdmin.id})`)

  // Contacto email
  const tipoEmail = await prisma.tipoContacto.findUniqueOrThrow({ where: { nombre: 'email' } })
  await prisma.contacto.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id_persona: personaAdmin.id,
      id_tipo_contacto: tipoEmail.id,
      valor: 'orlando.candia@gmail.com',
      es_principal: true,
      verificado: true,
    },
  })
  console.log('✅ Contacto email del admin')

  // ============================================
  // 6. ROLES
  // ============================================
  const roles = [
    { nombre: 'admin', descripcion: 'Administrador total del sistema', es_default: false },
    { nombre: 'produccion', descripcion: 'Acceso a producción y stock', es_default: false },
    { nombre: 'ventas', descripcion: 'Acceso a ventas y pedidos', es_default: false },
    { nombre: 'lectura', descripcion: 'Solo lectura de datos', es_default: true },
  ]

  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: {},
      create: rol,
    })
  }
  console.log('✅ Roles: admin, produccion, ventas, lectura')

  // Asignar rol admin al usuario
  const rolAdmin = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'admin' } })
  await prisma.usuarioRol.upsert({
    where: { id_usuario_id_rol: { id_usuario: usuarioAdmin.id, id_rol: rolAdmin.id } },
    update: {},
    create: { id_usuario: usuarioAdmin.id, id_rol: rolAdmin.id },
  })
  console.log('✅ Rol admin asignado al usuario')

  // ============================================
  // 7. PERMISOS
  // ============================================
  const modulos = [
    'productos', 'compras', 'ventas', 'produccion', 'usuarios',
    'auditoria', 'reportes', 'seguridad', 'logistica', 'presupuestos',
  ]
  const acciones = ['ver', 'crear', 'editar', 'eliminar']

  let permisosCreados = 0
  for (const modulo of modulos) {
    for (const accion of acciones) {
      const nombre = `${modulo}.${accion}`
      await prisma.permiso.upsert({
        where: { nombre },
        update: {},
        create: { nombre, modulo, descripcion: `${accion} en ${modulo}` },
      })
      permisosCreados++
    }
  }

  // Permisos extra
  const extraPermisos = [
    'dashboard.ver',
    'configuracion.ver',
    'configuracion.editar',
    'opiniones.ver',
    'opiniones.editar',
  ]
  for (const nombre of extraPermisos) {
    const modulo = nombre.split('.')[0]
    await prisma.permiso.upsert({
      where: { nombre },
      update: {},
      create: { nombre, modulo, descripcion: nombre },
    })
    permisosCreados++
  }
  console.log(`✅ ${permisosCreados} permisos creados`)

  // Asignar TODOS los permisos al rol admin
  const allPermisos = await prisma.permiso.findMany()
  let asignados = 0
  for (const permiso of allPermisos) {
    await prisma.rolPermiso.upsert({
      where: { id_rol_id_permiso: { id_rol: rolAdmin.id, id_permiso: permiso.id } },
      update: {},
      create: { id_rol: rolAdmin.id, id_permiso: permiso.id },
    })
    asignados++
  }
  console.log(`✅ ${asignados} permisos asignados al rol admin`)

  // Permisos de solo lectura para rol lectura
  const rolLectura = await prisma.rol.findUniqueOrThrow({ where: { nombre: 'lectura' } })
  for (const modulo of modulos) {
    const permiso = await prisma.permiso.findUnique({ where: { nombre: `${modulo}.ver` } })
    if (permiso) {
      await prisma.rolPermiso.upsert({
        where: { id_rol_id_permiso: { id_rol: rolLectura.id, id_permiso: permiso.id } },
        update: {},
        create: { id_rol: rolLectura.id, id_permiso: permiso.id },
      })
    }
  }
  console.log('✅ Permisos de lectura asignados al rol lectura')

  // ============================================
  // 8. ESTADOS GENERALES
  // ============================================
  const estados = [
    { nombre_estado: 'pendiente', entidad_aplicable: 'general', es_final: false },
    { nombre_estado: 'en_proceso', entidad_aplicable: 'general', es_final: false },
    { nombre_estado: 'completado', entidad_aplicable: 'general', es_final: true },
    { nombre_estado: 'cancelado', entidad_aplicable: 'general', es_final: true },
    { nombre_estado: 'entregado', entidad_aplicable: 'pedidos', es_final: true },
    { nombre_estado: 'en_camino', entidad_aplicable: 'entregas', es_final: false },
    { nombre_estado: 'programado', entidad_aplicable: 'entregas', es_final: false },
    { nombre_estado: 'pagado', entidad_aplicable: 'ventas', es_final: true },
    { nombre_estado: 'activo', entidad_aplicable: 'produccion', es_final: false },
    { nombre_estado: 'aprobado', entidad_aplicable: 'presupuestos', es_final: false },
    { nombre_estado: 'rechazado', entidad_aplicable: 'presupuestos', es_final: true },
    { nombre_estado: 'expirado', entidad_aplicable: 'presupuestos', es_final: true },
    { nombre_estado: 'convertido', entidad_aplicable: 'presupuestos', es_final: true },
  ]

  for (const estado of estados) {
    await prisma.estadoGeneral.upsert({
      where: { nombre_estado: estado.nombre_estado },
      update: {},
      create: estado,
    })
  }
  console.log(`✅ ${estados.length} estados generales creados`)

  // ============================================
  // 9. FORMAS DE PAGO
  // ============================================
  const formasPago = [
    { nombre_forma: 'Efectivo', requiere_identificacion: false, requiere_cuenta: false },
    { nombre_forma: 'Mercado Pago', requiere_identificacion: false, requiere_cuenta: true },
    { nombre_forma: 'Transferencia bancaria', requiere_identificacion: true, requiere_cuenta: true },
    { nombre_forma: 'Débito', requiere_identificacion: true, requiere_cuenta: true },
    { nombre_forma: 'Crédito', requiere_identificacion: true, requiere_cuenta: true },
    { nombre_forma: 'Otros', requiere_identificacion: false, requiere_cuenta: false },
  ]

  for (const fp of formasPago) {
    await prisma.formaPago.upsert({
      where: { nombre_forma: fp.nombre_forma },
      update: {},
      create: fp,
    })
  }
  console.log(`✅ ${formasPago.length} formas de pago creadas`)

  // ============================================
  // 10. CATEGORÍAS DE PRODUCTOS TERMINADOS
  // ============================================
  const categoriasPT = [
    { nombre: 'Sorrentinos', descripcion: 'Sorrentinos rellenos de jamón, queso, pollo y más' },
    { nombre: 'Ñoquis', descripcion: 'Ñoquis de papa, calabaza, espinaca y más' },
    { nombre: 'Tallarines', descripcion: 'Tallarines al huevo, al morrón, a la espinaca y más' },
    { nombre: 'Ravioles', descripcion: 'Ravioles de ricotta, carne, jamón y más' },
    { nombre: 'Tapas', descripcion: 'Tapas para empanadas, pascualinas y pastelitos' },
    { nombre: 'Empanadas', descripcion: 'Empanadas crudas y al horno, variedad de rellenos' },
    { nombre: 'Tartas', descripcion: 'Tartas de verduras, jamón, pollo y choclo' },
    { nombre: 'Cintas Anchas', descripcion: 'Cintas anchas al huevo y más' },
  ]

  // Eliminar productos existentes sin imagen (productos de seed anteriores)
  const deletedProducts = await prisma.productoTerminado.deleteMany({
    where: {
      OR: [
        { imagen: null },
        { imagen: '' }
      ]
    }
  })
  console.log(`🗑️ ${deletedProducts.count} productos sin imagen eliminados`)
  // NO eliminar categorías — pueden tener productos del usuario con imagen

  const catMap: Record<string, number> = {}
  for (const cat of categoriasPT) {
    const created = await prisma.categoriaProductoTerminado.upsert({
      where: { nombre: cat.nombre },
      update: { descripcion: cat.descripcion },
      create: cat,
    })
    catMap[cat.nombre] = created.id
  }
  console.log(`✅ ${categoriasPT.length} categorías de productos terminados aseguradas`)

  // ============================================
  // 11. PRODUCTOS TERMINADOS — Ya NO se insertan productos de prueba
  // Solo el usuario debe crear productos manualmente con su foto desde el admin.
  // ============================================
  console.log('ℹ️ No se insertan productos de prueba — solo productos manuales con foto')

  // ============================================
  // VERIFICACIÓN FINAL
  // ============================================
  const verify = await prisma.usuario.findUnique({
    where: { email: 'orlando.candia@gmail.com' },
    include: { persona: true, roles: { include: { rol: true } } },
  })

  console.log('\n========================================')
  console.log('📋 VERIFICACIÓN FINAL')
  console.log('========================================')
  console.log(`Email:    ${verify!.email}`)
  console.log(`Password: Pastas2026!`)
  console.log(`Estado:   ${verify!.estado ? 'Activo' : 'Inactivo'}`)
  console.log(`Persona:  ${verify!.persona.nombre} ${verify!.persona.apellido}`)
  console.log(`Roles:    ${verify!.roles.map(r => r.rol.nombre).join(', ')}`)
  console.log('========================================\n')

  console.log('✅ Seed completado exitosamente')

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
