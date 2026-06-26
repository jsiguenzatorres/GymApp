import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController, WebhooksController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [BillingController, WebhooksController],
  providers: [BillingService, StripeService, MercadoPagoService],
  exports: [BillingService, StripeService, MercadoPagoService],
})
export class BillingModule {}
