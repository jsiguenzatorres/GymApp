import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { RiskScoreBadge } from '@/components/crm/risk-score-badge';
import { AppointmentStatus, InteractionType, INTERACTION_TYPE_LABELS } from '@gymapp/shared-types';
import { SeedKnowledgeButton } from './seed-knowledge-button';

interface RiskMember {
  id: string;
  first_name: string;
  last_name: string;
  risk_score: number;
  status: string;
  avatar_url: string | null;
}

interface Appointment {
  id: string;
  title: string;
  appointment_type: string;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_min: number;
  member: { id: string; first_name: string; last_name: string };
  staff?: { user: { first_name: string; last_name: string } } | null;
}

interface Interaction {
  id: string;
  interaction_type: InteractionType;
  subject: string | null;
  occurred_at: string;
  sentiment: string | null;
  member: { id: string; first_name: string; last_name: string };
}

interface CrmOverview {
  riskAlerts: RiskMember[];
  upcomingAppointments: Appointment[];
  recentInteractions: Interaction[];
  pendingFollowUps: number;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: 'text-emerald-600',
  NEGATIVE: 'text-red-500',
  NEUTRAL: 'text-gray-500',
};

export default async function CrmPage() {
  const overview = await serverFetch<CrmOverview>('/api/v1/crm/overview');

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
          <p className="text-sm text-gray-500">Gestión de relaciones y retención de miembros</p>
        </div>
        <div className="flex gap-3">
          <SeedKnowledgeButton />
          <Link
            href="/crm/aria"
            className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
          >
            Chat ARIA
          </Link>
          <Link
            href="/crm/appointments"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver citas
          </Link>
          <Link
            href="/crm/appointments/new"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            + Agendar cita
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Miembros en riesgo"
          value={overview?.riskAlerts.length ?? 0}
          sub="score ≥ 70"
          color="red"
        />
        <StatCard
          label="Citas próximas"
          value={overview?.upcomingAppointments.length ?? 0}
          sub="próximos 7 días"
          color="blue"
        />
        <StatCard
          label="Seguimientos pendientes"
          value={overview?.pendingFollowUps ?? 0}
          sub="follow-up sin cerrar"
          color="amber"
        />
        <StatCard
          label="Interacciones recientes"
          value={overview?.recentInteractions.length ?? 0}
          sub="últimos registros"
          color="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Alerts */}
        <section className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">
            <span className="mr-2 text-red-500">⚠</span>Alertas de riesgo
          </h2>
          {!overview?.riskAlerts.length ? (
            <p className="text-sm text-gray-500">Sin miembros en riesgo alto. ¡Excelente!</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {overview.riskAlerts.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3">
                  <Link
                    href={`/members/${m.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-medium text-violet-700">
                      {m.first_name[0]}
                      {m.last_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.first_name} {m.last_name}
                      </p>
                      <p className="text-xs capitalize text-gray-500">{m.status.toLowerCase()}</p>
                    </div>
                  </Link>
                  <RiskScoreBadge score={m.risk_score} showLabel={false} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming Appointments */}
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Próximas citas</h2>
            <Link href="/crm/appointments" className="text-xs text-violet-600 hover:underline">
              Ver todas
            </Link>
          </div>
          {!overview?.upcomingAppointments.length ? (
            <p className="text-sm text-gray-500">Sin citas en los próximos 7 días.</p>
          ) : (
            <ul className="space-y-3">
              {overview.upcomingAppointments.map((a) => (
                <li key={a.id} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.title}</p>
                      <p className="text-xs text-gray-500">
                        {a.member.first_name} {a.member.last_name}
                        {a.staff ? ` · ${a.staff.user.first_name} ${a.staff.user.last_name}` : ''}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-gray-500">
                      {fmtTime(a.scheduled_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent Interactions */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Interacciones recientes</h2>
        {!overview?.recentInteractions.length ? (
          <p className="text-sm text-gray-500">Sin interacciones registradas todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="pb-2 pr-4">Miembro</th>
                  <th className="pb-2 pr-4">Tipo</th>
                  <th className="pb-2 pr-4">Asunto</th>
                  <th className="pb-2 pr-4">Sentimiento</th>
                  <th className="pb-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overview.recentInteractions.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/members/${i.member.id}`}
                        className="font-medium text-violet-700 hover:underline"
                      >
                        {i.member.first_name} {i.member.last_name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {INTERACTION_TYPE_LABELS[i.interaction_type] ?? i.interaction_type}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">{i.subject ?? '—'}</td>
                    <td
                      className={`py-2.5 pr-4 text-xs ${SENTIMENT_COLORS[i.sentiment ?? ''] ?? 'text-gray-400'}`}
                    >
                      {i.sentiment
                        ? i.sentiment.charAt(0) + i.sentiment.slice(1).toLowerCase()
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap py-2.5 text-xs text-gray-500">
                      {new Date(i.occurred_at).toLocaleDateString('es-SV')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: 'red' | 'blue' | 'amber' | 'violet';
}) {
  const colors = {
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${colors[color].split(' ')[1]}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}
