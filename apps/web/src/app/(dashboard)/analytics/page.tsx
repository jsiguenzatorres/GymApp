import { ShoppingBag, AlertTriangle, TrendingUp, Users, CreditCard } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';
import { BusinessCoach } from './business-coach';
import { AnalyticsExportButton } from './export-button';

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

// Paleta de categorías — consistente entre la barra de composición, la
// leyenda y la dona de marketplace. El naranja queda reservado como acento
// de marca (marketplace); el resto usa tonos estructurales/semánticos.
const CATEGORY_STYLE = {
  memberships: { bar: 'bg-[#0b3b5c]', dot: 'bg-[#0b3b5c]' },
  nutrition: { bar: 'bg-emerald-600', dot: 'bg-emerald-600' },
  addons: { bar: 'bg-violet-500', dot: 'bg-violet-500' },
  marketplace: { bar: 'bg-[#ff5a1f]', dot: 'bg-[#ff5a1f]' },
  other: { bar: 'bg-gray-400', dot: 'bg-gray-400' },
} as const;

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400">Sin cambio</span>;
  const isPos = value > 0;
  return (
    <span className={`text-xs font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPos ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

function StatChip({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

interface Category {
  key: keyof typeof CATEGORY_STYLE;
  label: string;
  value: number;
  sub?: string;
}

// Barra de composición + leyenda, reutilizada tanto para ingresos como deuda
// (mismo lenguaje visual — cambia solo la paleta según el contexto).
function CompositionBreakdown({ categories, total }: { categories: Category[]; total: number }) {
  const visible = categories.filter((c) => c.value > 0 || total === 0);
  return (
    <div>
      <div className="mb-4 flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100">
        {categories.map((c) => {
          const pct = total > 0 ? (c.value / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={c.key}
              className={CATEGORY_STYLE[c.key].bar}
              style={{ width: `${pct}%` }}
              title={`${c.label}: ${fmtCurrency(c.value)}`}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(visible.length > 0 ? visible : categories).map((c) => {
          const pct = total > 0 ? Math.round((c.value / total) * 1000) / 10 : 0;
          return (
            <div key={c.key} className="rounded-lg bg-gray-50 p-3.5">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${CATEGORY_STYLE[c.key].dot}`} />
                <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-gray-500">
                  {c.label}
                </p>
              </div>
              <p className="mt-2 text-lg font-bold tabular-nums text-gray-900">
                {fmtCurrency(c.value)}
              </p>
              <p className="text-xs text-gray-400">{c.sub ?? `${pct}% del total`}</p>
            </div>
          );
        })}
      </div>
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
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#ff5a1f]"
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
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#ff5a1f]"
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
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#ff5a1f]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Hasta</label>
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#ff5a1f]"
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-lg bg-[#ff5a1f] px-4 text-sm font-medium text-white transition-colors hover:bg-[#e64f18]"
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

  const revenueCategories: Category[] = finance
    ? [
        { key: 'memberships', label: 'Membresías', value: finance.revenue.memberships },
        { key: 'nutrition', label: 'Planes nutricionales', value: finance.revenue.nutrition_plans },
        { key: 'addons', label: 'Otros add-ons', value: finance.revenue.other_addons },
        {
          key: 'marketplace',
          label: 'Marketplace',
          value: finance.revenue.marketplace,
          sub: `${finance.marketplace.orders_count} órdenes`,
        },
        {
          key: 'other',
          label: 'Otros pagos',
          value: finance.revenue.other,
          sub: 'Day-passes, recargos, etc.',
        },
      ]
    : [];

  const debtCategories: Category[] = finance
    ? [
        {
          key: 'memberships',
          label: 'Membresías pendientes',
          value: finance.debt.memberships_pending,
          sub: `${finance.debt.memberships_pending_count} pago(s)`,
        },
        {
          key: 'other',
          label: 'Otros pagos pendientes',
          value: finance.debt.other_pending,
          sub: `${finance.debt.other_pending_count} pago(s)`,
        },
        {
          key: 'marketplace',
          label: 'Crédito de tienda',
          value: finance.debt.store_credit,
          sub: `${finance.debt.store_credit_debtor_count} miembro(s) con saldo negativo`,
        },
      ]
    : [];

  // Dona de marketplace por categoría — stops de conic-gradient calculados
  // a partir de los porcentajes reales.
  const donutColors = ['#ff5a1f', '#0b3b5c', '#059669', '#a78bfa', '#9ca3af'];
  let donutCursor = 0;
  const donutStops = finance
    ? finance.marketplace.by_category.map((c, i) => {
        const pct =
          finance.marketplace.revenue > 0 ? (c.revenue / finance.marketplace.revenue) * 100 : 0;
        const from = donutCursor;
        donutCursor += pct;
        return {
          ...c,
          color: donutColors[i % donutColors.length],
          from,
          to: donutCursor,
        };
      })
    : [];
  const donutGradient = donutStops.length
    ? `conic-gradient(${donutStops.map((s) => `${s.color} ${s.from}% ${s.to}%`).join(', ')})`
    : undefined;
  const maxPaymentAmount = finance
    ? Math.max(...finance.payment_methods.map((p) => p.amount), 1)
    : 1;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#ff5a1f]">
            GymApp · Panel Ejecutivo
          </p>
          <h1 className="text-2xl font-bold text-gray-900">Rendimiento financiero</h1>
          <p className="text-sm text-gray-500">
            Ingresos, deuda y salud del negocio — en tiempo real
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <PeriodFilterForm
            year={params.year}
            month={params.month}
            from={params.from}
            to={params.to}
          />
          <AnalyticsExportButton
            finance={finance}
            revenueTrend={revenueTrend ?? []}
            membershipBreakdown={membershipBreakdown ?? []}
            memberStatusDistribution={dashboard?.memberStatusDistribution ?? []}
          />
        </div>
      </div>

      {/* Scoreboard — pulso financiero del período seleccionado */}
      <div className="grid grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-2xl bg-[#15171c] shadow-sm lg:grid-cols-4">
        <div className="p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">
            Ingresos del período
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
            {finance ? fmtCurrency(finance.total_revenue) : '—'}
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
            {finance?.growth_pct !== null && finance?.growth_pct !== undefined && (
              <span
                className={
                  finance.growth_pct >= 0
                    ? 'font-semibold text-emerald-400'
                    : 'font-semibold text-red-300'
                }
              >
                {finance.growth_pct >= 0 ? '▲' : '▼'} {Math.abs(finance.growth_pct)}%
              </span>
            )}
            vs período anterior
          </p>
        </div>
        <div className="p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">
            Miembros activos
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
            {kpis?.activeMembers ?? '—'}
          </p>
          <p className="mt-1.5 text-xs text-white/50">
            {kpis ? `${kpis.retentionRate}% retención` : ''}
          </p>
        </div>
        <div className="p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">ARPU</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
            {finance ? fmtCurrency(finance.insights.arpu) : '—'}
          </p>
          <p className="mt-1.5 text-xs text-white/50">ingreso por miembro activo</p>
        </div>
        <div className="p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">
            Riesgo de churn alto
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
            {kpis?.highRiskCount ?? '—'}
          </p>
          <p className="mt-1.5 text-xs text-red-300">
            {finance ? `${fmtCurrency(finance.insights.revenue_at_risk)} en riesgo/mes` : ''}
          </p>
        </div>
      </div>

      {/* Stats secundarios */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatChip
          label="Nuevos este mes"
          value={kpis?.newMembersThisMonth ?? '—'}
          sub={kpis ? `Total: ${kpis.totalMembers}` : undefined}
        />
        <StatChip
          label="Sesiones workout (7d)"
          value={kpis?.workoutSessionsWeek ?? '—'}
          sub={kpis ? `${kpis.appointmentsNextWeek} citas próx.` : undefined}
        />
        <StatChip
          label="Score riesgo prom."
          value={kpis ? `${kpis.avgRiskScore}/100` : '—'}
          sub="miembros activos + trial"
        />
        <StatChip
          label="Total miembros"
          value={kpis?.totalMembers ?? '—'}
          sub="todos los estados"
        />
      </div>

      {/* Ingresos por categoría */}
      {finance && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Ingresos por categoría</h2>
              <p className="text-xs capitalize text-gray-500">{periodLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-3xl font-bold tabular-nums text-[#ff5a1f]">
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

          <CompositionBreakdown categories={revenueCategories} total={finance.total_revenue} />

          {/* Insights */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-orange-50/60 p-3">
              <TrendingUp className="h-5 w-5 shrink-0 text-[#ff5a1f]" />
              <div>
                <p className="text-xs text-gray-500">ARPU (ingreso por miembro)</p>
                <p className="text-sm font-bold tabular-nums text-gray-900">
                  {fmtCurrency(finance.insights.arpu)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-red-50/60 p-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-xs text-gray-500">Ingreso mensual en riesgo</p>
                <p className="text-sm font-bold tabular-nums text-gray-900">
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
                <p className="text-sm font-bold tabular-nums text-gray-900">
                  {finance.insights.active_members}
                </p>
              </div>
            </div>
          </div>

          {/* Marketplace por categoría + top productos + métodos de pago */}
          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 lg:grid-cols-3">
            {finance.marketplace.by_category.length > 0 && (
              <div>
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <ShoppingBag className="h-4 w-4" /> Marketplace por categoría
                </h3>
                <div className="flex items-center gap-5">
                  <div
                    className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                    style={{ background: donutGradient }}
                  >
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white text-center">
                      <strong className="font-mono text-sm font-bold text-gray-900">
                        {fmtCurrency(finance.marketplace.revenue)}
                      </strong>
                      <span className="text-[0.6rem] uppercase tracking-wide text-gray-400">
                        total
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {donutStops.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: s.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-gray-500">{s.name}</span>
                        <span className="font-mono font-semibold text-gray-900">
                          {fmtCurrency(s.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
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
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dfe9ef] text-xs font-bold text-[#0b3b5c]">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.quantity} unidades</p>
                        </div>
                      </div>
                      <p className="font-mono text-sm font-bold tabular-nums text-gray-900">
                        {fmtCurrency(p.revenue)}
                      </p>
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
                <div className="space-y-2.5">
                  {finance.payment_methods.map((pm) => (
                    <div key={pm.type} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-gray-500">
                        {PAYMENT_METHOD_LABELS[pm.type] ?? pm.type}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#0b3b5c]"
                          style={{ width: `${(pm.amount / maxPaymentAmount) * 100}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-gray-900">
                        {fmtCurrency(pm.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deuda acumulada */}
      {finance && (
        <div className="rounded-xl border border-red-100 bg-gradient-to-b from-red-50/50 to-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deuda acumulada</h2>
              <p className="text-xs text-gray-500">Pagos pendientes/fallidos + crédito de tienda</p>
            </div>
            <p className="font-mono text-3xl font-bold tabular-nums text-red-500">
              {fmtCurrency(finance.debt.total)}
            </p>
          </div>

          <CompositionBreakdown categories={debtCategories} total={finance.debt.total} />
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
