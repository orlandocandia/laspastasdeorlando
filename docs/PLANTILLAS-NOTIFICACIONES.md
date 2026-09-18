# Plantillas de Notificaciones Personalizables

El módulo de **Plantillas de Notificaciones** (`/admin/notificaciones/plantillas`) permite personalizar el contenido de los mensajes automáticos que envía el sistema (confirmación de pedidos, alertas de stock, recordatorios de entrega, etc.).

---

## Características

### 1. Lista de plantillas
- Tabla con todas las plantillas disponibles (pedido_confirmado, pedido_listo, entrega_recordatorio, entrega_completada, stock_bajo, bienvenida).
- Activar/desactivar cada plantilla con un click (toggle en la columna "Activo").
- Estadísticas: total, activas, inactivas, por canal (email/WhatsApp).
- Contador de notificaciones enviadas por plantilla.

### 2. Editor con Markdown
- **Modo Editar**: textarea con fuente monoespaciada para escribir la plantilla.
- **Modo Vista Markdown**: previsualización renderizada del Markdown con datos de ejemplo.
- Selector de canal: Email, WhatsApp, o Ambos.
- Campo de asunto (solo para email).
- Switch de activo/desactivado.

### 3. Variables disponibles
Panel lateral con todas las variables canónicas. Click para insertar en la posición del cursor:

| Variable | Descripción | Contexto |
|----------|-------------|----------|
| `{cliente}` | Nombre del cliente | General |
| `{pedido}` | Número de pedido | Pedido |
| `{fecha}` | Fecha del evento | General |
| `{total}` | Total del pedido | Pedido |
| `{estado}` | Estado del pedido | Pedido |
| `{producto}` | Nombre del producto (alertas de stock) | Stock |
| `{stock_actual}` | Stock actual | Stock |
| `{stock_minimo}` | Stock mínimo | Stock |
| `{punto_encuentro}` | Punto de entrega | Pedido |
| `{hora_desde}` | Hora inicial de entrega | Pedido |
| `{hora_hasta}` | Hora final de entrega | Pedido |

**Formatos soportados:**
- `{variable}` — formato canónico (recomendado para nuevas plantillas).
- `{{variable}}` — formato heredado (mantenido por compatibilidad).

Ambos formatos pueden coexistir en la misma plantilla.

### 4. Previsualización
- Botón "Previsualizar" muestra el mensaje renderizado con datos de ejemplo.
- Vista diferenciada por canal:
  - **Email**: estilo de correo con encabezado mostaza, cuerpo crema, renderiza Markdown a HTML.
  - **WhatsApp**: estilo de chat con burbuja blanca, texto plano (WhatsApp no interpreta HTML pero respeta `*asteriscos*` para negrita).
- Lista de variables detectadas con sus valores de ejemplo.

### 5. Envío de prueba
- Campo para ingresar destinatario (email o teléfono).
- Envía una notificación real usando la plantilla con datos de ejemplo.
- Para WhatsApp sin API key configurada, genera un link wa.me.

### 6. Guardado y uso
- Los cambios se guardan en la base de datos (`PlantillaNotificacion`).
- Las alertas automáticas del sistema (stock bajo, pedidos pendientes) usan las plantillas guardadas cuando están activas.
- Si una plantilla está desactivada, las alertas caen al mensaje hardcoded por defecto.

---

## Formato Markdown soportado

| Sintaxis | Resultado |
|----------|-----------|
| `**negrita**` | **negrita** |
| `*cursiva*` | *cursiva* |
| `# Título` | Encabezado H1 |
| `## Subtítulo` | Encabezado H2 |
| `### Sección` | Encabezado H3 |
| `- item` | Lista con viñetas |
| `` `código` `` | Código inline |
| Línea en blanco | Separador de párrafos |
| Salto de línea simple | `<br>` dentro del párrafo |

