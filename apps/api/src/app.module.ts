import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { BillingModule } from './modules/billing/billing.module';
import { WorkoutModule } from './modules/workout/workout.module';
import { CrmModule } from './modules/crm/crm.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { AccessModule } from './modules/access/access.module';
import { StaffModule } from './modules/staff/staff.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { LeadsModule } from './modules/leads/leads.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AutomationModule } from './modules/automation/automation.module';
import { FounderModule } from './modules/founder/founder.module';
import { AddonsModule } from './modules/addons/addons.module';
import { HealthDataModule } from './modules/health-data/health-data.module';
import { NotificationPrefsModule } from './modules/notification-prefs/notification-prefs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),

    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 60000, limit: 200 },
    ]),

    AiModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    MembersModule,
    BillingModule,
    WorkoutModule,
    NotificationsModule,
    CrmModule,
    AnalyticsModule,
    AccessModule,
    StaffModule,
    GymsModule,
    MarketplaceModule,
    NutritionModule,
    ScheduleModule,
    GamificationModule,
    LeadsModule,
    FeedbackModule,
    WebhooksModule,
    AutomationModule,
    FounderModule,
    AddonsModule,
    HealthDataModule,
    NotificationPrefsModule,
    // Módulos de negocio se agregan aquí en cada sprint
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/health', method: RequestMethod.GET },
        { path: 'api/v1/health/ping', method: RequestMethod.GET },
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        { path: 'api/v1/auth/password/reset-request', method: RequestMethod.POST },
        { path: 'api/v1/auth/password/reset', method: RequestMethod.POST },
        { path: 'api/v1/webhooks/stripe', method: RequestMethod.POST },
        { path: 'api/v1/webhooks/mercadopago', method: RequestMethod.POST },
        { path: 'api/v1/webhooks/whatsapp/*', method: RequestMethod.GET },
        { path: 'api/v1/webhooks/whatsapp/*', method: RequestMethod.POST },
        { path: 'api/v1/webhooks/telegram/*', method: RequestMethod.POST },
        { path: 'api/v1/founder-offer/status', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
