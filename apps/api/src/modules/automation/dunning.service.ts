import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notifications/notification.service';

interface DunningStep {
  attempt: number;
  dayLabel: string;
  title: string;
  body: string;
  nextDelayDays: number | null; // null = final step
  blockAccess: boolean;
  startCancellation: boolean;
}

const DUNNING_STEPS: DunningStep[] = [
  {
    attempt: 1,
    dayLabel: 'Día 0',
    title: 'Problema con tu pago',
    body: 'Tu pago no pudo ser procesado. Por favor actualiza tu método de pago para mantener tu membresía activa.',
    nextDelayDays: 3,
    blockAccess: false,
    startCancellation: false,
  },
  {
    attempt: 2,
    dayLabel: 'Día 3',
    title: 'Recordatorio de pago pendiente',
    body: 'Aún tenemos un pago pendiente. Actualiza tu método de pago para evitar interrupciones en tu membresía.',
    nextDelayDays: 2,
    blockAccess: false,
    startCancellation: false,
  },
  {
    attempt: 3,
    dayLabel: 'Día 5',
    title: 'Último aviso antes de restricción',
    body: 'Tu membresía será restringida en 2 días si no regularizas tu pago. Actúa ahora.',
    nextDelayDays: 2,
    blockAccess: false,
    startCancellation: false,
  },
  {
    attempt: 4,
    dayLabel: 'Día 7',
    title: 'Acceso suspendido por pago pendiente',
    body: 'Tu acceso al gym ha sido suspendido temporalmente. Regulariza tu pago para reactivar tu membresía.',
    nextDelayDays: 7,
    blockAccess: true,
    startCancellation: false,
  },
  {
    attempt: 5,
    dayLabel: 'Día 14',
    title: 'Tu membresía será cancelada',
    body: 'Llevamos 14 días con el pago pendiente. Tu membresía será cancelada automáticamente. Contáctanos para regularizar.',
    nextDelayDays: null,
    blockAccess: true,
    startCancellation: true,
  },
];

@Injectable()
export class DunningService {
  private readonly logger = new Logger(DunningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processDunning() {
    const now = new Date();

    // Find payments that failed and were never dunned (next_retry_at is null)
    const newFailures = await this.prisma.payment.findMany({
      where: {
        status: 'FAILED',
        next_retry_at: null,
        attempt_number: 1,
      },
      include: {
        member: { select: { id: true, user_id: true, first_name: true, status: true } },
      },
      take: 50,
    });

    // Find payments due for retry
    const dueRetries = await this.prisma.payment.findMany({
      where: {
        status: 'FAILED',
        next_retry_at: { lte: now, not: null },
        attempt_number: { gte: 2, lte: 5 },
      },
      include: {
        member: { select: { id: true, user_id: true, first_name: true, status: true } },
      },
      take: 50,
    });

    const all = [...newFailures, ...dueRetries];
    if (!all.length) return;

    this.logger.log(`Processing dunning for ${all.length} payments`);

    for (const payment of all) {
      try {
        if (!payment.member) continue;
        await this.processPayment({
          id: payment.id,
          gym_id: payment.gym_id,
          attempt_number: payment.attempt_number,
          member: payment.member,
        });
      } catch (err) {
        this.logger.error(`Dunning error for payment ${payment.id}: ${(err as Error).message}`);
      }
    }
  }

  private async processPayment(payment: {
    id: string;
    gym_id: string;
    attempt_number: number;
    member: { id: string; user_id: string; first_name: string; status: string } | null;
  }) {
    if (!payment.member) return;

    const step = DUNNING_STEPS.find((s) => s.attempt === payment.attempt_number);
    if (!step) return;

    // Send notification to member
    await this.notification.create({
      gymId: payment.gym_id,
      userId: payment.member.user_id,
      type: `DUNNING_${step.dayLabel.replace(' ', '_').toUpperCase()}`,
      title: step.title,
      body: step.body,
      data: { paymentId: payment.id, attempt: step.attempt },
    });

    // Block access on Day 7+
    if (step.blockAccess && payment.member.status === 'ACTIVE') {
      await this.prisma.member.update({
        where: { id: payment.member.id },
        data: { status: 'PRE_CANCEL' },
      });
      this.logger.warn(`Access blocked for member ${payment.member.id} (dunning day 7)`);
    }

    // Start cancellation process on Day 14
    if (step.startCancellation) {
      await this.prisma.member.update({
        where: { id: payment.member.id },
        data: { status: 'EXPIRED' },
      });
      this.logger.warn(`Cancellation started for member ${payment.member.id} (dunning day 14)`);

      // Mark payment as final dunning exhausted
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { next_retry_at: null, attempt_number: 6 }, // 6 = exhausted
      });
      return;
    }

    // Schedule next retry
    const nextAt =
      step.nextDelayDays !== null ? new Date(Date.now() + step.nextDelayDays * 86_400_000) : null;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        attempt_number: payment.attempt_number + 1,
        next_retry_at: nextAt,
      },
    });
  }

  // Manually trigger dunning for a specific payment (e.g. after manual failed charge)
  async initDunning(gymId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, gym_id: gymId, status: 'FAILED' },
    });
    if (!payment) return;

    // Reset to step 1 so cron picks it up
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { attempt_number: 1, next_retry_at: null },
    });
  }
}
