import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly mp: MercadoPagoService,
  ) {}

  // ─── PAGOS ───────────────────────────────────────────────────────────────────

  async createPayment(gymId: string, dto: CreatePaymentDto) {
    // Verificar que el miembro pertenece al gym
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gym_id: gymId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    // Si se especifica membresía, validar que pertenece al miembro/gym
    if (dto.membershipId) {
      const membership = await this.prisma.membership.findFirst({
        where: { id: dto.membershipId, member_id: dto.memberId, gym_id: gymId },
      });
      if (!membership) throw new NotFoundException('Membresía no encontrada');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

    const payment = await this.prisma.payment.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        membership_id: dto.membershipId,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        status: 'SUCCEEDED', // pagos manuales se consideran inmediatamente exitosos
        payment_type: dto.paymentType,
        description: dto.description,
        notes: dto.notes,
        invoice_type: dto.invoiceType,
        paid_at: paidAt,
      },
      include: {
        member: {
          select: { first_name: true, last_name: true, user: { select: { email: true } } },
        },
        membership: { include: { type: { select: { name: true } } } },
      },
    });

    this.logger.log(
      `Payment ${payment.id} created — ${dto.paymentType} $${dto.amount} — member ${dto.memberId}`,
    );

    return payment;
  }

  async listPayments(gymId: string, query: ListPaymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { gym_id: gymId };

    if (query.status) where['status'] = query.status;
    if (query.memberId) where['member_id'] = query.memberId;
    if (query.paymentType) where['payment_type'] = query.paymentType;

    if (query.startDate || query.endDate) {
      where['paid_at'] = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate + 'T23:59:59Z') }),
      };
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          member: {
            select: { first_name: true, last_name: true, user: { select: { email: true } } },
          },
          membership: { include: { type: { select: { name: true } } } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPayment(gymId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, gym_id: gymId },
      include: {
        member: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            user: { select: { email: true } },
          },
        },
        membership: { include: { type: true } },
        payment_method: { select: { gateway: true, last_four: true, card_brand: true } },
      },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    return { ...payment, amount: Number(payment.amount) };
  }

  async getMemberPayments(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const payments = await this.prisma.payment.findMany({
      where: { member_id: memberId, gym_id: gymId },
      orderBy: { created_at: 'desc' },
      include: {
        membership: { include: { type: { select: { name: true } } } },
      },
    });

    return payments.map((p) => ({ ...p, amount: Number(p.amount) }));
  }

  // ─── BILLING SUMMARY (para dashboard) ────────────────────────────────────────

  async getBillingSummary(gymId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth, pending, failedCount] = await Promise.all([
      // Total cobrado este mes
      this.prisma.payment.aggregate({
        where: { gym_id: gymId, status: 'SUCCEEDED', paid_at: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      // Total cobrado mes anterior
      this.prisma.payment.aggregate({
        where: {
          gym_id: gymId,
          status: 'SUCCEEDED',
          paid_at: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Pagos pendientes
      this.prisma.payment.aggregate({
        where: { gym_id: gymId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      // Pagos fallidos este mes (dunning)
      this.prisma.payment.count({
        where: { gym_id: gymId, status: 'FAILED', created_at: { gte: startOfMonth } },
      }),
    ]);

    const thisMonthTotal = Number(thisMonth._sum.amount ?? 0);
    const lastMonthTotal = Number(lastMonth._sum.amount ?? 0);
    const growth =
      lastMonthTotal > 0
        ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
        : null;

    return {
      thisMonth: { total: thisMonthTotal, count: thisMonth._count },
      lastMonth: { total: lastMonthTotal, count: lastMonth._count },
      pending: { total: Number(pending._sum.amount ?? 0), count: pending._count },
      failedThisMonth: failedCount,
      growth,
    };
  }

  // ─── Stripe Payment Intent (para pagos online) ───────────────────────────────

  async createStripeIntent(gymId: string, dto: CreatePaymentDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gym_id: gymId },
      include: { user: { select: { email: true } } },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const intent = await this.stripe.createPaymentIntent({
      amount: dto.amount,
      currency: dto.currency ?? 'usd',
      metadata: {
        gymId,
        memberId: dto.memberId,
        memberEmail: member.user.email,
        ...(dto.membershipId ? { membershipId: dto.membershipId } : {}),
      },
      description: dto.description,
    });

    if (!intent) {
      // Stripe not configured — fall back to manual record
      return this.createPayment(gymId, dto);
    }

    // Create a PENDING payment record linked to Stripe
    const payment = await this.prisma.payment.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        membership_id: dto.membershipId,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        status: 'PENDING',
        payment_type: 'STRIPE',
        description: dto.description,
        gateway_payment_id: intent.paymentIntentId,
        gateway_status: 'requires_payment_method',
      },
    });

    return { payment, clientSecret: intent.clientSecret };
  }

  // ─── Stripe refund via gateway ────────────────────────────────────────────────

  async refundPayment(gymId: string, id: string, reason?: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, gym_id: gymId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status !== 'SUCCEEDED') {
      throw new BadRequestException('Solo se pueden reembolsar pagos exitosos');
    }

    if (payment.payment_type === 'STRIPE' && payment.gateway_payment_id) {
      const refund = await this.stripe.createRefund(payment.gateway_payment_id, reason);
      if (!refund) this.logger.warn(`[STRIPE] Refund skipped — client not configured`);
    } else if (payment.payment_type === 'MERCADOPAGO') {
      this.logger.warn(`[STUB] MercadoPago refund not yet implemented`);
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED', notes: reason ? `Reembolso: ${reason}` : payment.notes },
    });
    return { ...updated, amount: Number(updated.amount) };
  }

  // ─── Stripe webhook ───────────────────────────────────────────────────────────

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripe.constructWebhookEvent(payload, signature);

    if (!event) {
      this.logger.warn('[STRIPE] Webhook ignored — credentials not configured');
      return;
    }

    this.logger.log(`Stripe event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as { id: string; amount: number };
        await this.prisma.payment.updateMany({
          where: { gateway_payment_id: pi.id },
          data: {
            status: 'SUCCEEDED',
            gateway_status: 'succeeded',
            paid_at: new Date(),
            amount: pi.amount / 100,
          },
        });
        await this.activateSubscriptionIfMatched({ provider: 'stripe', externalId: pi.id });
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string; last_payment_error?: { message?: string } };
        await this.prisma.payment.updateMany({
          where: { gateway_payment_id: pi.id },
          data: {
            status: 'FAILED',
            gateway_status: 'failed',
            notes: pi.last_payment_error?.message ?? 'Pago fallido via Stripe',
          },
        });
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as { payment_intent?: string };
        if (charge.payment_intent) {
          await this.prisma.payment.updateMany({
            where: { gateway_payment_id: charge.payment_intent },
            data: { status: 'REFUNDED', gateway_status: 'refunded' },
          });
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  async handleMercadoPagoWebhook(data: Record<string, unknown>): Promise<void> {
    const result = await this.mp.processWebhook(
      data as Parameters<typeof this.mp.processWebhook>[0],
    );
    if (!result) return;

    this.logger.log(
      `MP webhook: paymentId=${result.paymentId} status=${result.status} ref=${result.externalReference}`,
    );

    // externalReference = our internal payment UUID
    if (!result.externalReference) return;

    const payment = await this.prisma.payment.findFirst({
      where: { id: result.externalReference },
    });
    if (!payment) return;

    const newStatus: 'SUCCEEDED' | 'FAILED' | 'PENDING' =
      result.status === 'approved'
        ? 'SUCCEEDED'
        : result.status === 'rejected'
          ? 'FAILED'
          : 'PENDING';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    this.logger.log(`Payment ${payment.id} updated to ${newStatus} via MercadoPago`);

    if (newStatus === 'SUCCEEDED') {
      await this.activateSubscriptionIfMatched({
        provider: 'mercadopago',
        subscriptionId: payment.id,
      });
    }
  }

  // ─── Activación de BillingSubscription (autoservicio del miembro) ────────────
  // Une el webhook de pago exitoso (Stripe/MP) con la suscripción PENDING creada
  // en BillingEngineModule.createCheckout — activa la suscripción y genera la
  // Membership real, sin depender del staff para confirmar manualmente.
  private async activateSubscriptionIfMatched(matcher: {
    provider: 'stripe' | 'mercadopago';
    externalId?: string;
    subscriptionId?: string;
  }): Promise<void> {
    const sub = await this.prisma.billingSubscription.findFirst({
      where: {
        provider: matcher.provider,
        status: 'PENDING',
        ...(matcher.subscriptionId
          ? { id: matcher.subscriptionId }
          : { external_id: matcher.externalId }),
      },
    });
    if (!sub) return;

    const type = await this.prisma.membershipType.findFirst({
      where: { id: sub.membership_type_id },
    });
    if (!type) {
      this.logger.error(`BillingSubscription ${sub.id}: membership_type_id no encontrado`);
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + type.duration_days);
    const membershipStatus = type.is_trial ? 'TRIAL' : 'ACTIVE';

    await this.prisma.$transaction(async (tx) => {
      await tx.membership.create({
        data: {
          gym_id: sub.gym_id,
          member_id: sub.member_id,
          type_id: sub.membership_type_id,
          status: membershipStatus,
          start_date: startDate,
          end_date: endDate,
          price_paid: type.price,
          currency: type.currency,
          notes: `Auto-generada por suscripción ${matcher.provider} (checkout de autoservicio)`,
        },
      });
      await tx.member.update({ where: { id: sub.member_id }, data: { status: membershipStatus } });
      await tx.billingSubscription.update({
        where: { id: sub.id },
        data: { status: 'ACTIVE', current_period_start: startDate, current_period_end: endDate },
      });
    });

    this.logger.log(
      `BillingSubscription ${sub.id} activada vía ${matcher.provider} — Membership creada para member ${sub.member_id}`,
    );
  }
}
