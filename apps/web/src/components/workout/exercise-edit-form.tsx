'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseVideoUpload } from './exercise-video-upload';

const MUSCLE_GROUPS = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'BICEPS',
  'TRICEPS',
  'FOREARMS',
  'QUADS',
  'HAMSTRINGS',
  'GLUTES',
  'CALVES',
  'ABS',
  'FULL_BODY',
];

const EQUIPMENT_LIST = [
  'BARBELL',
  'DUMBBELL',
  'MACHINE',
  'CABLE',
  'BODYWEIGHT',
  'KETTLEBELL',
  'BANDS',
  'OTHER',
];

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

interface InitialExercise {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  muscle_groups: string[];
  secondary_muscles: string[] | null;
  equipment: string[];
  category: string;
  difficulty: string;
  video_url: string | null;
  is_active: boolean;
  gym_id: string | null;
}

const inputClass = cn(
  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
);

export function ExerciseEditForm({ exercise }: { exercise: InitialExercise }) {
  const router = useRouter();
  const isGlobal = !exercise.gym_id;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: exercise.name,
    description: exercise.description ?? '',
    instructions: exercise.instructions ?? '',
    videoUrl: exercise.video_url ?? '',
    muscleGroups: exercise.muscle_groups ?? [],
    secondaryMuscles: exercise.secondary_muscles ?? [],
    equipment: exercise.equipment ?? [],
    category: exercise.category,
    difficulty: exercise.difficulty,
    isActive: exercise.is_active,
  });

  const toggleArray = (field: 'muscleGroups' | 'secondaryMuscles' | 'equipment', value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (form.muscleGroups.length === 0) {
      setError('Selecciona al menos un músculo primario');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/proxy/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          instructions: form.instructions || undefined,
          videoUrl: form.videoUrl || undefined,
          muscleGroups: form.muscleGroups,
          secondaryMuscles: form.secondaryMuscles,
          equipment: form.equipment,
          category: form.category,
          difficulty: form.difficulty,
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(
          Array.isArray(body.message)
            ? body.message.join(', ')
            : (body.message ?? 'Error al actualizar'),
        );
        return;
      }

      router.push(`/workouts/exercises/${exercise.id}`);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (
      !confirm(
        '¿Desactivar este ejercicio? No aparecerá en búsquedas pero el historial se conserva.',
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proxy/exercises/${exercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) {
        router.push('/workouts/exercises');
        router.refresh();
      } else {
        setError('No se pudo desactivar');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isGlobal && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          ⚠️ Este es un ejercicio <strong>global</strong> de la biblioteca general. Los cambios
          afectarán a todos los gimnasios. Considera duplicarlo en su lugar.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Nombre *</label>
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className={inputClass}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Descripción / Para qué sirve</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          rows={2}
          className={inputClass}
          disabled={isLoading}
          placeholder="¿Para qué sirve este ejercicio?"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Instrucciones técnicas</label>
        <textarea
          value={form.instructions}
          onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
          rows={4}
          className={inputClass}
          disabled={isLoading}
          placeholder="Cómo ejecutarlo correctamente, paso a paso..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Video técnico</label>
        <input
          value={form.videoUrl}
          onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
          className={inputClass}
          disabled={isLoading}
          placeholder="https://youtube.com/watch?v=... o link directo a .mp4"
        />
        <p className="text-xs text-muted-foreground">
          Pega un link de YouTube (se embebe automático) o un archivo directo .mp4/.webm.
        </p>
        <ExerciseVideoUpload
          disabled={isLoading}
          onUploaded={(url) => setForm((p) => ({ ...p, videoUrl: url }))}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Músculos primarios *</label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              type="button"
              onClick={() => toggleArray('muscleGroups', mg)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                form.muscleGroups.includes(mg)
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {MUSCLE_LABELS[mg]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Músculos secundarios{' '}
          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((mg) => (
            <button
              key={mg}
              type="button"
              onClick={() => toggleArray('secondaryMuscles', mg)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                form.secondaryMuscles.includes(mg)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {MUSCLE_LABELS[mg]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Equipamiento</label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_LIST.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggleArray('equipment', eq)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                form.equipment.includes(eq)
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {EQUIP_LABELS[eq]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            className={inputClass}
            disabled={isLoading}
          >
            {Object.entries(CAT_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Dificultad</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
            className={inputClass}
            disabled={isLoading}
          >
            <option value="BEGINNER">Principiante</option>
            <option value="INTERMEDIATE">Intermedio</option>
            <option value="ADVANCED">Avanzado</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          id="isActive"
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
          className="h-4 w-4 accent-violet-600"
          disabled={isLoading}
        />
        <label htmlFor="isActive" className="text-sm text-gray-600 cursor-pointer">
          Ejercicio activo (visible en biblioteca)
        </label>
      </div>

      <div className="flex gap-3 pt-3">
        {!isGlobal && (
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={deleting || isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Desactivar
          </button>
        )}
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
