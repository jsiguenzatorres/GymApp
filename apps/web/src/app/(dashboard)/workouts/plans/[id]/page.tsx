import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import {
  ArrowLeft,
  Dumbbell,
  Calendar,
  Target,
  Users,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { PlanActions } from '@/components/workout/plan-actions';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ExerciseBlock {
  id: string;
  order: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes?: string;
  exercise: {
    id: string;
    name: string;
    muscle_groups: string[];
    equipment: string[];
  };
}

interface PlanDay {
  id: string;
  day_number: number;
  name: string;
  blocks: ExerciseBlock[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  goal?: string;
  days_per_week: number;
  is_active: boolean;
  days: PlanDay[];
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700',
  INTERMEDIATE: 'bg-amber-100 text-amber-700',
  ADVANCED: 'bg-rose-100 text-rose-700',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  STRENGTH: 'Fuerza',
  ENDURANCE: 'Resistencia',
  FLEXIBILITY: 'Flexibilidad',
  GENERAL_FITNESS: 'Estado físico general',
};

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  FOREARMS: 'Antebrazos',
  QUADS: 'Cuádriceps',
  HAMSTRINGS: 'Femoral',
  GLUTES: 'Glúteos',
  CALVES: 'Pantorrillas',
  ABS: 'Abdomen',
  FULL_BODY: 'Cuerpo completo',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await serverFetch<WorkoutPlan>(`/api/v1/workout-plans/${id}`);

  if (!plan) notFound();

  const totalExercises = plan.days.reduce((acc, d) => acc + d.blocks.length, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/workouts/plans"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a planes
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
            {plan.description && (
              <p className="mt-1 text-gray-500 text-sm max-w-xl">{plan.description}</p>
            )}
          </div>
          <PlanActions planId={plan.id} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Target className="h-3.5 w-3.5" />
            Dificultad
          </div>
          <span
            className={`mt-1 inline-block self-start rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLORS[plan.difficulty] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {DIFFICULTY_LABELS[plan.difficulty] ?? plan.difficulty}
          </span>
        </div>

        <div className="rounded-xl border bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            Días / semana
          </div>
          <span className="text-xl font-bold text-gray-900 mt-0.5">{plan.days_per_week}</span>
        </div>

        <div className="rounded-xl border bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Dumbbell className="h-3.5 w-3.5" />
            Ejercicios totales
          </div>
          <span className="text-xl font-bold text-gray-900 mt-0.5">{totalExercises}</span>
        </div>

        <div className="rounded-xl border bg-white p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            Objetivo
          </div>
          <span className="text-xs font-medium text-gray-700 mt-1">
            {plan.goal ? (GOAL_LABELS[plan.goal] ?? plan.goal) : '—'}
          </span>
        </div>
      </div>

      {/* Días */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Estructura del plan
        </h2>

        {plan.days.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <Dumbbell className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Este plan no tiene días configurados</p>
          </div>
        ) : (
          plan.days.map((day) => (
            <div key={day.id} className="rounded-xl border bg-white overflow-hidden">
              {/* Day header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b bg-gray-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  {day.day_number}
                </span>
                <span className="font-semibold text-gray-800">{day.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {day.blocks.length} ejercicio{day.blocks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Exercises */}
              {day.blocks.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">Sin ejercicios</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {day.blocks.map((block) => (
                    <li key={block.id} className="flex items-center gap-4 px-5 py-3.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-violet-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800">{block.exercise.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {block.exercise.muscle_groups.map((m) => (
                            <span
                              key={m}
                              className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                            >
                              {MUSCLE_LABELS[m] ?? m}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-700">
                          {block.sets} × {block.reps_min}
                          {block.reps_max && block.reps_max !== block.reps_min
                            ? `–${block.reps_max}`
                            : ''}
                        </p>
                        {block.rest_seconds > 0 && (
                          <p className="text-xs text-gray-400">{block.rest_seconds}s descanso</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer link */}
      <Link
        href="/workouts/plans"
        className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-800"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        Ver todos los planes
      </Link>
    </div>
  );
}
