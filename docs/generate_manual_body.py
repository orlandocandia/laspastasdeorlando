#!/usr/bin/env python3
"""
Generate the body PDF for Manual de Usuario - Pastas Orlando
Uses ReportLab with Times New Roman, A4 page size, professional layout.
Includes clickable Table of Contents with internal links.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, KeepTogether, Flowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
import os

# ── Palette ──
ACCENT       = colors.HexColor('#502ac2')
TEXT_PRIMARY  = colors.HexColor('#1f2022')
TEXT_MUTED    = colors.HexColor('#83898f')
BG_SURFACE   = colors.HexColor('#e2e4e7')
BG_PAGE      = colors.HexColor('#eceff1')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ── Font Registration ──
# Try to find Times New Roman TTF on the system
TTF_PATHS = [
    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf",
    "/usr/share/fonts/truetype/msttcorefonts/times.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
]

TTF_BOLD_PATHS = [
    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
]

TTF_ITALIC_PATHS = [
    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Italic.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf",
]

TTF_BOLDITALIC_PATHS = [
    "/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold_Italic.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSerifBoldItalic.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf",
]

def find_font(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None

FONT_NAME = "TimesNewRoman"
font_regular = find_font(TTF_PATHS)
font_bold = find_font(TTF_BOLD_PATHS)
font_italic = find_font(TTF_ITALIC_PATHS)
font_bolditalic = find_font(TTF_BOLDITALIC_PATHS)

if font_regular:
    pdfmetrics.registerFont(TTFont(FONT_NAME, font_regular))
    font_registered = True
else:
    font_registered = False
    FONT_NAME = "Times-Roman"

if font_bold:
    BOLD_NAME = FONT_NAME + "-Bold"
    pdfmetrics.registerFont(TTFont(BOLD_NAME, font_bold))
else:
    BOLD_NAME = "Times-Bold"

if font_italic:
    ITALIC_NAME = FONT_NAME + "-Italic"
    pdfmetrics.registerFont(TTFont(ITALIC_NAME, font_italic))
else:
    ITALIC_NAME = "Times-Italic"

if font_bolditalic:
    BOLDITALIC_NAME = FONT_NAME + "-BoldItalic"
    pdfmetrics.registerFont(TTFont(BOLDITALIC_NAME, font_bolditalic))
else:
    BOLDITALIC_NAME = "Times-BoldItalic"

if font_regular and font_bold and font_italic and font_bolditalic:
    addMapping(FONT_NAME, 0, 0, FONT_NAME)
    addMapping(FONT_NAME, 1, 0, BOLD_NAME)
    addMapping(FONT_NAME, 0, 1, ITALIC_NAME)
    addMapping(FONT_NAME, 1, 1, BOLDITALIC_NAME)

# ── Styles ──
PAGE_WIDTH, PAGE_HEIGHT = A4

styles = getSampleStyleSheet()

style_body = ParagraphStyle(
    'BodyCustom',
    parent=styles['Normal'],
    fontName=FONT_NAME,
    fontSize=11,
    leading=16.5,  # 1.5x
    textColor=TEXT_PRIMARY,
    alignment=TA_JUSTIFY,
    spaceAfter=8,
)

style_heading1 = ParagraphStyle(
    'Heading1Custom',
    parent=styles['Heading1'],
    fontName=BOLD_NAME,
    fontSize=20,
    leading=30,
    textColor=ACCENT,
    spaceBefore=20,
    spaceAfter=12,
    alignment=TA_LEFT,
)

style_heading2 = ParagraphStyle(
    'Heading2Custom',
    parent=styles['Heading2'],
    fontName=BOLD_NAME,
    fontSize=14,
    leading=21,
    textColor=ACCENT,
    spaceBefore=14,
    spaceAfter=8,
    alignment=TA_LEFT,
)

style_heading3 = ParagraphStyle(
    'Heading3Custom',
    parent=styles['Heading3'],
    fontName=BOLD_NAME,
    fontSize=12,
    leading=18,
    textColor=TEXT_PRIMARY,
    spaceBefore=10,
    spaceAfter=6,
    alignment=TA_LEFT,
)

style_toc_h1 = ParagraphStyle(
    'TOC_H1',
    parent=styles['Normal'],
    fontName=BOLD_NAME,
    fontSize=12,
    leading=20,
    textColor=ACCENT,
    leftIndent=0,
)

style_toc_h2 = ParagraphStyle(
    'TOC_H2',
    parent=styles['Normal'],
    fontName=FONT_NAME,
    fontSize=11,
    leading=18,
    textColor=TEXT_PRIMARY,
    leftIndent=20,
)

style_bullet = ParagraphStyle(
    'BulletCustom',
    parent=style_body,
    leftIndent=20,
    bulletIndent=10,
    spaceAfter=4,
)

style_subbullet = ParagraphStyle(
    'SubBulletCustom',
    parent=style_body,
    leftIndent=40,
    bulletIndent=25,
    spaceAfter=3,
    fontSize=10,
    leading=15,
)

style_muted = ParagraphStyle(
    'MutedText',
    parent=style_body,
    textColor=TEXT_MUTED,
    fontSize=10,
    leading=15,
    fontName=ITALIC_NAME,
)

style_link = ParagraphStyle(
    'LinkStyle',
    parent=style_body,
    textColor=ACCENT,
    fontName=FONT_NAME,
    fontSize=11,
)

style_toc_title = ParagraphStyle(
    'TOCTitle',
    parent=styles['Heading1'],
    fontName=BOLD_NAME,
    fontSize=22,
    leading=32,
    textColor=ACCENT,
    spaceBefore=0,
    spaceAfter=20,
    alignment=TA_LEFT,
)


# ── Helper: Accent line separator ──
class AccentLine(Flowable):
    def __init__(self, width, thickness=2, color=ACCENT):
        Flowable.__init__(self)
        self.width = width
        self.thickness = thickness
        self.color = color
        self.height = thickness + 6

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 3, self.width, 3)


# ── Helper: Make a styled table ──
def make_table(headers, rows, col_widths=None):
    data = [headers] + rows
    avail_width = PAGE_WIDTH - 2 * inch
    if col_widths is None:
        n = len(headers)
        col_widths = [avail_width / n] * n

    t = Table(data, colWidths=col_widths, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, 0), BOLD_NAME),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), FONT_NAME),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('LEADING', (0, 0), (-1, -1), 14),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#c0c0c0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [TABLE_ROW_EVEN, TABLE_ROW_ODD]),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t


# ── Helper: bullet list ──
def bullet_list(items, style=None):
    if style is None:
        style = style_bullet
    elements = []
    for item in items:
        elements.append(Paragraph(item, style, bulletText='\u2022'))
    return elements


def sub_bullet_list(items):
    return bullet_list(items, style=style_subbullet)


# ── Page number callback ──
def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT_NAME, 9)
    canvas.setFillColor(TEXT_MUTED)
    page_num = canvas.getPageNumber()
    text = f"- {page_num} -"
    canvas.drawCentredString(PAGE_WIDTH / 2, 0.5 * inch, text)
    # Accent line at top
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.5)
    canvas.line(inch, PAGE_HEIGHT - 0.6 * inch, PAGE_WIDTH - inch, PAGE_HEIGHT - 0.6 * inch)
    canvas.restoreState()


# ── TOC bookmark tracking ──
toc_entries = []

def heading1_with_bookmark(text, key):
    """Create a heading1 that also registers a bookmark for TOC."""
    toc_entries.append((1, text, key))
    return [
        Spacer(1, 6),
        AccentLine(PAGE_WIDTH - 2 * inch),
        Paragraph(f'<a name="{key}"/>{text}', style_heading1),
    ]

def heading2_with_bookmark(text, key):
    """Create a heading2 that also registers a bookmark for TOC."""
    toc_entries.append((2, text, key))
    return [
        Paragraph(f'<a name="{key}"/>{text}', style_heading2),
    ]


# ── Build story ──
story = []

# ===== TABLE OF CONTENTS =====
story.append(Spacer(1, 30))
story.append(Paragraph("Indice", style_toc_title))
story.append(AccentLine(PAGE_WIDTH - 2 * inch, 3))
story.append(Spacer(1, 16))

# We'll populate the TOC after defining all sections.
# For now, add a placeholder page break; we'll insert TOC content later.
# Actually, we build the TOC manually with clickable links.
# First, define all section keys and titles, then build the TOC.

SECTIONS = [
    (1, "1. Introduccion", "sec1"),
    (2, "Que es Pastas Orlando?", "sec1_1"),
    (2, "Para que sirve?", "sec1_2"),
    (1, "2. Acceso al sistema", "sec2"),
    (1, "3. Gestion de Productos Terminados", "sec3"),
    (1, "4. Gestion de Materias Primas e Insumos", "sec4"),
    (1, "5. Gestion de Recetas", "sec5"),
    (1, "6. Gestion de Compras", "sec6"),
    (1, "7. Gestion de Ventas", "sec7"),
    (1, "8. Gestion de Produccion", "sec8"),
    (1, "9. Gestion de Personas", "sec9"),
    (1, "10. Moderacion de Opiniones", "sec10"),
    (1, "11. Gestion de Envios y Logistica", "sec11"),
    (1, "12. Generacion de Etiquetas", "sec12"),
    (1, "13. Reportes y Estadisticas", "sec13"),
    (1, "14. Consultas y Notificaciones", "sec14"),
    (1, "15. Preguntas Frecuentes", "sec15"),
]

for level, title, key in SECTIONS:
    if level == 1:
        story.append(Paragraph(f'<a href="#{key}" color="{ACCENT.hexval()}">{title}</a>', style_toc_h1))
    else:
        story.append(Paragraph(f'<a href="#{key}" color="{TEXT_PRIMARY.hexval()}">{title}</a>', style_toc_h2))

story.append(PageBreak())


# ===== SECTION 1: Introduccion =====
story.extend(heading1_with_bookmark("1. Introduccion", "sec1"))

story.extend(heading2_with_bookmark("Que es Pastas Orlando?", "sec1_1"))
story.append(Paragraph(
    "Pastas Orlando es un sistema ERP integrado con una landing page publica, disenado para la gestion integral "
    "de una fabrica de pastas artesanales ubicada en Posadas, Misiones, Argentina. El sistema permite administrar "
    "de manera centralizada todos los procesos operativos, comerciales y productivos de la empresa, desde la compra "
    "de materias primas hasta la entrega del producto final al cliente.",
    style_body
))
story.append(Spacer(1, 4))
story.append(Paragraph(
    "La plataforma combina un sitio web publico que muestra los productos y permite la interaccion con los clientes, "
    "con un panel de administracion (dashboard) privado donde el equipo de la empresa gestiona el dia a dia operativo.",
    style_body
))

story.extend(heading2_with_bookmark("Para que sirve?", "sec1_2"))
story.append(Paragraph("El sistema Pastas Orlando cubre las siguientes areas funcionales:", style_body))

areas_data = [
    ["Area", "Descripcion"],
    ["Productos", "Gestion del catalogo de productos terminados con imagenes, precios y stock"],
    ["Materias Primas", "Control de insumos y materias primas con stock minimo y unidades de medida"],
    ["Recetas", "Formulacion de recetas con calculo automatico de costos y rendimientos"],
    ["Compras", "Registro de compras a proveedores con actualizacion automatica de stock"],
    ["Ventas", "Registro de ventas, pedidos, presupuestos y reservas de clientes"],
    ["Produccion", "Ejecucion de produccion con consumo automatico de ingredientes"],
    ["Logistica", "Gestion de entregas, puntos de encuentro y mapas de ruta"],
    ["Opiniones", "Moderacion de opiniones y valoraciones de clientes"],
    ["Reportes", "Generacion de reportes en Excel y PDF con estadisticas clave"],
    ["Notificaciones", "Alertas configurables, consultas y comunicaciones con clientes"],
]
story.append(Spacer(1, 6))
story.append(make_table(
    areas_data[0], areas_data[1:],
    col_widths=[1.6*inch, 4.4*inch]
))

story.append(PageBreak())

# ===== SECTION 2: Acceso al sistema =====
story.extend(heading1_with_bookmark("2. Acceso al sistema", "sec2"))

story.append(Paragraph(
    "El sistema Pastas Orlando consta de dos componentes principales: la landing page publica y el "
    "panel de administracion privado. A continuacion se detallan las URLs y los metodos de acceso.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("URLs del sistema", "sec2_1"))
story.append(Spacer(1, 4))
url_data = [
    ["Componente", "URL"],
    ["Landing page publica", "https://laspastasdeorlando.com.ar"],
    ["Dashboard (login)", "https://laspastasdeorlando.com.ar/admin/login"],
]
story.append(make_table(
    url_data[0], url_data[1:],
    col_widths=[2.2*inch, 3.8*inch]
))
story.append(Spacer(1, 12))

story.extend(heading2_with_bookmark("Como acceder al dashboard", "sec2_2"))
story.append(Paragraph(
    "Existen dos formas de acceder al panel de administracion:",
    style_body
))
story.extend(bullet_list([
    "<b>Desde la landing page:</b> Haga clic en el icono de corazon ubicado en el pie de pagina (footer) "
    "de la pagina principal. Este enlace redirige automaticamente al formulario de inicio de sesion.",
    "<b>Acceso directo:</b> Ingrese la URL del dashboard (https://laspastasdeorlando.com.ar/admin/login) "
    "directamente en el navegador.",
]))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Credenciales de acceso", "sec2_3"))
story.append(Paragraph(
    "Las credenciales de acceso (usuario y contrasena) son proporcionadas al momento de la configuracion "
    "inicial del sistema. Si olvida su contrasena, puede utilizar la opcion 'Olivide mi contrasena' en la "
    "pantalla de inicio de sesion para restablecerla mediante correo electronico.",
    style_body
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Nota: Se recomienda cambiar la contrasena por defecto despues del primer inicio de sesion y activar "
    "la autenticacion de dos factores (2FA) para mayor seguridad.",
    style_muted
))

story.append(PageBreak())

# ===== SECTION 3: Gestion de Productos Terminados =====
story.extend(heading1_with_bookmark("3. Gestion de Productos Terminados", "sec3"))

story.append(Paragraph(
    "El modulo de Productos Terminados permite administrar el catalogo completo de productos que elabora "
    "y comercializa la fabrica. Desde aqui se puede crear, editar, activar o desactivar productos, asi como "
    "gestionar las imagenes y la visibilidad en la landing page.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Listado de productos", "sec3_1"))
story.append(Paragraph(
    "Para acceder al listado de productos, navegue a <b>/admin/productos-terminados</b>. "
    "En esta pantalla se muestran todos los productos registrados con sus datos principales: "
    "codigo, nombre, categoria, precio, stock actual y estado.",
    style_body
))
story.append(Spacer(1, 6))

prod_fields = [
    ["Campo", "Descripcion", "Obligatorio"],
    ["Codigo", "Codigo unico de identificacion del producto", "Si"],
    ["Nombre", "Nombre descriptivo del producto", "Si"],
    ["Categoria", "Categoria a la que pertenece (tallarines, ravioles, noquis, etc.)", "Si"],
    ["Precio", "Precio de venta al publico", "Si"],
    ["Stock", "Cantidad disponible en inventario", "Si"],
    ["Estado", "Activo o inactivo (determina si se puede vender)", "Si"],
    ["Destacado", "Marca el producto como destacado para la landing page", "No"],
    ["Visible en landing", "Determina si el producto aparece en la pagina publica", "No"],
]
story.append(make_table(
    prod_fields[0], prod_fields[1:],
    col_widths=[1.3*inch, 3.4*inch, 1.1*inch]
))
story.append(Spacer(1, 10))

story.extend(heading2_with_bookmark("Crear un nuevo producto", "sec3_2"))
story.append(Paragraph(
    "Para crear un nuevo producto, haga clic en el boton 'Nuevo producto' en la esquina superior "
    "derecha del listado. Complete el formulario con los datos del producto y guarde los cambios.",
    style_body
))

story.extend(heading2_with_bookmark("Subir imagen del producto", "sec3_3"))
story.append(Paragraph(
    "Cada producto puede tener una imagen asociada. El sistema utiliza Vercel Blob como almacenamiento "
    "en produccion y almacenamiento local en el entorno de desarrollo. Para subir una imagen, utilice "
    "el campo de carga de imagen en el formulario de edicion del producto.",
    style_body
))

story.extend(heading2_with_bookmark("Activar/desactivar y destacar productos", "sec3_4"))
story.extend(bullet_list([
    "<b>Activar/desactivar:</b> Utilice el campo 'estado' para activar o desactivar un producto. "
    "Los productos inactivos no aparecen en las ventas ni en la landing page.",
    "<b>Destacar en landing:</b> Marque los campos 'destacado' y 'visible_en_landing' para que "
    "el producto aparezca destacado en la pagina publica del sitio web.",
]))

story.append(PageBreak())

# ===== SECTION 4: Gestion de Materias Primas e Insumos =====
story.extend(heading1_with_bookmark("4. Gestion de Materias Primas e Insumos", "sec4"))

story.append(Paragraph(
    "Este modulo permite gestionar las materias primas y los insumos necesarios para la elaboracion "
    "de los productos. Las materias primas son los ingredientes base (harinas, huevos, verduras), "
    "mientras que los insumos son los materiales complementarios (packaging, etiquetas).",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Materias primas", "sec4_1"))
story.append(Paragraph(
    "Para acceder a la gestion de materias primas, navegue a <b>/admin/materias-primas</b>. "
    "Aqui podra registrar, editar y eliminar materias primas, cada una con un codigo unico.",
    style_body
))
story.append(Spacer(1, 4))

story.extend(heading2_with_bookmark("Insumos", "sec4_2"))
story.append(Paragraph(
    "Para acceder a la gestion de insumos, navegue a <b>/admin/insumos</b>. "
    "Los insumos se gestionan de forma similar a las materias primas, con codigo unico, "
    "stock actual y stock minimo.",
    style_body
))
story.append(Spacer(1, 6))

mp_fields = [
    ["Campo", "Descripcion"],
    ["Codigo", "Codigo unico de identificacion"],
    ["Nombre", "Nombre descriptivo de la materia prima o insumo"],
    ["Stock actual", "Cantidad disponible en inventario"],
    ["Stock minimo", "Cantidad minima requerida (genera alertas si es inferior)"],
    ["Unidad de medida", "Unidad configurable (kg, g, l, ml, unidades, etc.)"],
]
story.append(make_table(
    mp_fields[0], mp_fields[1:],
    col_widths=[1.5*inch, 4.5*inch]
))

story.append(PageBreak())

# ===== SECTION 5: Gestion de Recetas =====
story.extend(heading1_with_bookmark("5. Gestion de Recetas", "sec5"))

story.append(Paragraph(
    "El modulo de Recetas permite definir la formulacion de cada producto terminado, especificando "
    "los ingredientes (materias primas e insumos) necesarios con sus cantidades y unidades de medida. "
    "El sistema calcula automaticamente el costo estimado de elaboracion.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Crear una receta", "sec5_1"))
story.append(Paragraph(
    "Para crear una receta, navegue a <b>/admin/recetas</b> y seleccione el producto terminado "
    "al que desea vincular la receta. Luego agregue los ingredientes necesarios.",
    style_body
))
story.append(Spacer(1, 4))

story.extend(bullet_list([
    "<b>Producto terminado:</b> Seleccione el producto al que pertenece la receta.",
    "<b>Ingredientes:</b> Agregue materias primas e insumos con sus cantidades y unidades.",
    "<b>Calculo de costos:</b> El sistema calcula automaticamente el costo estimado en funcion "
    "de los precios de las materias primas e insumos.",
    "<b>Rendimiento:</b> Especifique la cantidad de unidades obtenidas por cada elaboracion.",
]))
story.append(Spacer(1, 8))

recipe_example = [
    ["Ingrediente", "Cantidad", "Unidad", "Costo unitario"],
    ["Harina 0000", "1", "kg", "$500"],
    ["Huevos", "6", "unidades", "$150"],
    ["Aceite de oliva", "0.05", "l", "$80"],
    ["Packaging", "1", "unidad", "$120"],
    ["Total estimado", "", "", "$850"],
]
story.append(Paragraph("<b>Ejemplo de receta - Tallarines artesanales:</b>", style_body))
story.append(Spacer(1, 4))
story.append(make_table(
    recipe_example[0], recipe_example[1:],
    col_widths=[1.8*inch, 1.2*inch, 1.2*inch, 1.8*inch]
))

story.append(PageBreak())

# ===== SECTION 6: Gestion de Compras =====
story.extend(heading1_with_bookmark("6. Gestion de Compras", "sec6"))

story.append(Paragraph(
    "El modulo de Compras permite registrar las compras realizadas a proveedores, llevando un registro "
    "detallado de los productos adquiridos, sus precios unitarios y la forma de pago utilizada. "
    "Al registrar una compra, el stock de las materias primas e insumos se actualiza automaticamente.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Registrar una compra", "sec6_1"))
story.append(Paragraph(
    "Para registrar una compra, navegue a <b>/admin/compras</b> y haga clic en 'Nueva compra'.",
    style_body
))
story.extend(bullet_list([
    "<b>Proveedor:</b> Seleccione el proveedor al que se le realizo la compra.",
    "<b>Forma de pago:</b> Seleccione la forma de pago (efectivo, transferencia, tarjeta, etc.).",
    "<b>Productos:</b> Agregue las materias primas e insumos comprados con su precio unitario y cantidad.",
    "<b>Actualizacion de stock:</b> Al guardar la compra, el sistema incrementa automaticamente el stock "
    "de los productos comprados.",
]))
story.append(Spacer(1, 8))

compras_table = [
    ["Dato", "Descripcion"],
    ["Fecha", "Fecha de la compra"],
    ["Proveedor", "Persona o empresa proveedora"],
    ["Forma de pago", "Metodo de pago utilizado"],
    ["Productos", "Lista de materias primas/insumos con precio unitario"],
    ["Total", "Monto total de la compra (calculado automaticamente)"],
]
story.append(make_table(
    compras_table[0], compras_table[1:],
    col_widths=[1.5*inch, 4.5*inch]
))

story.append(PageBreak())

# ===== SECTION 7: Gestion de Ventas =====
story.extend(heading1_with_bookmark("7. Gestion de Ventas", "sec7"))

story.append(Paragraph(
    "El modulo de Ventas permite registrar las ventas de productos terminados, gestionar pedidos de "
    "clientes, emitir presupuestos y administrar reservas. El sistema descuenta automaticamente el "
    "stock al registrar una venta.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Registrar una venta", "sec7_1"))
story.append(Paragraph(
    "Para registrar una venta, navegue a <b>/admin/ventas</b> y haga clic en 'Nueva venta'.",
    style_body
))
story.extend(bullet_list([
    "<b>Escanner de codigo de barras:</b> Utilice el lector de codigo de barras para agregar productos "
    "rapidamente a la venta escaneando el codigo del producto.",
    "<b>Descuento de stock:</b> Al confirmar la venta, el sistema descuenta automaticamente las unidades "
    "vendidas del stock disponible.",
]))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Pedidos de clientes", "sec7_2"))
story.append(Paragraph(
    "Para gestionar pedidos, navegue a <b>/admin/pedidos-clientes</b>. Los pedidos permiten registrar "
    "solicitudes de clientes con detalle de productos, cantidades, fecha de entrega y estado.",
    style_body
))
story.append(Spacer(1, 4))

story.extend(heading2_with_bookmark("Presupuestos", "sec7_3"))
story.append(Paragraph(
    "Para emitir presupuestos, navegue a <b>/admin/presupuestos</b>. Un presupuesto puede convertirse "
    "en un pedido de cliente una vez que el cliente lo confirma, transfiriendo automaticamente todos los "
    "datos del presupuesto al nuevo pedido.",
    style_body
))
story.append(Spacer(1, 4))

story.extend(heading2_with_bookmark("Reservas de clientes", "sec7_4"))
story.append(Paragraph(
    "Para gestionar reservas, navegue a <b>/admin/reservas-clientes</b>. Las reservas permiten a los "
    "clientes apartar productos con una sena, garantizando la disponibilidad.",
    style_body
))
story.append(Spacer(1, 6))

ventas_table = [
    ["Modulo", "Ruta", "Funcionalidad"],
    ["Ventas", "/admin/ventas", "Registro de ventas con escaner de codigo de barras"],
    ["Pedidos", "/admin/pedidos-clientes", "Gestion de pedidos de clientes"],
    ["Presupuestos", "/admin/presupuestos", "Emision y conversion a pedido"],
    ["Reservas", "/admin/reservas-clientes", "Reservas de productos con sena"],
]
story.append(make_table(
    ventas_table[0], ventas_table[1:],
    col_widths=[1.2*inch, 2.0*inch, 2.8*inch]
))

story.append(PageBreak())

# ===== SECTION 8: Gestion de Produccion =====
story.extend(heading1_with_bookmark("8. Gestion de Produccion", "sec8"))

story.append(Paragraph(
    "El modulo de Produccion permite ejecutar las elaboraciones de productos siguiendo las recetas "
    "definidas. El sistema valida automaticamente que exista stock suficiente de materias primas e "
    "insumos antes de iniciar la produccion y actualiza el inventario al completarla.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Proceso de produccion", "sec8_1"))
story.append(Paragraph(
    "Para iniciar una produccion, navegue a <b>/admin/produccion</b> y siga estos pasos:",
    style_body
))
story.append(Spacer(1, 4))

prod_steps = [
    ["Paso", "Accion", "Descripcion"],
    ["1", "Seleccionar receta", "Elija la receta del producto que desea elaborar"],
    ["2", "Validar stock", "El sistema verifica que haya stock suficiente de cada ingrediente"],
    ["3", "Ejecutar produccion", "Confirme la produccion; el sistema consume las materias primas e insumos"],
    ["4", "Generar stock", "Se incrementa automaticamente el stock del producto terminado segun el rendimiento"],
]
story.append(make_table(
    prod_steps[0], prod_steps[1:],
    col_widths=[0.6*inch, 1.6*inch, 3.8*inch]
))
story.append(Spacer(1, 10))

story.append(Paragraph(
    "<b>Importante:</b> Si el stock de algun ingrediente es insuficiente, el sistema mostrara una alerta "
    "indicando que ingredientes faltan y en que cantidad. No sera posible ejecutar la produccion hasta "
    "que se reponga el stock necesario.",
    style_body
))
story.append(Spacer(1, 6))
story.append(Paragraph(
    "Ejemplo: Para producir 20 unidades de tallarines artesanales, el sistema consumira automaticamente "
    "1 kg de harina, 6 huevos y 0.05 l de aceite de oliva de la receta, y sumara 20 unidades al stock "
    "de producto terminado.",
    style_muted
))

story.append(PageBreak())

# ===== SECTION 9: Gestion de Personas =====
story.extend(heading1_with_bookmark("9. Gestion de Personas", "sec9"))

story.append(Paragraph(
    "El modulo de Personas permite administrar la informacion de clientes, proveedores y empleados "
    "de la empresa. Tambien incluye la gestion de usuarios del sistema y sus permisos de acceso.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Clientes, proveedores y empleados", "sec9_1"))
story.append(Paragraph(
    "Para acceder a la gestion de personas, navegue a <b>/admin/personas</b>. Cada persona puede "
    "tener multiples datos de contacto, direccion y ubicacion en mapa.",
    style_body
))
story.append(Spacer(1, 4))

personas_fields = [
    ["Campo", "Descripcion"],
    ["Datos personales", "Nombre, apellido, tipo y numero de documento"],
    ["Contacto", "Multiples medios de contacto (telefono, email, WhatsApp)"],
    ["Direccion", "Domicilio completo con localidad y provincia"],
    ["Ubicacion en mapa", "Coordenadas geograficas para visualizacion en mapa"],
    ["Tipo", "Cliente, proveedor, empleado o combinacion de estos"],
]
story.append(make_table(
    personas_fields[0], personas_fields[1:],
    col_widths=[1.6*inch, 4.4*inch]
))
story.append(Spacer(1, 10))

story.extend(heading2_with_bookmark("Gestion de usuarios del sistema", "sec9_2"))
story.append(Paragraph(
    "Para gestionar los usuarios con acceso al sistema, navegue a <b>/admin/usuarios</b>. "
    "Desde aqui puede crear, editar y desactivar usuarios, asignarles roles y configurar sus permisos.",
    style_body
))
story.append(Spacer(1, 4))

story.extend(heading2_with_bookmark("Roles y permisos", "sec9_3"))
story.append(Paragraph(
    "Para administrar los roles y permisos del sistema, navegue a <b>/admin/usuarios/permisos</b>. "
    "Los roles definen que modulos y acciones puede realizar cada usuario dentro del sistema. "
    "Los permisos se asignan por rol y pueden ser configurados de manera granular para cada funcionalidad.",
    style_body
))

story.append(PageBreak())

# ===== SECTION 10: Moderacion de Opiniones =====
story.extend(heading1_with_bookmark("10. Moderacion de Opiniones", "sec10"))

story.append(Paragraph(
    "El modulo de Opiniones permite moderar las valoraciones y comentarios que los clientes "
    "envian desde la landing page. Solo las opiniones aprobadas se muestran publicamente.",
    style_body
))
story.append(Spacer(1, 8))

story.append(Paragraph(
    "Para acceder a la moderacion de opiniones, navegue a <b>/admin/opiniones</b>.",
    style_body
))
story.append(Spacer(1, 6))

story.extend(bullet_list([
    "<b>Ver opiniones pendientes:</b> Se muestran las opiniones que aun no han sido moderadas.",
    "<b>Aprobar opiniones:</b> Al aprobar una opinion, esta se publica en la landing page para que "
    "todos los visitantes puedan verla.",
    "<b>Rechazar opiniones:</b> Las opiniones rechazadas no se muestran publicamente pero se "
    "conservan en el sistema como registro.",
    "<b>Responder opiniones:</b> Puede agregar una respuesta del establecimiento a cada opinion "
    "aprobada, brindando atencion personalizada al cliente.",
]))
story.append(Spacer(1, 8))

opiniones_table = [
    ["Accion", "Efecto"],
    ["Aprobar", "La opinion se publica en la landing page"],
    ["Rechazar", "La opinion no se publica pero queda registrada"],
    ["Responder", "Se agrega una respuesta del establecimiento"],
]
story.append(make_table(
    opiniones_table[0], opiniones_table[1:],
    col_widths=[1.5*inch, 4.5*inch]
))

story.append(PageBreak())

# ===== SECTION 11: Gestion de Envios y Logistica =====
story.extend(heading1_with_bookmark("11. Gestion de Envios y Logistica", "sec11"))

story.append(Paragraph(
    "El modulo de Logistica permite gestionar las entregas de productos, definir puntos de encuentro "
    "y visualizar rutas en mapas interactivos. Facilita la planificacion y seguimiento de cada entrega.",
    style_body
))
story.append(Spacer(1, 8))

logistica_modules = [
    ["Modulo", "Ruta", "Descripcion"],
    ["Entregas", "/admin/logistica/entregas", "Gestion de entregas con estados y seguimiento"],
    ["Puntos de encuentro", "/admin/logistica/puntos-encuentro", "Lugares de entrega predefinidos"],
    ["Mapa de entregas", "/admin/logistica/mapa-entregas", "Visualizacion geografica de entregas"],
    ["Mapa de proveedores", "/admin/logistica/mapa-proveedores", "Ubicacion de proveedores en mapa"],
]
story.append(make_table(
    logistica_modules[0], logistica_modules[1:],
    col_widths=[1.5*inch, 2.5*inch, 2.0*inch]
))
story.append(Spacer(1, 10))

story.extend(heading2_with_bookmark("Estados de entrega", "sec11_1"))
story.append(Paragraph(
    "Cada entrega puede tener los siguientes estados:",
    style_body
))
story.append(Spacer(1, 4))

estados_table = [
    ["Estado", "Descripcion"],
    ["Programado", "La entrega esta planificada para una fecha y hora determinada"],
    ["En camino", "El repartidor ha iniciado el recorrido de entrega"],
    ["Entregado", "La entrega se ha completado exitosamente"],
    ["Cancelado", "La entrega ha sido cancelada por algun motivo"],
]
story.append(make_table(
    estados_table[0], estados_table[1:],
    col_widths=[1.3*inch, 4.7*inch]
))
story.append(Spacer(1, 10))

story.append(Paragraph(
    "Los mapas interactivos permiten visualizar la ubicacion de entregas y proveedores, facilitando "
    "la planificacion de rutas optimas. El sistema utiliza Leaflet como motor de mapas con datos de "
    "OpenStreetMap.",
    style_body
))

story.append(PageBreak())

# ===== SECTION 12: Generacion de Etiquetas =====
story.extend(heading1_with_bookmark("12. Generacion de Etiquetas", "sec12"))

story.append(Paragraph(
    "El modulo de Etiquetas permite generar etiquetas para los productos terminados, incluyendo "
    "codigo de barras y codigo QR. Las etiquetas se generan en formato PDF listas para imprimir.",
    style_body
))
story.append(Spacer(1, 8))

story.append(Paragraph(
    "Para generar etiquetas, navegue a <b>/admin/etiquetas</b> y siga estos pasos:",
    style_body
))
story.append(Spacer(1, 4))

story.extend(bullet_list([
    "<b>Seleccionar producto:</b> Elija el producto para el cual desea generar la etiqueta.",
    "<b>Elegir tamano:</b> Seleccione entre tamano grande o pequeno segun sus necesidades.",
    "<b>Generar PDF:</b> El sistema genera un archivo PDF con la etiqueta, incluyendo el nombre "
    "del producto, codigo de barras y codigo QR.",
]))
story.append(Spacer(1, 8))

etiquetas_table = [
    ["Tamano", "Uso recomendado"],
    ["Grande", "Etiqueta principal del producto para exhibicion en gondola"],
    ["Pequeno", "Etiqueta complementaria o para productos individuales"],
]
story.append(make_table(
    etiquetas_table[0], etiquetas_table[1:],
    col_widths=[1.3*inch, 4.7*inch]
))
story.append(Spacer(1, 10))

story.append(Paragraph(
    "El codigo de barras permite la lectura rapida del producto en el punto de venta, mientras que "
    "el codigo QR puede direccionar a la pagina del producto en la landing page o a informacion "
    "adicional del mismo.",
    style_body
))

story.append(PageBreak())

# ===== SECTION 13: Reportes y Estadisticas =====
story.extend(heading1_with_bookmark("13. Reportes y Estadisticas", "sec13"))

story.append(Paragraph(
    "El modulo de Reportes permite generar informes detallados sobre las diferentes areas del "
    "negocio. Los reportes pueden exportarse en formato Excel (XLSX) o PDF para su analisis "
    "o archivo.",
    style_body
))
story.append(Spacer(1, 8))

reportes_table = [
    ["Tipo de reporte", "Descripcion", "Formatos"],
    ["Stock", "Inventario actual de productos, materias primas e insumos", "XLSX, PDF"],
    ["Ventas", "Detalle de ventas por periodo, producto o cliente", "XLSX, PDF"],
    ["Compras", "Detalle de compras por periodo o proveedor", "XLSX, PDF"],
    ["Produccion", "Historial de produccion con ingredientes consumidos", "XLSX, PDF"],
    ["Finanzas", "Resumen financiero con ingresos, egresos y balances", "XLSX, PDF"],
    ["Hoja de ruta", "Listado de entregas del dia con datos del cliente", "PDF"],
    ["Pedidos del dia", "Resumen de pedidos pendientes para el dia actual", "PDF"],
]
story.append(make_table(
    reportes_table[0], reportes_table[1:],
    col_widths=[1.3*inch, 3.2*inch, 1.2*inch]
))
story.append(Spacer(1, 10))

story.append(Paragraph(
    "Para generar un reporte, navegue a la seccion correspondiente dentro de <b>/admin/reportes</b>, "
    "seleccione los filtros deseados (periodo, producto, cliente, etc.) y elija el formato de "
    "exportacion. El sistema generara el archivo automaticamente para su descarga.",
    style_body
))

story.append(PageBreak())

# ===== SECTION 14: Consultas y Notificaciones =====
story.extend(heading1_with_bookmark("14. Consultas y Notificaciones", "sec14"))

story.append(Paragraph(
    "El sistema incluye un modulo de consultas y notificaciones que permite gestionar las comunicaciones "
    "con los clientes y configurar alertas automaticas para eventos relevantes del negocio.",
    style_body
))
story.append(Spacer(1, 8))

story.extend(heading2_with_bookmark("Consultas recibidas", "sec14_1"))
story.append(Paragraph(
    "Las consultas que los clientes envian desde el formulario de contacto de la landing page se "
    "registran en <b>/admin/consultas</b>. Cada consulta incluye el nombre del cliente, su email "
    "y el mensaje enviado. El administrador puede responder directamente desde el sistema.",
    style_body
))
story.append(Spacer(1, 6))

story.extend(heading2_with_bookmark("Notificaciones", "sec14_2"))
story.append(Paragraph(
    "El sistema envia notificaciones automaticas al administrador por WhatsApp y email cuando "
    "se reciben nuevas consultas o se producen eventos relevantes.",
    style_body
))
story.append(Spacer(1, 4))

notif_modules = [
    ["Modulo", "Ruta", "Funcionalidad"],
    ["Plantillas", "/admin/notificaciones/plantillas", "Configuracion de plantillas de notificacion"],
    ["Historial", "/admin/notificaciones/historial", "Registro de notificaciones enviadas"],
    ["Alertas", "/admin/notificaciones/alertas", "Configuracion de alertas automaticas"],
]
story.append(make_table(
    notif_modules[0], notif_modules[1:],
    col_widths=[1.2*inch, 2.5*inch, 2.3*inch]
))
story.append(Spacer(1, 10))

story.extend(heading2_with_bookmark("Alertas configurables", "sec14_3"))
story.append(Paragraph(
    "Las alertas automaticas permiten al administrador recibir notificaciones proactivas sobre "
    "situaciones que requieren atencion. Las alertas disponibles son:",
    style_body
))
story.extend(bullet_list([
    "<b>Stock bajo:</b> Se activa cuando el stock de una materia prima, insumo o producto terminado "
    "cae por debajo del nivel minimo configurado.",
    "<b>Pedidos pendientes:</b> Alerta sobre pedidos de clientes que estan pendientes de procesamiento "
    "o entrega.",
    "<b>Entregas proximas:</b> Notifica sobre entregas programadas para las proximas horas.",
]))

story.append(PageBreak())

# ===== SECTION 15: Preguntas Frecuentes =====
story.extend(heading1_with_bookmark("15. Preguntas Frecuentes", "sec15"))

story.append(Paragraph(
    "A continuacion se presentan las respuestas a las consultas mas habituales sobre el uso del sistema.",
    style_body
))
story.append(Spacer(1, 12))

# FAQ 1
story.append(Paragraph(
    '<font color="#502ac2"><b>Como recupero mi contrasena?</b></font>',
    style_heading3
))
story.append(Paragraph(
    "En la pantalla de inicio de sesion, haga clic en el enlace 'Olivide mi contrasena'. "
    "Ingrese su direccion de correo electronico asociada a su cuenta y recibira un enlace para "
    "restablecer su contrasena. El enlace es valido por un periodo limitado por razones de seguridad.",
    style_body
))
story.append(Spacer(1, 10))

# FAQ 2
story.append(Paragraph(
    '<font color="#502ac2"><b>Como activo la autenticacion de dos factores (2FA)?</b></font>',
    style_heading3
))
story.append(Paragraph(
    "Para activar la autenticacion de dos factores, acceda a su perfil de usuario y seleccione la "
    "opcion 'Autenticacion de dos factores' en la seccion de seguridad. Siga los pasos indicados "
    "para vincular su cuenta con una aplicacion autenticadora (como Google Authenticator o Authy). "
    "Esta medida agrega una capa adicional de seguridad a su cuenta.",
    style_body
))
story.append(Spacer(1, 10))

# FAQ 3
story.append(Paragraph(
    '<font color="#502ac2"><b>Como cambio los productos que se muestran en la landing page?</b></font>',
    style_heading3
))
story.append(Paragraph(
    "Para que un producto aparezca en la landing page, debe marcarlo como 'destacado' y ademas "
    "activar la opcion 'visible en landing' en la ficha del producto. Solo los productos que "
    "cumplan ambas condiciones se mostraran en la pagina publica. Para realizar estos cambios, "
    "edite el producto desde <b>/admin/productos-terminados</b> y actualice los campos correspondientes.",
    style_body
))
story.append(Spacer(1, 10))

# FAQ 4
story.append(Paragraph(
    '<font color="#502ac2"><b>Como exporto reportes?</b></font>',
    style_heading3
))
story.append(Paragraph(
    "Desde cada seccion de reportes en <b>/admin/reportes</b>, seleccione el tipo de reporte deseado, "
    "aplique los filtros necesarios (periodo, producto, cliente, etc.) y elija el formato de exportacion: "
    "Excel (XLSX) para analisis de datos o PDF para presentaciones y archivo. El archivo se generara "
    "automaticamente y se descargara a su equipo.",
    style_body
))
story.append(Spacer(1, 10))

# FAQ 5
story.append(Paragraph(
    '<font color="#502ac2"><b>Que hago si el stock de un ingrediente es insuficiente para producir?</b></font>',
    style_heading3
))
story.append(Paragraph(
    "Si al intentar ejecutar una produccion el sistema detecta que no hay stock suficiente de uno o mas "
    "ingredientes, mostrara una alerta indicando los faltantes. Debera registrar una compra del ingrediente "
    "faltante (desde <b>/admin/compras</b>) antes de poder ejecutar la produccion. El sistema no permitira "
    "iniciar la produccion hasta que todo el stock necesario este disponible.",
    style_body
))
story.append(Spacer(1, 10))

# FAQ 6
story.append(Paragraph(
    '<font color="#502ac2"><b>Como convierto un presupuesto en un pedido?</b></font>',
    style_heading3
))
story.append(Paragraph(
    "En la seccion de presupuestos (<b>/admin/presupuestos</b>), abra el presupuesto que desea convertir "
    "y haga clic en la opcion 'Convertir a pedido'. El sistema creara automaticamente un nuevo pedido "
    "de cliente con todos los datos del presupuesto (productos, cantidades, cliente, etc.) y cambiara "
    "el estado del presupuesto a 'Convertido'.",
    style_body
))


# ── Build the PDF ──
OUTPUT_PATH = "/home/z/my-project/docs/manual_body.pdf"

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    topMargin=inch,
    bottomMargin=inch,
    leftMargin=inch,
    rightMargin=inch,
    title="Manual de Usuario - Pastas Orlando",
    author="Pastas Orlando",
    subject="Manual de Usuario del Sistema ERP Pastas Orlando",
)

doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)

print(f"Body PDF generated: {OUTPUT_PATH}")
