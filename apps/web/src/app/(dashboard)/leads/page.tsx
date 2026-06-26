import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { UserPlus, Plus, Phone, Mail, ChevronRight } from 'lucide-react';
import { redirect } from 'next/navigation';

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  interested: number;
  trial: number;
  converted: number;
  lost: number;
  newThisWeek: number;
  convertedThisMonth: number;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  notes: string | null;
  created_at: string;
  assignee: { id: string; first_name: string; last_name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  NEW: { label: 'Nuevo', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  CONTACTED: { label: 'Contactado', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  INTERESTED: { label: 'Interesado', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  TRIAL: { label: 'En prueba', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  CONVERTED: {
    label: 'Convertido',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  LOST: { label: 'Perdido', color: 'bg-red-100 text-red-600', dot: 'bg-red-400' },
};

const SOURCE_LABEL: Record<string, string> = {
  WALK_IN: 'Visita directa',
  WEB: 'Web',
  REFERRAL: 'Referido',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  OTHER: 'Otro',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString('es-SV', { day: 'numeric', month: 'short' });
}

const PIPELINE_STEPS = ['NEW', 'CONTACTED', 'INTERESTED', 'TRIAL', 'CONVERTED'];

async function updateStatusAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  await serverFetch(`/api/v1/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  redirect('/leads');
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const [stats, leads] = await Promise.all([
    serverFetch<LeadStats>('/api/v1/leads/stats'),
    serverFetch<Lead[]>(`/api/v1/leads${status ? `?status=${status}` : ''}`),
  ]);

  const s = stats ?? {
    total: 0,
    new: 0,
    contacted: 0,
    interested: 0,
    trial: 0,
    converted: 0,
    lost: 0,
    newThisWeek: 0,
    convertedThisMonth: 0,
  };
  const leadList = leads ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Leads</h1>
          <p className="text-sm text-gray-500">
            {s.newThisWeek} nuevos esta semana · {s.convertedThisMonth} convertidos este mes
          </p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo lead
        </Link>
      </div>

      {/* Pipeline visual */}
      <div className="grid grid-cols-5 gap-2">
        {PIPELINE_STEPS.map((step) => {
          const cfg = STATUS_CONFIG[step];
          const count = s[step.toLowerCase() as keyof LeadStats] as number;
          const isActive = status === step;
          return (
            <Link
              key={step}
              href={isActive ? '/leads' : `/leads?status=${step}`}
              className={`rounded-xl border p-4 text-center transition-all ${
                isActive
                  ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-300'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">{cfg.label}</p>
              <div className={`mx-auto mt-2 h-1 w-8 rounded-full ${cfg.dot}`} />
            </Link>
          );
        })}
      </div>

      {/* Stats extra */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{s.total}</p>
          <p className="text-xs text-gray-500">Total leads</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">{s.convertedThisMonth}</p>
          <p className="text-xs text-gray-500">Convertidos (30d)</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-500">{s.lost}</p>
          <p className="text-xs text-gray-500">Perdidos total</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">
            {s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-500">Tasa conversión</p>
        </div>
      </div>

      {/* Tabla de leads */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">
            {status
              ? `${STATUS_CONFIG[status]?.label ?? status} (${leadList.length})`
              : `Todos los leads (${leadList.length})`}
          </h2>
          {status && (
            <Link href="/leads" className="text-xs text-violet-600 hover:underline">
              Ver todos
            </Link>
          )}
        </div>

        {leadList.length === 0 ? (
          <div className="p-16 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="font-medium text-gray-400">
              Sin leads{status ? ` en estado "${STATUS_CONFIG[status]?.label}"` : ''}
            </p>
            <Link
              href="/leads/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Agregar primer lead
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left">
              <tr className="text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Fuente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Asignado a</th>
                <th className="px-4 py-3">Ingresó</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leadList.map((lead) => {
                const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG['NEW'];
                const nextStatus = PIPELINE_STEPS[PIPELINE_STEPS.indexOf(lead.status) + 1];
                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      {lead.notes && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{lead.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {lead.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" /> {lead.phone}
                          </p>
                        )}
                        {lead.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3" /> {lead.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {SOURCE_LABEL[lead.source] ?? lead.source}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {lead.assignee ? (
                        `${lead.assignee.first_name} ${lead.assignee.last_name}`
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      {nextStatus && lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                        <form action={updateStatusAction}>
                          <input type="hidden" name="id" value={lead.id} />
                          <input type="hidden" name="status" value={nextStatus} />
                          <button
                            type="submit"
                            className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
                          >
                            {STATUS_CONFIG[nextStatus].label}
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
