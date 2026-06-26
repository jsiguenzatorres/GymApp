import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { Award, Plus, Coins, ListOrdered, Crown } from 'lucide-react';
import { redirect } from 'next/navigation';

interface GymStats {
  totalBadges: number;
  activeBadges: number;
  totalPointsAwarded: number;
  topMember: { first_name: string; last_name: string; points_lifetime: number } | null;
}

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  condition_type: string;
  condition_value: number;
  is_active: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
  member: { first_name: string; last_name: string };
}

interface LeaderboardEntry {
  rank: number;
  member_id: string;
  first_name: string;
  last_name: string;
  points_lifetime: number;
  level_name: string;
  level_emoji: string;
  level_color: string;
}

const COND_LABEL: Record<string, string> = {
  CHECKIN_COUNT: 'Check-ins acumulados',
  WORKOUT_COUNT: 'Workouts completados',
  PR_COUNT: 'Récords personales',
  POINTS_EARNED: 'FitCoins lifetime',
  STREAK_DAYS: 'Días consecutivos',
};

const TX_TYPE_LABEL: Record<string, string> = {
  CHECK_IN: 'Check-in',
  WORKOUT_COMPLETE: 'Workout',
  PR_ACHIEVED: 'Récord',
  BADGE_UNLOCKED: 'Badge',
  MANUAL: 'Manual',
};
const TX_COLOR: Record<string, string> = {
  CHECK_IN: 'text-emerald-600',
  WORKOUT_COMPLETE: 'text-blue-600',
  PR_ACHIEVED: 'text-amber-600',
  BADGE_UNLOCKED: 'text-violet-600',
  MANUAL: 'text-gray-600',
};

export default async function GamificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'badges' } = await searchParams;

  const [stats, badges, transactions, leaderboard] = await Promise.all([
    serverFetch<GymStats>('/api/v1/gamification/admin/stats'),
    serverFetch<Badge[]>('/api/v1/gamification/admin/badges'),
    serverFetch<Transaction[]>('/api/v1/gamification/admin/transactions'),
    serverFetch<LeaderboardEntry[]>('/api/v1/gamification/admin/leaderboard'),
  ]);

  const s = stats ?? { totalBadges: 0, activeBadges: 0, totalPointsAwarded: 0, topMember: null };
  const badgeList = badges ?? [];
  const txList = transactions ?? [];
  const rankList = leaderboard ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gamificación</h1>
          <p className="text-sm text-gray-500">Puntos, badges y ranking de miembros</p>
        </div>
        {tab === 'badges' && (
          <Link
            href="/gamification/new-badge"
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo badge
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Badges activos</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{s.activeBadges}</p>
          <p className="mt-1 text-xs text-gray-400">de {s.totalBadges} totales</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">FitCoins entregados</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {s.totalPointsAwarded.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Transacciones (recientes)</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{txList.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Top miembro</p>
          {s.topMember ? (
            <>
              <p className="mt-1 text-base font-bold text-gray-900 truncate">
                {s.topMember.first_name} {s.topMember.last_name}
              </p>
              <p className="text-xs text-gray-400">
                {s.topMember.points_lifetime.toLocaleString()} pts
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-gray-400">—</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'badges', label: 'Badges', icon: Award },
          { key: 'puntos', label: 'Asignar puntos', icon: Coins },
          { key: 'ranking', label: 'Ranking', icon: ListOrdered },
        ].map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/gamification?tab=${key}`}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Tab: Badges */}
      {tab === 'badges' && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {badgeList.length === 0 ? (
            <div className="p-16 text-center">
              <Award className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="font-medium text-gray-400">Sin badges configurados</p>
              <p className="mt-1 text-sm text-gray-400">
                Los badges motivan a los miembros a alcanzar hitos.
              </p>
              <Link
                href="/gamification/new-badge"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Crear primer badge
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left">
                <tr className="text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Badge</th>
                  <th className="px-4 py-3">Condición</th>
                  <th className="px-4 py-3">Meta</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {badgeList.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{b.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{b.name}</p>
                          {b.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">
                              {b.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {COND_LABEL[b.condition_type] ?? b.condition_type}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {b.condition_value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${b.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${b.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        />
                        {b.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ToggleBadgeForm badgeId={b.id} isActive={b.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Tab: Puntos */}
      {tab === 'puntos' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Award points form */}
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-gray-900">Asignar puntos manualmente</h2>
            <AwardPointsForm />
          </section>

          {/* Recent transactions */}
          <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="font-semibold text-gray-900">Últimas transacciones</h2>
            </div>
            {txList.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-400">Sin transacciones aún</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {txList.slice(0, 15).map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.member.first_name} {tx.member.last_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {TX_TYPE_LABEL[tx.type] ?? tx.type}
                        {tx.description ? ` · ${tx.description}` : ''}
                      </p>
                    </div>
                    <span className={`text-sm font-bold ${TX_COLOR[tx.type] ?? 'text-gray-700'}`}>
                      +{tx.amount}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Tab: Ranking */}
      {tab === 'ranking' && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {rankList.length === 0 ? (
            <div className="p-16 text-center">
              <Crown className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="font-medium text-gray-400">Sin datos de ranking aún</p>
              <p className="mt-1 text-sm text-gray-400">
                El ranking aparecerá cuando los miembros acumulen puntos.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left">
                <tr className="text-xs font-medium text-gray-500">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Miembro</th>
                  <th className="px-4 py-3">Nivel</th>
                  <th className="px-4 py-3 text-right">FitCoins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rankList.map((e) => (
                  <tr key={e.member_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${e.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {e.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {e.first_name} {e.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: e.level_color }}
                      >
                        {e.level_emoji} {e.level_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {e.points_lifetime.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

function ToggleBadgeForm({ badgeId, isActive }: { badgeId: string; isActive: boolean }) {
  return (
    <form
      action={async () => {
        'use server';
        await serverFetch(`/api/v1/gamification/admin/badges/${badgeId}/toggle`, {
          method: 'PATCH',
        });
      }}
    >
      <button
        type="submit"
        className={`text-xs font-medium ${isActive ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}
      >
        {isActive ? 'Desactivar' : 'Activar'}
      </button>
    </form>
  );
}

function AwardPointsForm() {
  async function awardAction(formData: FormData) {
    'use server';
    const member_id = formData.get('member_id') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const description = formData.get('description') as string;
    if (!member_id || !amount) return;
    await serverFetch('/api/v1/gamification/admin/award-points', {
      method: 'POST',
      body: JSON.stringify({ member_id, amount, description: description || undefined }),
    });
    redirect('/gamification?tab=puntos');
  }

  return (
    <form action={awardAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ID del miembro <span className="text-red-500">*</span>
        </label>
        <input
          name="member_id"
          required
          placeholder="UUID del miembro"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
        <p className="mt-1 text-xs text-gray-400">Obtén el ID desde la página de Miembros.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cantidad de puntos <span className="text-red-500">*</span>
        </label>
        <input
          name="amount"
          type="number"
          required
          min={1}
          max={10000}
          placeholder="Ej. 50"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
        <input
          name="description"
          placeholder="Ej. Reto de enero completado"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        Asignar puntos
      </button>
    </form>
  );
}
