import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { DatabaseModule } from '../database/database.module';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  imports: [DatabaseModule],
  providers: [GamificationService, PlanGuard],
  controllers: [GamificationController],
  exports: [GamificationService],
})
export class GamificationModule {}
