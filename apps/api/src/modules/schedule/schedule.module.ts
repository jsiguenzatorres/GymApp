import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { DatabaseModule } from '../database/database.module';
import { PlanGuard } from '../../common/guards/plan.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, PlanGuard],
  exports: [ScheduleService],
})
export class ScheduleModule {}
