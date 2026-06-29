#!/usr/bin/env node
/**
 * Pobla la tabla food_items con alimentos LATAM (foco El Salvador/CA) +
 * alimentos internacionales comunes.
 *
 * Macros por 100g aproximadas (fuente: USDA + tablas locales).
 *
 * Uso:
 *   pnpm --filter api exec node scripts/seed-food-items.mjs
 *   pnpm --filter api exec node scripts/seed-food-items.mjs --dry-run
 *
 * Idempotente: si un alimento con el mismo (nombre + brand) ya existe global,
 * lo salta. Inserta como ejercicios globales (gym_id=null) — visibles a todos.
 */

import { PrismaClient } from '@prisma/client';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);

const DRY_RUN = args['dry-run'] === true || args['dry-run'] === 'true';
const prisma = new PrismaClient();

// name, kcal, protein_g, carbs_g, fat_g (por 100g)
const FOODS = [
  // ─── PROTEÍNAS ANIMALES ────────────────────────────────────────────────────
  ['Pollo pechuga sin piel (cocido)', 165, 31, 0, 3.6],
  ['Pollo muslo sin piel (cocido)', 209, 26, 0, 11],
  ['Pollo entero asado', 239, 27, 0, 14],
  ['Res — bistec magro (cocido)', 250, 26, 0, 15],
  ['Res — molida 90/10 (cocida)', 217, 26, 0, 12],
  ['Res — molida 80/20 (cocida)', 254, 25, 0, 17],
  ['Res — lomito (cocido)', 271, 26, 0, 18],
  ['Cerdo — chuleta magra (cocida)', 196, 28, 0, 9],
  ['Cerdo — lomo (cocido)', 173, 26, 0, 7],
  ['Tocino frito', 541, 37, 1.4, 42],
  ['Pescado tilapia (cocido)', 128, 26, 0, 2.7],
  ['Pescado salmón (cocido)', 208, 22, 0, 13],
  ['Atún en agua (lata)', 116, 26, 0, 1],
  ['Atún en aceite (lata)', 200, 29, 0, 8],
  ['Camarones cocidos', 99, 24, 0.2, 0.3],
  ['Huevo entero (1 unidad ~50g)', 155, 13, 1.1, 11],
  ['Clara de huevo (cocida)', 52, 11, 0.7, 0.2],
  ['Yema de huevo', 322, 16, 3.6, 27],

  // ─── LÁCTEOS ───────────────────────────────────────────────────────────────
  ['Leche entera', 61, 3.2, 4.8, 3.3],
  ['Leche descremada', 35, 3.4, 5, 0.1],
  ['Leche deslactosada', 47, 3.3, 4.7, 1.8],
  ['Yogurt natural', 59, 10, 3.6, 0.4],
  ['Yogurt griego natural', 97, 9, 4, 5],
  ['Yogurt griego descremado', 59, 10, 3.6, 0.4],
  ['Queso fresco salvadoreño', 264, 18, 3, 20],
  ['Quesillo', 280, 22, 2, 21],
  ['Queso duro blando', 305, 22, 3, 23],
  ['Queso mozzarella', 280, 28, 3.1, 17],
  ['Queso cheddar', 403, 25, 1.3, 33],
  ['Crema (sour cream)', 198, 2.4, 4.6, 19],
  ['Mantequilla', 717, 0.9, 0.1, 81],

  // ─── CARBOHIDRATOS BASE ────────────────────────────────────────────────────
  ['Arroz blanco cocido', 130, 2.7, 28, 0.3],
  ['Arroz integral cocido', 111, 2.6, 23, 0.9],
  ['Arroz salvadoreño con vegetales', 145, 3, 27, 3],
  ['Tortilla de maíz (1 unid ~30g)', 218, 5.7, 45, 2.9],
  ['Tortilla de harina (1 unid ~35g)', 304, 8, 50, 8],
  ['Pan blanco rebanada', 265, 9, 49, 3.2],
  ['Pan integral', 247, 13, 41, 3.4],
  ['Pan francés (baguette)', 274, 9, 52, 3],
  ['Avena cruda', 389, 17, 66, 7],
  ['Avena cocida', 71, 2.5, 12, 1.5],
  ['Pasta cocida', 158, 5.8, 31, 0.9],
  ['Pasta integral cocida', 124, 5, 27, 0.5],
  ['Quinoa cocida', 120, 4.4, 21, 1.9],
  ['Papa cocida', 87, 1.9, 20, 0.1],
  ['Papa frita (casera)', 312, 3.4, 41, 15],
  ['Camote cocido', 86, 1.6, 20, 0.1],
  ['Yuca cocida', 160, 1.4, 38, 0.3],
  ['Plátano frito (tajadas)', 153, 1.3, 36, 0.4],
  ['Plátano maduro frito', 220, 1.5, 41, 6.5],
  ['Plátano verde frito', 309, 1.5, 41, 16],

  // ─── LEGUMBRES ─────────────────────────────────────────────────────────────
  ['Frijoles rojos cocidos', 127, 9, 23, 0.5],
  ['Frijoles negros cocidos', 132, 8.9, 24, 0.5],
  ['Frijoles refritos salvadoreños', 145, 8, 18, 5],
  ['Lentejas cocidas', 116, 9, 20, 0.4],
  ['Garbanzos cocidos', 164, 9, 27, 2.6],
  ['Soya en grano cocida', 173, 17, 10, 9],

  // ─── COMIDAS TÍPICAS LATAM/SV ──────────────────────────────────────────────
  ['Pupusa de queso (1 unid ~90g)', 235, 7, 30, 9],
  ['Pupusa de frijol con queso', 224, 8, 28, 8],
  ['Pupusa revuelta', 240, 9, 29, 9.5],
  ['Pupusa de chicharrón', 250, 10, 28, 11],
  ['Curtido salvadoreño', 25, 1, 5, 0.1],
  ['Salsa de tomate para pupusa', 35, 1, 7, 0.2],
  ['Tamal salvadoreño (de pollo)', 195, 7, 22, 9],
  ['Tamal pisque', 165, 4, 30, 3.5],
  ['Yuca frita con chicharrón', 280, 8, 30, 14],
  ['Sopa de res salvadoreña', 110, 12, 5, 5],
  ['Sopa de pollo', 75, 9, 3, 3],
  ['Sopa de frijol', 86, 5, 14, 1],
  ['Casamiento (arroz con frijoles)', 165, 6, 30, 2.5],
  ['Empanada de plátano (1 unid)', 222, 3, 35, 8.5],
  ['Empanada de leche', 215, 4, 38, 5],
  ['Pan dulce salvadoreño', 364, 7, 53, 14],
  ['Quesadilla salvadoreña (1 reb ~80g)', 380, 7, 43, 20],
  ['Semita pacha (1 reb)', 350, 6, 60, 10],
  ['Marquesote', 320, 5, 55, 9],
  ['Atol de elote', 105, 3, 20, 1.5],
  ['Horchata salvadoreña (vaso 250ml)', 88, 1.2, 18, 1.5],
  ['Fresco de tamarindo (vaso 250ml)', 60, 0.4, 15, 0],

  // ─── FRUTAS ────────────────────────────────────────────────────────────────
  ['Banano', 89, 1.1, 23, 0.3],
  ['Manzana', 52, 0.3, 14, 0.2],
  ['Naranja', 47, 0.9, 12, 0.1],
  ['Mandarina', 53, 0.8, 13, 0.3],
  ['Sandía', 30, 0.6, 7.6, 0.2],
  ['Papaya', 43, 0.5, 11, 0.3],
  ['Mango', 60, 0.8, 15, 0.4],
  ['Piña', 50, 0.5, 13, 0.1],
  ['Fresas', 32, 0.7, 7.7, 0.3],
  ['Uvas', 67, 0.6, 17, 0.4],
  ['Aguacate', 160, 2, 9, 15],
  ['Limón (jugo)', 22, 0.4, 7, 0.2],
  ['Coco fresco', 354, 3.3, 15, 33],
  ['Maracuyá', 97, 2.2, 23, 0.7],

  // ─── VEGETALES ─────────────────────────────────────────────────────────────
  ['Brócoli cocido', 35, 2.4, 7, 0.4],
  ['Coliflor cocida', 23, 1.8, 4, 0.5],
  ['Espinaca cruda', 23, 2.9, 3.6, 0.4],
  ['Lechuga romana', 17, 1.2, 3.3, 0.3],
  ['Tomate', 18, 0.9, 3.9, 0.2],
  ['Cebolla', 40, 1.1, 9, 0.1],
  ['Pepino', 16, 0.7, 3.6, 0.1],
  ['Zanahoria cruda', 41, 0.9, 10, 0.2],
  ['Pimiento verde', 20, 0.9, 4.6, 0.2],
  ['Pimiento rojo', 31, 1, 6, 0.3],
  ['Chile jalapeño', 29, 0.9, 6.5, 0.4],
  ['Ajo', 149, 6.4, 33, 0.5],
  ['Ejote (frijol verde) cocido', 35, 1.9, 8, 0.3],
  ['Calabacín (zucchini)', 17, 1.2, 3.1, 0.3],
  ['Maíz dulce cocido', 86, 3.3, 19, 1.4],
  ['Elote (1 mazorca media ~100g)', 86, 3.3, 19, 1.4],

  // ─── FRUTOS SECOS Y SEMILLAS ───────────────────────────────────────────────
  ['Almendras', 579, 21, 22, 50],
  ['Maní (cacahuete)', 567, 26, 16, 49],
  ['Mantequilla de maní', 588, 25, 20, 50],
  ['Nueces', 654, 15, 14, 65],
  ['Pepitoria (semilla calabaza)', 559, 30, 11, 49],
  ['Marañón (cashew)', 553, 18, 30, 44],

  // ─── ACEITES Y GRASAS ──────────────────────────────────────────────────────
  ['Aceite de oliva', 884, 0, 0, 100],
  ['Aceite vegetal', 884, 0, 0, 100],
  ['Aceite de coco', 862, 0, 0, 100],

  // ─── BEBIDAS Y SUPLEMENTOS ─────────────────────────────────────────────────
  ['Coca-Cola (350ml)', 42, 0, 11, 0],
  ['Coca-Cola Zero', 0, 0, 0, 0],
  ['Café negro', 2, 0.3, 0, 0],
  ['Café con leche', 30, 1.5, 3, 1.2],
  ['Té verde', 1, 0, 0.2, 0],
  ['Cerveza Pilsener (350ml)', 43, 0.5, 3.6, 0],
  ['Vino tinto (150ml)', 85, 0.1, 2.7, 0],
  ['Whey protein (1 scoop ~30g)', 400, 80, 8, 5],
  ['Caseína (1 scoop ~30g)', 380, 78, 7, 3],
  ['BCAA en polvo', 5, 1, 0, 0],
  ['Creatina monohidrato', 0, 0, 0, 0],

  // ─── FAST FOOD COMÚN ───────────────────────────────────────────────────────
  ['Pizza pepperoni (1 reb ~100g)', 298, 12, 33, 13],
  ['Hamburguesa simple (~150g)', 295, 17, 30, 14],
  ['Big Mac', 257, 12, 21, 14],
  ['Pollo Campero pieza (frito)', 280, 18, 12, 18],
  ['Papas fritas McDonalds (media)', 312, 3.4, 41, 15],
  ['Hot dog (1 unid)', 290, 10, 27, 16],
  ['Taco al pastor (1 unid)', 175, 9, 16, 8],

  // ─── DULCES Y POSTRES ──────────────────────────────────────────────────────
  ['Chocolate con leche (1 barra ~40g)', 535, 7.6, 59, 30],
  ['Galleta de chocolate (1 unid)', 502, 5.7, 64, 25],
  ['Helado de vainilla', 207, 3.5, 24, 11],
  ['Pastel de chocolate (1 reb)', 371, 4.2, 50, 17],
  ['Donut glaseada', 421, 4, 51, 23],
  ['Miel', 304, 0.3, 82, 0],
  ['Azúcar blanca', 387, 0, 100, 0],
];

