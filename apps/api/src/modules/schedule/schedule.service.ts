import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { ClassEnrollment, ClassSession, ClassType } from '@prisma/client';

export interface CreateClassTypeDto {
  name: string;
  description?: string;
  color?: string;
  duration_minutes: number;
  difficulty?: string;
}

export interface CreateSessionDto {
  class_type_id: string;
  trainer_id?: string;
  scheduled_at: string; // ISO string
  capacity: number;
  room?: string;
  notes?: string;
}

export interface AdminSessionView extends Omit<ClassSession, 'updated_at'> {
  class_type: { name: string; color: string };
  trainer: { first_name: string; last_name: string } | null;
  enrolled_count: number;
  waitlist_count: number;
  updated_at: Date;
}

export interface SessionEnrollment {
  id: string;
  status: string;
  enrolled_at: Date;
  member: { id: string; first_name: string; last_name: string };
}

export interface SessionWithMeta {
  id: string;
  gym_id: string;
  class_type_id: string;
  trainer_id: string | null;
  scheduled_at: Date;
  duration_minutes: number;
  capacity: number;
  room: string | null;
  notes: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  class_type: {
    id: string;
    name: string;
    color: string;
    duration_minutes: number;
    difficulty: string | null;
  };
  trainer: {
    first_name: string;
    last_name: string;
  } | null;
  enrolled_count: number;
  waitlist_count: number;
  my_enrollment: ClassEnrollment | null;
  is_full: boolean;
}

