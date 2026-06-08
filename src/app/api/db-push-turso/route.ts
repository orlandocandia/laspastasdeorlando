import { NextRequest, NextResponse } from 'next/server'
import { createClient, type Client } from '@libsql/client'

const DDL_SQL = `-- CreateTable
CREATE TABLE "Producto" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Opinion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "calificacion" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pending',
    "ip" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_aprobacion" DATETIME,
    "id_aprobador" INTEGER,
    "respuesta" TEXT,
    "fecha_respuesta" DATETIME,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "InteraccionWhatsApp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "mensaje_enviado" TEXT NOT NULL,
    "ip" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Provincia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pais" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Provincia_id_pais_fkey" FOREIGN KEY ("id_pais") REFERENCES "Pais" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_provincia" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Departamento_id_provincia_fkey" FOREIGN KEY ("id_provincia") REFERENCES "Provincia" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Municipio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_departamento" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Municipio_id_departamento_fkey" FOREIGN KEY ("id_departamento") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoPersona" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_municipio" INTEGER,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "numero_documento" TEXT NOT NULL,
    "fecha_nacimiento" DATETIME,
    "observaciones" TEXT,
    "tipo_persona" TEXT NOT NULL,
    "razon_social" TEXT,
    "cuit" TEXT,
    "condicion_iva" TEXT,
    "imagen" TEXT,
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME,
    "latitud" REAL,
    "longitud" REAL,
    "direccion_mapa" TEXT,
    "ubicacion_valida" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Persona_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "Municipio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoContacto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Contacto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_persona" INTEGER NOT NULL,
    "id_tipo_contacto" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Contacto_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Persona" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contacto_id_tipo_contacto_fkey" FOREIGN KEY ("id_tipo_contacto") REFERENCES "TipoContacto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoDireccion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Direccion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_persona" INTEGER NOT NULL,
    "id_tipo_direccion" INTEGER NOT NULL,
    "id_municipio" INTEGER,
    "direccion" TEXT NOT NULL,
    "referencia" TEXT,
    "latitud" REAL,
    "longitud" REAL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Direccion_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Persona" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Direccion_id_tipo_direccion_fkey" FOREIGN KEY ("id_tipo_direccion") REFERENCES "TipoDireccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Direccion_id_municipio_fkey" FOREIGN KEY ("id_municipio") REFERENCES "Municipio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_persona" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "fecha_registro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" DATETIME,
    CONSTRAINT "Usuario_id_persona_fkey" FOREIGN KEY ("id_persona") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "es_default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UsuarioRol" (
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,

    PRIMARY KEY ("id_usuario", "id_rol"),
    CONSTRAINT "UsuarioRol_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsuarioRol_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Permiso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "modulo" TEXT NOT NULL DEFAULT 'general',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RolPermiso" (
    "id_rol" INTEGER NOT NULL,
    "id_permiso" INTEGER NOT NULL,

    PRIMARY KEY ("id_rol", "id_permiso"),
    CONSTRAINT "RolPermiso_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolPermiso_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "Permiso" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sesion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "ip" TEXT,
    "dispositivo" TEXT,
    "fecha_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" DATETIME,
    CONSTRAINT "Sesion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnidadMedida" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "conversion_a_base" REAL NOT NULL DEFAULT 1.0,
    "tipo_medida" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CategoriaMateriaPrima" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "id_categoria" INTEGER NOT NULL,
    "id_unidad_base" INTEGER NOT NULL,
    "stock_actual" REAL NOT NULL DEFAULT 0,
    "stock_minimo" REAL NOT NULL DEFAULT 0,
    "precio_compra_referencia" REAL NOT NULL DEFAULT 0,
    "imagen" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "MateriaPrima_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "CategoriaMateriaPrima" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MateriaPrima_id_unidad_base_fkey" FOREIGN KEY ("id_unidad_base") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TipoInsumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "id_tipo_insumo" INTEGER NOT NULL,
    "id_unidad_base" INTEGER NOT NULL,
    "stock_actual" REAL NOT NULL DEFAULT 0,
    "stock_minimo" REAL NOT NULL DEFAULT 0,
    "precio_compra_referencia" REAL NOT NULL DEFAULT 0,
    "imagen" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Insumo_id_tipo_insumo_fkey" FOREIGN KEY ("id_tipo_insumo") REFERENCES "TipoInsumo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Insumo_id_unidad_base_fkey" FOREIGN KEY ("id_unidad_base") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Marca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "CategoriaProductoTerminado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProductoTerminado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "codigo" TEXT,
    "codigo_barras" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "id_categoria" INTEGER NOT NULL,
    "tipo_harina" TEXT,
    "peso_unitario_aprox" REAL NOT NULL DEFAULT 0,
    "unidades" INTEGER,
    "precio_venta" REAL NOT NULL DEFAULT 0,
    "stock_actual" REAL NOT NULL DEFAULT 0,
    "stock_minimo" REAL NOT NULL DEFAULT 0,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "visible_en_landing" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "ProductoTerminado_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "CategoriaProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Receta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_producto_terminado" INTEGER NOT NULL,
    "nombre_receta" TEXT NOT NULL,
    "rendimiento_unidades" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Receta_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleReceta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_receta" INTEGER NOT NULL,
    "id_materia_prima" INTEGER,
    "id_insumo" INTEGER,
    "cantidad_necesaria" REAL NOT NULL,
    "id_unidad" INTEGER NOT NULL,
    "costo_estimado" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetalleReceta_id_receta_fkey" FOREIGN KEY ("id_receta") REFERENCES "Receta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetalleReceta_id_materia_prima_fkey" FOREIGN KEY ("id_materia_prima") REFERENCES "MateriaPrima" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleReceta_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleReceta_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormaPago" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_forma" TEXT NOT NULL,
    "requiere_identificacion" BOOLEAN NOT NULL DEFAULT false,
    "requiere_cuenta" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "EstadoGeneral" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre_estado" TEXT NOT NULL,
    "entidad_aplicable" TEXT,
    "es_final" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_proveedor" INTEGER NOT NULL,
    "id_forma_pago" INTEGER NOT NULL,
    "numero_factura" TEXT,
    "fecha_compra" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "id_estado" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Compra_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Compra_id_forma_pago_fkey" FOREIGN KEY ("id_forma_pago") REFERENCES "FormaPago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Compra_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "EstadoGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleCompra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_compra" INTEGER NOT NULL,
    "id_materia_prima" INTEGER,
    "id_insumo" INTEGER,
    "id_marca" INTEGER,
    "cantidad_comprada" REAL NOT NULL,
    "id_unidad_compra" INTEGER NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "precio_total" REAL NOT NULL,
    "fecha_vencimiento" DATETIME,
    "lote" TEXT,
    "cantidad_base" REAL NOT NULL DEFAULT 0,
    "precio_por_unidad_base" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetalleCompra_id_compra_fkey" FOREIGN KEY ("id_compra") REFERENCES "Compra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetalleCompra_id_materia_prima_fkey" FOREIGN KEY ("id_materia_prima") REFERENCES "MateriaPrima" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleCompra_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleCompra_id_marca_fkey" FOREIGN KEY ("id_marca") REFERENCES "Marca" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleCompra_id_unidad_compra_fkey" FOREIGN KEY ("id_unidad_compra") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PedidoProveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_proveedor" INTEGER NOT NULL,
    "fecha_pedido" DATETIME NOT NULL,
    "fecha_entrega_estimada" DATETIME,
    "fecha_entrega_real" DATETIME,
    "observaciones" TEXT,
    "id_estado" INTEGER NOT NULL,
    "total_estimado" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "PedidoProveedor_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PedidoProveedor_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "EstadoGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetallePedidoProveedor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pedido" INTEGER NOT NULL,
    "id_materia_prima" INTEGER,
    "id_insumo" INTEGER,
    "cantidad_pedida" REAL NOT NULL,
    "id_unidad" INTEGER NOT NULL,
    "precio_estimado" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetallePedidoProveedor_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PedidoProveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetallePedidoProveedor_id_materia_prima_fkey" FOREIGN KEY ("id_materia_prima") REFERENCES "MateriaPrima" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetallePedidoProveedor_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetallePedidoProveedor_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PedidoCliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cliente" INTEGER NOT NULL,
    "fecha_pedido" DATETIME NOT NULL,
    "fecha_entrega_solicitada" DATETIME NOT NULL,
    "fecha_entrega_real" DATETIME,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "senia" REAL NOT NULL DEFAULT 0,
    "id_estado" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "PedidoCliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PedidoCliente_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "EstadoGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetallePedidoCliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pedido" INTEGER NOT NULL,
    "id_producto_terminado" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetallePedidoCliente_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PedidoCliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetallePedidoCliente_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReservaCliente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cliente" INTEGER NOT NULL,
    "id_pedido" INTEGER,
    "fecha_reserva" DATETIME NOT NULL,
    "fecha_validez_hasta" DATETIME NOT NULL,
    "id_producto_terminado" INTEGER NOT NULL,
    "cantidad_reservada" REAL NOT NULL,
    "cantidad_confirmada" REAL NOT NULL DEFAULT 0,
    "senia" REAL NOT NULL DEFAULT 0,
    "id_estado" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "ReservaCliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReservaCliente_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PedidoCliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReservaCliente_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReservaCliente_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "EstadoGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cliente" INTEGER NOT NULL,
    "id_vendedor" INTEGER NOT NULL,
    "id_forma_pago" INTEGER NOT NULL,
    "id_pedido" INTEGER,
    "numero_comprobante" TEXT,
    "fecha_venta" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "id_estado" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Venta_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_id_vendedor_fkey" FOREIGN KEY ("id_vendedor") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_id_forma_pago_fkey" FOREIGN KEY ("id_forma_pago") REFERENCES "FormaPago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Venta_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PedidoCliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Venta_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "EstadoGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_venta" INTEGER NOT NULL,
    "id_producto_terminado" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetalleVenta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "Venta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetalleVenta_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Produccion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_receta" INTEGER NOT NULL,
    "id_supervisor" INTEGER,
    "cantidad_producida" INTEGER NOT NULL,
    "fecha_produccion" DATETIME NOT NULL,
    "costo_total_materias_primas" REAL NOT NULL DEFAULT 0,
    "costo_total_insumos" REAL NOT NULL DEFAULT 0,
    "costo_total" REAL NOT NULL DEFAULT 0,
    "id_estado" INTEGER NOT NULL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Produccion_id_receta_fkey" FOREIGN KEY ("id_receta") REFERENCES "Receta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Produccion_id_supervisor_fkey" FOREIGN KEY ("id_supervisor") REFERENCES "Persona" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Produccion_id_estado_fkey" FOREIGN KEY ("id_estado") REFERENCES "EstadoGeneral" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleProduccionConsumo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_produccion" INTEGER NOT NULL,
    "id_materia_prima" INTEGER,
    "id_insumo" INTEGER,
    "cantidad_consumida" REAL NOT NULL,
    "id_unidad" INTEGER NOT NULL,
    "costo_unitario" REAL NOT NULL,
    "costo_total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetalleProduccionConsumo_id_produccion_fkey" FOREIGN KEY ("id_produccion") REFERENCES "Produccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetalleProduccionConsumo_id_materia_prima_fkey" FOREIGN KEY ("id_materia_prima") REFERENCES "MateriaPrima" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleProduccionConsumo_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DetalleProduccionConsumo_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetalleProduccionGenerado" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_produccion" INTEGER NOT NULL,
    "id_producto_terminado" INTEGER NOT NULL,
    "cantidad_generada" REAL NOT NULL,
    "costo_unitario" REAL NOT NULL,
    "costo_total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetalleProduccionGenerado_id_produccion_fkey" FOREIGN KEY ("id_produccion") REFERENCES "Produccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetalleProduccionGenerado_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo_movimiento" TEXT NOT NULL,
    "id_materia_prima" INTEGER,
    "id_insumo" INTEGER,
    "id_producto_terminado" INTEGER,
    "cantidad" REAL NOT NULL,
    "id_unidad" INTEGER NOT NULL,
    "stock_antes" REAL NOT NULL,
    "stock_despues" REAL NOT NULL,
    "referencia_id" INTEGER,
    "referencia_tabla" TEXT,
    "observacion" TEXT,
    "id_usuario" INTEGER,
    "fecha_movimiento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_id_materia_prima_fkey" FOREIGN KEY ("id_materia_prima") REFERENCES "MateriaPrima" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_id_insumo_fkey" FOREIGN KEY ("id_insumo") REFERENCES "Insumo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "UnidadMedida" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Usuario2FA" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER NOT NULL,
    "secret_2fa" TEXT,
    "activado" BOOLEAN NOT NULL DEFAULT false,
    "codigos_respaldo" TEXT,
    "fecha_activacion" DATETIME,
    "fecha_ultimo_uso" DATETIME,
    CONSTRAINT "Usuario2FA_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogAcceso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER,
    "email_intento" TEXT,
    "resultado" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "navegador" TEXT,
    "sistema_operativo" TEXT,
    "dispositivo" TEXT,
    "pais" TEXT,
    "ciudad" TEXT,
    "motivo" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LogAcceso_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SesionActiva" (
    "id_sesion" TEXT NOT NULL PRIMARY KEY,
    "id_usuario" INTEGER NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "fecha_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_expiracion" DATETIME NOT NULL,
    "fecha_fin" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'active',
    CONSTRAINT "SesionActiva_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_usuario" INTEGER,
    "accion" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "entidad_id" INTEGER,
    "entidad_nombre" TEXT,
    "detalles" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PuntoEncuentro" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "latitud" REAL,
    "longitud" REAL,
    "horarios" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_pedido" INTEGER NOT NULL,
    "id_punto_encuentro" INTEGER,
    "direccion_alternativa" TEXT,
    "fecha_programada" DATETIME NOT NULL,
    "fecha_realizada" DATETIME,
    "hora_desde" TEXT,
    "hora_hasta" TEXT,
    "nombre_recibe" TEXT,
    "telefono_recibe" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'programado',
    "observaciones" TEXT,
    "latitud_entrega" REAL,
    "longitud_entrega" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Entrega_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PedidoCliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Entrega_id_punto_encuentro_fkey" FOREIGN KEY ("id_punto_encuentro") REFERENCES "PuntoEncuentro" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NotificacionEntrega" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_entrega" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha_envio" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificacionEntrega_id_entrega_fkey" FOREIGN KEY ("id_entrega") REFERENCES "Entrega" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlantillaNotificacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_plantilla" INTEGER,
    "tipo" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "fecha_programada" DATETIME,
    "fecha_envio" DATETIME,
    "error" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notificacion_id_plantilla_fkey" FOREIGN KEY ("id_plantilla") REFERENCES "PlantillaNotificacion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AlertaConfiguracion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "umbral" INTEGER,
    "destinatarios" TEXT,
    "frecuencia" TEXT,
    "ultimo_envio" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmpresaTelefonica" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ServicioCorreoElectronico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "dominio" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "TipoPlataforma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "TipoEntidad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "EstadoSesion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_cliente" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_validez" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "iva" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "id_pedido" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Presupuesto_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Persona" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Presupuesto_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "PedidoCliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DetallePresupuesto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_presupuesto" INTEGER NOT NULL,
    "id_producto_terminado" INTEGER NOT NULL,
    "cantidad" REAL NOT NULL,
    "precio_unitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "observaciones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DetallePresupuesto_id_presupuesto_fkey" FOREIGN KEY ("id_presupuesto") REFERENCES "Presupuesto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DetallePresupuesto_id_producto_terminado_fkey" FOREIGN KEY ("id_producto_terminado") REFERENCES "ProductoTerminado" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consulta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "respondido" BOOLEAN NOT NULL DEFAULT false,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Pais_nombre_key" ON "Pais"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Provincia_id_pais_nombre_key" ON "Provincia"("id_pais", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_id_provincia_nombre_key" ON "Departamento"("id_provincia", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Municipio_id_departamento_nombre_key" ON "Municipio"("id_departamento", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoPersona_nombre_key" ON "TipoPersona"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_numero_documento_key" ON "Persona"("numero_documento");

-- CreateIndex
CREATE INDEX "Persona_tipo_persona_idx" ON "Persona"("tipo_persona");

-- CreateIndex
CREATE INDEX "Persona_numero_documento_idx" ON "Persona"("numero_documento");

-- CreateIndex
CREATE UNIQUE INDEX "TipoContacto_nombre_key" ON "TipoContacto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoDireccion_nombre_key" ON "TipoDireccion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_id_persona_key" ON "Usuario"("id_persona");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Permiso_nombre_key" ON "Permiso"("nombre");

-- CreateIndex
CREATE INDEX "Permiso_modulo_idx" ON "Permiso"("modulo");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadMedida_codigo_key" ON "UnidadMedida"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaMateriaPrima_nombre_key" ON "CategoriaMateriaPrima"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrima_codigo_key" ON "MateriaPrima"("codigo");

-- CreateIndex
CREATE INDEX "MateriaPrima_codigo_idx" ON "MateriaPrima"("codigo");

-- CreateIndex
CREATE INDEX "MateriaPrima_nombre_idx" ON "MateriaPrima"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoInsumo_nombre_key" ON "TipoInsumo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Insumo_codigo_key" ON "Insumo"("codigo");

-- CreateIndex
CREATE INDEX "Insumo_codigo_idx" ON "Insumo"("codigo");

-- CreateIndex
CREATE INDEX "Insumo_nombre_idx" ON "Insumo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProductoTerminado_nombre_key" ON "CategoriaProductoTerminado"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoTerminado_codigo_key" ON "ProductoTerminado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductoTerminado_codigo_barras_key" ON "ProductoTerminado"("codigo_barras");

-- CreateIndex
CREATE INDEX "ProductoTerminado_codigo_idx" ON "ProductoTerminado"("codigo");

-- CreateIndex
CREATE INDEX "ProductoTerminado_nombre_idx" ON "ProductoTerminado"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "FormaPago_nombre_forma_key" ON "FormaPago"("nombre_forma");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoGeneral_nombre_estado_key" ON "EstadoGeneral"("nombre_estado");

-- CreateIndex
CREATE INDEX "Compra_fecha_compra_idx" ON "Compra"("fecha_compra");

-- CreateIndex
CREATE INDEX "Compra_id_proveedor_idx" ON "Compra"("id_proveedor");

-- CreateIndex
CREATE INDEX "DetalleCompra_id_compra_idx" ON "DetalleCompra"("id_compra");

-- CreateIndex
CREATE INDEX "PedidoProveedor_fecha_pedido_idx" ON "PedidoProveedor"("fecha_pedido");

-- CreateIndex
CREATE INDEX "PedidoProveedor_id_proveedor_idx" ON "PedidoProveedor"("id_proveedor");

-- CreateIndex
CREATE INDEX "PedidoCliente_fecha_pedido_idx" ON "PedidoCliente"("fecha_pedido");

-- CreateIndex
CREATE INDEX "PedidoCliente_id_cliente_idx" ON "PedidoCliente"("id_cliente");

-- CreateIndex
CREATE INDEX "DetallePedidoCliente_id_pedido_idx" ON "DetallePedidoCliente"("id_pedido");

-- CreateIndex
CREATE INDEX "ReservaCliente_fecha_reserva_idx" ON "ReservaCliente"("fecha_reserva");

-- CreateIndex
CREATE INDEX "ReservaCliente_id_cliente_idx" ON "ReservaCliente"("id_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_id_pedido_key" ON "Venta"("id_pedido");

-- CreateIndex
CREATE INDEX "Venta_fecha_venta_idx" ON "Venta"("fecha_venta");

-- CreateIndex
CREATE INDEX "Venta_id_cliente_idx" ON "Venta"("id_cliente");

-- CreateIndex
CREATE INDEX "DetalleVenta_id_venta_idx" ON "DetalleVenta"("id_venta");

-- CreateIndex
CREATE INDEX "Produccion_fecha_produccion_idx" ON "Produccion"("fecha_produccion");

-- CreateIndex
CREATE INDEX "Produccion_id_receta_idx" ON "Produccion"("id_receta");

-- CreateIndex
CREATE INDEX "DetalleProduccionConsumo_id_produccion_idx" ON "DetalleProduccionConsumo"("id_produccion");

-- CreateIndex
CREATE INDEX "DetalleProduccionGenerado_id_produccion_idx" ON "DetalleProduccionGenerado"("id_produccion");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario2FA_id_usuario_key" ON "Usuario2FA"("id_usuario");

-- CreateIndex
CREATE INDEX "LogAcceso_fecha_idx" ON "LogAcceso"("fecha");

-- CreateIndex
CREATE INDEX "LogAcceso_email_intento_idx" ON "LogAcceso"("email_intento");

-- CreateIndex
CREATE INDEX "LogAcceso_resultado_idx" ON "LogAcceso"("resultado");

-- CreateIndex
CREATE INDEX "SesionActiva_id_usuario_idx" ON "SesionActiva"("id_usuario");

-- CreateIndex
CREATE INDEX "SesionActiva_estado_idx" ON "SesionActiva"("estado");

-- CreateIndex
CREATE INDEX "Auditoria_fecha_idx" ON "Auditoria"("fecha");

-- CreateIndex
CREATE INDEX "Auditoria_modulo_idx" ON "Auditoria"("modulo");

-- CreateIndex
CREATE INDEX "Auditoria_accion_idx" ON "Auditoria"("accion");

-- CreateIndex
CREATE INDEX "Auditoria_id_usuario_idx" ON "Auditoria"("id_usuario");

-- CreateIndex
CREATE INDEX "Entrega_fecha_programada_idx" ON "Entrega"("fecha_programada");

-- CreateIndex
CREATE INDEX "Entrega_estado_idx" ON "Entrega"("estado");

-- CreateIndex
CREATE INDEX "NotificacionEntrega_id_entrega_idx" ON "NotificacionEntrega"("id_entrega");

-- CreateIndex
CREATE UNIQUE INDEX "PlantillaNotificacion_nombre_key" ON "PlantillaNotificacion"("nombre");

-- CreateIndex
CREATE INDEX "Notificacion_estado_idx" ON "Notificacion"("estado");

-- CreateIndex
CREATE INDEX "Notificacion_tipo_idx" ON "Notificacion"("tipo");

-- CreateIndex
CREATE INDEX "Notificacion_createdAt_idx" ON "Notificacion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlertaConfiguracion_tipo_key" ON "AlertaConfiguracion"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaTelefonica_nombre_key" ON "EmpresaTelefonica"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EmpresaTelefonica_codigo_key" ON "EmpresaTelefonica"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ServicioCorreoElectronico_nombre_key" ON "ServicioCorreoElectronico"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ServicioCorreoElectronico_dominio_key" ON "ServicioCorreoElectronico"("dominio");

-- CreateIndex
CREATE UNIQUE INDEX "TipoPlataforma_nombre_key" ON "TipoPlataforma"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TipoEntidad_nombre_key" ON "TipoEntidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "EstadoSesion_nombre_key" ON "EstadoSesion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_numero_key" ON "Presupuesto"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Presupuesto_id_pedido_key" ON "Presupuesto"("id_pedido");

-- CreateIndex
CREATE INDEX "Presupuesto_numero_idx" ON "Presupuesto"("numero");

-- CreateIndex
CREATE INDEX "Presupuesto_id_cliente_idx" ON "Presupuesto"("id_cliente");

-- CreateIndex
CREATE INDEX "Presupuesto_estado_idx" ON "Presupuesto"("estado");

-- CreateIndex
CREATE INDEX "DetallePresupuesto_id_presupuesto_idx" ON "DetallePresupuesto"("id_presupuesto");

-- CreateIndex
CREATE INDEX "Consulta_fecha_idx" ON "Consulta"("fecha");

-- CreateIndex
CREATE INDEX "Consulta_leido_idx" ON "Consulta"("leido");`

