import { NextRequest, NextResponse } from 'next/server'
import { createClient, type Client } from '@libsql/client'
import bcrypt from 'bcryptjs'

// Helper: detect if running on Turso (libsql:// URL or TURSO_DATABASE_URL env var)
function isTurso(): boolean {
  const url = process.env.DATABASE_URL || ''
  return url.startsWith('libsql://') || url.startsWith('http') || !!process.env.TURSO_DATABASE_URL
}

// Helper: create a libsql client for Turso
function getTursoClient(): Client {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''
  return createClient({ url, authToken: authToken || undefined })
}

// ============================================
// TURSO-BASED SEED (using @libsql/client directly)
// ============================================
async function seedTurso(client: Client): Promise<string[]> {
  const results: string[] = []

  // Wrapper that tracks progress and provides error context
  const exec = async (sql: string, args?: any[]) => {
    try {
      return await client.execute({ sql, args })
    } catch (e: any) {
      throw new Error(`SQL error: ${e.message} | SQL: ${sql.slice(0, 120)}${args ? ` | Args: ${JSON.stringify(args).slice(0, 100)}` : ''}`)
    }
  }

  // 1. PAÍS
  await exec("INSERT OR IGNORE INTO Pais (nombre) VALUES ('Argentina')")
  const paisId = Number((await exec("SELECT id FROM Pais WHERE nombre = 'Argentina'")).rows[0]?.id)
  results.push('País: Argentina')

  // 2. PROVINCIAS
  const provinciasData = [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires',
    'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
    'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
    'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
    'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
  ]
  const provIds: Record<string, number> = {}
  for (const n of provinciasData) {
    await exec('INSERT OR IGNORE INTO Provincia (id_pais,nombre) VALUES (?,?)', [paisId, n])
    provIds[n] = Number((await exec("SELECT id FROM Provincia WHERE nombre=? AND id_pais=?", [n, paisId])).rows[0]?.id)
  }
  results.push(`${provinciasData.length} provincias`)

  // 3. DEPARTAMENTOS
  const deptosData: { n: string; p: string }[] = [
    { n: 'Capital', p: 'Corrientes' }, { n: 'General Paz', p: 'Corrientes' },
    { n: 'San Cosme', p: 'Corrientes' }, { n: 'Itatí', p: 'Corrientes' },
    { n: 'Bella Vista', p: 'Corrientes' }, { n: 'Empedrado', p: 'Corrientes' },
    { n: 'Saladas', p: 'Corrientes' }, { n: 'Esquina', p: 'Corrientes' },
    { n: 'Goya', p: 'Corrientes' }, { n: 'Lavalle', p: 'Corrientes' },
    { n: 'Santo Tomé', p: 'Corrientes' }, { n: 'Paso de los Libres', p: 'Corrientes' },
    { n: 'Monte Caseros', p: 'Corrientes' }, { n: 'Curuzú Cuatiá', p: 'Corrientes' },
    { n: 'Mercedes', p: 'Corrientes' },
    { n: 'Comuna 1', p: 'Ciudad Autónoma de Buenos Aires' },
    { n: 'Comuna 2', p: 'Ciudad Autónoma de Buenos Aires' },
    { n: 'Comuna 3', p: 'Ciudad Autónoma de Buenos Aires' },
    { n: 'Comuna 4', p: 'Ciudad Autónoma de Buenos Aires' },
    { n: 'Comuna 5', p: 'Ciudad Autónoma de Buenos Aires' },
    { n: 'General San Martín', p: 'Buenos Aires' }, { n: 'La Matanza', p: 'Buenos Aires' },
    { n: 'Lomas de Zamora', p: 'Buenos Aires' }, { n: 'Quilmes', p: 'Buenos Aires' },
    { n: 'Almirante Brown', p: 'Buenos Aires' }, { n: 'Avellaneda', p: 'Buenos Aires' },
    { n: 'Morón', p: 'Buenos Aires' }, { n: 'Tres de Febrero', p: 'Buenos Aires' },
    { n: 'San Isidro', p: 'Buenos Aires' }, { n: 'Vicente López', p: 'Buenos Aires' },
    { n: 'Capital', p: 'Córdoba' }, { n: 'Colón', p: 'Córdoba' }, { n: 'San Justo', p: 'Córdoba' },
    { n: 'La Capital', p: 'Santa Fe' }, { n: 'Rosario', p: 'Santa Fe' },
    { n: 'Capital', p: 'Mendoza' }, { n: 'Godoy Cruz', p: 'Mendoza' },
    { n: 'Capital', p: 'Tucumán' }, { n: 'Cruz Alta', p: 'Tucumán' },
    { n: 'Capital', p: 'Salta' },
    { n: 'Paraná', p: 'Entre Ríos' }, { n: 'Concordia', p: 'Entre Ríos' },
  ]
  const depIds: Record<string, number> = {}
  for (const d of deptosData) {
    const idP = provIds[d.p]
    if (!idP) continue
    await exec('INSERT OR IGNORE INTO Departamento (id_provincia,nombre) VALUES (?,?)', [idP, d.n])
    depIds[`${d.p}-${d.n}`] = Number((await exec("SELECT id FROM Departamento WHERE nombre=? AND id_provincia=?", [d.n, idP])).rows[0]?.id)
  }
  results.push(`${Object.keys(depIds).length} departamentos`)

  // 4. MUNICIPIOS
  const munisData: { n: string; dk: string }[] = [
    { n: 'Corrientes', dk: 'Corrientes-Capital' }, { n: 'Barrio Esperanza', dk: 'Corrientes-Capital' },
    { n: 'Nuestra Señora del Rosario de Caa Catí', dk: 'Corrientes-General Paz' },
    { n: 'San Cosme', dk: 'Corrientes-San Cosme' }, { n: 'Itatí', dk: 'Corrientes-Itatí' },
    { n: 'Bella Vista', dk: 'Corrientes-Bella Vista' },
    { n: 'Pedro Y. Cañete (Empedrado)', dk: 'Corrientes-Empedrado' },
    { n: 'Goya', dk: 'Corrientes-Goya' }, { n: 'Esquina', dk: 'Corrientes-Esquina' },
    { n: 'Mercedes', dk: 'Corrientes-Mercedes' },
    { n: 'Paso de los Libres', dk: 'Corrientes-Paso de los Libres' },
    { n: 'Monte Caseros', dk: 'Corrientes-Monte Caseros' },
    { n: 'Curuzú Cuatiá', dk: 'Corrientes-Curuzú Cuatiá' },
    { n: 'Santo Tomé', dk: 'Corrientes-Santo Tomé' },
    { n: 'Retiro', dk: 'Ciudad Autónoma de Buenos Aires-Comuna 1' },
    { n: 'San Nicolás', dk: 'Ciudad Autónoma de Buenos Aires-Comuna 1' },
    { n: 'Puerto Madero', dk: 'Ciudad Autónoma de Buenos Aires-Comuna 1' },
    { n: 'Recoleta', dk: 'Ciudad Autónoma de Buenos Aires-Comuna 2' },
    { n: 'Palermo', dk: 'Ciudad Autónoma de Buenos Aires-Comuna 2' },
    { n: 'Balvanera', dk: 'Ciudad Autónoma de Buenos Aires-Comuna 3' },
    { n: 'San Martín', dk: 'Buenos Aires-General San Martín' },
    { n: 'Ramos Mejía', dk: 'Buenos Aires-La Matanza' },
    { n: 'Banfield', dk: 'Buenos Aires-Lomas de Zamora' },
    { n: 'Quilmes', dk: 'Buenos Aires-Quilmes' },
    { n: 'Adrogué', dk: 'Buenos Aires-Almirante Brown' },
    { n: 'Avellaneda', dk: 'Buenos Aires-Avellaneda' },
    { n: 'Morón', dk: 'Buenos Aires-Morón' },
    { n: 'Caseros', dk: 'Buenos Aires-Tres de Febrero' },
    { n: 'San Isidro', dk: 'Buenos Aires-San Isidro' },
    { n: 'Olivos', dk: 'Buenos Aires-Vicente López' },
    { n: 'Córdoba', dk: 'Córdoba-Capital' },
    { n: 'Santa Fe', dk: 'Santa Fe-La Capital' }, { n: 'Rosario', dk: 'Santa Fe-Rosario' },
    { n: 'Mendoza', dk: 'Mendoza-Capital' }, { n: 'Godoy Cruz', dk: 'Mendoza-Godoy Cruz' },
    { n: 'San Miguel de Tucumán', dk: 'Tucumán-Capital' },
    { n: 'Salta', dk: 'Salta-Capital' },
    { n: 'Paraná', dk: 'Entre Ríos-Paraná' }, { n: 'Concordia', dk: 'Entre Ríos-Concordia' },
  ]
  for (const m of munisData) {
    const idD = depIds[m.dk]
    if (!idD) continue
    await exec('INSERT OR IGNORE INTO Municipio (id_departamento,nombre) VALUES (?,?)', [idD, m.n])
  }
  results.push(`${munisData.length} municipios`)

  // 5-6. TIPOS DE DIRECCIÓN y CONTACTO
  for (const v of ['particular', 'comercial', 'entrega']) await exec('INSERT OR IGNORE INTO TipoDireccion (nombre) VALUES (?)', [v])
  for (const v of ['email', 'teléfono', 'WhatsApp']) await exec('INSERT OR IGNORE INTO TipoContacto (nombre) VALUES (?)', [v])
  results.push('Tipos de dirección y contacto')

  // 7. EMPRESAS TELEFÓNICAS
  for (const e of [{ n: 'Personal', c: 'PER' }, { n: 'Claro', c: 'CLA' }, { n: 'Movistar', c: 'MOV' }, { n: 'Tuenti', c: 'TUE' }]) {
    await exec('INSERT OR IGNORE INTO EmpresaTelefonica (nombre,codigo) VALUES (?,?)', [e.n, e.c])
  }
  results.push('4 empresas telefónicas')

  // 8. SERVICIOS DE CORREO ELECTRÓNICO
  for (const s of [{ n: 'Gmail', d: 'gmail.com' }, { n: 'Outlook/Hotmail', d: 'outlook.com' }, { n: 'Yahoo', d: 'yahoo.com' }, { n: 'ICloud', d: 'icloud.com' }]) {
    await exec('INSERT OR IGNORE INTO ServicioCorreoElectronico (nombre,dominio) VALUES (?,?)', [s.n, s.d])
  }
  results.push('4 servicios de correo electrónico')

  // 9. TIPOS DE PLATAFORMA
  for (const t of [{ n: 'Web', d: 'Aplicación web' }, { n: 'Android', d: 'Aplicación móvil Android' }, { n: 'iOS', d: 'Aplicación móvil iOS' }, { n: 'API', d: 'Servicio API REST' }]) {
    await exec('INSERT OR IGNORE INTO TipoPlataforma (nombre,descripcion) VALUES (?,?)', [t.n, t.d])
  }
  results.push('4 tipos de plataforma')

  // 10. TIPOS DE ENTIDAD
  for (const t of [{ n: 'física', d: 'Persona física' }, { n: 'jurídica', d: 'Persona jurídica / Empresa' }]) {
    await exec('INSERT OR IGNORE INTO TipoEntidad (nombre,descripcion) VALUES (?,?)', [t.n, t.d])
  }
  results.push('2 tipos de entidad')

  // 11. ESTADOS DE SESIÓN
  for (const e of [{ n: 'activa', d: 'Sesión activa del usuario' }, { n: 'expirada', d: 'Sesión expirada por inactividad' }, { n: 'cerrada', d: 'Sesión cerrada por el usuario' }, { n: 'revocada', d: 'Sesión revocada por seguridad' }]) {
    await exec('INSERT OR IGNORE INTO EstadoSesion (nombre,descripcion) VALUES (?,?)', [e.n, e.d])
  }
  results.push('4 estados de sesión')

  // 12. TIPOS DE PERSONA
  for (const n of ['cliente', 'proveedor', 'empleado']) await exec('INSERT OR IGNORE INTO TipoPersona (nombre) VALUES (?)', [n])
  results.push('3 tipos de persona')

  // 13. CATEGORÍAS DE MATERIAS PRIMAS
  for (const c of [
    { n: 'Harinas', d: 'Harinas de trigo, sémola y otros cereales' },
    { n: 'Huevos y derivados', d: 'Huevos frescos, líquidos y derivados' },
    { n: 'Lácteos', d: 'Quesos, cremas, manteca y leches' },
    { n: 'Aceites y grasas', d: 'Aceites vegetales y grasas' },
    { n: 'Condimentos y especias', d: 'Especias, sal, pimienta y hierbas' },
    { n: 'Carnes', d: 'Carnes para rellenos (res, cerdo, pollo)' },
    { n: 'Verduras', d: 'Verduras frescas para salsas y rellenos' },
    { n: 'Salsas y conservas', d: 'Tomates, salsa de tomate, conservas' },
    { n: 'Aditivos y suplementos', d: 'Colorantes, conservantes, mejoradores' },
  ]) {
    await exec('INSERT OR IGNORE INTO CategoriaMateriaPrima (nombre,descripcion) VALUES (?,?)', [c.n, c.d])
  }
  results.push('9 categorías de materias primas')

  // 14. TIPOS DE INSUMOS
  for (const t of [
    { n: 'Envases primarios', d: 'Bolsas, bandejas, film para contacto directo' },
    { n: 'Envases secundarios', d: 'Cajas, cartones, etiquetas' },
    { n: 'Materiales de limpieza', d: 'Productos de limpieza y sanitización' },
    { n: 'Combustibles', d: 'Gas, leña, energía para producción' },
    { n: 'Utensilios descartables', d: 'Guantes, cofias, delantales descartables' },
    { n: 'Insumos de oficina', d: 'Papel, cartuchos, útiles' },
  ]) {
    await exec('INSERT OR IGNORE INTO TipoInsumo (nombre,descripcion) VALUES (?,?)', [t.n, t.d])
  }
  results.push('6 tipos de insumos')

  // Migración: renombrar "Cinta Ancha" / "Cinta ancha" → "Cintas Anchas" ANTES de insertar
  // Primero eliminar el duplicado "Cintas Anchas" si ya fue creado por un seed previo
  // y migrar los productos de la categoría vieja a la existente
  await exec("DELETE FROM CategoriaProductoTerminado WHERE nombre = 'Cintas Anchas' AND id NOT IN (SELECT MIN(id) FROM CategoriaProductoTerminado WHERE nombre IN ('Cinta Ancha', 'Cinta ancha', 'cinta ancha', 'Cintas Anchas'))")
  await exec("UPDATE CategoriaProductoTerminado SET nombre = 'Cintas Anchas' WHERE nombre IN ('Cinta Ancha', 'Cinta ancha', 'cinta ancha')")
  for (const c of [
    { n: 'Sorrentinos', d: 'Sorrentinos rellenos artesanales' },
    { n: 'Ñoquis', d: 'Ñoquis de papa, mandioca, calabaza y más' },
    { n: 'Tallarines', d: 'Tallarines al huevo, al morrón, espinaca y más' },
    { n: 'Cintas Anchas', d: 'Cintas anchas al huevo y más' },
    { n: 'Ravioles', d: 'Ravioles rellenos de ricota, carne, jamón y más' },
    { n: 'Tapas', d: 'Tapas para empanadas, pascualinas, pastelitos y copetín' },
    { n: 'Empanadas', d: 'Empanadas crudas y al horno' },
    { n: 'Tartas', d: 'Tartas saladas de verdura, jamón, pollo y choclo' },
    { n: 'Pastas frescas', d: 'Pastas frescas rellenas y al huevo' },
    { n: 'Pastas secas', d: 'Pastas secas tipo fideos' },
    { n: 'Salsas', d: 'Salsas para acompañar pastas' },
    { n: 'Lasagnas y canelones', d: 'Platos armados listos para hornear' },
    { n: 'Postres', d: 'Postres a base de pasta' },
  ]) {
    await exec('INSERT OR IGNORE INTO CategoriaProductoTerminado (nombre,descripcion) VALUES (?,?)', [c.n, c.d])
  }
  results.push('13 categorías de productos terminados (+ migración Cintas Anchas)')

  // 16. MARCAS
  for (const m of [
    { n: 'Pastas Orlando', d: 'Marca propia' },
    { n: 'Molinos Río de la Plata', d: 'Harinas y cereales' },
    { n: 'Arcor', d: 'Alimentos generales' },
    { n: 'Mastellone', d: 'Lácteos' },
    { n: 'La Serenísima', d: 'Lácteos' },
    { n: 'Molto', d: 'Harinas especiales' },
    { n: 'Blancaflor', d: 'Harinas' },
    { n: 'Canale', d: 'Alimentos' },
    { n: 'Fargo', d: 'Alimentos' },
    { n: 'Sin marca', d: 'Genérico / sin marca' },
  ]) {
    await exec('INSERT OR IGNORE INTO Marca (nombre,descripcion) VALUES (?,?)', [m.n, m.d])
  }
  results.push('10 marcas')

  // 17. UNIDADES DE MEDIDA
  for (const u of [
    { c: 'kg', n: 'Kilogramo', cb: 1, tm: 'peso' },
    { c: 'g', n: 'Gramo', cb: 0.001, tm: 'peso' },
    { c: 'mg', n: 'Miligramo', cb: 0.000001, tm: 'peso' },
    { c: 'l', n: 'Litro', cb: 1, tm: 'volumen' },
    { c: 'ml', n: 'Mililitro', cb: 0.001, tm: 'volumen' },
    { c: 'cc', n: 'Centímetro cúbico', cb: 0.001, tm: 'volumen' },
    { c: 'm', n: 'Metro', cb: 1, tm: 'longitud' },
    { c: 'cm', n: 'Centímetro', cb: 0.01, tm: 'longitud' },
    { c: 'mm', n: 'Milímetro', cb: 0.001, tm: 'longitud' },
    { c: 'u', n: 'Unidad', cb: 1, tm: 'unidad' },
    { c: 'doc', n: 'Docena', cb: 12, tm: 'unidad' },
    { c: 'rollo', n: 'Rollo', cb: 1, tm: 'unidad' },
    { c: 'paq', n: 'Paquete', cb: 1, tm: 'unidad' },
    { c: 'bolsa', n: 'Bolsa', cb: 1, tm: 'unidad' },
    { c: 'caja', n: 'Caja', cb: 1, tm: 'unidad' },
  ]) {
    await exec('INSERT OR IGNORE INTO UnidadMedida (codigo,nombre,conversion_a_base,tipo_medida) VALUES (?,?,?,?)', [u.c, u.n, u.cb, u.tm])
  }
  results.push('15 unidades de medida')

  // 18. FORMAS DE PAGO
  for (const f of [
    { n: 'Efectivo', ri: 0, rc: 0 },
    { n: 'Mercado Pago', ri: 0, rc: 1 },
    { n: 'Transferencia bancaria', ri: 1, rc: 1 },
  ]) {
    await exec('INSERT OR IGNORE INTO FormaPago (nombre_forma,requiere_identificacion,requiere_cuenta) VALUES (?,?,?)', [f.n, f.ri, f.rc])
  }
  results.push('3 formas de pago')

  // 19. ESTADOS GENERALES
  for (const e of [
    { n: 'pendiente', ea: 'general', ef: 0 },
    { n: 'en_proceso', ea: 'general', ef: 0 },
    { n: 'completado', ea: 'general', ef: 1 },
    { n: 'cancelado', ea: 'general', ef: 1 },
    { n: 'entregado', ea: 'pedidos', ef: 1 },
    { n: 'en_camino', ea: 'entregas', ef: 0 },
    { n: 'programado', ea: 'entregas', ef: 0 },
    { n: 'pagado', ea: 'ventas', ef: 1 },
    { n: 'activo', ea: 'produccion', ef: 0 },
    { n: 'aprobado', ea: 'presupuestos', ef: 0 },
    { n: 'rechazado', ea: 'presupuestos', ef: 1 },
    { n: 'expirado', ea: 'presupuestos', ef: 1 },
    { n: 'convertido', ea: 'presupuestos', ef: 1 },
  ]) {
    await exec('INSERT OR IGNORE INTO EstadoGeneral (nombre_estado,entidad_aplicable,es_final) VALUES (?,?,?)', [e.n, e.ea, e.ef])
  }
  results.push('13 estados generales')

  // 20-21. PERSONA + USUARIO ADMIN
  await exec("INSERT OR IGNORE INTO Persona (nombre,apellido,numero_documento,tipo_persona,observaciones) VALUES ('Orlando','Candia','00000000','empleado','Administrador del sistema')")
  const personaId = Number((await exec("SELECT id FROM Persona WHERE numero_documento='00000000'")).rows[0]?.id)
  const hashedPassword = await bcrypt.hash('Pastas2026!', 10)
  // INSERT OR IGNORE won't update password if user already exists, so we also UPDATE
  await exec('INSERT OR IGNORE INTO Usuario (id_persona,email,password,estado) VALUES (?,?,?,?)', [personaId, 'orlando.candia@gmail.com', hashedPassword, 1])
  await exec('UPDATE Usuario SET password = ?, estado = 1 WHERE email = ?', [hashedPassword, 'orlando.candia@gmail.com'])
  const usuarioId = Number((await exec("SELECT id FROM Usuario WHERE email='orlando.candia@gmail.com'")).rows[0]?.id)
  results.push(`Admin: Orlando Candia (usuario_id=${usuarioId}, password updated)`)

  // Contacto email
  const tipoEmailId = Number((await exec("SELECT id FROM TipoContacto WHERE nombre='email'")).rows[0]?.id)
  if (tipoEmailId && personaId) {
    await exec('INSERT OR IGNORE INTO Contacto (id_persona,id_tipo_contacto,valor,es_principal,verificado) VALUES (?,?,?,?,?)', [personaId, tipoEmailId, 'orlando.candia@gmail.com', 1, 1])
  }
  results.push('Contacto email admin')

  // 22. ROLES
  for (const r of [
    { n: 'admin', d: 'Administrador total del sistema', ed: 0 },
    { n: 'produccion', d: 'Acceso a producción y stock', ed: 0 },
    { n: 'ventas', d: 'Acceso a ventas y pedidos', ed: 0 },
    { n: 'lectura', d: 'Solo lectura de datos', ed: 1 },
  ]) {
    await exec('INSERT OR IGNORE INTO Rol (nombre,descripcion,es_default) VALUES (?,?,?)', [r.n, r.d, r.ed])
  }
  const rolAdminId = Number((await exec("SELECT id FROM Rol WHERE nombre='admin'")).rows[0]?.id)
  if (usuarioId && rolAdminId) {
    await exec('INSERT OR IGNORE INTO UsuarioRol (id_usuario,id_rol) VALUES (?,?)', [usuarioId, rolAdminId])
  }
  results.push('4 roles + admin asignado')

  // 23. PERMISOS
  const mods = ['productos', 'compras', 'ventas', 'produccion', 'usuarios', 'auditoria', 'reportes', 'seguridad', 'logistica', 'presupuestos']
  const accs = ['ver', 'crear', 'editar', 'eliminar']
  for (const mod of mods) {
    for (const acc of accs) {
      await exec('INSERT OR IGNORE INTO Permiso (nombre,modulo,descripcion) VALUES (?,?,?)', [`${mod}.${acc}`, mod, `${acc} en ${mod}`])
    }
  }
  for (const n of ['dashboard.ver', 'configuracion.ver', 'configuracion.editar', 'opiniones.ver', 'opiniones.editar']) {
    await exec('INSERT OR IGNORE INTO Permiso (nombre,modulo,descripcion) VALUES (?,?,?)', [n, n.split('.')[0], n])
  }

  // Assign all permissions to admin role
  const allPerms = await exec('SELECT id FROM Permiso')
  for (const row of allPerms.rows) {
    const pid = Number(row.id)
    if (rolAdminId && pid) {
      await exec('INSERT OR IGNORE INTO RolPermiso (id_rol,id_permiso) VALUES (?,?)', [rolAdminId, pid])
    }
  }
  results.push(`${allPerms.rows.length} permisos + asignados al rol admin`)

  // Helper to get category/unit IDs by name/code
  const catId = async (table: string, nombre: string) =>
    Number((await exec(`SELECT id FROM ${table} WHERE nombre=?`, [nombre])).rows[0]?.id) || 0
  const umId = async (codigo: string) =>
    Number((await exec('SELECT id FROM UnidadMedida WHERE codigo=?', [codigo])).rows[0]?.id) || 0
  const tiId = async (nombre: string) =>
    Number((await exec('SELECT id FROM TipoInsumo WHERE nombre=?', [nombre])).rows[0]?.id) || 0

  // 24. PRODUCTOS TERMINADOS (con tipo_harina: con_gluten, integral, sin_gluten)
  const productos = [
    // === SORRENTINOS ===
    { c: 'SOR-001', n: 'Sorrentinos de Jamón y Queso', cat: 'Sorrentinos', th: 'con_gluten', p: 0.5, pr: 4500, sm: 10, de: 1, o: 1 },
    { c: 'SOR-002', n: 'Sorrentinos de Cuatro Quesos', cat: 'Sorrentinos', th: 'con_gluten', p: 0.5, pr: 4800, sm: 10, de: 0, o: 2 },
    { c: 'SOR-003', n: 'Sorrentinos de Pollo y Roquefort', cat: 'Sorrentinos', th: 'con_gluten', p: 0.5, pr: 5000, sm: 8, de: 1, o: 3 },
    { c: 'SOR-004', n: 'Sorrentinos de Espinaca y Queso', cat: 'Sorrentinos', th: 'con_gluten', p: 0.5, pr: 4200, sm: 8, de: 0, o: 4 },
    { c: 'SOR-005', n: 'Sorrentinos de Carne', cat: 'Sorrentinos', th: 'con_gluten', p: 0.5, pr: 4500, sm: 8, de: 0, o: 5 },
    { c: 'SOR-006', n: 'Sorrentinos de Caprese', cat: 'Sorrentinos', th: 'con_gluten', p: 0.5, pr: 4600, sm: 8, de: 0, o: 6 },
    { c: 'SOR-007', n: 'Sorrentinos sin Gluten de Jamón y Queso', cat: 'Sorrentinos', th: 'sin_gluten', p: 0.5, pr: 5500, sm: 5, de: 1, o: 7 },
    { c: 'SOR-008', n: 'Sorrentinos sin Gluten de Espinaca y Queso', cat: 'Sorrentinos', th: 'sin_gluten', p: 0.5, pr: 5500, sm: 5, de: 0, o: 8 },
    // === ÑOQUIS ===
    { c: 'NQ-001', n: 'Ñoquis de Papa', cat: 'Ñoquis', th: 'con_gluten', p: 0.5, pr: 3500, sm: 15, de: 1, o: 1 },
    { c: 'NQ-002', n: 'Ñoquis de Espinaca', cat: 'Ñoquis', th: 'con_gluten', p: 0.5, pr: 3700, sm: 10, de: 0, o: 2 },
    { c: 'NQ-003', n: 'Ñoquis de Calabaza', cat: 'Ñoquis', th: 'con_gluten', p: 0.5, pr: 3700, sm: 10, de: 0, o: 3 },
    { c: 'NQ-004', n: 'Ñoquis de Ricota', cat: 'Ñoquis', th: 'con_gluten', p: 0.5, pr: 3800, sm: 8, de: 0, o: 4 },
    { c: 'NQ-005', n: 'Ñoquis de Mandioca', cat: 'Ñoquis', th: 'con_gluten', p: 0.5, pr: 3600, sm: 8, de: 0, o: 5 },
    { c: 'NQ-006', n: 'Ñoquis de Batata', cat: 'Ñoquis', th: 'con_gluten', p: 0.5, pr: 3600, sm: 8, de: 0, o: 6 },
    { c: 'NQ-007', n: 'Ñoquis de Harina Integral', cat: 'Ñoquis', th: 'integral', p: 0.5, pr: 4200, sm: 6, de: 0, o: 7 },
    { c: 'NQ-008', n: 'Ñoquis sin Gluten de Papa', cat: 'Ñoquis', th: 'sin_gluten', p: 0.5, pr: 5000, sm: 5, de: 1, o: 8 },
    // === TALLARINES ===
    { c: 'TAL-001', n: 'Tallarines al Huevo', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 3200, sm: 15, de: 1, o: 1 },
    { c: 'TAL-002', n: 'Tallarines al Morrón', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 3300, sm: 15, de: 0, o: 2 },
    { c: 'TAL-003', n: 'Tallarines a la Espinaca', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 3400, sm: 12, de: 0, o: 3 },
    { c: 'TAL-004', n: 'Tallarines al Zapallo', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 3400, sm: 10, de: 0, o: 4 },
    { c: 'TAL-005', n: 'Tallarines a la Remolacha', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 3400, sm: 10, de: 0, o: 5 },
    { c: 'TAL-006', n: 'Tallarines Negros (Tinta de Calamar)', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 4500, sm: 8, de: 0, o: 6 },
    { c: 'TAL-007', n: 'Tallarines Mixtos (Morrón y Espinaca)', cat: 'Tallarines', th: 'con_gluten', p: 0.4, pr: 3500, sm: 10, de: 0, o: 7 },
    { c: 'TAL-008', n: 'Tallarines Integrales al Huevo', cat: 'Tallarines', th: 'integral', p: 0.4, pr: 4000, sm: 10, de: 1, o: 8 },
    { c: 'TAL-009', n: 'Tallarines Integrales al Morrón', cat: 'Tallarines', th: 'integral', p: 0.4, pr: 4100, sm: 8, de: 0, o: 9 },
    { c: 'TAL-010', n: 'Tallarines Integrales a la Espinaca', cat: 'Tallarines', th: 'integral', p: 0.4, pr: 4100, sm: 8, de: 0, o: 10 },
    { c: 'TAL-011', n: 'Tallarines Integrales al Zapallo', cat: 'Tallarines', th: 'integral', p: 0.4, pr: 4100, sm: 6, de: 0, o: 11 },
    { c: 'TAL-012', n: 'Tallarines Integrales a la Remolacha', cat: 'Tallarines', th: 'integral', p: 0.4, pr: 4100, sm: 6, de: 0, o: 12 },
    { c: 'TAL-013', n: 'Tallarines Integrales Mixtos', cat: 'Tallarines', th: 'integral', p: 0.4, pr: 4200, sm: 6, de: 0, o: 13 },
    { c: 'TAL-014', n: 'Tallarines sin Gluten de Arroz', cat: 'Tallarines', th: 'sin_gluten', p: 0.4, pr: 5200, sm: 5, de: 1, o: 14 },
    // === RAVIOLES ===
    { c: 'RAV-001', n: 'Ravioles de Ricota y Espinaca', cat: 'Ravioles', th: 'con_gluten', p: 0.5, pr: 4000, sm: 10, de: 1, o: 1 },
    { c: 'RAV-002', n: 'Ravioles de Carne', cat: 'Ravioles', th: 'con_gluten', p: 0.5, pr: 4200, sm: 10, de: 1, o: 2 },
    { c: 'RAV-003', n: 'Ravioles de Jamón y Queso', cat: 'Ravioles', th: 'con_gluten', p: 0.5, pr: 4300, sm: 8, de: 0, o: 3 },
    { c: 'RAV-004', n: 'Ravioles de Pollo', cat: 'Ravioles', th: 'con_gluten', p: 0.5, pr: 4500, sm: 8, de: 0, o: 4 },
    { c: 'RAV-005', n: 'Ravioles de Verdura', cat: 'Ravioles', th: 'con_gluten', p: 0.5, pr: 3900, sm: 8, de: 0, o: 5 },
    { c: 'RAV-006', n: 'Ravioles de Capresse', cat: 'Ravioles', th: 'con_gluten', p: 0.5, pr: 4400, sm: 6, de: 0, o: 6 },
    { c: 'RAV-007', n: 'Ravioles sin Gluten de Ricota', cat: 'Ravioles', th: 'sin_gluten', p: 0.5, pr: 5500, sm: 5, de: 1, o: 7 },
    { c: 'RAV-008', n: 'Ravioles sin Gluten de Carne', cat: 'Ravioles', th: 'sin_gluten', p: 0.5, pr: 5500, sm: 5, de: 0, o: 8 },
    // === TAPAS ===
    { c: 'TAP-001', n: 'Tapas para Empanadas', cat: 'Tapas', th: 'con_gluten', p: 0.5, pr: 2800, sm: 20, de: 1, o: 1 },
    { c: 'TAP-002', n: 'Tapas para Pascualinas', cat: 'Tapas', th: 'con_gluten', p: 0.5, pr: 2800, sm: 15, de: 0, o: 2 },
    { c: 'TAP-003', n: 'Tapas para Pastelitos', cat: 'Tapas', th: 'con_gluten', p: 0.5, pr: 3000, sm: 10, de: 0, o: 3 },
    { c: 'TAP-004', n: 'Tapas para Copetín', cat: 'Tapas', th: 'con_gluten', p: 0.3, pr: 2200, sm: 15, de: 0, o: 4 },
    { c: 'TAP-005', n: 'Tapas Integrales para Empanadas', cat: 'Tapas', th: 'integral', p: 0.5, pr: 3500, sm: 8, de: 1, o: 5 },
    { c: 'TAP-006', n: 'Tapas Integrales para Pascualinas', cat: 'Tapas', th: 'integral', p: 0.5, pr: 3500, sm: 8, de: 0, o: 6 },
    { c: 'TAP-007', n: 'Tapas Integrales para Copetín', cat: 'Tapas', th: 'integral', p: 0.3, pr: 2800, sm: 6, de: 0, o: 7 },
    { c: 'TAP-008', n: 'Tapas sin Gluten para Empanadas', cat: 'Tapas', th: 'sin_gluten', p: 0.5, pr: 4500, sm: 5, de: 1, o: 8 },
    // === EMPANADAS ===
    { c: 'EMP-001', n: 'Empanadas de Carne', cat: 'Empanadas', th: 'con_gluten', p: 0.12, pr: 800, sm: 30, de: 1, o: 1 },
    { c: 'EMP-002', n: 'Empanadas de Pollo', cat: 'Empanadas', th: 'con_gluten', p: 0.12, pr: 800, sm: 25, de: 0, o: 2 },
    { c: 'EMP-003', n: 'Empanadas de Jamón y Queso', cat: 'Empanadas', th: 'con_gluten', p: 0.12, pr: 800, sm: 25, de: 0, o: 3 },
    { c: 'EMP-004', n: 'Empanadas de Caprese', cat: 'Empanadas', th: 'con_gluten', p: 0.12, pr: 850, sm: 20, de: 0, o: 4 },
    { c: 'EMP-005', n: 'Empanadas de Verdura', cat: 'Empanadas', th: 'con_gluten', p: 0.12, pr: 750, sm: 20, de: 0, o: 5 },
    { c: 'EMP-006', n: 'Empanadas de Atún', cat: 'Empanadas', th: 'con_gluten', p: 0.12, pr: 800, sm: 15, de: 0, o: 6 },
    // === TARTAS ===
    { c: 'TRT-001', n: 'Tarta de Verdura', cat: 'Tartas', th: 'con_gluten', p: 0.8, pr: 6000, sm: 5, de: 1, o: 1 },
    { c: 'TRT-002', n: 'Tarta de Jamón y Queso', cat: 'Tartas', th: 'con_gluten', p: 0.8, pr: 6500, sm: 5, de: 0, o: 2 },
    { c: 'TRT-003', n: 'Tarta de Pollo', cat: 'Tartas', th: 'con_gluten', p: 0.8, pr: 6500, sm: 5, de: 0, o: 3 },
    { c: 'TRT-004', n: 'Tarta de Choclo', cat: 'Tartas', th: 'con_gluten', p: 0.8, pr: 6000, sm: 5, de: 0, o: 4 },
    { c: 'TRT-005', n: 'Tarta de Espinaca y Queso', cat: 'Tartas', th: 'con_gluten', p: 0.8, pr: 6200, sm: 5, de: 0, o: 5 },
    // === PRODUCTOS LEGACY ===
    { c: 'PF-001', n: 'Sorrentinos de Jamón y Queso', cat: 'Pastas frescas', th: 'con_gluten', p: 0.5, pr: 4500, sm: 10, de: 1, o: 1 },
    { c: 'PF-002', n: 'Ravioles de Ricota y Espinaca', cat: 'Pastas frescas', th: 'con_gluten', p: 0.5, pr: 4000, sm: 10, de: 1, o: 2 },
    { c: 'PF-003', n: 'Ravioles de Carne', cat: 'Pastas frescas', th: 'con_gluten', p: 0.5, pr: 4200, sm: 10, de: 1, o: 3 },
    { c: 'PF-004', n: 'Cappelletti de Pollo', cat: 'Pastas frescas', th: 'con_gluten', p: 0.5, pr: 4600, sm: 10, de: 0, o: 4 },
    { c: 'PF-005', n: 'Tortellini de Queso', cat: 'Pastas frescas', th: 'con_gluten', p: 0.4, pr: 4300, sm: 8, de: 0, o: 5 },
    { c: 'PF-006', n: 'Agnolottis de Verdura', cat: 'Pastas frescas', th: 'con_gluten', p: 0.5, pr: 3900, sm: 8, de: 0, o: 6 },
    { c: 'PF-007', n: 'Fettuccine al Huevo', cat: 'Pastas frescas', th: 'con_gluten', p: 0.4, pr: 3200, sm: 15, de: 1, o: 7 },
    { c: 'PF-008', n: 'Tagliatelle al Huevo', cat: 'Pastas frescas', th: 'con_gluten', p: 0.4, pr: 3200, sm: 15, de: 0, o: 8 },
    { c: 'PF-009', n: 'Pappardelle', cat: 'Pastas frescas', th: 'con_gluten', p: 0.4, pr: 3300, sm: 10, de: 0, o: 9 },
    { c: 'PF-010', n: 'Masa para Empanadas', cat: 'Pastas frescas', th: 'con_gluten', p: 0.5, pr: 2800, sm: 20, de: 0, o: 10 },
    { c: 'PS-001', n: 'Fideos Spaghetti', cat: 'Pastas secas', th: 'con_gluten', p: 0.5, pr: 2500, sm: 20, de: 1, o: 1 },
    { c: 'PS-002', n: 'Fideos Penne Rigate', cat: 'Pastas secas', th: 'con_gluten', p: 0.5, pr: 2500, sm: 20, de: 0, o: 2 },
    { c: 'PS-003', n: 'Fideos Tirabuzón', cat: 'Pastas secas', th: 'con_gluten', p: 0.5, pr: 2500, sm: 15, de: 0, o: 3 },
    { c: 'PS-004', n: 'Mostacholes', cat: 'Pastas secas', th: 'con_gluten', p: 0.5, pr: 2500, sm: 15, de: 0, o: 4 },
    { c: 'PS-005', n: 'Cintas', cat: 'Pastas secas', th: 'con_gluten', p: 0.5, pr: 2600, sm: 10, de: 0, o: 5 },
    { c: 'SA-001', n: 'Salsa Filetto', cat: 'Salsas', th: 'con_gluten', p: 0.5, pr: 3000, sm: 10, de: 1, o: 1 },
    { c: 'SA-002', n: 'Salsa Bolognesa', cat: 'Salsas', th: 'con_gluten', p: 0.5, pr: 3500, sm: 10, de: 1, o: 2 },
    { c: 'SA-003', n: 'Salsa Crema', cat: 'Salsas', th: 'con_gluten', p: 0.5, pr: 3200, sm: 8, de: 0, o: 3 },
    { c: 'SA-004', n: 'Salsa Pesto', cat: 'Salsas', th: 'con_gluten', p: 0.3, pr: 3800, sm: 8, de: 0, o: 4 },
    { c: 'LC-001', n: 'Lasagna de Carne', cat: 'Lasagnas y canelones', th: 'con_gluten', p: 1.0, pr: 8000, sm: 5, de: 1, o: 1 },
    { c: 'LC-002', n: 'Lasagna de Verdura', cat: 'Lasagnas y canelones', th: 'con_gluten', p: 1.0, pr: 7500, sm: 5, de: 0, o: 2 },
    { c: 'LC-003', n: 'Canelones de Jamón y Queso', cat: 'Lasagnas y canelones', th: 'con_gluten', p: 0.8, pr: 6500, sm: 5, de: 1, o: 3 },
    { c: 'LC-004', n: 'Canelones de Ricota', cat: 'Lasagnas y canelones', th: 'con_gluten', p: 0.8, pr: 6000, sm: 5, de: 0, o: 4 },
  ]
  for (const pt of productos) {
    const idCat = await catId('CategoriaProductoTerminado', pt.cat)
    if (!idCat) continue
    await exec('INSERT OR IGNORE INTO ProductoTerminado (codigo,nombre,id_categoria,tipo_harina,peso_unitario_aprox,precio_venta,stock_minimo,destacado,orden,visible_en_landing,estado,stock_actual) VALUES (?,?,?,?,?,?,?,?,1,1,0)', [pt.c, pt.n, idCat, pt.th, pt.p, pt.pr, pt.sm, pt.de, pt.o])
  }
  results.push(`${productos.length} productos terminados`)

  // 25. MATERIAS PRIMAS
  const mps = [
    { c: 'MP-001', n: 'Harina 000', cat: 'Harinas', um: 'kg', s: 50, sm: 20, pr: 1200 },
    { c: 'MP-002', n: 'Harina 0000', cat: 'Harinas', um: 'kg', s: 30, sm: 15, pr: 1400 },
    { c: 'MP-003', n: 'Sémola de trigo', cat: 'Harinas', um: 'kg', s: 20, sm: 10, pr: 1600 },
    { c: 'MP-004', n: 'Huevos frescos', cat: 'Huevos y derivados', um: 'u', s: 120, sm: 60, pr: 250 },
    { c: 'MP-005', n: 'Queso Ricota', cat: 'Lácteos', um: 'kg', s: 10, sm: 5, pr: 5000 },
    { c: 'MP-006', n: 'Queso Mozzarella', cat: 'Lácteos', um: 'kg', s: 8, sm: 4, pr: 6000 },
    { c: 'MP-007', n: 'Queso Parmesano', cat: 'Lácteos', um: 'kg', s: 5, sm: 2, pr: 12000 },
    { c: 'MP-008', n: 'Manteca', cat: 'Lácteos', um: 'kg', s: 5, sm: 3, pr: 8000 },
    { c: 'MP-009', n: 'Crema de leche', cat: 'Lácteos', um: 'l', s: 10, sm: 5, pr: 3000 },
    { c: 'MP-010', n: 'Aceite de girasol', cat: 'Aceites y grasas', um: 'l', s: 10, sm: 5, pr: 2500 },
    { c: 'MP-011', n: 'Aceite de oliva', cat: 'Aceites y grasas', um: 'l', s: 3, sm: 2, pr: 8000 },
    { c: 'MP-012', n: 'Sal fina', cat: 'Condimentos y especias', um: 'kg', s: 10, sm: 5, pr: 800 },
    { c: 'MP-013', n: 'Pimienta negra', cat: 'Condimentos y especias', um: 'kg', s: 1, sm: 0.5, pr: 15000 },
    { c: 'MP-014', n: 'Nuez moscada', cat: 'Condimentos y especias', um: 'kg', s: 0.5, sm: 0.2, pr: 25000 },
    { c: 'MP-015', n: 'Carne picada de res', cat: 'Carnes', um: 'kg', s: 15, sm: 8, pr: 7000 },
    { c: 'MP-016', n: 'Jamón cocido', cat: 'Carnes', um: 'kg', s: 8, sm: 4, pr: 8000 },
    { c: 'MP-017', n: 'Pollo desmenuzado', cat: 'Carnes', um: 'kg', s: 5, sm: 3, pr: 6500 },
    { c: 'MP-018', n: 'Espinaca fresca', cat: 'Verduras', um: 'kg', s: 5, sm: 3, pr: 3500 },
    { c: 'MP-019', n: 'Cebolla', cat: 'Verduras', um: 'kg', s: 10, sm: 5, pr: 1500 },
    { c: 'MP-020', n: 'Ajo', cat: 'Verduras', um: 'kg', s: 2, sm: 1, pr: 5000 },
    { c: 'MP-021', n: 'Calabaza', cat: 'Verduras', um: 'kg', s: 8, sm: 4, pr: 2000 },
    { c: 'MP-022', n: 'Papa', cat: 'Verduras', um: 'kg', s: 20, sm: 10, pr: 1200 },
    { c: 'MP-023', n: 'Tomate perita en lata', cat: 'Salsas y conservas', um: 'kg', s: 15, sm: 8, pr: 2500 },
    { c: 'MP-024', n: 'Puré de tomate', cat: 'Salsas y conservas', um: 'kg', s: 10, sm: 5, pr: 2000 },
    { c: 'MP-025', n: 'Albahaca fresca', cat: 'Verduras', um: 'kg', s: 1, sm: 0.5, pr: 8000 },
    { c: 'MP-026', n: 'Colorante alimentario', cat: 'Aditivos y suplementos', um: 'kg', s: 0.5, sm: 0.2, pr: 12000 },
    { c: 'MP-027', n: 'Agua', cat: 'Aditivos y suplementos', um: 'l', s: 100, sm: 50, pr: 100 },
  ]
  for (const mp of mps) {
    const idCat = await catId('CategoriaMateriaPrima', mp.cat)
    const idUm = await umId(mp.um)
    if (!idCat || !idUm) continue
    await exec('INSERT OR IGNORE INTO MateriaPrima (codigo,nombre,id_categoria,id_unidad_base,stock_actual,stock_minimo,precio_compra_referencia,estado) VALUES (?,?,?,?,?,?,?,1)', [mp.c, mp.n, idCat, idUm, mp.s, mp.sm, mp.pr])
  }
  results.push(`${mps.length} materias primas`)

  // 26. INSUMOS
  const insumos = [
    { c: 'IN-001', n: 'Bolsa de polietileno 500g', ti: 'Envases primarios', um: 'paq', s: 200, sm: 100, pr: 150 },
    { c: 'IN-002', n: 'Bandeja de poliestireno', ti: 'Envases primarios', um: 'u', s: 150, sm: 80, pr: 200 },
    { c: 'IN-003', n: 'Film plástico', ti: 'Envases primarios', um: 'rollo', s: 10, sm: 5, pr: 3500 },
    { c: 'IN-004', n: 'Caja de cartón para pastas', ti: 'Envases secundarios', um: 'u', s: 100, sm: 50, pr: 500 },
    { c: 'IN-005', n: 'Etiqueta adhesiva', ti: 'Envases secundarios', um: 'u', s: 500, sm: 200, pr: 50 },
    { c: 'IN-006', n: 'Lavandina', ti: 'Materiales de limpieza', um: 'l', s: 10, sm: 5, pr: 800 },
    { c: 'IN-007', n: 'Detergente', ti: 'Materiales de limpieza', um: 'l', s: 5, sm: 3, pr: 1500 },
    { c: 'IN-008', n: 'Desengrasante', ti: 'Materiales de limpieza', um: 'l', s: 3, sm: 2, pr: 2500 },
    { c: 'IN-009', n: 'Gas envaso', ti: 'Combustibles', um: 'kg', s: 30, sm: 15, pr: 3000 },
    { c: 'IN-010', n: 'Guantes de latex', ti: 'Utensilios descartables', um: 'paq', s: 20, sm: 10, pr: 2500 },
    { c: 'IN-011', n: 'Cofias descartables', ti: 'Utensilios descartables', um: 'paq', s: 15, sm: 8, pr: 1800 },
    { c: 'IN-012', n: 'Delantal descartable', ti: 'Utensilios descartables', um: 'u', s: 50, sm: 25, pr: 300 },
  ]
  for (const ins of insumos) {
    const idTi = await tiId(ins.ti)
    const idUm = await umId(ins.um)
    if (!idTi || !idUm) continue
    await exec('INSERT OR IGNORE INTO Insumo (codigo,nombre,id_tipo_insumo,id_unidad_base,stock_actual,stock_minimo,precio_compra_referencia,estado) VALUES (?,?,?,?,?,?,?,1)', [ins.c, ins.n, idTi, idUm, ins.s, ins.sm, ins.pr])
  }
  results.push(`${insumos.length} insumos`)

  // 27. PRODUCTOS LANDING
  // Safety: ensure Producto table exists (may be missed by db-push-turso parser)
  try {
    await exec(`CREATE TABLE IF NOT EXISTS "Producto" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "nombre" TEXT NOT NULL,
      "descripcion" TEXT,
      "categoria" TEXT NOT NULL,
      "precio" REAL NOT NULL,
      "peso" TEXT NOT NULL DEFAULT '500g',
      "imagen" TEXT,
      "stock" BOOLEAN NOT NULL DEFAULT true,
      "destacado" BOOLEAN NOT NULL DEFAULT false,
      "orden" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
  } catch { /* table already exists, skip */ }

  const productosLanding = [
    { id: 1, n: 'Sorrentinos de Jamón y Queso', d: 'Clásicos sorrentinos rellenos de jamón cocido y queso mozzarella, hechos con masa al huevo.', cat: 'Pastas rellenas', pr: 4500, pe: '500g', de: 1, o: 1 },
    { id: 2, n: 'Ravioles de Ricota y Espinaca', d: 'Ravioles suaves con relleno de ricota fresca y espinaca, ideal con salsa filetto.', cat: 'Pastas rellenas', pr: 4000, pe: '500g', de: 1, o: 2 },
    { id: 3, n: 'Ravioles de Carne', d: 'Ravioles con relleno de carne especiada, tradición familiar en cada bocado.', cat: 'Pastas rellenas', pr: 4200, pe: '500g', de: 1, o: 3 },
    { id: 4, n: 'Ñoquis de Papa', d: 'Ñoquis suaves y esponjosos, hechos con papas naturales. ¡Tradición del 29!', cat: 'Ñoquis', pr: 3500, pe: '500g', de: 1, o: 4 },
    { id: 5, n: 'Fettuccine al Huevo', d: 'Fettuccine de masa al huevo, ideales para salsas cremosas.', cat: 'Pastas largas', pr: 3200, pe: '400g', de: 1, o: 5 },
    { id: 6, n: 'Spaghetti', d: 'Spaghetti secos de sémola de trigo, cocción perfecta al dente.', cat: 'Pastas secas', pr: 2500, pe: '500g', de: 0, o: 6 },
    { id: 7, n: 'Salsa Filetto', d: 'Salsa de tomates frescos con albahaca, el clásico acompañamiento.', cat: 'Salsas', pr: 3000, pe: '500g', de: 1, o: 7 },
    { id: 8, n: 'Salsa Bolognesa', d: 'Salsa con carne picada, tomate y vegetales, receta casera.', cat: 'Salsas', pr: 3500, pe: '500g', de: 0, o: 8 },
    { id: 9, n: 'Lasagna de Carne', d: 'Lasagna armada con capas de pasta, carne, salsa bechamel y queso.', cat: 'Platos armados', pr: 8000, pe: '1kg', de: 1, o: 9 },
    { id: 10, n: 'Canelones de Jamón y Queso', d: 'Canelones rellenos de jamón y queso, gratinados con salsa blanca.', cat: 'Platos armados', pr: 6500, pe: '800g', de: 0, o: 10 },
  ]
  for (const prod of productosLanding) {
    await exec('INSERT OR IGNORE INTO Producto (id,nombre,descripcion,categoria,precio,peso,destacado,orden,imagen,stock,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,NULL,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)', [prod.id, prod.n, prod.d, prod.cat, prod.pr, prod.pe, prod.de, prod.o])
  }
  results.push(`${productosLanding.length} productos landing`)

  // 28. PUNTOS DE ENCUENTRO
  const puntosEncuentro = [
    { id: 1, n: 'Centro - Corrientes', d: 'Av. 9 de Julio 1200, Corrientes', la: -27.4756, lo: -58.8314, h: '{"lunes_viernes": "8:00-18:00", "sabados": "8:00-13:00"}' },
    { id: 2, n: 'Barrio Esperanza', d: 'Av. Sargento Cabral 500, Corrientes', la: -27.4600, lo: -58.8100, h: '{"lunes_viernes": "9:00-17:00", "sabados": "9:00-12:00"}' },
    { id: 3, n: 'Plaza Italia', d: 'Plaza Italia, Corrientes', la: -27.4690, lo: -58.8350, h: '{"sabados": "8:00-12:00"}' },
  ]
  for (const pe of puntosEncuentro) {
    await exec('INSERT OR IGNORE INTO PuntoEncuentro (id,nombre,direccion,latitud,longitud,horarios,activo) VALUES (?,?,?,?,?,?,1)', [pe.id, pe.n, pe.d, pe.la, pe.lo, pe.h])
  }
  results.push(`${puntosEncuentro.length} puntos de encuentro`)

  return results
}

// POST /api/seed - Initialize database with ALL default data
// This endpoint should be called once to set up the initial data
export async function POST(request: NextRequest) {
  try {
    // Security: require a secret key to prevent unauthorized seeding
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (secret !== process.env.SEED_SECRET && secret !== 'pastas-orlando-seed-2026') {
      return NextResponse.json({ error: 'Unauthorized', version: 'v3-turso-fix' }, { status: 401 })
    }

    // Detect Turso and use @libsql/client directly
    if (isTurso()) {
      const client = getTursoClient()
      let results: string[] = []
      try {
        results = await seedTurso(client)
      } catch (seedError: any) {
        console.error('[Seed Turso Error]', seedError)
        return NextResponse.json({
          error: 'Error al ejecutar seed',
          details: seedError.message || String(seedError),
          version: 'v3-turso-fix',
          completedSteps: results,
        }, { status: 500 })
      }
      return NextResponse.json({
        success: true,
        version: 'v3-turso-fix',
        message: 'Seed COMPLETO exitoso (Turso/libsql) - Todas las tablas pobladas',
        backend: 'libsql',
        results,
        credentials: {
          email: 'orlando.candia@gmail.com',
          password: 'Pastas2026!',
          login_url: '/admin/login',
        },
      })
    }

    // ============================================
    // LOCAL SQLite PATH (Prisma-based)
    // ============================================
    const { db } = await import('@/lib/db')
    const results: string[] = []

    // ============================================
    // 1. PAÍSES
    // ============================================
    const argentina = await db.pais.upsert({
      where: { nombre: 'Argentina' },
      update: {},
      create: { nombre: 'Argentina' },
    })
    results.push(`País: ${argentina.nombre}`)

    // ============================================
    // 2. PROVINCIAS
    // ============================================
    const provinciasData = [
      'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires',
      'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy',
      'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén',
      'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
      'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
    ]

    const provincias: Record<string, number> = {}
    for (const nombre of provinciasData) {
      const p = await db.provincia.upsert({
        where: { id_pais_nombre: { id_pais: argentina.id, nombre } },
        update: {},
        create: { id_pais: argentina.id, nombre },
      })
      provincias[nombre] = p.id
    }
    results.push(`${provinciasData.length} provincias creadas`)

    // ============================================
    // 3. DEPARTAMENTOS
    // ============================================
    const departamentosData: { nombre: string; provincia: string }[] = [
      // ── Misiones (17 departamentos) ──
      { nombre: 'Apóstoles', provincia: 'Misiones' },
      { nombre: 'Cainguás', provincia: 'Misiones' },
      { nombre: 'Candelaria', provincia: 'Misiones' },
      { nombre: 'Capital', provincia: 'Misiones' },
      { nombre: 'Concepción', provincia: 'Misiones' },
      { nombre: 'Eldorado', provincia: 'Misiones' },
      { nombre: 'General Manuel Belgrano', provincia: 'Misiones' },
      { nombre: 'Guaraní', provincia: 'Misiones' },
      { nombre: 'Iguazú', provincia: 'Misiones' },
      { nombre: 'Leandro N. Alem', provincia: 'Misiones' },
      { nombre: 'Libertador General San Martín', provincia: 'Misiones' },
      { nombre: 'Montecarlo', provincia: 'Misiones' },
      { nombre: 'Oberá', provincia: 'Misiones' },
      { nombre: 'San Ignacio', provincia: 'Misiones' },
      { nombre: 'San Javier', provincia: 'Misiones' },
      { nombre: 'San Pedro', provincia: 'Misiones' },
      { nombre: 'Veinticinco de Mayo', provincia: 'Misiones' },
      // ── Corrientes ──
      { nombre: 'Capital', provincia: 'Corrientes' },
      { nombre: 'General Paz', provincia: 'Corrientes' },
      { nombre: 'San Cosme', provincia: 'Corrientes' },
      { nombre: 'Itatí', provincia: 'Corrientes' },
      { nombre: 'Bella Vista', provincia: 'Corrientes' },
      { nombre: 'Empedrado', provincia: 'Corrientes' },
      { nombre: 'Saladas', provincia: 'Corrientes' },
      { nombre: 'Esquina', provincia: 'Corrientes' },
      { nombre: 'Goya', provincia: 'Corrientes' },
      { nombre: 'Lavalle', provincia: 'Corrientes' },
      { nombre: 'Santo Tomé', provincia: 'Corrientes' },
      { nombre: 'Paso de los Libres', provincia: 'Corrientes' },
      { nombre: 'Monte Caseros', provincia: 'Corrientes' },
      { nombre: 'Curuzú Cuatiá', provincia: 'Corrientes' },
      { nombre: 'Mercedes', provincia: 'Corrientes' },
      // ── Ciudad Autónoma de Buenos Aires ──
      { nombre: 'Comuna 1', provincia: 'Ciudad Autónoma de Buenos Aires' },
      { nombre: 'Comuna 2', provincia: 'Ciudad Autónoma de Buenos Aires' },
      { nombre: 'Comuna 3', provincia: 'Ciudad Autónoma de Buenos Aires' },
      { nombre: 'Comuna 4', provincia: 'Ciudad Autónoma de Buenos Aires' },
      { nombre: 'Comuna 5', provincia: 'Ciudad Autónoma de Buenos Aires' },
      // ── Buenos Aires ──
      { nombre: 'General San Martín', provincia: 'Buenos Aires' },
      { nombre: 'La Matanza', provincia: 'Buenos Aires' },
      { nombre: 'Lomas de Zamora', provincia: 'Buenos Aires' },
      { nombre: 'Quilmes', provincia: 'Buenos Aires' },
      { nombre: 'Almirante Brown', provincia: 'Buenos Aires' },
      { nombre: 'Avellaneda', provincia: 'Buenos Aires' },
      { nombre: 'Morón', provincia: 'Buenos Aires' },
      { nombre: 'Tres de Febrero', provincia: 'Buenos Aires' },
      { nombre: 'San Isidro', provincia: 'Buenos Aires' },
      { nombre: 'Vicente López', provincia: 'Buenos Aires' },
      // ── Córdoba ──
      { nombre: 'Capital', provincia: 'Córdoba' },
      { nombre: 'Colón', provincia: 'Córdoba' },
      { nombre: 'San Justo', provincia: 'Córdoba' },
      // ── Santa Fe ──
      { nombre: 'La Capital', provincia: 'Santa Fe' },
      { nombre: 'Rosario', provincia: 'Santa Fe' },
      // ── Mendoza ──
      { nombre: 'Capital', provincia: 'Mendoza' },
      { nombre: 'Godoy Cruz', provincia: 'Mendoza' },
      // ── Tucumán ──
      { nombre: 'Capital', provincia: 'Tucumán' },
      { nombre: 'Cruz Alta', provincia: 'Tucumán' },
      // ── Salta ──
      { nombre: 'Capital', provincia: 'Salta' },
      // ── Entre Ríos ──
      { nombre: 'Paraná', provincia: 'Entre Ríos' },
      { nombre: 'Concordia', provincia: 'Entre Ríos' },
      // ── Chaco ──
      { nombre: 'Comandante Fernández', provincia: 'Chaco' },
      { nombre: 'San Fernando', provincia: 'Chaco' },
      { nombre: '1° de Mayo', provincia: 'Chaco' },
      // ── Formosa ──
      { nombre: 'Formosa', provincia: 'Formosa' },
      { nombre: 'Pilcomayo', provincia: 'Formosa' },
      // ── Jujuy ──
      { nombre: 'Capital', provincia: 'Jujuy' },
      { nombre: 'El Carmen', provincia: 'Jujuy' },
      // ── Catamarca ──
      { nombre: 'Capital', provincia: 'Catamarca' },
      { nombre: 'Valle Viejo', provincia: 'Catamarca' },
      // ── Chubut ──
      { nombre: 'Rawson', provincia: 'Chubut' },
      { nombre: 'Gaiman', provincia: 'Chubut' },
      // ── La Pampa ──
      { nombre: 'Capital', provincia: 'La Pampa' },
      // ── La Rioja ──
      { nombre: 'Capital', provincia: 'La Rioja' },
      // ── Neuquén ──
      { nombre: 'Confluencia', provincia: 'Neuquén' },
      // ── Río Negro ──
      { nombre: 'General Roca', provincia: 'Río Negro' },
      // ── San Juan ──
      { nombre: 'Capital', provincia: 'San Juan' },
      // ── San Luis ──
      { nombre: 'Capital', provincia: 'San Luis' },
      // ── Santa Cruz ──
      { nombre: 'Güer Aike', provincia: 'Santa Cruz' },
      // ── Santiago del Estero ──
      { nombre: 'Capital', provincia: 'Santiago del Estero' },
      // ── Tierra del Fuego ──
      { nombre: 'Ushuaia', provincia: 'Tierra del Fuego' },
    ]

    const departamentos: Record<string, number> = {}
    for (const depto of departamentosData) {
      const idProv = provincias[depto.provincia]
      if (!idProv) continue
      const d = await db.departamento.upsert({
        where: { id_provincia_nombre: { id_provincia: idProv, nombre: depto.nombre } },
        update: {},
        create: { id_provincia: idProv, nombre: depto.nombre },
      })
      departamentos[`${depto.provincia}-${depto.nombre}`] = d.id
    }
    results.push(`${Object.keys(departamentos).length} departamentos creados`)

    // ============================================
    // 4. MUNICIPIOS
    // ============================================
    const municipiosData: { nombre: string; deptoKey: string }[] = [
      // ── Misiones ──
      { nombre: 'Posadas', deptoKey: 'Misiones-Capital' },
      { nombre: 'Garupá', deptoKey: 'Misiones-Capital' },
      { nombre: 'Apóstoles', deptoKey: 'Misiones-Apóstoles' },
      { nombre: 'San José', deptoKey: 'Misiones-Apóstoles' },
      { nombre: 'Campo Grande', deptoKey: 'Misiones-Cainguás' },
      { nombre: 'Aristóbulo del Valle', deptoKey: 'Misiones-Cainguás' },
      { nombre: 'Candelaria', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Santa Ana', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Mártires', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Concepción de la Sierra', deptoKey: 'Misiones-Concepción' },
      { nombre: 'Santa María', deptoKey: 'Misiones-Concepción' },
      { nombre: 'Eldorado', deptoKey: 'Misiones-Eldorado' },
      { nombre: '9 de Julio', deptoKey: 'Misiones-Eldorado' },
      { nombre: 'Colonia Wanda', deptoKey: 'Misiones-Eldorado' },
      { nombre: 'Bernardo de Irigoyen', deptoKey: 'Misiones-General Manuel Belgrano' },
      { nombre: 'Comandante Andrés Guacurarí', deptoKey: 'Misiones-General Manuel Belgrano' },
      { nombre: 'El Soberbio', deptoKey: 'Misiones-Guaraní' },
      { nombre: 'Oberá', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Campo Viera', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Puerto Rico', deptoKey: 'Misiones-Guaraní' },
      { nombre: 'Puerto Iguazú', deptoKey: 'Misiones-Iguazú' },
      { nombre: 'Wanda', deptoKey: 'Misiones-Iguazú' },
      { nombre: 'Leandro N. Alem', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Caá Yarí', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Puerto Libertad', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Capioví', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Ruiz de Montoya', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Montecarlo', deptoKey: 'Misiones-Montecarlo' },
      { nombre: 'Caraguatay', deptoKey: 'Misiones-Montecarlo' },
      { nombre: 'San Ignacio', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Jardín América', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Hipólito Yrigoyen', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'San Javier', deptoKey: 'Misiones-San Javier' },
      { nombre: 'Itacaruaré', deptoKey: 'Misiones-San Javier' },
      { nombre: 'San Pedro', deptoKey: 'Misiones-San Pedro' },
      { nombre: 'General Urquiza', deptoKey: 'Misiones-San Pedro' },
      { nombre: 'Alba Posse', deptoKey: 'Misiones-Veinticinco de Mayo' },
      { nombre: 'Colonia Aurora', deptoKey: 'Misiones-Veinticinco de Mayo' },
      // ── Corrientes ──
      { nombre: 'Corrientes', deptoKey: 'Corrientes-Capital' },
      { nombre: 'Barrio Esperanza', deptoKey: 'Corrientes-Capital' },
      { nombre: 'Nuestra Señora del Rosario de Caa Catí', deptoKey: 'Corrientes-General Paz' },
      { nombre: 'San Cosme', deptoKey: 'Corrientes-San Cosme' },
      { nombre: 'Itatí', deptoKey: 'Corrientes-Itatí' },
      { nombre: 'Bella Vista', deptoKey: 'Corrientes-Bella Vista' },
      { nombre: 'Pedro Y. Cañete (Empedrado)', deptoKey: 'Corrientes-Empedrado' },
      { nombre: 'Goya', deptoKey: 'Corrientes-Goya' },
      { nombre: 'Esquina', deptoKey: 'Corrientes-Esquina' },
      { nombre: 'Mercedes', deptoKey: 'Corrientes-Mercedes' },
      { nombre: 'Paso de los Libres', deptoKey: 'Corrientes-Paso de los Libres' },
      { nombre: 'Monte Caseros', deptoKey: 'Corrientes-Monte Caseros' },
      { nombre: 'Curuzú Cuatiá', deptoKey: 'Corrientes-Curuzú Cuatiá' },
      { nombre: 'Santo Tomé', deptoKey: 'Corrientes-Santo Tomé' },
      // ── Ciudad Autónoma de Buenos Aires ──
      { nombre: 'Retiro', deptoKey: 'Ciudad Autónoma de Buenos Aires-Comuna 1' },
      { nombre: 'San Nicolás', deptoKey: 'Ciudad Autónoma de Buenos Aires-Comuna 1' },
      { nombre: 'Puerto Madero', deptoKey: 'Ciudad Autónoma de Buenos Aires-Comuna 1' },
      { nombre: 'Recoleta', deptoKey: 'Ciudad Autónoma de Buenos Aires-Comuna 2' },
      { nombre: 'Palermo', deptoKey: 'Ciudad Autónoma de Buenos Aires-Comuna 2' },
      { nombre: 'Balvanera', deptoKey: 'Ciudad Autónoma de Buenos Aires-Comuna 3' },
      // ── Buenos Aires ──
      { nombre: 'San Martín', deptoKey: 'Buenos Aires-General San Martín' },
      { nombre: 'Ramos Mejía', deptoKey: 'Buenos Aires-La Matanza' },
      { nombre: 'Banfield', deptoKey: 'Buenos Aires-Lomas de Zamora' },
      { nombre: 'Quilmes', deptoKey: 'Buenos Aires-Quilmes' },
      { nombre: 'Adrogué', deptoKey: 'Buenos Aires-Almirante Brown' },
      { nombre: 'Avellaneda', deptoKey: 'Buenos Aires-Avellaneda' },
      { nombre: 'Morón', deptoKey: 'Buenos Aires-Morón' },
      { nombre: 'Caseros', deptoKey: 'Buenos Aires-Tres de Febrero' },
      { nombre: 'San Isidro', deptoKey: 'Buenos Aires-San Isidro' },
      { nombre: 'Olivos', deptoKey: 'Buenos Aires-Vicente López' },
      // ── Córdoba ──
      { nombre: 'Córdoba', deptoKey: 'Córdoba-Capital' },
      // ── Santa Fe ──
      { nombre: 'Santa Fe', deptoKey: 'Santa Fe-La Capital' },
      { nombre: 'Rosario', deptoKey: 'Santa Fe-Rosario' },
      // ── Mendoza ──
      { nombre: 'Mendoza', deptoKey: 'Mendoza-Capital' },
      { nombre: 'Godoy Cruz', deptoKey: 'Mendoza-Godoy Cruz' },
      // ── Tucumán ──
      { nombre: 'San Miguel de Tucumán', deptoKey: 'Tucumán-Capital' },
      // ── Salta ──
      { nombre: 'Salta', deptoKey: 'Salta-Capital' },
      // ── Entre Ríos ──
      { nombre: 'Paraná', deptoKey: 'Entre Ríos-Paraná' },
      { nombre: 'Concordia', deptoKey: 'Entre Ríos-Concordia' },
      // ── Chaco ──
      { nombre: 'Presidencia Roque Sáenz Peña', deptoKey: 'Chaco-Comandante Fernández' },
      { nombre: 'Resistencia', deptoKey: 'Chaco-San Fernando' },
      { nombre: 'Barranqueras', deptoKey: 'Chaco-1° de Mayo' },
      // ── Formosa ──
      { nombre: 'Formosa', deptoKey: 'Formosa-Formosa' },
      { nombre: 'Clorinda', deptoKey: 'Formosa-Pilcomayo' },
      // ── Jujuy ──
      { nombre: 'San Salvador de Jujuy', deptoKey: 'Jujuy-Capital' },
      { nombre: 'El Carmen', deptoKey: 'Jujuy-El Carmen' },
      // ── Catamarca ──
      { nombre: 'San Fernando del Valle de Catamarca', deptoKey: 'Catamarca-Capital' },
      { nombre: 'San Isidro', deptoKey: 'Catamarca-Valle Viejo' },
      // ── Chubut ──
      { nombre: 'Rawson', deptoKey: 'Chubut-Rawson' },
      { nombre: 'Gaiman', deptoKey: 'Chubut-Gaiman' },
      // ── La Pampa ──
      { nombre: 'Santa Rosa', deptoKey: 'La Pampa-Capital' },
      // ── La Rioja ──
      { nombre: 'La Rioja', deptoKey: 'La Rioja-Capital' },
      // ── Neuquén ──
      { nombre: 'Neuquén', deptoKey: 'Neuquén-Confluencia' },
      { nombre: 'Plottier', deptoKey: 'Neuquén-Confluencia' },
      // ── Río Negro ──
      { nombre: 'General Roca', deptoKey: 'Río Negro-General Roca' },
      // ── San Juan ──
      { nombre: 'San Juan', deptoKey: 'San Juan-Capital' },
      // ── San Luis ──
      { nombre: 'San Luis', deptoKey: 'San Luis-Capital' },
      // ── Santa Cruz ──
      { nombre: 'Río Gallegos', deptoKey: 'Santa Cruz-Güer Aike' },
      // ── Santiago del Estero ──
      { nombre: 'Santiago del Estero', deptoKey: 'Santiago del Estero-Capital' },
      // ── Tierra del Fuego ──
      { nombre: 'Ushuaia', deptoKey: 'Tierra del Fuego-Ushuaia' },
    ]

    for (const muni of municipiosData) {
      const idDepto = departamentos[muni.deptoKey]
      if (!idDepto) continue
      await db.municipio.upsert({
        where: { id_departamento_nombre: { id_departamento: idDepto, nombre: muni.nombre } },
        update: {},
        create: { id_departamento: idDepto, nombre: muni.nombre },
      })
    }
    results.push(`${municipiosData.length} municipios creados`)

    // ============================================
    // 5. TIPOS DE DIRECCIÓN
    // ============================================
    for (const nombre of ['particular', 'comercial', 'entrega']) {
      await db.tipoDireccion.upsert({ where: { nombre }, update: {}, create: { nombre } })
    }
    results.push('Tipos de dirección creados')

    // ============================================
    // 6. TIPOS DE CONTACTO
    // ============================================
    for (const nombre of ['email', 'teléfono', 'WhatsApp']) {
      await db.tipoContacto.upsert({ where: { nombre }, update: {}, create: { nombre } })
    }
    results.push('Tipos de contacto creados')

    // ============================================
    // 7. EMPRESAS TELEFÓNICAS
    // ============================================
    const empresasTelefonicas = [
      { nombre: 'Personal', codigo: 'PER' },
      { nombre: 'Claro', codigo: 'CLA' },
      { nombre: 'Movistar', codigo: 'MOV' },
      { nombre: 'Tuenti', codigo: 'TUE' },
    ]
    for (const et of empresasTelefonicas) {
      await db.empresaTelefonica.upsert({ where: { nombre: et.nombre }, update: {}, create: et })
    }
    results.push(`${empresasTelefonicas.length} empresas telefónicas creadas`)

    // ============================================
    // 8. SERVICIOS DE CORREO ELECTRÓNICO
    // ============================================
    const serviciosCorreo = [
      { nombre: 'Gmail', dominio: 'gmail.com' },
      { nombre: 'Outlook/Hotmail', dominio: 'outlook.com' },
      { nombre: 'Yahoo', dominio: 'yahoo.com' },
      { nombre: 'ICloud', dominio: 'icloud.com' },
    ]
    for (const sc of serviciosCorreo) {
      await db.servicioCorreoElectronico.upsert({ where: { nombre: sc.nombre }, update: {}, create: sc })
    }
    results.push(`${serviciosCorreo.length} servicios de correo electrónico creados`)

    // ============================================
    // 9. TIPOS DE PLATAFORMA
    // ============================================
    const tiposPlataforma = [
      { nombre: 'Web', descripcion: 'Aplicación web' },
      { nombre: 'Android', descripcion: 'Aplicación móvil Android' },
      { nombre: 'iOS', descripcion: 'Aplicación móvil iOS' },
      { nombre: 'API', descripcion: 'Servicio API REST' },
    ]
    for (const tp of tiposPlataforma) {
      await db.tipoPlataforma.upsert({ where: { nombre: tp.nombre }, update: {}, create: tp })
    }
    results.push(`${tiposPlataforma.length} tipos de plataforma creados`)

    // ============================================
    // 10. TIPOS DE ENTIDAD
    // ============================================
    const tiposEntidad = [
      { nombre: 'física', descripcion: 'Persona física' },
      { nombre: 'jurídica', descripcion: 'Persona jurídica / Empresa' },
    ]
    for (const te of tiposEntidad) {
      await db.tipoEntidad.upsert({ where: { nombre: te.nombre }, update: {}, create: te })
    }
    results.push(`${tiposEntidad.length} tipos de entidad creados`)

    // ============================================
    // 11. ESTADOS DE SESIÓN
    // ============================================
    const estadosSesion = [
      { nombre: 'activa', descripcion: 'Sesión activa del usuario' },
      { nombre: 'expirada', descripcion: 'Sesión expirada por inactividad' },
      { nombre: 'cerrada', descripcion: 'Sesión cerrada por el usuario' },
      { nombre: 'revocada', descripcion: 'Sesión revocada por seguridad' },
    ]
    for (const es of estadosSesion) {
      await db.estadoSesion.upsert({ where: { nombre: es.nombre }, update: {}, create: es })
    }
    results.push(`${estadosSesion.length} estados de sesión creados`)

    // ============================================
    // 12. TIPOS DE PERSONA
    // ============================================
    for (const nombre of ['cliente', 'proveedor', 'empleado']) {
      await db.tipoPersona.upsert({ where: { nombre }, update: {}, create: { nombre } })
    }
    results.push('Tipos de persona creados')

    // ============================================
    // 13. CATEGORÍAS DE MATERIAS PRIMAS
    // ============================================
    const categoriasMP = [
      { nombre: 'Harinas', descripcion: 'Harinas de trigo, sémola y otros cereales' },
      { nombre: 'Huevos y derivados', descripcion: 'Huevos frescos, líquidos y derivados' },
      { nombre: 'Lácteos', descripcion: 'Quesos, cremas, manteca y leches' },
      { nombre: 'Aceites y grasas', descripcion: 'Aceites vegetales y grasas' },
      { nombre: 'Condimentos y especias', descripcion: 'Especias, sal, pimienta y hierbas' },
      { nombre: 'Carnes', descripcion: 'Carnes para rellenos (res, cerdo, pollo)' },
      { nombre: 'Verduras', descripcion: 'Verduras frescas para salsas y rellenos' },
      { nombre: 'Salsas y conservas', descripcion: 'Tomates, salsa de tomate, conservas' },
      { nombre: 'Aditivos y suplementos', descripcion: 'Colorantes, conservantes, mejoradores' },
    ]
    for (const cat of categoriasMP) {
      await db.categoriaMateriaPrima.upsert({ where: { nombre: cat.nombre }, update: {}, create: cat })
    }
    results.push(`${categoriasMP.length} categorías de materias primas creadas`)

    // ============================================
    // 14. TIPOS DE INSUMOS
    // ============================================
    const tiposInsumo = [
      { nombre: 'Envases primarios', descripcion: 'Bolsas, bandejas, film para contacto directo' },
      { nombre: 'Envases secundarios', descripcion: 'Cajas, cartones, etiquetas' },
      { nombre: 'Materiales de limpieza', descripcion: 'Productos de limpieza y sanitización' },
      { nombre: 'Combustibles', descripcion: 'Gas, leña, energía para producción' },
      { nombre: 'Utensilios descartables', descripcion: 'Guantes, cofias, delantales descartables' },
      { nombre: 'Insumos de oficina', descripcion: 'Papel, cartuchos, útiles' },
    ]
    for (const ti of tiposInsumo) {
      await db.tipoInsumo.upsert({ where: { nombre: ti.nombre }, update: {}, create: ti })
    }
    results.push(`${tiposInsumo.length} tipos de insumos creados`)

    // ============================================
    // 15. CATEGORÍAS DE PRODUCTOS TERMINADOS
    // ============================================
    const categoriasPT = [
      { nombre: 'Pastas frescas', descripcion: 'Pastas frescas rellenas y al huevo' },
      { nombre: 'Pastas secas', descripcion: 'Pastas secas tipo fideos' },
      { nombre: 'Salsas', descripcion: 'Salsas para acompañar pastas' },
      { nombre: 'Ñoquis', descripcion: 'Ñoquis de papa, espinaca, etc.' },
      { nombre: 'Lasagnas y canelones', descripcion: 'Platos armados listos para hornear' },
      { nombre: 'Postres', descripcion: 'Postres a base de pasta' },
    ]
    for (const cat of categoriasPT) {
      await db.categoriaProductoTerminado.upsert({ where: { nombre: cat.nombre }, update: {}, create: cat })
    }
    results.push(`${categoriasPT.length} categorías de productos terminados creados`)

    // ============================================
    // 16. MARCAS
    // ============================================
    const marcas = [
      { nombre: 'Pastas Orlando', descripcion: 'Marca propia' },
      { nombre: 'Molinos Río de la Plata', descripcion: 'Harinas y cereales' },
      { nombre: 'Arcor', descripcion: 'Alimentos generales' },
      { nombre: 'Mastellone', descripcion: 'Lácteos' },
      { nombre: 'La Serenísima', descripcion: 'Lácteos' },
      { nombre: 'Molto', descripcion: 'Harinas especiales' },
      { nombre: 'Blancaflor', descripcion: 'Harinas' },
      { nombre: 'Canale', descripcion: 'Alimentos' },
      { nombre: 'Fargo', descripcion: 'Alimentos' },
      { nombre: 'Sin marca', descripcion: 'Genérico / sin marca' },
    ]
    for (const marca of marcas) {
      await db.marca.upsert({ where: { nombre: marca.nombre }, update: {}, create: marca })
    }
    results.push(`${marcas.length} marcas creadas`)

    // ============================================
    // 17. UNIDADES DE MEDIDA
    // ============================================
    const unidadesMedida = [
      { codigo: 'kg', nombre: 'Kilogramo', conversion_a_base: 1.0, tipo_medida: 'peso' },
      { codigo: 'g', nombre: 'Gramo', conversion_a_base: 0.001, tipo_medida: 'peso' },
      { codigo: 'mg', nombre: 'Miligramo', conversion_a_base: 0.000001, tipo_medida: 'peso' },
      { codigo: 'l', nombre: 'Litro', conversion_a_base: 1.0, tipo_medida: 'volumen' },
      { codigo: 'ml', nombre: 'Mililitro', conversion_a_base: 0.001, tipo_medida: 'volumen' },
      { codigo: 'cc', nombre: 'Centímetro cúbico', conversion_a_base: 0.001, tipo_medida: 'volumen' },
      { codigo: 'm', nombre: 'Metro', conversion_a_base: 1.0, tipo_medida: 'longitud' },
      { codigo: 'cm', nombre: 'Centímetro', conversion_a_base: 0.01, tipo_medida: 'longitud' },
      { codigo: 'mm', nombre: 'Milímetro', conversion_a_base: 0.001, tipo_medida: 'longitud' },
      { codigo: 'u', nombre: 'Unidad', conversion_a_base: 1.0, tipo_medida: 'unidad' },
      { codigo: 'doc', nombre: 'Docena', conversion_a_base: 12.0, tipo_medida: 'unidad' },
      { codigo: 'rollo', nombre: 'Rollo', conversion_a_base: 1.0, tipo_medida: 'unidad' },
      { codigo: 'paq', nombre: 'Paquete', conversion_a_base: 1.0, tipo_medida: 'unidad' },
      { codigo: 'bolsa', nombre: 'Bolsa', conversion_a_base: 1.0, tipo_medida: 'unidad' },
      { codigo: 'caja', nombre: 'Caja', conversion_a_base: 1.0, tipo_medida: 'unidad' },
    ]
    for (const um of unidadesMedida) {
      await db.unidadMedida.upsert({ where: { codigo: um.codigo }, update: {}, create: um })
    }
    results.push(`${unidadesMedida.length} unidades de medida creadas`)

    // ============================================
    // 18. FORMAS DE PAGO
    // ============================================
    const formasPago = [
      { nombre_forma: 'Efectivo', requiere_identificacion: false, requiere_cuenta: false },
      { nombre_forma: 'Mercado Pago', requiere_identificacion: false, requiere_cuenta: true },
      { nombre_forma: 'Transferencia bancaria', requiere_identificacion: true, requiere_cuenta: true },
    ]
    for (const fp of formasPago) {
      await db.formaPago.upsert({ where: { nombre_forma: fp.nombre_forma }, update: {}, create: fp })
    }
    results.push(`${formasPago.length} formas de pago creadas`)

    // ============================================
    // 19. ESTADOS GENERALES
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
      await db.estadoGeneral.upsert({ where: { nombre_estado: estado.nombre_estado }, update: {}, create: estado })
    }
    results.push(`${estados.length} estados generales creados`)

    // ============================================
    // 20. PERSONA ADMIN
    // ============================================
    const personaAdmin = await db.persona.upsert({
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
    results.push(`Persona admin: ${personaAdmin.nombre} ${personaAdmin.apellido}`)

    // ============================================
    // 21. USUARIO ADMIN
    // ============================================
    const hashedPassword = await bcrypt.hash('Pastas2026!', 10)
    const usuarioAdmin = await db.usuario.upsert({
      where: { email: 'orlando.candia@gmail.com' },
      update: {
        password: hashedPassword,
        estado: true,
      },
      create: {
        id_persona: personaAdmin.id,
        email: 'orlando.candia@gmail.com',
        password: hashedPassword,
        estado: true,
      },
    })
    results.push(`Usuario admin: ${usuarioAdmin.email} (password updated)`)

    // Contacto email
    const tipoEmail = await db.tipoContacto.findUniqueOrThrow({ where: { nombre: 'email' } })
    const existingContact = await db.contacto.findFirst({ where: { id_persona: personaAdmin.id, id_tipo_contacto: tipoEmail.id } })
    if (!existingContact) {
      await db.contacto.create({
        data: {
          id_persona: personaAdmin.id,
          id_tipo_contacto: tipoEmail.id,
          valor: 'orlando.candia@gmail.com',
          es_principal: true,
          verificado: true,
        },
      })
    }
    results.push('Contacto email del admin')

    // ============================================
    // 22. ROLES
    // ============================================
    const rolesData = [
      { nombre: 'admin', descripcion: 'Administrador total del sistema', es_default: false },
      { nombre: 'produccion', descripcion: 'Acceso a producción y stock', es_default: false },
      { nombre: 'ventas', descripcion: 'Acceso a ventas y pedidos', es_default: false },
      { nombre: 'lectura', descripcion: 'Solo lectura de datos', es_default: true },
    ]
    for (const rol of rolesData) {
      await db.rol.upsert({ where: { nombre: rol.nombre }, update: {}, create: rol })
    }
    results.push('Roles creados')

    // Assign admin role
    const rolAdmin = await db.rol.findUniqueOrThrow({ where: { nombre: 'admin' } })
    await db.usuarioRol.upsert({
      where: { id_usuario_id_rol: { id_usuario: usuarioAdmin.id, id_rol: rolAdmin.id } },
      update: {},
      create: { id_usuario: usuarioAdmin.id, id_rol: rolAdmin.id },
    })
    results.push('Rol admin asignado')

    // ============================================
    // 23. PERMISOS
    // ============================================
    const modulos = [
      'productos', 'compras', 'ventas', 'produccion', 'usuarios',
      'auditoria', 'reportes', 'seguridad', 'logistica', 'presupuestos',
    ]
    const acciones = ['ver', 'crear', 'editar', 'eliminar']
    let permisosCount = 0

    for (const modulo of modulos) {
      for (const accion of acciones) {
        const nombre = `${modulo}.${accion}`
        await db.permiso.upsert({
          where: { nombre },
          update: {},
          create: { nombre, modulo, descripcion: `${accion} en ${modulo}` },
        })
        permisosCount++
      }
    }
    const extraPermisos = ['dashboard.ver', 'configuracion.ver', 'configuracion.editar', 'opiniones.ver', 'opiniones.editar']
    for (const nombre of extraPermisos) {
      const modulo = nombre.split('.')[0]
      await db.permiso.upsert({ where: { nombre }, update: {}, create: { nombre, modulo, descripcion: nombre } })
      permisosCount++
    }
    results.push(`${permisosCount} permisos creados`)

    // Assign all permissions to admin role
    const allPermisos = await db.permiso.findMany()
    for (const permiso of allPermisos) {
      await db.rolPermiso.upsert({
        where: { id_rol_id_permiso: { id_rol: rolAdmin.id, id_permiso: permiso.id } },
        update: {},
        create: { id_rol: rolAdmin.id, id_permiso: permiso.id },
      })
    }
    results.push(`${allPermisos.length} permisos asignados al rol admin`)

    // ============================================
    // 24. PRODUCTOS TERMINADOS
    // ============================================
    const catFrescas = await db.categoriaProductoTerminado.findUniqueOrThrow({ where: { nombre: 'Pastas frescas' } })
    const catSecas = await db.categoriaProductoTerminado.findUniqueOrThrow({ where: { nombre: 'Pastas secas' } })
    const catSalsas = await db.categoriaProductoTerminado.findUniqueOrThrow({ where: { nombre: 'Salsas' } })
    const catNoquis = await db.categoriaProductoTerminado.findUniqueOrThrow({ where: { nombre: 'Ñoquis' } })
    const catLasagnas = await db.categoriaProductoTerminado.findUniqueOrThrow({ where: { nombre: 'Lasagnas y canelones' } })

    const productosTerminados = [
      { codigo: 'PF-001', nombre: 'Sorrentinos de Jamón y Queso', id_categoria: catFrescas.id, peso_unitario_aprox: 0.5, precio_venta: 4500, stock_minimo: 10, destacado: true, orden: 1 },
      { codigo: 'PF-002', nombre: 'Ravioles de Ricota y Espinaca', id_categoria: catFrescas.id, peso_unitario_aprox: 0.5, precio_venta: 4000, stock_minimo: 10, destacado: true, orden: 2 },
      { codigo: 'PF-003', nombre: 'Ravioles de Carne', id_categoria: catFrescas.id, peso_unitario_aprox: 0.5, precio_venta: 4200, stock_minimo: 10, destacado: true, orden: 3 },
      { codigo: 'PF-004', nombre: 'Cappelletti de Pollo', id_categoria: catFrescas.id, peso_unitario_aprox: 0.5, precio_venta: 4600, stock_minimo: 10, destacado: false, orden: 4 },
      { codigo: 'PF-005', nombre: 'Tortellini de Queso', id_categoria: catFrescas.id, peso_unitario_aprox: 0.4, precio_venta: 4300, stock_minimo: 8, destacado: false, orden: 5 },
      { codigo: 'PF-006', nombre: 'Agnolottis de Verdura', id_categoria: catFrescas.id, peso_unitario_aprox: 0.5, precio_venta: 3900, stock_minimo: 8, destacado: false, orden: 6 },
      { codigo: 'PF-007', nombre: 'Fettuccine al Huevo', id_categoria: catFrescas.id, peso_unitario_aprox: 0.4, precio_venta: 3200, stock_minimo: 15, destacado: true, orden: 7 },
      { codigo: 'PF-008', nombre: 'Tagliatelle al Huevo', id_categoria: catFrescas.id, peso_unitario_aprox: 0.4, precio_venta: 3200, stock_minimo: 15, destacado: false, orden: 8 },
      { codigo: 'PF-009', nombre: 'Pappardelle', id_categoria: catFrescas.id, peso_unitario_aprox: 0.4, precio_venta: 3300, stock_minimo: 10, destacado: false, orden: 9 },
      { codigo: 'PF-010', nombre: 'Masa para Empanadas', id_categoria: catFrescas.id, peso_unitario_aprox: 0.5, precio_venta: 2800, stock_minimo: 20, destacado: false, orden: 10 },
      { codigo: 'PS-001', nombre: 'Fideos Spaghetti', id_categoria: catSecas.id, peso_unitario_aprox: 0.5, precio_venta: 2500, stock_minimo: 20, destacado: true, orden: 1 },
      { codigo: 'PS-002', nombre: 'Fideos Penne Rigate', id_categoria: catSecas.id, peso_unitario_aprox: 0.5, precio_venta: 2500, stock_minimo: 20, destacado: false, orden: 2 },
      { codigo: 'PS-003', nombre: 'Fideos Tirabuzón', id_categoria: catSecas.id, peso_unitario_aprox: 0.5, precio_venta: 2500, stock_minimo: 15, destacado: false, orden: 3 },
      { codigo: 'PS-004', nombre: 'Mostacholes', id_categoria: catSecas.id, peso_unitario_aprox: 0.5, precio_venta: 2500, stock_minimo: 15, destacado: false, orden: 4 },
      { codigo: 'PS-005', nombre: 'Cintas', id_categoria: catSecas.id, peso_unitario_aprox: 0.5, precio_venta: 2600, stock_minimo: 10, destacado: false, orden: 5 },
      { codigo: 'SA-001', nombre: 'Salsa Filetto', id_categoria: catSalsas.id, peso_unitario_aprox: 0.5, precio_venta: 3000, stock_minimo: 10, destacado: true, orden: 1 },
      { codigo: 'SA-002', nombre: 'Salsa Bolognesa', id_categoria: catSalsas.id, peso_unitario_aprox: 0.5, precio_venta: 3500, stock_minimo: 10, destacado: true, orden: 2 },
      { codigo: 'SA-003', nombre: 'Salsa Crema', id_categoria: catSalsas.id, peso_unitario_aprox: 0.5, precio_venta: 3200, stock_minimo: 8, destacado: false, orden: 3 },
      { codigo: 'SA-004', nombre: 'Salsa Pesto', id_categoria: catSalsas.id, peso_unitario_aprox: 0.3, precio_venta: 3800, stock_minimo: 8, destacado: false, orden: 4 },
      { codigo: 'NQ-001', nombre: 'Ñoquis de Papa', id_categoria: catNoquis.id, peso_unitario_aprox: 0.5, precio_venta: 3500, stock_minimo: 15, destacado: true, orden: 1 },
      { codigo: 'NQ-002', nombre: 'Ñoquis de Espinaca', id_categoria: catNoquis.id, peso_unitario_aprox: 0.5, precio_venta: 3700, stock_minimo: 10, destacado: false, orden: 2 },
      { codigo: 'NQ-003', nombre: 'Ñoquis de Calabaza', id_categoria: catNoquis.id, peso_unitario_aprox: 0.5, precio_venta: 3700, stock_minimo: 10, destacado: false, orden: 3 },
      { codigo: 'NQ-004', nombre: 'Ñoquis de Ricota', id_categoria: catNoquis.id, peso_unitario_aprox: 0.5, precio_venta: 3800, stock_minimo: 8, destacado: false, orden: 4 },
      { codigo: 'LC-001', nombre: 'Lasagna de Carne', id_categoria: catLasagnas.id, peso_unitario_aprox: 1.0, precio_venta: 8000, stock_minimo: 5, destacado: true, orden: 1 },
      { codigo: 'LC-002', nombre: 'Lasagna de Verdura', id_categoria: catLasagnas.id, peso_unitario_aprox: 1.0, precio_venta: 7500, stock_minimo: 5, destacado: false, orden: 2 },
      { codigo: 'LC-003', nombre: 'Canelones de Jamón y Queso', id_categoria: catLasagnas.id, peso_unitario_aprox: 0.8, precio_venta: 6500, stock_minimo: 5, destacado: true, orden: 3 },
      { codigo: 'LC-004', nombre: 'Canelones de Ricota', id_categoria: catLasagnas.id, peso_unitario_aprox: 0.8, precio_venta: 6000, stock_minimo: 5, destacado: false, orden: 4 },
    ]
    for (const pt of productosTerminados) {
      await db.productoTerminado.upsert({
        where: { codigo: pt.codigo },
        update: {},
        create: { ...pt, descripcion: null, visible_en_landing: true, imagen: null, estado: true, stock_actual: 0 },
      })
    }
    results.push(`${productosTerminados.length} productos terminados creados`)

    // ============================================
    // 25. MATERIAS PRIMAS
    // ============================================
    const catHarinas = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Harinas' } })
    const catHuevos = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Huevos y derivados' } })
    const catLacteos = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Lácteos' } })
    const catAceites = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Aceites y grasas' } })
    const catCond = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Condimentos y especias' } })
    const catCarnes = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Carnes' } })
    const catVerduras = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Verduras' } })
    const catSalsasCon = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Salsas y conservas' } })
    const catAditivos = await db.categoriaMateriaPrima.findUniqueOrThrow({ where: { nombre: 'Aditivos y suplementos' } })
    const umKg = await db.unidadMedida.findUniqueOrThrow({ where: { codigo: 'kg' } })
    const umL = await db.unidadMedida.findUniqueOrThrow({ where: { codigo: 'l' } })
    const umU = await db.unidadMedida.findUniqueOrThrow({ where: { codigo: 'u' } })

    const materiasPrimas = [
      { codigo: 'MP-001', nombre: 'Harina 000', id_categoria: catHarinas.id, id_unidad_base: umKg.id, stock_actual: 50, stock_minimo: 20, precio_compra_referencia: 1200 },
      { codigo: 'MP-002', nombre: 'Harina 0000', id_categoria: catHarinas.id, id_unidad_base: umKg.id, stock_actual: 30, stock_minimo: 15, precio_compra_referencia: 1400 },
      { codigo: 'MP-003', nombre: 'Sémola de trigo', id_categoria: catHarinas.id, id_unidad_base: umKg.id, stock_actual: 20, stock_minimo: 10, precio_compra_referencia: 1600 },
      { codigo: 'MP-004', nombre: 'Huevos frescos', id_categoria: catHuevos.id, id_unidad_base: umU.id, stock_actual: 120, stock_minimo: 60, precio_compra_referencia: 250 },
      { codigo: 'MP-005', nombre: 'Queso Ricota', id_categoria: catLacteos.id, id_unidad_base: umKg.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 5000 },
      { codigo: 'MP-006', nombre: 'Queso Mozzarella', id_categoria: catLacteos.id, id_unidad_base: umKg.id, stock_actual: 8, stock_minimo: 4, precio_compra_referencia: 6000 },
      { codigo: 'MP-007', nombre: 'Queso Parmesano', id_categoria: catLacteos.id, id_unidad_base: umKg.id, stock_actual: 5, stock_minimo: 2, precio_compra_referencia: 12000 },
      { codigo: 'MP-008', nombre: 'Manteca', id_categoria: catLacteos.id, id_unidad_base: umKg.id, stock_actual: 5, stock_minimo: 3, precio_compra_referencia: 8000 },
      { codigo: 'MP-009', nombre: 'Crema de leche', id_categoria: catLacteos.id, id_unidad_base: umL.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 3000 },
      { codigo: 'MP-010', nombre: 'Aceite de girasol', id_categoria: catAceites.id, id_unidad_base: umL.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 2500 },
      { codigo: 'MP-011', nombre: 'Aceite de oliva', id_categoria: catAceites.id, id_unidad_base: umL.id, stock_actual: 3, stock_minimo: 2, precio_compra_referencia: 8000 },
      { codigo: 'MP-012', nombre: 'Sal fina', id_categoria: catCond.id, id_unidad_base: umKg.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 800 },
      { codigo: 'MP-013', nombre: 'Pimienta negra', id_categoria: catCond.id, id_unidad_base: umKg.id, stock_actual: 1, stock_minimo: 0.5, precio_compra_referencia: 15000 },
      { codigo: 'MP-014', nombre: 'Nuez moscada', id_categoria: catCond.id, id_unidad_base: umKg.id, stock_actual: 0.5, stock_minimo: 0.2, precio_compra_referencia: 25000 },
      { codigo: 'MP-015', nombre: 'Carne picada de res', id_categoria: catCarnes.id, id_unidad_base: umKg.id, stock_actual: 15, stock_minimo: 8, precio_compra_referencia: 7000 },
      { codigo: 'MP-016', nombre: 'Jamón cocido', id_categoria: catCarnes.id, id_unidad_base: umKg.id, stock_actual: 8, stock_minimo: 4, precio_compra_referencia: 8000 },
      { codigo: 'MP-017', nombre: 'Pollo desmenuzado', id_categoria: catCarnes.id, id_unidad_base: umKg.id, stock_actual: 5, stock_minimo: 3, precio_compra_referencia: 6500 },
      { codigo: 'MP-018', nombre: 'Espinaca fresca', id_categoria: catVerduras.id, id_unidad_base: umKg.id, stock_actual: 5, stock_minimo: 3, precio_compra_referencia: 3500 },
      { codigo: 'MP-019', nombre: 'Cebolla', id_categoria: catVerduras.id, id_unidad_base: umKg.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 1500 },
      { codigo: 'MP-020', nombre: 'Ajo', id_categoria: catVerduras.id, id_unidad_base: umKg.id, stock_actual: 2, stock_minimo: 1, precio_compra_referencia: 5000 },
      { codigo: 'MP-021', nombre: 'Calabaza', id_categoria: catVerduras.id, id_unidad_base: umKg.id, stock_actual: 8, stock_minimo: 4, precio_compra_referencia: 2000 },
      { codigo: 'MP-022', nombre: 'Papa', id_categoria: catVerduras.id, id_unidad_base: umKg.id, stock_actual: 20, stock_minimo: 10, precio_compra_referencia: 1200 },
      { codigo: 'MP-023', nombre: 'Tomate perita en lata', id_categoria: catSalsasCon.id, id_unidad_base: umKg.id, stock_actual: 15, stock_minimo: 8, precio_compra_referencia: 2500 },
      { codigo: 'MP-024', nombre: 'Puré de tomate', id_categoria: catSalsasCon.id, id_unidad_base: umKg.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 2000 },
      { codigo: 'MP-025', nombre: 'Albahaca fresca', id_categoria: catVerduras.id, id_unidad_base: umKg.id, stock_actual: 1, stock_minimo: 0.5, precio_compra_referencia: 8000 },
      { codigo: 'MP-026', nombre: 'Colorante alimentario', id_categoria: catAditivos.id, id_unidad_base: umKg.id, stock_actual: 0.5, stock_minimo: 0.2, precio_compra_referencia: 12000 },
      { codigo: 'MP-027', nombre: 'Agua', id_categoria: catAditivos.id, id_unidad_base: umL.id, stock_actual: 100, stock_minimo: 50, precio_compra_referencia: 100 },
    ]
    for (const mp of materiasPrimas) {
      await db.materiaPrima.upsert({
        where: { codigo: mp.codigo },
        update: {},
        create: { ...mp, descripcion: null, imagen: null, estado: true },
      })
    }
    results.push(`${materiasPrimas.length} materias primas creadas`)

    // ============================================
    // 26. INSUMOS
    // ============================================
    const tiEnvPrim = await db.tipoInsumo.findUniqueOrThrow({ where: { nombre: 'Envases primarios' } })
    const tiEnvSec = await db.tipoInsumo.findUniqueOrThrow({ where: { nombre: 'Envases secundarios' } })
    const tiLimpieza = await db.tipoInsumo.findUniqueOrThrow({ where: { nombre: 'Materiales de limpieza' } })
    const tiCombust = await db.tipoInsumo.findUniqueOrThrow({ where: { nombre: 'Combustibles' } })
    const tiDescart = await db.tipoInsumo.findUniqueOrThrow({ where: { nombre: 'Utensilios descartables' } })
    const umPaq = await db.unidadMedida.findUniqueOrThrow({ where: { codigo: 'paq' } })
    const umRollo = await db.unidadMedida.findUniqueOrThrow({ where: { codigo: 'rollo' } })

    const insumos = [
      { codigo: 'IN-001', nombre: 'Bolsa de polietileno 500g', id_tipo_insumo: tiEnvPrim.id, id_unidad_base: umPaq.id, stock_actual: 200, stock_minimo: 100, precio_compra_referencia: 150 },
      { codigo: 'IN-002', nombre: 'Bandeja de poliestireno', id_tipo_insumo: tiEnvPrim.id, id_unidad_base: umU.id, stock_actual: 150, stock_minimo: 80, precio_compra_referencia: 200 },
      { codigo: 'IN-003', nombre: 'Film plástico', id_tipo_insumo: tiEnvPrim.id, id_unidad_base: umRollo.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 3500 },
      { codigo: 'IN-004', nombre: 'Caja de cartón para pastas', id_tipo_insumo: tiEnvSec.id, id_unidad_base: umU.id, stock_actual: 100, stock_minimo: 50, precio_compra_referencia: 500 },
      { codigo: 'IN-005', nombre: 'Etiqueta adhesiva', id_tipo_insumo: tiEnvSec.id, id_unidad_base: umU.id, stock_actual: 500, stock_minimo: 200, precio_compra_referencia: 50 },
      { codigo: 'IN-006', nombre: 'Lavandina', id_tipo_insumo: tiLimpieza.id, id_unidad_base: umL.id, stock_actual: 10, stock_minimo: 5, precio_compra_referencia: 800 },
      { codigo: 'IN-007', nombre: 'Detergente', id_tipo_insumo: tiLimpieza.id, id_unidad_base: umL.id, stock_actual: 5, stock_minimo: 3, precio_compra_referencia: 1500 },
      { codigo: 'IN-008', nombre: 'Desengrasante', id_tipo_insumo: tiLimpieza.id, id_unidad_base: umL.id, stock_actual: 3, stock_minimo: 2, precio_compra_referencia: 2500 },
      { codigo: 'IN-009', nombre: 'Gas envaso', id_tipo_insumo: tiCombust.id, id_unidad_base: umKg.id, stock_actual: 30, stock_minimo: 15, precio_compra_referencia: 3000 },
      { codigo: 'IN-010', nombre: 'Guantes de latex', id_tipo_insumo: tiDescart.id, id_unidad_base: umPaq.id, stock_actual: 20, stock_minimo: 10, precio_compra_referencia: 2500 },
      { codigo: 'IN-011', nombre: 'Cofias descartables', id_tipo_insumo: tiDescart.id, id_unidad_base: umPaq.id, stock_actual: 15, stock_minimo: 8, precio_compra_referencia: 1800 },
      { codigo: 'IN-012', nombre: 'Delantal descartable', id_tipo_insumo: tiDescart.id, id_unidad_base: umU.id, stock_actual: 50, stock_minimo: 25, precio_compra_referencia: 300 },
    ]
    for (const ins of insumos) {
      await db.insumo.upsert({
        where: { codigo: ins.codigo },
        update: {},
        create: { ...ins, descripcion: null, imagen: null, estado: true },
      })
    }
    results.push(`${insumos.length} insumos creados`)

    // ============================================
    // 27. PRODUCTOS LANDING
    // ============================================
    const productosLanding = [
      { nombre: 'Sorrentinos de Jamón y Queso', descripcion: 'Clásicos sorrentinos rellenos de jamón cocido y queso mozzarella, hechos con masa al huevo.', categoria: 'Pastas rellenas', precio: 4500, peso: '500g', destacado: true, orden: 1 },
      { nombre: 'Ravioles de Ricota y Espinaca', descripcion: 'Ravioles suaves con relleno de ricota fresca y espinaca, ideal con salsa filetto.', categoria: 'Pastas rellenas', precio: 4000, peso: '500g', destacado: true, orden: 2 },
      { nombre: 'Ravioles de Carne', descripcion: 'Ravioles con relleno de carne especiada, tradición familiar en cada bocado.', categoria: 'Pastas rellenas', precio: 4200, peso: '500g', destacado: true, orden: 3 },
      { nombre: 'Ñoquis de Papa', descripcion: 'Ñoquis suaves y esponjosos, hechos con papas naturales. ¡Tradición del 29!', categoria: 'Ñoquis', precio: 3500, peso: '500g', destacado: true, orden: 4 },
      { nombre: 'Fettuccine al Huevo', descripcion: 'Fettuccine de masa al huevo, ideales para salsas cremosas.', categoria: 'Pastas largas', precio: 3200, peso: '400g', destacado: true, orden: 5 },
      { nombre: 'Spaghetti', descripcion: 'Spaghetti secos de sémola de trigo, cocción perfecta al dente.', categoria: 'Pastas secas', precio: 2500, peso: '500g', destacado: false, orden: 6 },
      { nombre: 'Salsa Filetto', descripcion: 'Salsa de tomates frescos con albahaca, el clásico acompañamiento.', categoria: 'Salsas', precio: 3000, peso: '500g', destacado: true, orden: 7 },
      { nombre: 'Salsa Bolognesa', descripcion: 'Salsa con carne picada, tomate y vegetales, receta casera.', categoria: 'Salsas', precio: 3500, peso: '500g', destacado: false, orden: 8 },
      { nombre: 'Lasagna de Carne', descripcion: 'Lasagna armada con capas de pasta, carne, salsa bechamel y queso.', categoria: 'Platos armados', precio: 8000, peso: '1kg', destacado: true, orden: 9 },
      { nombre: 'Canelones de Jamón y Queso', descripcion: 'Canelones rellenos de jamón y queso, gratinados con salsa blanca.', categoria: 'Platos armados', precio: 6500, peso: '800g', destacado: false, orden: 10 },
    ]
    for (const prod of productosLanding) {
      await db.producto.upsert({
        where: { id: prod.orden },
        update: {},
        create: { ...prod, imagen: null, stock: true },
      })
    }
    results.push(`${productosLanding.length} productos landing creados`)

    // ============================================
    // 28. PUNTOS DE ENCUENTRO
    // ============================================
    const puntosEncuentro = [
      { nombre: 'Centro - Corrientes', direccion: 'Av. 9 de Julio 1200, Corrientes', latitud: -27.4756, longitud: -58.8314, horarios: '{"lunes_viernes": "8:00-18:00", "sabados": "8:00-13:00"}' },
      { nombre: 'Barrio Esperanza', direccion: 'Av. Sargento Cabral 500, Corrientes', latitud: -27.4600, longitud: -58.8100, horarios: '{"lunes_viernes": "9:00-17:00", "sabados": "9:00-12:00"}' },
      { nombre: 'Plaza Italia', direccion: 'Plaza Italia, Corrientes', latitud: -27.4690, longitud: -58.8350, horarios: '{"sabados": "8:00-12:00"}' },
    ]
    for (let i = 0; i < puntosEncuentro.length; i++) {
      const pe = puntosEncuentro[i]
      await db.puntoEncuentro.upsert({
        where: { id: i + 1 },
        update: {},
        create: { ...pe, activo: true },
      })
    }
    results.push(`${puntosEncuentro.length} puntos de encuentro creados`)

    return NextResponse.json({
      success: true,
      version: 'v3-turso-fix',
      message: 'Seed COMPLETO exitoso - Todas las tablas pobladas',
      backend: 'prisma',
      results,
      credentials: {
        email: 'orlando.candia@gmail.com',
        password: 'Pastas2026!',
        login_url: '/admin/login',
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar seed', details: String(error), version: 'v3-turso-fix' },
      { status: 500 }
    )
  }
}

// GET /api/seed - Verify database tables have data
export async function GET() {
  try {
    const tables = [
      'Pais', 'Provincia', 'Departamento', 'Municipio', 'TipoDireccion',
      'TipoContacto', 'TipoPersona', 'EmpresaTelefonica', 'ServicioCorreoElectronico',
      'TipoPlataforma', 'TipoEntidad', 'EstadoSesion', 'CategoriaMateriaPrima',
      'TipoInsumo', 'CategoriaProductoTerminado', 'Marca', 'UnidadMedida',
      'FormaPago', 'EstadoGeneral', 'Rol', 'Permiso', 'Usuario', 'Persona',
      'ProductoTerminado', 'MateriaPrima', 'Insumo', 'Producto', 'PuntoEncuentro',
    ]

    // Use @libsql/client directly when on Turso
    if (isTurso()) {
      const client = getTursoClient()
      const results: Record<string, number> = {}
      let emptyTables = 0

      for (const table of tables) {
        try {
          const res = await client.execute(`SELECT COUNT(*) as c FROM ${table}`)
          results[table] = Number(res.rows[0]?.c || 0)
          if (results[table] === 0) emptyTables++
        } catch {
          results[table] = -1
          emptyTables++
        }
      }

      return NextResponse.json({
        version: 'v3-turso-fix',
        backend: 'libsql',
        totalTables: tables.length,
        populatedTables: tables.length - emptyTables,
        emptyTables,
        results,
        status: emptyTables === 0 ? 'ALL_OK' : 'NEEDS_SEED',
        seedCommand: 'POST /api/seed?secret=pastas-orlando-seed-2026',
      })
    }

    // Local SQLite path (Prisma-based)
    const { db } = await import('@/lib/db')
    const prismaTables = [
      { name: 'pais', model: 'pais' },
      { name: 'provincia', model: 'provincia' },
      { name: 'departamento', model: 'departamento' },
      { name: 'municipio', model: 'municipio' },
      { name: 'tipoDireccion', model: 'tipoDireccion' },
      { name: 'tipoContacto', model: 'tipoContacto' },
      { name: 'tipoPersona', model: 'tipoPersona' },
      { name: 'empresaTelefonica', model: 'empresaTelefonica' },
      { name: 'servicioCorreoElectronico', model: 'servicioCorreoElectronico' },
      { name: 'tipoPlataforma', model: 'tipoPlataforma' },
      { name: 'tipoEntidad', model: 'tipoEntidad' },
      { name: 'estadoSesion', model: 'estadoSesion' },
      { name: 'categoriaMateriaPrima', model: 'categoriaMateriaPrima' },
      { name: 'tipoInsumo', model: 'tipoInsumo' },
      { name: 'categoriaProductoTerminado', model: 'categoriaProductoTerminado' },
      { name: 'marca', model: 'marca' },
      { name: 'unidadMedida', model: 'unidadMedida' },
      { name: 'formaPago', model: 'formaPago' },
      { name: 'estadoGeneral', model: 'estadoGeneral' },
      { name: 'rol', model: 'rol' },
      { name: 'permiso', model: 'permiso' },
      { name: 'usuario', model: 'usuario' },
      { name: 'persona', model: 'persona' },
      { name: 'productoTerminado', model: 'productoTerminado' },
      { name: 'materiaPrima', model: 'materiaPrima' },
      { name: 'insumo', model: 'insumo' },
      { name: 'producto', model: 'producto' },
      { name: 'puntoEncuentro', model: 'puntoEncuentro' },
    ]

    const results: Record<string, number> = {}
    let emptyTables = 0

    for (const table of prismaTables) {
      try {
        const count = await (db as any)[table.model].count()
        results[table.name] = count
        if (count === 0) emptyTables++
      } catch (e: any) {
        results[table.name] = -1
        emptyTables++
      }
    }

    return NextResponse.json({
      version: 'v3-turso-fix',
      backend: 'prisma',
      totalTables: prismaTables.length,
      populatedTables: prismaTables.length - emptyTables,
      emptyTables,
      results,
      status: emptyTables === 0 ? 'ALL_OK' : 'NEEDS_SEED',
      seedCommand: 'POST /api/seed?secret=pastas-orlando-seed-2026',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al verificar', details: String(error), version: 'v3-turso-fix' },
      { status: 500 }
    )
  }
}
