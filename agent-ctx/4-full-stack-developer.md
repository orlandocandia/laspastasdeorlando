# Task 4 - Promotions Module

## Agent: full-stack-developer

## Work Summary

Built the complete Promotions (Promociones) module for the Pastas Orlando ERP system.

### Changes Made

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Added `Promocion` model with fields: nombre, descripcion, tipo, valor_descuento, fecha_inicio, fecha_fin, activo, aplicar_auto
   - Added `PromocionProducto` model linking promotions to products/categories
   - Added `promociones PromocionProducto[]` relation to `ProductoTerminado` model
   - Added `promociones PromocionProducto[]` relation to `CategoriaProductoTerminado` model
   - Ran `bun run db:push` successfully

2. **API Endpoints**
   - `GET /api/promociones` - List promotions with filters (activo, tipo)
   - `POST /api/promociones` - Create promotion with related products
   - `GET /api/promociones/[id]` - Get single promotion
   - `PUT /api/promociones/[id]` - Update promotion (replaces products if provided)
   - `DELETE /api/promociones/[id]` - Soft delete (set activo=false)

3. **UI Component** (`src/components/admin/PromocionesManager.tsx`)
   - Table view with: Nombre, Tipo (badge), Descuento, Fecha inicio, Fecha fin, Estado, Acciones
   - Filter by tipo and estado
   - Create/Edit dialog with full form
   - Multi-select product picker with search
   - Badge colors: porcentual=mostaza, fijo=oliva, 2x1=marron, tiempo_limitado=rojo
   - Soft delete with confirmation dialog

4. **Page** (`src/app/(dashboard)/admin/promociones/page.tsx`)
   - Standard page wrapper with icon and title

5. **Sidebar Navigation** (`src/app/(dashboard)/layout.tsx`)
   - Added "Promociones" link in Ventas section after Presupuestos

### Verification
- Lint: Passed with no errors
- Dev server: Running normally
