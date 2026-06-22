import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── DASHBOARD KPIs ──────────────────────────────────────────────────────────

  async getDashboard(gymId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMon = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMon = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

    const [
      activeMembers,
      newMembersThisMonth,
      newMembersPrevMonth,
      revenueThisMonth,
      revenuePrevMonth,
      pendingPayments,
      highRiskCount,
      avgRiskResult,
      workoutSessionsWeek,
      memberStatusDistribution,
      appointmentsNextWeek,
      totalMembers,
    ] = await Promise.all([
      this.prisma.member.count({
        where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } },
      }),
      this.prisma.member.count({
        where: { gym_id: gymId, created_at: { gte: startOfMonth } },
      }),
      this.prisma.member.count({
        where: { gym_id: gymId, created_at: { gte: startOfPrevMon, lte: endOfPrevMon } },
      }),
      this.prisma.payment.aggregate({
        where: { gym_id: gymId, status: 'SUCCEEDED', created_at: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          gym_id: gymId,
          status: 'SUCCEEDED',
          created_at: { gte: startOfPrevMon, lte: endOfPrevMon },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { gym_id: gymId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.member.count({
        where: {
          gym_id: gymId,
          risk_score: { gte: 70 },
          status: { in: ['ACTIVE', 'TRIAL', 'FROZEN'] },
        },
      }),
      this.prisma.member.aggregate({
        where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } },
        _avg: { risk_score: true },
      }),
      this.prisma.workoutSession.count({
        where: { gym_id: gymId, started_at: { gte: sevenDaysAgo } },
      }),
      this.prisma.member.groupBy({
        by: ['status'],
        where: { gym_id: gymId },
        _count: { id: true },
      }),
      this.prisma.appointment.count({
        where: {
          gym_id: gymId,
          scheduled_at: { gte: now, lte: new Date(now.getTime() + 7 * 86_400_000) },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      this.prisma.member.count({ where: { gym_id: gymId } }),
    ]);

    const revenueNow = Number(revenueThisMonth._sum.amount ?? 0);
    const revenuePrev = Number(revenuePrevMonth._sum.amount ?? 0);
    const revenueGrowth =
      revenuePrev > 0 ? Math.round(((revenueNow - revenuePrev) / revenuePrev) * 1000) / 10 : 0;

    const memberGrowth =
      newMembersPrevMonth > 0
        ? Math.round(((newMembersThisMonth - newMembersPrevMonth) / newMembersPrevMonth) * 1000) /
          10
        : 0;

    // retención simplificada: miembros activos / total (excl. leads)
    const nonLeads =
      totalMembers - (memberStatusDistribution.find((s) => s.status === 'LEAD')?._count.id ?? 0);
    const retentionRate = nonLeads > 0 ? Math.round((activeMembers / nonLeads) * 1000) / 10 : 0;

    return {
      kpis: {
        activeMembers,
        newMembersThisMonth,
        memberGrowth,
        revenueThisMonth: revenueNow,
        revenueGrowth,
        transactions: revenueThisMonth._count,
        pendingRevenue: Number(pendingPayments._sum.amount ?? 0),
        pendingCount: pendingPayments._count,
        highRiskCount,
        avgRiskScore: Math.round(Number(avgRiskResult._avg.risk_score ?? 0)),
        workoutSessionsWeek,
        appointmentsNextWeek,
        retentionRate,
        totalMembers,
      },
      memberStatusDistribution: memberStatusDistribution.map((g) => ({
        status: g.status,
        count: g._count.id,
      })),
    };
  }

  // ─── REVENUE TREND (últimos N meses) ─────────────────────────────────────────

  async getRevenueTrend(gymId: string, months = 6) {
    const trend: { month: string; revenue: number; transactions: number; newMembers: number }[] =
      [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [rev, newMem] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { gym_id: gymId, status: 'SUCCEEDED', created_at: { gte: start, lte: end } },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.member.count({
          where: { gym_id: gymId, created_at: { gte: start, lte: end } },
        }),
      ]);

      trend.push({
        month: start.toLocaleDateString('es-SV', { month: 'short', year: '2-digit' }),
        revenue: Number(rev._sum.amount ?? 0),
        transactions: rev._count,
        newMembers: newMem,
      });
    }

    return trend;
  }

  // ─── MEMBERSHIP BREAKDOWN ────────────────────────────────────────────────────

  async getMembershipBreakdown(gymId: string) {
    const types = await this.prisma.membershipType.findMany({
      where: { gym_id: gymId },
      include: {
        memberships: {
          where: { status: { in: ['ACTIVE', 'TRIAL'] } },
          select: { id: true },
        },
      },
      orderBy: { sort_order: 'asc' },
    });

    return types
      .map((t) => ({ name: t.name, count: t.memberships.length, price: Number(t.price) }))
      .filter((t) => t.count > 0);
  }

  // ─── BUSINESS COACH (stub) ────────────────────────────────────────────────────

  async coachQuery(_gymId: string, query: string) {
    // P2: reemplazar con Claude claude-sonnet-4-20250514 + agregación BI
    return {
      answer: `Recibí tu consulta: "${query}". El Business Coach con IA completa estará disponible en la fase de Growth. Por ahora puedes revisar el panel ejecutivo para los KPIs disponibles.`,
      isStub: true,
    };
  }

  // ─── SNAPSHOT DIARIO (se llamará desde pg_cron en P2) ────────────────────────

  async takeSnapshot(gymId: string) {
    const dashboard = await this.getDashboard(gymId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entries = [
      { key: 'active_members', value: dashboard.kpis.activeMembers },
      { key: 'revenue_this_month', value: dashboard.kpis.revenueThisMonth },
      { key: 'new_members_this_month', value: dashboard.kpis.newMembersThisMonth },
      { key: 'high_risk_count', value: dashboard.kpis.highRiskCount },
      { key: 'avg_risk_score', value: dashboard.kpis.avgRiskScore },
      { key: 'workout_sessions_7d', value: dashboard.kpis.workoutSessionsWeek },
    ];

    await this.prisma.$transaction(
      entries.map((e) =>
        this.prisma.metricSnapshot.upsert({
          where: { gym_id_date_metric_key: { gym_id: gymId, date: today, metric_key: e.key } },
          create: { gym_id: gymId, date: today, metric_key: e.key, value: e.value },
          update: { value: e.value },
        }),
      ),
    );

    return { snapshotted: entries.length, date: today.toISOString().split('T')[0] };
  }
}