async function main() {
  console.log('🍽️  Importador de alimentos LATAM + USDA básicos');
  console.log(`   ${FOODS.length} alimentos a procesar · dry_run=${DRY_RUN}`);
  console.log('');

  // Trae nombres existentes (globales) para evitar duplicar
  const existing = await prisma.foodItem.findMany({
    where: { gym_id: null },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase().trim()));

  const toInsert = FOODS.filter(([name]) => !existingNames.has(String(name).toLowerCase().trim()));

  console.log(`📊 Existentes: ${existing.length} · Nuevos a insertar: ${toInsert.length}`);

  if (DRY_RUN) {
    console.log('🟡 DRY RUN — no se inserta nada. Muestra:');
    toInsert.slice(0, 5).forEach(([name, kcal, p, c, f]) => {
      console.log(`   · ${name}: ${kcal} kcal · P${p} C${c} G${f}`);
    });
    return;
  }

  if (toInsert.length === 0) {
    console.log('Nada nuevo que insertar.');
    return;
  }

  const data = toInsert.map(([name, kcal, p, c, f]) => ({
    gym_id: null,
    name: String(name).slice(0, 200),
    brand: null,
    kcal_per_100g: Number(kcal),
    protein_per_100g: Number(p),
    carbs_per_100g: Number(c),
    fat_per_100g: Number(f),
    is_verified: true,
  }));

  const res = await prisma.foodItem.createMany({ data, skipDuplicates: true });
  console.log(`✅ Insertados: ${res.count}`);
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
