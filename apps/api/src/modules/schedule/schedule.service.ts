import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ClassEnrollment, ClassType } from '@prisma/client';

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
  constructor(private readonly prisma: PrismaService) {}

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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { enrollments: _enr, ...sessionData } = session;

      return {
        ...sessionData,
        enrolled_count,
        waitlist_count,
        my_enrollment,
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
      });

      if (firstWaitlist) {
        await this.prisma.classEnrollment.update({
          where: { id: firstWaitlist.id },
          data: { status: 'ENROLLED' },
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
}
