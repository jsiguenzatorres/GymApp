import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  private gymId(user: JwtPayload): string {
    if (!user.gymId) throw new ForbiddenException('Sin contexto de gym');
    return user.gymId;
  }

  // ─── PAGOS ───────────────────────────────────────────────────────────────────

  @Get('payments')
  listPayments(@CurrentUser() user: JwtPayload, @Query() query: ListPaymentsDto) {
    return this.billingService.listPayments(this.gymId(user), query);
  }

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  createPayment(@CurrentUser() user: JwtPayload, @Body() dto: CreatePaymentDto) {
    return this.billingService.createPayment(this.gymId(user), dto);
  }

  @Get('payments/:id')
  getPayment(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.getPayment(this.gymId(user), id);
  }

  @Post('payments/:id/refund')
  @HttpCode(HttpStatus.OK)
  refundPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.billingService.refundPayment(this.gymId(user), id, reason);
  }

  @Get('members/:memberId/payments')
  getMemberPayments(
    @CurrentUser() user: JwtPayload,
    @Param('memberId', ParseUUIDPipe) memberId: string,
  ) {
    return this.billingService.getMemberPayments(this.gymId(user), memberId);
  }

  // ─── BILLING SUMMARY ─────────────────────────────────────────────────────────

  @Get('billing/summary')
  getBillingSummary(@CurrentUser() user: JwtPayload) {
    return this.billingService.getBillingSummary(this.gymId(user));
  }
}

// ─── WEBHOOKS (sin autenticación JWT) ─────────────────────────────────────────

@Controller('api/v1/webhooks')
export class WebhooksController {
  constructor(private readonly billingService: BillingService) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.billingService.handleStripeWebhook(req.rawBody ?? Buffer.alloc(0), signature);
    return { received: true };
  }

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async mercadoPagoWebhook(@Body() data: Record<string, unknown>) {
    await this.billingService.handleMercadoPagoWebhook(data);
    return { received: true };
  }
}
