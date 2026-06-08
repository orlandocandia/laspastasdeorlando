#!/usr/bin/env python3
"""
Generate the body PDF for Manual Tecnico - Pastas Orlando
using ReportLab with TOC, tables, and all 10 sections.
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem,
    Flowable, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.fonts import addMapping
import os

# ── Color Palette ──
ACCENT       = colors.HexColor('#1b7796')
TEXT_PRIMARY  = colors.HexColor('#1c1d1f')
TEXT_MUTED    = colors.HexColor('#7b8087')
BG_SURFACE   = colors.HexColor('#e1e4e8')
BG_PAGE      = colors.HexColor('#f3f4f5')
TABLE_HEADER_COLOR = ACCENT
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = BG_SURFACE

# ── Page dimensions ──
PAGE_W, PAGE_H = A4  # 595.27 x 841.89 pt
MARGIN = 1 * inch

# ── Output path ──
OUTPUT_PDF = os.path.join(os.path.dirname(__file__), "body_manual.pdf")

# ── Font registration ──
# Try to register Times New Roman, fall back to Times-Roman
try:
    font_dir = "/usr/share/fonts/truetype/msttcorefonts"
    if os.path.exists(os.path.join(font_dir, "Times_New_Roman.ttf")):
        pdfmetrics.registerFont(TTFont('TimesNewRoman', os.path.join(font_dir, 'Times_New_Roman.ttf')))
        pdfmetrics.registerFont(TTFont('TimesNewRoman-Bold', os.path.join(font_dir, 'Times_New_Roman_Bold.ttf')))
        pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic', os.path.join(font_dir, 'Times_New_Roman_Italic.ttf')))
        pdfmetrics.registerFont(TTFont('TimesNewRoman-BoldItalic', os.path.join(font_dir, 'Times_New_Roman_Bold_Italic.ttf')))
        addMapping('TimesNewRoman', 0, 0, 'TimesNewRoman')
        addMapping('TimesNewRoman', 1, 0, 'TimesNewRoman-Bold')
        addMapping('TimesNewRoman', 0, 1, 'TimesNewRoman-Italic')
        addMapping('TimesNewRoman', 1, 1, 'TimesNewRoman-BoldItalic')
        FONT = 'TimesNewRoman'
        FONT_BOLD = 'TimesNewRoman-Bold'
        FONT_ITALIC = 'TimesNewRoman-Italic'
        FONT_BOLDITALIC = 'TimesNewRoman-BoldItalic'
    else:
        raise FileNotFoundError("No TTF fonts")
except Exception:
    FONT = 'Times-Roman'
    FONT_BOLD = 'Times-Bold'
    FONT_ITALIC = 'Times-Italic'
    FONT_BOLDITALIC = 'Times-BoldItalic'

# ── Styles ──
styles = getSampleStyleSheet()

style_body = ParagraphStyle(
    'BodyCustom',
    parent=styles['Normal'],
    fontName=FONT,
    fontSize=11,
    leading=16.5,  # 1.5x
    textColor=TEXT_PRIMARY,
    alignment=TA_JUSTIFY,
    spaceAfter=6,
)

style_heading1 = ParagraphStyle(
    'H1Custom',
    parent=styles['Heading1'],
    fontName=FONT_BOLD,
    fontSize=20,
    leading=30,
    textColor=ACCENT,
    spaceBefore=18,
    spaceAfter=12,
    alignment=TA_LEFT,
)

style_heading2 = ParagraphStyle(
    'H2Custom',
    parent=styles['Heading2'],
    fontName=FONT_BOLD,
    fontSize=14,
    leading=21,
    textColor=ACCENT,
    spaceBefore=14,
    spaceAfter=8,
    alignment=TA_LEFT,
)

style_toc_h1 = ParagraphStyle(
    'TOCH1',
    fontName=FONT_BOLD,
    fontSize=13,
    leading=20,
    textColor=TEXT_PRIMARY,
    leftIndent=0,
)

style_toc_h2 = ParagraphStyle(
    'TOCH2',
    fontName=FONT,
    fontSize=11,
    leading=18,
    textColor=TEXT_MUTED,
    leftIndent=20,
)

style_table_header = ParagraphStyle(
    'TableHeader',
    fontName=FONT_BOLD,
    fontSize=9,
    leading=13,
    textColor=TABLE_HEADER_TEXT,
    alignment=TA_CENTER,
)

style_table_cell = ParagraphStyle(
    'TableCell',
    fontName=FONT,
    fontSize=9,
    leading=13,
    textColor=TEXT_PRIMARY,
    alignment=TA_LEFT,
)

style_table_cell_center = ParagraphStyle(
    'TableCellCenter',
    fontName=FONT,
    fontSize=9,
    leading=13,
    textColor=TEXT_PRIMARY,
    alignment=TA_CENTER,
)

style_bullet = ParagraphStyle(
    'BulletCustom',
    parent=style_body,
    leftIndent=20,
    bulletIndent=8,
    spaceBefore=2,
    spaceAfter=2,
)

style_code = ParagraphStyle(
    'CodeCustom',
    fontName='Courier',
    fontSize=8,
    leading=11,
    textColor=TEXT_PRIMARY,
    backColor=BG_SURFACE,
    leftIndent=10,
    rightIndent=10,
    spaceBefore=4,
    spaceAfter=4,
    borderPadding=6,
)

style_sub_bullet = ParagraphStyle(
    'SubBulletCustom',
    parent=style_body,
    leftIndent=40,
    bulletIndent=28,
    fontSize=10,
    leading=15,
    spaceBefore=1,
    spaceAfter=1,
)

# ── Helper: build a table with header + rows ──
def make_table(headers, rows, col_widths=None):
    """Build a professional table with Paragraph-wrapped cells."""
    available = PAGE_W - 2 * MARGIN
    if col_widths is None:
        n = len(headers)
        col_widths = [available / n] * n

    # Ensure col_widths sum matches available width
    total_w = sum(col_widths)
    if total_w != available:
        scale = available / total_w
        col_widths = [w * scale for w in col_widths]

    header_row = [Paragraph(h, style_table_header) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), style_table_cell) for c in row])

    n_cols = len(headers)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#c0c4c8')),
        ('FONTNAME', (0, 1), (-1, -1), FONT),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    # Alternating row colors
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=1)
    t.setStyle(TableStyle(style_cmds))
    return t


# ── Helper: bullet list ──
def bullet(text, style=None):
    if style is None:
        style = style_bullet
    return Paragraph(f"&bull; {text}", style)

def sub_bullet(text):
    return Paragraph(f"- {text}", style_sub_bullet)

# ── Helper: code block (monospaced) ──
def code_block(text):
    lines = text.strip().split('\n')
    formatted = '<br/>'.join(line.replace(' ', '&nbsp;').replace('<', '&lt;').replace('>', '&gt;') for line in lines)
    return Paragraph(formatted, style_code)

# ── Helper: section divider ──
def section_divider():
    return HRFlowable(width="100%", thickness=1, color=ACCENT, spaceAfter=8, spaceBefore=8)

# ── Custom doc template with page numbers ──
class ManualDocTemplate(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        SimpleDocTemplate.__init__(self, *args, **kwargs)
        self.page_count = 0

    def afterPage(self):
        self.page_count += 1


def add_page_number(canvas, doc):
    """Draw page number in footer."""
    canvas.saveState()
    canvas.setFont(FONT, 9)
    canvas.setFillColor(TEXT_MUTED)
    page_num = canvas.getPageNumber()
    text = f"- {page_num} -"
    canvas.drawCentredString(PAGE_W / 2, 0.5 * inch, text)
    canvas.restoreState()


def add_header_footer(canvas, doc):
    """Draw header line and page number."""
    canvas.saveState()
    # Header line
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, PAGE_H - 0.7 * inch, PAGE_W - MARGIN, PAGE_H - 0.7 * inch)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, PAGE_H - 0.65 * inch, "Manual Tecnico - Pastas Orlando")
    canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.65 * inch, "Documento confidencial")

    # Footer page number
    page_num = canvas.getPageNumber()
    canvas.setFont(FONT, 9)
    canvas.setFillColor(TEXT_MUTED)
    text = f"- {page_num} -"
    canvas.drawCentredString(PAGE_W / 2, 0.5 * inch, text)

    # Footer line
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 0.7 * inch, PAGE_W - MARGIN, 0.7 * inch)
    canvas.restoreState()


# ── Build the story ──
def build_story():
    story = []
    avail = PAGE_W - 2 * MARGIN

    # ================================================================
    # TABLE OF CONTENTS (will be on first body page)
    # ================================================================
    story.append(Paragraph("Indice", style_heading1))
    story.append(Spacer(1, 12))

    toc_entries = [
        ("1", "Resumen del proyecto"),
        ("2", "Arquitectura del sistema"),
        ("3", "Estructura de carpetas"),
        ("4", "Modelo de datos (Prisma)"),
        ("5", "Modulos principales y API endpoints"),
        ("6", "Variables de entorno (.env)"),
        ("7", "Despliegue"),
        ("8", "Seguridad"),
        ("9", "Dependencias principales"),
        ("10", "Guia de instalacion local"),
    ]
    for num, title in toc_entries:
        story.append(Paragraph(f"<b>{num}.</b>  {title}", style_toc_h1))
    story.append(PageBreak())

    # ================================================================
    # 1. RESUMEN DEL PROYECTO
    # ================================================================
    story.append(Paragraph("1. Resumen del proyecto", style_heading1))
    story.append(section_divider())

    summary_data = [
        ["Nombre", "Pastas Orlando"],
        ["Tipo", "ERP + E-commerce + Landing page"],
        ["Tecnologia principal", "Next.js 16 + TypeScript + Tailwind CSS 4 + Prisma + Turso (libSQL)"],
        ["Despliegue", "Vercel (produccion), SQLite (desarrollo local)"],
        ["Dominio", "https://laspastasdeorlando.com.ar"],
        ["Repositorio", "https://github.com/orlandocandia/laspastasdeorlando"],
    ]
    story.append(make_table(
        ["Campo", "Detalle"],
        summary_data,
        col_widths=[avail * 0.3, avail * 0.7]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "Pastas Orlando es un sistema integral que combina un ERP para la gestion interna de la empresa de pastas, "
        "una plataforma de e-commerce para la venta online, y una landing page publica para la captacion de clientes. "
        "El sistema esta construido con tecnologias modernas y desplegado en la nube, ofreciendo una solucion completa "
        "para la administracion de produccion, inventario, ventas, compras, logistica y seguridad.",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 2. ARQUITECTURA DEL SISTEMA
    # ================================================================
    story.append(Paragraph("2. Arquitectura del sistema", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El sistema sigue una arquitectura moderna basada en Next.js con App Router, donde el frontend y backend "
        "coexisten en una sola aplicacion. A continuacion se detallan las tecnologias utilizadas en cada capa:",
        style_body
    ))
    story.append(Spacer(1, 8))

    arch_rows = [
        ["Frontend", "Next.js 16 (App Router), React 19 Server Components, Tailwind CSS 4, shadcn/ui"],
        ["Backend", "Next.js API Routes (60+ endpoints)"],
        ["Base de datos", "Turso (libSQL) en produccion / SQLite en desarrollo, via Prisma ORM"],
        ["Autenticacion", "NextAuth.js v4 (Credentials provider + 2FA con Speakeasy TOTP)"],
        ["Notificaciones", "Nodemailer (SMTP pooled) + WhatsApp (TextMeBot API)"],
        ["Mapas", "Leaflet + OpenStreetMap"],
        ["Reportes", "SheetJS (Excel/XLSX), @react-pdf/renderer (PDF), jsPDF"],
        ["Subida de imagenes", "Vercel Blob Storage + fallback local"],
        ["Estado", "Zustand (cliente) + TanStack React Query (servidor)"],
        ["Formularios", "React Hook Form + Zod validation"],
    ]
    story.append(make_table(
        ["Capa", "Tecnologia"],
        arch_rows,
        col_widths=[avail * 0.25, avail * 0.75]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "La arquitectura se beneficia de los React Server Components para renderizado del lado del servidor, "
        "reduciendo el JavaScript enviado al cliente. Las API Routes actuan como un backend RESTful completo, "
        "conectandose a la base de datos Turso mediante Prisma ORM que abstrae las diferencias entre SQLite "
        "(desarrollo local) y libSQL (produccion).",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 3. ESTRUCTURA DE CARPETAS
    # ================================================================
    story.append(Paragraph("3. Estructura de carpetas", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El proyecto sigue la estructura estandar de Next.js con App Router, organizando los componentes "
        "por funcionalidad y manteniendo una separacion clara entre logica de negocio y presentacion:",
        style_body
    ))
    story.append(Spacer(1, 8))

    folder_lines = """src/
