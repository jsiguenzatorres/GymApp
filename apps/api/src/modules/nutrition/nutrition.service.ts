import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { CreatePlanDto, CreateFoodItemDto, LogFoodDto } from './dto/nutrition.dto';

@Injectable()
export class NutritionService {
  private readonly logger = new Logger(NutritionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
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
    await this.getPlan(gymId, id);
    return this.prisma.nutritionPlan.update({
      where: { id },
      data: dto,
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
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
    return this.prisma.foodDiaryEntry.create({
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

  // ─── IA: SUGERENCIA DE COMIDAS ────────────────────────────────────────────────

  async aiSuggest(gymId: string, planId?: string, memberId?: string, context?: string) {
    let planContext = '';
    let memberName = 'el miembro';

    if (planId) {
      const plan = await this.prisma.nutritionPlan.findFirst({
        where: { id: planId, gym_id: gymId },
        include: { member: { select: { first_name: true, last_name: true } } },
      });
      if (plan) {
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

    const systemPrompt = `Eres un nutricionista deportivo experto especializado en nutrición para atletas de gimnasio en Latinoamérica.
Eres parte de GymApp, una plataforma de gestión de gimnasios.
${planContext}

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
}
