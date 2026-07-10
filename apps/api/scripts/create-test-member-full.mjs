#!/usr/bin/env node
/**
 * Crea un miembro de prueba nuevo (no toca miembros reales) con:
 *   - Membresía activa (Mensual Pro)
 *   - Plan de entrenamiento completo, priorizando ejercicios que SÍ tienen
 *     video técnico ya rehospedado en Supabase Storage (no links rotos de wger.de)
 *   - Perfil nutricional completo
 *   - Plan de nutrición activo
 *
 * El onboarding se deja SIN completar a propósito, para poder probar el
 * flujo de onboarding nuevo al iniciar sesión con esta cuenta por primera vez.
 *
 * Uso:
 *   node scripts/create-test-member-full.mjs
 *
 * Requisitos: DATABASE_URL en env (export desde apps/api/.env antes de correr).
 * Es re-ejecutable: si el usuario/miembro de prueba ya existe, lo reutiliza
 * (upsert) en vez de duplicar.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_EMAIL = 'miembro.prueba@gymapp.app';
const TEST_PASSWORD = 'Prueba2026!';

async function main() {
  const gym = await prisma.gym.findFirst({ where: { slug: 'gymapp-demo' } });
  if (!gym) throw new Error('No se encontró el gym "gymapp-demo" — corre el seed primero.');

  console.log(`Gym: ${gym.name} (${gym.id})`);

  // ── 1. Usuario + Miembro ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: {
      email: TEST_EMAIL,
      password_hash: passwordHash,
      role: 'MEMBER',
      is_active: true,
      email_verified: true,
    },
  });

  const member = await prisma.member.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      gym_id: gym.id,
      user_id: user.id,
      first_name: 'Miembro',
      last_name: 'Prueba',
      phone: '+503 7000-1234',
      birthdate: new Date('1996-05-14'),
      gender: 'M',
      status: 'ACTIVE',
      risk_score: 10,
      loyalty_level: 'bronze',
      source: 'test-script',
    },
  });
  console.log(`Miembro: ${member.first_name} ${member.last_name} (${member.id})`);

  // ── 2. Membresía activa ────────────────────────────────────────────────
  const membershipType = await prisma.membershipType.findFirst({
    where: { gym_id: gym.id, name: 'Mensual Gimnasio' },
  });
  if (!membershipType) throw new Error('No se encontró el tipo de membresía "Mensual Gimnasio".');

  const existingMembership = await prisma.membership.findFirst({
    where: { member_id: member.id, status: 'ACTIVE' },
  });
  if (!existingMembership) {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 86_400_000);
    await prisma.membership.create({
      data: {
        gym_id: gym.id,
        member_id: member.id,
        type_id: membershipType.id,
        status: 'ACTIVE',
        start_date: start,
        end_date: end,
        price_paid: membershipType.price,
        currency: 'USD',
      },
    });
    console.log(`Membresía activa creada (${membershipType.name}, 30 días).`);
  } else {
    console.log('Ya tenía una membresía activa, se reutiliza.');
  }

  // ── 3. Ejercicios con video real (rehospedado, no wger.de) ────────────
  const exercisesWithVideo = await prisma.exercise.findMany({
    where: { gym_id: null, video_url: { not: null } },
    select: { id: true, name: true, video_url: true, muscle_groups: true },
  });
  const realVideoExercises = exercisesWithVideo.filter(
    (e) => e.video_url && !e.video_url.includes('wger.de'),
  );
  console.log(
    `Ejercicios con video ya rehospedado (usable): ${realVideoExercises.length} de ${exercisesWithVideo.length} con video_url.`,
  );

  // Completa con ejercicios sin video si hace falta para armar una rutina completa
  const NEEDED = 12; // ~6 por día, 2 días
  let poolExercises = [...realVideoExercises];
  if (poolExercises.length < NEEDED) {
    const fillers = await prisma.exercise.findMany({
      where: { gym_id: null, id: { notIn: poolExercises.map((e) => e.id) } },
      select: { id: true, name: true, muscle_groups: true },
      take: NEEDED - poolExercises.length,
    });
    poolExercises = [...poolExercises, ...fillers];
  }
  if (poolExercises.length === 0) {
    throw new Error('No hay ejercicios en el catálogo — corre import-exercises.mjs primero.');
  }

  const half = Math.ceil(poolExercises.length / 2);
  const dayAExercises = poolExercises.slice(0, half);
  const dayBExercises = poolExercises.slice(half);

  // ── 4. Plan de entrenamiento ────────────────────────────────────────────
  const existingPlan = await prisma.workoutPlan.findFirst({
    where: { gym_id: gym.id, name: 'Plan de Prueba — Full Body' },
  });
  let planId = existingPlan?.id;
  if (!existingPlan) {
    const plan = await prisma.$transaction(async (tx) => {
      const created = await tx.workoutPlan.create({
        data: {
          gym_id: gym.id,
          name: 'Plan de Prueba — Full Body',
          description: 'Plan generado para probar la app — prioriza ejercicios con video técnico.',
          goal: 'MUSCLE_GAIN',
          difficulty: 'INTERMEDIATE',
          days_per_week: 2,
          is_template: false,
        },
      });

      for (const [dayIndex, dayExercises] of [dayAExercises, dayBExercises].entries()) {
        if (dayExercises.length === 0) continue;
        const day = await tx.workoutPlanDay.create({
          data: {
            plan_id: created.id,
            day_number: dayIndex + 1,
            name: dayIndex === 0 ? 'Día A — Tren superior' : 'Día B — Tren inferior',
          },
        });
        await tx.workoutBlock.createMany({
          data: dayExercises.map((ex, i) => ({
            day_id: day.id,
            exercise_id: ex.id,
            block_type: 'STANDARD',
            order: i + 1,
            sets: 3,
            reps_min: 8,
            reps_max: 12,
            rest_seconds: 90,
          })),
        });
      }
      return created;
    });
    planId = plan.id;
    console.log(
      `Plan de entrenamiento creado: "${plan.name}" — ${dayAExercises.length + dayBExercises.length} ejercicios en 2 días (${realVideoExercises.length} con video real).`,
    );
  } else {
    console.log('El plan de entrenamiento de prueba ya existía, se reutiliza.');
  }

  const existingMemberPlan = await prisma.memberPlan.findFirst({
    where: { member_id: member.id, plan_id: planId, is_active: true },
  });
  if (!existingMemberPlan) {
    await prisma.memberPlan.create({
      data: { gym_id: gym.id, member_id: member.id, plan_id: planId, is_active: true },
    });
    console.log('Plan asignado al miembro de prueba.');
  }

  // ── 5. Perfil nutricional ───────────────────────────────────────────────
  await prisma.memberNutritionProfile.upsert({
    where: { member_id: member.id },
    update: {},
    create: {
      gym_id: gym.id,
      member_id: member.id,
      dieta_base: 'omnivoro',
      alergias: ['maní'],
      intolerancias: ['lactosa'],
      alimentos_evitar: ['mariscos'],
      alimentos_favoritos: ['pollo', 'arroz', 'avena', 'huevo'],
      presupuesto: 'medio',
      tiempo_cocina: '15_30_min',
      height_cm: 175,
      activity_level: 'activo',
      condiciones_medicas: [],
    },
  });
  console.log('Perfil nutricional completo creado.');

  // ── 6. Plan de nutrición ────────────────────────────────────────────────
  const existingNutritionPlan = await prisma.nutritionPlan.findFirst({
    where: { gym_id: gym.id, member_id: member.id, is_active: true },
  });
  if (!existingNutritionPlan) {
    await prisma.nutritionPlan.create({
      data: {
        gym_id: gym.id,
        member_id: member.id,
        name: 'Plan de Prueba — Superávit controlado',
        goal: 'MUSCLE_GAIN',
        kcal_target: 2800,
        protein_g: 180,
        carbs_g: 320,
        fat_g: 80,
        notes: 'Plan generado para probar la app.',
        tmb_kcal: 1750,
        tmb_formula_used: 'mifflin_st_jeor',
        tdee_kcal: 2435,
        factor_actividad: 1.55,
      },
    });
    console.log('Plan de nutrición creado (2800 kcal, P180/C320/G80).');
  } else {
    console.log('Ya tenía un plan de nutrición activo, se reutiliza.');
  }

  // ── 7. Datos de salud de ejemplo ────────────────────────────────────────
  const hasWeightEntry = await prisma.healthDataEntry.findFirst({
    where: { member_id: member.id, kind: 'WEIGHT' },
  });
  if (!hasWeightEntry) {
    await prisma.healthDataEntry.create({
      data: {
        member_id: member.id,
        kind: 'WEIGHT',
        value: 78.5,
        unit: 'kg',
        recorded_at: new Date(),
        source: 'test-script',
      },
    });
    console.log('Registro de peso inicial creado (78.5 kg).');
  }

  console.log('\n✅ Listo. Credenciales para iniciar sesión en la app móvil:');
  console.log(`   Email:    ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log('\nEl onboarding queda SIN completar a propósito, para que puedas probar');
  console.log('el flujo nuevo (PAR-Q, objetivo, preferencias, foto, contrato) al entrar.');
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
