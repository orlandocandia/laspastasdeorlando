# Task: API Endpoints for Descuentos por Volumen Module

## Summary
Created 3 API route files for the Descuentos por Volumen (Volume Discounts) module, following existing project patterns (promociones routes).

## Files Created

### 1. `/home/z/my-project/src/app/api/descuentos-volumen/route.ts`
- **GET**: List all DescuentoVolumen with their rangos, supports `activo` (boolean) and `tipo_item` (string) query params
- **POST**: Create a new DescuentoVolumen with rangos. Validates required fields (nombre, tipo_item, unidad_medida) and ensures at least one rango is provided

### 2. `/home/z/my-project/src/app/api/descuentos-volumen/[id]/route.ts`
- **GET**: Get a single DescuentoVolumen by ID with its rangos (ordered by cantidad_desde asc)
- **PUT**: Update DescuentoVolumen and its rangos. If rangos array is provided, deletes all existing rangos and recreates them. Only updates fields that are explicitly provided.
- **DELETE**: Soft delete (sets activo = false). Verifies existence before updating.

### 3. `/home/z/my-project/src/app/api/descuentos-volumen/calcular/route.ts`
- **GET**: Calculate the best volume discount for a given product + quantity
- Query params: `producto_id` (required), `cantidad` (required), `unidad` (optional)
- Logic:
  1. Finds the product by ID to get precio_venta and categoria_id
  2. Finds all active DescuentoVolumen matching tipo_item = 'todos' | 'producto' | 'categoria'
  3. Validates date range (fecha_inicio <= today OR null, fecha_fin >= today OR null) using Prisma AND/OR conditions
  4. For each matching discount, finds the applicable rango where cantidad_desde <= cantidad AND (cantidad_hasta IS NULL OR cantidad_hasta >= cantidad)
  5. Calculates discount amount for both "porcentaje" and "fijo" types
  6. Returns the best discount (highest monetary value applied)

## Patterns Followed
- All routes call `await ensureDbReady()` at the start
- Use try/catch with proper error responses (500 for server errors, 400 for bad requests, 404 for not found)
- Import `NextRequest, NextResponse` from 'next/server'
- Import `db, ensureDbReady` from '@/lib/db'
- `params` uses `Promise<{ id: string }>` pattern (Next.js 16)
- No auth required (internal admin endpoints)

## Lint Status
✅ All files pass ESLint with no errors
