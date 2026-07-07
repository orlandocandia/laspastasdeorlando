import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PlantillaNotificacion y AlertaConfiguracion...\n');

  // ============================================
  // PLANTILLAS DE NOTIFICACIÓN
  // ============================================
  // Variables canónicas: {cliente} {pedido} {fecha} {total} {estado} {producto}
  // También soporta el formato heredado {{variable}} por compatibilidad.
  // El mensaje soporta Markdown básico: **negrita**, *cursiva*, # título, - lista.

  const plantillas = [
    {
      nombre: 'pedido_confirmado',
      canal: 'whatsapp',
      asunto: null,
      mensaje: '✅ ¡Hola *{cliente}*! Tu pedido *N° {pedido}* fue confirmado.\n\nTotal: {total}\nEstado: {estado}\n\nTe avisaremos cuando esté listo para la entrega.',
      activo: true,
    },
    {
      nombre: 'pedido_listo',
      canal: 'whatsapp',
      asunto: null,
      mensaje: '🍝 ¡Hola *{cliente}*! Tu pedido *N° {pedido}* está listo.\n\nCoordinamos la entrega para el *{fecha}*.',
      activo: true,
    },
    {
      nombre: 'entrega_recordatorio',
      canal: 'whatsapp',
      asunto: null,
      mensaje: '📦 *Recordatorio de entrega*\n\nHola {cliente}, tu pedido *N° {pedido}* se entregará hoy {fecha}.\n\nEstado actual: {estado}',
      activo: true,
    },
    {
      nombre: 'entrega_completada',
      canal: 'whatsapp',
      asunto: null,
      mensaje: '🎉 ¡Tu pedido *N° {pedido}* fue entregado!\n\nEsperamos que lo disfrutes, {cliente}. Dejanos tu opinión en nuestra web.',
      activo: true,
    },
    {
      nombre: 'stock_bajo',
      canal: 'email',
      asunto: '⚠️ Alerta: Stock bajo en {producto}',
      mensaje: '# ⚠️ Alerta de Stock Bajo\n\nEl producto **{producto}** tiene stock por debajo del mínimo.\n\n- Stock actual: **{stock_actual}**\n- Stock mínimo: **{stock_minimo}**\n\nRevisá el inventario y generá una orden de producción o compra.',
      activo: true,
    },
    {
      nombre: 'bienvenida',
      canal: 'email',
      asunto: 'Bienvenido a Pastas Orlando',
      mensaje: '# ¡Bienvenido, {cliente}! 🍝\n\nGracias por registrarte en **Pastas Orlando**.\n\nTenemos las mejores pastas artesanales para vos. Explorá nuestro catálogo y hacé tu primer pedido.\n\n— El equipo de Pastas Orlando',
      activo: true,
    },
  ];

  for (const plantilla of plantillas) {
    const result = await prisma.plantillaNotificacion.upsert({
      where: { nombre: plantilla.nombre },
      update: {
        canal: plantilla.canal,
        asunto: plantilla.asunto,
        mensaje: plantilla.mensaje,
        activo: plantilla.activo,
      },
      create: plantilla,
    });
    console.log(`  ✅ Plantilla "${result.nombre}" (id: ${result.id})`);
  }

  console.log('');

  // ============================================
  // ALERTAS DE CONFIGURACIÓN
  // ============================================

  const alertas = [
    {
      tipo: 'stock_bajo',
      activo: true,
      umbral: 10,
      frecuencia: 'diario',
      destinatarios: null,
    },
    {
      tipo: 'pedido_pendiente',
      activo: true,
      umbral: null,
      frecuencia: 'diario',
      destinatarios: null,
    },
    {
      tipo: 'entrega_proxima',
      activo: true,
      umbral: null,
      frecuencia: 'inmediato',
      destinatarios: null,
    },
    {
      tipo: 'produccion_atrasada',
      activo: true,
      umbral: null,
      frecuencia: 'diario',
      destinatarios: null,
    },
  ];

  for (const alerta of alertas) {
    const result = await prisma.alertaConfiguracion.upsert({
      where: { tipo: alerta.tipo },
      update: {
        activo: alerta.activo,
        umbral: alerta.umbral,
        frecuencia: alerta.frecuencia,
        destinatarios: alerta.destinatarios,
      },
      create: alerta,
    });
    console.log(`  ✅ Alerta "${result.tipo}" (id: ${result.id})`);
  }

  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
