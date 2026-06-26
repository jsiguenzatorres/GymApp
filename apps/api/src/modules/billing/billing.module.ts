import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController, WebhooksController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [BillingController, WebhooksController],
  providers: [BillingService, StripeService],
  exports: [BillingService, StripeService],
})
export class BillingModule {}
