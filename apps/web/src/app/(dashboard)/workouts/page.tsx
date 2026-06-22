import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { Dumbbell, BookOpen, Users, TrendingUp, Plus, Clock } from 'lucide-react';

export const metadata: Metadata = { title: 'Entrenamiento — GymApp' };

interface WorkoutSession {
  id: string;
  started_at: string;
  finished_at: string | null;
  duration_min: number | null;
  name: string | null;
  member: { first_name: string; last_name: string };
  plan: { name: string } | null;
  _count: { sets: number };
}

interface WorkoutStats {
  weekSessions: number;
  totalPlans: number;
  totalExercises: number;
  recentSessions: WorkoutSession[];
}

function formatDuration(min: number | null) {
  if (!min) return '—';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function WorkoutsPage() {
  const stats = await serverFetch<WorkoutStats>('/api/v1/workout/stats');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Entrenamiento</h1>
          <p className="text-sm text-muted-foreground">Planes, ejercicios y seguimiento ZEUS</p>
        </div>
        <Link
          href="/workouts/plans/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear plan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Sesiones esta semana"
          value={String(stats?.weekSessions ?? 0)}
          color="violet"
        />
        <StatCard
          icon={BookOpen}
          label="Planes activos"
          value={String(stats?.totalPlans ?? 0)}
          color="blue"
          href="/workouts/plans"
        />
        <StatCard
          icon={Dumbbell}
          label="Ejercicios disponibles"
          value={String(stats?.totalExercises ?? 0)}
          color="amber"
          href="/workouts/exercises"
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/workouts/exercises"
          className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Dumbbell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-medium">Biblioteca de ejercicios</p>
            <p className="text-xs text-muted-foreground">Ver y añadir ejercicios al catálogo</p>
          </div>
        </Link>
        <Link
          href="/workouts/plans"
          className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium">Planes de entrenamiento</p>
            <p className="text-xs text-muted-foreground">Crear y asignar planes a miembros</p>
          </div>
        </Link>
      </div>

      {/* Sesiones recientes */}
      <div>
        <h2 className="text-base font-semibold mb-3">Sesiones recientes</h2>
        {!stats || stats.recentSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">Sin sesiones registradas</p>
            <p className="text-xs text-muted-foreground">
              Las sesiones de los miembros aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Miembro</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Series</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Duración
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {stats.recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {s.member.first_name} {s.member.last_name}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {s.plan?.name ?? s.name ?? 'Sesión libre'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold">
                      {s._count.sets}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(s.duration_min)}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {formatDate(s.started_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: 'violet' | 'blue' | 'amber';
  href?: string;
}) {
  const colors = {
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  const card = (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colors[color]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );

  if (href)
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {card}
      </Link>
    );
  return card;
}
