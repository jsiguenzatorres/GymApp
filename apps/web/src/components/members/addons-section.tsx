'use client';

import { useEffect, useState, useCallback } from 'react';

interface Addon {
  id: string;
  type: 'NUTRITION';
  tier: 'BASIC' | 'PRO' | 'ELITE';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  starts_at: string;
  ends_at: string | null;
  price_paid: string | number | null;
  currency: string;
  notes: string | null;
  created_at: string;
}

const TIER_CONFIG: Record<
  string,
  { label: string; emoji: string; pillBg: string; pillFg: string }
> = {
  BASIC: {
    label: 'Básico',
    emoji: '🥗',
    pillBg: 'bg-gray-100 dark:bg-gray-800',
    pillFg: 'text-gray-700 dark:text-gray-300',
  },
  PRO: {
    label: 'NutriPro',
    emoji: '💪',
    pillBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    pillFg: 'text-emerald-700 dark:text-emerald-300',
  },
  ELITE: {
    label: 'NutriElite',
    emoji: '🏆',
    pillBg: 'bg-amber-100 dark:bg-amber-900/40',
    pillFg: 'text-amber-700 dark:text-amber-300',
  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AddonsSection({ memberId }: { memberId: string }) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/members/${memberId}/addons`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Addon[];
      setAddons(data);
    } catch {
      setError('No se pudieron cargar los add-ons');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeNutrition = addons.find((a) => a.type === 'NUTRITION' && a.status === 'ACTIVE');
  const currentTier = activeNutrition?.tier ?? 'BASIC';

  async function assign(tier: 'PRO' | 'ELITE') {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const price = tier === 'PRO' ? 15 : 30;
      const res = await fetch(`/api/proxy/admin/members/${memberId}/addons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NUTRITION',
          tier,
          price_paid: price,
          currency: 'USD',
          notes: 'Activado manualmente desde admin',
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function cancel(addonId: string) {
    if (busy) return;
    if (!confirm('¿Cancelar este add-on? El miembro perderá acceso a las funciones premium.'))
      return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/admin/members/${memberId}/addons/${addonId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelado desde admin' }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const tierConfig = TIER_CONFIG[currentTier];

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Add-ons del miembro
        </h2>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${tierConfig.pillBg} ${tierConfig.pillFg}`}
        >
          {tierConfig.emoji} Nutrición: {tierConfig.label}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
          {/* Acciones rápidas — activar tiers */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Activar/cambiar tier de nutrición:</p>
            <div className="flex flex-wrap gap-2">
              {(['PRO', 'ELITE'] as const).map((t) => {
                const isCurrent = currentTier === t;
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={busy || isCurrent}
                    onClick={() => assign(t)}
                    className={
                      isCurrent
                        ? 'rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50'
                    }
                  >
                    {TIER_CONFIG[t].emoji} Activar {TIER_CONFIG[t].label} (
                    {t === 'PRO' ? '$15' : '$30'}/mes)
                    {isCurrent ? ' · actual' : ''}
                  </button>
                );
              })}
              {activeNutrition && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => cancel(activeNutrition.id)}
                  className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Cancelar suscripción actual
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          {/* Historial */}
          {addons.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-2">Historial de add-ons:</p>
              <ul className="space-y-2">
                {addons.map((a) => {
                  const tc = TIER_CONFIG[a.tier];
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between text-xs bg-muted/40 rounded-md px-3 py-2"
                    >
                      <div>
                        <span className={`font-semibold ${tc.pillFg}`}>
                          {tc.emoji} {a.type} {tc.label}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {a.status} · desde {formatDate(a.starts_at)}
                          {a.ends_at && ` · hasta ${formatDate(a.ends_at)}`}
                        </span>
                      </div>
                      {a.price_paid && (
                        <span className="text-muted-foreground">
                          {a.currency} {Number(a.price_paid).toFixed(2)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