+-- app/                    # Rutas (App Router) + API endpoints
|   +-- (dashboard)/admin/  # Dashboard privado
|   +-- (auth)/             # Paginas de autenticacion
|   +-- api/                # 60+ API endpoints
+-- components/
|   +-- sections/           # Secciones de la landing page
|   +-- admin/              # Componentes del dashboard
|   +-- ui/                 # Componentes shadcn/ui (40+)
|   +-- layout/             # Navbar, Footer, ScrollToTop
|   +-- icons/              # Iconos custom (WhatsApp, MercadoPago)
|   +-- opiniones/          # Formulario y carrusel de opiniones
|   +-- logistica/          # Mapas Leaflet
|   +-- print/              # Vistas de impresion (etiquetas, hoja ruta)
+-- hooks/                  # Custom React hooks
+-- lib/                    # Utilidades y servicios compartidos
|   +-- db.ts               # Prisma client (auto-detecta SQLite/Turso)
|   +-- auth-helpers.ts     # requireAuth(), requireRole(), requireAdmin()
|   +-- permisos-service.ts # Verificacion de permisos por modulo
|   +-- auditoria-service.ts# Registro de auditoria
|   +-- email.ts            # Envio de emails HTML (password reset)
|   +-- smtp-transporter.ts # Transporter SMTP pooled (pool: true)
|   +-- whatsapp-admin.ts   # WhatsApp via TextMeBot
|   +-- upload.ts           # Subida de imagenes (Vercel Blob + local)
|   +-- notificaciones-service.ts # Notificaciones + alertas automaticas
|   +-- utils.ts            # cn() class merge
+-- instrumentation.ts      # Setup de variables Turso
prisma/
+-- schema.prisma           # 40 modelos
+-- seed.ts / seed-completo.ts
public/
+-- images/                 # Assets estaticos
+-- logo.svg"""

    story.append(code_block(folder_lines))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "La carpeta <b>app/</b> contiene las rutas del App Router de Next.js, organizadas en route groups "
        "como (dashboard) y (auth) para layouts compartidos. La carpeta <b>components/</b> separa los "
        "componentes por dominio funcional, mientras que <b>lib/</b> centraliza la logica de negocio "
        "y servicios compartidos.",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 4. MODELO DE DATOS (PRISMA)
    # ================================================================
    story.append(Paragraph("4. Modelo de datos (Prisma)", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El esquema de Prisma define 40 modelos organizados por modulo funcional. Esta estructura refleja "
        "la complejidad del sistema ERP y permite una gestion completa del ciclo de negocio de la empresa:",
        style_body
    ))
    story.append(Spacer(1, 8))

    model_rows = [
        ["Landing page", "Producto, Opinion, InteraccionWhatsApp, Consulta"],
        ["Geografia", "Pais, Provincia, Departamento, Municipio"],
        ["Personas", "Persona, Contacto, TipoPersona, TipoContacto, Direccion, TipoDireccion"],
        ["Usuarios", "Usuario, Rol, UsuarioRol, Permiso, RolPermiso, Sesion"],
        ["Inventario", "UnidadMedida, MateriaPrima, CategoriaMateriaPrima, Insumo, TipoInsumo, Marca, ProductoTerminado, CategoriaProductoTerminado"],
        ["Recetas/Produccion", "Receta, DetalleReceta, Produccion, DetalleProduccionConsumo, DetalleProduccionGenerado"],
        ["Comercio", "Compra, DetalleCompra, PedidoProveedor, DetallePedidoProveedor, PedidoCliente, DetallePedidoCliente, Venta, DetalleVenta, Presupuesto, DetallePresupuesto, ReservaCliente, FormaPago, EstadoGeneral"],
        ["Stock/Auditoria", "StockMovement, Auditoria"],
        ["Seguridad", "Usuario2FA, LogAcceso, SesionActiva"],
        ["Logistica", "PuntoEncuentro, Entrega, NotificacionEntrega"],
        ["Notificaciones", "PlantillaNotificacion, Notificacion, AlertaConfiguracion"],
        ["Recuperacion", "PasswordReset"],
    ]
    story.append(make_table(
        ["Modulo", "Modelos"],
        model_rows,
        col_widths=[avail * 0.2, avail * 0.8]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "El modelo de datos implementa un sistema de permisos granular con las entidades <b>Rol</b>, "
        "<b>Permiso</b> y <b>RolPermiso</b>, permitiendo asignaciones flexibles. El modulo de Comercio "
        "es el mas extenso, cubriendo el ciclo completo desde compras a proveedores hasta ventas a clientes, "
        "incluyendo presupuestos y reservas. El sistema de auditoria registra todas las acciones criticas "
        "para trazabilidad completa.",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 5. MODULOS PRINCIPALES Y API ENDPOINTS
    # ================================================================
    story.append(Paragraph("5. Modulos principales y API endpoints", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El sistema expone mas de 60 API endpoints organizados por modulo funcional. A continuacion se "
        "detallan los principales endpoints y sus metodos HTTP disponibles:",
        style_body
    ))
    story.append(Spacer(1, 8))

    api_rows = [
        ["Productos terminados", "/api/productos-terminados", "GET, POST"],
        ["Materias primas", "/api/materias-primas", "GET, POST"],
        ["Insumos", "/api/insumos", "GET, POST"],
        ["Recetas", "/api/recetas", "GET, POST"],
        ["Produccion", "/api/produccion", "GET, POST"],
        ["Compras", "/api/compras", "GET, POST"],
        ["Ventas", "/api/ventas", "GET, POST"],
        ["Pedidos clientes", "/api/pedidos-clientes", "GET, POST"],
        ["Presupuestos", "/api/presupuestos", "GET, POST"],
        ["Personas", "/api/personas", "GET, POST"],
        ["Usuarios", "/api/usuarios", "GET, POST"],
        ["Opiniones", "/api/opiniones", "GET, POST, PATCH"],
        ["Consultas", "/api/consultas", "GET, POST, PATCH"],
        ["Entregas", "/api/logistica/entregas", "GET, POST"],
        ["Puntos encuentro", "/api/logistica/puntos-encuentro", "GET, POST"],
        ["Reportes stock", "/api/reportes/stock", "GET"],
        ["Reportes ventas", "/api/reportes/ventas", "GET"],
        ["Reportes compras", "/api/reportes/compras", "GET"],
        ["Autenticacion", "/api/auth/[...nextauth]", "POST"],
        ["2FA", "/api/2fa/activate, verify, disable", "POST"],
        ["Seguridad", "/api/seguridad/roles, sesiones, logs-acceso", "GET"],
        ["Notificaciones", "/api/notificaciones/*", "GET, POST"],
        ["Subida imagenes", "/api/upload/[...slug]", "POST"],
    ]
    story.append(make_table(
        ["Modulo", "Endpoint", "Metodos"],
        api_rows,
        col_widths=[avail * 0.22, avail * 0.48, avail * 0.30]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "Cada endpoint implementa validacion de permisos mediante los helpers <b>requireAuth()</b>, "
        "<b>requireRole()</b> y <b>requireAdmin()</b>. Los endpoints de escritura (POST, PATCH, DELETE) "
        "registran automaticamente entradas en la tabla de auditoria. Los endpoints de reportes generan "
        "archivos exportables en formatos Excel, PDF y CSV.",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 6. VARIABLES DE ENTORNO
    # ================================================================
    story.append(Paragraph("6. Variables de entorno (.env)", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "Las siguientes variables de entorno son necesarias para la configuracion del sistema. "
        "Las marcadas como (requerido) son obligatorias para el funcionamiento:",
        style_body
    ))
    story.append(Spacer(1, 8))

    env_rows = [
        ["DATABASE_URL", "URL de conexion Prisma", "file:./db/custom.db"],
        ["DATABASE_AUTH_TOKEN", "Token Turso (produccion)", "(solo prod)"],
        ["NEXTAUTH_SECRET", "Clave JWT", "(requerido)"],
        ["NEXTAUTH_URL", "URL base NextAuth", "https://laspastasdeorlando.com.ar"],
        ["NEXT_PUBLIC_APP_URL", "URL publica para emails", "https://laspastasdeorlando.com.ar"],
        ["SMTP_HOST", "Servidor SMTP", "smtp.gmail.com"],
        ["SMTP_PORT", "Puerto SMTP", "587"],
        ["SMTP_USER", "Usuario SMTP", "laspastasdeorlando@gmail.com"],
        ["SMTP_PASS", "Contrasena app Gmail", "(app password)"],
        ["BLOB_READ_WRITE_TOKEN", "Token Vercel Blob", "(solo prod)"],
        ["ADMIN_EMAIL", "Email admin", "(requerido)"],
        ["ADMIN_WHATSAPP", "WhatsApp admin", "543754419324"],
        ["TEXTMEBOT_APIKEY", "API key TextMeBot", "(opcional)"],
    ]
    story.append(make_table(
        ["Variable", "Descripcion", "Ejemplo"],
        env_rows,
        col_widths=[avail * 0.28, avail * 0.40, avail * 0.32]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "En desarrollo local, se utiliza el archivo <b>.env.local</b> para definir estas variables. "
        "El archivo <b>.env.example</b> del repositorio contiene una plantilla con todas las variables "
        "necesarias. La variable <b>DATABASE_AUTH_TOKEN</b> solo se requiere en produccion para la "
        "conexion con Turso; en desarrollo local se usa SQLite sin token.",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 7. DESPLIEGUE
    # ================================================================
    story.append(Paragraph("7. Despliegue", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El sistema se despliega de forma automatica a traves de Vercel, con un flujo CI/CD integrado "
        "con GitHub. A continuacion se detallan los aspectos clave del despliegue:",
        style_body
    ))
    story.append(Spacer(1, 8))

    deploy_data = [
        ["Hosting", "Vercel (standalone output)"],
        ["Base de datos", "Turso (libSQL) en produccion"],
        ["Proceso", "Push a main -> GitHub -> Vercel deploy automatico"],
        ["Imagenes", "Vercel Blob Storage"],
        ["Dominio", "laspastasdeorlando.com.ar (Caddy reverse proxy)"],
    ]
    story.append(make_table(
        ["Aspecto", "Detalle"],
        deploy_data,
        col_widths=[avail * 0.25, avail * 0.75]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "El proceso de despliegue es completamente automatico: al realizar un push a la rama <b>main</b> "
        "del repositorio GitHub, Vercel detecta los cambios y ejecuta el build y despliegue. La configuracion "
        "de Next.js utiliza <b>output: 'standalone'</b> para optimizar el tamanio del bundle. El dominio "
        "personalizado laspastasdeorlando.com.ar esta configurado con Caddy como reverse proxy para "
        "terminacion SSL.",
        style_body
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Flujo de despliegue:", style_heading2))
    story.append(bullet("El desarrollador realiza cambios localmente y hace push a la rama main"))
    story.append(bullet("GitHub recibe el push y notifica a Vercel via webhook"))
    story.append(bullet("Vercel ejecuta npm run build generando el output standalone"))
    story.append(bullet("Vercel despliega la aplicacion en su infraestructura edge"))
    story.append(bullet("La aplicacion se conecta a Turso (libSQL) para la base de datos"))
    story.append(bullet("Las imagenes subidas se almacenan en Vercel Blob Storage"))
    story.append(bullet("El dominio laspastasdeorlando.com.ar apunta a la aplicacion via Caddy"))
    story.append(PageBreak())

    # ================================================================
    # 8. SEGURIDAD
    # ================================================================
    story.append(Paragraph("8. Seguridad", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El sistema implementa un modelo de seguridad multicapa que incluye autenticacion, autorizacion "
        "granular, auditoria completa y proteccion de rutas. A continuacion se detallan los aspectos "
        "principales:",
        style_body
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph("8.1 Autenticacion", style_heading2))
    story.append(bullet("NextAuth.js v4 con Credentials provider"))
    story.append(bullet("2FA opcional: TOTP con Speakeasy + codigos de respaldo"))
    story.append(bullet("Contrasenas hasheadas con bcryptjs"))

    story.append(Paragraph("8.2 Roles y permisos", style_heading2))
    story.append(bullet("Roles definidos: admin, produccion, ventas, lectura"))
    story.append(bullet("Permisos granulares: modulo.accion (ej: productos.crear)"))
    story.append(bullet("Asignacion flexible via tablas RolPermiso y UsuarioRol"))

    story.append(Paragraph("8.3 Sesiones", style_heading2))
    story.append(bullet("JWT con expiracion de 24 horas"))
    story.append(bullet("Registro de sesiones activas en tabla SesionActiva"))
    story.append(bullet("Cierre de sesion remoto disponible para administradores"))

    story.append(Paragraph("8.4 Auditoria", style_heading2))
    story.append(bullet("Registro de todas las acciones: CREATE, UPDATE, DELETE, LOGIN, EXPORT"))
    story.append(bullet("Logs de acceso: intentos de login, IP, user agent, resultado"))
    story.append(bullet("Trazabilidad completa de cambios en datos criticos"))

    story.append(Paragraph("8.5 Proteccion de rutas", style_heading2))
    story.append(bullet("requireAuth(): verifica que el usuario este autenticado"))
    story.append(bullet("requireRole(): verifica que el usuario tenga un rol especifico"))
    story.append(bullet("requireAdmin(): acceso exclusivo para administradores"))
    story.append(Spacer(1, 10))

    security_data = [
        ["Autenticacion", "NextAuth.js v4 + Credentials + 2FA TOTP"],
        ["Autorizacion", "RBAC con permisos granulares (modulo.accion)"],
        ["Sesiones", "JWT 24hs + registro en SesionActiva"],
        ["Auditoria", "Log de acciones (CREATE, UPDATE, DELETE, LOGIN, EXPORT)"],
        ["Logs acceso", "IP, user agent, resultado de intentos de login"],
        ["Proteccion rutas", "requireAuth(), requireRole(), requireAdmin()"],
    ]
    story.append(make_table(
        ["Capa", "Implementacion"],
        security_data,
        col_widths=[avail * 0.25, avail * 0.75]
    ))
    story.append(PageBreak())

    # ================================================================
    # 9. DEPENDENCIAS PRINCIPALES
    # ================================================================
    story.append(Paragraph("9. Dependencias principales", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "El proyecto utiliza un ecosistema amplio de dependencias para cubrir todas las funcionalidades "
        "del ERP. A continuacion se listan las principales organizadas por categoria:",
        style_body
    ))
    story.append(Spacer(1, 8))

    deps_rows = [
        ["Framework", "next", "^16.1.1"],
        ["UI", "react, react-dom", "^19.0.0"],
        ["Lenguaje", "typescript", "^5"],
        ["ORM", "@prisma/client, prisma", "^6.11.1"],
        ["Turso", "@prisma/adapter-libsql, @libsql/client", "^0.17.3"],
        ["Auth", "next-auth", "^4.24.11"],
        ["2FA", "speakeasy", "^2.0.0"],
        ["Estilos", "tailwindcss", "^4"],
        ["Componentes", "25+ @radix-ui/react-*", "varios"],
        ["Iconos", "lucide-react", "^0.525.0"],
        ["Animaciones", "framer-motion", "^12.23.2"],
        ["Estado", "zustand, @tanstack/react-query", "^5.x"],
        ["Tablas", "@tanstack/react-table", "^8.21.3"],
        ["Formularios", "react-hook-form, zod", "^7.x, ^4.x"],
        ["Mapas", "leaflet, react-leaflet", "^1.9.4, ^5.0.0"],
        ["PDF", "@react-pdf/renderer, jspdf", "^4.5.1, ^4.2.1"],
        ["Excel", "xlsx", "^0.18.5"],
        ["Email", "nodemailer", "^8.0.10"],
        ["Seguridad", "bcryptjs", "^3.0.3"],
        ["Codigos", "jsbarcode, qrcode", "^3.12.3, ^1.5.4"],
        ["Imagenes", "sharp, @vercel/blob", "^0.34.3, ^2.4.0"],
        ["Fechas", "date-fns", "^4.1.0"],
    ]
    story.append(make_table(
        ["Categoria", "Paquete", "Version"],
        deps_rows,
        col_widths=[avail * 0.18, avail * 0.50, avail * 0.32]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
        "El proyecto depende de mas de 25 componentes Radix UI que forman la base de la libreria shadcn/ui. "
        "La combinacion de React Hook Form + Zod proporciona validacion de formularios tipada y declarativa. "
        "Para la generacion de reportes, se utilizan tres librerias diferentes segun el formato de salida "
        "requerido: SheetJS para Excel, @react-pdf/renderer para PDF complejos, y jsPDF para PDF simples.",
        style_body
    ))
    story.append(PageBreak())

    # ================================================================
    # 10. GUIA DE INSTALACION LOCAL
    # ================================================================
    story.append(Paragraph("10. Guia de instalacion local", style_heading1))
    story.append(section_divider())

    story.append(Paragraph(
        "Para configurar el entorno de desarrollo local, siga los siguientes pasos en orden. "
        "Asegurese de tener instalados Node.js (v18+), npm y git antes de comenzar:",
        style_body
    ))
    story.append(Spacer(1, 10))

    install_steps = [
        ("Paso 1: Clonar repositorio",
         "git clone https://github.com/orlandocandia/laspastasdeorlando.git"),
        ("Paso 2: Instalar dependencias",
         "npm install"),
        ("Paso 3: Configurar variables de entorno",
         "Copiar .env.example a .env.local y completar las variables del punto 6"),
        ("Paso 4: Ejecutar migracion",
         "npx prisma migrate dev"),
        ("Paso 5: Poblar la base de datos (opcional)",
         "npm run seed"),
        ("Paso 6: Iniciar servidor de desarrollo",
         "npm run dev"),
        ("Paso 7: Acceder a la aplicacion",
         "http://localhost:3000"),
    ]

    for title, desc in install_steps:
        story.append(Paragraph(f"<b>{title}</b>", style_heading2))
        if desc.startswith("http") or desc.startswith("npm") or desc.startswith("git") or desc.startswith("npx") or desc.startswith("Copiar"):
            story.append(code_block(desc))
        else:
            story.append(Paragraph(desc, style_body))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 16))

    # Additional notes
    story.append(Paragraph("Notas adicionales:", style_heading2))
    story.append(bullet("Para desarrollo local se utiliza SQLite, sin necesidad de configurar Turso"))
    story.append(bullet("Las variables SMTP son necesarias solo para probar el envio de emails"))
    story.append(bullet("TEXTMEBOT_APIKEY es opcional y solo se requiere para notificaciones WhatsApp"))
    story.append(bullet("BLOB_READ_WRITE_TOKEN es solo para produccion (Vercel Blob Storage)"))
    story.append(bullet("El seed completa la base con datos de ejemplo para todas las tablas"))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Una vez completados todos los pasos, la aplicacion estara disponible en http://localhost:3000. "
        "El dashboard de administracion se accede en /admin/login con las credenciales configuradas "
        "durante el seed o creadas manualmente.",
        style_body
    ))

    return story


# ── Main ──
def main():
    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title="Manual Tecnico - Pastas Orlando",
        author="Pastas Orlando",
        subject="Documentacion tecnica del sistema ERP + E-commerce + Landing page",
    )

    story = build_story()
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"Body PDF generated: {OUTPUT_PDF}")
    print(f"File size: {os.path.getsize(OUTPUT_PDF) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
