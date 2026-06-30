import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { PlanBuilderClient } from '@/components/workout/plan-builder-client';

export const metadata: Metadata = { title: 'Editar Plan — GymApp' };

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  category: string;
}

interface PlanData {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string;
  days_per_week: number;
  is_template: boolean;
  days: Array<{
    day_number: number;
    name: string;
    blocks: Array<{
      exercise: { id: string; name: string };
      block_type: string;
      order: number;
      sets: number;
      reps_min: number | null;
      reps_max: number | null;
      rest_seconds: number | null;
      notes: string | null;
    }>;
  }>;
}

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plan, exercises] = await Promise.all([
    serverFetch<PlanData>(`/api/v1/workout-plans/${id}`),
    serverFetch<Exercise[]>('/api/v1/exercises'),
  ]);

  if (!plan) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/workouts/plans/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al plan
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar plan</h1>
        <p className="text-sm text-muted-foreground">
          Modifica días, ejercicios e información del plan
        </p>
      </div>

      <PlanBuilderClient exercises={exercises ?? []} initialPlan={plan} />
    </div>
  );
}
