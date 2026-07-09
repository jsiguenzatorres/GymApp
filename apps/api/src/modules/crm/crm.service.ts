import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { RagService } from '../ai/rag.service';
import { ConversationService } from '../ai/conversation.service';
import { NvidiaNimService } from '../ai/nvidia-nim.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';
import { RequestPtSessionDto } from './dto/request-pt-session.dto';

// FitCoins otorgados por asistir a una sesión PT — mismo mecanismo que
// ScheduleService.CLASS_ATTENDANCE_POINTS para clases grupales.
const PT_ATTENDANCE_POINTS = 25;

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly rag: RagService,
    private readonly conversation: ConversationService,
    private readonly notification: NotificationService,
    private readonly nvidiaNim: NvidiaNimService,
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

  // Sesiones PT individuales (1-a-1): reutiliza Appointment (appointment_type
  // 'TRAINING') en vez de un modelo nuevo — el miembro propone trainer+horario
  // (status PENDING = "sala de espera"), el trainer/staff confirma o rechaza
  // vía updateAppointmentStatus (ya genérico, arriba).

  private async resolveMemberId(gymId: string, userId: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member.id;
  }

  async requestPtSession(gymId: string, userId: string, dto: RequestPtSessionDto) {
    const memberId = await this.resolveMemberId(gymId, userId);

    const trainer = await this.prisma.staff.findFirst({
      where: { id: dto.trainerId, gym_id: gymId, is_active: true },
      select: { id: true, user_id: true, first_name: true, last_name: true },
    });
    if (!trainer) throw new NotFoundException('Entrenador no encontrado');

    const member = await this.prisma.member.findFirst({
      where: { id: memberId },
      select: { first_name: true, last_name: true },
    });

    const appointment = await this.prisma.appointment.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        staff_id: trainer.id,
        title: `Sesión PT — ${member?.first_name} ${member?.last_name}`,
        appointment_type: 'TRAINING',
        status: 'PENDING',
        scheduled_at: new Date(dto.requestedAt),
        duration_min: dto.durationMinutes ?? 60,
        notes: dto.notes,
      },
      include: { staff: { select: { first_name: true, last_name: true } } },
    });

    await this.notification
      .create({
        gymId,
        userId: trainer.user_id,
        type: 'PT_SESSION_REQUESTED',
        title: 'Nueva solicitud de sesión PT',
        body: `${member?.first_name} ${member?.last_name} solicitó una sesión para el ${new Date(dto.requestedAt).toLocaleString('es-SV')}.`,
        data: { appointmentId: appointment.id },
      })
      .catch(() => {
        // fire-and-forget
      });

    return appointment;
  }

  async getMyPtSessions(gymId: string, userId: string) {
    const memberId = await this.resolveMemberId(gymId, userId);
    return this.prisma.appointment.findMany({
      where: { gym_id: gymId, member_id: memberId, appointment_type: 'TRAINING' },
      orderBy: { scheduled_at: 'desc' },
      include: { staff: { select: { first_name: true, last_name: true } } },
    });
  }

  async cancelMyPtSession(gymId: string, userId: string, appointmentId: string) {
    const memberId = await this.resolveMemberId(gymId, userId);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        gym_id: gymId,
        member_id: memberId,
        appointment_type: 'TRAINING',
      },
    });
    if (!appointment) throw new NotFoundException('Sesión no encontrada');
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      throw new ConflictException('Esta sesión ya no se puede cancelar');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'CANCELLED', cancelled_reason: 'Cancelada por el miembro' },
    });
  }

  // Cola de solicitudes pendientes para el trainer autenticado ("sala de espera").
  async getMyPendingPtRequests(gymId: string, staffId: string) {
    return this.prisma.appointment.findMany({
      where: { gym_id: gymId, staff_id: staffId, appointment_type: 'TRAINING', status: 'PENDING' },
      orderBy: { scheduled_at: 'asc' },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  async checkInPtSession(gymId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, gym_id: gymId, appointment_type: 'TRAINING' },
    });
    if (!appointment) throw new NotFoundException('Sesión no encontrada');
    if (appointment.status !== 'CONFIRMED') {
      throw new ConflictException('Solo se puede marcar asistencia de sesiones confirmadas');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED', checked_in_at: new Date() },
      }),
      this.prisma.member.update({
        where: { id: appointment.member_id },
        data: {
          points_balance: { increment: PT_ATTENDANCE_POINTS },
          points_lifetime: { increment: PT_ATTENDANCE_POINTS },
        },
      }),
      this.prisma.pointsTransaction.create({
        data: {
          gym_id: gymId,
          member_id: appointment.member_id,
          amount: PT_ATTENDANCE_POINTS,
          type: 'PT_ATTENDANCE',
          description: 'Asistencia a sesión PT',
          reference_id: appointmentId,
        },
      }),
    ]);

    return updated;
  }

  async markPtNoShow(gymId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, gym_id: gymId, appointment_type: 'TRAINING' },
    });
    if (!appointment) throw new NotFoundException('Sesión no encontrada');
    if (appointment.status !== 'CONFIRMED') {
      throw new ConflictException('Solo se puede marcar no-show de sesiones confirmadas');
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'NO_SHOW' },
    });
  }

  // Corre cada hora: cierra sesiones PT confirmadas cuyo horario ya pasó (con 1h
  // de margen) sin check-in -> NO_SHOW; y cancela solicitudes PENDING que el
  // trainer nunca respondió antes de la hora propuesta, para no dejar al
  // miembro esperando indefinidamente.
  @Cron(CronExpression.EVERY_HOUR)
  async runPtSessionSweep() {
    const now = new Date();
    const graceMs = 60 * 60_000;

    const candidates = await this.prisma.appointment.findMany({
      where: {
        appointment_type: 'TRAINING',
        status: { in: ['CONFIRMED', 'PENDING'] },
        scheduled_at: { lte: now },
      },
      select: { id: true, gym_id: true, status: true, scheduled_at: true, duration_min: true },
      take: 200,
    });

    const ended = candidates.filter(
      (a) => new Date(a.scheduled_at.getTime() + a.duration_min * 60_000 + graceMs) <= now,
    );
    if (!ended.length) return;

    for (const a of ended) {
      try {
        await this.prisma.appointment.update({
          where: { id: a.id },
          data:
            a.status === 'CONFIRMED'
              ? { status: 'NO_SHOW' }
              : { status: 'CANCELLED', cancelled_reason: 'El trainer no respondió a tiempo' },
        });
      } catch (err) {
        this.logger.error(`Error cerrando sesión PT ${a.id}: ${(err as Error).message}`);
      }
    }
    this.logger.log(`PT session sweep: ${ended.length} sesión(es) cerradas`);
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

  async ariaChat(
    gymId: string,
    memberId: string | null,
    message: string,
    clientHistory?: { role: 'user' | 'aria'; content: string }[],
  ) {
    const [gym, atRiskMembers, upcomingAppointments, ragContext, dbHistory, mentionedMember] =
      await Promise.all([
        this.prisma.gym.findUnique({
          where: { id: gymId },
          select: { name: true, currency: true },
        }),
        this.prisma.member.findMany({
          where: {
            gym_id: gymId,
            risk_score: { gte: 70 },
            status: { in: ['ACTIVE', 'TRIAL', 'FREEZE'] },
          },
          select: { first_name: true, last_name: true, risk_score: true },
          orderBy: { risk_score: 'desc' },
          take: 15,
        }),
        this.prisma.appointment.count({
          where: {
            gym_id: gymId,
            scheduled_at: { gte: new Date(), lte: new Date(Date.now() + 7 * 86_400_000) },
            status: { in: ['SCHEDULED', 'CONFIRMED'] },
          },
        }),
        this.rag.buildContext(gymId, message),
        // Solo se usa como respaldo si el cliente no manda su propio historial
        // (clientHistory) — ver comentario mas abajo.
        memberId && !clientHistory?.length
          ? this.conversation.getHistory(gymId, memberId, 'ARIA')
          : Promise.resolve([]),
        this.findMentionedMemberContext(gymId, message),
      ]);

    const activeMembers = await this.prisma.member.count({
      where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } },
    });

    const atRiskList = atRiskMembers.length
      ? atRiskMembers
          .map((m) => `  - ${m.first_name} ${m.last_name} (score ${m.risk_score})`)
          .join('\n')
      : '  (ninguno)';

    const systemPrompt = `Eres ARIA, el Asistente Relacional Inteligente de ${gym?.name ?? 'el gym'}.
Eres experta en retención de miembros, CRM deportivo y estrategias de fidelización para gimnasios en Latinoamérica.

CONTEXTO ACTUAL DEL GYM:
- Miembros activos: ${activeMembers}
- Miembros en riesgo alto de cancelar (score ≥ 70): ${atRiskMembers.length}
${atRiskList}
- Citas próximas (7 días): ${upcomingAppointments}
- Moneda: ${gym?.currency ?? 'USD'}
${mentionedMember ?? ''}
${ragContext}
INSTRUCCIONES:
- Responde siempre en español, de forma concisa y accionable
- Si el admin pregunta sobre miembros en riesgo, sugiere acciones concretas de retención
- Si pregunta sobre citas o interacciones, da recomendaciones de seguimiento
- Puedes sugerir workflows de retención, estrategias de re-engagement, o análisis de datos
- Sé directa y profesional, como un consultor de negocio especializado en gimnasios
- Si el miembro pregunta algo personal (membresía, citas, horarios), responde con amabilidad
- Si preguntas sobre un miembro especifico no tienen datos en "DATOS DEL MIEMBRO MENCIONADO",
  dilo claramente en vez de inventar — sugiere revisar su perfil completo en el panel
- Máximo 3 párrafos por respuesta`;

    // El cliente (panel web) ya mantiene el historial completo en pantalla —
    // se usa ese en vez del de la base de datos porque el chat de ARIA en el
    // panel lo usa el staff/admin, no un miembro, y no hay una sesión de
    // conversacion persistida limpia para ese caso (ver comentario en el
    // controller). Si el cliente no manda historial, cae al de la BD (uso
    // futuro: chat ARIA desde la app movil con memberId real).
    const geminiHistory = clientHistory?.length
      ? clientHistory.map((h) => ({
          role: h.role === 'aria' ? ('model' as const) : ('user' as const),
          parts: [{ text: h.content }],
        }))
      : this.conversation.toGeminiHistory(dbHistory);

    try {
      const response = await this.gemini.chat(systemPrompt, message, geminiHistory);
      if (memberId)
        void this.conversation.addMessages(
          gymId,
          memberId,
          'ARIA',
          message,
          response,
          'gemini-2.5-flash-lite',
        );
      return { response, isStub: false };
    } catch (err) {
      const errMsg = (err as Error).message ?? String(err);
      this.logger.error(`ARIA Gemini error: ${errMsg}`);

      // Las 10 keys de Gemini se agotaron (cuota) — intenta con NVIDIA NIM como
      // respaldo de segundo nivel antes de rendirse. Solo aplica a este error
      // especifico, no a fallos de red/timeout/contenido bloqueado.
      if (errMsg.includes('All Gemini API keys exhausted') && this.nvidiaNim.isEnabled) {
        try {
          const response = await this.nvidiaNim.chat(systemPrompt, message, geminiHistory);
          if (memberId)
            void this.conversation.addMessages(
              gymId,
              memberId,
              'ARIA',
              message,
              response,
              'nvidia-nim-fallback',
            );
          return { response, isStub: false, fallbackModel: true };
        } catch (nimErr) {
          this.logger.error(`ARIA NVIDIA NIM fallback error: ${(nimErr as Error).message}`);
        }
      }

      return {
        response:
          'Lo siento, el servicio de IA no está disponible en este momento. Por favor intenta de nuevo en unos segundos.',
        isStub: false,
        error: true,
        debugError: errMsg.slice(0, 500),
      };
    }
  }

  // â”€â”€â”€ PRIVATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async findMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member;
  }

  // Si el mensaje del staff menciona el nombre completo de un miembro real del
  // gym, busca su membresia actual para que ARIA pueda responder preguntas
  // especificas ("que plan tiene Juan Campos") en vez de solo tener acceso a
  // conteos agregados. Match simple por substring (case-insensitive) — el
  // volumen de miembros por gym es bajo (cientos, no miles), asi que no
  // justifica un parser de NLP para esto.
  private async findMentionedMemberContext(gymId: string, message: string): Promise<string | null> {
    const lowerMsg = message.toLowerCase();
    const members = await this.prisma.member.findMany({
      where: { gym_id: gymId },
      select: { id: true, first_name: true, last_name: true },
    });

    const mentioned = members.find((m) =>
      lowerMsg.includes(`${m.first_name} ${m.last_name}`.toLowerCase()),
    );
    if (!mentioned) return null;

    const membership = await this.prisma.membership.findFirst({
      where: { member_id: mentioned.id, gym_id: gymId },
      orderBy: { created_at: 'desc' },
      include: { type: { select: { name: true, price: true, currency: true } } },
    });

    const planLine = membership
      ? `Plan: ${membership.type.name} (${membership.type.currency} ${membership.type.price}) — Estado: ${membership.status} — Vigencia: ${membership.start_date.toLocaleDateString('es-SV')} a ${membership.end_date.toLocaleDateString('es-SV')}`
      : 'Sin membresía registrada';

    return `\nDATOS DEL MIEMBRO MENCIONADO (${mentioned.first_name} ${mentioned.last_name}):\n- ${planLine}\n`;
  }
}
