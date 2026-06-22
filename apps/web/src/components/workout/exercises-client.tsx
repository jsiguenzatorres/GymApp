'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Dumbbell, AlertCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  gym_id: string | null;
  name: string;
  description: string | null;
  muscle_groups: string[];
  equipment: string[];
  category: string;
  difficulty: string;
  is_active: boolean;
}

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

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
};

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const inputClass = cn(
  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
);

export function ExercisesClient({
  exercises,
  muscleLabels,
  equipLabels,
  catLabels,
}: {
  exercises: Exercise[];
  muscleLabels: Record<string, string>;
  equipLabels: Record<string, string>;
  catLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    muscleGroups: [] as string[],
    equipment: [] as string[],
    category: 'STRENGTH',
    difficulty: 'INTERMEDIATE',
    instructions: '',
  });

  const toggleArray = (field: 'muscleGroups' | 'equipment', value: string) => {
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
      setError('Selecciona al menos un músculo');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/proxy/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          muscleGroups: form.muscleGroups,
          equipment: form.equipment,
          category: form.category,
          difficulty: form.difficulty,
          instructions: form.instructions || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al crear el ejercicio');
        return;
      }

      setShowForm(false);
      setForm({
        name: '',
        description: '',
        muscleGroups: [],
        equipment: [],
        category: 'STRENGTH',
        difficulty: 'INTERMEDIATE',
        instructions: '',
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {exercises.length === 0
            ? 'Sin resultados'
            : `${exercises.length} ejercicio${exercises.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Añadir ejercicio'}
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-semibold">Nuevo ejercicio personalizado</h3>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Press de banca con barra"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-sm font-medium">
                Descripción{' '}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descripción breve..."
                className={inputClass}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Músculos primarios</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleArray('muscleGroups', mg)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                    form.muscleGroups.includes(mg)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted',
                  )}
                >
                  {muscleLabels[mg]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Equipamiento{' '}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </label>
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
                  {equipLabels[eq]}
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
                {Object.entries(catLabels).map(([v, l]) => (
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Instrucciones{' '}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              rows={3}
              placeholder="Pasos de ejecución..."
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
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
              {isLoading ? 'Guardando...' : 'Guardar ejercicio'}
            </button>
          </div>
        </form>
      )}

      {/* Grid de ejercicios */}
      {exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="font-medium">Sin ejercicios</p>
          <p className="text-sm text-muted-foreground">
            Cambia los filtros o añade un ejercicio personalizado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="rounded-lg border bg-card p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-tight">{ex.name}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!ex.gym_id && (
                    <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-400 font-medium">
                      Global
                    </span>
                  )}
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      DIFF_COLORS[ex.difficulty] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    {DIFFICULTY_LABELS[ex.difficulty] ?? ex.difficulty}
                  </span>
                </div>
              </div>

              {ex.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{ex.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {ex.muscle_groups.slice(0, 3).map((mg) => (
                  <span
                    key={mg}
                    className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-400"
                  >
                    {muscleLabels[mg] ?? mg}
                  </span>
                ))}
                {ex.muscle_groups.length > 3 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    +{ex.muscle_groups.length - 3}
                  </span>
                )}
              </div>

              {ex.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ex.equipment.map((eq) => (
                    <span key={eq} className="text-xs text-muted-foreground">
                      {equipLabels[eq] ?? eq}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
