import { serverFetch } from '@/lib/server-api';
import Link from 'next/link';
import { Salad, Plus, Users, BookOpen, Target } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  goal: string;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_active: boolean;
  created_at: string;
  member: { id: string; first_name: string; last_name: string };
  _count: { food_diary_entries: number };
}

interface Stats {
  totalPlans: number;
  activePlans: number;
  totalEntriesToday: number;
}

const GOAL_LABELS: Record<string, { label: string; color: string }> = {
  WEIGHT_LOSS: { label: 'Pérdida de peso', color: 'bg-red-100 text-red-700' },
  MUSCLE_GAIN: { label: 'Ganancia muscular', color: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { label: 'Mantenimiento', color: 'bg-gray-100 text-gray-600' },
  PERFORMANCE: { label: 'Rendimiento', color: 'bg-violet-100 text-violet-700' },
};

export default async function NutritionPage() {
  const [rawPlans, rawStats] = await Promise.all([
    serverFetch<Plan[]>('/api/v1/nutrition-plans').catch(() => null),
    serverFetch<Stats>('/api/v1/nutrition/stats').catch(() => null),
  ]);
  const plans: Plan[] = rawPlans ?? [];
  const stats: Stats = rawStats ?? { totalPlans: 0, activePlans: 0, totalEntriesToday: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nutrición con IA</h1>
          <p className="text-sm text-gray-500 mt-1">
            Planes nutricionales y diario alimenticio de miembros
          </p>
        </div>
        <Link
          href="/nutrition/plans/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nuevo plan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Planes activos',
            value: stats.activePlans,
            icon: Target,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
          {
            label: 'Total de planes',
            value: stats.totalPlans,
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Registros hoy',
            value: stats.totalEntriesToday,
            icon: Users,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Salad className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No hay planes nutricionales aún</p>
          <Link
            href="/nutrition/plans/new"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Crear primer plan
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y">
          {plans.map((plan) => {
            const goalInfo = GOAL_LABELS[plan.goal] ?? {
              label: plan.goal,
              color: 'bg-gray-100 text-gray-600',
            };
            return (
              <Link
                key={plan.id}
                href={`/nutrition/plans/${plan.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${goalInfo.color}`}
                    >
                      {goalInfo.label}
                    </span>
                    {!plan.is_active && <span className="text-xs text-gray-400">Inactivo</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-xs text-gray-500">
                    {plan.member.first_name} {plan.member.last_name} ·{' '}
                    {plan._count.food_diary_entries} registros
                  </p>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <p className="text-sm font-bold text-gray-900">{plan.kcal_target} kcal</p>
                  <p className="text-xs text-gray-400">
                    P: {plan.protein_g}g · C: {plan.carbs_g}g · G: {plan.fat_g}g
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
