import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  imports: [AiModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, PlanGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
