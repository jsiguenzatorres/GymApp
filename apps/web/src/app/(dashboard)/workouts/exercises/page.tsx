import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { ExercisesClient } from '@/components/workout/exercises-client';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Ejercicios — GymApp' };

interface Exercise {
  id: string;
  gym_id: string | null;
  name: string;
  description: string | null;
  muscle_groups: string[];
  secondary_muscles: string[];
  equipment: string[];
  category: string;
  difficulty: string;
  is_active: boolean;
}

interface PageProps {
  searchParams: Promise<{
    search?: string;
    muscleGroup?: string;
    equipment?: string;
    category?: string;
  }>;
}

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  FOREARMS: 'Antebrazos',
  QUADS: 'Cuádriceps',
  HAMSTRINGS: 'Isquiotibiales',
  GLUTES: 'Glúteos',
  CALVES: 'Pantorrillas',
  ABS: 'Abdominales',
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

export default async function ExercisesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.muscleGroup) qs.set('muscleGroup', params.muscleGroup);
  if (params.equipment) qs.set('equipment', params.equipment);
  if (params.category) qs.set('category', params.category);

  const exercises = await serverFetch<Exercise[]>(`/api/v1/exercises?${qs.toString()}`);
  const list = exercises ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/workouts"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca de ejercicios</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} ejercicio{list.length !== 1 ? 's' : ''} disponibles
          </p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Búsqueda</label>
          <input
            name="search"
            type="text"
            defaultValue={params.search}
            placeholder="Nombre del ejercicio..."
            className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary w-56"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Músculo</label>
          <select
            name="muscleGroup"
            defaultValue={params.muscleGroup ?? ''}
            className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Todos</option>
            {Object.entries(MUSCLE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Equipamiento</label>
          <select
            name="equipment"
            defaultValue={params.equipment ?? ''}
            className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Todos</option>
            {Object.entries(EQUIP_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Categoría</label>
          <select
            name="category"
            defaultValue={params.category ?? ''}
            className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Todas</option>
            {Object.entries(CAT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Filtrar
        </button>
        {(params.search || params.muscleGroup || params.equipment || params.category) && (
          <a
            href="/workouts/exercises"
            className="flex h-9 items-center rounded-lg border px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Limpiar
          </a>
        )}
      </form>

      {/* Grid + form para crear ejercicio (client component) */}
      <ExercisesClient
        exercises={list}
        muscleLabels={MUSCLE_LABELS}
        equipLabels={EQUIP_LABELS}
        catLabels={CAT_LABELS}
      />
    </div>
  );
}
