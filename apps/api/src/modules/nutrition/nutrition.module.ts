import { Module } from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { PlanGuard } from '../../common/guards/plan.guard';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [NutritionController],
  providers: [NutritionService, PlanGuard],
  exports: [NutritionService],
})
export class NutritionModule {}
