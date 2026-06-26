import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { RagService } from '../ai/rag.service';
import { ConversationService } from '../ai/conversation.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly rag: RagService,
    private readonly conversation: ConversationService,
  ) {}

  // â”€â”€â”€ INTERACTIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        staff: { select: { id: true, first_name: true, last_name: true } },
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
        staff: { select: { id: true, first_name: true, last_name: true } },
      },
    });
  }

  // â”€â”€â”€ APPOINTMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        staff: { select: { id: true, first_name: true, last_name: true } },
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
        staff: { select: { id: true, first_name: true, last_name: true } },
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

  // â”€â”€â”€ RISK SCORE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

    // Estado de la membresÃ­a (peso 20%)
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

    // Interacciones recientes: mÃ¡s interacciÃ³n = mÃ¡s comprometido (peso 10%)
    if (recentInteractions14d === 0) score += 10;
    else if (recentInteractions14d < 2) score += 5;

    // Estado del miembro (mÃ¡x 20%)
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
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL', 'FREEZE', 'PRE_CANCEL'] } },
      select: { id: true },
    });

    const results = await Promise.allSettled(
      members.map((m) => this.calculateRiskScore(gymId, m.id)),
    );

    const updated = results.filter((r) => r.status === 'fulfilled').length;
    return { total: members.length, updated };
  }

  // â”€â”€â”€ CRM OVERVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getOverview(gymId: string) {
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 86_400_000);

    const [riskAlerts, upcomingAppointments, recentInteractions, pendingFollowUps] =
      await Promise.all([
        this.prisma.member.findMany({
          where: {
            gym_id: gymId,
            risk_score: { gte: 70 },
            status: { in: ['ACTIVE', 'TRIAL', 'FREEZE'] },
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

  // â”€â”€â”€ ARIA STUB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async ariaChat(gymId: string, memberId: string, message: string) {
    const [gym, riskAlerts, upcomingAppointments, ragContext, history] = await Promise.all([
      this.prisma.gym.findUnique({ where: { id: gymId }, select: { name: true, currency: true } }),
      this.prisma.member.count({ where: { gym_id: gymId, risk_score: { gte: 70 } } }),
      this.prisma.appointment.count({
        where: {
          gym_id: gymId,
          scheduled_at: { gte: new Date(), lte: new Date(Date.now() + 7 * 86_400_000) },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      this.rag.buildContext(gymId, message),
      memberId ? this.conversation.getHistory(gymId, memberId, 'ARIA') : Promise.resolve([]),
    ]);

    const activeMembers = await this.prisma.member.count({
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } },
    });

    const systemPrompt = `Eres ARIA, el Asistente Relacional Inteligente de ${gym?.name ?? 'el gym'}.
Eres experta en retención de miembros, CRM deportivo y estrategias de fidelización para gimnasios en Latinoamérica.

CONTEXTO ACTUAL DEL GYM:
- Miembros activos: ${activeMembers}
- Miembros en riesgo alto de cancelar (score ≥ 70): ${riskAlerts}
- Citas próximas (7 días): ${upcomingAppointments}
- Moneda: ${gym?.currency ?? 'USD'}
${ragContext}
INSTRUCCIONES:
- Responde siempre en español, de forma concisa y accionable
- Si el admin pregunta sobre miembros en riesgo, sugiere acciones concretas de retención
- Si pregunta sobre citas o interacciones, da recomendaciones de seguimiento
- Puedes sugerir workflows de retención, estrategias de re-engagement, o análisis de datos
- Sé directa y profesional, como un consultor de negocio especializado en gimnasios
- Si el miembro pregunta algo personal (membresía, citas, horarios), responde con amabilidad
- Máximo 3 párrafos por respuesta`;

    try {
      const geminiHistory = this.conversation.toGeminiHistory(history);
      const response = await this.gemini.chat(systemPrompt, message, geminiHistory);
      if (memberId) void this.conversation.addMessages(gymId, memberId, 'ARIA', message, response);
      return { response, isStub: false };
    } catch (err) {
      this.logger.error(`ARIA Gemini error: ${(err as Error).message}`);
      return {
        response:
          'Lo siento, el servicio de IA no está disponible en este momento. Por favor intenta de nuevo en unos segundos.',
        isStub: false,
        error: true,
      };
    }
  }

  // â”€â”€â”€ PRIVATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async findMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member;
  }
}
