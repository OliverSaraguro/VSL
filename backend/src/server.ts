import http from 'http';
import app from './app';
import { env } from './config/environment';
import { prisma } from './config/database';
import { initTrackingGateway } from './modules/tracking/tracking.gateway';

const server = http.createServer(app);

initTrackingGateway(server);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Conexion a base de datos establecida');

    server.listen(env.PORT, () => {
      console.log(`VSL Backend corriendo en http://localhost:${env.PORT}`);
      console.log(`WebSocket activo en el mismo puerto`);
      console.log(`Entorno: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

bootstrap();
