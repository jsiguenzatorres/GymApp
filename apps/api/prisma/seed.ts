import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GymApp database...');

  // ─── GYM ─────────────────────────────────────────────────────────────────
  const gym = await prisma.gym.upsert({
    where: { slug: 'gymapp-demo' },
    update: {},
    create: {
      name: 'GymApp Demo',
      slug: 'gymapp-demo',
      email: 'demo@gymapp.app',
      phone: '+503 7000-0000',
      address: 'Calle Demo 123, San Salvador',
      city: 'San Salvador',
      country: 'SV',
      timezone: 'America/El_Salvador',
      currency: 'USD',
      saas_plan: 'ELITE',
      is_active: true,
      description: 'Gym de demostración para pruebas del sistema',
      operating_hours: {
        monday: { open: '05:00', close: '22:00', closed: false },
        tuesday: { open: '05:00', close: '22:00', closed: false },
        wednesday: { open: '05:00', close: '22:00', closed: false },
        thursday: { open: '05:00', close: '22:00', closed: false },
        friday: { open: '05:00', close: '22:00', closed: false },
        saturday: { open: '06:00', close: '20:00', closed: false },
        sunday: { open: '07:00', close: '14:00', closed: false },
      },
      social_links: {
        instagram: 'gymapp_demo',
        facebook: 'gymappdemo',
      },
    },
  });
  console.log(`  ✅ Gym: ${gym.name} (${gym.id})`);

  // ─── OWNER ────────────────────────────────────────────────────────────────
  const ownerHash = await bcrypt.hash('Admin2026!', 12);
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@gymapp.app' },
    update: {},
    create: {
      email: 'owner@gymapp.app',
      password_hash: ownerHash,
      role: 'GYM_OWNER',
      is_active: true,
      email_verified: true,
    },
  });

  await prisma.staff.upsert({
    where: { user_id: ownerUser.id },
    update: {},
    create: {
      gym_id: gym.id,
      user_id: ownerUser.id,
      first_name: 'Admin',
      last_name: 'Owner',
      is_active: true,
    },
  });
  console.log(`  ✅ Owner: ${ownerUser.email} / password: Admin2026!`);

  // ─── TRAINER ─────────────────────────────────────────────────────────────
  const trainerHash = await bcrypt.hash('Trainer2026!', 12);
  const trainerUser = await prisma.user.upsert({
    where: { email: 'trainer@gymapp.app' },
    update: {},
    create: {
      email: 'trainer@gymapp.app',
      password_hash: trainerHash,
      role: 'TRAINER',
      is_active: true,
      email_verified: true,
    },
  });

  await prisma.staff.upsert({
    where: { user_id: trainerUser.id },
    update: {},
    create: {
      gym_id: gym.id,
      user_id: trainerUser.id,
      first_name: 'Carlos',
      last_name: 'Trainer',
      specialties: ['Fuerza', 'HIIT', 'Nutrición'],
      is_active: true,
    },
  });
  console.log(`  ✅ Trainer: ${trainerUser.email} / password: Trainer2026!`);

  // ─── TIPOS DE MEMBRESÍA ───────────────────────────────────────────────────
  const membershipTypes = [
    {
      name: 'Day Pass',
      price: 10,
      billing_frequency: 'ONE_TIME',
      duration_days: 1,
      max_freezes: 0,
      sort_order: 1,
    },
    {
      name: 'Mensual Básico',
      price: 40,
      billing_frequency: 'MONTHLY',
      duration_days: 30,
      max_freezes: 1,
      sort_order: 2,
    },
    {
      name: 'Mensual Pro',
      price: 65,
      billing_frequency: 'MONTHLY',
      duration_days: 30,
      max_freezes: 2,
      sort_order: 3,
    },
    {
      name: 'Trimestral',
      price: 175,
      billing_frequency: 'QUARTERLY',
      duration_days: 90,
      max_freezes: 1,
      sort_order: 4,
    },
    {
      name: 'Anual',
      price: 500,
      billing_frequency: 'ANNUAL',
      duration_days: 365,
      max_freezes: 3,
      sort_order: 5,
    },
    {
      name: 'Anual Elite',
      price: 650,
      billing_frequency: 'ANNUAL',
      duration_days: 365,
      max_freezes: 4,
      sort_order: 6,
    },
  ];

  for (const mt of membershipTypes) {
    const existing = await prisma.membershipType.findFirst({
      where: { gym_id: gym.id, name: mt.name },
    });
    if (!existing) {
      await prisma.membershipType.create({
        data: {
          gym_id: gym.id,
          name: mt.name,
          price: mt.price,
          billing_frequency: mt.billing_frequency as never,
          duration_days: mt.duration_days,
          max_freezes: mt.max_freezes,
          sort_order: mt.sort_order,
          is_active: true,
        },
      });
    }
  }
  console.log(`  ✅ ${membershipTypes.length} tipos de membresía creados`);

  // ─── MIEMBRO DE PRUEBA ────────────────────────────────────────────────────
  const memberHash = await bcrypt.hash('Member2026!', 12);
  const memberUser = await prisma.user.upsert({
    where: { email: 'member@gymapp.app' },
    update: {},
    create: {
      email: 'member@gymapp.app',
      password_hash: memberHash,
      role: 'MEMBER',
      is_active: true,
      email_verified: true,
    },
  });

  const member = await prisma.member.upsert({
    where: { user_id: memberUser.id },
    update: {},
    create: {
      gym_id: gym.id,
      user_id: memberUser.id,
      first_name: 'Juan',
      last_name: 'Miembro',
      phone: '+503 7111-1111',
      status: 'ACTIVE',
      risk_score: 15,
      loyalty_level: 'bronze',
      source: 'web',
    },
  });
  console.log(`  ✅ Member: ${memberUser.email} / password: Member2026!`);

  // Membresía activa para el miembro
  const mensualPro = await prisma.membershipType.findFirst({
    where: { gym_id: gym.id, name: 'Mensual Pro' },
  });

  if (mensualPro) {
    const existingMembership = await prisma.membership.findFirst({
      where: { member_id: member.id, status: 'ACTIVE' },
    });
    if (!existingMembership) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + mensualPro.duration_days);

      await prisma.membership.create({
        data: {
          gym_id: gym.id,
          member_id: member.id,
          type_id: mensualPro.id,
          status: 'ACTIVE',
          start_date: start,
          end_date: end,
          price_paid: mensualPro.price,
          currency: 'USD',
        },
      });
    }
  }

  console.log('\n✅ Seed completado exitosamente.\n');
  console.log('━━━ Credenciales de prueba ━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Owner:   owner@gymapp.app   / Admin2026!');
  console.log('  Trainer: trainer@gymapp.app / Trainer2026!');
  console.log('  Member:  member@gymapp.app  / Member2026!');
  console.log('  Gym ID:', gym.id);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
