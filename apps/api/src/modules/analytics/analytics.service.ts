import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { NvidiaNimService } from '../ai/nvidia-nim.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly nvidiaNim: NvidiaNimService,
  ) {}

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
          status: { in: ['ACTIVE', 'TRIAL', 'FREEZE'] },
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

  // ─── PERÍODO (año / mes / rango custom) ──────────────────────────────────
  // Resuelve year+month, year solo, from+to, o el mes actual por defecto.
  // El período previo se calcula desplazando hacia atrás la misma duración
  // (funciona igual para un mes, un año, o un rango arbitrario).
  private resolvePeriod(query: { year?: string; month?: string; from?: string; to?: string }) {
    let start: Date;
    let end: Date;

    if (query.from && query.to) {
      start = new Date(query.from);
      end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
    } else if (query.year && query.month) {
      const y = parseInt(query.year, 10);
      const m = parseInt(query.month, 10) - 1;
      start = new Date(y, m, 1);
      end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    } else if (query.year) {
      const y = parseInt(query.year, 10);
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59, 999);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const durationMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    return { start, end, prevStart, prevEnd };
  }

  // ─── DESGLOSE FINANCIERO POR CATEGORÍA (ingresos + deuda, con filtro de período) ──
  async getRevenueBreakdown(
    gymId: string,
    periodQuery: { year?: string; month?: string; from?: string; to?: string } = {},
  ) {
    const { start, end, prevStart, prevEnd } = this.resolvePeriod(periodQuery);

    const [
      paymentsInPeriod,
      paymentsPrevPeriod,
      addonsInPeriod,
      mkOrdersInPeriod,
      mkOrdersPrevPeriod,
      orderItemsInPeriod,
      pendingMemberships,
      pendingOther,
      storeCreditDebt,
      activeMembers,
      atRiskMemberships,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        where: { gym_id: gymId, status: 'SUCCEEDED', created_at: { gte: start, lte: end } },
        select: { amount: true, membership_id: true, payment_type: true },
      }),
      this.prisma.payment.aggregate({
        where: { gym_id: gymId, status: 'SUCCEEDED', created_at: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      this.prisma.memberAddon.findMany({
        where: { member: { gym_id: gymId }, starts_at: { gte: start, lte: end } },
        select: { type: true, price_paid: true },
      }),
      this.prisma.marketplaceOrder.aggregate({
        where: { gym_id: gymId, status: 'DELIVERED', created_at: { gte: start, lte: end } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.marketplaceOrder.aggregate({
        where: { gym_id: gymId, status: 'DELIVERED', created_at: { gte: prevStart, lte: prevEnd } },
        _sum: { total: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: { gym_id: gymId, status: 'DELIVERED', created_at: { gte: start, lte: end } },
        },
        select: {
          subtotal: true,
          quantity: true,
          product: { select: { id: true, name: true, category: { select: { name: true } } } },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          gym_id: gymId,
          status: { in: ['PENDING', 'FAILED'] },
          membership_id: { not: null },
          created_at: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          gym_id: gymId,
          status: { in: ['PENDING', 'FAILED'] },
          membership_id: null,
          created_at: { gte: start, lte: end },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.member.aggregate({
        where: { gym_id: gymId, credit_balance_usd: { lt: 0 } },
        _sum: { credit_balance_usd: true },
        _count: true,
      }),
      this.prisma.member.count({ where: { gym_id: gymId, status: { in: ['ACTIVE', 'TRIAL'] } } }),
      this.prisma.member.findMany({
        where: {
          gym_id: gymId,
          risk_score: { gte: 70 },
          status: { in: ['ACTIVE', 'TRIAL', 'FREEZE'] },
        },
        select: {
          memberships: {
            where: { status: 'ACTIVE' },
            orderBy: { created_at: 'desc' },
            take: 1,
            select: { type: { select: { price: true } } },
          },
        },
      }),
    ]);

    // Ingresos: categorizar payments (membresías vs otros pagos manuales/day-pass)
    let membershipRev = 0;
    let otherRev = 0;
    const byPaymentMethod = new Map<string, number>();
    for (const p of paymentsInPeriod) {
      const amt = Number(p.amount);
      if (p.membership_id) membershipRev += amt;
      else otherRev += amt;
      byPaymentMethod.set(p.payment_type, (byPaymentMethod.get(p.payment_type) ?? 0) + amt);
    }

    // Add-ons: separar NUTRITION del resto (coaching, etc.) — son eventos de
    // facturación reales (price_paid), no un conteo de "activos ahora mismo".
    let nutritionRev = 0;
    let otherAddonsRev = 0;
    for (const a of addonsInPeriod) {
      const amt = Number(a.price_paid ?? 0);
      if (a.type === 'NUTRITION') nutritionRev += amt;
      else otherAddonsRev += amt;
    }

    const marketplaceRev = Number(mkOrdersInPeriod._sum.total ?? 0);

    // Marketplace: top productos + totales por categoría de producto
    const productAgg = new Map<string, { name: string; revenue: number; quantity: number }>();
    const categoryAgg = new Map<string, number>();
    for (const item of orderItemsInPeriod) {
      const subtotal = Number(item.subtotal);
      const existing = productAgg.get(item.product.id);
      if (existing) {
        existing.revenue += subtotal;
        existing.quantity += item.quantity;
      } else {
        productAgg.set(item.product.id, {
          name: item.product.name,
          revenue: subtotal,
          quantity: item.quantity,
        });
      }
      const catName = item.product.category?.name ?? 'Sin categoría';
      categoryAgg.set(catName, (categoryAgg.get(catName) ?? 0) + subtotal);
    }
    const topProductsNamed = Array.from(productAgg.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const marketplaceByCategory = Array.from(categoryAgg.entries())
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = membershipRev + nutritionRev + otherAddonsRev + marketplaceRev + otherRev;
    const totalPrevRevenue =
      Number(paymentsPrevPeriod._sum.amount ?? 0) + Number(mkOrdersPrevPeriod._sum.total ?? 0);
    const growthPct =
      totalPrevRevenue > 0
        ? Math.round(((totalRevenue - totalPrevRevenue) / totalPrevRevenue) * 1000) / 10
        : null;

    // Deuda: mismas categorías que ingresos, más el crédito de tienda (saldo
    // negativo real del miembro, distinto de un pago PENDING de membresía).
    const pendingMembershipAmt = Number(pendingMemberships._sum.amount ?? 0);
    const pendingOtherAmt = Number(pendingOther._sum.amount ?? 0);
    const storeCreditAmt = Math.abs(Number(storeCreditDebt._sum.credit_balance_usd ?? 0));
    const totalDebt = pendingMembershipAmt + pendingOtherAmt + storeCreditAmt;

    // Ingreso en riesgo: valor mensual de la membresía activa de cada miembro
    // con score de riesgo alto — cuánto se perdería si cancelan.
    const revenueAtRisk = atRiskMemberships.reduce((acc, m) => {
      const price = m.memberships[0]?.type.price;
      return acc + (price ? Number(price) : 0);
    }, 0);

    const arpu = activeMembers > 0 ? totalRevenue / activeMembers : 0;

    return {
      period: {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      },
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_prev_revenue: Math.round(totalPrevRevenue * 100) / 100,
      growth_pct: growthPct,
      revenue: {
        memberships: Math.round(membershipRev * 100) / 100,
        nutrition_plans: Math.round(nutritionRev * 100) / 100,
        other_addons: Math.round(otherAddonsRev * 100) / 100,
        marketplace: Math.round(marketplaceRev * 100) / 100,
        other: Math.round(otherRev * 100) / 100,
      },
      marketplace: {
        orders_count: mkOrdersInPeriod._count,
        revenue: Math.round(marketplaceRev * 100) / 100,
        by_category: marketplaceByCategory,
      },
      top_products: topProductsNamed,
      payment_methods: Array.from(byPaymentMethod.entries()).map(([type, amount]) => ({
        type,
        amount: Math.round(amount * 100) / 100,
      })),
      debt: {
        total: Math.round(totalDebt * 100) / 100,
        memberships_pending: Math.round(pendingMembershipAmt * 100) / 100,
        memberships_pending_count: pendingMemberships._count,
        other_pending: Math.round(pendingOtherAmt * 100) / 100,
        other_pending_count: pendingOther._count,
        store_credit: Math.round(storeCreditAmt * 100) / 100,
        store_credit_debtor_count: storeCreditDebt._count,
      },
      insights: {
        arpu: Math.round(arpu * 100) / 100,
        active_members: activeMembers,
        revenue_at_risk: Math.round(revenueAtRisk * 100) / 100,
        at_risk_member_count: atRiskMemberships.length,
      },
    };
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

  // ─── BUSINESS COACH IA ───────────────────────────────────────────────────────

  async businessCoachQuery(gymId: string, question: string): Promise<string> {
    const [dashboard, revenue] = await Promise.all([
      this.getDashboard(gymId),
      this.getRevenueTrend(gymId, 3),
    ]);

    const k = dashboard.kpis;
    const trend = revenue
      .map(
        (r: { month: string; revenue: number; newMembers: number }) =>
          `  ${r.month}: $${(r.revenue ?? 0).toFixed(2)} — ${r.newMembers} nuevos miembros`,
      )
      .join('\n');

    const systemPrompt = `Eres el Business Coach IA de GymApp. Eres experto en analítica de negocio para gimnasios en Latinoamérica.

MÉTRICAS ACTUALES DEL GYM:
- Miembros activos: ${k.activeMembers} de ${k.totalMembers} totales
- Nuevos este mes: ${k.newMembersThisMonth} (${k.memberGrowth > 0 ? '+' : ''}${k.memberGrowth}% vs mes anterior)
- Ingresos este mes: $${(k.revenueThisMonth ?? 0).toFixed(2)} en ${k.transactions} transacciones
- Ingresos pendientes: $${(k.pendingRevenue ?? 0).toFixed(2)} (${k.pendingCount} pagos)
- Miembros en alto riesgo de cancelar: ${k.highRiskCount}
- Score de riesgo promedio: ${(k.avgRiskScore ?? 0).toFixed(1)}/100
- Sesiones de workout esta semana: ${k.workoutSessionsWeek}
- Tasa de retención estimada: ${(k.retentionRate ?? 0).toFixed(1)}%

TENDENCIA DE INGRESOS (últimos 3 meses):
${trend}

INSTRUCCIONES:
- Responde en español, de forma concisa y accionable
- Basa tus respuestas en los datos reales del gym
- Da recomendaciones específicas y concretas con pasos claros
- Si no tienes suficientes datos, dilo claramente y sugiere cómo obtenerlos
- Máximo 3 párrafos bien estructurados`;

    try {
      return await this.gemini.chat(systemPrompt, question);
    } catch (err) {
      const errMsg = (err as Error).message ?? String(err);
      this.logger.error(`Business Coach error: ${errMsg}`);

      if (errMsg.includes('All Gemini API keys exhausted') && this.nvidiaNim.isEnabled) {
        try {
          return await this.nvidiaNim.chat(systemPrompt, question);
        } catch (nimErr) {
          this.logger.error(
            `Business Coach NVIDIA NIM fallback error: ${(nimErr as Error).message}`,
          );
        }
      }

      return 'El Business Coach no está disponible en este momento. Intenta de nuevo en unos segundos.';
    }
  }
}
