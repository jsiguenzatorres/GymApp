import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationExtrasService } from './gamification-extras.service';
import { GamificationExtrasController } from './gamification-extras.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [GamificationService, GamificationExtrasService, PlanGuard],
  controllers: [GamificationController, GamificationExtrasController],
  exports: [GamificationService, GamificationExtrasService],
})
export class GamificationModule {}
