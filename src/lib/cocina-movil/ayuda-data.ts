/**
 * ============================================================
 * Cocina Móvil — Datos del Manual de Ayuda
 * ============================================================
 * Contenido estructurado del manual interactivo para los 12
 * módulos del sistema. Usado por la página de ayuda y el
 * asistente IA (como base de conocimiento).
 * ============================================================
 */

export interface AyudaSeccion {
  id: string
  titulo: string
  icono: string
  descripcion: string
  pasos: string[]
  ejemplos?: string[]
  tips?: string[]
}

export const AYUDA_SECCIONES: AyudaSeccion[] = [
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    icono: 'LayoutDashboard',
    descripcion: 'Panel principal con KPIs de todos los módulos del sistema. Muestra un resumen general de la actividad de la Cocina Móvil.',
    pasos: [
      'Al ingresar al sistema, verás 4 KPIs principales: Total Ventas, Ganancia Total, Producciones y Recetas.',
      'Debajo hay un grid con 8 módulos secundarios (Usuarios, Lugares, Proveedores, etc.) con links directos.',
      'Las secciones "Recetas más Vendidas" y "Ventas Recientes" muestran el top 3 y últimas 5 ventas.',
      'Producciones por Estado muestra cuántas hay pendientes, confirmadas y rechazadas.',
      'Las "Acciones Rápidas" te llevan directamente a crear ventas, producciones, recetas o presupuestos.',
    ],
    tips: ['Usa las acciones rápidas para acceder rápidamente a las tareas más comunes sin navegar por el menú.'],
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios',
    icono: 'Users',
    descripcion: 'Gestión de usuarios del sistema (administradores y cocineros). Cada usuario tiene datos personales completos, domicilio, avatar y rol.',
    pasos: [
      'Click en "Nuevo Usuario" para abrir el formulario de creación.',
      'Completa los Datos Personales (nombre, apellido, DNI, fecha de nacimiento, género, estado civil, avatar).',
      'Completa el Domicilio (dirección, país, provincia, departamento, municipio, ubicación en mapa).',
      'Completa los Datos de Acceso (email, contraseña, rol: admin o cocinero).',
      'Click en "Crear" para guardar el usuario.',
      'Para editar: click en el menú de acciones (⋮) → Editar.',
      'Para activar/desactivar: click en el menú → toggle Activar/Desactivar.',
      'Para cambiar contraseña: click en el menú → Cambiar contraseña.',
    ],
    ejemplos: [
      'Crear un cocinero: Nombre "Juan", Apellido "Pérez", Email "juan@laspastasdeorlando.com.ar", Rol "Cocinero".',
      'Desactivar un usuario sin eliminarlo: toggle "Activo" → "Inactivo".',
    ],
    tips: ['No se puede eliminar el último administrador activo del sistema.', 'El avatar se sube a Vercel Blob y se muestra como vista previa circular.'],
  },
  {
    id: 'lugares',
    titulo: 'Lugares',
    icono: 'MapPin',
    descripcion: 'Gestión de lugares donde se cocina (cocinas, carritos, locales). Cada lugar tiene datos de contacto, domicilio, imagen y costos fijos.',
    pasos: [
      'Click en "Nuevo Lugar" para abrir el formulario.',
      'Sección 1 - Datos del Lugar: nombre, descripción, responsable, teléfono, email.',
      'Sección 2 - Domicilio: dirección, país, provincia, departamento, municipio, mapa (Leaflet).',
      'Sección 3 - Imagen: sube una foto o logo del lugar (Vercel Blob).',
      'Sección 4 - Costos Fijos: propio o alquilado, alquiler, servicios, otros costos.',
      'Click en "Crear" para guardar.',
    ],
    ejemplos: [
      'Cocina Central: propio, sin alquiler, $25,000 de servicios.',
      'Carrito Móvil Centro: alquilado, $15,000 de alquiler, $5,000 servicios.',
    ],
    tips: ['Si el lugar es "Propio", el campo de alquiler se oculta automáticamente.', 'El mapa permite buscar direcciones y hacer clic para seleccionar la ubicación.'],
  },
  {
    id: 'materias-primas',
    titulo: 'Materias Primas',
    icono: 'Package',
    descripcion: 'Gestión de ingredientes para recetas y producción. Cada materia prima tiene categoría, unidad de compra, precio y conversión a gramos.',
    pasos: [
      'Click en "Nueva Materia Prima".',
      'Completa: nombre, descripción, categoría (harinas, carnes, lácteos, verduras, especias, aceites, otros).',
      'Selecciona la unidad de compra (kg, g, l, ml, u, paquete, docena).',
      'Ingresa el precio de compra por unidad.',
      'Opcional: conversión a gramos (ej: 1 kg = 1000 g).',
      'Sube una imagen del producto (opcional).',
      'Click en "Crear".',
    ],
    ejemplos: [
      'Harina 000: categoría "Harinas", unidad "kg", precio $450, conversión 1000 g.',
      'Huevos: categoría "Otros", unidad "docena", precio $1,800, conversión 600 g.',
    ],
  },
  {
    id: 'insumos',
    titulo: 'Insumos',
    icono: 'FlaskConical',
    descripcion: 'Gestión de materiales no comestibles (envases, limpieza, descartables). Similar a materias primas pero sin conversión a gramos.',
    pasos: [
      'Click en "Nuevo Insumo".',
      'Completa: nombre, descripción, categoría (envases, limpieza, descartables, otros).',
      'Selecciona la unidad de compra (u, m, kg, paquete, caja, rollo).',
      'Ingresa el precio de compra.',
      'Sube una imagen (opcional).',
      'Click en "Crear".',
    ],
    ejemplos: [
      'Bandejas de Aluminio: categoría "Descartables", unidad "paquete", $2,500.',
      'Film Polietileno: categoría "Envases", unidad "rollo", $800.',
    ],
  },
  {
    id: 'proveedores',
    titulo: 'Proveedores',
    icono: 'Building2',
    descripcion: 'Gestión de proveedores de materias primas e insumos. Cada proveedor tiene datos de contacto, domicilio y ubicación en mapa.',
    pasos: [
      'Click en "Nuevo Proveedor".',
      'Sección 1 - Datos: nombre, contacto, teléfono, email.',
      'Sección 2 - Domicilio: dirección, país, provincia, departamento, municipio, mapa.',
      'Sección 3 - Imagen/Logo: sube el logo del proveedor.',
      'Click en "Crear".',
    ],
    ejemplos: [
      'Distribuidora Misiones: contacto Carlos Gómez, 3754-555123, ventas@distribuidoramisiones.com.',
    ],
  },
  {
    id: 'compras',
    titulo: 'Compras',
    icono: 'ShoppingCart',
    descripcion: 'Registro de compras a proveedores. Cada compra tiene un proveedor, lugar, fecha, factura y una lista de items (materias primas o insumos).',
    pasos: [
      'Click en "Nueva Compra".',
      'Selecciona el proveedor y el lugar.',
      'Ingresa la fecha y número de factura (opcional).',
      'Agrega items: selecciona tipo (materia prima o insumo), producto, cantidad, unidad (auto), precio (auto).',
      'El sistema calcula automáticamente el subtotal de cada item y el total de la compra.',
      'Click en "Crear".',
    ],
    ejemplos: [
      'Compra de 10 kg de Harina a $450/kg + 5 kg de Carne a $3,200/kg = $20,500 total.',
    ],
    tips: ['La unidad y el precio se autocompletan al seleccionar el producto, pero puedes modificarlos.'],
  },
  {
    id: 'recetas',
    titulo: 'Recetas',
    icono: 'ChefHat',
    descripcion: 'Gestión de recetas con cálculo automático de costos. Cada receta tiene ingredientes (materias primas), insumos, porciones y pasos de preparación.',
    pasos: [
      'Click en "Nueva Receta".',
      'Sección 1 - Datos: título, descripción, categoría, tiempos, dificultad, porciones, pasos, imagen.',
      'Sección 2 - Ingredientes: agrega materias primas con cantidad (se autocompleta unidad y precio).',
      'Sección 3 - Insumos: agrega insumos con cantidad.',
      'Sección 4 - Costos: el sistema calcula automáticamente costo de ingredientes, costo de insumos, costo total y costo por porción.',
      'Click en "Crear".',
    ],
    ejemplos: [
      'Sorrentinos: Harina 0.5kg + Queso 0.2kg + Huevos 0.5 docena = $1,685 ingredientes + $80 insumos = $1,765 total. 4 porciones → $441.25 por porción.',
    ],
    tips: ['El costo por porción se usa automáticamente en producciones y presupuestos.', 'Los items se pueden agregar y remover dinámicamente.'],
  },
  {
    id: 'producciones',
    titulo: 'Producciones',
    icono: 'Factory',
    descripcion: 'Registro de elaboración de recetas con workflow de estados: Pendiente → Confirmada/Rechazada. El costo se calcula automáticamente.',
    pasos: [
      'Click en "Nueva Producción".',
      'Selecciona la receta y el lugar donde se produjo.',
      'Ingresa la cantidad de porciones producidas.',
      'Opcional: observaciones.',
      'El sistema calcula automáticamente: costo = costoPorPorción × cantidad.',
      'Click en "Crear" (la producción queda como "Pendiente").',
      'El Admin puede: Confirmar (registra el costo) o Rechazar (con motivo).',
      'Solo se pueden editar producciones pendientes.',
      'Solo se pueden eliminar producciones pendientes o rechazadas.',
    ],
    ejemplos: [
      'Sorrentinos: 20 porciones × $441.25 = $8,825 costo total.',
    ],
    tips: ['Las producciones confirmadas no se pueden editar ni eliminar.', 'Puedes imprimir etiquetas de producción desde el detalle.'],
  },
  {
    id: 'presupuestos',
    titulo: 'Presupuestos',
    icono: 'FileText',
    descripcion: 'Cotización de recetas a clientes con cálculo de márgenes de ganancia. Workflow: Borrador → Enviado → Aprobado/Rechazado.',
    pasos: [
      'Click en "Nuevo Presupuesto".',
      'Selecciona la receta, ingresa el nombre del cliente (opcional).',
      'Ingresa las porciones y el precio de venta por porción.',
      'El sistema calcula: costo total, precio total, ganancia y margen %.',
      'Click en "Crear" (queda como "Borrador").',
      'Acciones: Enviar (cambia a "Enviado"), Aprobar o Rechazar.',
      'Solo se pueden editar presupuestos en borrador.',
      'Solo se pueden eliminar borradores o rechazados.',
    ],
    ejemplos: [
      'Sorrentinos para 50 personas × $1,200 = $60,000 precio total. Costo $22,062. Ganancia $37,937. Margen 63.2%.',
    ],
    tips: ['El margen % se colorea: verde >30%, mostaza 10-30%, rojo <10%.'],
  },
  {
    id: 'ventas',
    titulo: 'Ventas',
    icono: 'Receipt',
    descripcion: 'Registro de ventas con cálculo de márgenes y generación de tickets térmicos. Cada venta tiene un número de ticket único.',
    pasos: [
      'Click en "Nueva Venta".',
      'Selecciona la receta y el lugar.',
      'Ingresa el nombre del cliente (opcional), cantidad y precio unitario.',
      'El sistema calcula: total, costo, ganancia y margen %.',
      'Click en "Crear". Se genera automáticamente un número de ticket (CM-000001).',
      'Para imprimir el ticket: abre el detalle de la venta → "Imprimir Ticket".',
      'Solo se pueden editar ventas con menos de 24 horas.',
    ],
    ejemplos: [
      'Venta de 4 porciones de Sorrentinos a $1,200 c/u = $4,800 total.',
    ],
    tips: ['El ticket se imprime en formato térmico (80mm o 58mm según configuración).', 'Cada venta tiene un número de ticket único para trazabilidad.'],
  },
  {
    id: 'configuracion',
    titulo: 'Configuración de Impresoras',
    icono: 'Settings',
    descripcion: 'Configuración de impresoras térmicas para tickets de venta y etiquetas de producción.',
    pasos: [
      'Ve a Configuración → Impresoras Térmicas.',
      'Selecciona el tipo de impresora: Epson (ESC/POS), Zebra (ZPL) o Genérica.',
      'Configura el puerto: USB, IP (red) o Bluetooth.',
      'Si usas IP, ingresa la dirección IP de la impresora.',
      'Configura el ancho de ticket: 80mm (estándar) o 58mm (mini).',
      'Configura el tamaño de etiqueta: 50×30, 70×40 o 100×60 mm.',
      'Opcional: activa el logo, ingresa el mensaje de agradecimiento y footer.',
      'Click en "Guardar Configuración".',
    ],
    tips: ['Los tickets se imprimen desde el detalle de cada venta.', 'Las etiquetas se imprimen desde el detalle de cada producción.'],
  },
]

