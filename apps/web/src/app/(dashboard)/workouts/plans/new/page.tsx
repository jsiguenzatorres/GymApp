import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { PlanBuilderClient } from '@/components/workout/plan-builder-client';

export const metadata: Metadata = { title: 'Crear Plan — GymApp' };

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  category: string;
}

export default async function NewPlanPage() {
  const exercises = await serverFetch<Exercise[]>('/api/v1/exercises');

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/workouts/plans"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crear plan de entrenamiento</h1>
        <p className="text-sm text-muted-foreground">Define días y ejercicios para el plan</p>
      </div>

      <PlanBuilderClient exercises={exercises ?? []} />
    </div>
  );
}
