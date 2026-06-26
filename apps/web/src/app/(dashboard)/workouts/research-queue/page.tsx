'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

interface QueueItem {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  approval_level: number;
  status: string;
  ai_confidence: number | null;
  ai_assessment: string | null;
  reviewed_at: string | null;
  created_at: string;
  pubmed_id: string | null;
  keywords: string[];
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  autoApproved: number;
}

const LEVEL_LABEL: Record<number, string> = {
  1: 'IA auto',
  2: 'Admin',
  3: 'Admin + Trainer',
  4: 'Admin + Prof. Salud',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  AUTO_APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
};

async function apiFetch<T>(path: string, token: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export default function ResearchQueuePage() {
  const { accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [statsData, queueData] = await Promise.all([
        apiFetch<Stats>('/zeus/research/stats', accessToken),
        apiFetch<{ items: QueueItem[] }>(
          `/zeus/research/queue?status=${statusFilter}&limit=50`,
          accessToken,
        ),
      ]);
      setStats(statsData);
      setItems(queueData.items ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [accessToken, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const approve = async (id: string) => {
    if (!accessToken) return;
    setActionLoading(id);
    try {
      await apiFetch(`/zeus/research/queue/${id}/approve`, accessToken, { method: 'PATCH' });
      await loadData();
    } catch {
      alert('Error al aprobar');
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (id: string) => {
    if (!accessToken || !rejectReason.trim()) return;
    setActionLoading(id);
    try {
      await apiFetch(`/zeus/research/queue/${id}/reject`, accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectId(null);
      setRejectReason('');
      await loadData();
    } catch {
      alert('Error al rechazar');
    } finally {
      setActionLoading(null);
    }
  };

  const triggerMonitor = async () => {
    if (!accessToken) return;
    setTriggering(true);
    try {
      await apiFetch('/zeus/research/monitor', accessToken, { method: 'POST' });
      alert('Monitor de PubMed iniciado. Los resultados aparecerán en unos minutos.');
    } catch {
      alert('Error al iniciar el monitor');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motor Científico ZEUS</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cola de aprobación de investigación científica para la base de conocimiento de ZEUS
          </p>
        </div>
        <button
          onClick={triggerMonitor}
          disabled={triggering}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 text-sm"
        >
          {triggering ? 'Iniciando…' : '⚡ Ejecutar monitor PubMed'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Pendientes', value: stats.pending, color: 'text-amber-600' },
            { label: 'Aprobados', value: stats.approved, color: 'text-green-600' },
            { label: 'Auto-aprobados', value: stats.autoApproved, color: 'text-blue-600' },
            { label: 'Rechazados', value: stats.rejected, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        {['PENDING', 'APPROVED', 'AUTO_APPROVED', 'REJECTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'AUTO_APPROVED' ? 'Auto-aprobados' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔬</p>
          <p className="font-medium">Sin artículos en esta categoría</p>
          {statusFilter === 'PENDING' && (
            <p className="text-sm mt-1">Ejecuta el monitor de PubMed para cargar artículos</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[item.status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Nivel {item.approval_level}: {LEVEL_LABEL[item.approval_level]}
                    </span>
                    {item.ai_confidence !== null && (
                      <span className="text-xs text-gray-400">
                        Confianza IA: {(item.ai_confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.authors.slice(0, 3).join(', ')}
                    {item.authors.length > 3 ? ' et al.' : ''} — {item.journal}
                  </p>
                </div>
                {item.pubmed_id && (
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${item.pubmed_id}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline whitespace-nowrap flex-shrink-0"
                  >
                    Ver en PubMed ↗
                  </a>
                )}
              </div>

              {item.ai_assessment && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                  {item.ai_assessment}
                </p>
              )}

              {item.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              {item.status === 'PENDING' && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => approve(item.id)}
                    disabled={actionLoading === item.id}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {actionLoading === item.id ? '…' : '✓ Aprobar'}
                  </button>
                  <button
                    onClick={() => setRejectId(item.id)}
                    disabled={actionLoading === item.id}
                    className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 text-sm rounded-lg hover:bg-red-100 font-medium"
                  >
                    ✕ Rechazar
                  </button>
                </div>
              )}

              {/* Reject reason inline */}
              {rejectId === item.id && (
                <div className="flex gap-2 items-center pt-1">
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Motivo del rechazo…"
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    onClick={() => reject(item.id)}
                    disabled={!rejectReason.trim() || actionLoading === item.id}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => {
                      setRejectId(null);
                      setRejectReason('');
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
