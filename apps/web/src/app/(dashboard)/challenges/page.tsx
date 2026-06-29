import { serverFetch } from '@/lib/server-api';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { ChallengeForm } from './challenge-form';

interface Challenge {
  id: string;
  name: string;
  description: string | null;
  goal_type: string;
  goal_value: number;
  reward_points: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  cover_emoji: string | null;
  _count?: { member_challenges: number };
}

const GOAL_LABEL: Record<string, string> = {
  CHECKIN_COUNT: 'Check-ins',
  SESSION_COUNT: 'Sesiones',
  VOLUME_KG: 'Volumen (kg)',
  STREAK_DAYS: 'Días de racha',
  KCAL_BURNED: 'Kcal quemadas',
  CLASS_COUNT: 'Clases asistidas',
};

async function deleteAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await serverFetch(`/api/v1/admin/challenges/${id}`, { method: 'DELETE' });
  revalidatePath('/challenges');
  redirect('/challenges');
}

async function toggleAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const isActive = formData.get('is_active') === 'true';
  await serverFetch(`/api/v1/admin/challenges/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: !isActive }),
  });
  revalidatePath('/challenges');
  redirect('/challenges');
}

async function createAction(formData: FormData) {
  'use server';
  const payload = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    goal_type: formData.get('goal_type') as string,
    goal_value: parseInt(formData.get('goal_value') as string, 10),
    reward_points: parseInt((formData.get('reward_points') as string) || '100', 10),
    starts_at: formData.get('starts_at') as string,
    ends_at: formData.get('ends_at') as string,
    cover_emoji: (formData.get('cover_emoji') as string) || '🏆',
  };
  await serverFetch('/api/v1/admin/challenges', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  revalidatePath('/challenges');
  redirect('/challenges');
}

export default async function ChallengesPage() {
  const challenges = (await serverFetch<Challenge[]>('/api/v1/admin/challenges')) ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🏆 Retos del gym</h1>
        <p className="text-sm text-gray-500">
          Crea retos por tiempo limitado que motiven a tus miembros a ganar puntos extra.
        </p>
      </div>

      <ChallengeForm onSubmit={createAction} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {challenges.length === 0 ? (
          <div className="col-span-2 rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
            Sin retos creados aún
          </div>
        ) : (
          challenges.map((c) => {
            const daysLeft = Math.max(
              0,
              Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86_400_000),
            );
            return (
              <div key={c.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start gap-3">
                  <span className="text-3xl">{c.cover_emoji ?? '🏆'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{c.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {c.is_active ? 'Activo' : 'Pausado'}
                      </span>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-gray-500">{c.description}</p>}
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded bg-violet-50 p-2">
                    <p className="text-violet-700 font-semibold">Meta</p>
                    <p className="text-gray-900">
                      {c.goal_value} {GOAL_LABEL[c.goal_type] ?? c.goal_type}
                    </p>
                  </div>
                  <div className="rounded bg-amber-50 p-2">
                    <p className="text-amber-700 font-semibold">Premio</p>
                    <p className="text-gray-900">🎁 {c.reward_points} pts</p>
                  </div>
                  <div className="rounded bg-blue-50 p-2">
                    <p className="text-blue-700 font-semibold">Participantes</p>
                    <p className="text-gray-900">👥 {c._count?.member_challenges ?? 0}</p>
                  </div>
                </div>

                <p className="mb-3 text-xs text-gray-400">
                  Termina:{' '}
                  {new Date(c.ends_at).toLocaleDateString('es-SV', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  ({daysLeft}d restantes)
                </p>

                <div className="flex gap-2">
                  <form action={toggleAction} className="inline">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="is_active" value={c.is_active ? 'true' : 'false'} />
                    <button
                      type="submit"
                      className="rounded bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
                    >
                      {c.is_active ? 'Pausar' : 'Activar'}
                    </button>
                  </form>
                  <form action={deleteAction} className="inline">
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
