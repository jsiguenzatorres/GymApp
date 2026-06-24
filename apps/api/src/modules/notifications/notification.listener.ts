import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GymEvent,
  PaymentSucceededPayload,
  PrAchievedPayload,
  RiskScoreUpdatedPayload,
} from '@gymapp/shared-types';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationListener {
  constructor(
    private readonly notif: NotificationService,
    private readonly email: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── MEMBRESÍA ACTIVADA ───────────────────────────────────────────────────

  @OnEvent(GymEvent.MEMBERSHIP_ACTIVATED)
  async onMembershipActivated(payload: { gymId: string; memberId: string; planName: string }) {
    await this.notif.notifyMember(
      payload.gymId,
      payload.memberId,
      GymEvent.MEMBERSHIP_ACTIVATED,
      '¡Membresía activada!',
      `Tu membresía ${payload.planName} ya está activa. ¡Bienvenido al gym!`,
      { memberId: payload.memberId },
    );
  }

  // ─── MEMBRESÍA EXPIRADA ───────────────────────────────────────────────────

  @OnEvent(GymEvent.MEMBERSHIP_EXPIRED)
  async onMembershipExpired(payload: { gymId: string; memberId: string; planName: string }) {
    await Promise.all([
      this.notif.notifyMember(
        payload.gymId,
        payload.memberId,
        GymEvent.MEMBERSHIP_EXPIRED,
        'Tu membresía ha expirado',
        `Tu membresía ${payload.planName} venció. Renueva para seguir accediendo al gym.`,
        { memberId: payload.memberId },
      ),
      this.notif.notifyStaffByRole(
        payload.gymId,
        ['GYM_ADMIN', 'RECEPTIONIST'],
        GymEvent.MEMBERSHIP_EXPIRED,
        'Membresía expirada',
        `Un miembro tiene la membresía ${payload.planName} vencida.`,
        { memberId: payload.memberId },
      ),
    ]);
  }

  // ─── PAGO EXITOSO ────────────────────────────────────────────────────────

  @OnEvent(GymEvent.PAYMENT_SUCCEEDED)
  async onPaymentSucceeded(payload: PaymentSucceededPayload) {
    await this.notif.notifyMember(
      payload.gymId,
      payload.memberId,
      GymEvent.PAYMENT_SUCCEEDED,
      'Pago confirmado',
      `Tu pago de $${payload.amount} ${payload.currency} fue procesado correctamente.`,
      { transactionId: payload.transactionId, amount: payload.amount },
    );
  }

  // ─── PAGO FALLIDO ────────────────────────────────────────────────────────

  @OnEvent(GymEvent.PAYMENT_FAILED)
  async onPaymentFailed(payload: {
    gymId: string;
    memberId: string;
    amount: number;
    reason?: string;
  }) {
    await Promise.all([
      this.notif.notifyMember(
        payload.gymId,
        payload.memberId,
        GymEvent.PAYMENT_FAILED,
        'Pago no procesado',
        'No pudimos procesar tu pago. Actualiza tu método de pago para evitar suspensión.',
        { memberId: payload.memberId },
      ),
      this.notif.notifyStaffByRole(
        payload.gymId,
        ['GYM_ADMIN', 'GYM_OWNER'],
        GymEvent.PAYMENT_FAILED,
        'Fallo de pago',
        `Un miembro tiene un pago fallido de $${payload.amount}. Inicio de proceso dunning.`,
        { memberId: payload.memberId, amount: payload.amount },
      ),
    ]);
  }

  // ─── PERSONAL RECORD ────────────────────────────────────────────────────

  @OnEvent(GymEvent.PR_ACHIEVED)
  async onPrAchieved(payload: PrAchievedPayload) {
    await this.notif.notifyMember(
      payload.gymId,
      payload.memberId,
      GymEvent.PR_ACHIEVED,
      '🏆 ¡Nuevo récord personal!',
      `¡Superaste tu marca en ${payload.exerciseName}! Nuevo PR: ${payload.value} (anterior: ${payload.previousValue}).`,
      { exerciseId: payload.exerciseId, exerciseName: payload.exerciseName, value: payload.value },
    );
  }

  // ─── RIESGO DE CHURN ALTO ────────────────────────────────────────────────

  @OnEvent(GymEvent.RISK_SCORE_HIGH)
  async onRiskHigh(payload: RiskScoreUpdatedPayload) {
    const member = await this.prisma.member.findFirst({
      where: { id: payload.memberId, gym_id: payload.gymId },
      select: { first_name: true, last_name: true },
    });
    const name = member ? `${member.first_name} ${member.last_name}` : 'Un miembro';

    await this.notif.notifyStaffByRole(
      payload.gymId,
      ['TRAINER', 'GYM_ADMIN'],
      GymEvent.RISK_SCORE_HIGH,
      'Alerta de retención',
      `${name} tiene un riesgo de abandono alto (${payload.newScore}/100). Se recomienda contactar.`,
      { memberId: payload.memberId, score: payload.newScore },
    );
  }

  // ─── RIESGO CRÍTICO ──────────────────────────────────────────────────────

  @OnEvent(GymEvent.RISK_SCORE_CRITICAL)
  async onRiskCritical(payload: RiskScoreUpdatedPayload) {
    const member = await this.prisma.member.findFirst({
      where: { id: payload.memberId, gym_id: payload.gymId },
      select: { first_name: true, last_name: true },
    });
    const name = member ? `${member.first_name} ${member.last_name}` : 'Un miembro';

    await this.notif.notifyStaffByRole(
      payload.gymId,
      ['GYM_OWNER', 'GYM_ADMIN', 'TRAINER'],
      GymEvent.RISK_SCORE_CRITICAL,
      '🚨 Riesgo crítico de abandono',
      `${name} está en riesgo CRÍTICO de cancelar (${payload.newScore}/100). Acción urgente requerida.`,
      { memberId: payload.memberId, score: payload.newScore },
    );
  }

  // ─── PLAN DE WORKOUT ASIGNADO ────────────────────────────────────────────

  @OnEvent(GymEvent.PLAN_ASSIGNED)
  async onPlanAssigned(payload: { gymId: string; memberId: string; planName: string }) {
    await this.notif.notifyMember(
      payload.gymId,
      payload.memberId,
      GymEvent.PLAN_ASSIGNED,
      'Nuevo plan de entrenamiento',
      `Tu trainer te asignó un nuevo plan: "${payload.planName}". ¡A entrenar!`,
      { planName: payload.planName },
    );
  }
}
