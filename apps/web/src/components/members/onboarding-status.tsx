import { serverFetch } from '@/lib/server-api';

interface Onboarding {
  parq_completed: boolean;
  parq_has_conditions: boolean | null;
  parq_completed_at: string | null;
  goal_completed_at: string | null;
  goal_type: string | null;
  initial_photo_uploaded: boolean;
  contract_accepted: boolean;
  completed_at: string | null;
}

export async function OnboardingStatusSection({ memberId }: { memberId: string }) {
  const ob = await serverFetch<Onboarding>(`/api/v1/admin/members/${memberId}/onboarding`);

  if (!ob) return null;

  const steps = [
    { name: 'PAR-Q médico', done: ob.parq_completed, alert: ob.parq_has_conditions === true },
    { name: 'Objetivo declarado', done: !!ob.goal_completed_at, alert: false },
    { name: 'Foto inicial', done: ob.initial_photo_uploaded, alert: false },
    { name: 'Contrato aceptado', done: ob.contract_accepted, alert: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          📋 Estado de onboarding
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            ob.completed_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {ob.completed_at ? '✓ Completo' : `${doneCount}/4`}
        </span>
      </div>

      <div className="space-y-1.5">
        {steps.map((s) => (
          <div key={s.name} className="flex items-center gap-2">
            <span className={s.done ? 'text-emerald-600' : 'text-gray-300'}>
              {s.done ? '✓' : '○'}
            </span>
            <span className={`text-sm ${s.done ? 'text-gray-900' : 'text-gray-500'}`}>
              {s.name}
            </span>
            {s.alert && (
              <span
                className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"
                title="PAR-Q indica que debe consultar médico antes de entrenar"
              >
                ⚠️ Requiere chequeo médico
              </span>
            )}
          </div>
        ))}
      </div>

      {ob.goal_type && (
        <div className="mt-3 rounded bg-blue-50 p-2 text-xs">
          <span className="font-semibold text-blue-700">🎯 Objetivo:</span>{' '}
          <span className="text-gray-700">{ob.goal_type}</span>
        </div>
      )}
    </div>
  );
}
