'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Dumbbell, ExternalLink } from 'lucide-react';

interface PlanOption {
  id: string;
  name: string;
  goal: string | null;
  days_per_week: number;
}

interface MemberPlan {
  id: string;
  is_active: boolean;
  started_at: string;
  notes: string | null;
  plan: { name: string; days_per_week: number; goal: string | null };
}

const GOAL_LABELS: Record<string, string> = {
  STRENGTH: 'Fuerza',
  HYPERTROPHY: 'Hipertrofia',
  ENDURANCE: 'Resistencia',
  WEIGHT_LOSS: 'Pérdida de peso',
  ATHLETIC: 'Rendimiento atlético',
  GENERAL_FITNESS: 'Fitness general',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function WorkoutPlanSection({ memberId }: { memberId: string }) {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [memberPlans, setMemberPlans] = useState<MemberPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, memberPlansRes] = await Promise.all([
        fetch('/api/proxy/workout-plans'),
        fetch(`/api/proxy/members/${memberId}/plans`),
      ]);
      if (!plansRes.ok || !memberPlansRes.ok) throw new Error('Error al cargar planes');
      const plansData = (await plansRes.json()) as PlanOption[];
      const memberPlansData = (await memberPlansRes.json()) as MemberPlan[];
      setPlans(plansData);
      setMemberPlans(memberPlansData);
    } catch {
      setError('No se pudieron cargar los planes');
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const activePlan = memberPlans.find((mp) => mp.is_active);

  async function assign() {
    if (!selectedPlanId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/members/${memberId}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      setSelectedPlanId('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Plan de entrenamiento
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <>
          {activePlan ? (
            <div className="rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-violet-900 dark:text-violet-200">
                    {activePlan.plan.name}
                  </p>
                  <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
                    {activePlan.plan.days_per_week} días/semana
                    {activePlan.plan.goal &&
                      ` · ${GOAL_LABELS[activePlan.plan.goal] ?? activePlan.plan.goal}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Asignado el {formatDate(activePlan.started_at)}
                  </p>
                </div>
                <Dumbbell className="h-5 w-5 text-violet-500 shrink-0" />
              </div>
              <p className="mt-2 text-xs text-violet-700 dark:text-violet-400">
                Ya aparece en la app móvil del miembro.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin plan de entrenamiento asignado.</p>
          )}

          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {activePlan ? 'Cambiar a otro plan:' : 'Asignar un plan:'}
            </p>
            <div className="flex gap-2">
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                disabled={busy || plans.length === 0}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
              >
                <option value="">Selecciona un plan…</option>
                {plans
                  .filter((p) => p.id !== activePlan?.plan.name)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.days_per_week}d/sem)
                    </option>
                  ))}
              </select>
              <button
                onClick={assign}
                disabled={!selectedPlanId || busy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
              >
                {busy ? 'Asignando…' : 'Asignar'}
              </button>
            </div>
            {plans.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay planes creados aún.{' '}
                <Link href="/workouts/plans/new" className="text-primary underline">
                  Crea uno primero
                </Link>
                .
              </p>
            )}
          </div>

          <Link
            href="/workouts/plans"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Ver todos los planes
          </Link>
        </>
      )}
    </div>
  );
}
