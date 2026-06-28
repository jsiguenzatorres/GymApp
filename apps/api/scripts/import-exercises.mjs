#!/usr/bin/env node
/**
 * Importa biblioteca masiva de ejercicios desde 2 fuentes gratuitas:
 *   - Capa 1: free-exercise-db (UNLICENSE, ~870 ejercicios)
 *   - Capa 2: wger.de API (CC-BY-SA, ~845 ejercicios, soporta español)
 *
 * Uso:
 *   node scripts/import-exercises.mjs                     # Ambas fuentes, prod
 *   node scripts/import-exercises.mjs --source=free       # Solo capa 1
 *   node scripts/import-exercises.mjs --source=wger       # Solo capa 2
 *   node scripts/import-exercises.mjs --dry-run           # No escribe a la BD
 *   node scripts/import-exercises.mjs --gym-id=<uuid>     # Asocia a un gym
 *
 * Por defecto inserta como ejercicios globales (gym_id = null).
 * Requiere DATABASE_URL en env (lee el .env del workspace api automáticamente).
 *
 * Referencia: docs/Diseño/Ver2/Investigacion_Fuentes_Biblioteca_Ejercicios.md
 */

import { PrismaClient } from '@prisma/client';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const SOURCE = args.source ?? 'both';
const DRY_RUN = args['dry-run'] === true || args['dry-run'] === 'true';
const GYM_ID = args['gym-id'] ?? null;

const FREE_EXERCISE_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const WGER_BASE = 'https://wger.de/api/v2';

const prisma = new PrismaClient();

// ─── Vocabularios ────────────────────────────────────────────────────────────
const FREE_MUSCLE_MAP = {
  abdominals: 'ABS',
  abs: 'ABS',
  abductors: 'ABDUCTORS',
  adductors: 'ADDUCTORS',
  biceps: 'BICEPS',
  calves: 'CALVES',
  chest: 'CHEST',
  forearms: 'FOREARMS',
  glutes: 'GLUTES',
  hamstrings: 'HAMSTRINGS',
  lats: 'BACK',
  'lower back': 'BACK',
  'middle back': 'BACK',
  back: 'BACK',
  neck: 'NECK',
  quadriceps: 'QUADS',
  quads: 'QUADS',
  shoulders: 'SHOULDERS',
  traps: 'TRAPS',
  triceps: 'TRICEPS',
};

const FREE_EQUIP_MAP = {
  'body only': 'BODYWEIGHT',
  bodyweight: 'BODYWEIGHT',
  barbell: 'BARBELL',
  dumbbell: 'DUMBBELL',
  machine: 'MACHINE',
  cable: 'CABLE',
  kettlebells: 'KETTLEBELL',
  kettlebell: 'KETTLEBELL',
  bands: 'BANDS',
  'medicine ball': 'MEDICINE_BALL',
  'exercise ball': 'EXERCISE_BALL',
  'e-z curl bar': 'EZ_BAR',
  'foam roll': 'FOAM_ROLLER',
  other: 'OTHER',
};

const FREE_CATEGORY_MAP = {
  strength: 'STRENGTH',
  cardio: 'CARDIO',
  stretching: 'FLEXIBILITY',
  plyometrics: 'PLYOMETRICS',
  powerlifting: 'STRENGTH',
  strongman: 'STRENGTH',
  olympic_weightlifting: 'OLYMPIC',
};

const FREE_DIFF_MAP = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  expert: 'ADVANCED',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeName(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function mapMuscle(raw) {
  if (!raw) return null;
  return FREE_MUSCLE_MAP[String(raw).toLowerCase().trim()] ?? null;
}

function mapEquipment(raw) {
  if (!raw) return [];
  const key = String(raw).toLowerCase().trim();
  const v = FREE_EQUIP_MAP[key];
  return v ? [v] : [];
}

async function jsonFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  return res.json();
}

