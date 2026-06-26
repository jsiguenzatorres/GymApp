import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateFeedbackDto {
  member_id: string;
  type?: string;
  nps_score?: number;
  comment?: string;
  channel?: string;
}

function npsCategory(score: number): string {
  if (score >= 9) return 'PROMOTER';
  if (score >= 7) return 'PASSIVE';
  return 'DETRACTOR';
}

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(gymId: string, type?: string, isResolved?: boolean) {
    return this.prisma.feedback.findMany({
      where: {
        gym_id: gymId,
        ...(type ? { type } : {}),
        ...(isResolved !== undefined ? { is_resolved: isResolved } : {}),
      },
      include: {
        member: { select: { id: true, first_name: true, last_name: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }

  async create(gymId: string, dto: CreateFeedbackDto) {
    const type = dto.type ?? 'NPS';
    const category =
      type === 'NPS' && dto.nps_score !== undefined ? npsCategory(dto.nps_score) : null;

    return this.prisma.feedback.create({
      data: {
        gym_id: gymId,
        member_id: dto.member_id,
        type,
        nps_score: dto.nps_score ?? null,
        category,
        comment: dto.comment ?? null,
        channel: dto.channel ?? 'APP',
      },
    });
  }

  async resolve(gymId: string, feedbackId: string, staffId?: string) {
    const fb = await this.prisma.feedback.findFirst({ where: { id: feedbackId, gym_id: gymId } });
    if (!fb) throw new NotFoundException('Feedback no encontrado');
    return this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        is_resolved: true,
        resolved_at: new Date(),
        resolved_by: staffId ?? null,
      },
    });
  }

  async getNpsStats(gymId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [allTime, recent] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { gym_id: gymId, type: 'NPS', nps_score: { not: null } },
        select: { nps_score: true, category: true, created_at: true },
      }),
      this.prisma.feedback.findMany({
        where: {
          gym_id: gymId,
          type: 'NPS',
          nps_score: { not: null },
          created_at: { gte: thirtyDaysAgo },
        },
        select: { nps_score: true, category: true },
      }),
    ]);

    const calcNps = (items: { nps_score: number | null; category: string | null }[]) => {
      if (items.length === 0)
        return { score: null, promoters: 0, passives: 0, detractors: 0, total: 0 };
      const promoters = items.filter((i) => i.category === 'PROMOTER').length;
      const detractors = items.filter((i) => i.category === 'DETRACTOR').length;
      const total = items.length;
      return {
        score: Math.round(((promoters - detractors) / total) * 100),
        promoters,
        passives: items.filter((i) => i.category === 'PASSIVE').length,
        detractors,
        total,
      };
    };

    // Trend: group all-time NPS by month (last 6)
    const byMonth: Record<string, number[]> = {};
    allTime.forEach((fb) => {
      const key = fb.created_at.toISOString().slice(0, 7); // YYYY-MM
      if (!byMonth[key]) byMonth[key] = [];
      if (fb.nps_score !== null) byMonth[key].push(fb.nps_score);
    });

    const trend = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, scores]) => ({
        month,
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        count: scores.length,
      }));

    return {
      allTime: calcNps(allTime),
      last30Days: calcNps(recent),
      trend,
    };
  }

  async getOpenComplaints(gymId: string) {
    return this.prisma.feedback.findMany({
      where: { gym_id: gymId, type: 'COMPLAINT', is_resolved: false },
      include: { member: { select: { id: true, first_name: true, last_name: true } } },
      orderBy: { created_at: 'asc' },
    });
  }
}
