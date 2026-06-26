import { Module } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  controllers: [NutritionController],
  providers: [NutritionService, PlanGuard],
  exports: [NutritionService],
})
export class NutritionModule {}
