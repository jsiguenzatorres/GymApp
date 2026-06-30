import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Activity, Dumbbell, Tag } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import {
  ExerciseImageCarousel,
  ExerciseVideoPlayer,
} from '@/components/workout/exercise-detail-client';

export const metadata: Metadata = { title: 'Detalle del ejercicio — GymApp' };

interface Exercise {
  id: string;
  gym_id: string | null;
  name: string;
  description: string | null;
  instructions: string | null;
  muscle_groups: string[];
  secondary_muscles: string[] | null;
  equipment: string[];
  category: string;
  difficulty: string;
  is_active: boolean;
  image_urls: string[] | null;
  video_url: string | null;
}

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  FOREARMS: 'Antebrazos',
  ABS: 'Abdomen',
  QUADS: 'Cuádriceps',
  HAMSTRINGS: 'Isquiotibiales',
  GLUTES: 'Glúteos',
  CALVES: 'Pantorrillas',
  TRAPS: 'Trapecios',
  NECK: 'Cuello',
  ADDUCTORS: 'Aductores',
  ABDUCTORS: 'Abductores',
  FULL_BODY: 'Cuerpo completo',
};

const EQUIP_LABELS: Record<string, string> = {
  BARBELL: 'Barra',
  DUMBBELL: 'Mancuernas',
  MACHINE: 'Máquina',
  CABLE: 'Cable',
  BODYWEIGHT: 'Peso corporal',
  KETTLEBELL: 'Kettlebell',
  BANDS: 'Bandas',
  OTHER: 'Otro',
};

const CAT_LABELS: Record<string, string> = {
  STRENGTH: 'Fuerza',
  CARDIO: 'Cardio',
  FLEXIBILITY: 'Flexibilidad',
  PLYOMETRIC: 'Pliométrico',
};

const DIFFICULTY_CONFIG: Record<string, { label: string; classes: string }> = {
  BEGINNER: {
    label: 'Principiante',
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  INTERMEDIATE: {
    label: 'Intermedio',
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  ADVANCED: {
    label: 'Avanzado',
    classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

function muscleLabel(code: string): string {
  return MUSCLE_LABELS[code.toUpperCase()] ?? code;
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await serverFetch<Exercise>(`/api/v1/exercises/${id}`);

  if (!exercise) {
    notFound();
  }

  const diff = DIFFICULTY_CONFIG[exercise.difficulty];
  const primary = exercise.muscle_groups ?? [];
  const secondary = exercise.secondary_muscles ?? [];
  const images = exercise.image_urls ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/workouts/exercises"
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Volver a la biblioteca"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {!exercise.gym_id && (
              <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                Global
              </span>
            )}
            {diff && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${diff.classes}`}>
                {diff.label}
              </span>
            )}
            <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400">
              {CAT_LABELS[exercise.category] ?? exercise.category}
            </span>
            {!exercise.is_active && (
              <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Inactivo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: media (imágenes y video) */}
        <div className="space-y-4">
          {images.length > 0 ? (
            <ExerciseImageCarousel images={images} />
          ) : (
            <div className="rounded-xl border bg-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Dumbbell className="h-10 w-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Sin imágenes</p>
            </div>
          )}

          {exercise.video_url && <ExerciseVideoPlayer videoUrl={exercise.video_url} />}
        </div>

        {/* Columna derecha: info */}
        <div className="space-y-4">
          {/* Para qué sirve */}
          {exercise.description && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Para qué sirve
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {exercise.description}
              </p>
            </div>
          )}

          {/* Músculos */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-base">💪</span>
              Músculos activados
            </h2>
            {primary.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Activación directa
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {primary.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400"
                    >
                      {muscleLabel(m)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {secondary.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Activación indirecta
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {secondary.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                    >
                      {muscleLabel(m)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Equipamiento */}
          {exercise.equipment.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Equipamiento
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment.map((eq) => (
                  <span
                    key={eq}
                    className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400"
                  >
                    {EQUIP_LABELS[eq] ?? eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {exercise.instructions && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="text-base">📋</span>
                Cómo ejecutarlo
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {exercise.instructions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
