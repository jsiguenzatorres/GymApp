import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Post,
  Query,
  UseGuards,
  Logger,
  Param,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { StripeService } from '../billing/stripe.service';
import { MercadoPagoService } from '../billing/mercadopago.service';
import { BillingModule } from '../billing/billing.module';
import { CouponsService } from '../coupons/coupons.service';
import { CouponsModule } from '../coupons/coupons.module';

@Injectable()
class BillingEngineService {
  private readonly logger = new Logger(BillingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly mp: MercadoPagoService,
    private readonly coupons: CouponsService,
  ) {}

  isStripeEnabled(): boolean {
    return Boolean(process.env.STRIPE_SECRET_KEY);
  }

  isMercadoPagoEnabled(): boolean {
    return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
  }

  providersAvailable() {
    return {
      stripe: this.isStripeEnabled(),
      mercadopago: this.isMercadoPagoEnabled(),
      manual: true, // siempre disponible
    };
  }

  async listMine(memberId: string) {
    return this.prisma.billingSubscription.findMany({
      where: { member_id: memberId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createCheckout(
    gymId: string,
    memberId: string,
    dto: {
      membership_type_id: string;
      provider: 'stripe' | 'mercadopago' | 'manual';
      coupon_code?: string;
    },
  ) {
    const type = await this.prisma.membershipType.findFirst({
      where: { id: dto.membership_type_id, gym_id: gymId, is_active: true },
    });
    if (!type) throw new NotFoundException('Tipo de membresía no válido');

    // Validar que el provider esté habilitado
    if (dto.provider === 'stripe' && !this.isStripeEnabled()) {
      throw new ForbiddenException('Stripe no está configurado en este ambiente');
    }
    if (dto.provider === 'mercadopago' && !this.isMercadoPagoEnabled()) {
      throw new ForbiddenException('MercadoPago no está configurado en este ambiente');
    }

    // Cupón (opcional): valida y calcula el monto final ANTES de crear la
    // subscription — si el código no es válido, falla aquí sin crear nada.
    let couponId: string | null = null;
    let finalAmount = Number(type.price);
    if (dto.coupon_code) {
      const result = await this.coupons.validate(
        gymId,
        dto.coupon_code,
        type.id,
        memberId,
        Number(type.price),
      );
      couponId = result.coupon.id;
      finalAmount = Math.max(0, Number(type.price) - result.discountAmount);
    }

    // Crea subscription PENDING — el cobro real ocurre cuando el provider
    // responde via webhook (BillingService.activateSubscriptionIfMatched).
    const sub = await this.prisma.billingSubscription.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        membership_type_id: dto.membership_type_id,
        provider: dto.provider,
        status: 'PENDING',
        amount_usd: finalAmount,
        interval: 'month',
      },
    });

    // El cupón se redime aquí (checkout creado), no al activarse el webhook —
    // igual que en assignMembership, se acepta que un checkout abandonado
    // consuma el uso; mantiene la lógica simple y consistente entre flujos.
    if (couponId) {
      await this.coupons.redeem(couponId, memberId, undefined, Number(type.price) - finalAmount);
    }

    let checkoutUrl: string | null = null;
    let clientSecret: string | null = null;

    if (dto.provider === 'stripe') {
      const intent = await this.stripe.createPaymentIntent({
        amount: finalAmount,
        currency: 'usd',
        metadata: { gymId, memberId, billingSubscriptionId: sub.id, membershipTypeId: type.id },
        description: `Membresía ${type.name}`,
      });
      if (intent) {
        clientSecret = intent.clientSecret;
        await this.prisma.billingSubscription.update({
          where: { id: sub.id },
          data: { external_id: intent.paymentIntentId },
        });
      } else {
        this.logger.warn(`Stripe payment intent no se pudo crear para subscription ${sub.id}`);
      }
    } else if (dto.provider === 'mercadopago') {
      const member = await this.prisma.member.findFirst({
        where: { id: memberId },
        include: { user: { select: { email: true } } },
      });
      const pref = await this.mp.createPreference(
        [{ id: type.id, title: `Membresía ${type.name}`, quantity: 1, unit_price: finalAmount }],
        { email: member?.user.email ?? '', name: `${member?.first_name} ${member?.last_name}` },
        gymId,
        sub.id, // external_reference — el webhook lo usa para encontrar esta subscription
      );
      if (pref) {
        checkoutUrl = pref.initPoint;
        await this.prisma.billingSubscription.update({
          where: { id: sub.id },
          data: { external_id: pref.preferenceId },
        });
      } else {
        this.logger.warn(`MercadoPago preference no se pudo crear para subscription ${sub.id}`);
      }
    }

    const gatewayFailed = dto.provider !== 'manual' && !checkoutUrl && !clientSecret;

    return {
      subscription: sub,
      checkout_url: checkoutUrl,
      client_secret: clientSecret,
      next_steps:
        dto.provider === 'manual'
          ? 'Pasa por el gym a confirmar el pago. Tu membresía se activará al recibir el cobro.'
          : gatewayFailed
            ? 'No se pudo generar el checkout en este momento. Intenta de nuevo o contacta al gym.'
            : dto.provider === 'stripe'
              ? 'Completa el pago con el método de Stripe en la app. Tu membresía se activa automáticamente al confirmarse.'
              : 'Completa el pago en MercadoPago. Tu membresía se activa automáticamente al confirmarse.',
    };
  }

  async cancelMine(memberId: string, subscriptionId: string) {
    const sub = await this.prisma.billingSubscription.findFirst({
      where: { id: subscriptionId, member_id: memberId },
    });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    return this.prisma.billingSubscription.update({
      where: { id: subscriptionId },
      data: { cancel_at_period_end: true, status: 'CANCELLED' },
    });
  }

  /** Admin: lista eventos de webhook recibidos (J4) */
  async listWebhookEvents(opts: { provider?: string; processed?: boolean; limit?: number }) {
    return this.prisma.billingWebhookEvent.findMany({
      where: {
        ...(opts.provider ? { provider: opts.provider } : {}),
        ...(opts.processed !== undefined ? { processed: opts.processed } : {}),
      },
      orderBy: { received_at: 'desc' },
      take: Math.min(opts.limit ?? 50, 200),
    });
  }

  /**
   * Recibe webhook crudo de Stripe/MP. Guarda el evento para idempotencia y
   * deja procesamiento real para Fase 2. Por ahora solo registra.
   */
  async ingestWebhook(provider: string, externalId: string, eventType: string, payload: unknown) {
    try {
      await this.prisma.billingWebhookEvent.create({
        data: {
          provider,
          event_type: eventType,
          external_id: externalId,
          payload: payload as never,
          processed: false,
        },
      });
    } catch {
      // unique constraint = ya recibimos este evento (idempotencia)
      this.logger.log(`webhook duplicate: ${provider}/${externalId}`);
    }
    return { received: true };
  }
}

@Controller()
@UseGuards(JwtAuthGuard)
class BillingMemberController {
  constructor(
    private readonly svc: BillingEngineService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveMember(user: JwtPayload) {
    const m = await this.prisma.member.findFirst({
      where: { user_id: user.sub },
      select: { id: true, gym_id: true },
    });
    if (!m) throw new ForbiddenException('Member no encontrado');
    return m;
  }

  @Get('me/billing/providers')
  providers() {
    return this.svc.providersAvailable();
  }

  @Get('me/billing/subscriptions')
  async list(@CurrentUser() user: JwtPayload) {
    const m = await this.resolveMember(user);
    return this.svc.listMine(m.id);
  }

  @Post('me/billing/checkout')
  async checkout(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      membership_type_id: string;
      provider: 'stripe' | 'mercadopago' | 'manual';
      coupon_code?: string;
    },
  ) {
    const m = await this.resolveMember(user);
    return this.svc.createCheckout(m.gym_id, m.id, body);
  }

