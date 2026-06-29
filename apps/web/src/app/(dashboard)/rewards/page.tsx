import { serverFetch } from '@/lib/server-api';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { RewardForm } from './reward-form';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  cost_points: number;
  stock: number;
  cover_emoji: string | null;
  is_active: boolean;
  _count?: { redemptions: number };
}

interface Redemption {
  id: string;
  status: 'PENDING' | 'DELIVERED' | 'CANCELLED';
  points_spent: number;
  redeemed_at: string;
  notes: string | null;
  reward: { name: string; cover_emoji: string | null };
  member: { first_name: string; last_name: string };
}

async function deleteRewardAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await serverFetch(`/api/v1/admin/rewards/${id}`, { method: 'DELETE' });
  revalidatePath('/rewards');
  redirect('/rewards');
}

async function toggleRewardAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const isActive = formData.get('is_active') === 'true';
  await serverFetch(`/api/v1/admin/rewards/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: !isActive }),
  });
  revalidatePath('/rewards');
  redirect('/rewards');
}

async function createRewardAction(formData: FormData) {
  'use server';
  await serverFetch('/api/v1/admin/rewards', {
    method: 'POST',
    body: JSON.stringify({
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      cost_points: parseInt(formData.get('cost_points') as string, 10),
      stock: parseInt((formData.get('stock') as string) || '-1', 10),
      cover_emoji: (formData.get('cover_emoji') as string) || '🎁',
    }),
  });
  revalidatePath('/rewards');
  redirect('/rewards');
}

async function markRedemptionAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  await serverFetch(`/api/v1/admin/redemptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  revalidatePath('/rewards');
  redirect('/rewards');
}

export default async function RewardsPage() {
  const [rewards, redemptions] = await Promise.all([
    serverFetch<Reward[]>('/api/v1/admin/rewards'),
    serverFetch<Redemption[]>('/api/v1/admin/redemptions'),
  ]);

  const pendingRedemptions = (redemptions ?? []).filter((r) => r.status === 'PENDING');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🎁 Tienda de recompensas</h1>
        <p className="text-sm text-gray-500">
          Define qué pueden canjear tus miembros con sus puntos acumulados.
        </p>
      </div>

      <RewardForm onSubmit={createRewardAction} />

      {/* Canjes pendientes — sección destacada */}
      {pendingRedemptions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <h2 className="mb-3 text-lg font-bold text-amber-900">
            ⚠️ {pendingRedemptions.length} canjes esperando entrega
          </h2>
          <div className="space-y-2">
            {pendingRedemptions.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm">
                <span className="text-2xl">{r.reward.cover_emoji ?? '🎁'}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {r.member.first_name} {r.member.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.reward.name} · {r.points_spent} pts ·{' '}
                    {new Date(r.redeemed_at).toLocaleDateString('es-SV')}
                  </p>
                </div>
                <form action={markRedemptionAction} className="inline">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="DELIVERED" />
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    ✓ Entregado
                  </button>
                </form>
                <form action={markRedemptionAction} className="inline">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="status" value="CANCELLED" />
                  <button
                    type="submit"
                    className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de recompensas */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          {rewards?.length ?? 0} recompensas en catálogo
        </h2>
        {!rewards || rewards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
            Sin recompensas todavía
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rewards.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start gap-3">
                  <span className="text-3xl">{r.cover_emoji ?? '🎁'}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{r.name}</h3>
                    {r.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{r.description}</p>
                    )}
                  </div>
                </div>
                <div className="my-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-violet-700">💰 {r.cost_points} pts</span>
                  <span className="text-gray-500">
                    {r.stock < 0 ? '∞ stock' : `${r.stock} stock`}
                  </span>
                  <span className="text-gray-500">{r._count?.redemptions ?? 0} canjeados</span>
                </div>
                <div className="flex gap-2">
                  <form action={toggleRewardAction} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="is_active" value={r.is_active ? 'true' : 'false'} />
                    <button
                      type="submit"
                      className={`rounded px-3 py-1 text-xs font-semibold ${
                        r.is_active
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {r.is_active ? 'Pausar' : 'Activar'}
                    </button>
                  </form>
                  <form action={deleteRewardAction} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