export interface MyEnrollment {
  id: string;
  gym_id: string;
  session_id: string;
  member_id: string;
  status: string;
  enrolled_at: Date;
  cancelled_at: Date | null;
  scheduled_at: Date;
  room: string | null;
  class_name: string;
  class_color: string;
  class_duration_minutes: number;
  trainer_first_name: string | null;
  trainer_last_name: string | null;
}

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notif: NotificationService,
  ) {}

  private async resolveMemberId(gymId: string, userId: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member.id;
  }

  async getClassTypes(gymId: string): Promise<ClassType[]> {
    return this.prisma.classType.findMany({
      where: {
        gym_id: gymId,
        is_active: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getSessions(
    gymId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SessionWithMeta[]> {
    const memberId = await this.resolveMemberId(gymId, userId);
    const sessions = await this.prisma.classSession.findMany({
      where: {
        gym_id: gymId,
        scheduled_at: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SCHEDULED',
      },
      include: {
        class_type: {
          select: {
            id: true,
            name: true,
            color: true,
            duration_minutes: true,
            difficulty: true,
          },
        },
        trainer: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            member_id: true,
            status: true,
            enrolled_at: true,
            cancelled_at: true,
            gym_id: true,
            session_id: true,
          },
        },
      },
      orderBy: { scheduled_at: 'asc' },
    });

    return sessions.map((session) => {
      const enrolled_count = session.enrollments.filter((e) => e.status === 'ENROLLED').length;
      const waitlist_count = session.enrollments.filter((e) => e.status === 'WAITLIST').length;
      const my_enrollment = session.enrollments.find((e) => e.member_id === memberId) ?? null;
      const is_full = enrolled_count >= session.capacity;

      // Posición en lista de espera si aplica (1-indexed)
      let my_waitlist_position: number | null = null;
      if (my_enrollment?.status === 'WAITLIST') {
        const ordered = session.enrollments
          .filter((e) => e.status === 'WAITLIST')
          .sort((a, b) => a.enrolled_at.getTime() - b.enrolled_at.getTime());
        const idx = ordered.findIndex((e) => e.member_id === memberId);
        if (idx >= 0) my_waitlist_position = idx + 1;
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { enrollments: _enr, ...sessionData } = session;

      return {
        ...sessionData,
        enrolled_count,
        waitlist_count,
        my_enrollment,
        my_waitlist_position,
        is_full,
      };
    });
  }

  async enroll(gymId: string, userId: string, sessionId: string): Promise<ClassEnrollment> {
    const memberId = await this.resolveMemberId(gymId, userId);
    const session = await this.prisma.classSession.findFirst({
      where: {
        id: sessionId,
        gym_id: gymId,
        status: 'SCHEDULED',
      },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const enrolled_count = await this.prisma.classEnrollment.count({
      where: {
        session_id: sessionId,
        gym_id: gymId,
        status: 'ENROLLED',
      },
    });

    const existingEnrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        session_id: sessionId,
        member_id: memberId,
        gym_id: gymId,
        status: { in: ['ENROLLED', 'WAITLIST'] },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Ya estás inscrito o en lista de espera');
    }

    const status = enrolled_count < session.capacity ? 'ENROLLED' : 'WAITLIST';

    return this.prisma.classEnrollment.create({
      data: {
        gym_id: gymId,
        session_id: sessionId,
        member_id: memberId,
        status,
        enrolled_at: new Date(),
      },
    });
  }

  async cancelEnrollment(gymId: string, userId: string, sessionId: string): Promise<void> {
    const memberId = await this.resolveMemberId(gymId, userId);
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        session_id: sessionId,
        member_id: memberId,
        gym_id: gymId,
        status: { in: ['ENROLLED', 'WAITLIST'] },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Inscripción no encontrada');
    }

    await this.prisma.classEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
      },
    });

    if (enrollment.status === 'ENROLLED') {
      const firstWaitlist = await this.prisma.classEnrollment.findFirst({
        where: {
          session_id: sessionId,
          gym_id: gymId,
          status: 'WAITLIST',
        },
        orderBy: { enrolled_at: 'asc' },
        include: {
          member: { select: { user_id: true, first_name: true } },
          session: {
            select: {
              scheduled_at: true,
              class_type: { select: { name: true } },
            },
          },
        },
      });

      if (firstWaitlist) {
        await this.prisma.classEnrollment.update({
          where: { id: firstWaitlist.id },
          data: { status: 'ENROLLED' },
        });

        // Notifica al promovido (E4)
        const sessionDate = firstWaitlist.session.scheduled_at;
        const className = firstWaitlist.session.class_type.name;
        const dateStr = sessionDate.toLocaleDateString('es-SV', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
        await this.notif
          .create({
            gymId,
            userId: firstWaitlist.member.user_id,
            type: 'CLASS_PROMOTED_FROM_WAITLIST',
            title: '🎉 ¡Hay lugar para ti!',
            body: `Subiste de la lista de espera a ${className} (${dateStr}). ¡Nos vemos!`,
            data: { session_id: sessionId, class_name: className },
          })
          .catch(() => {
            // notifs son fire-and-forget; el cancel no debe fallar
          });
      }
    }
  }

  async getMyEnrollments(gymId: string, userId: string): Promise<MyEnrollment[]> {
    const memberId = await this.resolveMemberId(gymId, userId);
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        member_id: memberId,
        gym_id: gymId,
        status: { in: ['ENROLLED', 'WAITLIST'] },
        session: {
          scheduled_at: { gte: new Date() },
        },
      },
      include: {
        session: {
          include: {
            class_type: {
              select: {
                name: true,
                color: true,
                duration_minutes: true,
              },
            },
            trainer: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        session: { scheduled_at: 'asc' },
      },
    });

    return enrollments.map((e) => ({
      id: e.id,
      gym_id: e.gym_id,
      session_id: e.session_id,
      member_id: e.member_id,
      status: e.status,
      enrolled_at: e.enrolled_at,
      cancelled_at: e.cancelled_at,
      scheduled_at: e.session.scheduled_at,
      room: e.session.room,
      class_name: e.session.class_type.name,
      class_color: e.session.class_type.color,
      class_duration_minutes: e.session.class_type.duration_minutes,
      trainer_first_name: e.session.trainer?.first_name ?? null,
      trainer_last_name: e.session.trainer?.last_name ?? null,
    }));
  }

  // ─── Admin: class type management ─────────────────────────────────────────

  async getAdminClassTypes(gymId: string): Promise<ClassType[]> {
    return this.prisma.classType.findMany({
      where: { gym_id: gymId },
      orderBy: { name: 'asc' },
    });
  }

  async createClassType(gymId: string, dto: CreateClassTypeDto): Promise<ClassType> {
    return this.prisma.classType.create({
      data: {
        gym_id: gymId,
        name: dto.name,
        description: dto.description ?? null,
        color: dto.color ?? '#1d4ed8',
        duration_minutes: dto.duration_minutes,
        difficulty: dto.difficulty ?? null,
      },
    });
  }

  async toggleClassType(gymId: string, typeId: string): Promise<ClassType> {
    const ct = await this.prisma.classType.findFirst({ where: { id: typeId, gym_id: gymId } });
    if (!ct) throw new NotFoundException('Tipo de clase no encontrado');
    return this.prisma.classType.update({
      where: { id: typeId },
      data: { is_active: !ct.is_active },
    });
  }

  // ─── Admin: session management ─────────────────────────────────────────────

  async createSession(gymId: string, dto: CreateSessionDto): Promise<ClassSession> {
    const classType = await this.prisma.classType.findFirst({
      where: { id: dto.class_type_id, gym_id: gymId },
    });
    if (!classType) throw new NotFoundException('Tipo de clase no encontrado');

    return this.prisma.classSession.create({
      data: {
        gym_id: gymId,
        class_type_id: dto.class_type_id,
        trainer_id: dto.trainer_id ?? null,
        scheduled_at: new Date(dto.scheduled_at),
        duration_minutes: classType.duration_minutes,
        capacity: dto.capacity,
        room: dto.room ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async getAdminSessions(
    gymId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AdminSessionView[]> {
    const now = new Date();
    const start = startDate ?? now;
    const end = endDate ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.classSession.findMany({
      where: {
        gym_id: gymId,
        scheduled_at: { gte: start, lte: end },
      },
      include: {
        class_type: { select: { name: true, color: true } },
        trainer: { select: { first_name: true, last_name: true } },
        enrollments: { select: { status: true } },
      },
      orderBy: { scheduled_at: 'asc' },
    });

    return sessions.map((s) => {
      const { enrollments, ...rest } = s;
      return {
        ...rest,
        enrolled_count: enrollments.filter((e) => e.status === 'ENROLLED').length,
        waitlist_count: enrollments.filter((e) => e.status === 'WAITLIST').length,
      };
    });
  }

  async getSessionEnrollments(gymId: string, sessionId: string): Promise<SessionEnrollment[]> {
    const session = await this.prisma.classSession.findFirst({
      where: { id: sessionId, gym_id: gymId },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { session_id: sessionId, gym_id: gymId, status: { in: ['ENROLLED', 'WAITLIST'] } },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
      orderBy: { enrolled_at: 'asc' },
    });

    return enrollments.map((e) => ({
      id: e.id,
      status: e.status,
      enrolled_at: e.enrolled_at,
      member: e.member,
    }));
  }
}
