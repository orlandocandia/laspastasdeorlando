# Impresión Térmica de Etiquetas

El módulo de etiquetas incluye soporte para **impresoras térmicas** (Zebra, Brother, impresoras de rollo, etc.) además del modo tradicional de hoja A4.

## Acceso

Panel de Administración → **Etiquetas** → pestaña **"Impresora Térmica (PDF/ZPL)"**.

## Características

### 1. Tamaños de etiqueta personalizables

Soporta los tamaños de rollo más comunes del mercado:

| Tamaño | Uso típico |
|--------|-----------|
| 40 × 30 mm | Etiqueta chica (Zebra 50mm roll) |
| 50 × 30 mm | Térmica estándar chica |
| 60 × 40 mm | Térmica mediana |
| 70 × 40 mm | Térmica estándar |
| 80 × 50 mm | Térmica grande |
| 100 × 60 mm | Etiqueta grande |

### 2. Campos configurables

Se puede elegir qué campos incluir en la etiqueta:

- ✅ Nombre del producto
- ✅ Precio
- ✅ Peso
- ✅ Código de barras (EAN-13 o CODE128)
- ✅ Fecha de elaboración
- ✅ Fecha de vencimiento
- ✅ Categoría

### 3. Vista previa

Antes de generar, se muestra una vista previa a escala de cómo quedará la etiqueta, con el tamaño real en milímetros indicado.

### 4. Impresión por lote

- Seleccioná múltiples productos de la lista.
- Configurá la cantidad de etiquetas por producto (con botones +/−).
- El sistema calcula el total de etiquetas a generar.
- Todas las etiquetas se generan en un solo archivo.

### 5. Formatos de exportación

#### PDF (recomendado para empezar)

- Genera un PDF con **una etiqueta por página**, con el tamaño exacto en milímetros.
- Compatible con cualquier impresora térmica que acepte PDF (la mayoría modernas).
- También se puede imprimir desde cualquier PC con un lector de PDF.
- El PDF usa el tamaño de página = tamaño de etiqueta, así que al mandar a imprimir no hay que ajustar márgenes.

#### ZPL (Zebra Programming Language)

- Genera código ZPL nativo para impresoras Zebra (modelos ZD, GK, GX, etc.).
- Se puede:
  - **Copiar al portapapeles** para pegarlo en el software de la impresora.
  - **Descargar como archivo `.zpl`** para enviarlo por USB, Bluetooth o red.
- Incluye comandos `^XA`...`^XZ` (start/end), `^PW` (print width), `^LL` (label length), `^FO` (field origin), `^FD` (field data), `^BY`/`^BE`/`^BC` (barcode).

## Cómo usarlo

### Flujo básico

1. Abrí el panel de administración → **Etiquetas**.
2. Hacé clic en la pestaña **"Impresora Térmica (PDF/ZPL)"**.
3. En **"Configuración"** (panel derecho):
   - Elegí el **tamaño de etiqueta** (ej: 50×30mm).
   - Elegí el **formato de exportación** (PDF o ZPL).
   - Marcá los **campos a incluir**.
   - Si incluís fechas, configurá elaboración y vencimiento.
4. En **"Seleccionar Productos"** (panel izquierdo):
   - Buscá productos por nombre, código o código de barras.
   - Hacé clic en el botón **+** para agregar al lote.
   - Ajustá la cantidad de copias por producto si hace falta.
5. Mirá la **vista previa** para confirmar que se ve bien.
6. Hacé clic en **GENERAR PDF** o **GENERAR ZPL**.

### Ejemplo: imprimir 10 etiquetas de un producto en Zebra ZD230 (rollo 50×30mm)

1. Pestaña **Impresora Térmica**.
2. Tamaño: **50 × 30 mm**.
3. Formato: **PDF** (más fácil la primera vez).
4. Campos: Nombre ✓, Precio ✓, Código de barras ✓ (desmarcar el resto).
5. Buscar el producto → clic en **+** → ajustar cantidad a **10**.
6. Clic en **GENERAR PDF (10)**.
7. Se descarga un PDF con 10 páginas de 50×30mm cada una.
8. Abrí el PDF → Archivo → Imprimir → seleccionar la Zebra ZD230 → Imprimir.

### Ejemplo: generar ZPL para enviar por red a una Zebra

1. Pestaña **Impresora Térmica**.
2. Tamaño: **70 × 40 mm**.
3. Formato: **ZPL**.
4. Campos: todos los necesarios.
5. Agregar productos al lote.
6. Clic en **GENERAR ZPL**.
7. Aparece el código ZPL en pantalla.
8. Opciones:
   - **Copiar**: pegalo en el software Zebra Setup Utilities o en un terminal (`cat etiqueta.zpl | nc 192.168.1.50 9100`).
   - **Descargar .zpl**: guardá el archivo y enviálo por USB/Bluetooth/red.

## Impresoras compatibles

### PDF (todas las impresoras térmicas modernas)

- Zebra ZD230, ZD420, ZD621
- Brother QL-820NWB, QL-1110NWB
- Dymo LabelWriter 550
- Cualquier impresora con driver CUPS/Windows que soporte tamaño personalizado

### ZPL (solo Zebra y compatibles)

- Zebra ZD series, GK series, GX series, ZT series
- Honeywell PC42t (modo ZPL emulation)
- TSC/TEC (con emulation ZPL)

## Notas técnicas

- El código de barras se genera con `jsbarcode` (soporta EAN-13 y CODE128).
- El PDF se genera con `@react-pdf/renderer` del lado del cliente (sin servidor).
- El ZPL se genera como texto plano, un comando `^XA...^XZ` por etiqueta.
- La resolución ZPL es 203 DPI (8 dots/mm), que es el estándar de las Zebra de gama media.
- Para previsualizar ZPL online, usá [Labelary](http://labelary.com/viewer.html).

## Archivos

- `src/components/admin/ThermalLabelGenerator.tsx` — Componente principal.
- `src/app/(dashboard)/admin/etiquetas/page.tsx` — Página con pestañas (A4 + Térmica).
- `src/components/admin/EtiquetaProducto.tsx` — Etiqueta individual (diálogo, preexistente).
- `src/components/print/EtiquetaProductoPDF.tsx` — PDF para hoja A4 (preexistente).

## Preguntas frecuentes

**¿Necesito instalar algo en el servidor?**
No. Todo se genera en el navegador del cliente. El PDF y el ZPL se producen con JavaScript del lado del cliente.

**¿Puedo imprimir directamente por USB sin pasar por PDF?**
Sí, generando ZPL y enviándolo directamente al puerto USB de la impresora. En Windows, instalá la impresora con el driver "Zebra Designer" y usá el software Zebra Setup Utilities para enviar el .zpl. En Linux/Mac, podés usar `lp -d zebra etiqueta.zpl` o `cat etiqueta.zpl > /dev/usb/lp0`.

**¿La etiqueta no se imprime del tamaño correcto?**
Asegurate de que el tamaño de papel configurado en el driver de la impresora coincida con el tamaño de etiqueta seleccionado (ej: 50×30mm). En el diálogo de impresión del PDF, desactivá "Ajustar a página" y "Escalar".

**¿El código de barras no se lee?**
- Verificá que el producto tenga un código de barras válido (EAN-13 de 13 dígitos o CODE128).
- Si la etiqueta es muy chica (40×30mm), el código de barras puede ser demasiado pequeño para algunos lectores. Probá con 50×30mm o más grande.
