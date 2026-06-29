import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { RagService } from '../ai/rag.service';
import { ConversationService } from '../ai/conversation.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { LogSetDto, FinishSessionDto } from './dto/log-set.dto';

@Injectable()
export class WorkoutService {
  private readonly logger = new Logger(WorkoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly rag: RagService,
    private readonly conversation: ConversationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── EJERCICIOS ───────────────────────────────────────────────────────────────

  async listExercises(
    gymId: string,
    query: { search?: string; muscleGroup?: string; equipment?: string; category?: string },
  ) {
    const where: Record<string, unknown> = {
      is_active: true,
      OR: [{ gym_id: gymId }, { gym_id: null }],
    };

    if (query.category) where['category'] = query.category;
    if (query.muscleGroup) where['muscle_groups'] = { has: query.muscleGroup };
    if (query.equipment) where['equipment'] = { has: query.equipment };
    if (query.search) {
      where['name'] = { contains: query.search, mode: 'insensitive' };
      delete where['OR'];
      where['AND'] = [
        { OR: [{ gym_id: gymId }, { gym_id: null }] },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
      delete where['name'];
    }

    const exercises = await this.prisma.exercise.findMany({
      where,
      orderBy: [{ gym_id: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }],
    });

    return exercises;
  }

  async getExercise(gymId: string, id: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, is_active: true, OR: [{ gym_id: gymId }, { gym_id: null }] },
    });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado');
    return exercise;
  }

  async createExercise(gymId: string, dto: CreateExerciseDto) {
    const exercise = await this.prisma.exercise.create({
      data: {
        gym_id: gymId,
        name: dto.name,
        description: dto.description,
        muscle_groups: dto.muscleGroups,
        secondary_muscles: dto.secondaryMuscles ?? [],
        equipment: dto.equipment ?? [],
        category: dto.category ?? 'STRENGTH',
        difficulty: dto.difficulty ?? 'INTERMEDIATE',
        instructions: dto.instructions,
        video_url: dto.videoUrl,
        is_active: dto.isActive ?? true,
      },
    });
    return exercise;
  }

  async updateExercise(gymId: string, id: string, dto: Partial<CreateExerciseDto>) {
    const exercise = await this.prisma.exercise.findFirst({ where: { id, gym_id: gymId } });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado');

    return this.prisma.exercise.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.muscleGroups !== undefined && { muscle_groups: dto.muscleGroups }),
        ...(dto.secondaryMuscles !== undefined && { secondary_muscles: dto.secondaryMuscles }),
        ...(dto.equipment !== undefined && { equipment: dto.equipment }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.videoUrl !== undefined && { video_url: dto.videoUrl }),
        ...(dto.isActive !== undefined && { is_active: dto.isActive }),
      },
    });
  }

  // ─── PLANES ───────────────────────────────────────────────────────────────────

  async createPlan(gymId: string, dto: CreatePlanDto) {
    const plan = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workoutPlan.create({
        data: {
          gym_id: gymId,
          name: dto.name,
          description: dto.description,
          goal: dto.goal,
          difficulty: dto.difficulty ?? 'INTERMEDIATE',
          days_per_week: dto.daysPerWeek,
          is_template: dto.isTemplate ?? false,
        },
      });

      for (const day of dto.days) {
        const createdDay = await tx.workoutPlanDay.create({
          data: {
            plan_id: created.id,
            day_number: day.dayNumber,
            name: day.name,
          },
        });

        if (day.blocks.length > 0) {
          await tx.workoutBlock.createMany({
            data: day.blocks.map((b) => ({
              day_id: createdDay.id,
              exercise_id: b.exerciseId,
              block_type: b.blockType ?? 'STANDARD',
              order: b.order,
              sets: b.sets,
              reps_min: b.repsMin,
              reps_max: b.repsMax,
              rpe: b.rpe,
              rest_seconds: b.restSeconds,
              notes: b.notes,
            })),
          });
        }
      }

      return created;
    });

    return this.getPlan(gymId, plan.id);
  }

  async listPlans(gymId: string) {
    return this.prisma.workoutPlan.findMany({
      where: { gym_id: gymId, is_active: true },
      include: {
        days: { select: { id: true } },
        member_plans: { where: { is_active: true }, select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPlan(gymId: string, id: string) {
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id, gym_id: gymId },
      include: {
        days: {
          orderBy: { day_number: 'asc' },
          include: {
            blocks: {
              orderBy: { order: 'asc' },
              include: {
                exercise: {
                  select: { id: true, name: true, muscle_groups: true, equipment: true },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }

  async assignPlanToMember(gymId: string, memberId: string, planId: string, notes?: string) {
    const [member, plan] = await Promise.all([
      this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } }),
      this.prisma.workoutPlan.findFirst({ where: { id: planId, gym_id: gymId } }),
    ]);
    if (!member) throw new NotFoundException('Miembro no encontrado');
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Desactivar plan activo anterior si existe
    await this.prisma.memberPlan.updateMany({
      where: { member_id: memberId, gym_id: gymId, is_active: true },
      data: { is_active: false },
    });

    return this.prisma.memberPlan.create({
      data: { gym_id: gymId, member_id: memberId, plan_id: planId, notes },
      include: { plan: { select: { name: true, days_per_week: true, goal: true } } },
    });
  }

  async getMemberPlans(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    return this.prisma.memberPlan.findMany({
      where: { member_id: memberId, gym_id: gymId },
      include: {
        plan: {
          include: {
            days: {
              include: { blocks: { include: { exercise: { select: { name: true } } } } },
            },
          },
        },
      },
      orderBy: { started_at: 'desc' },
    });
  }

  // ─── SESIONES ─────────────────────────────────────────────────────────────────

  async startSession(gymId: string, dto: StartSessionDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gym_id: gymId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    // Verificar que no tiene sesión activa (sin finish)
    const active = await this.prisma.workoutSession.findFirst({
      where: { member_id: dto.memberId, gym_id: gymId, finished_at: null },
    });
    if (active) throw new BadRequestException('El miembro ya tiene una sesión activa');

    if (dto.planId) {
      const plan = await this.prisma.workoutPlan.findFirst({
        where: { id: dto.planId, gym_id: gymId },
      });
      if (!plan) throw new NotFoundException('Plan no encontrado');
    }

    const session = await this.prisma.workoutSession.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        plan_id: dto.planId,
        plan_day_id: dto.planDayId,
        name: dto.name,
      },
      include: {
        plan: { select: { name: true, days_per_week: true } },
        plan_day: { select: { day_number: true, name: true } },
        member: { select: { first_name: true, last_name: true } },
      },
    });

    this.logger.log(`Session started — member ${dto.memberId} — session ${session.id}`);
    return session;
  }

  async logSet(gymId: string, sessionId: string, dto: LogSetDto) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, gym_id: gymId, finished_at: null },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada o ya finalizada');

    const exercise = await this.prisma.exercise.findFirst({
      where: { id: dto.exerciseId, OR: [{ gym_id: gymId }, { gym_id: null }] },
    });
    if (!exercise) throw new NotFoundException('Ejercicio no encontrado');

    let isPr = false;

    // PR detection: nuevo máximo de peso para este miembro/ejercicio
    if (dto.weightKg && dto.reps && !dto.isWarmup) {
      const existingPr = await this.prisma.personalRecord.findFirst({
        where: {
          gym_id: gymId,
          member_id: session.member_id,
          exercise_id: dto.exerciseId,
          record_type: 'MAX_WEIGHT',
        },
      });

      if (!existingPr || dto.weightKg > Number(existingPr.value)) {
        isPr = true;
        await this.prisma.personalRecord.upsert({
          where: {
            gym_id_member_id_exercise_id_record_type: {
              gym_id: gymId,
              member_id: session.member_id,
              exercise_id: dto.exerciseId,
              record_type: 'MAX_WEIGHT',
            },
          },
          update: { value: dto.weightKg, achieved_at: new Date(), session_id: sessionId },
          create: {
            gym_id: gymId,
            member_id: session.member_id,
            exercise_id: dto.exerciseId,
            record_type: 'MAX_WEIGHT',
            value: dto.weightKg,
            unit: 'kg',
            achieved_at: new Date(),
            session_id: sessionId,
          },
        });
        this.logger.log(
          `New PR! member=${session.member_id} exercise=${dto.exerciseId} ${dto.weightKg}kg`,
        );
      }
    }

    const set = await this.prisma.workoutSet.create({
      data: {
        session_id: sessionId,
        exercise_id: dto.exerciseId,
        set_number: dto.setNumber,
        reps: dto.reps,
        weight_kg: dto.weightKg,
        duration_sec: dto.durationSec,
        distance_m: dto.distanceM,
        is_warmup: dto.isWarmup ?? false,
        is_pr: isPr,
        notes: dto.notes,
      },
      include: { exercise: { select: { name: true } } },
    });

    return { ...set, weight_kg: set.weight_kg ? Number(set.weight_kg) : null };
  }

  async finishSession(gymId: string, sessionId: string, dto: FinishSessionDto) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id: sessionId, gym_id: gymId, finished_at: null },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada o ya finalizada');

    const finishedAt = new Date();
    const durationMin = Math.round((finishedAt.getTime() - session.started_at.getTime()) / 60000);

    const updated = await this.prisma.workoutSession.update({
      where: { id: sessionId },
      data: {
        finished_at: finishedAt,
        duration_min: durationMin,
        notes: dto.notes ?? session.notes,
        perceived_effort: dto.perceivedEffort,
      },
      include: {
        sets: {
          include: { exercise: { select: { name: true } } },
          orderBy: { created_at: 'asc' },
        },
        member: { select: { first_name: true, last_name: true } },
      },
    });

    this.eventEmitter.emit('workout.session_finished', {
      gymId,
      memberId: session.member_id,
      sessionId,
    });

    return updated;
  }

  async getSession(gymId: string, id: string) {
    const session = await this.prisma.workoutSession.findFirst({
      where: { id, gym_id: gymId },
      include: {
        sets: {
          include: { exercise: { select: { id: true, name: true, muscle_groups: true } } },
          orderBy: [{ exercise_id: 'asc' }, { set_number: 'asc' }],
        },
        plan: { select: { name: true } },
        plan_day: { select: { day_number: true, name: true } },
        member: {
          select: { first_name: true, last_name: true, user: { select: { email: true } } },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    return {
      ...session,
      sets: session.sets.map((s) => ({
        ...s,
        weight_kg: s.weight_kg ? Number(s.weight_kg) : null,
      })),
    };
  }

  async getMemberSessions(gymId: string, memberId: string, page = 1, limit = 20) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const skip = (page - 1) * limit;
    const [sessions, total] = await Promise.all([
      this.prisma.workoutSession.findMany({
        where: { member_id: memberId, gym_id: gymId },
        skip,
        take: limit,
        orderBy: { started_at: 'desc' },
        include: {
          plan: { select: { name: true } },
          _count: { select: { sets: true } },
        },
      }),
      this.prisma.workoutSession.count({ where: { member_id: memberId, gym_id: gymId } }),
    ]);

    return {
      data: sessions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMemberPRs(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const prs = await this.prisma.personalRecord.findMany({
      where: { member_id: memberId, gym_id: gymId },
      include: { exercise: { select: { name: true, muscle_groups: true } } },
      orderBy: { achieved_at: 'desc' },
    });

    return prs.map((pr) => ({ ...pr, value: Number(pr.value) }));
  }

  // ─── WORKOUT STATS (para dashboard) ──────────────────────────────────────────

  async getWorkoutStats(gymId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [weekSessions, totalPlans, totalExercises, recentSessions] = await Promise.all([
      this.prisma.workoutSession.count({
        where: { gym_id: gymId, started_at: { gte: startOfWeek }, finished_at: { not: null } },
      }),
      this.prisma.workoutPlan.count({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.exercise.count({
        where: { OR: [{ gym_id: gymId }, { gym_id: null }], is_active: true },
      }),
      this.prisma.workoutSession.findMany({
        where: { gym_id: gymId, finished_at: { not: null } },
        take: 10,
        orderBy: { started_at: 'desc' },
        include: {
          member: { select: { first_name: true, last_name: true } },
          plan: { select: { name: true } },
          _count: { select: { sets: true } },
        },
      }),
    ]);

    return { weekSessions, totalPlans, totalExercises, recentSessions };
  }

  async forceFinishActiveSession(gymId: string, memberId: string) {
    const active = await this.prisma.workoutSession.findFirst({
      where: { member_id: memberId, gym_id: gymId, finished_at: null },
    });
    if (!active) throw new NotFoundException('Sin sesión activa');

    if (active.gym_id !== gymId) throw new ForbiddenException();

    return this.finishSession(gymId, active.id, {});
  }

  // ─── ZEUS ─────────────────────────────────────────────────────────────────────

  async zeusChat(gymId: string, memberId: string, message: string) {
    const [member, activeSession, recentPRs, exercises, ragContext, history] = await Promise.all([
      this.prisma.member.findFirst({
        where: { id: memberId, gym_id: gymId },
        select: { first_name: true, last_name: true },
      }),
      this.prisma.workoutSession.findFirst({
        where: { member_id: memberId, gym_id: gymId, finished_at: null },
        include: {
          plan: { select: { name: true, goal: true } },
          sets: {
            orderBy: { created_at: 'desc' },
            take: 10,
            include: { exercise: { select: { name: true, muscle_groups: true } } },
          },
        },
      }),
      this.prisma.personalRecord.findMany({
        where: { member_id: memberId, gym_id: gymId },
        orderBy: { achieved_at: 'desc' },
        take: 5,
        include: { exercise: { select: { name: true } } },
      }),
      this.prisma.exercise.findMany({
        where: { gym_id: gymId },
        select: { name: true, muscle_groups: true, equipment: true },
        take: 30,
      }),
      this.rag.buildContext(gymId, message),
      this.conversation.getHistory(gymId, memberId, 'ZEUS'),
    ]);

    const memberName = member ? `${member.first_name} ${member.last_name}` : 'el miembro';

    const sessionContext = activeSession
      ? `SESIÓN ACTIVA: Plan "${activeSession.plan?.name ?? 'sin plan'}" (objetivo: ${activeSession.plan?.goal ?? 'N/A'}).
Últimas series: ${activeSession.sets
          .slice(0, 5)
          .map((s) => `${s.exercise.name} ${s.weight_kg ?? 0}kg × ${s.reps ?? 0} reps`)
          .join(', ')}`
      : 'Sin sesión activa ahora mismo.';

    const prContext = recentPRs.length
      ? `PRs recientes: ${recentPRs.map((pr) => `${pr.exercise.name} ${pr.value}${pr.unit}`).join(', ')}`
      : 'Sin PRs registrados aún.';

    const exerciseContext = exercises.length
      ? `Ejercicios disponibles en el gym: ${exercises.map((e) => e.name).join(', ')}`
      : '';

    const systemPrompt = `Eres ZEUS (Zone Expert Universal Support), el coach de workout en tiempo real de GymApp.
Estás asistiendo a ${memberName} durante su entrenamiento.

${sessionContext}
${prContext}
${exerciseContext}
${ragContext}
INSTRUCCIONES:
- Responde SIEMPRE en español, de forma concisa y motivadora
- Eres un coach de élite: directo, técnico y motivador
- Si preguntan por un ejercicio, da instrucciones técnicas claras (postura, respiración, tempo)
- Si preguntan por sustituciones, sugiere 2 alternativas con el mismo músculo objetivo
- Si preguntan sobre peso o reps, basa tu respuesta en los PRs del miembro
- Si no hay sesión activa, ayuda a planificar el entrenamiento del día
- Máximo 2 párrafos. Usa términos de fitness en español cuando sea posible
- Añade una frase motivadora corta al final cuando sea apropiado`;

    try {
      const geminiHistory = this.conversation.toGeminiHistory(history);
      const response = await this.gemini.chat(systemPrompt, message, geminiHistory);
      void this.conversation.addMessages(gymId, memberId, 'ZEUS', message, response);
      return { response, isStub: false };
    } catch (err) {
      this.logger.error(`ZEUS Gemini error: ${(err as Error).message}`);
      return {
        response: 'ZEUS no disponible en este momento. Consulta con tu trainer directamente.',
        isStub: false,
        error: true,
      };
    }
  }
}
