import type { Metadata } from 'next';
import Link from 'next/link';
import {
  UserCheck,
  Package,
  CalendarClock,
  MessageSquareWarning,
  UserPlus,
  CheckCircle2,
  ScanLine,
  Trophy,
} from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { formatCurrency } from '@/lib/utils';
import { DashboardExportButton } from './export-button';

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

interface AccessStats {
  todayGranted: number;
  todayDenied: number;
  weekGranted: number;
  recentLogs: {
    id: string;
    result: string;
    occurred_at: string;
    member: { id: string; first_name: string; last_name: string } | null;
  }[];
}

interface MarketplaceStats {
  pendingOrders: number;
}

interface AdminSession {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  capacity: number;
  enrolled_count: number;
  class_type: { name: string; color: string | null };
  trainer: { first_name: string; last_name: string } | null;
}

interface Complaint {
  id: string;
  created_at: string;
  member: { id: string; first_name: string; last_name: string } | null;
  notes: string | null;
}

interface PointsTransaction {
  id: string;
  type: string;
  description: string | null;
  created_at: string;
  member: { first_name: string; last_name: string };
}

interface LeadsStats {
  total: number;
  new: number;
  newThisWeek: number;
}

interface PendingPtRequest {
  id: string;
  scheduled_at: string;
  member: { id: string; first_name: string; last_name: string };
  staff: { id: string; first_name: string; last_name: string } | null;
}

interface ExpiringMembership {
  id: string;
  end_date: string;
  member: { id: string; first_name: string; last_name: string };
  type: { name: string };
}

interface AtRiskMember {
  id: string;
  first_name: string;
  last_name: string;
  risk_score: number;
  status: string;
  user?: { email?: string | null } | null;
}

interface NewLead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  created_at: string;
  assignee: { first_name: string; last_name: string } | null;
}

interface MarketplaceOrderRow {
  id: string;
  status: string;
  total: string | number;
  created_at: string;
  member: { first_name: string; last_name: string } | null;
  items: { product: { name: string } | null; quantity: number }[];
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

const GAMIFICATION_LABELS: Record<string, string> = {
  PR_ACHIEVED: 'nuevo PR 🏆',
  BADGE_UNLOCKED: 'desbloqueó una insignia 🎖️',
};

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-gray-400">Sin cambio</span>;
  const isPositive = value > 0;
  return (
    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-300'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' });
}