interface StatementResult {
  statement: string
  status: 'ok' | 'skipped' | 'error'
  error?: string
}

/**
 * Parse DDL SQL by splitting on -- CreateTable / -- CreateIndex boundaries.
 * Each section after such a comment marker is treated as a single SQL statement.
 */
function parseDDLStatements(sql: string): string[] {
  const statements: string[] = []

  // Split on the boundary markers (-- CreateTable or -- CreateIndex)
  const parts = sql.split(/\n-- Create(?:Table|Index)\n/)

  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.length === 0) continue

    // Each part may end with a trailing semicolon and blank lines; keep it as-is
    // but ensure it's a valid SQL statement
    if (trimmed.startsWith('CREATE ') || trimmed.startsWith('create ')) {
      statements.push(trimmed)
    }
  }

  return statements
}

// POST /api/db-push-turso - Push DDL schema to Turso database using @libsql/client
export async function POST(request: NextRequest) {
  try {
    // 1. Check secret
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (secret !== 'laspastasdeorlando-seed-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Detect if running on Turso
    const databaseUrl =
      process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || ''
    const authToken =
      process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || ''

    if (!databaseUrl.startsWith('libsql://') && !databaseUrl.startsWith('http')) {
      return NextResponse.json(
        {
          error:
            'Not running on Turso. DATABASE_URL must start with libsql:// or TURSO_DATABASE_URL must be set.',
        },
        { status: 400 }
      )
    }

    // 3. Create libsql client
    const client: Client = createClient({
      url: databaseUrl,
      authToken: authToken || undefined,
    })

    // 4. Parse and execute DDL statements
    const statements = parseDDLStatements(DDL_SQL)
    const results: StatementResult[] = []
    let created = 0
    let skipped = 0
    let errors = 0

    for (const stmt of statements) {
      // Extract a short label for logging
      const label = stmt.split('\n')[0]?.substring(0, 80) || 'unknown'

      try {
        await client.execute(stmt)
        results.push({ statement: label, status: 'ok' })
        created++
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)

        // Skip if table or index already exists
        if (
          errMsg.includes('table already exists') ||
          errMsg.includes('index already exists') ||
          errMsg.includes('already exists')
        ) {
          results.push({ statement: label, status: 'skipped', error: errMsg })
          skipped++
        } else {
          results.push({ statement: label, status: 'error', error: errMsg })
          errors++
        }
      }
    }

    // 5. Run ALTER TABLE migrations for existing databases
    const migrations = [
      { sql: 'ALTER TABLE "Opinion" ADD COLUMN "email" TEXT', description: 'Add email column to Opinion table' },
      { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "codigo_barras" TEXT', description: 'Add codigo_barras column to ProductoTerminado' },
      { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "tipo_harina" TEXT', description: 'Add tipo_harina column to ProductoTerminado (con_gluten, integral, sin_gluten)' },
      { sql: 'CREATE UNIQUE INDEX IF NOT EXISTS "ProductoTerminado_codigo_barras_key" ON "ProductoTerminado"("codigo_barras")', description: 'Add unique index on codigo_barras' },
      { sql: 'ALTER TABLE "CategoriaProductoTerminado" ADD COLUMN "imagen" TEXT', description: 'Add imagen column to CategoriaProductoTerminado' },
      { sql: 'ALTER TABLE "DetallePedidoCliente" ADD COLUMN "codigo_barras_escaner" TEXT', description: 'Add codigo_barras_escaner column to DetallePedidoCliente' },
      { sql: 'ALTER TABLE "DetalleVenta" ADD COLUMN "codigo_barras_escaner" TEXT', description: 'Add codigo_barras_escaner column to DetalleVenta' },
      { sql: 'ALTER TABLE "DetalleCompra" ADD COLUMN "codigo_barras_escaner" TEXT', description: 'Add codigo_barras_escaner column to DetalleCompra' },
      { sql: 'ALTER TABLE "DetallePresupuesto" ADD COLUMN "observaciones" TEXT', description: 'Add observaciones column to DetallePresupuesto' },
      { sql: 'ALTER TABLE "ProductoTerminado" ADD COLUMN "unidades" INTEGER', description: 'Add unidades column to ProductoTerminado (cantidad por paquete)' },
      // UPDATE tipo_harina for existing products based on name patterns
      { sql: `UPDATE "ProductoTerminado" SET tipo_harina = 'con_gluten' WHERE tipo_harina IS NULL AND nombre NOT LIKE '%integral%' AND nombre NOT LIKE '%sin gluten%'`, description: 'Set tipo_harina=con_gluten for regular products' },
      { sql: `UPDATE "ProductoTerminado" SET tipo_harina = 'integral' WHERE nombre LIKE '%integral%'`, description: 'Set tipo_harina=integral for integral products' },
      { sql: `UPDATE "ProductoTerminado" SET tipo_harina = 'sin_gluten' WHERE nombre LIKE '%sin gluten%'`, description: 'Set tipo_harina=sin_gluten for gluten-free products' },
      // Ensure all products have tipo_harina (fallback for any remaining NULL)
      { sql: `UPDATE "ProductoTerminado" SET tipo_harina = 'con_gluten' WHERE tipo_harina IS NULL`, description: 'Fallback: set tipo_harina=con_gluten for any remaining NULL' },
    ]

    for (const migration of migrations) {
      try {
        await client.execute(migration.sql)
        results.push({ statement: migration.description, status: 'ok' })
        created++
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        if (errMsg.includes('duplicate column name') || errMsg.includes('already exists')) {
          results.push({ statement: migration.description, status: 'skipped', error: errMsg })
          skipped++
        } else {
          results.push({ statement: migration.description, status: 'error', error: errMsg })
          errors++
        }
      }
    }

    // 6. Return result
    return NextResponse.json({
      success: errors === 0,
      message: `DDL push complete: ${created} created, ${skipped} skipped (already exist), ${errors} errors`,
      totalStatements: statements.length,
      created,
      skipped,
      errors,
      results,
    })
  } catch (error) {
    console.error('db-push-turso error:', error)
    return NextResponse.json(
      {
        error: 'Failed to push DDL to Turso',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
