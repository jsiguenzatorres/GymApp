#!/usr/bin/env node
/**
 * Activa el add-on NUTRITION tier PRO para el miembro de prueba
 * (miembro.prueba@gymapp.app), replicando la lógica de AddonsService.assignAddon
 * (cancela cualquier addon NUTRITION activo previo, crea uno nuevo ACTIVE).
 *
 * Uso:
 *   node scripts/grant-test-member-nutrition-pro.mjs
 *
 * Requisitos: DATABASE_URL en env (export desde apps/api/.env antes de correr).
 * Es re-ejecutable sin duplicar — si ya hay un addon PRO activo, no hace nada.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_EMAIL = 'miembro.prueba@gymapp.app';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) throw new Error(`No existe el usuario ${TEST_EMAIL} — corre create-test-member-full.mjs primero.`);

  const member = await prisma.member.findUnique({ where: { user_id: user.id } });
  if (!member) throw new Error('No se encontró el registro de Member para el usuario de prueba.');

  const existing = await prisma.memberAddon.findFirst({
    where: { member_id: member.id, type: 'NUTRITION', status: 'ACTIVE' },
  });
  if (existing?.tier === 'PRO') {
    console.log(`Ya tiene NUTRITION PRO activo (addon ${existing.id}). Nada que hacer.`);
    return;
  }

  const addon = await prisma.$transaction(async (tx) => {
    await tx.memberAddon.updateMany({
      where: { member_id: member.id, type: 'NUTRITION', status: 'ACTIVE' },
      data: {
        status: 'CANCELLED',
        cancellation_reason: 'Reemplazado para pruebas — activación NutriPro',
        ends_at: new Date(),
      },
    });
    return tx.memberAddon.create({
      data: {
        member_id: member.id,
        type: 'NUTRITION',
        tier: 'PRO',
        status: 'ACTIVE',
        ends_at: null,
        price_paid: 0,
        currency: 'USD',
        notes: 'Activado manualmente para pruebas de QA',
      },
    });
  });

  console.log(`NutriPro activado — addon ${addon.id} para member ${member.id} (${TEST_EMAIL})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
