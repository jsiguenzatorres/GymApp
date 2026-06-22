import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── INTERACTIONS ─────────────────────────────────────────────────────────────

  async createInteraction(gymId: string, staffId: string, dto: CreateInteractionDto) {
    await this.findMember(gymId, dto.memberId);

    return this.prisma.crmInteraction.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        staff_id: staffId,
        interaction_type: dto.interactionType,
        channel: dto.channel,
        subject: dto.subject,
        notes: dto.notes,
        sentiment: dto.sentiment,
        outcome: dto.outcome,
        follow_up_at: dto.followUpAt ? new Date(dto.followUpAt) : undefined,
        occurred_at: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  async listInteractions(gymId: string, memberId: string) {
    await this.findMember(gymId, memberId);

    return this.prisma.crmInteraction.findMany({
      where: { gym_id: gymId, member_id: memberId },
      orderBy: { occurred_at: 'desc' },
      take: 100,
      include: {
        staff: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
    });
  }

  async listRecentInteractions(gymId: string, limit = 20) {
    return this.prisma.crmInteraction.findMany({
      where: { gym_id: gymId },
      orderBy: { occurred_at: 'desc' },
      take: limit,
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
        staff: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
    });
  }

  // ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

  async createAppointment(gymId: string, dto: CreateAppointmentDto) {
    await this.findMember(gymId, dto.memberId);

    return this.prisma.appointment.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        staff_id: dto.staffId,
        title: dto.title,
        description: dto.description,
        appointment_type: dto.appointmentType ?? 'CONSULTATION',
        scheduled_at: new Date(dto.scheduledAt),
        duration_min: dto.durationMin ?? 60,
        notes: dto.notes,
      },
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
        staff: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
    });
  }

  async listAppointments(
    gymId: string,
    filter: {
      status?: string;
      from?: string;
      to?: string;
      memberId?: string;
    },
  ) {
    const from = filter.from ? new Date(filter.from) : new Date();
    const to = filter.to
      ? new Date(filter.to)
      : new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.appointment.findMany({
      where: {
        gym_id: gymId,
        scheduled_at: { gte: from, lte: to },
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.memberId ? { member_id: filter.memberId } : {}),
      },
      orderBy: { scheduled_at: 'asc' },
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
        staff: { include: { user: { select: { first_name: true, last_name: true } } } },
      },
    });
  }

  async updateAppointmentStatus(
    gymId: string,
    appointmentId: string,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, gym_id: gymId },
    });
    if (!appointment) throw new NotFoundException('Cita no encontrada');

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: dto.status,
        cancelled_reason: dto.cancelledReason,
      },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  // ─── RISK SCORE ──────────────────────────────────────────────────────────────

  async calculateRiskScore(gymId: string, memberId: string): Promise<number> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gym_id: gymId },
      include: {
        memberships: {
          where: { status: { in: ['ACTIVE', 'TRIAL', 'FROZEN'] } },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const now = Date.now();
    const DAY = 86_400_000;

    const [lastSession, failedPayments30d, recentInteractions14d] = await Promise.all([
      this.prisma.workoutSession.findFirst({
        where: { member_id: memberId, gym_id: gymId, finished_at: { not: null } },
        orderBy: { started_at: 'desc' },
      }),
      this.prisma.payment.count({
        where: {
          member_id: memberId,
          gym_id: gymId,
          status: 'FAILED',
          created_at: { gte: new Date(now - 30 * DAY) },
        },
      }),
      this.prisma.crmInteraction.count({
        where: {
          member_id: memberId,
          gym_id: gymId,
          occurred_at: { gte: new Date(now - 14 * DAY) },
        },
      }),
    ]);

    let score = 0;

    // Inactividad en workout (peso 30%)
    if (lastSession) {
      const days = Math.floor((now - lastSession.started_at.getTime()) / DAY);
      if (days > 30) score += 30;
      else if (days > 14) score += 20;
      else if (days > 7) score += 10;
    } else {
      score += 20; // sin historial de sesiones
    }

    // Pagos fallidos (peso 15%)
    if (failedPayments30d >= 3) score += 15;
    else if (failedPayments30d >= 1) score += 8;

    // Estado de la membresía (peso 20%)
    const mem = member.memberships[0];
    if (!mem) score += 20;
    else if (mem.status === 'FROZEN') score += 12;
    else if (mem.status === 'TRIAL') score += 5;

    // Proximidad de vencimiento (peso 15%)
    if (mem?.end_date) {
      const daysLeft = Math.floor((new Date(mem.end_date).getTime() - now) / DAY);
      if (daysLeft < 0) score += 15;
      else if (daysLeft < 7) score += 10;
      else if (daysLeft < 14) score += 5;
    }

    // Interacciones recientes: más interacción = más comprometido (peso 10%)
    if (recentInteractions14d === 0) score += 10;
    else if (recentInteractions14d < 2) score += 5;

    // Estado del miembro (máx 20%)
    if (member.status === 'PRE_CANCEL') score += 20;
    else if (member.status === 'EXPIRED') score += 15;

    const finalScore = Math.min(100, score);

    await this.prisma.member.update({
      where: { id: memberId },
      data: { risk_score: finalScore, risk_score_updated_at: new Date() },
    });

    return finalScore;
  }

  async recalculateAllRiskScores(gymId: string) {
    const members = await this.prisma.member.findMany({
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL', 'FROZEN', 'PRE_CANCEL'] } },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      members.map((m) => this.calculateRiskScore(gymId, m.id)),
    );

    const updated = results.filter((r) => r.status === 'fulfilled').length;
    return { total: members.length, updated };
  }

  // ─── CRM OVERVIEW ────────────────────────────────────────────────────────────

  async getOverview(gymId: string) {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 86_400_000);

    const [riskAlerts, upcomingAppointments, recentInteractions, pendingFollowUps] =
      await Promise.all([
        this.prisma.member.findMany({
          where: {
            gym_id: gymId,
            risk_score: { gte: 70 },
            status: { in: ['ACTIVE', 'TRIAL', 'FROZEN'] },
          },
          orderBy: { risk_score: 'desc' },
          take: 10,
          select: {
            id: true,
            first_name: true,
            last_name: true,
            risk_score: true,
            status: true,
            avatar_url: true,
          },
        }),
        this.prisma.appointment.findMany({
          where: {
            gym_id: gymId,
            scheduled_at: { gte: now, lte: in7days },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
          orderBy: { scheduled_at: 'asc' },
          take: 10,
          include: { member: { select: { id: true, first_name: true, last_name: true } } },
        }),
        this.listRecentInteractions(gymId, 10),
        this.prisma.crmInteraction.count({
          where: { gym_id: gymId, outcome: 'FOLLOW_UP', follow_up_at: { lte: in7days } },
        }),
      ]);

    return { riskAlerts, upcomingAppointments, recentInteractions, pendingFollowUps };
  }

  // ─── ARIA STUB ────────────────────────────────────────────────────────────────

  async ariaChat(_gymId: string, _memberId: string, message: string) {
    // P2: reemplazar con LangChain + Claude claude-sonnet-4-20250514
    return {
      response: `Hola, soy ARIA. Recibí tu mensaje: "${message}". La integración completa con IA estará disponible pronto. Por ahora, puedes contactar a la recepción para asistencia directa.`,
      isStub: true,
    };
  }

  // ─── PRIVATE ──────────────────────────────────────────────────────────────────

  private async findMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member;
  }
}