// ─── CAPA 1: free-exercise-db ────────────────────────────────────────────────
async function fetchFreeExerciseDb() {
  console.log('📥 Descargando free-exercise-db…');
  const raw = await jsonFetch(FREE_EXERCISE_DB_URL);
  console.log(`   → ${raw.length} ejercicios crudos`);

  return raw
    .map((e) => {
      const muscles = (e.primaryMuscles ?? []).map(mapMuscle).filter(Boolean);
      const secondary = (e.secondaryMuscles ?? []).map(mapMuscle).filter(Boolean);
      if (muscles.length === 0) return null; // descartar sin músculo primario
      return {
        source: 'free-exercise-db',
        external_id: e.id,
        name: e.name,
        description: null,
        muscle_groups: muscles,
        secondary_muscles: secondary,
        equipment: mapEquipment(e.equipment),
        category: FREE_CATEGORY_MAP[e.category] ?? 'STRENGTH',
        difficulty: FREE_DIFF_MAP[e.level] ?? 'INTERMEDIATE',
        instructions: (e.instructions ?? []).join('\n\n') || null,
      };
    })
    .filter(Boolean);
}

// ─── CAPA 2: wger.de API ─────────────────────────────────────────────────────
// wger expone /api/v2/exerciseinfo?language=2 (inglés) o ?language=4 (español).
// Devuelve ejercicios con traducciones embebidas, músculos y equipamiento.
async function fetchWger() {
  console.log('📥 Descargando wger.de (con preferencia de español)…');

  // 1) descargar catálogos de músculos y equipamiento para mapear ids
  const [muscles, equipment] = await Promise.all([
    jsonFetch(`${WGER_BASE}/muscle/?limit=200`),
    jsonFetch(`${WGER_BASE}/equipment/?limit=200`),
  ]);

  // Mapeo nombres wger → códigos nuestros (best-effort)
  const wgerMuscleMap = {
    'Biceps brachii': 'BICEPS',
    'Triceps brachii': 'TRICEPS',
    Brachialis: 'BICEPS',
    'Pectoralis major': 'CHEST',
    'Latissimus dorsi': 'BACK',
    Trapezius: 'TRAPS',
    'Anterior deltoid': 'SHOULDERS',
    'Deltoid posterior': 'SHOULDERS',
    'Quadriceps femoris': 'QUADS',
    'Biceps femoris': 'HAMSTRINGS',
    'Gluteus maximus': 'GLUTES',
    Gastrocnemius: 'CALVES',
    Soleus: 'CALVES',
    'Rectus abdominis': 'ABS',
    'Obliquus externus abdominis': 'ABS',
    'Serratus anterior': 'CHEST',
  };

  const wgerEquipMap = {
    Barbell: 'BARBELL',
    'SZ-Bar': 'EZ_BAR',
    Dumbbell: 'DUMBBELL',
    'Gym mat': 'BODYWEIGHT',
    'Swiss Ball': 'EXERCISE_BALL',
    'Pull-up bar': 'PULLUP_BAR',
    'none (bodyweight exercise)': 'BODYWEIGHT',
    Bench: 'BENCH',
    'Incline bench': 'BENCH',
    'Kettlebell': 'KETTLEBELL',
  };

  const muscleIdToCode = Object.fromEntries(
    muscles.results.map((m) => [m.id, wgerMuscleMap[m.name] ?? null]),
  );
  const equipIdToCode = Object.fromEntries(
    equipment.results.map((eq) => [eq.id, wgerEquipMap[eq.name] ?? 'MACHINE']),
  );

  // 2) paginar exerciseinfo (max ~1000 ejercicios entre todos los idiomas)
  const results = [];
  let next = `${WGER_BASE}/exerciseinfo/?limit=200&language=2`; // inglés base
  let page = 0;
  while (next && page < 10) {
    const data = await jsonFetch(next);
    results.push(...(data.results ?? []));
    next = data.next;
    page++;
    process.stdout.write(`   página ${page}: ${results.length} acumulados\r`);
  }
  console.log(`\n   → ${results.length} ejercicios crudos`);

  // 3) construir registros: preferir traducción ES si existe
  return results
    .map((ex) => {
      const translations = ex.translations ?? [];
      const es = translations.find((t) => t.language === 4);
      const en = translations.find((t) => t.language === 2) ?? translations[0];
      const t = es ?? en;
      if (!t?.name) return null;

      const muscles = (ex.muscles ?? [])
        .map((m) => muscleIdToCode[m.id])
        .filter(Boolean);
      if (muscles.length === 0) return null;
      const secondary = (ex.muscles_secondary ?? [])
        .map((m) => muscleIdToCode[m.id])
        .filter(Boolean);
      const equip = (ex.equipment ?? [])
        .map((eq) => equipIdToCode[eq.id])
        .filter(Boolean);

      // strip HTML tags from description
      const cleanDesc = t.description
        ? t.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : null;

      return {
        source: 'wger',
        external_id: String(ex.id),
        name: t.name.trim(),
        description: cleanDesc,
        muscle_groups: [...new Set(muscles)],
        secondary_muscles: [...new Set(secondary)],
        equipment: equip.length ? [...new Set(equip)] : ['BODYWEIGHT'],
        category: 'STRENGTH', // wger no expone difficulty/category compatibles
        difficulty: 'INTERMEDIATE',
        instructions: cleanDesc,
      };
    })
    .filter(Boolean);
}

