import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { StripeService } from './stripe.service';
import { MercadoPagoService } from './mercadopago.service';
import { StorageService } from '../storage/storage.service';
import { GeminiService } from '../ai/gemini.service';
import {
  CreatePaymentDto,
  UploadPaymentVoucherDto,
  ConfirmPaymentDraftDto,
  RejectPaymentDraftDto,
} from './dto/create-payment.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';

type PaymentLike = {
  amount: Prisma.Decimal;
  subtotal?: Prisma.Decimal | null;
  tax_amount?: Prisma.Decimal | null;
  voucher_path?: string | null;
};

function toNumberPayment<T extends PaymentLike>(p: T) {
  return {
    ...p,
    amount: Number(p.amount),
    subtotal: p.subtotal !== undefined && p.subtotal !== null ? Number(p.subtotal) : null,
    tax_amount: p.tax_amount !== undefined && p.tax_amount !== null ? Number(p.tax_amount) : null,
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly mp: MercadoPagoService,
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
  ) {}

  // Convierte el pago a números planos y reemplaza voucher_path (ruta interna
  // del bucket privado) por voucher_url (firmada, expira en 1h) — nunca se
  // guarda la URL firmada, se genera fresca en cada lectura.
  private async withVoucherUrl<T extends PaymentLike>(p: T) {
    const numeric = toNumberPayment(p);
    const { voucher_path, ...rest } = numeric;
    const voucher_url = voucher_path
      ? await this.storage.getSignedUrl('payment-vouchers', voucher_path, 3600)
      : null;
    return { ...rest, voucher_url };
  }

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
        voucher_number: dto.voucherNumber,
        subtotal: dto.subtotal,
        tax_amount: dto.taxAmount,
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

    return this.withVoucherUrl(payment);
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
      data: await Promise.all(payments.map((p) => this.withVoucherUrl(p))),
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
    return this.withVoucherUrl(payment);
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

    return Promise.all(payments.map((p) => this.withVoucherUrl(p)));
  }

  // ─── COMPROBANTE + EXTRACCIÓN IA ─────────────────────────────────────────────
  // Mismo patrón que nutrition.service.ts#uploadLabResult (D-29): sube el
  // documento a Storage, le pide a Gemini que extraiga los datos en JSON, y
  // crea el Payment en estado DRAFT — nunca se confirma solo, el staff revisa
  // los datos extraídos y llama a confirmPaymentDraft antes de que cuente
  // como un cobro real.
  async uploadPaymentVoucher(gymId: string, dto: UploadPaymentVoucherDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gym_id: gymId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    if (dto.membershipId) {
      const membership = await this.prisma.membership.findFirst({
        where: { id: dto.membershipId, member_id: dto.memberId, gym_id: gymId },
      });
      if (!membership) throw new NotFoundException('Membresía no encontrada');
    }

    const { path } = await this.storage.uploadDocument(
      'payment-vouchers',
      `${gymId}/${dto.memberId}`,
      dto.document,
    );

    const match = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,(.+)$/i.exec(
      dto.document.trim(),
    );
    const mimeType = match?.[1].toLowerCase() ?? 'image/jpeg';
    const base64 = match?.[2] ?? '';

    const prompt = `Eres un asistente que EXTRAE datos de un comprobante/recibo de pago (foto o PDF) de un
gimnasio en El Salvador. NO inventes datos que no aparezcan en el documento — si un campo no está
visible, deja el valor en null.

Responde EXCLUSIVAMENTE con JSON válido con esta forma exacta:
{
  "voucher_number": "número de comprobante o recibo, o null",
  "paid_at": "fecha del pago en formato YYYY-MM-DD, o null",
  "payment_type": "uno de CASH|CARD|BANK_TRANSFER|OTHER según el método visible, o null",
  "subtotal": 44.25 (número, valor SIN impuestos, o null),
  "tax_amount": 5.75 (número, IVA 13%, o null),
  "amount": 50.00 (número, VALOR TOTAL pagado — el más importante, intenta siempre extraerlo),
  "payer_name": "nombre de la persona que pagó si aparece, o null",
  "payer_nit": "NIT del pagador si aparece, o null",
  "note": "comentario breve (max 150 caracteres) sobre la calidad/legibilidad del documento"
}
Si no puedes leer el documento, devuelve todos los campos en null excepto "note" con la explicación.`;

    let extracted: {
      voucher_number?: string | null;
      paid_at?: string | null;
      payment_type?: string | null;
      subtotal?: number | null;
      tax_amount?: number | null;
      amount?: number | null;
      payer_name?: string | null;
      payer_nit?: string | null;
      note?: string;
    } = {};
    let note = '';
    try {
      const raw = await this.gemini.generateWithImage(base64, mimeType, prompt);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      extracted = JSON.parse(cleaned);
      note = extracted.note ?? '';
    } catch (err) {
      this.logger.error(`Payment voucher extraction failed: ${(err as Error).message}`);
      note = 'No se pudo extraer automáticamente. Completa los datos manualmente al revisar.';
    }

    const validPaymentTypes = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'];
    const paymentType =
      extracted.payment_type && validPaymentTypes.includes(extracted.payment_type)
        ? extracted.payment_type
        : 'OTHER';

    const payment = await this.prisma.payment.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        membership_id: dto.membershipId,
        amount: extracted.amount ?? 0,
        currency: 'USD',
        status: 'DRAFT',
        payment_type: paymentType,
        voucher_number: extracted.voucher_number ?? undefined,
        subtotal: extracted.subtotal ?? undefined,
        tax_amount: extracted.tax_amount ?? undefined,
        paid_at: extracted.paid_at ? new Date(extracted.paid_at) : undefined,
        voucher_path: path,
        voucher_extracted_data: extracted as Prisma.InputJsonValue,
        voucher_ai_note: note,
        voucher_reviewed_by_staff: false,
      },
      include: {
        member: {
          select: { first_name: true, last_name: true, user: { select: { email: true } } },
        },
        membership: { include: { type: { select: { name: true } } } },
      },
    });

    return this.withVoucherUrl(payment);
  }

  async confirmPaymentDraft(gymId: string, id: string, dto: ConfirmPaymentDraftDto) {
    const payment = await this.prisma.payment.findFirst({ where: { id, gym_id: gymId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden confirmar pagos en estado borrador');
    }
    if ((dto.amount ?? Number(payment.amount)) <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0 para confirmar el pago');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'SUCCEEDED',
        voucher_reviewed_by_staff: true,
        membership_id: dto.membershipId ?? payment.membership_id,
        amount: dto.amount ?? payment.amount,
        subtotal: dto.subtotal ?? payment.subtotal,
        tax_amount: dto.taxAmount ?? payment.tax_amount,
        payment_type: dto.paymentType ?? payment.payment_type,
        invoice_type: dto.invoiceType ?? payment.invoice_type,
        voucher_number: dto.voucherNumber ?? payment.voucher_number,
        paid_at: dto.paidAt ? new Date(dto.paidAt) : (payment.paid_at ?? new Date()),
        description: dto.description ?? payment.description,
        notes: dto.notes ?? payment.notes,
      },
      include: {
        member: {
          select: { first_name: true, last_name: true, user: { select: { email: true } } },
        },
        membership: { include: { type: { select: { name: true } } } },
      },
    });

    this.logger.log(`Payment draft ${id} confirmado por staff — ahora SUCCEEDED`);
    return this.withVoucherUrl(updated);
  }

  async rejectPaymentDraft(gymId: string, id: string, dto: RejectPaymentDraftDto) {
    const payment = await this.prisma.payment.findFirst({ where: { id, gym_id: gymId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (payment.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden descartar pagos en estado borrador');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        voucher_reviewed_by_staff: true,
        notes: dto.reason ? `Comprobante descartado: ${dto.reason}` : 'Comprobante descartado',
      },
    });

    return this.withVoucherUrl(updated);
  }

  // ─── BILLING SUMMARY (para dashboard) ────────────────────────────────────────

  async getBillingSummary(gymId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [thisMonth, lastMonth, pending, failedCount, draftCount] = await Promise.all([
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
      // Borradores de comprobantes esperando revisión del staff
      this.prisma.payment.count({
        where: { gym_id: gymId, status: 'DRAFT' },
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
      pendingReview: draftCount,
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
    return this.withVoucherUrl(updated);
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
