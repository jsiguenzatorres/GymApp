import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { ExerciseEditForm } from '@/components/workout/exercise-edit-form';

export const metadata: Metadata = { title: 'Editar ejercicio — GymApp' };

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
  video_url: string | null;
}

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exercise = await serverFetch<Exercise>(`/api/v1/exercises/${id}`);

  if (!exercise) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/workouts/exercises/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al ejercicio
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar ejercicio</h1>
        <p className="text-sm text-muted-foreground">{exercise.name}</p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <ExerciseEditForm exercise={exercise} />
      </div>
    </div>
  );
}