// ─── Dedup + Insert ──────────────────────────────────────────────────────────
function dedup(records) {
  const seen = new Map();
  for (const r of records) {
    const key = normalizeName(r.name);
    if (!seen.has(key)) {
      seen.set(key, r);
    } else {
      // prefiere registro con más datos (más músculos + tiene descripción)
      const prev = seen.get(key);
      const score = (x) =>
        (x.muscle_groups?.length ?? 0) +
        (x.secondary_muscles?.length ?? 0) +
        (x.description ? 2 : 0);
      if (score(r) > score(prev)) seen.set(key, r);
    }
  }
  return [...seen.values()];
}

async function insertBatch(records) {
  // Filtra los que ya existen por nombre normalizado (global o del gym)
  const existing = await prisma.exercise.findMany({
    where: GYM_ID ? { gym_id: GYM_ID } : { gym_id: null },
    select: { name: true },
  });
  const existingKeys = new Set(existing.map((e) => normalizeName(e.name)));
  const toInsert = records.filter((r) => !existingKeys.has(normalizeName(r.name)));

  console.log(
    `\n📊 ${records.length} candidatos · ${records.length - toInsert.length} ya existen · ${toInsert.length} a insertar`,
  );

  if (DRY_RUN) {
    console.log('🟡 DRY RUN — no se inserta nada. Muestra de 3:');
    toInsert.slice(0, 3).forEach((r) => console.log('  ·', r.name, '→', r.muscle_groups.join(',')));
    return { inserted: 0, skipped: records.length - toInsert.length };
  }

  // truncar nombres a 200 chars del schema
  const data = toInsert.map((r) => ({
    gym_id: GYM_ID,
    name: r.name.slice(0, 200),
    description: r.description,
    muscle_groups: r.muscle_groups,
    secondary_muscles: r.secondary_muscles,
    equipment: r.equipment,
    category: r.category,
    difficulty: r.difficulty,
    instructions: r.instructions,
  }));

  // Prisma createMany skip duplicates por nombre (insertar en lotes de 500)
  let inserted = 0;
  for (let i = 0; i < data.length; i += 500) {
    const chunk = data.slice(i, i + 500);
    const res = await prisma.exercise.createMany({ data: chunk, skipDuplicates: true });
    inserted += res.count;
    process.stdout.write(`   insertados ${inserted}/${data.length}\r`);
  }
  console.log('');

  return { inserted, skipped: records.length - toInsert.length };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏋️  Importador de biblioteca de ejercicios');
  console.log(`   source=${SOURCE} · gym_id=${GYM_ID ?? 'NULL (global)'} · dry_run=${DRY_RUN}`);
  console.log('');

  const batches = [];
  if (SOURCE === 'both' || SOURCE === 'free') {
    batches.push(...(await fetchFreeExerciseDb()));
  }
  if (SOURCE === 'both' || SOURCE === 'wger') {
    try {
      batches.push(...(await fetchWger()));
    } catch (err) {
      console.warn(`⚠️  wger falló: ${err.message}. Continuando con lo demás.`);
    }
  }

  const deduped = dedup(batches);
  console.log(`\n🧹 Dedup: ${batches.length} → ${deduped.length}`);

  const result = await insertBatch(deduped);
  console.log(`\n✅ Listo. Insertados: ${result.inserted} · Ya existían: ${result.skipped}`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
