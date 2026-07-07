import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiModule } from '../ai/ai.module';
import { BillingModule } from '../billing/billing.module';
import { RiskScoreService } from './risk-score.service';
import { DunningService } from './dunning.service';
import { RetentionService } from './retention.service';
import { ScientificEngineService } from './scientific-engine.service';
import { SubscriptionRenewalService } from './subscription-renewal.service';
import { AutomationController } from './automation.controller';
import { ScientificEngineController } from './scientific-engine.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    NotificationsModule,
    AiModule,
    BillingModule,
    ConfigModule,
  ],
  controllers: [AutomationController, ScientificEngineController],
  providers: [
    RiskScoreService,
    DunningService,
    RetentionService,
    ScientificEngineService,
    SubscriptionRenewalService,
  ],
  exports: [RiskScoreService, DunningService, ScientificEngineService],
})
export class AutomationModule {}
