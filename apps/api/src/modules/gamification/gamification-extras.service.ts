import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

function randomCode(len = 8): string {
  // Simple base32-like code (sin Date.now/Math.random — usamos UUID truncado vía DB)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const bytes = new Uint8Array(len);
  // crypto disponible globalmente en Node 22
  crypto.getRandomValues(bytes);
  for (const b of bytes) s += chars[b % chars.length];
  return s;
}

@Injectable()
export class GamificationExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CHALLENGES ──────────────────────────────────────────────────────────
  async listActiveChallenges(gymId: string, memberId: string) {
    const now = new Date();
    const challenges = await this.prisma.challenge.findMany({
      where: {
        gym_id: gymId,
        is_active: true,
        ends_at: { gte: now },
      },
      orderBy: { ends_at: 'asc' },
      include: {
        member_challenges: {
          where: { member_id: memberId },
          select: { id: true, progress: true, completed: true, completed_at: true },
        },
        _count: { select: { member_challenges: true } },
      },
    });
    return challenges.map((c) => ({
      ...c,
      my: c.member_challenges[0] ?? null,
      participants_count: c._count.member_challenges,
      member_challenges: undefined,
      _count: undefined,
    }));
  }

  async joinChallenge(memberId: string, challengeId: string) {
    return this.prisma.memberChallenge.upsert({
      where: { member_id_challenge_id: { member_id: memberId, challenge_id: challengeId } },
      create: { member_id: memberId, challenge_id: challengeId, progress: 0 },
      update: {},
    });
  }

  // ─── LEADERBOARD ─────────────────────────────────────────────────────────
  async getLeaderboard(gymId: string, scope: 'week' | 'month' | 'lifetime', limit = 20) {
    if (scope === 'lifetime') {
      // Por points_lifetime acumulados
      const top = await this.prisma.member.findMany({
        where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } },
        orderBy: { points_lifetime: 'desc' },
        take: limit,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          avatar_url: true,
          points_lifetime: true,
          loyalty_level: true,
        },
      });
      return top.map((m, i) => ({
        rank: i + 1,
        member_id: m.id,
        name: `${m.first_name} ${m.last_name.charAt(0)}.`,
        avatar_url: m.avatar_url,
        score: m.points_lifetime,
        loyalty_level: m.loyalty_level,
      }));
    }

    // Por puntos ganados en el período (suma de PointsTransaction)
    const since = new Date();
    if (scope === 'week') since.setDate(since.getDate() - 7);
    else since.setDate(since.getDate() - 30);

    const grouped = await this.prisma.pointsTransaction.groupBy({
      by: ['member_id'],
      where: { gym_id: gymId, created_at: { gte: since }, amount: { gt: 0 } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) return [];

    const memberIds = grouped.map((g) => g.member_id);
    const members = await this.prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        loyalty_level: true,
      },
    });
    const byId = new Map(members.map((m) => [m.id, m]));

    return grouped.map((g, i) => {
      const m = byId.get(g.member_id);
      return {
        rank: i + 1,
        member_id: g.member_id,
        name: m ? `${m.first_name} ${m.last_name.charAt(0)}.` : '—',
        avatar_url: m?.avatar_url ?? null,
        score: Number(g._sum?.amount ?? 0),
        loyalty_level: m?.loyalty_level ?? 'bronze',
      };
    });
  }

  // ─── REWARDS STORE ──────────────────────────────────────────────────────
  async listRewards(gymId: string) {
    return this.prisma.reward.findMany({
      where: { gym_id: gymId, is_active: true },
      orderBy: { cost_points: 'asc' },
    });
  }

  async redeemReward(gymId: string, memberId: string, rewardId: string) {
    return this.prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findFirst({
        where: { id: rewardId, gym_id: gymId, is_active: true },
      });
      if (!reward) throw new NotFoundException('Recompensa no disponible');
      if (reward.stock === 0) throw new BadRequestException('Recompensa sin stock');

      const member = await tx.member.findFirst({
        where: { id: memberId, gym_id: gymId },
        select: { id: true, points_balance: true },
      });
      if (!member) throw new NotFoundException('Miembro no encontrado');
      if (member.points_balance < reward.cost_points) {
        throw new BadRequestException(
          `Necesitas ${reward.cost_points} puntos, tienes ${member.points_balance}`,
        );
      }

      // Crear redemption y debitar puntos en la misma tx
      const redemption = await tx.rewardRedemption.create({
        data: {
          gym_id: gymId,
          member_id: memberId,
          reward_id: rewardId,
          points_spent: reward.cost_points,
          status: 'PENDING',
        },
      });

      await tx.member.update({
        where: { id: memberId },
        data: { points_balance: { decrement: reward.cost_points } },
      });

      if (reward.stock > 0) {
        await tx.reward.update({
          where: { id: rewardId },
          data: { stock: { decrement: 1 } },
        });
      }

      return redemption;
    });
  }

  async listMyRedemptions(memberId: string) {
    return this.prisma.rewardRedemption.findMany({
      where: { member_id: memberId },
      orderBy: { redeemed_at: 'desc' },
      include: { reward: { select: { id: true, name: true, cover_emoji: true } } },
    });
  }

  // ─── REFERRALS ───────────────────────────────────────────────────────────
  // ─── ADMIN: Challenges CRUD ──────────────────────────────────────────────
  async listChallengesAdmin(gymId: string) {
    return this.prisma.challenge.findMany({
      where: { gym_id: gymId },
      orderBy: [{ is_active: 'desc' }, { ends_at: 'desc' }],
      include: { _count: { select: { member_challenges: true } } },
    });
  }

  async createChallengeAdmin(
    gymId: string,
    dto: {
      name: string;
      description?: string;
      goal_type: string;
      goal_value: number;
      reward_points?: number;
      starts_at: string;
      ends_at: string;
      cover_emoji?: string;
    },
  ) {
    return this.prisma.challenge.create({
      data: {
        gym_id: gymId,
        name: dto.name,
        description: dto.description,
        goal_type: dto.goal_type,
        goal_value: dto.goal_value,
        reward_points: dto.reward_points ?? 100,
        starts_at: new Date(dto.starts_at),
        ends_at: new Date(dto.ends_at),
        cover_emoji: dto.cover_emoji ?? '🏆',
        is_active: true,
      },
    });
  }

  async updateChallengeAdmin(
    gymId: string,
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      goal_value: number;
      reward_points: number;
      starts_at: string;
      ends_at: string;
      cover_emoji: string;
      is_active: boolean;
    }>,
  ) {
    const c = await this.prisma.challenge.findFirst({ where: { id, gym_id: gymId } });
    if (!c) throw new NotFoundException('Reto no encontrado');
    return this.prisma.challenge.update({
      where: { id },
      data: {
        ...dto,
        starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
        ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
      },
    });
  }

  async deleteChallengeAdmin(gymId: string, id: string) {
    const c = await this.prisma.challenge.findFirst({ where: { id, gym_id: gymId } });
    if (!c) throw new NotFoundException('Reto no encontrado');
    return this.prisma.challenge.delete({ where: { id } });
  }

  // ─── ADMIN: Rewards CRUD ─────────────────────────────────────────────────
  async listRewardsAdmin(gymId: string) {
    return this.prisma.reward.findMany({
      where: { gym_id: gymId },
      orderBy: [{ is_active: 'desc' }, { cost_points: 'asc' }],
      include: { _count: { select: { redemptions: true } } },
    });
  }

  async createRewardAdmin(
    gymId: string,
    dto: {
      name: string;
      description?: string;
      cost_points: number;
      stock?: number;
      cover_emoji?: string;
    },
  ) {
    return this.prisma.reward.create({
      data: {
        gym_id: gymId,
        name: dto.name,
        description: dto.description,
        cost_points: dto.cost_points,
        stock: dto.stock ?? -1,
        cover_emoji: dto.cover_emoji ?? '🎁',
        is_active: true,
      },
    });
  }

  async updateRewardAdmin(
    gymId: string,
    id: string,
    dto: Partial<{
      name: string;
      description: string;
      cost_points: number;
      stock: number;
      cover_emoji: string;
      is_active: boolean;
    }>,
  ) {
    const r = await this.prisma.reward.findFirst({ where: { id, gym_id: gymId } });
    if (!r) throw new NotFoundException('Recompensa no encontrada');
    return this.prisma.reward.update({ where: { id }, data: dto });
  }

  async deleteRewardAdmin(gymId: string, id: string) {
    const r = await this.prisma.reward.findFirst({ where: { id, gym_id: gymId } });
    if (!r) throw new NotFoundException('Recompensa no encontrada');
    return this.prisma.reward.delete({ where: { id } });
  }

  async listRedemptionsAdmin(gymId: string, status?: string) {
    return this.prisma.rewardRedemption.findMany({
      where: { gym_id: gymId, ...(status ? { status } : {}) },
      orderBy: { redeemed_at: 'desc' },
      include: {
        reward: { select: { name: true, cover_emoji: true } },
        member: { select: { first_name: true, last_name: true } },
      },
      take: 100,
    });
  }

  async updateRedemptionStatusAdmin(gymId: string, id: string, status: string) {
    if (!['PENDING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      throw new BadRequestException('Status inválido');
    }
    const red = await this.prisma.rewardRedemption.findFirst({
      where: { id, gym_id: gymId },
    });
    if (!red) throw new NotFoundException('Canje no encontrado');
    return this.prisma.rewardRedemption.update({
      where: { id },
      data: {
        status,
        ...(status === 'DELIVERED' ? { delivered_at: new Date() } : {}),
      },
    });
  }

  async listMyReferrals(memberId: string) {
    return this.prisma.referral.findMany({
      where: { referrer_id: memberId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createReferral(gymId: string, referrerId: string, referredEmail: string) {
    const email = referredEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Email inválido');
    }
    // Evita duplicado por mismo referrer + email
    const existing = await this.prisma.referral.findFirst({
      where: { referrer_id: referrerId, referred_email: email, status: { not: 'REGISTERED' } },
    });
    if (existing) return existing;

    // Generar code único (con reintentos)
    let code = randomCode(8);
    for (let i = 0; i < 5; i++) {
      const collision = await this.prisma.referral.findUnique({ where: { code } });
      if (!collision) break;
      code = randomCode(8);
    }

    return this.prisma.referral.create({
      data: {
        gym_id: gymId,
        referrer_id: referrerId,
        referred_email: email,
        code,
        status: 'PENDING',
      },
    });
  }
}
