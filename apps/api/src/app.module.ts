import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Config global — carga .env automáticamente
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    // Event bus interno con GymEvent enum
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // Rate limiting global
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 }, // 20 req/seg
      { name: 'medium', ttl: 60000, limit: 200 }, // 200 req/min
    ]),

    DatabaseModule,
    HealthModule,
    // Módulos de negocio se agregarán aquí en cada sprint
  ],
  providers: [
    // Rate limit activado globalmente
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // TenantMiddleware extrae gym_id del JWT/header en CADA request
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/health', method: RequestMethod.GET },
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
