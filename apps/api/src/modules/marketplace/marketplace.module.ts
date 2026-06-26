import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { PlanGuard } from '../../common/guards/plan.guard';

@Module({
  controllers: [MarketplaceController],
  providers: [MarketplaceService, PlanGuard],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
