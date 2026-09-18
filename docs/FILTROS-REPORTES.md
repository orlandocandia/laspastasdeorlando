# Filtros Personalizados en Reportes

El módulo de **Reportes** (`/admin/reportes`) permite filtrar los datos por período y por criterios específicos de cada reporte antes de visualizarlos y exportarlos.

---

## Componente reutilizable: `FiltrosReportes`

Archivo: `src/components/admin/reportes/FiltrosReportes.tsx`

Es un componente genérico que renderiza una barra de filtros configurable. Se compone de:

### 1. Filtro de período (fechas)
- **Preselecciones rápidas:** Hoy · Esta semana · Este mes · Este año.
- **Rango personalizado:** campos *Desde* y *Hasta* (input `type="date"`).
- Se puede ocultar con `showDateRange={false}` (por ejemplo, en el reporte de Stock, que es una foto instantánea sin dimensión temporal).

### 2. Filtros adicionales (configurables)
Se pasan vía la prop `extras` como un arreglo de `FiltroExtra`:

```ts
type FiltroExtra =
  | { kind: 'select'; key: string; label: string; options: {value,label}[]; placeholder: string }
  | { kind: 'checkbox'; key: string; label: string }
```

### 3. Acciones
- **Aplicar** — dispara `onApply` (re-fetch con filtros).
- **Limpiar** — resetea todos los filtros y llama `onClear`.
- Indicador visual "Filtros activos" cuando hay algún filtro aplicado.

---

## Reporte de Ventas

Archivo: `src/components/admin/reportes/ReporteVentas.tsx`
API: `GET /api/reportes/ventas`

### Filtros disponibles
| Filtro | Descripción |
|--------|-------------|
| Período (desde/hasta) | Filtra por `fecha_venta`. Incluye todo el día "hasta". |
| Producto | Solo ventas que incluyen el producto terminado seleccionado. |
| Cliente | Solo ventas del cliente (Persona) seleccionado. |
| Vendedor | Solo ventas registradas por el usuario (vendedor) seleccionado. |

### Datos mostrados
- Resumen: Total Ventas, Cantidad, Ticket Promedio.
- Productos más vendidos (top 10).
- Clientes más frecuentes (top 10).
- **Ventas por Vendedor** (agregación nueva, útil al filtrar por vendedor).
- Ventas por día.
- **Detalle de ventas filtradas** (hasta 100 en pantalla; export incluye todas).

### Exportación con filtros
Cada tabla tiene botones de **Excel**, **CSV** y **PDF** que exportan exactamente los datos filtrados que se están visualizando.

---

## Reporte de Stock

Archivo: `src/components/admin/reportes/ReporteStock.tsx`
API: `GET /api/reportes/stock`

> El stock es una foto instantánea del inventario, por lo que **no tiene filtro de período**.

### Filtros disponibles
| Filtro | Descripción |
|--------|-------------|
| Categoría (Productos) | Filtra productos terminados por categoría. |
| Categoría (Mat. Primas) | Filtra materias primas por categoría. |
| Proveedor | Filtra MP e Insumos que figuran en compras del proveedor seleccionado (relación MP/Insumo → DetalleCompra → Compra → Proveedor). |
| Solo stock bajo (checkbox) | Muestra únicamente los ítems con `stock_actual ≤ stock_minimo`. |

### Datos mostrados
- Resumen: Valor Stock Total, Stock Crítico, Valor MP+Insumos, Valor PT.
- Alertas de Stock Bajo (todas las unidades por debajo del mínimo).
- Stock de Productos Terminados (con categoría, stock, mínimo, precio, valor).
- Stock de Materias Primas (con categoría, stock, mínimo, valor).
- Stock de Insumos (con tipo, stock, mínimo, valor).

### Exportación
Excel, CSV y PDF para PT; Excel y CSV para MP e Insumos. Todos respetan los filtros aplicados.

---

## Reporte de Producción

Archivo: `src/components/admin/reportes/ReporteProduccion.tsx`
API: `GET /api/reportes/produccion`

### Filtros disponibles
| Filtro | Descripción |
|--------|-------------|
| Período (desde/hasta) | Filtra por `fecha_produccion`. |
| Producto | Solo producciones de la receta del producto terminado seleccionado. |

### Datos mostrados
- Resumen: Total Producido, Costo Total, Costo Promedio unitario.
- Costos por Producto (agregación por receta/producto).
- **Detalle de producciones filtradas** (fecha, producto, receta, cantidad, costo, supervisor, estado).

### Exportación
Excel, CSV y PDF con los datos filtrados.

---

## Reportes de Compras y Finanzas

Estos reportes mantienen el filtro de **período** (desde/hasta + preselecciones) usando el mismo componente `FiltrosReportes` con `extras={[]}` (solo fechas).

---

## API de opciones de filtros

`GET /api/reportes/filtros-opciones`

Devuelve en una sola petición todas las listas necesarias para poblar los selects de filtros:

```json
{
  "productos":      [{ "value": "12", "label": "Agnolottis de Verdura" }, ...],
  "clientes":       [{ "value": "5",  "label": "Supermercado Don Mario" }, ...],
  "vendedores":     [{ "value": "1",  "label": "Orlando Candia" }, ...],
  "categoriasPT":   [{ "value": "2",  "label": "Pastas Frescas" }, ...],
  "categoriasMP":   [{ "value": "1",  "label": "Harinas" }, ...],
  "proveedores":    [{ "value": "3",  "label": "Distribuidora Norte" }, ...]
}
```

---

## Parámetros de consulta (API)

### `/api/reportes/ventas`
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `fecha_desde` | `YYYY-MM-DD` | Inicio del rango |
| `fecha_hasta` | `YYYY-MM-DD` | Fin del rango (incluye todo el día) |
| `cliente_id` | `int` | ID de Persona (cliente) |
| `vendedor_id` | `int` | ID de Usuario (vendedor) |
| `producto_id` | `int` | ID de ProductoTerminado |

### `/api/reportes/stock`
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `categoria_pt` | `int` | ID de CategoriaProductoTerminado |
| `categoria_mp` | `int` | ID de CategoriaMateriaPrima |
| `proveedor_id` | `int` | ID de Persona (proveedor) |
| `solo_stock_bajo` | `"true"` | Mostrar solo ítems con stock ≤ mínimo |

### `/api/reportes/produccion`
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `fecha_desde` | `YYYY-MM-DD` | Inicio del rango |
| `fecha_hasta` | `YYYY-MM-DD` | Fin del rango |
| `producto_id` | `int` | ID de ProductoTerminado (vía receta) |

---

## Cómo agregar un nuevo filtro

1. Agregar el campo al componente `FiltroExtra` en `FiltrosReportes.tsx` si es un tipo nuevo.
2. Pasar la opción en el arreglo `extras` del reporte correspondiente.
3. Manejar el valor en el estado del reporte y enviarlo como parámetro a la API.
4. Aplicar el filtro en la cláusula `where` de Prisma en la ruta API correspondiente.
5. La exportación funciona automáticamente porque exporta los datos ya filtrados en el estado del componente.
