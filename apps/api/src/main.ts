import 'reflect-metadata'; // entry point
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Limite de body explicito. El default de Express/body-parser (100kb) es
  // insuficiente para uploads de imagen/video via data URI base64 (agrega
  // ~33% de overhead sobre el tamano del archivo). 20mb cubre imagenes (2MB)
  // y clips cortos de video de tecnica (hasta ~15MB) con margen.
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  // Global prefix
  app.setGlobalPrefix('api');

  // API versioning via URI (/api/v1/...)
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
    'http://localhost:8081',
  ];
  app.enableCors({ origin: corsOrigins, credentials: true });

  // Swagger (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GymApp API')
      .setDescription('API REST — Plataforma SaaS de Gestión de Gimnasios de Élite')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
      .addTag('auth', 'Autenticación y sesiones')
      .addTag('gyms', 'Configuración del gym')
      .addTag('members', 'Gestión de miembros')
      .addTag('health', 'Health checks')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger disponible en /api/docs');
  }

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  logger.log(`GymApp API corriendo en puerto ${port}`);
  logger.log(`Entorno: ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap();
