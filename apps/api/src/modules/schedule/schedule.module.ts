import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { DatabaseModule } from '../database/database.module';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, PlanGuard],
  exports: [ScheduleService],
})
export class ScheduleModule {}
