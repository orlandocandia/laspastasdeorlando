import { NextRequest, NextResponse } from 'next/server'

// POST /api/seed-geografia - Seed ONLY geographic data using Prisma (safe for both SQLite and Turso)
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.SEED_SECRET && secret !== 'laspastasdeorlando-seed-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { db } = await import('@/lib/db')
    const results: string[] = []

    // 1. País
    const argentina = await db.pais.upsert({
      where: { nombre: 'Argentina' },
      update: {},
      create: { nombre: 'Argentina' },
    })
    results.push(`País: ${argentina.nombre}`)

    // 2. Provincias
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
    results.push(`${provinciasData.length} provincias`)

    // 3. Departamentos
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
    results.push(`${Object.keys(departamentos).length} departamentos`)

    // 4. Municipios
    const municipiosData: { nombre: string; deptoKey: string }[] = [
      // ── Misiones (79 municipios oficiales) ──
      // Departamento Capital (5)
      { nombre: 'Posadas', deptoKey: 'Misiones-Capital' },
      { nombre: 'Garupá', deptoKey: 'Misiones-Capital' },
      { nombre: 'Fachinal', deptoKey: 'Misiones-Capital' },
      { nombre: 'Villa Lanús', deptoKey: 'Misiones-Capital' },
      { nombre: 'Itaembé Miní', deptoKey: 'Misiones-Capital' },
      // Departamento Apóstoles (4)
      { nombre: 'Apóstoles', deptoKey: 'Misiones-Apóstoles' },
      { nombre: 'Azara', deptoKey: 'Misiones-Apóstoles' },
      { nombre: 'San José', deptoKey: 'Misiones-Apóstoles' },
      { nombre: 'Tres Capones', deptoKey: 'Misiones-Apóstoles' },
      // Departamento Candelaria (7)
      { nombre: 'Santa Ana', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Candelaria', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Profundidad', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Cerro Corá', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Bonpland', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Loreto', deptoKey: 'Misiones-Candelaria' },
      { nombre: 'Mártires', deptoKey: 'Misiones-Candelaria' },
      // Departamento Leandro N. Alem (8)
      { nombre: 'Leandro N. Alem', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Cerro Azul', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Dos Arroyos', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Gobernador López', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Arroyo del Medio', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Olegario Víctor Andrade', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Caá Yarí', deptoKey: 'Misiones-Leandro N. Alem' },
      { nombre: 'Almafuerte', deptoKey: 'Misiones-Leandro N. Alem' },
      // Departamento Cainguás (3)
      { nombre: 'Campo Grande', deptoKey: 'Misiones-Cainguás' },
      { nombre: 'Aristóbulo del Valle', deptoKey: 'Misiones-Cainguás' },
      { nombre: 'Dos de Mayo', deptoKey: 'Misiones-Cainguás' },
      // Departamento Concepción (2)
      { nombre: 'Concepción de la Sierra', deptoKey: 'Misiones-Concepción' },
      { nombre: 'Santa María', deptoKey: 'Misiones-Concepción' },
      // Departamento Eldorado (5)
      { nombre: 'Eldorado', deptoKey: 'Misiones-Eldorado' },
      { nombre: 'Colonia Victoria', deptoKey: 'Misiones-Eldorado' },
      { nombre: '9 de Julio', deptoKey: 'Misiones-Eldorado' },
      { nombre: 'Santiago de Liniers', deptoKey: 'Misiones-Eldorado' },
      { nombre: 'Colonia Delicia', deptoKey: 'Misiones-Eldorado' },
      // Departamento General Manuel Belgrano (3)
      { nombre: 'Bernardo de Irigoyen', deptoKey: 'Misiones-General Manuel Belgrano' },
      { nombre: 'Comandante Andresito', deptoKey: 'Misiones-General Manuel Belgrano' },
      { nombre: 'San Antonio', deptoKey: 'Misiones-General Manuel Belgrano' },
      // Departamento Guaraní (3)
      { nombre: 'El Soberbio', deptoKey: 'Misiones-Guaraní' },
      { nombre: 'San Vicente', deptoKey: 'Misiones-Guaraní' },
      { nombre: 'Fracrán', deptoKey: 'Misiones-Guaraní' },
      // Departamento Iguazú (4)
      { nombre: 'Puerto Esperanza', deptoKey: 'Misiones-Iguazú' },
      { nombre: 'Puerto Iguazú', deptoKey: 'Misiones-Iguazú' },
      { nombre: 'Colonia Wanda', deptoKey: 'Misiones-Iguazú' },
      { nombre: 'Puerto Libertad', deptoKey: 'Misiones-Iguazú' },
      // Departamento Libertador General San Martín (6)
      { nombre: 'Puerto Rico', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Garuhapé', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Capioví', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'El Alcázar', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Puerto Leoni', deptoKey: 'Misiones-Libertador General San Martín' },
      { nombre: 'Ruiz de Montoya', deptoKey: 'Misiones-Libertador General San Martín' },
      // Departamento Montecarlo (3)
      { nombre: 'Montecarlo', deptoKey: 'Misiones-Montecarlo' },
      { nombre: 'Puerto Piray', deptoKey: 'Misiones-Montecarlo' },
      { nombre: 'Caraguatay', deptoKey: 'Misiones-Montecarlo' },
      // Departamento Oberá (9)
      { nombre: 'Oberá', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Campo Ramón', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Campo Viera', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Guaraní', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Los Helechos', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Colonia Alberdi', deptoKey: 'Misiones-Oberá' },
      { nombre: 'Panambí', deptoKey: 'Misiones-Oberá' },
      { nombre: 'San Martín', deptoKey: 'Misiones-Oberá' },
      { nombre: 'General Alvear', deptoKey: 'Misiones-Oberá' },
      // Departamento San Ignacio (8)
      { nombre: 'San Ignacio', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Jardín América', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Santo Pipó', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Corpus', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Hipólito Yrigoyen', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'General Urquiza', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Colonia Polana', deptoKey: 'Misiones-San Ignacio' },
      { nombre: 'Gobernador Roca', deptoKey: 'Misiones-San Ignacio' },
      // Departamento San Javier (4)
      { nombre: 'San Javier', deptoKey: 'Misiones-San Javier' },
      { nombre: 'Itacaruaré', deptoKey: 'Misiones-San Javier' },
      { nombre: 'Mojón Grande', deptoKey: 'Misiones-San Javier' },
      { nombre: 'Florentino Ameghino', deptoKey: 'Misiones-San Javier' },
      // Departamento San Pedro (2)
      { nombre: 'San Pedro', deptoKey: 'Misiones-San Pedro' },
      { nombre: 'Pozo Azul', deptoKey: 'Misiones-San Pedro' },
      // Departamento Veinticinco de Mayo (3)
      { nombre: 'Alba Posse', deptoKey: 'Misiones-Veinticinco de Mayo' },
      { nombre: 'Colonia Aurora', deptoKey: 'Misiones-Veinticinco de Mayo' },
      { nombre: '25 de Mayo', deptoKey: 'Misiones-Veinticinco de Mayo' },
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
      // ── CABA ──
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
      // ── Other provinces ──
      { nombre: 'Córdoba', deptoKey: 'Córdoba-Capital' },
      { nombre: 'Santa Fe', deptoKey: 'Santa Fe-La Capital' },
      { nombre: 'Rosario', deptoKey: 'Santa Fe-Rosario' },
      { nombre: 'Mendoza', deptoKey: 'Mendoza-Capital' },
      { nombre: 'Godoy Cruz', deptoKey: 'Mendoza-Godoy Cruz' },
      { nombre: 'San Miguel de Tucumán', deptoKey: 'Tucumán-Capital' },
      { nombre: 'Salta', deptoKey: 'Salta-Capital' },
      { nombre: 'Paraná', deptoKey: 'Entre Ríos-Paraná' },
      { nombre: 'Concordia', deptoKey: 'Entre Ríos-Concordia' },
      { nombre: 'Presidencia Roque Sáenz Peña', deptoKey: 'Chaco-Comandante Fernández' },
      { nombre: 'Resistencia', deptoKey: 'Chaco-San Fernando' },
      { nombre: 'Barranqueras', deptoKey: 'Chaco-1° de Mayo' },
      { nombre: 'Formosa', deptoKey: 'Formosa-Formosa' },
      { nombre: 'Clorinda', deptoKey: 'Formosa-Pilcomayo' },
      { nombre: 'San Salvador de Jujuy', deptoKey: 'Jujuy-Capital' },
      { nombre: 'El Carmen', deptoKey: 'Jujuy-El Carmen' },
      { nombre: 'San Fernando del Valle de Catamarca', deptoKey: 'Catamarca-Capital' },
      { nombre: 'San Isidro', deptoKey: 'Catamarca-Valle Viejo' },
      { nombre: 'Rawson', deptoKey: 'Chubut-Rawson' },
      { nombre: 'Gaiman', deptoKey: 'Chubut-Gaiman' },
      { nombre: 'Santa Rosa', deptoKey: 'La Pampa-Capital' },
      { nombre: 'La Rioja', deptoKey: 'La Rioja-Capital' },
      { nombre: 'Neuquén', deptoKey: 'Neuquén-Confluencia' },
      { nombre: 'Plottier', deptoKey: 'Neuquén-Confluencia' },
      { nombre: 'General Roca', deptoKey: 'Río Negro-General Roca' },
      { nombre: 'San Juan', deptoKey: 'San Juan-Capital' },
      { nombre: 'San Luis', deptoKey: 'San Luis-Capital' },
      { nombre: 'Río Gallegos', deptoKey: 'Santa Cruz-Güer Aike' },
      { nombre: 'Santiago del Estero', deptoKey: 'Santiago del Estero-Capital' },
      { nombre: 'Ushuaia', deptoKey: 'Tierra del Fuego-Ushuaia' },
    ]
    let municipiosCreated = 0
    for (const muni of municipiosData) {
      const idDepto = departamentos[muni.deptoKey]
      if (!idDepto) continue
      await db.municipio.upsert({
        where: { id_departamento_nombre: { id_departamento: idDepto, nombre: muni.nombre } },
        update: {},
        create: { id_departamento: idDepto, nombre: muni.nombre },
      })
      municipiosCreated++
    }
    results.push(`${municipiosCreated} municipios`)

    return NextResponse.json({
      success: true,
      message: 'Datos geográficos actualizados exitosamente',
      results,
    })
  } catch (error: any) {
    console.error('[Seed Geografia Error]', error)
    return NextResponse.json({
      error: 'Error al seedear datos geográficos',
      details: error.message || String(error),
    }, { status: 500 })
  }
}
