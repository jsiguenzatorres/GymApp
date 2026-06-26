import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RiskScoreService } from './risk-score.service';
import { DunningService } from './dunning.service';
import { RetentionService } from './retention.service';
import { AutomationController } from './automation.controller';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule, NotificationsModule],
  controllers: [AutomationController],
  providers: [RiskScoreService, DunningService, RetentionService],
  exports: [RiskScoreService, DunningService],
})
export class AutomationModule {}
