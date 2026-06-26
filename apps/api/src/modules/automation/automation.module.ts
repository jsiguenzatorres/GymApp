import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AiModule } from '../ai/ai.module';
import { RiskScoreService } from './risk-score.service';
import { DunningService } from './dunning.service';
import { RetentionService } from './retention.service';
import { ScientificEngineService } from './scientific-engine.service';
import { AutomationController } from './automation.controller';
import { ScientificEngineController } from './scientific-engine.controller';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, NotificationsModule, AiModule],
  controllers: [AutomationController, ScientificEngineController],
  providers: [RiskScoreService, DunningService, RetentionService, ScientificEngineService],
  exports: [RiskScoreService, DunningService, ScientificEngineService],
})
export class AutomationModule {}