/**
 * Busca secciones del manual por palabra clave.
 */
export function buscarSecciones(query: string): AyudaSeccion[] {
  if (!query.trim()) return AYUDA_SECCIONES
  const q = query.trim().toLowerCase()
  return AYUDA_SECCIONES.filter((s) =>
    s.titulo.toLowerCase().includes(q) ||
    s.descripcion.toLowerCase().includes(q) ||
    s.pasos.some((p) => p.toLowerCase().includes(q)) ||
    (s.ejemplos || []).some((e) => e.toLowerCase().includes(q)) ||
    (s.tips || []).some((t) => t.toLowerCase().includes(q))
  )
}

/**
 * Genera un texto plano de todo el manual para el asistente IA.
 */
export function getManualAsText(): string {
  return AYUDA_SECCIONES.map((s) => {
    let text = `## ${s.titulo}\n${s.descripcion}\n\nPasos:\n`
    s.pasos.forEach((p, i) => { text += `${i + 1}. ${p}\n` })
    if (s.ejemplos && s.ejemplos.length > 0) {
      text += '\nEjemplos:\n'
      s.ejemplos.forEach((e) => { text += `- ${e}\n` })
    }
    if (s.tips && s.tips.length > 0) {
      text += '\nTips:\n'
      s.tips.forEach((t) => { text += `- ${t}\n` })
    }
    return text
  }).join('\n---\n\n')
}
