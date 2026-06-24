import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard — GymApp' };

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

interface DashboardData {
  kpis: DashboardKpis;
  memberStatusDistribution: { status: string; count: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Activos', className: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  TRIAL: { label: 'Trial', className: 'bg-blue-100 text-blue-700 ring-blue-200' },
  FREEZE: { label: 'Congelados', className: 'bg-sky-100 text-sky-700 ring-sky-200' },
  EXPIRED: { label: 'Expirados', className: 'bg-amber-100 text-amber-700 ring-amber-200' },
  PRE_CANCEL: {
    label: 'Pre-Cancelación',
    className: 'bg-orange-100 text-orange-700 ring-orange-200',
  },
  CANCELLED: { label: 'Cancelados', className: 'bg-red-100 text-red-700 ring-red-200' },
  LEAD: { label: 'Leads', className: 'bg-zinc-100 text-zinc-600 ring-zinc-200' },
};

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">Sin cambio</span>;
  const isPositive = value > 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  badge,
  accentClass,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  badge?: React.ReactNode;
  accentClass?: string;
  href?: string;
}) {
  const inner = (
    <div
      className={`rounded-xl border bg-card p-5 shadow-sm transition-colors ${accentClass ?? 'border-border'} ${href ? 'hover:border-violet-300 hover:shadow-md' : ''}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">{value}</p>
      <div className="mt-1.5 flex items-center gap-2 min-h-[1.25rem]">
        {badge}
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export default async function DashboardPage() {
  const data = await serverFetch<DashboardData>('/api/v1/analytics/dashboard');

  const kpis = data?.kpis;
  const distribution = data?.memberStatusDistribution ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-sm text-muted-foreground">Resumen de actividad del gimnasio</p>
      </div>

      {/* KPI row 1 — primary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Miembros Activos"
          value={kpis?.activeMembers ?? '—'}
          badge={kpis && <GrowthBadge value={kpis.memberGrowth} />}
          sub={kpis ? `${kpis.retentionRate}% retención` : undefined}
          accentClass="border-violet-200"
          href="/members?status=ACTIVE"
        />
        <KpiCard
          label="Ingresos del Mes"
          value={kpis ? formatCurrency(kpis.revenueThisMonth) : '—'}
          badge={kpis && <GrowthBadge value={kpis.revenueGrowth} />}
          sub={kpis ? `${kpis.transactions} transacciones` : undefined}
          accentClass="border-emerald-200"
          href="/analytics"
        />
        <KpiCard
          label="Sesiones Workout (7d)"
          value={kpis?.workoutSessionsWeek ?? '—'}
          sub={kpis ? `${kpis.appointmentsNextWeek} citas próximas` : undefined}
        />
        <KpiCard
          label="Riesgo de Churn"
          value={kpis?.highRiskCount ?? '—'}
          sub={kpis ? `Score prom: ${kpis.avgRiskScore}/100` : undefined}
          accentClass={kpis && kpis.highRiskCount > 0 ? 'border-red-200' : 'border-border'}
          href="/members"
        />
      </div>

      {/* KPI row 2 — secondary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Nuevos Este Mes"
          value={kpis?.newMembersThisMonth ?? '—'}
          sub={kpis ? `Total: ${kpis.totalMembers} miembros` : undefined}
          href="/members"
        />
        <KpiCard
          label="Pendiente de Cobro"
          value={kpis ? formatCurrency(kpis.pendingRevenue) : '—'}
          sub={kpis ? `${kpis.pendingCount} pagos pendientes` : undefined}
          accentClass={kpis && kpis.pendingCount > 0 ? 'border-amber-200' : 'border-border'}
        />
        <KpiCard
          label="Total Miembros"
          value={kpis?.totalMembers ?? '—'}
          sub="Todos los estados"
          href="/members"
        />
        <KpiCard
          label="Score Riesgo Prom."
          value={kpis ? `${kpis.avgRiskScore}/100` : '—'}
          sub="Miembros activos y trial"
        />
      </div>

      {/* Distribution + Quick links */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member status distribution */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Distribución por Estado</h2>
            <Link
              href="/members"
              className="text-xs text-violet-600 hover:text-violet-800 font-medium"
            >
              Ver todos →
            </Link>
          </div>

          {distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sin datos disponibles</p>
          ) : (
            <ul className="space-y-2.5">
              {distribution.map((entry) => {
                const cfg = STATUS_CONFIG[entry.status] ?? {
                  label: entry.status,
                  className: 'bg-muted text-muted-foreground ring-border',
                };
                const total = distribution.reduce((s, e) => s + e.count, 0);
                const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                return (
                  <li key={entry.status} className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className} w-32 justify-center shrink-0`}
                    >
                      {cfg.label}
                    </span>
                    <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground w-8 text-right">
                      {entry.count}
                    </span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quick-access links */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Accesos Rápidos</h2>
          <nav className="grid grid-cols-2 gap-3">
            {[
              {
                href: '/members/new',
                label: 'Nuevo miembro',
                icon: '👤',
                color: 'bg-violet-50 hover:bg-violet-100 text-violet-700',
              },
              {
                href: '/members',
                label: 'Gestionar miembros',
                icon: '🏋️',
                color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700',
              },
              {
                href: '/membership-types',
                label: 'Planes',
                icon: '📋',
                color: 'bg-amber-50 hover:bg-amber-100 text-amber-700',
              },
              {
                href: '/staff',
                label: 'Staff',
                icon: '👥',
                color: 'bg-sky-50 hover:bg-sky-100 text-sky-700',
              },
              {
                href: '/analytics',
                label: 'Analytics',
                icon: '📊',
                color: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
              },
              {
                href: '/settings',
                label: 'Configuración',
                icon: '⚙️',
                color: 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700',
              },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${link.color}`}
              >
                <span className="text-base leading-none">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
