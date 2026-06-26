import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service';

// ─── Level config (from CLAUDE.md) ────────────────────────────────────────────
const LEVELS = [
  { name: 'Bronce', min: 0, max: 999, color: '#b45309', emoji: '🥉' },
  { name: 'Plata', min: 1000, max: 4999, color: '#71717a', emoji: '🥈' },
  { name: 'Oro', min: 5000, max: 14999, color: '#d97706', emoji: '🥇' },
  { name: 'Platino', min: 15000, max: 29999, color: '#0ea5e9', emoji: '💎' },
  { name: 'Élite', min: 30000, max: null, color: '#7c3aed', emoji: '👑' },
];

function computeLevel(lifetime: number) {
  const level = [...LEVELS].reverse().find((l) => lifetime >= l.min) ?? LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1] ?? null;
  const rangeSize = (level.max ?? level.min + 1) - level.min;
  const progress = level.max ? Math.min((lifetime - level.min) / rangeSize, 1) : 1;
  return {
    name: level.name,
    color: level.color,
    emoji: level.emoji,
    nextName: nextLevel?.name ?? null,
    nextThreshold: nextLevel?.min ?? null,
    progress,
  };
}

export interface MemberStats {
  balance: number;
  lifetime: number;
  level: ReturnType<typeof computeLevel>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: Date;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string;
    earned_at: Date;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  member_id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  points_lifetime: number;
  level_name: string;
  level_emoji: string;
  level_color: string;
}

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Internal ──────────────────────────────────────────────────────────────

  private async resolveMemberId(gymId: string, userId: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: { user_id: userId, gym_id: gymId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return member.id;
  }

  async awardPoints(
    gymId: string,
    memberId: string,
    amount: number,
    type: string,
    description?: string,
    referenceId?: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.pointsTransaction.create({
        data: {
          gym_id: gymId,
          member_id: memberId,
          amount,
          type,
          description: description ?? null,
          reference_id: referenceId ?? null,
        },
      }),
      this.prisma.member.update({
        where: { id: memberId },
        data: {
          points_balance: { increment: amount },
          ...(amount > 0 ? { points_lifetime: { increment: amount } } : {}),
        },
      }),
    ]);
  }

  // ─── Event listeners ───────────────────────────────────────────────────────

  @OnEvent('member.checked_in')
  async onCheckedIn(payload: { gymId: string; memberId: string }) {
    await this.awardPoints(payload.gymId, payload.memberId, 10, 'CHECK_IN', 'Check-in al gimnasio');
  }

  @OnEvent('workout.session_finished')
  async onWorkoutFinished(payload: { gymId: string; memberId: string; sessionId: string }) {
    await this.awardPoints(
      payload.gymId,
      payload.memberId,
      20,
      'WORKOUT_COMPLETE',
      'Sesión de workout completada',
      payload.sessionId,
    );
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async getMemberStats(gymId: string, userId: string): Promise<MemberStats> {
    const memberId = await this.resolveMemberId(gymId, userId);

    const [member, recentTx, earnedBadges] = await Promise.all([
      this.prisma.member.findUnique({
        where: { id: memberId },
        select: { points_balance: true, points_lifetime: true },
      }),
      this.prisma.pointsTransaction.findMany({
        where: { member_id: memberId, gym_id: gymId },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { id: true, amount: true, type: true, description: true, created_at: true },
      }),
      this.prisma.memberBadge.findMany({
        where: { member_id: memberId, gym_id: gymId },
        orderBy: { earned_at: 'desc' },
        include: {
          badge: { select: { id: true, name: true, description: true, icon: true } },
        },
      }),
    ]);

    if (!member) throw new NotFoundException('Miembro no encontrado');

    return {
      balance: member.points_balance,
      lifetime: member.points_lifetime,
      level: computeLevel(member.points_lifetime),
      recentTransactions: recentTx,
      badges: earnedBadges.map((mb) => ({
        id: mb.badge.id,
        name: mb.badge.name,
        description: mb.badge.description,
        icon: mb.badge.icon,
        earned_at: mb.earned_at,
      })),
    };
  }

  async getLeaderboard(gymId: string): Promise<LeaderboardEntry[]> {
    const members = await this.prisma.member.findMany({
      where: { gym_id: gymId, status: 'ACTIVE' },
      orderBy: { points_lifetime: 'desc' },
      take: 10,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        avatar_url: true,
        points_lifetime: true,
      },
    });

    return members.map((m, i) => {
      const lv = computeLevel(m.points_lifetime);
      return {
        rank: i + 1,
        member_id: m.id,
        first_name: m.first_name,
        last_name: m.last_name,
        avatar_url: m.avatar_url,
        points_lifetime: m.points_lifetime,
        level_name: lv.name,
        level_emoji: lv.emoji,
        level_color: lv.color,
      };
    });
  }
}
