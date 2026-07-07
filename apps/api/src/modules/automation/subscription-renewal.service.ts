import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { StripeService } from '../billing/stripe.service';
import { MercadoPagoService } from '../billing/mercadopago.service';

// Cobra de nuevo las BillingSubscription de autoservicio (checkout member-facing,
// distinto del flujo staff Payment/Membership) cuando su período actual termina,
// y extiende la Membership asociada. Si el cobro falla, crea un Payment FAILED
// para que DunningService tome el reintento — reusa esa máquina de estados en
// vez de duplicarla aquí.
@Injectable()
export class SubscriptionRenewalService {
  private readonly logger = new Logger(SubscriptionRenewalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
    private readonly stripe: StripeService,
    private readonly mp: MercadoPagoService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processRenewals() {
    const now = new Date();

    const due = await this.prisma.billingSubscription.findMany({
      where: {
        status: 'ACTIVE',
        cancel_at_period_end: false,
        provider: { in: ['stripe', 'mercadopago'] },
        current_period_end: { lte: now },
      },
      take: 100,
    });

    if (!due.length) return;
    this.logger.log(`Procesando renovación de ${due.length} suscripciones`);

    for (const sub of due) {
      try {
        await this.renewOne(sub);
      } catch (err) {
        this.logger.error(`Error renovando subscription ${sub.id}: ${(err as Error).message}`);
      }
    }
  }

  private async renewOne(sub: {
    id: string;
    gym_id: string;
    member_id: string;
    membership_type_id: string;
    provider: string;
    amount_usd: unknown;
  }) {
    const [type, member] = await Promise.all([
      this.prisma.membershipType.findFirst({ where: { id: sub.membership_type_id } }),
      this.prisma.member.findFirst({
        where: { id: sub.member_id },
        select: { id: true, user_id: true, status: true, user: { select: { email: true } } },
      }),
    ]);
    if (!type || !member) {
      this.logger.error(`Subscription ${sub.id} referencia tipo/miembro inexistente`);
      return;
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { member_id: sub.member_id, gateway: sub.provider, is_active: true, is_default: true },
    });

    const amount = Number(sub.amount_usd);

    if (!paymentMethod) {
      await this.markPastDueAndNotify(sub.id, sub.gym_id, member.user_id, amount);
      return;
    }

    const charge =
      sub.provider === 'stripe'
        ? await this.stripe.chargeSavedPaymentMethod({
            paymentMethodToken: paymentMethod.gateway_token,
            amount,
            currency: 'usd',
            metadata: { billingSubscriptionId: sub.id },
            description: `Renovación membresía ${type.name}`,
          })
        : await this.mp.chargeSavedCard({
            cardToken: paymentMethod.gateway_token,
            amount,
            payerEmail: member.user.email,
            externalReference: sub.id,
            description: `Renovación membresía ${type.name}`,
          });

    if (!charge.succeeded) {
      await this.recordFailedPayment(sub, paymentMethod.id, amount);
      await this.markPastDueAndNotify(sub.id, sub.gym_id, member.user_id, amount);
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + type.duration_days);
    const gatewayPaymentId =
      'paymentIntentId' in charge ? charge.paymentIntentId : charge.paymentId;

    await this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          gym_id: sub.gym_id,
          member_id: sub.member_id,
          type_id: sub.membership_type_id,
          status: 'ACTIVE',
          start_date: startDate,
          end_date: endDate,
          price_paid: amount,
          currency: 'USD',
          notes: `Renovación automática de suscripción ${sub.provider}`,
        },
      });
      await tx.payment.create({
        data: {
          gym_id: sub.gym_id,
          member_id: sub.member_id,
          membership_id: membership.id,
          payment_method_id: paymentMethod.id,
          amount,
          currency: 'USD',
          status: 'SUCCEEDED',
          payment_type: sub.provider === 'stripe' ? 'STRIPE' : 'MERCADOPAGO',
          gateway_payment_id: gatewayPaymentId ?? undefined,
          description: `Renovación membresía ${type.name}`,
          paid_at: startDate,
        },
      });
      if (member.status === 'PRE_CANCEL' || member.status === 'EXPIRED') {
        await tx.member.update({ where: { id: sub.member_id }, data: { status: 'ACTIVE' } });
      }
      await tx.billingSubscription.update({
        where: { id: sub.id },
        data: { current_period_start: startDate, current_period_end: endDate },
      });
    });

    await this.notification.create({
      gymId: sub.gym_id,
      userId: member.user_id,
      type: 'SUBSCRIPTION_RENEWED',
      title: 'Tu membresía se renovó automáticamente 🎉',
      body: `Cobramos ${amount.toFixed(2)} USD y extendimos tu membresía ${type.name} hasta ${endDate.toLocaleDateString()}.`,
      data: { billingSubscriptionId: sub.id },
    });
    this.logger.log(`Subscription ${sub.id} renovada hasta ${endDate.toISOString()}`);
  }

  // Sin método de pago activo: no hay nada que reintentar automáticamente —
  // solo se avisa al miembro para que agregue uno.
  private async markPastDueAndNotify(subId: string, gymId: string, userId: string, amount: number) {
    await this.prisma.billingSubscription.update({
      where: { id: subId },
      data: { status: 'PAST_DUE' },
    });
    await this.notification.create({
      gymId,
      userId,
      type: 'SUBSCRIPTION_RENEWAL_FAILED',
      title: 'No pudimos renovar tu membresía',
      body: `El cobro de ${amount.toFixed(2)} USD no se pudo procesar. Actualiza tu método de pago para evitar la suspensión de tu acceso.`,
      data: { billingSubscriptionId: subId },
    });
  }

  // Crea un Payment FAILED con método de pago adjunto para que DunningService
  // (que corre cada hora y busca Payment.status='FAILED') tome el reintento.
  private async recordFailedPayment(
    sub: { id: string; gym_id: string; member_id: string },
    paymentMethodId: string,
    amount: number,
  ) {
    await this.prisma.payment.create({
      data: {
        gym_id: sub.gym_id,
        member_id: sub.member_id,
        payment_method_id: paymentMethodId,
        amount,
        currency: 'USD',
        status: 'FAILED',
        payment_type: 'CARD',
        attempt_number: 1,
        description: `Renovación de suscripción ${sub.id} (cobro fallido)`,
      },
    });
  }
}
