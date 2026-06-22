import { Module } from '@nestjs/common';
import { BillingController, WebhooksController } from './billing.controller';
import { BillingService } from './billing.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController, WebhooksController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
