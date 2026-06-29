import { serverFetch } from '@/lib/server-api';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';
import { BusinessCoach } from './business-coach';

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

interface RevenueBreakdown {
  period: { month_start: string; month_end: string };
  total_this_month: number;
  total_prev_month: number;
  mom_growth_pct: number | null;
  breakdown: {
    memberships: number;
    addons_recurring: number;
    marketplace: number;
    other: number;
  };
  addon_active_count: number;
  marketplace: { orders_count: number; revenue: number };
  top_products: { id: string; name: string; revenue: number; quantity: number }[];
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
  const [dashboard, revenueTrend, membershipBreakdown, revenueBreakdown] = await Promise.all([
    serverFetch<DashboardResponse>('/api/v1/analytics/dashboard'),
    serverFetch<RevenueTrendEntry[]>('/api/v1/analytics/revenue?months=6'),
    serverFetch<MembershipEntry[]>('/api/v1/analytics/memberships'),
    serverFetch<RevenueBreakdown>('/api/v1/analytics/revenue-breakdown'),
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

      {/* Revenue Breakdown — D-32 */}
      {revenueBreakdown && (
        <div className="rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Desglose de ingresos</h2>
              <p className="text-xs text-gray-500">
                {new Date(revenueBreakdown.period.month_start).toLocaleDateString('es-SV', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-violet-600">
                {fmtCurrency(revenueBreakdown.total_this_month)}
              </p>
              {revenueBreakdown.mom_growth_pct !== null && (
                <GrowthBadge value={revenueBreakdown.mom_growth_pct} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase text-blue-700">Membresías</p>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {fmtCurrency(revenueBreakdown.breakdown.memberships)}
              </p>
              <p className="text-xs text-gray-500">
                {revenueBreakdown.total_this_month > 0
                  ? Math.round(
                      (revenueBreakdown.breakdown.memberships / revenueBreakdown.total_this_month) *
                        100,
                    )
                  : 0}
                % del total
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-700">Add-ons (MRR)</p>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {fmtCurrency(revenueBreakdown.breakdown.addons_recurring)}
              </p>
              <p className="text-xs text-gray-500">
                {revenueBreakdown.addon_active_count} suscripciones activas
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase text-amber-700">Marketplace</p>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {fmtCurrency(revenueBreakdown.breakdown.marketplace)}
              </p>
              <p className="text-xs text-gray-500">
                {revenueBreakdown.marketplace.orders_count} órdenes
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-700">Otros</p>
              <p className="mt-2 text-xl font-bold text-gray-900">
                {fmtCurrency(revenueBreakdown.breakdown.other)}
              </p>
              <p className="text-xs text-gray-500">Day-passes, recargos, etc.</p>
            </div>
          </div>

          {revenueBreakdown.top_products.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">Top 5 productos del mes</h3>
              <div className="divide-y divide-gray-100">
                {revenueBreakdown.top_products.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.quantity} unidades</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{fmtCurrency(p.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <AnalyticsCharts
        revenueTrend={revenueTrend ?? []}
        memberStatusDistribution={dashboard?.memberStatusDistribution ?? []}
        membershipBreakdown={membershipBreakdown ?? []}
      />

      {/* Business Coach IA */}
      <BusinessCoach
        askAction={async (question: string) => {
          'use server';
          const res = await serverFetch<{ answer: string }>('/api/v1/analytics/coach', {
            method: 'POST',
            body: JSON.stringify({ question }),
          });
          return res?.answer ?? 'Sin respuesta del Business Coach.';
        }}
      />
    </div>
  );
}
