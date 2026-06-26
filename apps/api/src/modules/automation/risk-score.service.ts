import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RiskScoreService {
  private readonly logger = new Logger(RiskScoreService.name);
  private readonly DAY = 86_400_000;

  constructor(private readonly prisma: PrismaService) {}

  // Recalculate risk scores for all active members every 6 hours
  @Cron('0 */6 * * *')
  async recalculateAll() {
    const gyms = await this.prisma.gym.findMany({
      where: { is_active: true },
      select: { id: true },
    });

    let updated = 0;
    for (const gym of gyms) {
      const count = await this.recalculateGym(gym.id);
      updated += count;
    }

    this.logger.log(`Risk score recalculated for ${updated} members across ${gyms.length} gyms`);
  }

  async recalculateGym(gymId: string): Promise<number> {
    const members = await this.prisma.member.findMany({
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL', 'FREEZE'] } },
      select: { id: true },
    });

    await Promise.allSettled(members.map((m) => this.calculate(gymId, m.id)));
    return members.length;
  }

  async calculate(gymId: string, memberId: string): Promise<number> {
    const now = Date.now();
    const d14 = new Date(now - 14 * this.DAY);
    const d30 = new Date(now - 30 * this.DAY);

    const [
      member,
      sessionsLast30d,
      sessionsLast14d,
      sessionsPrev14d,
      lastSession,
      failedPayments30d,
      totalPayments30d,
      recentPRs,
      lastNps,
      openComplaints,
      appointments30d,
      cancelledAppts30d,
      freezeCount,
      lastConversation,
    ] = await Promise.all([
      this.prisma.member.findFirst({
        where: { id: memberId, gym_id: gymId },
        include: {
          memberships: {
            where: { status: { in: ['ACTIVE', 'TRIAL', 'FROZEN'] } },
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.workoutSession.count({
        where: { member_id: memberId, gym_id: gymId, started_at: { gte: d30 } },
      }),
      this.prisma.workoutSession.count({
        where: { member_id: memberId, gym_id: gymId, started_at: { gte: d14 } },
      }),
      this.prisma.workoutSession.count({
        where: { member_id: memberId, gym_id: gymId, started_at: { gte: d30, lt: d14 } },
      }),
      this.prisma.workoutSession.findFirst({
        where: { member_id: memberId, gym_id: gymId, finished_at: { not: null } },
        orderBy: { started_at: 'desc' },
      }),
      this.prisma.payment.count({
        where: { member_id: memberId, gym_id: gymId, status: 'FAILED', created_at: { gte: d30 } },
      }),
      this.prisma.payment.count({
        where: { member_id: memberId, gym_id: gymId, created_at: { gte: d30 } },
      }),
      this.prisma.personalRecord.count({
        where: { member_id: memberId, gym_id: gymId, achieved_at: { gte: d30 } },
      }),
      this.prisma.feedback.findFirst({
        where: { member_id: memberId, gym_id: gymId, type: 'NPS', nps_score: { not: null } },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.feedback.count({
        where: { member_id: memberId, gym_id: gymId, type: 'COMPLAINT', is_resolved: false },
      }),
      this.prisma.appointment.count({
        where: { member_id: memberId, gym_id: gymId, scheduled_at: { gte: d30 } },
      }),
      this.prisma.appointment.count({
        where: {
          member_id: memberId,
          gym_id: gymId,
          scheduled_at: { gte: d30 },
          status: { in: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      this.prisma.membership.count({
        where: { member_id: memberId, gym_id: gymId, status: 'FROZEN' },
      }),
      this.prisma.conversationSession.findFirst({
        where: { member_id: memberId, gym_id: gymId, agent_type: 'ARIA' },
        orderBy: { updated_at: 'desc' },
      }),
    ]);

    if (!member) return 0;

    let score = 0;

    // ── 1. Frecuencia de visitas (25%) ─────────────────────────────────────
    const sessionRatio = Math.min(sessionsLast30d / 8, 1); // 8 sessions/month = optimal
    score += Math.round((1 - sessionRatio) * 25);

    // ── 2. Ausencias sin justificar (15%) ──────────────────────────────────
    if (lastSession) {
      const daysSince = Math.floor((now - lastSession.started_at.getTime()) / this.DAY);
      if (daysSince > 30) score += 15;
      else if (daysSince > 14) score += 10;
      else if (daysSince > 7) score += 5;
    } else {
      score += 12;
    }

    // ── 3. Cambio en horario de visitas (10%) ──────────────────────────────
    // Compare recent 2w vs prior 2w. Sharp drop = risk.
    if (sessionsPrev14d > 0) {
      const dropRatio = sessionsLast14d / sessionsPrev14d;
      if (dropRatio < 0.3) score += 10;
      else if (dropRatio < 0.6) score += 5;
    } else if (sessionsLast30d === 0) {
      score += 7;
    }

    // ── 4. Engagement con la app (10%) ─────────────────────────────────────
    const lastEngagement = lastConversation?.updated_at ?? lastSession?.started_at ?? null;
    if (lastEngagement) {
      const daysAgo = Math.floor((now - lastEngagement.getTime()) / this.DAY);
      if (daysAgo > 30) score += 10;
      else if (daysAgo > 14) score += 6;
      else if (daysAgo > 7) score += 3;
    } else {
      score += 8;
    }

    // ── 5. Respuesta a ARIA (10%) ───────────────────────────────────────────
    if (lastConversation) {
      const daysAgo = Math.floor((now - lastConversation.updated_at.getTime()) / this.DAY);
      if (daysAgo > 30) score += 10;
      else if (daysAgo > 14) score += 5;
    } else {
      score += 7;
    }

    // ── 6. Historial de pagos (10%) ────────────────────────────────────────
    if (failedPayments30d > 0 && totalPayments30d > 0) {
      score += Math.round((failedPayments30d / totalPayments30d) * 10);
    } else if (failedPayments30d > 0) {
      score += 10;
    }

    // ── 7. Progreso físico (8%) ────────────────────────────────────────────
    if (recentPRs === 0) score += 8;
    else if (recentPRs < 2) score += 3;

    // ── 8. NPS / feedback (7%) ────────────────────────────────────────────
    if (lastNps?.nps_score !== null && lastNps?.nps_score !== undefined) {
      const nps = lastNps.nps_score as number;
      if (nps <= 4) score += 7;
      else if (nps <= 6) score += 4;
    } else {
      score += 2; // unknown NPS = slight risk
    }

    // ── 9. Quejas abiertas (5%) ───────────────────────────────────────────
    score += Math.min(openComplaints * 3, 5);

    // ── 10. Cancelaciones de citas (5%) ──────────────────────────────────
    if (appointments30d > 0) {
      score += Math.round((cancelledAppts30d / appointments30d) * 5);
    }

    // ── 11. Tiempo en membresía (3%) ─────────────────────────────────────
    const tenureDays = Math.floor((now - member.created_at.getTime()) / this.DAY);
    if (tenureDays < 14) score += 3;
    else if (tenureDays < 30) score += 1;

    // ── 12. Historial de freezes (2%) ─────────────────────────────────────
    if (freezeCount > 2) score += 2;
    else if (freezeCount > 0) score += 1;

    // ── Bonificaciones por estado crítico ─────────────────────────────────
    if (member.status === 'PRE_CANCEL') score += 20;
    else if (member.status === 'EXPIRED') score += 15;

    const mem = member.memberships[0];
    if (mem?.end_date) {
      const daysLeft = Math.floor((new Date(mem.end_date).getTime() - now) / this.DAY);
      if (daysLeft < 0) score += 10;
      else if (daysLeft < 7) score += 7;
      else if (daysLeft < 14) score += 3;
    }

    const finalScore = Math.min(100, score);

    await this.prisma.member.update({
      where: { id: memberId },
      data: { risk_score: finalScore, risk_score_updated_at: new Date() },
    });

    return finalScore;
  }

  async getTopRiskMembers(gymId: string, limit = 20) {
    return this.prisma.member.findMany({
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL', 'FREEZE'] } },
      orderBy: { risk_score: 'desc' },
      take: limit,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        risk_score: true,
        risk_score_updated_at: true,
        status: true,
      },
    });
  }
}
