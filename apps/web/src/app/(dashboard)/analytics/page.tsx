import { serverFetch } from '@/lib/server-api';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';

interface DashboardKpis {
  activeMembers: number;
  newMembersThisMonth: number;
  memberGrowth: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  transactions: number;
  pendingRevenue: number;
  pendingCount: number;
  highRiskCount: number;
  avgRiskScore: number;
  workoutSessionsWeek: number;
  appointmentsNextWeek: number;
  retentionRate: number;
  totalMembers: number;
}

interface DashboardResponse {
  kpis: DashboardKpis;
  memberStatusDistribution: { status: string; count: number }[];
}

interface RevenueTrendEntry {
  month: string;
  revenue: number;
  transactions: number;
  newMembers: number;
}

interface MembershipEntry {
  name: string;
  count: number;
  price: number;
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400">Sin cambio</span>;
  const isPos = value > 0;
  return (
    <span className={`text-xs font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPos ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  badge,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  badge?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${accent ?? 'border-gray-100'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {badge}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const [dashboard, revenueTrend, membershipBreakdown] = await Promise.all([
    serverFetch<DashboardResponse>('/api/v1/analytics/dashboard'),
    serverFetch<RevenueTrendEntry[]>('/api/v1/analytics/revenue?months=6'),
    serverFetch<MembershipEntry[]>('/api/v1/analytics/memberships'),
  ]);

  const kpis = dashboard?.kpis;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Ejecutivo</h1>
        <p className="text-sm text-gray-500">KPIs y tendencias de tu gym en tiempo real</p>
      </div>

      {/* KPI Cards — Row 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Ingresos este mes"
          value={kpis ? fmtCurrency(kpis.revenueThisMonth) : '—'}
          badge={kpis && <GrowthBadge value={kpis.revenueGrowth} />}
          sub={kpis ? `${kpis.transactions} cobros` : undefined}
          accent="border-violet-100"
        />
        <KpiCard
          label="Miembros activos"
          value={kpis?.activeMembers ?? '—'}
          badge={kpis && <GrowthBadge value={0} />}
          sub={kpis ? `${kpis.retentionRate}% retención` : undefined}
        />
        <KpiCard
          label="Nuevos este mes"
          value={kpis?.newMembersThisMonth ?? '—'}
          badge={kpis && <GrowthBadge value={kpis.memberGrowth} />}
          sub={kpis ? `Total: ${kpis.totalMembers}` : undefined}
        />
        <KpiCard
          label="Sesiones workout (7d)"
          value={kpis?.workoutSessionsWeek ?? '—'}
          sub={kpis ? `${kpis.appointmentsNextWeek} citas próx.` : undefined}
        />
      </div>

      {/* KPI Cards — Row 2 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Pendiente de cobro"
          value={kpis ? fmtCurrency(kpis.pendingRevenue) : '—'}
          sub={kpis ? `${kpis.pendingCount} pagos pendientes` : undefined}
          accent="border-amber-100"
        />
        <KpiCard
          label="Riesgo de churn alto"
          value={kpis?.highRiskCount ?? '—'}
          sub="miembros con score ≥ 70"
          accent={kpis && kpis.highRiskCount > 0 ? 'border-red-100' : 'border-gray-100'}
        />
        <KpiCard
          label="Score riesgo prom."
          value={kpis ? `${kpis.avgRiskScore}/100` : '—'}
          sub="miembros activos + trial"
        />
        <KpiCard label="Total miembros" value={kpis?.totalMembers ?? '—'} sub="todos los estados" />
      </div>

      {/* Charts */}
      <AnalyticsCharts
        revenueTrend={revenueTrend ?? []}
        memberStatusDistribution={dashboard?.memberStatusDistribution ?? []}
        membershipBreakdown={membershipBreakdown ?? []}
      />
    </div>
  );
}
