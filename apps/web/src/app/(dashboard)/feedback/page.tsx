import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { MessageSquare, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { redirect } from 'next/navigation';

interface NpsStats {
  allTime: {
    score: number | null;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
  };
  last30Days: {
    score: number | null;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
  };
  trend: Array<{ month: string; avg: number; count: number }>;
}

interface FeedbackItem {
  id: string;
  type: string;
  nps_score: number | null;
  category: string | null;
  comment: string | null;
  channel: string;
  is_resolved: boolean;
  created_at: string;
  member: { id: string; first_name: string; last_name: string };
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  NPS: { label: 'NPS', color: 'bg-blue-100 text-blue-700', icon: '📊' },
  GENERAL: { label: 'General', color: 'bg-gray-100 text-gray-600', icon: '💬' },
  COMPLAINT: { label: 'Queja', color: 'bg-red-100 text-red-700', icon: '❗' },
  SUGGESTION: { label: 'Sugerencia', color: 'bg-amber-100 text-amber-700', icon: '💡' },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  PROMOTER: { label: 'Promotor', color: 'text-emerald-600' },
  PASSIVE: { label: 'Pasivo', color: 'text-amber-600' },
  DETRACTOR: { label: 'Detractor', color: 'text-red-600' },
};

const CHANNEL_LABEL: Record<string, string> = {
  APP: 'App móvil',
  EMAIL: 'Email',
  WHATSAPP: 'WhatsApp',
};

function formatMonth(ym: string) {
  const [year, month] = ym.split('-');
  return new Date(Number(year), Number(month) - 1).toLocaleDateString('es-SV', {
    month: 'short',
    year: '2-digit',
  });
}

function NpsGauge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400 text-sm">Sin datos</span>;
  const color = score >= 50 ? 'text-emerald-600' : score >= 0 ? 'text-amber-600' : 'text-red-600';
  return (
    <span className={`text-4xl font-bold ${color}`}>
      {score > 0 ? '+' : ''}
      {score}
    </span>
  );
}

async function resolveAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await serverFetch(`/api/v1/feedback/${id}/resolve`, { method: 'PATCH' });
  redirect('/feedback');
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const { tab = 'nps', type } = await searchParams;

  const [npsStats, allFeedback] = await Promise.all([
    serverFetch<NpsStats>('/api/v1/feedback/nps-stats'),
    serverFetch<FeedbackItem[]>(`/api/v1/feedback${type ? `?type=${type}` : ''}`),
  ]);

  const nps = npsStats ?? {
    allTime: { score: null, promoters: 0, passives: 0, detractors: 0, total: 0 },
    last30Days: { score: null, promoters: 0, passives: 0, detractors: 0, total: 0 },
    trend: [],
  };
  const feedbackList = allFeedback ?? [];
  const openComplaints = feedbackList.filter((f) => f.type === 'COMPLAINT' && !f.is_resolved);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback & NPS</h1>
          <p className="text-sm text-gray-500">
            {nps.last30Days.total} respuestas en los últimos 30 días
            {openComplaints.length > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {openComplaints.length} quejas abiertas
              </span>
            )}
          </p>
        </div>
      </div>

      {/* NPS cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-2">NPS últimos 30 días</p>
          <NpsGauge score={nps.last30Days.score} />
          <p className="mt-1 text-xs text-gray-400">{nps.last30Days.total} respuestas</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-2">NPS histórico</p>
          <NpsGauge score={nps.allTime.score} />
          <p className="mt-1 text-xs text-gray-400">{nps.allTime.total} respuestas</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">Distribución (30d)</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-emerald-600">Promotores</span>
              <span className="font-medium">{nps.last30Days.promoters}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-amber-600">Pasivos</span>
              <span className="font-medium">{nps.last30Days.passives}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-500">Detractores</span>
              <span className="font-medium">{nps.last30Days.detractors}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-2">Quejas abiertas</p>
          <p
            className={`text-3xl font-bold ${openComplaints.length > 0 ? 'text-red-600' : 'text-gray-900'}`}
          >
            {openComplaints.length}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            de {feedbackList.filter((f) => f.type === 'COMPLAINT').length} total
          </p>
        </div>
      </div>

      {/* Trend */}
      {nps.trend.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <h2 className="font-semibold text-gray-900">Tendencia NPS (promedio por mes)</h2>
          </div>
          <div className="flex items-end gap-3 h-24">
            {nps.trend.map((t) => {
              const pct = Math.max(0, Math.min(100, ((t.avg + 10) / 20) * 100));
              const barColor =
                t.avg >= 8 ? 'bg-emerald-400' : t.avg >= 6 ? 'bg-amber-400' : 'bg-red-400';
              return (
                <div key={t.month} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-medium text-gray-600">{t.avg}</span>
                  <div className="w-full flex flex-col justify-end h-16">
                    <div
                      className={`w-full rounded-t ${barColor}`}
                      style={{ height: `${pct}%`, minHeight: 4 }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{formatMonth(t.month)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'nps', label: 'NPS' },
          { key: 'complaints', label: 'Quejas' },
          { key: 'suggestions', label: 'Sugerencias' },
          { key: 'all', label: 'Todos' },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/feedback?tab=${key}`}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Feedback list */}
      {(() => {
        const typeFilter: Record<string, string | undefined> = {
          nps: 'NPS',
          complaints: 'COMPLAINT',
          suggestions: 'SUGGESTION',
          all: undefined,
        };
        const filtered = feedbackList.filter(
          (f) => typeFilter[tab] === undefined || f.type === typeFilter[tab],
        );

        return (
          <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                <p className="font-medium text-gray-400">Sin feedback en esta categoría</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filtered.map((fb) => {
                  const typeCfg = TYPE_CONFIG[fb.type] ?? TYPE_CONFIG['GENERAL'];
                  const catCfg = fb.category ? CATEGORY_CONFIG[fb.category] : null;
                  return (
                    <li key={fb.id} className="px-4 py-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">
                              {fb.member.first_name} {fb.member.last_name}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.color}`}
                            >
                              {typeCfg.icon} {typeCfg.label}
                            </span>
                            {fb.nps_score !== null && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                                {fb.nps_score}/10
                              </span>
                            )}
                            {catCfg && (
                              <span className={`text-xs font-medium ${catCfg.color}`}>
                                {catCfg.label}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {CHANNEL_LABEL[fb.channel] ?? fb.channel}
                            </span>
                          </div>
                          {fb.comment && <p className="mt-1 text-sm text-gray-600">{fb.comment}</p>}
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(fb.created_at).toLocaleDateString('es-SV', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {fb.is_resolved ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" /> Resuelto
                            </span>
                          ) : fb.type === 'COMPLAINT' ? (
                            <form action={resolveAction}>
                              <input type="hidden" name="id" value={fb.id} />
                              <button
                                type="submit"
                                className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                              >
                                <AlertCircle className="h-3.5 w-3.5" />
                                Marcar resuelto
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })()}
    </div>
  );
}
