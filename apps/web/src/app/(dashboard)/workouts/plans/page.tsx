import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { Plus, BookOpen, ArrowLeft, Calendar, Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Planes de entrenamiento — GymApp' };

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string;
  days_per_week: number;
  is_active: boolean;
  is_template: boolean;
  created_at: string;
  days: { id: string }[];
  member_plans: { id: string }[];
}

const GOAL_LABELS: Record<string, string> = {
  STRENGTH: 'Fuerza',
  HYPERTROPHY: 'Hipertrofia',
  ENDURANCE: 'Resistencia',
  WEIGHT_LOSS: 'Pérdida de peso',
  ATHLETIC: 'Atlético',
  GENERAL_FITNESS: 'Fitness general',
};

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default async function PlansPage() {
  const plans = await serverFetch<WorkoutPlan[]>('/api/v1/workout-plans');
  const list = plans ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Planes de entrenamiento</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} plan{list.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <Link
          href="/workouts/plans/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear plan
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold mb-1">Sin planes creados</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Crea plantillas de entrenamiento y asígnalas a tus miembros
          </p>
          <Link
            href="/workouts/plans/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Crear primer plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((plan) => (
            <div key={plan.id} className="rounded-xl border bg-card p-5 space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{plan.name}</p>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFF_COLORS[plan.difficulty] ?? 'bg-muted text-muted-foreground'}`}
                >
                  {plan.difficulty === 'BEGINNER'
                    ? 'Principiante'
                    : plan.difficulty === 'INTERMEDIATE'
                      ? 'Intermedio'
                      : 'Avanzado'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {plan.days_per_week} días/semana
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {plan.days.length} día{plan.days.length !== 1 ? 's' : ''} configurados
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {plan.member_plans.length} miembro{plan.member_plans.length !== 1 ? 's' : ''}
                </span>
              </div>

              {plan.goal && (
                <span className="w-fit rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">
                  {GOAL_LABELS[plan.goal] ?? plan.goal}
                </span>
              )}

              <div className="flex gap-2 pt-1 mt-auto">
                <Link
                  href={`/workouts/plans/${plan.id}`}
                  className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium hover:bg-muted transition-colors"
                >
                  Ver plan
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
