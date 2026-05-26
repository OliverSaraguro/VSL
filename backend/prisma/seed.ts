import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.boarding.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.stop.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.trafficAlert.deleteMany();
  await prisma.driverSubstitution.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.student.deleteMany();
  await prisma.route.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('123456', 12);

  // ═══════════════════════════════════════════════════
  // CONDUCTORES
  // ═══════════════════════════════════════════════════
  const driverUser1 = await prisma.user.create({
    data: {
      email: 'conductor@vsl.com',
      password: hash,
      role: 'DRIVER',
      name: 'Oliver Saraguro',
      phone: '0991234567',
    },
  });

  const driver1 = await prisma.driver.create({
    data: {
      userId: driverUser1.id,
      licenseNumber: 'LIC-110045',
      plateNumber: 'LOJ-0456',
      vehicleModel: 'Hyundai County',
      vehicleColor: 'Amarillo',
      isVerified: true,
    },
  });

  const driverUser2 = await prisma.user.create({
    data: {
      email: 'pablo.mendoza@vsl.com',
      password: hash,
      role: 'DRIVER',
      name: 'Pablo Mendoza',
      phone: '0987112233',
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      userId: driverUser2.id,
      licenseNumber: 'LIC-220078',
      plateNumber: 'LOJ-0891',
      vehicleModel: 'Toyota Coaster',
      vehicleColor: 'Blanco',
      isVerified: true,
    },
  });

  // ═══════════════════════════════════════════════════
  // PADRES DE FAMILIA
  // ═══════════════════════════════════════════════════
  const parentUser1 = await prisma.user.create({
    data: {
      email: 'padre@vsl.com',
      password: hash,
      role: 'PARENT',
      name: 'María González',
      phone: '0987654321',
    },
  });
  const parent1 = await prisma.parent.create({
    data: { userId: parentUser1.id, invitationCode: 'INV-ABC123' },
  });

  const parentUser2 = await prisma.user.create({
    data: {
      email: 'carlos.vera@gmail.com',
      password: hash,
      role: 'PARENT',
      name: 'Carlos Vera',
      phone: '0998877665',
    },
  });
  const parent2 = await prisma.parent.create({
    data: { userId: parentUser2.id, invitationCode: 'INV-DEF456' },
  });

  const parentUser3 = await prisma.user.create({
    data: {
      email: 'lucia.bravo@gmail.com',
      password: hash,
      role: 'PARENT',
      name: 'Lucía Bravo',
      phone: '0976543210',
    },
  });
  const parent3 = await prisma.parent.create({
    data: { userId: parentUser3.id, invitationCode: 'INV-GHI789' },
  });

  const parentUser4 = await prisma.user.create({
    data: {
      email: 'andrea.cueva@gmail.com',
      password: hash,
      role: 'PARENT',
      name: 'Andrea Cueva',
      phone: '0961234567',
    },
  });
  const parent4 = await prisma.parent.create({
    data: { userId: parentUser4.id, invitationCode: 'INV-JKL012' },
  });

  const parentUser5 = await prisma.user.create({
    data: {
      email: 'jorge.sanchez@gmail.com',
      password: hash,
      role: 'PARENT',
      name: 'Jorge Sánchez',
      phone: '0951122334',
    },
  });
  const parent5 = await prisma.parent.create({
    data: { userId: parentUser5.id, invitationCode: 'INV-MNO345' },
  });

  const parentUser6 = await prisma.user.create({
    data: {
      email: 'rosa.maldonado@gmail.com',
      password: hash,
      role: 'PARENT',
      name: 'Rosa Maldonado',
      phone: '0942233445',
    },
  });
  const parent6 = await prisma.parent.create({
    data: { userId: parentUser6.id, invitationCode: 'INV-PQR678' },
  });

  // ═══════════════════════════════════════════════════
  // ESTUDIANTES (nombres comunes de Loja)
  // ═══════════════════════════════════════════════════
  const student1 = await prisma.student.create({
    data: {
      name: 'Sofía González',
      address: 'Av. Universitaria y Reinaldo Espinosa, Punzara',
      latitude: -4.0023,
      longitude: -79.2089,
      driverId: driver1.id,
      parentId: parent1.id,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      name: 'Mateo Vera',
      address: 'Calle Sucre y Quito, Centro de Loja',
      latitude: -3.9931,
      longitude: -79.2042,
      driverId: driver1.id,
      parentId: parent2.id,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      name: 'Isabella Bravo',
      address: 'Av. Manuel Agustín Aguirre, El Valle',
      latitude: -3.9870,
      longitude: -79.1987,
      driverId: driver1.id,
      parentId: parent3.id,
    },
  });

  const student4 = await prisma.student.create({
    data: {
      name: 'Sebastián Cueva',
      address: 'Ciudadela Zamora Huayco, calle París',
      latitude: -3.9812,
      longitude: -79.1945,
      driverId: driver1.id,
      parentId: parent4.id,
    },
  });

  const student5 = await prisma.student.create({
    data: {
      name: 'Valentina Sánchez',
      address: 'Barrio Ciudad Victoria, Av. 8 de Diciembre',
      latitude: -4.0095,
      longitude: -79.2123,
      driverId: driver1.id,
      parentId: parent5.id,
    },
  });

  const student6 = await prisma.student.create({
    data: {
      name: 'Daniel Maldonado',
      address: 'La Argelia, junto al parque Jipiro',
      latitude: -3.9755,
      longitude: -79.2001,
      driverId: driver1.id,
      parentId: parent6.id,
    },
  });

  // ═══════════════════════════════════════════════════
  // RUTAS (recorridos reales de Loja)
  // ═══════════════════════════════════════════════════
  const route1 = await prisma.route.create({
    data: {
      name: 'Ruta Matutina - La Salle',
      driverId: driver1.id,
      isActive: true,
    },
  });

  const route2 = await prisma.route.create({
    data: {
      name: 'Ruta Vespertina - Bernardo Valdivieso',
      driverId: driver1.id,
      isActive: true,
    },
  });

  const route3 = await prisma.route.create({
    data: {
      name: 'Ruta Matutina - Daniel Álvarez',
      driverId: driver2.id,
      isActive: true,
    },
  });

  // ═══════════════════════════════════════════════════
  // PARADAS (con coordenadas reales de Loja)
  // ═══════════════════════════════════════════════════
  await prisma.stop.createMany({
    data: [
      {
        routeId: route1.id,
        studentId: student5.id,
        order: 1,
        address: 'Av. 8 de Diciembre - Ciudad Victoria',
        latitude: -4.0095,
        longitude: -79.2123,
        estimatedTime: '06:30',
      },
      {
        routeId: route1.id,
        studentId: student1.id,
        order: 2,
        address: 'Av. Universitaria - Punzara',
        latitude: -4.0023,
        longitude: -79.2089,
        estimatedTime: '06:38',
      },
      {
        routeId: route1.id,
        studentId: student2.id,
        order: 3,
        address: 'Calle Sucre y Quito - Centro',
        latitude: -3.9931,
        longitude: -79.2042,
        estimatedTime: '06:45',
      },
      {
        routeId: route1.id,
        studentId: student3.id,
        order: 4,
        address: 'Av. Manuel A. Aguirre - El Valle',
        latitude: -3.9870,
        longitude: -79.1987,
        estimatedTime: '06:52',
      },
      {
        routeId: route1.id,
        studentId: student4.id,
        order: 5,
        address: 'Calle París - Zamora Huayco',
        latitude: -3.9812,
        longitude: -79.1945,
        estimatedTime: '06:58',
      },
      {
        routeId: route1.id,
        studentId: student6.id,
        order: 6,
        address: 'La Argelia - junto a Jipiro',
        latitude: -3.9755,
        longitude: -79.2001,
        estimatedTime: '07:05',
      },
    ],
  });

  // Destino final: Unidad Educativa La Salle
  // Coordenadas: -3.9965, -79.2015

  // ═══════════════════════════════════════════════════
  // VIAJE DE HOY (activo)
  // ═══════════════════════════════════════════════════
  const today = new Date();
  today.setHours(6, 30, 0, 0);

  const trip1 = await prisma.trip.create({
    data: {
      routeId: route1.id,
      driverId: driver1.id,
      status: 'ACTIVE',
      startedAt: today,
    },
  });

  // Abordajes de hoy
  await prisma.boarding.createMany({
    data: [
      {
        tripId: trip1.id,
        studentId: student5.id,
        latitude: -4.0095,
        longitude: -79.2123,
        boardedAt: new Date(today.getTime() + 2 * 60000),
      },
      {
        tripId: trip1.id,
        studentId: student1.id,
        latitude: -4.0023,
        longitude: -79.2089,
        boardedAt: new Date(today.getTime() + 9 * 60000),
      },
      {
        tripId: trip1.id,
        studentId: student2.id,
        latitude: -3.9931,
        longitude: -79.2042,
        boardedAt: new Date(today.getTime() + 16 * 60000),
      },
    ],
  });

  // ═══════════════════════════════════════════════════
  // AUSENCIAS
  // ═══════════════════════════════════════════════════
  const todayStr = new Date().toISOString().split('T')[0];
  await prisma.absence.create({
    data: {
      studentId: student4.id,
      date: todayStr,
      reason: 'Cita médica en el hospital Isidro Ayora',
      registeredBy: parent4.id,
    },
  });

  // ═══════════════════════════════════════════════════
  // PAGOS (Mayo 2026)
  // ═══════════════════════════════════════════════════
  await prisma.payment.createMany({
    data: [
      { studentId: student1.id, driverId: driver1.id, month: 5, year: 2026, amount: 45.00, status: 'PAID', paidAt: new Date('2026-05-05'), dueDate: '2026-05-01' },
      { studentId: student2.id, driverId: driver1.id, month: 5, year: 2026, amount: 45.00, status: 'PAID', paidAt: new Date('2026-05-03'), dueDate: '2026-05-01' },
      { studentId: student3.id, driverId: driver1.id, month: 5, year: 2026, amount: 45.00, status: 'PENDING', dueDate: '2026-05-01' },
      { studentId: student4.id, driverId: driver1.id, month: 5, year: 2026, amount: 45.00, status: 'PAID', paidAt: new Date('2026-05-02'), dueDate: '2026-05-01' },
      { studentId: student5.id, driverId: driver1.id, month: 5, year: 2026, amount: 45.00, status: 'PENDING', dueDate: '2026-05-01' },
      { studentId: student6.id, driverId: driver1.id, month: 5, year: 2026, amount: 45.00, status: 'PAID', paidAt: new Date('2026-05-08'), dueDate: '2026-05-01' },
    ],
  });

  // ═══════════════════════════════════════════════════
  // NOTIFICACIONES
  // ═══════════════════════════════════════════════════
  await prisma.notification.createMany({
    data: [
      {
        userId: parentUser1.id,
        title: 'Abordaje confirmado',
        body: 'Sofía González abordó la buseta a las 06:38 en Av. Universitaria.',
        type: 'boarding',
        isRead: false,
      },
      {
        userId: parentUser4.id,
        title: 'Ausencia registrada',
        body: 'Se registró la ausencia de Sebastián Cueva para hoy.',
        type: 'absence',
        isRead: true,
      },
      {
        userId: parentUser3.id,
        title: 'Pago pendiente',
        body: 'El pago de Mayo de Isabella Bravo está pendiente ($45.00).',
        type: 'payment',
        isRead: false,
      },
      {
        userId: driverUser1.id,
        title: 'Ruta iniciada',
        body: 'Tu ruta "Ruta Matutina - La Salle" ha comenzado.',
        type: 'trip',
        isRead: true,
      },
      {
        userId: parentUser2.id,
        title: 'Abordaje confirmado',
        body: 'Mateo Vera abordó la buseta a las 06:45 en calle Sucre.',
        type: 'boarding',
        isRead: false,
      },
    ],
  });

  // ═══════════════════════════════════════════════════
  // MENSAJES PREDEFINIDOS ENVIADOS HOY
  // ═══════════════════════════════════════════════════
  await prisma.message.createMany({
    data: [
      {
        routeId: route1.id,
        driverId: driver1.id,
        content: 'Ya estoy afuera',
        type: 'PREDEFINED',
      },
      {
        routeId: route1.id,
        driverId: driver1.id,
        content: 'Pequeño retraso por tráfico en Av. Universitaria',
        type: 'PREDEFINED',
      },
    ],
  });

  // ═══════════════════════════════════════════════════
  // ALERTA DE TRÁFICO
  // ═══════════════════════════════════════════════════
  await prisma.trafficAlert.create({
    data: {
      routeId: route1.id,
      description: 'Cierre parcial por obras en Av. Universitaria altura del redondel de Punzara',
      latitude: -4.0010,
      longitude: -79.2075,
      isActive: true,
    },
  });

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅  DATOS DE LOJA CREADOS EXITOSAMENTE                   ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║                                                            ║');
  console.log('║  👨‍✈️  Conductores: 2                                        ║');
  console.log('║  👨‍👩‍👧  Padres: 6                                              ║');
  console.log('║  👦  Estudiantes: 6                                         ║');
  console.log('║  🗺️   Rutas: 3                                              ║');
  console.log('║  📍  Paradas: 6 (con GPS real de Loja)                     ║');
  console.log('║  🚌  Viaje activo: 1 (Ruta Matutina - La Salle)           ║');
  console.log('║  ✅  Abordajes hoy: 3/6                                    ║');
  console.log('║  ❌  Ausencias hoy: 1 (Sebastián - cita médica)           ║');
  console.log('║  💰  Pagos Mayo: 4 pagados, 2 pendientes                  ║');
  console.log('║  🔔  Notificaciones: 5                                     ║');
  console.log('║  💬  Mensajes: 2                                           ║');
  console.log('║  ⚠️   Alertas tráfico: 1                                   ║');
  console.log('║                                                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║  CREDENCIALES                                              ║');
  console.log('║  ─────────────────────────────────────────                 ║');
  console.log('║  Conductor: conductor@vsl.com / 123456                     ║');
  console.log('║  Padre:     padre@vsl.com / 123456                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
