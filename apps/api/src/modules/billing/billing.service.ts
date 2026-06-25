import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async refundPayment(gymId: string, id: string, reason?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, gym_id: gymId },
    });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    if (payment.status !== 'SUCCEEDED') {
      throw new BadRequestException('Solo se pueden reembolsar pagos exitosos');
    }

    // Para pagos manuales: marcar como reembolsado directamente
    // Para Stripe/MercadoPago: llamar al gateway (se implementa en Sprint integración gateway)
    if (['STRIPE', 'MERCADOPAGO'].includes(payment.payment_type)) {
      this.logger.warn(`[STUB] Gateway refund not yet implemented for ${payment.payment_type}`);
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'REFUNDED',
        notes: reason ? `Reembolso: ${reason}` : payment.notes,
      },
    });

    return { ...updated, amount: Number(updated.amount) };
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

  // ─── WEBHOOK STUBS ───────────────────────────────────────────────────────────

  async handleStripeWebhook(_payload: Buffer, _signature: string): Promise<void> {
    // TODO Sprint integración Stripe: verificar signature con stripe.webhooks.constructEvent
    // y procesar eventos: payment_intent.succeeded, payment_intent.payment_failed, etc.
    this.logger.log('[STUB] Stripe webhook received');
  }

  async handleMercadoPagoWebhook(_data: Record<string, unknown>): Promise<void> {
    // TODO Sprint integración MercadoPago
    this.logger.log('[STUB] MercadoPago webhook received');
  }
}
