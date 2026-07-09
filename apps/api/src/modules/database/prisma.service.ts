import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantScopeExtension } from './tenant-scope.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
    // Aplica la red de seguridad de aislamiento multi-tenant a esta MISMA
    // instancia (en vez de retornar un cliente extendido aparte) para que
    // los 30+ services que ya inyectan PrismaService por DI la obtengan
    // automáticamente, sin tocar un solo archivo consumidor. Object.assign
    // preserva la identidad de `this`, así que onModuleInit/onModuleDestroy
    // y el ciclo de vida de Nest siguen funcionando exactamente igual.
    Object.assign(this, this.$extends(tenantScopeExtension));
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conectado a PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Desconectado de PostgreSQL');
  }

  /** Limpia las tablas en orden para tests — solo usar en test environment */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase solo puede usarse en entorno de test');
    }
    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
}