function AttentionRow({
  icon: Icon,
  label,
  count,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  href: string;
}) {
  const needsAction = count > 0;
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gray-50"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          needsAction ? 'bg-orange-50 text-[#ff5a1f]' : 'bg-emerald-50 text-emerald-600'
        }`}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
      </div>
      {needsAction ? (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff5a1f] px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      ) : (
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      )}
    </Link>
  );
}

export default async function DashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const sessionsQs = `startDate=${todayStart.toISOString()}&endDate=${todayEnd.toISOString()}`;

  const [
    dashboard,
    access,
    marketplace,
    todaySessions,
    complaints,
    transactions,
    leads,
    pendingPt,
    expiringMemberships,
    atRiskMembersRes,
    newLeadsList,
    pendingOrdersByStatus,
  ] = await Promise.all([
    serverFetch<DashboardData>('/api/v1/analytics/dashboard'),
    serverFetch<AccessStats>('/api/v1/access/stats'),
    serverFetch<MarketplaceStats>('/api/v1/marketplace/stats'),
    serverFetch<AdminSession[]>(`/api/v1/schedule/admin/sessions?${sessionsQs}`),
    serverFetch<Complaint[]>('/api/v1/feedback/open-complaints'),
    serverFetch<PointsTransaction[]>('/api/v1/gamification/admin/transactions'),
    serverFetch<LeadsStats>('/api/v1/leads/stats'),
    serverFetch<PendingPtRequest[]>('/api/v1/pt-sessions/pending/gym'),
    serverFetch<ExpiringMembership[]>('/api/v1/members/expiring-soon?days=7'),
    serverFetch<{ data: AtRiskMember[] }>('/api/v1/members?minRiskScore=70&limit=100'),
    serverFetch<NewLead[]>('/api/v1/leads?status=NEW'),
    Promise.all(
      ['PENDING', 'CONFIRMED', 'READY'].map((status) =>
        serverFetch<{ data: MarketplaceOrderRow[] }>(
          `/api/v1/marketplace-orders?status=${status}&limit=100`,
        ),
      ),
    ),
  ]);

  const kpis = dashboard?.kpis;
  const distribution = dashboard?.memberStatusDistribution ?? [];
  const recentWins = (transactions ?? [])
    .filter((t) => t.type === 'PR_ACHIEVED' || t.type === 'BADGE_UNLOCKED')
    .slice(0, 5);
  const atRiskMembers = atRiskMembersRes?.data ?? [];
  const pendingOrders = pendingOrdersByStatus.flatMap((r) => r?.data ?? []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-widest text-[#ff5a1f]">
            GymApp · Operación diaria
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Panel de Control</h1>
          <p className="text-sm text-gray-500">Qué necesita tu atención hoy en el gym</p>
        </div>
        <DashboardExportButton
          atRiskMembers={atRiskMembers}
          pendingPt={pendingPt ?? []}
          expiringMemberships={expiringMemberships ?? []}
          complaints={complaints ?? []}
          newLeads={newLeadsList ?? []}
          pendingOrders={pendingOrders}
          todaySessions={todaySessions ?? []}
          recentWins={recentWins}
        />
      </div>

      {/* Scoreboard — pulso general */}
      <div className="grid grid-cols-2 divide-x divide-white/10 overflow-hidden rounded-2xl bg-[#15171c] shadow-sm lg:grid-cols-4">
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
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">
            Check-ins hoy
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
            {access?.todayGranted ?? '—'}
          </p>
          <p className="mt-1.5 text-xs text-white/50">
            {access ? `${access.weekGranted} en los últimos 7 días` : ''}
          </p>
        </div>
        <div className="p-5">
          <Link href="/analytics" className="block">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">
              Ingresos del mes
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
              {kpis ? formatCurrency(kpis.revenueThisMonth) : '—'}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/50">
              {kpis && <GrowthBadge value={kpis.revenueGrowth} />} ver detalle →
            </p>
          </Link>
        </div>
        <div className="p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/45">
            Riesgo de churn alto
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-white">
            {kpis?.highRiskCount ?? '—'}
          </p>
          <p className="mt-1.5 text-xs text-white/50">
            {kpis ? `score prom. ${kpis.avgRiskScore}/100` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Requiere tu atención hoy */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-900">Requiere tu atención hoy</h2>
          <p className="mb-3 text-xs text-gray-400">Pendientes que necesitan una acción</p>
          <div className="space-y-1">
            <AttentionRow
              icon={UserCheck}
              label="Sesiones PT por aprobar"
              count={pendingPt?.length ?? 0}
              href="/crm/pt-sessions"
            />
            <AttentionRow
              icon={Package}
              label="Órdenes de marketplace por surtir"
              count={marketplace?.pendingOrders ?? 0}
              href="/marketplace"
            />
            <AttentionRow
              icon={CalendarClock}
              label="Membresías que vencen esta semana"
              count={expiringMemberships?.length ?? 0}
              href="/members"
            />
            <AttentionRow
              icon={MessageSquareWarning}
              label="Quejas abiertas"
              count={complaints?.length ?? 0}
              href="/feedback"
            />
            <AttentionRow
              icon={UserPlus}
              label="Leads nuevos esta semana"
              count={leads?.newThisWeek ?? 0}
              href="/leads"
            />
          </div>
        </div>

        {/* Clases de hoy */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-semibold text-gray-900">Clases de hoy</h2>
          <p className="mb-3 text-xs text-gray-400">
            {todaySessions?.length ? `${todaySessions.length} programadas` : 'Sin clases hoy'}
          </p>
          {!todaySessions || todaySessions.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No hay clases programadas hoy</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {todaySessions.slice(0, 6).map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: s.class_type.color ?? '#0b3b5c' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {s.class_type.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtTime(s.scheduled_at)}
                      {s.trainer && ` · ${s.trainer.first_name} ${s.trainer.last_name}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-gray-600">
                    {s.enrolled_count}/{s.capacity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Distribución por estado */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Distribución por estado</h2>
            <Link
              href="/members"
              className="text-xs font-medium text-[#ff5a1f] hover:text-[#e64f18]"
            >
              Ver todos →
            </Link>
          </div>

          {distribution.length === 0 ? (
            <p className="py-4 text-sm text-gray-400">Sin datos disponibles</p>
          ) : (
            <ul className="space-y-2.5">
              {distribution.map((entry) => {
                const cfg = STATUS_CONFIG[entry.status] ?? {
                  label: entry.status,
                  className: 'bg-gray-100 text-gray-600 ring-gray-200',
                };
                const total = distribution.reduce((s, e) => s + e.count, 0);
                const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                return (
                  <li key={entry.status} className="flex items-center gap-3">
                    <span
                      className={`inline-flex w-32 shrink-0 items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#0b3b5c] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono text-sm font-semibold tabular-nums text-gray-900">
                      {entry.count}
                    </span>
                    <span className="w-8 text-right text-xs text-gray-400">{pct}%</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Actividad reciente</h2>
          {access?.recentLogs.length || recentWins.length ? (
            <div className="space-y-3">
              {recentWins.map((w) => (
                <div key={w.id} className="flex items-start gap-2.5 text-sm">
                  <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-gray-700">
                    <span className="font-medium">
                      {w.member.first_name} {w.member.last_name}
                    </span>{' '}
                    {GAMIFICATION_LABELS[w.type] ?? w.type.toLowerCase()}
                    <span className="ml-1.5 text-xs text-gray-400">{fmtDate(w.created_at)}</span>
                  </p>
                </div>
              ))}
              {access?.recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 text-sm">
                  <ScanLine className="mt-0.5 h-4 w-4 shrink-0 text-[#0b3b5c]" />
                  <p className="text-gray-700">
                    <span className="font-medium">
                      {log.member ? `${log.member.first_name} ${log.member.last_name}` : 'Miembro'}
                    </span>{' '}
                    {log.result === 'GRANTED' ? 'ingresó al gym' : 'acceso denegado'}
                    <span className="ml-1.5 text-xs text-gray-400">{fmtTime(log.occurred_at)}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-sm text-gray-400">Sin actividad reciente</p>
          )}
        </div>
      </div>

      {/* Quick-access links */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Accesos rápidos</h2>
        <nav className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { href: '/members/new', label: 'Nuevo miembro', icon: '👤' },
            { href: '/members', label: 'Gestionar miembros', icon: '🏋️' },
            { href: '/crm/pt-sessions', label: 'Sesiones PT', icon: '🤝' },
            { href: '/access', label: 'Control de acceso', icon: '📷' },
            { href: '/membership-types', label: 'Planes', icon: '📋' },
            { href: '/staff', label: 'Staff', icon: '👥' },
            { href: '/analytics', label: 'Analytics', icon: '📊' },
            { href: '/settings', label: 'Configuración', icon: '⚙️' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#ff5a1f]/30 hover:bg-orange-50"
            >
              <span className="text-base leading-none">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
