import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notifications/notification.service';

const DAY = 86_400_000;

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);
  // Plantillas de WhatsApp pre-aprobadas en Meta Business Manager — configurables
  // por si el nombre real difiere por ambiente.
  private readonly whatsappRetentionTemplate: string;
  private readonly whatsappRenewalTemplate: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
    private readonly config: ConfigService,
  ) {
    this.whatsappRetentionTemplate =
      this.config.get<string>('WHATSAPP_TEMPLATE_RETENTION') ?? 'retention_reminder';
    this.whatsappRenewalTemplate =
      this.config.get<string>('WHATSAPP_TEMPLATE_RENEWAL') ?? 'renewal_reminder';
  }

  private whatsappBody(firstName: string) {
    return {
      templateName: this.whatsappRetentionTemplate,
      components: [{ type: 'body', parameters: [{ type: 'text', text: firstName }] }],
    };
  }

  // ─── DAILY CRON — 9am ────────────────────────────────────────────────────────

  @Cron('0 9 * * *')
  async runDailyWorkflows() {
    const gyms = await this.prisma.gym.findMany({
      where: { is_active: true },
      select: { id: true },
    });

    this.logger.log(`Running daily retention workflows for ${gyms.length} gyms`);

    await Promise.allSettled(
      gyms.flatMap((g) => [
        this.wf002Birthdays(g.id),
        this.wf004L1Retention(g.id),
        this.wf005L2Retention(g.id),
        this.wf006CriticalRetention(g.id),
        this.wf007WinBack(g.id),
        this.wf008RenewalReminder(g.id),
      ]),
    );
  }

  // ─── WF-001: Onboarding ──────────────────────────────────────────────────────

  @OnEvent('membership.activated')
  async wf001Onboarding(payload: { gymId: string; memberId: string; memberName?: string }) {
    try {
      const member = await this.prisma.member.findFirst({
        where: { id: payload.memberId, gym_id: payload.gymId },
        select: { user_id: true, first_name: true },
      });
      if (!member) return;

      await this.notification.create({
        gymId: payload.gymId,
        userId: member.user_id,
        type: 'WF001_ONBOARDING',
        title: '¡Bienvenido al gimnasio!',
        body: `Hola ${member.first_name}, tu membresía está activa. ¡Es hora de empezar a entrenar!`,
        data: { workflow: 'WF001' },
        channel: 'PUSH',
      });

      // Create automated CRM interaction
      await this.prisma.crmInteraction.create({
        data: {
          gym_id: payload.gymId,
          member_id: payload.memberId,
          staff_id: null as unknown as string,
          interaction_type: 'AUTOMATED',
          channel: 'APP',
          subject: 'Onboarding — Bienvenida enviada',
          notes: 'Mensaje de bienvenida enviado automáticamente al activar membresía.',
          occurred_at: new Date(),
        },
      });

      this.logger.log(`WF-001 Onboarding sent to member ${payload.memberId}`);
    } catch (err) {
      this.logger.error(`WF-001 error: ${(err as Error).message}`);
    }
  }

  // ─── WF-002: Cumpleaños ──────────────────────────────────────────────────────

  async wf002Birthdays(gymId: string) {
    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Find members whose birthdate matches today (month and day)
      const members = await this.prisma.$queryRaw<
        { id: string; user_id: string; first_name: string }[]
      >`
        SELECT id, user_id, first_name
        FROM members
        WHERE gym_id = ${gymId}::uuid
          AND status IN ('ACTIVE', 'TRIAL')
          AND birthdate IS NOT NULL
          AND EXTRACT(MONTH FROM birthdate) = ${month}
          AND EXTRACT(DAY FROM birthdate) = ${day}
      `;

      for (const member of members) {
        await this.notification.create({
          gymId,
          userId: member.user_id,
          type: 'WF002_BIRTHDAY',
          title: '¡Feliz cumpleaños! 🎂',
          body: `${member.first_name}, ¡hoy es tu día especial! El gym te desea un maravilloso cumpleaños. ¡Celébralo entrenando!`,
          data: { workflow: 'WF002' },
          channel: 'PUSH',
        });

        // Award 100 bonus FitCoins on birthday
        await this.prisma.member.update({
          where: { id: member.id },
          data: {
            points_balance: { increment: 100 },
            points_lifetime: { increment: 100 },
          },
        });

        await this.prisma.pointsTransaction.create({
          data: {
            gym_id: gymId,
            member_id: member.id,
            amount: 100,
            type: 'BIRTHDAY_BONUS',
            description: '¡Bonus de cumpleaños!',
          },
        });
      }

      if (members.length > 0) {
        this.logger.log(`WF-002 Birthday sent to ${members.length} members in gym ${gymId}`);
      }
    } catch (err) {
      this.logger.error(`WF-002 error in gym ${gymId}: ${(err as Error).message}`);
    }
  }

  // ─── WF-003: Logro Alcanzado ─────────────────────────────────────────────────

  @OnEvent('workout.pr_achieved')
  async wf003Achievement(payload: {
    gymId: string;
    memberId: string;
    exerciseName: string;
    value: number;
    unit?: string;
  }) {
    try {
      const member = await this.prisma.member.findFirst({
        where: { id: payload.memberId, gym_id: payload.gymId },
        select: { user_id: true, first_name: true },
      });
      if (!member) return;

      await this.notification.create({
        gymId: payload.gymId,
        userId: member.user_id,
        type: 'WF003_ACHIEVEMENT',
        title: '¡Nuevo récord personal! 💪',
        body: `${member.first_name}, acabas de romper tu récord en ${payload.exerciseName}: ${payload.value}${payload.unit ?? 'kg'}. ¡Sigue así!`,
        data: { workflow: 'WF003', exerciseName: payload.exerciseName },
        channel: 'PUSH',
      });

      this.logger.log(`WF-003 Achievement sent to member ${payload.memberId}`);
    } catch (err) {
      this.logger.error(`WF-003 error: ${(err as Error).message}`);
    }
  }

  // ─── WF-004: Retención L1 (3-7 días inactivo) ───────────────────────────────

  async wf004L1Retention(gymId: string) {
    try {
      const d3 = new Date(Date.now() - 3 * DAY);
      const d7 = new Date(Date.now() - 7 * DAY);

      const members = await this.findInactiveMembers(gymId, d7, d3);

      for (const m of members) {
        await this.notification.create({
          gymId,
          userId: m.user_id,
          type: 'WF004_L1_RETENTION',
          title: '¡Te echamos de menos! 🏋️',
          body: `${m.first_name}, hace unos días que no te vemos. ¿Todo bien? ¡Ven a entrenar hoy, tu progreso te espera!`,
          data: { workflow: 'WF004', daysSince: m.daysSince },
          channel: 'PUSH',
          phone: m.phone,
          whatsapp: this.whatsappBody(m.first_name),
        });
      }

      if (members.length > 0) {
        this.logger.log(`WF-004 L1 Retention sent to ${members.length} members in gym ${gymId}`);
      }
    } catch (err) {
      this.logger.error(`WF-004 error in gym ${gymId}: ${(err as Error).message}`);
    }
  }

  // ─── WF-005: Retención L2 (7-14 días inactivo) ──────────────────────────────

  async wf005L2Retention(gymId: string) {
    try {
      const d7 = new Date(Date.now() - 7 * DAY);
      const d14 = new Date(Date.now() - 14 * DAY);

      const members = await this.findInactiveMembers(gymId, d14, d7);

      for (const m of members) {
        await this.notification.create({
          gymId,
          userId: m.user_id,
          type: 'WF005_L2_RETENTION',
          title: 'Tu progreso necesita de ti 📊',
          body: `${m.first_name}, llevas varios días sin entrenar. Retomar ahora evita perder tu progreso. ¡Tu trainer te espera!`,
          data: { workflow: 'WF005', daysSince: m.daysSince },
          channel: 'PUSH',
          phone: m.phone,
          whatsapp: this.whatsappBody(m.first_name),
        });

        // Create CRM interaction to alert trainer
        await this.prisma.crmInteraction.create({
          data: {
            gym_id: gymId,
            member_id: m.id,
            staff_id: null as unknown as string,
            interaction_type: 'AUTOMATED',
            channel: 'APP',
            subject: `WF-005: L2 Inactividad — ${m.daysSince} días sin entrenar`,
            notes: `Miembro inactivo ${m.daysSince} días. Alerta de retención enviada automáticamente.`,
            occurred_at: new Date(),
          },
        });
      }

      // Notify trainers
      if (members.length > 0) {
        await this.notification.notifyStaffByRole(
          gymId,
          ['TRAINER', 'GYM_ADMIN'],
          'WF005_TRAINER_ALERT',
          'Miembros inactivos esta semana',
          `${members.length} miembro(s) llevan 7-14 días sin entrenar. Considera contactarlos.`,
          { workflow: 'WF005', count: members.length },
        );
        this.logger.log(`WF-005 L2 Retention sent to ${members.length} members in gym ${gymId}`);
      }
    } catch (err) {
      this.logger.error(`WF-005 error in gym ${gymId}: ${(err as Error).message}`);
    }
  }

  // ─── WF-006: Retención Crítica (14+ días / riesgo > 85) ─────────────────────

  async wf006CriticalRetention(gymId: string) {
    try {
      const d14 = new Date(Date.now() - 14 * DAY);

      const [longInactive, highRisk] = await Promise.all([
        this.findInactiveMembers(gymId, new Date(0), d14),
        this.prisma.member.findMany({
          where: {
            gym_id: gymId,
            status: { in: ['ACTIVE', 'TRIAL'] },
            risk_score: { gte: 85 },
          },
          select: { id: true, user_id: true, first_name: true, phone: true, risk_score: true },
        }),
      ]);

      const memberIds = new Set<string>();
      const targets: {
        id: string;
        user_id: string;
        first_name: string;
        phone: string | null;
        reason: string;
      }[] = [];

      for (const m of longInactive) {
        if (!memberIds.has(m.id)) {
          memberIds.add(m.id);
          targets.push({
            id: m.id,
            user_id: m.user_id,
            first_name: m.first_name,
            phone: m.phone,
            reason: `${m.daysSince} días sin entrenar`,
          });
        }
      }
      for (const m of highRisk) {
        if (!memberIds.has(m.id)) {
          memberIds.add(m.id);
          targets.push({
            id: m.id,
            user_id: m.user_id,
            first_name: m.first_name,
            phone: m.phone,
            reason: `riesgo de cancelación: ${m.risk_score}/100`,
          });
        }
      }

      for (const m of targets) {
        await this.notification.create({
          gymId,
          userId: m.user_id,
          type: 'WF006_CRITICAL_RETENTION',
          title: '¡No te rindas! 🚨',
          body: `${m.first_name}, queremos mantenerte activo en el gym. Agenda una sesión gratuita con tu trainer esta semana. ¡Contáctanos!`,
          data: { workflow: 'WF006', reason: m.reason },
          channel: 'PUSH',
          phone: m.phone,
          whatsapp: this.whatsappBody(m.first_name),
        });

        await this.prisma.member.update({
          where: { id: m.id },
          data: { status: 'PRE_CANCEL' },
        });
      }

      if (targets.length > 0) {
        await this.notification.notifyStaffByRole(
          gymId,
          ['GYM_ADMIN', 'GYM_OWNER'],
          'WF006_ADMIN_ALERT',
          '🚨 Miembros en riesgo crítico de cancelación',
          `${targets.length} miembro(s) en riesgo crítico. Se requiere intervención urgente.`,
          { workflow: 'WF006', count: targets.length },
        );
        this.logger.warn(`WF-006 Critical Retention: ${targets.length} members in gym ${gymId}`);
      }
    } catch (err) {
      this.logger.error(`WF-006 error in gym ${gymId}: ${(err as Error).message}`);
    }
  }

  // ─── WF-007: Win-Back (post-cancelación, ~7 días después) ───────────────────

  async wf007WinBack(gymId: string) {
    try {
      const d6 = new Date(Date.now() - 6 * DAY);
      const d8 = new Date(Date.now() - 8 * DAY);

      const cancelled = await this.prisma.member.findMany({
        where: {
          gym_id: gymId,
          status: 'CANCELLED',
          updated_at: { gte: d8, lte: d6 },
        },
        select: { id: true, user_id: true, first_name: true },
      });

      for (const m of cancelled) {
        await this.notification.create({
          gymId,
          userId: m.user_id,
          type: 'WF007_WIN_BACK',
          title: '¡Vuelve al gym! Tenemos una oferta para ti 🎁',
          body: `${m.first_name}, te extrañamos. Tenemos una oferta especial de reactivación esperándote. ¡Contáctanos y vuelve a entrenar!`,
          data: { workflow: 'WF007' },
          channel: 'PUSH',
        });
      }

      if (cancelled.length > 0) {
        this.logger.log(`WF-007 Win-Back sent to ${cancelled.length} members in gym ${gymId}`);
      }
    } catch (err) {
      this.logger.error(`WF-007 error in gym ${gymId}: ${(err as Error).message}`);
    }
  }

  // ─── WF-008: Renovación Anual (30 días antes de vencer) ─────────────────────

  async wf008RenewalReminder(gymId: string) {
    try {
      const d29 = new Date(Date.now() + 29 * DAY);
      const d31 = new Date(Date.now() + 31 * DAY);

      const expiringMemberships = await this.prisma.membership.findMany({
        where: {
          gym_id: gymId,
          status: 'ACTIVE',
          end_date: { gte: d29, lte: d31 },
        },
        include: {
          member: { select: { id: true, user_id: true, first_name: true, phone: true } },
          type: { select: { name: true } },
        },
      });

      for (const ms of expiringMemberships) {
        await this.notification.create({
          gymId,
          userId: ms.member.user_id,
          type: 'WF008_RENEWAL_REMINDER',
          title: 'Tu membresía vence pronto 📅',
          body: `${ms.member.first_name}, tu membresía "${ms.type.name}" vence en 30 días. ¡Renueva ahora y no pierdas tu progreso!`,
          data: { workflow: 'WF008', membershipId: ms.id },
          channel: 'PUSH',
          phone: ms.member.phone,
          whatsapp: {
            templateName: this.whatsappRenewalTemplate,
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: ms.member.first_name },
                  { type: 'text', text: ms.type.name },
                ],
              },
            ],
          },
        });

        await this.prisma.crmInteraction.create({
          data: {
            gym_id: gymId,
            member_id: ms.member.id,
            staff_id: null as unknown as string,
            interaction_type: 'AUTOMATED',
            channel: 'APP',
            subject: 'WF-008: Recordatorio de renovación enviado',
            notes: `Membresía "${ms.type.name}" vence en ~30 días.`,
            occurred_at: new Date(),
          },
        });
      }

      if (expiringMemberships.length > 0) {
        this.logger.log(
          `WF-008 Renewal Reminder sent to ${expiringMemberships.length} members in gym ${gymId}`,
        );
      }
    } catch (err) {
      this.logger.error(`WF-008 error in gym ${gymId}: ${(err as Error).message}`);
    }
  }

  // ─── HELPER ──────────────────────────────────────────────────────────────────

  private async findInactiveMembers(
    gymId: string,
    from: Date,
    to: Date,
  ): Promise<
    { id: string; user_id: string; first_name: string; phone: string | null; daysSince: number }[]
  > {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        user_id: string;
        first_name: string;
        phone: string | null;
        last_session: Date | null;
      }[]
    >`
      SELECT m.id, m.user_id, m.first_name, m.phone,
             MAX(ws.started_at) AS last_session
      FROM members m
      LEFT JOIN workout_sessions ws ON ws.member_id = m.id AND ws.gym_id = m.gym_id AND ws.finished_at IS NOT NULL
      WHERE m.gym_id = ${gymId}::uuid
        AND m.status IN ('ACTIVE', 'TRIAL')
      GROUP BY m.id, m.user_id, m.first_name, m.phone
      HAVING MAX(ws.started_at) >= ${from} AND MAX(ws.started_at) < ${to}
         OR (MAX(ws.started_at) IS NULL AND m.created_at < ${to})
    `;

    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      first_name: r.first_name,
      phone: r.phone,
      daysSince: r.last_session ? Math.floor((Date.now() - r.last_session.getTime()) / DAY) : 999,
    }));
  }
}
