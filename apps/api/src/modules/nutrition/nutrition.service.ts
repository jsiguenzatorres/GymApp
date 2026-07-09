import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { StorageService } from '../storage/storage.service';
import {
  CreatePlanDto,
  CreateFoodItemDto,
  UpdateFoodItemDto,
  LogFoodDto,
  UpsertNutritionProfileDto,
  ReviewRiskAlertDto,
  UploadLabResultDto,
  ReviewLabResultDto,
} from './dto/nutrition.dto';

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly storage: StorageService,
  ) {}

  // ─── PLANES ───────────────────────────────────────────────────────────────────

  async listPlans(gymId: string, memberId?: string) {
    return this.prisma.nutritionPlan.findMany({
      where: { gym_id: gymId, ...(memberId ? { member_id: memberId } : {}) },
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
        _count: { select: { food_diary_entries: true } },
      },
      orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
    });
  }

  async getPlan(gymId: string, id: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { id, gym_id: gymId },
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
      },
    });
    if (!plan) throw new NotFoundException('Plan nutricional no encontrado');
    return plan;
  }

  async createPlan(gymId: string, dto: CreatePlanDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.member_id, gym_id: gymId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    // Salvaguarda TCA (D-24): nunca generar un plan restrictivo (déficit) si el
    // miembro declaró antecedente de TCA y un profesional aún no revisó el caso.
    if (dto.goal === 'WEIGHT_LOSS') {
      const profile = await this.prisma.memberNutritionProfile.findFirst({
        where: { member_id: dto.member_id, gym_id: gymId },
      });
      if (profile?.antecedente_tca_declarado && !profile.tca_clinical_review_completed) {
        throw new ForbiddenException(
          'Este miembro tiene un antecedente de trastorno de conducta alimentaria declarado. ' +
            'No se puede crear un plan de pérdida de peso hasta que un profesional revise el caso ' +
            'en consulta presencial y marque la revisión clínica como completada en su perfil nutricional.',
        );
      }
    }

    await this.prisma.nutritionPlan.updateMany({
      where: { gym_id: gymId, member_id: dto.member_id, is_active: true },
      data: { is_active: false },
    });

    return this.prisma.nutritionPlan.create({
      data: { gym_id: gymId, ...dto },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  async updatePlan(gymId: string, id: string, dto: Partial<CreatePlanDto>) {
    const current = await this.getPlan(gymId, id);

    // Versionado (D-39): snapshot de los valores ANTERIORES si cambia algo editable
    const editableFields = [
      'name',
      'goal',
      'kcal_target',
      'protein_g',
      'carbs_g',
      'fat_g',
    ] as const;
    const changesSomething = editableFields.some(
      (f) => f in dto && dto[f] !== undefined && dto[f] !== current[f],
    );
    if (changesSomething) {
      await this.prisma.nutritionPlanHistory.create({
        data: {
          gym_id: gymId,
          nutrition_plan_id: id,
          name: current.name,
          goal: current.goal,
          kcal_target: current.kcal_target,
          protein_g: current.protein_g,
          carbs_g: current.carbs_g,
          fat_g: current.fat_g,
          notes: current.notes,
        },
      });
    }

    return this.prisma.nutritionPlan.update({
      where: { id },
      data: dto,
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
    });
  }

  async listPlanHistory(gymId: string, planId: string) {
    await this.getPlan(gymId, planId);
    return this.prisma.nutritionPlanHistory.findMany({
      where: { gym_id: gymId, nutrition_plan_id: planId },
      orderBy: { changed_at: 'desc' },
    });
  }

  async deletePlan(gymId: string, id: string) {
    await this.getPlan(gymId, id);
    return this.prisma.nutritionPlan.delete({ where: { id } });
  }

  // ─── FOOD ITEMS ───────────────────────────────────────────────────────────────

  async searchFoodItems(gymId: string, search?: string) {
    return this.prisma.foodItem.findMany({
      where: {
        OR: [{ gym_id: gymId }, { gym_id: null }],
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ is_verified: 'desc' }, { name: 'asc' }],
      take: 30,
    });
  }

  async createFoodItem(gymId: string, dto: CreateFoodItemDto) {
    return this.prisma.foodItem.create({ data: { gym_id: gymId, ...dto } });
  }

  // Editar es seguro incluso con historial: logFood copia kcal/macros al momento de
  // registrar, no los vuelve a leer del FoodItem — editar no reescribe el pasado.
  // Solo se puede editar/eliminar alimentos propios del gym, nunca los globales
  // (gym_id=null) que comparten todos los gyms.
  async updateFoodItem(gymId: string, id: string, dto: UpdateFoodItemDto) {
    const item = await this.prisma.foodItem.findFirst({ where: { id, gym_id: gymId } });
    if (!item) {
      throw new NotFoundException(
        'Alimento no encontrado o es un alimento global (no editable desde este gym)',
      );
    }
    return this.prisma.foodItem.update({ where: { id }, data: dto });
  }

  async deleteFoodItem(gymId: string, id: string) {
    const item = await this.prisma.foodItem.findFirst({ where: { id, gym_id: gymId } });
    if (!item) {
      throw new NotFoundException(
        'Alimento no encontrado o es un alimento global (no eliminable desde este gym)',
      );
    }
    const usedCount = await this.prisma.foodDiaryEntry.count({ where: { food_item_id: id } });
    if (usedCount > 0) {
      throw new ForbiddenException(
        `No se puede eliminar — tiene ${usedCount} registro(s) en diarios de miembros. Edítalo en vez de borrarlo si el dato está mal.`,
      );
    }
    return this.prisma.foodItem.delete({ where: { id } });
  }

  // ─── PERFIL NUTRICIONAL (D-25) ──────────────────────────────────────────────

  async getNutritionProfile(gymId: string, memberId: string) {
    return this.prisma.memberNutritionProfile.findFirst({
      where: { gym_id: gymId, member_id: memberId },
    });
  }

  async upsertNutritionProfile(gymId: string, memberId: string, dto: UpsertNutritionProfileDto) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    return this.prisma.memberNutritionProfile.upsert({
      where: { member_id: memberId },
      create: { gym_id: gymId, member_id: memberId, ...dto },
      update: { ...dto },
    });
  }

  // ─── MOTOR TMB/TDEE (D-26) ──────────────────────────────────────────────────
  // Calculadora pura: no crea ni edita el plan, solo devuelve una sugerencia que
  // el nutricionista revisa y guarda (o ajusta) al crear/editar el plan.

  private static readonly ACTIVITY_FACTORS: Record<string, number> = {
    sedentario: 1.2,
    ligero: 1.375,
    moderado: 1.55,
    activo: 1.725,
    muy_activo: 1.9,
  };

  // Sesiones esperadas en 14 días por nivel declarado, usado solo para sugerir
  // (nunca sobreescribe) un nivel más realista según asistencia real.
  private static readonly EXPECTED_SESSIONS_14D: Record<string, [number, number]> = {
    sedentario: [0, 1],
    ligero: [1, 6],
    moderado: [6, 10],
    activo: [10, 14],
    muy_activo: [14, 99],
  };

  async calculateTmbTdee(gymId: string, memberId: string, goal: string) {
    const [profile, member, latestWeight, latestBodyFat, sessions14d] = await Promise.all([
      this.prisma.memberNutritionProfile.findFirst({
        where: { gym_id: gymId, member_id: memberId },
      }),
      this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } }),
      this.prisma.healthDataEntry.findFirst({
        where: { member_id: memberId, kind: 'WEIGHT' },
        orderBy: { recorded_at: 'desc' },
      }),
      this.prisma.healthDataEntry.findFirst({
        where: {
          member_id: memberId,
          kind: 'BODY_FAT_PERCENT',
          recorded_at: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { recorded_at: 'desc' },
      }),
      this.prisma.workoutSession.count({
        where: {
          member_id: memberId,
          gym_id: gymId,
          finished_at: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), not: null },
        },
      }),
    ]);
    if (!member) throw new NotFoundException('Miembro no encontrado');

    if (!latestWeight) {
      throw new ForbiddenException(
        'Falta registrar el peso del miembro (health data, kind=WEIGHT) antes de poder calcular TMB/TDEE.',
      );
    }
    const heightCm = profile?.height_cm;
    if (!heightCm) {
      throw new ForbiddenException(
        'Falta la altura del miembro en su perfil nutricional antes de poder calcular TMB/TDEE.',
      );
    }
    if (!member.birthdate) {
      throw new ForbiddenException(
        'Falta la fecha de nacimiento del miembro para calcular TMB/TDEE.',
      );
    }

    const weightKg = Number(latestWeight.value);
    const ageYears = Math.floor(
      (Date.now() - member.birthdate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );
    const warnings: string[] = [];

    let tmbKcal: number;
    let formulaUsed: string;
    if (latestBodyFat) {
      const bodyFatPct = Number(latestBodyFat.value);
      const leanMassKg = weightKg * (1 - bodyFatPct / 100);
      tmbKcal = 370 + 21.6 * leanMassKg;
      formulaUsed = 'katch_mcardle';
    } else {
      const isFemale = member.gender === 'F';
      tmbKcal = isFemale
        ? 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161
        : 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
      formulaUsed = 'mifflin_st_jeor';
      if (member.gender === 'X') {
        warnings.push(
          'Sexo biológico no especificado como M/F: se usó la fórmula masculina de Mifflin-St Jeor por defecto.',
        );
      }
    }

    const declaredLevel = profile?.activity_level ?? 'moderado';
    const factorUsed = NutritionService.ACTIVITY_FACTORS[declaredLevel] ?? 1.55;

    // Cruce con asistencia real (no sobreescribe, solo sugiere)
    let suggestedLevel: string | null = null;
    let activityNote: string | null = null;
    const [minExpected, maxExpected] = NutritionService.EXPECTED_SESSIONS_14D[declaredLevel] ?? [
      0, 99,
    ];
    if (sessions14d < minExpected || sessions14d > maxExpected) {
      const match = Object.entries(NutritionService.EXPECTED_SESSIONS_14D).find(
        ([, [lo, hi]]) => sessions14d >= lo && sessions14d <= hi,
      );
      if (match && match[0] !== declaredLevel) {
        suggestedLevel = match[0];
        activityNote = `El miembro declaró actividad "${declaredLevel}" pero registró ${sessions14d} sesiones en los últimos 14 días, más cercano a "${match[0]}". Puedes ajustar el nivel de actividad en el perfil si aplica.`;
      }
    }

    const tdeeKcal = tmbKcal * factorUsed;

    const goalAdjustment: Record<string, number> = {
      WEIGHT_LOSS: -0.18,
      MUSCLE_GAIN: 0.15,
      MAINTENANCE: 0,
      PERFORMANCE: 0,
    };
    let kcalTarget = tdeeKcal * (1 + (goalAdjustment[goal] ?? 0));
    if (kcalTarget < tmbKcal) {
      kcalTarget = tmbKcal; // nunca por debajo del TMB (Sección 4.1 del documento)
      warnings.push('El déficit calculado bajaba del TMB; se ajustó al piso mínimo seguro.');
    }

    const proteinPerKg: Record<string, number> = {
      WEIGHT_LOSS: 2.0,
      MUSCLE_GAIN: 1.9,
      MAINTENANCE: 1.6,
      PERFORMANCE: 1.8,
    };
    let proteinGPerKg = proteinPerKg[goal] ?? 1.6;
    if (ageYears > 60) proteinGPerKg += 0.3;
    const proteinG = proteinGPerKg * weightKg;

    const fatGPerKgFloor = 0.6;
    const fatG = Math.max(fatGPerKgFloor * weightKg, 0.9 * weightKg);

    const carbsG = Math.max(0, (kcalTarget - proteinG * 4 - fatG * 9) / 4);

    return {
      tmb_kcal: Math.round(tmbKcal),
      tmb_formula_used: formulaUsed,
      tdee_kcal: Math.round(tdeeKcal),
      factor_actividad: factorUsed,
      declared_activity_level: declaredLevel,
      suggested_activity_level: suggestedLevel,
      activity_note: activityNote,
      suggested: {
        kcal_target: Math.round(kcalTarget),
        protein_g: Math.round(proteinG),
        carbs_g: Math.round(carbsG),
        fat_g: Math.round(fatG),
      },
      warnings,
    };
  }

  // ─── DIARIO ───────────────────────────────────────────────────────────────────

  async getDiary(gymId: string, memberId: string, date: string) {
    const entries = await this.prisma.foodDiaryEntry.findMany({
      where: { gym_id: gymId, member_id: memberId, date: new Date(date) },
      include: { food_item: { select: { id: true, name: true, brand: true } } },
      orderBy: { meal_type: 'asc' },
    });

    const totals = entries.reduce(
      (acc, e) => ({
        kcal: acc.kcal + e.kcal,
        protein_g: acc.protein_g + e.protein_g,
        carbs_g: acc.carbs_g + e.carbs_g,
        fat_g: acc.fat_g + e.fat_g,
      }),
      { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    );

    return { entries, totals };
  }

  /** Devuelve totales calóricos por día en un rango (default últimos 30 días). */
  async getDiaryRange(gymId: string, memberId: string, days = 30) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const entries = await this.prisma.foodDiaryEntry.findMany({
      where: { gym_id: gymId, member_id: memberId, date: { gte: start, lte: end } },
      select: { date: true, kcal: true, protein_g: true, carbs_g: true, fat_g: true },
      orderBy: { date: 'asc' },
    });

    // Agrupar por día (YYYY-MM-DD)
    const buckets = new Map<
      string,
      {
        date: string;
        kcal: number;
        protein_g: number;
        carbs_g: number;
        fat_g: number;
        entries: number;
      }
    >();
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, entries: 0 });
    }
    for (const e of entries) {
      const key = e.date.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (!b) continue;
      b.kcal += e.kcal;
      b.protein_g += e.protein_g;
      b.carbs_g += e.carbs_g;
      b.fat_g += e.fat_g;
      b.entries += 1;
    }

    const daily = Array.from(buckets.values()).map((b) => ({
      ...b,
      kcal: Math.round(b.kcal),
      protein_g: Math.round(b.protein_g),
      carbs_g: Math.round(b.carbs_g),
      fat_g: Math.round(b.fat_g),
    }));

    const daysWithLogs = daily.filter((d) => d.entries > 0);
    const avgKcal =
      daysWithLogs.length > 0
        ? Math.round(daysWithLogs.reduce((acc, d) => acc + d.kcal, 0) / daysWithLogs.length)
        : 0;

    return {
      daily,
      days_with_logs: daysWithLogs.length,
      avg_kcal: avgKcal,
      range_start: start.toISOString().slice(0, 10),
      range_end: end.toISOString().slice(0, 10),
    };
  }

  async logFood(gymId: string, memberId: string, dto: LogFoodDto) {
    const foodItem = await this.prisma.foodItem.findFirst({
      where: { id: dto.food_item_id, OR: [{ gym_id: gymId }, { gym_id: null }] },
    });
    if (!foodItem) throw new NotFoundException('Alimento no encontrado');

    const factor = dto.quantity_g / 100;
    const entry = await this.prisma.foodDiaryEntry.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        plan_id: dto.plan_id,
        food_item_id: dto.food_item_id,
        date: new Date(dto.date),
        meal_type: dto.meal_type,
        quantity_g: dto.quantity_g,
        notes: dto.notes,
        kcal: foodItem.kcal_per_100g * factor,
        protein_g: foodItem.protein_per_100g * factor,
        carbs_g: foodItem.carbs_per_100g * factor,
        fat_g: foodItem.fat_per_100g * factor,
      },
      include: { food_item: { select: { id: true, name: true } } },
    });

    await this.checkRiskPatterns(gymId, memberId);
    return entry;
  }

  // ─── NUTRIENT TIMING (D-27) ─────────────────────────────────────────────────
  // Adaptado a la arquitectura real: WorkoutPlanDay.day_number es una posición
  // dentro de un split rotativo (no un día de la semana fijo tipo "Lunes"), así
  // que no existe un calendario semanal fijo para vincular. En su lugar,
  // ajustamos los macros de HOY según si el miembro ya entrenó hoy o no —
  // el mismo principio del documento de diseño (más carbos en día de entreno,
  // menos en descanso), aplicado de forma reactiva en vez de un JSON semanal fijo.
  async getTodayAdjustedMacros(gymId: string, memberId: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { gym_id: gymId, member_id: memberId, is_active: true },
    });
    if (!plan) return { has_plan: false as const };

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sessionsToday = await this.prisma.workoutSession.count({
      where: { gym_id: gymId, member_id: memberId, started_at: { gte: startOfDay } },
    });
    const isTrainingDay = sessionsToday > 0;

    const CARB_ADJUST_PCT = 0.12; // dentro del rango 10-15% del documento (Sección 4.2)
    const carbFactor = isTrainingDay ? 1 + CARB_ADJUST_PCT : 1 - CARB_ADJUST_PCT;
    const carbsG = Math.round(plan.carbs_g * carbFactor);
    // Compensar en grasas para mantener el total calórico ~igual (proteína constante)
    const carbDeltaKcal = (carbsG - plan.carbs_g) * 4;
    const fatG = Math.max(0, Math.round(plan.fat_g - carbDeltaKcal / 9));
    const kcal = plan.protein_g * 4 + carbsG * 4 + fatG * 9;

    return {
      has_plan: true as const,
      is_training_day: isTrainingDay,
      base: {
        kcal_target: plan.kcal_target,
        protein_g: plan.protein_g,
        carbs_g: plan.carbs_g,
        fat_g: plan.fat_g,
      },
      today: {
        kcal_target: Math.round(kcal),
        protein_g: plan.protein_g,
        carbs_g: carbsG,
        fat_g: fatG,
      },
    };
  }

  // ─── ANÁLISIS ADAPTATIVO IA: revisa progreso real vs plan y sugiere ajustes
  async adaptivePlanAnalysis(gymId: string, memberId: string) {
    // 1) plan activo
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { gym_id: gymId, member_id: memberId, is_active: true },
    });
    if (!plan) {
      return { success: false, error: 'No tienes un plan nutricional activo' };
    }

    // 2) Datos de las últimas 4 semanas
    const since28 = new Date();
    since28.setDate(since28.getDate() - 28);

    const [weights, sessions, diaryRange, member] = await Promise.all([
      this.prisma.healthDataEntry.findMany({
        where: { member_id: memberId, kind: 'WEIGHT', recorded_at: { gte: since28 } },
        orderBy: { recorded_at: 'asc' },
        select: { value: true, recorded_at: true },
      }),
      this.prisma.workoutSession.count({
        where: { member_id: memberId, gym_id: gymId, finished_at: { gte: since28, not: null } },
      }),
      this.getDiaryRange(gymId, memberId, 28),
      this.prisma.member.findFirst({
        where: { id: memberId },
        select: { first_name: true, birthdate: true, gender: true },
      }),
    ]);

    const weightChange =
      weights.length >= 2
        ? Number((Number(weights[weights.length - 1].value) - Number(weights[0].value)).toFixed(2))
        : null;
    const daysWithLogs = diaryRange.days_with_logs;
    const avgKcal = diaryRange.avg_kcal;
    const adherence = Math.round((daysWithLogs / 28) * 100);

    // 3) Prompt a Gemini
    const goalLabel: Record<string, string> = {
      WEIGHT_LOSS: 'pérdida de peso',
      MUSCLE_GAIN: 'ganancia muscular',
      MAINTENANCE: 'mantenimiento',
      PERFORMANCE: 'rendimiento deportivo',
    };
    const prompt = `Eres un nutricionista experto. Analiza el progreso REAL del miembro y sugiere ajustes específicos al plan.

DATOS DEL MIEMBRO:
- Nombre: ${member?.first_name ?? 'Miembro'}
- Género: ${member?.gender ?? 'no especificado'}
- Objetivo actual: ${goalLabel[plan.goal] ?? plan.goal}

PLAN ACTUAL:
- Meta calórica: ${plan.kcal_target} kcal/día
- Proteína: ${plan.protein_g}g
- Carbohidratos: ${plan.carbs_g}g
- Grasas: ${plan.fat_g}g

PROGRESO ÚLTIMAS 4 SEMANAS:
- Sesiones de entrenamiento completadas: ${sessions}
- Días con registro nutricional: ${daysWithLogs}/28 (adherencia ${adherence}%)
- Promedio calorías reales: ${avgKcal} kcal (vs meta ${plan.kcal_target})
- Cambio de peso: ${weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : 'sin datos suficientes'}

Responde EXCLUSIVAMENTE con JSON válido:
{
  "verdict": "on_track" | "needs_adjustment" | "needs_complete_review",
  "headline": "frase clara de 1 línea (max 80 char) sobre cómo va",
  "diagnosis": "análisis honesto de 2-3 frases del progreso vs plan",
  "adjustments": {
    "target_kcal_delta": -200 a +200 (delta sugerido, 0 si no cambiar),
    "target_protein_g_delta": -20 a +30,
    "rationale": "explicación de 1-2 frases del porqué del ajuste"
  },
  "recommendations": [
    "consejo accionable 1",
    "consejo accionable 2",
    "consejo accionable 3"
  ],
  "next_review_in_days": 14 a 28
}`;

    try {
      const raw = await this.gemini.generate(prompt);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);

      // Salvaguarda TCA (D-23): con alerta activa, nunca sugerir más déficit
      const riskAlertActive = await this.hasActiveRiskAlert(memberId);
      if (riskAlertActive && parsed?.adjustments) {
        if ((parsed.adjustments.target_kcal_delta ?? 0) < 0) {
          parsed.adjustments.target_kcal_delta = 0;
          parsed.adjustments.rationale =
            'Ajuste de calorías pausado: hay una alerta de seguimiento nutricional activa para este ' +
            'miembro, pendiente de revisión. No se sugieren reducciones adicionales hasta entonces.';
        }
      }

      return {
        success: true,
        plan_id: plan.id,
        current_targets: {
          kcal: plan.kcal_target,
          protein_g: plan.protein_g,
          carbs_g: plan.carbs_g,
          fat_g: plan.fat_g,
        },
        progress: {
          weight_change_kg: weightChange,
          sessions_28d: sessions,
          adherence_pct: adherence,
          avg_kcal: avgKcal,
        },
        analysis: parsed,
        risk_alert_active: riskAlertActive,
        generated_at: new Date().toISOString(),
      };
    } catch (err) {
      this.logger.error(`Adaptive analysis failed: ${(err as Error).message}`);
      return {
        success: false,
        error: 'No se pudo generar el análisis. Intenta de nuevo en unos minutos.',
      };
    }
  }

  async applyAdaptiveAdjustment(
    gymId: string,
    memberId: string,
    deltas: { target_kcal_delta?: number; target_protein_g_delta?: number },
  ) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { gym_id: gymId, member_id: memberId, is_active: true },
    });
    if (!plan) throw new NotFoundException('No tienes un plan activo');

    if ((deltas.target_kcal_delta ?? 0) < 0 && (await this.hasActiveRiskAlert(memberId))) {
      throw new ForbiddenException(
        'Hay una alerta de seguimiento nutricional activa para este miembro. No se pueden aplicar ' +
          'reducciones de calorías hasta que el nutricionista revise la alerta.',
      );
    }

    const newKcal = Math.max(800, plan.kcal_target + (deltas.target_kcal_delta ?? 0));
    const newProtein = Math.max(20, plan.protein_g + (deltas.target_protein_g_delta ?? 0));

    return this.prisma.nutritionPlan.update({
      where: { id: plan.id },
      data: { kcal_target: newKcal, protein_g: newProtein },
    });
  }

  // ─── BARCODE: lookup en local + fallback a OpenFoodFacts ──────────────────
  async findByBarcode(gymId: string, barcode: string) {
    const code = barcode.trim();
    if (!/^\d{6,20}$/.test(code)) {
      return { found: false, error: 'Código inválido (debe ser numérico de 6-20 dígitos)' };
    }

    // 1) buscar en BD local (global o del gym)
    const local = await this.prisma.foodItem.findFirst({
      where: { barcode: code, OR: [{ gym_id: gymId }, { gym_id: null }] },
    });
    if (local) {
      return { found: true, source: 'local', item: local };
    }

    // 2) fallback a OpenFoodFacts (API pública gratuita)
    try {
      const off = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`, {
        headers: { 'User-Agent': 'GymApp/1.0' },
      });
      if (!off.ok) {
        return { found: false, error: `OpenFoodFacts HTTP ${off.status}` };
      }
      const data = (await off.json()) as {
        status: number;
        product?: {
          product_name?: string;
          product_name_es?: string;
          brands?: string;
          nutriments?: {
            'energy-kcal_100g'?: number;
            proteins_100g?: number;
            carbohydrates_100g?: number;
            fat_100g?: number;
          };
        };
      };

      if (data.status !== 1 || !data.product) {
        return { found: false, error: 'Producto no encontrado en OpenFoodFacts' };
      }

      const p = data.product;
      const n = p.nutriments ?? {};
      const name = (p.product_name_es ?? p.product_name ?? 'Producto desconocido').slice(0, 200);
      const kcal = n['energy-kcal_100g'] ?? 0;

      if (kcal === 0) {
        return { found: false, error: 'Producto encontrado pero sin datos nutricionales' };
      }

      // Cachear en BD para próximas búsquedas (insertar como global)
      const created = await this.prisma.foodItem.create({
        data: {
          gym_id: null,
          name,
          brand: p.brands?.split(',')[0]?.trim().slice(0, 100) ?? null,
          barcode: code,
          kcal_per_100g: kcal,
          protein_per_100g: n.proteins_100g ?? 0,
          carbs_per_100g: n.carbohydrates_100g ?? 0,
          fat_per_100g: n.fat_100g ?? 0,
          is_verified: true,
          source: 'openfoodfacts',
        },
      });

      return { found: true, source: 'openfoodfacts', item: created };
    } catch (err) {
      this.logger.error(`Barcode lookup failed: ${(err as Error).message}`);
      return { found: false, error: 'Error consultando OpenFoodFacts' };
    }
  }

  // ─── TEXTO NL: parser de "comí 200g pollo" → log de comida ────────────────
  async logFromText(gymId: string, memberId: string, text: string) {
    if (!text?.trim()) return { success: false, error: 'Texto vacío' };

    const prompt = `Eres un asistente que interpreta lo que la persona dice que comió.
Mensaje del usuario: "${text.trim()}"

Identifica TODOS los alimentos mencionados con su cantidad estimada (en gramos) y tipo de comida.
Si el usuario no especifica gramos, estima una porción razonable promedio (ej: 1 huevo = 50g, 1 tortilla = 30g, 1 manzana = 180g, una taza de arroz = 200g, un pedazo de pollo = 150g).
Si no menciona el tipo de comida (desayuno/almuerzo/cena/snack), asume basado en hora actual (es ${new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit', hour12: false })}).

Responde EXCLUSIVAMENTE con JSON válido:
{
  "items": [
    { "name": "nombre del alimento", "grams": NN, "meal_type": "BREAKFAST"|"LUNCH"|"DINNER"|"SNACK" }
  ],
  "note": "comentario breve (max 100 char) si hay ambigüedad"
}

Si no puedes entender el mensaje, devuelve { "items": [], "note": "explicación" }.`;

    try {
      const raw = await this.gemini.generate(prompt);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as {
        items: Array<{
          name: string;
          grams: number;
          meal_type: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
        }>;
        note?: string;
      };

      if (!parsed.items?.length) {
        return {
          success: false,
          items: [],
          registered: [],
          note: parsed.note ?? 'No se identificaron alimentos',
        };
      }

      // Buscar food_items en BD y registrar lo que matchee
      const today = new Date().toISOString().slice(0, 10);
      const registered: Array<{ name: string; grams: number; kcal: number; matched: boolean }> = [];

      for (const item of parsed.items) {
        const food = await this.prisma.foodItem.findFirst({
          where: {
            OR: [{ gym_id: gymId }, { gym_id: null }],
            name: { contains: item.name, mode: 'insensitive' },
          },
          orderBy: { is_verified: 'desc' },
        });

        if (!food) {
          registered.push({ name: item.name, grams: item.grams, kcal: 0, matched: false });
          continue;
        }

        const factor = item.grams / 100;
        await this.prisma.foodDiaryEntry.create({
          data: {
            gym_id: gymId,
            member_id: memberId,
            food_item_id: food.id,
            date: new Date(today),
            meal_type: item.meal_type ?? 'LUNCH',
            quantity_g: item.grams,
            kcal: food.kcal_per_100g * factor,
            protein_g: food.protein_per_100g * factor,
            carbs_g: food.carbs_per_100g * factor,
            fat_g: food.fat_per_100g * factor,
            notes: `Vía texto: "${text.slice(0, 100)}"`,
          },
        });

        registered.push({
          name: food.name,
          grams: item.grams,
          kcal: Math.round(food.kcal_per_100g * factor),
          matched: true,
        });
      }

      if (registered.some((r) => r.matched)) {
        await this.checkRiskPatterns(gymId, memberId);
      }

      return {
        success: true,
        items: parsed.items,
        registered,
        note: parsed.note,
      };
    } catch (err) {
      this.logger.error(`Text log failed: ${(err as Error).message}`);
      return {
        success: false,
        items: [],
        registered: [],
        error: (err as Error).message.slice(0, 200),
      };
    }
  }

  // ─── IA VISION: Foto del plato → identificación ────────────────────────────
  async analyzeMealPhoto(imageDataUri: string) {
    // Parsear data URI
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/i.exec(imageDataUri.trim());
    if (!m) {
      throw new NotFoundException('Imagen inválida (usa data:image/jpeg;base64,...)');
    }
    const mimeType = m[1].toLowerCase();
    const base64 = m[2];

    const prompt = `Eres un nutricionista experto en analizar fotos de comida.
Mira esta foto y identifica los alimentos que ves. Para cada uno estima:
- nombre común (en español, ej "Pechuga de pollo a la plancha")
- porción en gramos (estimación visual)
- kcal aproximadas
- proteína (g), carbos (g), grasas (g)

Responde EXCLUSIVAMENTE con JSON válido en este formato exacto, sin texto extra:
{
  "items": [
    { "name": "...", "grams": NN, "kcal": NN, "protein_g": NN, "carbs_g": NN, "fat_g": NN }
  ],
  "totals": { "kcal": NN, "protein_g": NN, "carbs_g": NN, "fat_g": NN },
  "confidence": "low" | "medium" | "high",
  "note": "comentario breve sobre la foto (max 150 caracteres)"
}

Si no puedes identificar comida en la foto, devuelve { "items": [], "totals": { "kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0 }, "confidence":"low", "note":"..." }.`;

    try {
      const raw = await this.gemini.generateWithImage(base64, mimeType, prompt);
      // Limpiar markdown si Gemini lo agrega
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as {
        items: Array<{
          name: string;
          grams: number;
          kcal: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
        }>;
        totals: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
        confidence: 'low' | 'medium' | 'high';
        note: string;
      };
      return { success: true, ...parsed };
    } catch (err) {
      this.logger.error(`Photo analyze failed: ${(err as Error).message}`);
      return {
        success: false,
        items: [],
        totals: { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        confidence: 'low' as const,
        note: 'No se pudo analizar la foto. Intenta con mejor iluminación.',
        error: (err as Error).message.slice(0, 200),
      };
    }
  }

  // ─── IA: Generador de recetas ──────────────────────────────────────────────
  async generateRecipe(ingredients: string[], preferences?: string) {
    if (!ingredients?.length) {
      throw new NotFoundException('Proporciona al menos un ingrediente');
    }

    const prompt = `Eres un chef especializado en cocina LATAM saludable.
Genera UNA receta usando principalmente estos ingredientes: ${ingredients.join(', ')}.
${preferences ? `Preferencias del usuario: ${preferences}` : ''}

Responde EXCLUSIVAMENTE con JSON válido en este formato exacto:
{
  "title": "Nombre de la receta",
  "description": "1-2 frases sobre el plato",
  "servings": NN,
  "prep_time_min": NN,
  "cook_time_min": NN,
  "ingredients": [
    { "name": "...", "quantity": "200g" | "1 unidad" | "2 cucharadas", "notes": "opcional" }
  ],
  "steps": ["paso 1", "paso 2", "..."],
  "macros_per_serving": { "kcal": NN, "protein_g": NN, "carbs_g": NN, "fat_g": NN },
  "tips": ["tip 1", "tip 2"]
}`;

    try {
      const raw = await this.gemini.generate(prompt);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return { success: true, recipe: JSON.parse(cleaned) };
    } catch (err) {
      this.logger.error(`Recipe gen failed: ${(err as Error).message}`);
      return {
        success: false,
        recipe: null,
        error: (err as Error).message.slice(0, 200),
      };
    }
  }

  // ─── IA: Lista de compras semanal ──────────────────────────────────────────
  async generateShoppingList(gymId: string, memberId: string) {
    const plan = await this.prisma.nutritionPlan.findFirst({
      where: { gym_id: gymId, member_id: memberId, is_active: true },
    });

    const prompt = `Eres un nutricionista que arma listas de compras semanales para personas activas.
${
  plan
    ? `Plan del usuario: ${plan.name}, objetivo ${plan.goal}, target ${plan.kcal_target} kcal/día (P${plan.protein_g}g C${plan.carbs_g}g G${plan.fat_g}g).`
    : 'El usuario no tiene plan asignado. Asume objetivo balanceado de 2000 kcal/día.'
}
Foco: alimentos típicos de El Salvador / Centroamérica (frijoles, plátano, tortilla, pollo, etc.) + esenciales.

Genera una lista de compras para 1 semana de 1 persona. Categoriza por tipo de alimento.
Responde EXCLUSIVAMENTE con JSON válido:
{
  "estimated_cost_usd": NN,
  "categories": [
    {
      "name": "Proteínas",
      "items": [
        { "name": "Pechuga de pollo", "quantity": "1 kg", "purpose": "Almuerzos M-V" }
      ]
    },
    { "name": "Carbohidratos", "items": [...] },
    { "name": "Vegetales", "items": [...] },
    { "name": "Frutas", "items": [...] },
    { "name": "Lácteos", "items": [...] },
    { "name": "Otros", "items": [...] }
  ],
  "tips": ["consejo 1", "consejo 2"]
}`;

    try {
      const raw = await this.gemini.generate(prompt);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      return { success: true, ...JSON.parse(cleaned) };
    } catch (err) {
      this.logger.error(`Shopping list failed: ${(err as Error).message}`);
      return {
        success: false,
        categories: [],
        tips: [],
        error: (err as Error).message.slice(0, 200),
      };
    }
  }

  async deleteDiaryEntry(gymId: string, entryId: string) {
    const e = await this.prisma.foodDiaryEntry.findFirst({ where: { id: entryId, gym_id: gymId } });
    if (!e) throw new NotFoundException('Entrada no encontrada');
    return this.prisma.foodDiaryEntry.delete({ where: { id: entryId } });
  }

  // ─── SALVAGUARDAS TCA (D-23) ────────────────────────────────────────────────
  // Heurística v1, intencionalmente simple: dos señales del documento de diseño
  // (Sección 13.4) que se pueden calcular hoy con los datos que ya tenemos.
  // Nunca diagnostica — solo alerta internamente a staff y pausa sugerencias de
  // más déficit mientras la alerta siga sin revisar.

  private async checkRiskPatterns(gymId: string, memberId: string): Promise<void> {
    try {
      const range = await this.getDiaryRange(gymId, memberId, 7);
      if (range.days_with_logs === 0) return;

      const totalEntries = range.daily.reduce((acc, d) => acc + d.entries, 0);
      const avgEntriesPerLoggedDay = totalEntries / range.days_with_logs;

      if (range.avg_kcal > 0 && range.avg_kcal < 1200) {
        await this.raiseRiskAlert(gymId, memberId, 'restriccion_extrema', {
          avg_kcal: range.avg_kcal,
          days_with_logs: range.days_with_logs,
        });
      }

      if (avgEntriesPerLoggedDay >= 7) {
        await this.raiseRiskAlert(gymId, memberId, 'obsesion_registro', {
          avg_entries_per_day: Number(avgEntriesPerLoggedDay.toFixed(1)),
          days_with_logs: range.days_with_logs,
        });
      }
    } catch (err) {
      // Nunca debe romper el flujo de registro de comida por un error del chequeo de riesgo
      this.logger.error(`checkRiskPatterns failed: ${(err as Error).message}`);
    }
  }

  private async raiseRiskAlert(
    gymId: string,
    memberId: string,
    pattern: string,
    details: Record<string, unknown>,
  ): Promise<void> {
    const since7d = new Date();
    since7d.setDate(since7d.getDate() - 7);

    const existing = await this.prisma.nutritionRiskAlert.findFirst({
      where: {
        gym_id: gymId,
        member_id: memberId,
        pattern_detected: pattern,
        reviewed: false,
        created_at: { gte: since7d },
      },
    });
    if (existing) return; // ya hay una alerta activa del mismo patrón, no duplicar

    await this.prisma.nutritionRiskAlert.create({
      data: {
        gym_id: gymId,
        member_id: memberId,
        pattern_detected: pattern,
        detection_details: details as Prisma.InputJsonValue,
      },
    });
    this.logger.warn(`Alerta de riesgo nutricional creada: ${pattern} (member ${memberId})`);
  }

  private async hasActiveRiskAlert(memberId: string): Promise<boolean> {
    const count = await this.prisma.nutritionRiskAlert.count({
      where: { member_id: memberId, reviewed: false },
    });
    return count > 0;
  }

  async listRiskAlerts(gymId: string) {
    return this.prisma.nutritionRiskAlert.findMany({
      where: { gym_id: gymId, reviewed: false },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
      orderBy: { created_at: 'desc' },
    });
  }

  async reviewRiskAlert(gymId: string, alertId: string, dto: ReviewRiskAlertDto) {
    const alert = await this.prisma.nutritionRiskAlert.findFirst({
      where: { id: alertId, gym_id: gymId },
    });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    return this.prisma.nutritionRiskAlert.update({
      where: { id: alertId },
      data: {
        reviewed: true,
        reviewed_at: new Date(),
        resolution_notes: dto.resolution_notes,
      },
    });
  }

  // ─── STATS ────────────────────────────────────────────────────────────────────

  async getNutritionStats(gymId: string) {
    const [totalPlans, activePlans, totalEntriesToday] = await Promise.all([
      this.prisma.nutritionPlan.count({ where: { gym_id: gymId } }),
      this.prisma.nutritionPlan.count({ where: { gym_id: gymId, is_active: true } }),
      this.prisma.foodDiaryEntry.count({
        where: { gym_id: gymId, date: { gte: new Date(new Date().toDateString()) } },
      }),
    ]);
    return { totalPlans, activePlans, totalEntriesToday };
  }

  // ─── CO-PILOTO CONVERSACIONAL DEL NUTRICIONISTA (D-37) ─────────────────────
  // Análogo al Co-Piloto del Workout Builder: el nutricionista describe el plan
  // deseado en lenguaje natural, la IA propone macros + un día de ejemplo, y el
  // nutricionista itera por chat antes de usarlo para crear el plan real.
  async copilotChat(
    gymId: string,
    memberId: string,
    message: string,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  ) {
    const [member, profile, activePlan] = await Promise.all([
      this.prisma.member.findFirst({ where: { id: memberId, gym_id: gymId } }),
      this.prisma.memberNutritionProfile.findFirst({
        where: { gym_id: gymId, member_id: memberId },
      }),
      this.prisma.nutritionPlan.findFirst({
        where: { gym_id: gymId, member_id: memberId, is_active: true },
      }),
    ]);
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const profileContext = profile
      ? `
PERFIL NUTRICIONAL DEL MIEMBRO:
- Dieta base: ${profile.dieta_base}
- Alergias: ${profile.alergias.join(', ') || 'ninguna declarada'}
- Intolerancias: ${profile.intolerancias.join(', ') || 'ninguna'}
- Alimentos a evitar: ${profile.alimentos_evitar.join(', ') || 'ninguno'}
- Alimentos favoritos: ${profile.alimentos_favoritos.join(', ') || 'sin datos'}
- Presupuesto: ${profile.presupuesto}
- Tiempo disponible para cocinar: ${profile.tiempo_cocina ?? 'sin datos'}
- Condiciones médicas relevantes: ${profile.condiciones_medicas.join(', ') || 'ninguna'}`
      : '\nEl miembro aún no tiene perfil nutricional completo — pregunta por restricciones si no las mencionan.';

    const riskAlertActive = await this.hasActiveRiskAlert(memberId);
    const safetyNote = riskAlertActive
      ? '\n⚠️ Este miembro tiene una alerta de seguimiento nutricional activa — NO propongas un plan con déficit calórico ni restrictivo. Sugiere mantenimiento y deriva a revisión profesional presencial.'
      : profile?.antecedente_tca_declarado && !profile.tca_clinical_review_completed
        ? '\n⚠️ Este miembro declaró antecedente de TCA sin revisión clínica completada — NO propongas un plan de déficit calórico. Solo mantenimiento, y recomienda consulta presencial antes de cualquier plan de pérdida de peso.'
        : '';

    const systemPrompt = `Eres el Co-Piloto de Planes Nutricionales de GymApp, una herramienta para que el nutricionista humano (nunca el miembro directamente) construya planes rápido con ayuda de IA.

MIEMBRO: ${member.first_name} ${member.last_name}
${profileContext}
${activePlan ? `\nPLAN ACTUAL: ${activePlan.name} — ${activePlan.kcal_target} kcal (P${activePlan.protein_g}/C${activePlan.carbs_g}/G${activePlan.fat_g})` : '\nSin plan activo actualmente.'}
${safetyNote}

INSTRUCCIONES:
- Hablas con el NUTRICIONISTA, no con el miembro — puedes ser técnico.
- Cuando el nutricionista pida un plan, propone macros concretos Y un día de ejemplo con comidas típicas de El Salvador/LATAM, prácticas y accesibles.
- Respeta SIEMPRE las alergias, intolerancias y restricciones del perfil — nunca las ignores.
- Si el nutricionista pide ajustes ("cambia la cena", "más proteína"), ajusta manteniendo el resto.
- Nunca generes un plan con déficit calórico si hay una alerta de seguridad activa (ver arriba).

Responde EXCLUSIVAMENTE con JSON válido en este formato exacto:
{
  "message": "tu respuesta conversacional al nutricionista (explica lo que propones, máximo 4 líneas)",
  "plan_summary": { "goal": "WEIGHT_LOSS"|"MUSCLE_GAIN"|"MAINTENANCE"|"PERFORMANCE", "kcal_target": NN, "protein_g": NN, "carbs_g": NN, "fat_g": NN } | null,
  "sample_day": [
    { "meal_type": "BREAKFAST"|"LUNCH"|"DINNER"|"SNACK", "description": "...", "kcal": NN, "protein_g": NN, "carbs_g": NN, "fat_g": NN }
  ] | null
}

Usa "plan_summary": null y "sample_day": null SOLO si todavía estás haciendo preguntas de aclaración y aún no tienes suficiente información para proponer números.`;

    try {
      const raw = await this.gemini.chat(systemPrompt, message, history);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      return { success: true, ...parsed };
    } catch (err) {
      this.logger.error(`Copilot chat failed: ${(err as Error).message}`);
      return {
        success: false,
        message: 'El co-piloto no está disponible ahora. Intenta de nuevo en unos minutos.',
        plan_summary: null,
        sample_day: null,
      };
    }
  }

  // ─── IA: SUGERENCIA DE COMIDAS ────────────────────────────────────────────────

  async aiSuggest(gymId: string, planId?: string, memberId?: string, context?: string) {
    let planContext = '';
    let memberName = 'el miembro';
    let riskAlertActive = false;

    if (planId) {
      const plan = await this.prisma.nutritionPlan.findFirst({
        where: { id: planId, gym_id: gymId },
        include: { member: { select: { first_name: true, last_name: true } } },
      });
      if (plan) {
        riskAlertActive = await this.hasActiveRiskAlert(plan.member_id);
        memberName = `${plan.member.first_name} ${plan.member.last_name}`;
        planContext = `
PLAN ACTIVO:
- Nombre: ${plan.name}
- Objetivo: ${plan.goal}
- Kcal objetivo: ${plan.kcal_target} kcal/día
- Proteína: ${plan.protein_g}g | Carbohidratos: ${plan.carbs_g}g | Grasas: ${plan.fat_g}g`;

        const today = new Date().toISOString().split('T')[0];
        const diary = await this.getDiary(gymId, plan.member_id, today);
        if (diary.entries.length > 0) {
          planContext += `
CONSUMIDO HOY (${today}):
- Kcal: ${diary.totals.kcal.toFixed(0)} / ${plan.kcal_target}
- Proteína: ${diary.totals.protein_g.toFixed(1)}g / ${plan.protein_g}g
- Carbohidratos: ${diary.totals.carbs_g.toFixed(1)}g / ${plan.carbs_g}g
- Grasas: ${diary.totals.fat_g.toFixed(1)}g / ${plan.fat_g}g
Alimentos registrados hoy: ${diary.entries.map((e) => e.food_item.name).join(', ')}`;
        }
      }
    }

    const safetyInstruction = riskAlertActive
      ? `
⚠️ ALERTA DE SEGUIMIENTO ACTIVA para este miembro (patrón de riesgo alimentario detectado,
pendiente de revisión por el nutricionista humano). NO sugieras reducir calorías, saltarse
comidas, ni ningún enfoque restrictivo. Enfócate en bienestar general, variedad y comidas
completas. Si el miembro pregunta por reducir más su ingesta, indícale amablemente que hable
primero con su nutricionista.`
      : '';

    const systemPrompt = `Eres un nutricionista deportivo experto especializado en nutrición para atletas de gimnasio en Latinoamérica.
Eres parte de GymApp, una plataforma de gestión de gimnasios.
${planContext}
${safetyInstruction}

INSTRUCCIONES:
- Responde SIEMPRE en español
- Sugiere comidas específicas, prácticas y asequibles en El Salvador / LATAM
- Incluye cantidades aproximadas en gramos y calorías estimadas
- Considera el objetivo del plan (pérdida de peso, ganancia muscular, etc.)
- Si hay consumo registrado hoy, sugiere para completar los macros restantes
- Organiza por tiempo de comida (desayuno, almuerzo, cena, snack)
- Máximo 3 sugerencias concretas, con lista de ingredientes simple
- Añade un tip nutricional corto al final`;

    const userMessage =
      context ??
      `Dame sugerencias de comidas para ${memberName} para cumplir los objetivos del plan de hoy.`;

    try {
      const response = await this.gemini.chat(systemPrompt, userMessage);
      return { response, isStub: false };
    } catch (err) {
      this.logger.error(`Nutrition AI error: ${(err as Error).message}`);
      return {
        response:
          'El servicio de IA no está disponible ahora. Consulta manualmente con el nutricionista.',
        isStub: false,
        error: true,
      };
    }
  }

  // ─── ANÁLISIS DE LABORATORIO (D-29) ─────────────────────────────────────────
  // La IA solo EXTRAE y señala valores fuera de rango — nunca diagnostica ni
  // interpreta clínicamente. reviewed_by_nutritionist queda en false hasta que
  // un nutricionista lo revise; hoy no hay ningún endpoint member-facing en
  // este módulo, así que el miembro no ve nada de esto en ninguna circunstancia
  // todavía — el gate importa quando se agregue una vista propia (mobile).

  async uploadLabResult(gymId: string, staffId: string | undefined, dto: UploadLabResultDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gym_id: gymId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    const { path } = await this.storage.uploadDocument(
      'lab-results',
      `${gymId}/${dto.memberId}`,
      dto.document,
    );

    const m = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,(.+)$/i.exec(
      dto.document.trim(),
    );
    const mimeType = m?.[1].toLowerCase() ?? 'image/jpeg';
    const base64 = m?.[2] ?? '';

    const prompt = `Eres un asistente que EXTRAE valores de un examen de laboratorio a partir de una foto o PDF.
NUNCA diagnostiques ni interpretes clínicamente el resultado — solo extrae los marcadores visibles y
señala si están fuera del rango de referencia QUE APARECE IMPRESO EN EL DOCUMENTO (no un rango genérico
que tú conozcas). Si el documento no trae rango de referencia para un marcador, no marques out_of_range.

Responde EXCLUSIVAMENTE con JSON válido:
{
  "markers": [
    { "name": "Glucosa en ayunas", "value": "88", "unit": "mg/dL", "reference_range": "70-100", "out_of_range": false }
  ],
  "note": "comentario breve (max 150 caracteres) sobre la calidad/legibilidad de la foto"
}
Si no puedes leer el documento, devuelve { "markers": [], "note": "explicación" }.`;

    let markers: unknown[] = [];
    let note = '';
    try {
      const raw = await this.gemini.generateWithImage(base64, mimeType, prompt);
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as { markers: unknown[]; note?: string };
      markers = parsed.markers ?? [];
      note = parsed.note ?? '';
    } catch (err) {
      this.logger.error(`Lab result extraction failed: ${(err as Error).message}`);
      note =
        'No se pudo extraer automáticamente. El nutricionista puede leer el documento directamente.';
    }

    const created = await this.prisma.labResult.create({
      data: {
        gym_id: gymId,
        member_id: dto.memberId,
        uploaded_by: staffId,
        document_path: path,
        lab_date: dto.lab_date ? new Date(dto.lab_date) : undefined,
        extracted_markers: markers as Prisma.InputJsonValue,
        ai_note: note,
      },
    });
    return this.withDocumentUrl(created);
  }

  // Bucket 'lab-results' es privado (datos médicos) — la URL de lectura se
  // genera on-demand, firmada y con expiración, nunca se guarda permanente.
  private async withDocumentUrl<T extends { document_path: string }>(r: T) {
    const { document_path, ...rest } = r;
    const document_url = await this.storage.getSignedUrl('lab-results', document_path, 3600);
    return { ...rest, document_url };
  }

  async listLabResults(gymId: string, memberId: string) {
    const results = await this.prisma.labResult.findMany({
      where: { gym_id: gymId, member_id: memberId },
      orderBy: { created_at: 'desc' },
    });
    return Promise.all(results.map((r) => this.withDocumentUrl(r)));
  }

  async getLabResult(gymId: string, id: string) {
    const result = await this.prisma.labResult.findFirst({ where: { id, gym_id: gymId } });
    if (!result) throw new NotFoundException('Examen de laboratorio no encontrado');
    return this.withDocumentUrl(result);
  }

  async reviewLabResult(
    gymId: string,
    id: string,
    staffId: string | undefined,
    dto: ReviewLabResultDto,
  ) {
    await this.getLabResult(gymId, id);
    return this.prisma.labResult.update({
      where: { id },
      data: {
        reviewed_by_nutritionist: true,
        reviewed_by: staffId,
        reviewed_at: new Date(),
        nutritionist_notes: dto.nutritionist_notes,
        plan_adjusted_as_result: dto.plan_adjusted_as_result ?? false,
      },
    });
  }
}
