import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

// POST /api/seed-turso - Seed Turso database directly via libsql client (bypasses Prisma)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (secret !== 'pastas-orlando-seed-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const databaseUrl = process.env.DATABASE_URL || ''
    const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''

    if (!databaseUrl.startsWith('libsql://') && !databaseUrl.startsWith('http')) {
      return NextResponse.json({ 
        error: 'This endpoint only works with Turso/libSQL URLs. Use /api/seed for SQLite.' 
      }, { status: 400 })
    }

    const client = createClient({ url: databaseUrl, authToken: authToken || undefined })
    const results: string[] = []

    // 1. PAÍS
    await client.execute("INSERT OR IGNORE INTO Pais (nombre) VALUES ('Argentina')")
    const paisId = Number((await client.execute("SELECT id FROM Pais WHERE nombre = 'Argentina'")).rows[0]?.id)
    results.push('País: Argentina')

    // 2. PROVINCIAS
    const provincias = ['Buenos Aires','Catamarca','Chaco','Chubut','Ciudad Autónoma de Buenos Aires','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán']
    const provIds: Record<string,number> = {}
    for (const n of provincias) {
      await client.execute({sql:'INSERT OR IGNORE INTO Provincia (id_pais,nombre) VALUES (?,?)',args:[paisId,n]})
      provIds[n] = Number((await client.execute({sql:"SELECT id FROM Provincia WHERE nombre=? AND id_pais=?",args:[n,paisId]})).rows[0]?.id)
    }
    results.push(`${provincias.length} provincias`)

    // 3. DEPARTAMENTOS
    const deptos: {n:string;p:string}[] = [{n:'Capital',p:'Corrientes'},{n:'General Paz',p:'Corrientes'},{n:'San Cosme',p:'Corrientes'},{n:'Empedrado',p:'Corrientes'},{n:'Comuna 1',p:'Ciudad Autónoma de Buenos Aires'},{n:'Comuna 2',p:'Ciudad Autónoma de Buenos Aires'},{n:'General San Martín',p:'Buenos Aires'},{n:'La Matanza',p:'Buenos Aires'},{n:'Capital',p:'Córdoba'},{n:'La Capital',p:'Santa Fe'},{n:'Rosario',p:'Santa Fe'},{n:'Capital',p:'Mendoza'},{n:'Capital',p:'Tucumán'},{n:'Capital',p:'Salta'},{n:'Paraná',p:'Entre Ríos'}]
    const depIds: Record<string,number> = {}
    for (const d of deptos) {
      const idP = provIds[d.p]; if(!idP) continue
      await client.execute({sql:'INSERT OR IGNORE INTO Departamento (id_provincia,nombre) VALUES (?,?)',args:[idP,d.n]})
      depIds[`${d.p}-${d.n}`] = Number((await client.execute({sql:"SELECT id FROM Departamento WHERE nombre=? AND id_provincia=?",args:[d.n,idP]})).rows[0]?.id)
    }
    results.push(`${Object.keys(depIds).length} departamentos`)

    // 4. MUNICIPIOS
    const munis: {n:string;dk:string}[] = [{n:'Corrientes',dk:'Corrientes-Capital'},{n:'San Cosme',dk:'Corrientes-San Cosme'},{n:'Recoleta',dk:'Ciudad Autónoma de Buenos Aires-Comuna 2'},{n:'Palermo',dk:'Ciudad Autónoma de Buenos Aires-Comuna 2'},{n:'San Martín',dk:'Buenos Aires-General San Martín'},{n:'Ramos Mejía',dk:'Buenos Aires-La Matanza'},{n:'Córdoba',dk:'Córdoba-Capital'},{n:'Santa Fe',dk:'Santa Fe-La Capital'},{n:'Rosario',dk:'Santa Fe-Rosario'},{n:'Mendoza',dk:'Mendoza-Capital'},{n:'San Miguel de Tucumán',dk:'Tucumán-Capital'},{n:'Salta',dk:'Salta-Capital'},{n:'Paraná',dk:'Entre Ríos-Paraná'}]
    for (const m of munis) { const idD=depIds[m.dk]; if(!idD) continue; await client.execute({sql:'INSERT OR IGNORE INTO Municipio (id_departamento,nombre) VALUES (?,?)',args:[idD,m.n]}) }
    results.push(`${munis.length} municipios`)

    // 5. REF TABLES
    for (const v of ['particular','comercial','entrega']) await client.execute({sql:'INSERT OR IGNORE INTO TipoDireccion (nombre) VALUES (?)',args:[v]})
    for (const v of ['email','teléfono','WhatsApp']) await client.execute({sql:'INSERT OR IGNORE INTO TipoContacto (nombre) VALUES (?)',args:[v]})
    results.push('Tipos de dirección y contacto')

    // 6-10. MORE REF TABLES
    for (const e of [{n:'Personal',c:'PER'},{n:'Claro',c:'CLA'},{n:'Movistar',c:'MOV'},{n:'Tuenti',c:'TUE'}]) await client.execute({sql:'INSERT OR IGNORE INTO EmpresaTelefonica (nombre,codigo) VALUES (?,?)',args:[e.n,e.c]})
    for (const s of [{n:'Gmail',d:'gmail.com'},{n:'Outlook/Hotmail',d:'outlook.com'},{n:'Yahoo',d:'yahoo.com'}]) await client.execute({sql:'INSERT OR IGNORE INTO ServicioCorreoElectronico (nombre,dominio) VALUES (?,?)',args:[s.n,s.d]})
    for (const t of [{n:'Web',d:'Aplicación web'},{n:'Android',d:'App Android'},{n:'iOS',d:'App iOS'},{n:'API',d:'Servicio API REST'}]) await client.execute({sql:'INSERT OR IGNORE INTO TipoPlataforma (nombre,descripcion) VALUES (?,?)',args:[t.n,t.d]})
    for (const t of [{n:'física',d:'Persona física'},{n:'jurídica',d:'Persona jurídica'}]) await client.execute({sql:'INSERT OR IGNORE INTO TipoEntidad (nombre,descripcion) VALUES (?,?)',args:[t.n,t.d]})
    for (const e of [{n:'activa',d:'Sesión activa'},{n:'expirada',d:'Sesión expirada'},{n:'cerrada',d:'Sesión cerrada'},{n:'revocada',d:'Sesión revocada'}]) await client.execute({sql:'INSERT OR IGNORE INTO EstadoSesion (nombre,descripcion) VALUES (?,?)',args:[e.n,e.d]})
    results.push('Tablas de referencia adicionales')

    // 11. TIPOS DE PERSONA
    for (const n of ['cliente','proveedor','empleado']) await client.execute({sql:'INSERT OR IGNORE INTO TipoPersona (nombre) VALUES (?)',args:[n]})
    results.push('Tipos de persona')

    // 12-14. CATEGORÍAS
    for (const c of [{n:'Harinas',d:'Harinas de trigo, sémola'},{n:'Huevos y derivados',d:'Huevos frescos y derivados'},{n:'Lácteos',d:'Quesos, cremas, manteca'},{n:'Aceites y grasas',d:'Aceites y grasas'},{n:'Condimentos y especias',d:'Especias, sal, pimienta'},{n:'Carnes',d:'Carnes para rellenos'},{n:'Verduras',d:'Verduras frescas'},{n:'Salsas y conservas',d:'Tomates, salsas, conservas'},{n:'Aditivos y suplementos',d:'Colorantes, conservantes'}]) await client.execute({sql:'INSERT OR IGNORE INTO CategoriaMateriaPrima (nombre,descripcion) VALUES (?,?)',args:[c.n,c.d]})
    for (const t of [{n:'Envases primarios',d:'Bolsas, bandejas, film'},{n:'Envases secundarios',d:'Cajas, cartones, etiquetas'},{n:'Materiales de limpieza',d:'Limpieza y sanitización'},{n:'Combustibles',d:'Gas, leña, energía'},{n:'Utensilios descartables',d:'Guantes, cofias, delantales'},{n:'Insumos de oficina',d:'Papel, cartuchos, útiles'}]) await client.execute({sql:'INSERT OR IGNORE INTO TipoInsumo (nombre,descripcion) VALUES (?,?)',args:[t.n,t.d]})
    for (const c of [{n:'Pastas frescas',d:'Pastas frescas rellenas y al huevo'},{n:'Pastas secas',d:'Pastas secas tipo fideos'},{n:'Salsas',d:'Salsas para acompañar pastas'},{n:'Ñoquis',d:'Ñoquis de papa, espinaca'},{n:'Lasagnas y canelones',d:'Platos armados para hornear'},{n:'Postres',d:'Postres a base de pasta'},{n:'Sorrentinos',d:'Sorrentinos rellenos artesanales'},{n:'Tallarines',d:'Tallarines al huevo y más'},{n:'Cintas Anchas',d:'Cintas anchas al huevo y más'},{n:'Ravioles',d:'Ravioles rellenos'},{n:'Tapas',d:'Tapas para empanadas y más'},{n:'Empanadas',d:'Empanadas crudas y al horno'},{n:'Tartas',d:'Tartas saladas'}]) await client.execute({sql:'INSERT OR IGNORE INTO CategoriaProductoTerminado (nombre,descripcion) VALUES (?,?)',args:[c.n,c.d]})
    // Migración: renombrar "Cinta Ancha" / "Cinta ancha" → "Cintas Anchas" si existe
    await client.execute("UPDATE CategoriaProductoTerminado SET nombre = 'Cintas Anchas' WHERE nombre IN ('Cinta Ancha', 'Cinta ancha', 'cinta ancha')")
    results.push('Categorías PT (+ migración Cintas Anchas)')

    // 15. MARCAS
    for (const m of ['Pastas Orlando','Molinos Río de la Plata','Arcor','La Serenísima','Molto','Blancaflor','Sin marca']) await client.execute({sql:'INSERT OR IGNORE INTO Marca (nombre) VALUES (?)',args:[m]})
    results.push('Marcas')

    // 16. UNIDADES DE MEDIDA
    for (const u of [{c:'kg',n:'Kilogramo',cb:1,tm:'peso'},{c:'g',n:'Gramo',cb:0.001,tm:'peso'},{c:'l',n:'Litro',cb:1,tm:'volumen'},{c:'ml',n:'Mililitro',cb:0.001,tm:'volumen'},{c:'u',n:'Unidad',cb:1,tm:'unidad'},{c:'doc',n:'Docena',cb:12,tm:'unidad'},{c:'paq',n:'Paquete',cb:1,tm:'unidad'},{c:'rollo',n:'Rollo',cb:1,tm:'unidad'},{c:'bolsa',n:'Bolsa',cb:1,tm:'unidad'},{c:'caja',n:'Caja',cb:1,tm:'unidad'}]) await client.execute({sql:'INSERT OR IGNORE INTO UnidadMedida (codigo,nombre,conversion_a_base,tipo_medida) VALUES (?,?,?,?)',args:[u.c,u.n,u.cb,u.tm]})
    results.push('Unidades de medida')

    // 17-18. FORMAS DE PAGO + ESTADOS
    for (const f of [{n:'Efectivo',ri:0,rc:0},{n:'Mercado Pago',ri:0,rc:1},{n:'Transferencia bancaria',ri:1,rc:1}]) await client.execute({sql:'INSERT OR IGNORE INTO FormaPago (nombre_forma,requiere_identificacion,requiere_cuenta) VALUES (?,?,?)',args:[f.n,f.ri,f.rc]})
    for (const e of [{n:'pendiente',ea:'general',ef:0},{n:'en_proceso',ea:'general',ef:0},{n:'completado',ea:'general',ef:1},{n:'cancelado',ea:'general',ef:1},{n:'entregado',ea:'pedidos',ef:1},{n:'en_camino',ea:'entregas',ef:0},{n:'pagado',ea:'ventas',ef:1},{n:'activo',ea:'produccion',ef:0},{n:'aprobado',ea:'presupuestos',ef:0},{n:'rechazado',ea:'presupuestos',ef:1},{n:'expirado',ea:'presupuestos',ef:1}]) await client.execute({sql:'INSERT OR IGNORE INTO EstadoGeneral (nombre_estado,entidad_aplicable,es_final) VALUES (?,?,?)',args:[e.n,e.ea,e.ef]})
    results.push('Formas de pago + Estados')

    // 19-20. PERSONA + USUARIO ADMIN
    await client.execute({sql:"INSERT OR IGNORE INTO Persona (nombre,apellido,numero_documento,tipo_persona,observaciones) VALUES ('Orlando','Candia','00000000','empleado','Administrador del sistema')"})
    const personaId = Number((await client.execute("SELECT id FROM Persona WHERE numero_documento='00000000'")).rows[0]?.id)
    const hashedPassword = await bcrypt.hash('Pastas2026!', 10)
    // INSERT OR IGNORE won't update password if user already exists, so we also UPDATE
    await client.execute({sql:'INSERT OR IGNORE INTO Usuario (id_persona,email,password,estado) VALUES (?,?,?,?)',args:[personaId,'orlando.candia@gmail.com',hashedPassword,1]})
    await client.execute({sql:'UPDATE Usuario SET password = ?, estado = 1 WHERE email = ?',args:[hashedPassword,'orlando.candia@gmail.com']})
    const usuarioId = Number((await client.execute("SELECT id FROM Usuario WHERE email='orlando.candia@gmail.com'")).rows[0]?.id)
    results.push(`Admin: Orlando Candia (usuario_id=${usuarioId}, password updated)`)

    // 21. CONTACTO EMAIL
    const tipoEmailId = Number((await client.execute("SELECT id FROM TipoContacto WHERE nombre='email'")).rows[0]?.id)
    if (tipoEmailId && personaId) await client.execute({sql:'INSERT OR IGNORE INTO Contacto (id_persona,id_tipo_contacto,valor,es_principal,verificado) VALUES (?,?,?,?,?)',args:[personaId,tipoEmailId,'orlando.candia@gmail.com',1,1]})
    results.push('Contacto email admin')

    // 22. ROLES + PERMISOS
    for (const r of [{n:'admin',d:'Administrador total',ed:0},{n:'produccion',d:'Producción y stock',ed:0},{n:'ventas',d:'Ventas y pedidos',ed:0},{n:'lectura',d:'Solo lectura',ed:1}]) await client.execute({sql:'INSERT OR IGNORE INTO Rol (nombre,descripcion,es_default) VALUES (?,?,?)',args:[r.n,r.d,r.ed]})
    const rolAdminId = Number((await client.execute("SELECT id FROM Rol WHERE nombre='admin'")).rows[0]?.id)
    if (usuarioId && rolAdminId) await client.execute({sql:'INSERT OR IGNORE INTO UsuarioRol (id_usuario,id_rol) VALUES (?,?)',args:[usuarioId,rolAdminId]})

    const mods = ['productos','compras','ventas','produccion','usuarios','auditoria','reportes','seguridad','logistica','presupuestos']
    const accs = ['ver','crear','editar','eliminar']
    for (const mod of mods) for (const acc of accs) await client.execute({sql:'INSERT OR IGNORE INTO Permiso (nombre,modulo,descripcion) VALUES (?,?,?)',args:[`${mod}.${acc}`,mod,`${acc} en ${mod}`]})
    for (const n of ['dashboard.ver','configuracion.ver','configuracion.editar','opiniones.ver','consultas.ver']) await client.execute({sql:'INSERT OR IGNORE INTO Permiso (nombre,modulo,descripcion) VALUES (?,?,?)',args:[n,n.split('.')[0],n]})
    
    const allPerms = await client.execute('SELECT id FROM Permiso')
    for (const row of allPerms.rows) { const pid=Number(row.id); if(rolAdminId&&pid) await client.execute({sql:'INSERT OR IGNORE INTO RolPermiso (id_rol,id_permiso) VALUES (?,?)',args:[rolAdminId,pid]}) }
    results.push(`Roles + ${allPerms.rows.length} permisos`)

    // 24. PRODUCTOS TERMINADOS
    const catId = async (table:string,nombre:string) => Number((await client.execute({sql:`SELECT id FROM ${table} WHERE nombre=?`,args:[nombre]})).rows[0]?.id) || 0
    const productos = [
      {c:'PF-001',n:'Sorrentinos de Jamón y Queso',cat:'Pastas frescas',p:0.5,pr:4500,sm:10,de:1,o:1},
      {c:'PF-002',n:'Ravioles de Ricota y Espinaca',cat:'Pastas frescas',p:0.5,pr:4000,sm:10,de:1,o:2},
      {c:'PF-003',n:'Ravioles de Carne',cat:'Pastas frescas',p:0.5,pr:4200,sm:10,de:1,o:3},
      {c:'PF-007',n:'Fettuccine al Huevo',cat:'Pastas frescas',p:0.4,pr:3200,sm:15,de:1,o:7},
      {c:'PS-001',n:'Fideos Spaghetti',cat:'Pastas secas',p:0.5,pr:2500,sm:20,de:1,o:1},
      {c:'SA-001',n:'Salsa Filetto',cat:'Salsas',p:0.5,pr:3000,sm:10,de:1,o:1},
      {c:'SA-002',n:'Salsa Bolognesa',cat:'Salsas',p:0.5,pr:3500,sm:10,de:1,o:2},
      {c:'NQ-001',n:'Ñoquis de Papa',cat:'Ñoquis',p:0.5,pr:3500,sm:15,de:1,o:1},
      {c:'LC-001',n:'Lasagna de Carne',cat:'Lasagnas y canelones',p:1.0,pr:8000,sm:5,de:1,o:1},
      {c:'LC-003',n:'Canelones de Jamón y Queso',cat:'Lasagnas y canelones',p:0.8,pr:6500,sm:5,de:1,o:3},
    ]
    for (const pt of productos) {
      const idCat = await catId('CategoriaProductoTerminado', pt.cat)
      if (!idCat) continue
      await client.execute({sql:'INSERT OR IGNORE INTO ProductoTerminado (codigo,nombre,id_categoria,peso_unitario_aprox,precio_venta,stock_minimo,destacado,orden,visible_en_landing,estado,stock_actual) VALUES (?,?,?,?,?,?,?,?,1,1,0)',args:[pt.c,pt.n,idCat,pt.p,pt.pr,pt.sm,pt.de,pt.o]})
    }
    results.push(`${productos.length} productos terminados`)

    // 25. MATERIAS PRIMAS
    const umId = async (codigo:string) => Number((await client.execute({sql:'SELECT id FROM UnidadMedida WHERE codigo=?',args:[codigo]})).rows[0]?.id) || 0
    const mps = [
      {c:'MP-001',n:'Harina 000',cat:'Harinas',um:'kg',s:50,sm:20,pr:1200},
      {c:'MP-002',n:'Harina 0000',cat:'Harinas',um:'kg',s:30,sm:15,pr:1400},
      {c:'MP-004',n:'Huevos frescos',cat:'Huevos y derivados',um:'u',s:120,sm:60,pr:250},
      {c:'MP-005',n:'Queso Ricota',cat:'Lácteos',um:'kg',s:10,sm:5,pr:5000},
      {c:'MP-006',n:'Queso Mozzarella',cat:'Lácteos',um:'kg',s:8,sm:4,pr:6000},
      {c:'MP-015',n:'Carne picada de res',cat:'Carnes',um:'kg',s:15,sm:8,pr:7000},
      {c:'MP-016',n:'Jamón cocido',cat:'Carnes',um:'kg',s:8,sm:4,pr:8000},
      {c:'MP-018',n:'Espinaca fresca',cat:'Verduras',um:'kg',s:5,sm:3,pr:3500},
      {c:'MP-022',n:'Papa',cat:'Verduras',um:'kg',s:20,sm:10,pr:1200},
    ]
    for (const mp of mps) {
      const idCat = await catId('CategoriaMateriaPrima', mp.cat)
      const idUm = await umId(mp.um)
      if (!idCat || !idUm) continue
      await client.execute({sql:'INSERT OR IGNORE INTO MateriaPrima (codigo,nombre,id_categoria,id_unidad_base,stock_actual,stock_minimo,precio_compra_referencia,estado) VALUES (?,?,?,?,?,?,?,1)',args:[mp.c,mp.n,idCat,idUm,mp.s,mp.sm,mp.pr]})
    }
    results.push(`${mps.length} materias primas`)

    // Verify
    const counts: Record<string,number> = {}
    for (const t of ['Pais','Provincia','Departamento','Municipio','TipoPersona','TipoContacto','TipoDireccion','Marca','UnidadMedida','FormaPago','EstadoGeneral','Usuario','Rol','Permiso','ProductoTerminado','MateriaPrima','Consulta','Opinion']) {
      try { counts[t] = Number((await client.execute(`SELECT COUNT(*) as c FROM ${t}`)).rows[0]?.c || 0) } catch { counts[t] = -1 }
    }

    // 26. SEED OPINIONES (solo si no hay ninguna aprobada)
    const approvedOpinions = Number((await client.execute("SELECT COUNT(*) as c FROM Opinion WHERE estado = 'approved'")).rows[0]?.c || 0)
    if (approvedOpinions === 0) {
      const opiniones = [
        { nombre: 'María González', email: 'maria.gonzalez@email.com', calificacion: 5, comentario: 'Las mejores sorrentinos que probé en mi vida. El relleno es generoso y la masa casera se nota. Súper recomendable!', estado: 'approved', destacado: 1 },
        { nombre: 'Carlos Ramírez', email: 'carlos.r@email.com', calificacion: 5, comentario: 'Hace años que les compro ravioles y la calidad siempre es impecable. Los de carne son mi favorito, muy bien sazonados.', estado: 'approved', destacado: 1 },
        { nombre: 'Laura Martínez', email: null, calificacion: 4, comentario: 'Muy ricos los ñoquis de papa, se nota que son hechos con amor. La entrega fue puntual y el trato excelente.', estado: 'approved', destacado: 0 },
        { nombre: 'Roberto Silva', email: null, calificacion: 5, comentario: 'La lasagna de carne es espectacular. La pido para cada reunión familiar y todos quedan encantados. No tiene competencia!', estado: 'approved', destacado: 1 },
        { nombre: 'Ana Pereyra', email: 'ana.p@email.com', calificacion: 4, comentario: 'Probé los fettuccine al huevo y estaban buenísimos. Me gustó que puedo elegir recibirlos frescos o congelados.', estado: 'approved', destacado: 0 },
        { nombre: 'Diego Fernández', email: null, calificacion: 5, comentario: 'Excelente atención y calidad. Las salsas caseras acompañan perfecto. Ya soy cliente habitual!', estado: 'approved', destacado: 0 },
      ]
      for (const op of opiniones) {
        await client.execute({
          sql: 'INSERT INTO Opinion (nombre, email, calificacion, comentario, estado, destacado, fecha, fecha_aprobacion) VALUES (?, ?, ?, ?, ?, ?, datetime("now", "-7 days"), datetime("now", "-6 days"))',
          args: [op.nombre, op.email, op.calificacion, op.comentario, op.estado, op.destacado]
        })
      }
      results.push(`${opiniones.length} opiniones aprobadas seed`)
    } else {
      results.push(`Opiniones aprobadas ya existen (${approvedOpinions})`)
    }

    return NextResponse.json({ success: true, message: 'Seed Turso OK', results, counts })
  } catch (error) {
    console.error('Seed Turso error:', error)
    return NextResponse.json({ error: 'Error seed-turso', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