  @Post('me/billing/subscriptions/:id/cancel')
  async cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const m = await this.resolveMember(user);
    return this.svc.cancelMine(m.id, id);
  }
}

/** Admin: ver eventos de webhook recibidos (J4) */
@Controller('admin/billing/webhooks')
@UseGuards(JwtAuthGuard)
class BillingWebhooksAdminController {
  constructor(private readonly svc: BillingEngineService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query('provider') provider?: string,
    @Query('processed') processed?: string,
    @Query('limit') limit?: string,
  ) {
    if (!['GYM_OWNER', 'GYM_ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Solo staff puede ver webhooks');
    }
    return this.svc.listWebhookEvents({
      provider,
      processed: processed === 'true' ? true : processed === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}

/** Webhook público (sin auth) — recibe de Stripe / MP. La firma se valida en Fase 2. */
@Controller('webhooks/billing')
class BillingWebhooksController {
  constructor(private readonly svc: BillingEngineService) {}

  @Post('stripe')
  async stripe(@Body() body: { id?: string; type?: string }) {
    return this.svc.ingestWebhook('stripe', body.id ?? 'unknown', body.type ?? 'unknown', body);
  }

  @Post('mercadopago')
  async mercadopago(@Body() body: { id?: string | number; action?: string; type?: string }) {
    return this.svc.ingestWebhook(
      'mercadopago',
      String(body.id ?? 'unknown'),
      body.action ?? body.type ?? 'unknown',
      body,
    );
  }
}

@Module({
  imports: [DatabaseModule, AuthModule, BillingModule, CouponsModule],
  providers: [BillingEngineService],
  controllers: [BillingMemberController, BillingWebhooksAdminController, BillingWebhooksController],
})
export class BillingEngineModule {}