> **Nota:** WhatsApp no renderiza HTML, pero interpreta `*texto*` como negrita. El Markdown se envía como texto plano a WhatsApp y se renderiza como HTML en emails.

---

## Archivos del módulo

| Archivo | Descripción |
|---------|-------------|
| `src/components/admin/PlantillasNotificaciones.tsx` | Componente principal (lista + editor + preview) |
| `src/app/(dashboard)/admin/notificaciones/plantillas/page.tsx` | Página que renderiza el componente |
| `src/lib/plantillas.ts` | Utilidades: extraerVariables, renderPlantilla, renderMarkdownToHtml, VARIABLES_PLANTILLA |
| `src/lib/notificaciones-service.ts` | Servicio de envío (usa plantillas guardadas en alertas) |
| `src/app/api/notificaciones/plantillas/route.ts` | API: listar plantillas |
| `src/app/api/notificaciones/plantillas/[id]/route.ts` | API: actualizar plantilla |
| `prisma/seed-notificaciones.ts` | Seed con plantillas canónicas usando `{variable}` |

---

## Cómo personalizar una plantilla

1. Ir a **Notificaciones → Plantillas** en el panel de administración.
2. Click en el botón ✏️ (Editar) de la plantilla deseada.
3. Escribir el mensaje usando variables `{variable}` y formato Markdown.
4. Click en una variable del panel lateral para insertarla en el cursor.
5. Cambiar a "Vista Markdown" para previsualizar el renderizado.
6. Click en "Previsualizar" para ver el mensaje completo con datos de ejemplo.
7. (Opcional) Enviar una prueba a un destinatario real.
8. Click en "Guardar Cambios".

---

## Cómo funciona el envío con plantillas

### Flujo de `enviarNotificacion`

```
enviarNotificacion({ id_plantilla, tipo, destinatario, variables })
  │
  ├─ Si id_plantilla está presente:
  │   ├─ Buscar plantilla en DB
  │   ├─ Verificar que esté activa
  │   ├─ renderPlantilla(plantilla.mensaje, variables)  → reemplaza {var} y {{var}}
  │   └─ renderPlantilla(plantilla.asunto, variables)   → idem para asunto
  │
  ├─ Si no hay plantilla pero hay variables:
  │   └─ renderPlantilla(mensaje, variables)  → reemplaza en el mensaje directo
  │
  ├─ Crear registro en DB (Notificacion)
  ├─ Enviar via SMTP (email) o TextMeBot (WhatsApp)
  └─ Actualizar estado (enviado/error)
```

### Alertas automáticas que usan plantillas

| Alerta | Plantilla usada | Variables inyectadas |
|--------|-----------------|---------------------|
| Stock bajo | `stock_bajo` | `{producto}`, `{stock_actual}`, `{stock_minimo}` |
| Pedido pendiente | `entrega_recordatorio` | `{cliente}`, `{pedido}`, `{estado}`, `{fecha}` |

Si la plantilla está desactivada o no existe, se usa un mensaje hardcoded de fallback.

---

## Agregar una nueva plantilla

1. Ejecutar el seed actualizado:
   ```bash
   bun run db:seed-notificaciones
   ```
2. O insertar manualmente via Prisma:
   ```ts
   await db.plantillaNotificacion.create({
     data: {
       nombre: 'mi_nueva_plantilla',
       canal: 'email',
       asunto: 'Asunto con {variable}',
       mensaje: 'Hola **{cliente}**, tu pedido *{pedido}*...',
       activo: true,
     },
   })
   ```
3. Para usarla en una alerta, agregar la lógica en `notificaciones-service.ts`:
   ```ts
   const plantilla = await db.plantillaNotificacion.findFirst({
     where: { nombre: 'mi_nueva_plantilla', activo: true },
   })
   if (plantilla) {
     await enviarNotificacion({
       id_plantilla: plantilla.id,
       tipo: 'email',
       destinatario,
       variables: { cliente: '...', pedido: '...' },
     })
   }
   ```
