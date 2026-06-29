import { serverFetch } from '@/lib/server-api';

interface HealthSummary {
  latest: Partial<Record<string, { value: number; recorded_at: string; unit: string }>>;
  weight_trend: {
    latest: number;
    previous: number;
    delta_kg: number;
    days_between: number;
  } | null;
  water_avg_ml_7d: number;
  total_entries_30d: number;
}

interface HealthEntry {
  id: string;
  kind: string;
  value: number | string;
  unit: string;
  recorded_at: string;
}

const KIND_META: Record<string, { emoji: string; label: string }> = {
  WEIGHT: { emoji: '⚖️', label: 'Peso' },
  WATER: { emoji: '💧', label: 'Agua' },
  SLEEP: { emoji: '😴', label: 'Sueño' },
  STEPS: { emoji: '👟', label: 'Pasos' },
  HEART_RATE: { emoji: '❤️', label: 'FC' },
  HRV: { emoji: '🫀', label: 'HRV' },
};

export async function HealthDataSection({ memberId }: { memberId: string }) {
  const [summary, recent] = await Promise.all([
    serverFetch<HealthSummary>(`/api/v1/admin/members/${memberId}/health-data/summary`),
    serverFetch<HealthEntry[]>(`/api/v1/admin/members/${memberId}/health-data?days=30`),
  ]);

  // Si totalEntries30d es 0 no mostramos nada (no aplica al miembro)
  if (!summary || summary.total_entries_30d === 0) {
    return (
      <div className="rounded-lg border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          ❤️ Datos de salud
        </h2>
        <p className="text-xs text-gray-400">
          Este miembro aún no ha registrado datos de salud (peso, agua, sueño).
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          ❤️ Datos de salud
        </h2>
        <span className="text-xs text-gray-400">
          {summary.total_entries_30d} registros últimos 30d
        </span>
      </div>

      {/* Stats latest */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {(['WEIGHT', 'WATER', 'SLEEP', 'STEPS'] as const).map((k) => {
          const latest = summary.latest[k];
          const meta = KIND_META[k];
          return (
            <div key={k} className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl">{meta.emoji}</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {latest ? Number(latest.value).toFixed(k === 'WEIGHT' ? 1 : 0) : '—'}
              </p>
              <p className="text-[10px] text-gray-400">{latest?.unit ?? meta.label}</p>
              {latest && (
                <p className="mt-1 text-[10px] text-gray-500">
                  {new Date(latest.recorded_at).toLocaleDateString('es-SV', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Tendencia */}
      {(summary.weight_trend || summary.water_avg_ml_7d > 0) && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
          {summary.weight_trend && (
            <div className="rounded bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-700">📉 Tendencia peso</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  summary.weight_trend.delta_kg > 0
                    ? 'text-red-600'
                    : summary.weight_trend.delta_kg < 0
                      ? 'text-emerald-600'
                      : 'text-gray-700'
                }`}
              >
                {summary.weight_trend.delta_kg > 0 ? '+' : ''}
                {summary.weight_trend.delta_kg.toFixed(1)} kg
              </p>
              <p className="text-[10px] text-gray-500">
                en {summary.weight_trend.days_between} días
              </p>
            </div>
          )}
          {summary.water_avg_ml_7d > 0 && (
            <div className="rounded bg-cyan-50 p-3">
              <p className="text-xs font-semibold text-cyan-700">💧 Agua promedio 7d</p>
              <p className="mt-1 text-lg font-bold text-cyan-700">
                {(summary.water_avg_ml_7d / 1000).toFixed(2)} L/día
              </p>
            </div>
          )}
        </div>
      )}

      {/* Últimos registros */}
      {recent && recent.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Últimos 8 registros
          </h3>
          <ul className="divide-y divide-gray-100">
            {recent.slice(0, 8).map((e) => {
              const meta = KIND_META[e.kind] ?? { emoji: '•', label: e.kind };
              return (
                <li key={e.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-base">{meta.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">
                      {Number(e.value).toFixed(e.kind === 'WEIGHT' ? 1 : 0)} {e.unit}
                      <span className="font-normal text-gray-500"> · {meta.label}</span>
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(e.recorded_at).toLocaleDateString('es-SV', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
