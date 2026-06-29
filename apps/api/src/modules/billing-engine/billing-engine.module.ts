import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Post,
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

@Injectable()
class BillingEngineService {
  private readonly logger = new Logger(BillingEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    dto: { membership_type_id: string; provider: 'stripe' | 'mercadopago' | 'manual' },
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

    // Crea subscription PENDING — el cobro real ocurre cuando el provider
    // responde via webhook (próxima fase). En modo manual queda PENDING hasta
    // que el staff confirma el cobro.
    const sub = await this.prisma.billingSubscription.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        membership_type_id: dto.membership_type_id,
        provider: dto.provider,
        status: 'PENDING',
        amount_usd: type.price,
        interval: 'month',
      },
    });

    // En un setup completo, aquí se crearía el Checkout Session en Stripe o
    // la Preference de MercadoPago y se devolvería la URL. Por ahora devolvemos
    // la subscription tal cual y el cliente muestra info de "esperando confirmación".
    return {
      subscription: sub,
      checkout_url: null as string | null,
      next_steps:
        dto.provider === 'manual'
          ? 'Pasa por el gym a confirmar el pago. Tu membresía se activará al recibir el cobro.'
          : 'En esta versión, los pagos automáticos están desactivados. El staff te confirmará el cobro.',
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
    @Body() body: { membership_type_id: string; provider: 'stripe' | 'mercadopago' | 'manual' },
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
  imports: [DatabaseModule, AuthModule],
  providers: [BillingEngineService],
  controllers: [BillingMemberController, BillingWebhooksController],
})
export class BillingEngineModule {}
