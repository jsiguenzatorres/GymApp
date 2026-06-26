import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, PlanGuard],
  exports: [LeadsService],
})
export class LeadsModule {}
