import {
  Wallet,
  Apple,
  Layers,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Users,
  CreditCard,
} from 'lucide-react';
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

interface FinanceBreakdown {
  period: { start: string; end: string };
  total_revenue: number;
  total_prev_revenue: number;
  growth_pct: number | null;
  revenue: {
    memberships: number;
    nutrition_plans: number;
    other_addons: number;
    marketplace: number;
    other: number;
  };
  marketplace: {
    orders_count: number;
    revenue: number;
    by_category: { name: string; revenue: number }[];
  };
  top_products: { id: string; name: string; revenue: number; quantity: number }[];
  payment_methods: { type: string; amount: number }[];
  debt: {
    total: number;
    memberships_pending: number;
    memberships_pending_count: number;
    other_pending: number;
    other_pending_count: number;
    store_credit: number;
    store_credit_debtor_count: number;
  };
  insights: {
    arpu: number;
    active_members: number;
    revenue_at_risk: number;
    at_risk_member_count: number;
  };
}

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string; from?: string; to?: string }>;
}

function fmtCurrency(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia',
  STRIPE: 'Stripe',
  MERCADOPAGO: 'MercadoPago',
  OTHER: 'Otro',
};

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

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

function CategoryCard({
  icon: Icon,
  label,
  value,
  sub,
  total,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  total: number;
  iconBg: string;
  iconColor: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</p>
      </div>
      <p className="mt-3 text-xl font-bold text-gray-900">{fmtCurrency(value)}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${iconColor.replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400">{sub ?? `${pct}% del total`}</p>
    </div>
  );
}

function PeriodFilterForm({
  year,
  month,
  from,
  to,
}: {
  year?: string;
  month?: string;
  from?: string;
  to?: string;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const isCustomRange = Boolean(from || to);

  return (
    <form
      method="GET"
      className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Año</label>
        <select
          name="year"
          defaultValue={year ?? String(currentYear)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-violet-400"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Mes</label>
        <select
          name="month"
          defaultValue={month ?? String(new Date().getMonth() + 1)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-violet-400"
        >
          <option value="">Todo el año</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <span className="pb-2 text-xs text-gray-300">|</span>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Desde (rango personalizado)</label>
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-violet-400"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Hasta</label>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-violet-400"
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-700"
      >
        Aplicar
      </button>
      {(year || month || isCustomRange) && (
        <a
          href="/analytics"
          className="flex h-9 items-center rounded-lg border border-gray-200 px-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
        >
          Restablecer
        </a>
      )}
    </form>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const financeQs = new URLSearchParams();
  if (params.from && params.to) {
    financeQs.set('from', params.from);
    financeQs.set('to', params.to);
  } else {
    if (params.year) financeQs.set('year', params.year);
    if (params.month) financeQs.set('month', params.month);
  }

  const [dashboard, revenueTrend, membershipBreakdown, finance] = await Promise.all([
    serverFetch<DashboardResponse>('/api/v1/analytics/dashboard'),
    serverFetch<RevenueTrendEntry[]>('/api/v1/analytics/revenue?months=6'),
    serverFetch<MembershipEntry[]>('/api/v1/analytics/memberships'),
    serverFetch<FinanceBreakdown>(`/api/v1/analytics/revenue-breakdown?${financeQs.toString()}`),
  ]);

  const kpis = dashboard?.kpis;
  const periodLabel = finance
    ? new Date(finance.period.start + 'T12:00:00').toLocaleDateString('es-SV', {
        day: params.from ? 'numeric' : undefined,
        month: 'long',
        year: 'numeric',
      }) +
      (finance.period.start.slice(0, 7) !== finance.period.end.slice(0, 7)
        ? ` — ${new Date(finance.period.end + 'T12:00:00').toLocaleDateString('es-SV', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`
        : '')
    : '';

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Ejecutivo</h1>
          <p className="text-sm text-gray-500">KPIs y tendencias de tu gym en tiempo real</p>
        </div>
        <PeriodFilterForm
          year={params.year}
          month={params.month}
          from={params.from}
          to={params.to}
        />
      </div>

      {/* KPI Cards — Row 1 (snapshot actual, no depende del filtro de período) */}
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

      {/* Desglose financiero por categoría — con filtro de período */}
      {finance && (
        <div className="rounded-xl border border-violet-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ingresos por categoría</h2>
              <p className="text-xs capitalize text-gray-500">{periodLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-violet-600">
                {fmtCurrency(finance.total_revenue)}
              </p>
              {finance.growth_pct !== null && (
                <div className="flex items-center justify-end gap-1">
                  <GrowthBadge value={finance.growth_pct} />
                  <span className="text-xs text-gray-400">vs período anterior</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <CategoryCard
              icon={Wallet}
              label="Membresías"
              value={finance.revenue.memberships}
              total={finance.total_revenue}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <CategoryCard
              icon={Apple}
              label="Planes nutricionales"
              value={finance.revenue.nutrition_plans}
              total={finance.total_revenue}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <CategoryCard
              icon={Layers}
              label="Otros add-ons"
              value={finance.revenue.other_addons}
              total={finance.total_revenue}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
            />
            <CategoryCard
              icon={ShoppingBag}
              label="Marketplace"
              value={finance.revenue.marketplace}
              total={finance.total_revenue}
              sub={`${finance.marketplace.orders_count} órdenes`}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
            <CategoryCard
              icon={Receipt}
              label="Otros pagos"
              value={finance.revenue.other}
              total={finance.total_revenue}
              sub="Day-passes, recargos, etc."
              iconBg="bg-gray-200"
              iconColor="text-gray-600"
            />
          </div>

          {/* Insights */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-violet-50/60 p-3">
              <TrendingUp className="h-5 w-5 shrink-0 text-violet-500" />
              <div>
                <p className="text-xs text-gray-500">ARPU (ingreso por miembro)</p>
                <p className="text-sm font-bold text-gray-900">
                  {fmtCurrency(finance.insights.arpu)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-red-50/60 p-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Ingreso mensual en riesgo</p>
                <p className="text-sm font-bold text-gray-900">
                  {fmtCurrency(finance.insights.revenue_at_risk)}{' '}
                  <span className="font-normal text-gray-400">
                    ({finance.insights.at_risk_member_count} miembros)
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Users className="h-5 w-5 shrink-0 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500">Miembros activos considerados</p>
                <p className="text-sm font-bold text-gray-900">{finance.insights.active_members}</p>
              </div>
            </div>
          </div>

          {/* Marketplace por categoría + top productos + métodos de pago */}
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 lg:grid-cols-3">
            {finance.marketplace.by_category.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Marketplace por categoría
                </h3>
                <div className="space-y-2">
                  {finance.marketplace.by_category.map((c) => (
                    <div key={c.name} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{c.name}</span>
                      <span className="font-semibold text-gray-900">{fmtCurrency(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {finance.top_products.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Top 5 productos</h3>
                <div className="divide-y divide-gray-100">
                  {finance.top_products.map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
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

            {finance.payment_methods.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <CreditCard className="h-4 w-4" /> Métodos de pago
                </h3>
                <div className="space-y-2">
                  {finance.payment_methods.map((pm) => (
                    <div key={pm.type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {PAYMENT_METHOD_LABELS[pm.type] ?? pm.type}
                      </span>
                      <span className="font-semibold text-gray-900">{fmtCurrency(pm.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deuda acumulada por categoría — mismo período */}
      {finance && (
        <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deuda acumulada</h2>
              <p className="text-xs text-gray-500">Pagos pendientes/fallidos + crédito de tienda</p>
            </div>
            <p className="text-3xl font-bold text-red-500">{fmtCurrency(finance.debt.total)}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CategoryCard
              icon={Wallet}
              label="Membresías pendientes"
              value={finance.debt.memberships_pending}
              sub={`${finance.debt.memberships_pending_count} pago(s)`}
              total={finance.debt.total}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <CategoryCard
              icon={Receipt}
              label="Otros pagos pendientes"
              value={finance.debt.other_pending}
              sub={`${finance.debt.other_pending_count} pago(s)`}
              total={finance.debt.total}
              iconBg="bg-gray-200"
              iconColor="text-gray-600"
            />
            <CategoryCard
              icon={ShoppingBag}
              label="Crédito de tienda"
              value={finance.debt.store_credit}
              sub={`${finance.debt.store_credit_debtor_count} miembro(s) con saldo negativo`}
              total={finance.debt.total}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
            />
          </div>
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
