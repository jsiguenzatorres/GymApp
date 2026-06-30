'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  muscle_groups: string[];
  equipment: string[];
  category: string;
}

interface BlockDraft {
  exerciseId: string;
  exerciseName: string;
  blockType: string;
  order: number;
  sets: number;
  repsMin: number | '';
  repsMax: number | '';
  restSeconds: number | '';
  notes: string;
}

interface DayDraft {
  dayNumber: number;
  name: string;
  blocks: BlockDraft[];
  expanded: boolean;
}

const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  QUADS: 'Cuádriceps',
  HAMSTRINGS: 'Isquiotibiales',
  GLUTES: 'Glúteos',
  ABS: 'Abdominales',
  CALVES: 'Pantorrillas',
  FOREARMS: 'Antebrazos',
  FULL_BODY: 'Cuerpo completo',
};

const GOAL_OPTIONS = [
  { value: 'STRENGTH', label: 'Fuerza' },
  { value: 'HYPERTROPHY', label: 'Hipertrofia' },
  { value: 'ENDURANCE', label: 'Resistencia' },
  { value: 'WEIGHT_LOSS', label: 'Pérdida de peso' },
  { value: 'ATHLETIC', label: 'Rendimiento atlético' },
  { value: 'GENERAL_FITNESS', label: 'Fitness general' },
];

const inputClass = cn(
  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
);

interface InitialPlan {
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

export function PlanBuilderClient({
  exercises,
  initialPlan,
}: {
  exercises: Exercise[];
  initialPlan?: InitialPlan;
}) {
  const router = useRouter();
  const isEdit = !!initialPlan;

  const [planInfo, setPlanInfo] = useState({
    name: initialPlan?.name ?? '',
    description: initialPlan?.description ?? '',
    goal: initialPlan?.goal ?? '',
    difficulty: initialPlan?.difficulty ?? 'INTERMEDIATE',
    daysPerWeek: initialPlan?.days_per_week ?? 3,
    isTemplate: initialPlan?.is_template ?? false,
  });

  const [days, setDays] = useState<DayDraft[]>(() => {
    if (initialPlan && initialPlan.days.length > 0) {
      return initialPlan.days.map((d, i) => ({
        dayNumber: d.day_number,
        name: d.name,
        expanded: i === 0,
        blocks: d.blocks
          .sort((a, b) => a.order - b.order)
          .map((b) => ({
            exerciseId: b.exercise.id,
            exerciseName: b.exercise.name,
            blockType: b.block_type,
            order: b.order,
            sets: b.sets,
            repsMin: (b.reps_min ?? '') as number | '',
            repsMax: (b.reps_max ?? '') as number | '',
            restSeconds: (b.rest_seconds ?? '') as number | '',
            notes: b.notes ?? '',
          })),
      }));
    }
    return [
      { dayNumber: 1, name: 'Día 1', blocks: [], expanded: true },
      { dayNumber: 2, name: 'Día 2', blocks: [], expanded: false },
      { dayNumber: 3, name: 'Día 3', blocks: [], expanded: false },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync days count with daysPerWeek
  const updateDaysPerWeek = (count: number) => {
    setPlanInfo((p) => ({ ...p, daysPerWeek: count }));
    setDays((prev) => {
      if (count > prev.length) {
        const added = Array.from({ length: count - prev.length }, (_, i) => ({
          dayNumber: prev.length + i + 1,
          name: `Día ${prev.length + i + 1}`,
          blocks: [],
          expanded: false,
        }));
        return [...prev, ...added];
      }
      return prev.slice(0, count);
    });
  };

  const addBlock = (dayIndex: number) => {
    if (exercises.length === 0) return;
    const ex = exercises[0];
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.blocks = [
        ...day.blocks,
        {
          exerciseId: ex.id,
          exerciseName: ex.name,
          blockType: 'STANDARD',
          order: day.blocks.length + 1,
          sets: 3,
          repsMin: 8,
          repsMax: 12,
          restSeconds: 90,
          notes: '',
        },
      ];
      updated[dayIndex] = day;
      return updated;
    });
  };

  const updateBlock = (
    dayIndex: number,
    blockIndex: number,
    field: keyof BlockDraft,
    value: unknown,
  ) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.blocks = day.blocks.map((b, i) => {
        if (i !== blockIndex) return b;
        if (field === 'exerciseId') {
          const ex = exercises.find((e) => e.id === String(value));
          return { ...b, exerciseId: String(value), exerciseName: ex?.name ?? b.exerciseName };
        }
        return { ...b, [field]: value };
      });
      updated[dayIndex] = day;
      return updated;
    });
  };

  const removeBlock = (dayIndex: number, blockIndex: number) => {
    setDays((prev) => {
      const updated = [...prev];
      const day = { ...updated[dayIndex] };
      day.blocks = day.blocks
        .filter((_, i) => i !== blockIndex)
        .map((b, i) => ({ ...b, order: i + 1 }));
      updated[dayIndex] = day;
      return updated;
    });
  };

  const toggleDay = (dayIndex: number) => {
    setDays((prev) => prev.map((d, i) => (i === dayIndex ? { ...d, expanded: !d.expanded } : d)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planInfo.name.trim()) {
      setError('El nombre del plan es obligatorio');
      return;
    }

    setIsLoading(true);
    setError('');

    const payload = {
      name: planInfo.name,
      description: planInfo.description || undefined,
      goal: planInfo.goal || undefined,
      difficulty: planInfo.difficulty,
      daysPerWeek: planInfo.daysPerWeek,
      isTemplate: planInfo.isTemplate,
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        name: d.name || undefined,
        blocks: d.blocks.map((b) => ({
          exerciseId: b.exerciseId,
          blockType: b.blockType,
          order: b.order,
          sets: b.sets,
          repsMin: b.repsMin !== '' ? b.repsMin : undefined,
          repsMax: b.repsMax !== '' ? b.repsMax : undefined,
          restSeconds: b.restSeconds !== '' ? b.restSeconds : undefined,
          notes: b.notes || undefined,
        })),
      })),
    };

    try {
      const url = isEdit
        ? `/api/proxy/workout-plans/${initialPlan!.id}`
        : '/api/proxy/workout-plans';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(
          Array.isArray(body.message)
            ? body.message.join(', ')
            : (body.message ?? `Error al ${isEdit ? 'actualizar' : 'crear'} el plan`),
        );
        return;
      }

      setSuccess(isEdit ? 'Plan actualizado exitosamente' : 'Plan creado exitosamente');
      setTimeout(
        () => router.push(isEdit ? `/workouts/plans/${initialPlan!.id}` : '/workouts/plans'),
        1500,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="font-semibold text-emerald-700 dark:text-emerald-300">{success}</p>
        <p className="text-sm text-muted-foreground">Redirigiendo...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Info del plan */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Información del plan
        </h3>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nombre del plan</label>
          <input
            value={planInfo.name}
            onChange={(e) => setPlanInfo((p) => ({ ...p, name: e.target.value }))}
            placeholder="Plan de hipertrofia 3 días"
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Descripción{' '}
            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            value={planInfo.description}
            onChange={(e) => setPlanInfo((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="Descripción del plan..."
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Objetivo</label>
            <select
              value={planInfo.goal}
              onChange={(e) => setPlanInfo((p) => ({ ...p, goal: e.target.value }))}
              className={inputClass}
              disabled={isLoading}
            >
              <option value="">Sin objetivo</option>
              {GOAL_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Dificultad</label>
            <select
              value={planInfo.difficulty}
              onChange={(e) => setPlanInfo((p) => ({ ...p, difficulty: e.target.value }))}
              className={inputClass}
              disabled={isLoading}
            >
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Días / semana</label>
            <select
              value={planInfo.daysPerWeek}
              onChange={(e) => updateDaysPerWeek(parseInt(e.target.value))}
              className={inputClass}
              disabled={isLoading}
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Días */}
      {days.map((day, dayIndex) => (
        <div key={day.dayNumber} className="rounded-xl border bg-card overflow-hidden">
          {/* Day header */}
          <button
            type="button"
            onClick={() => toggleDay(dayIndex)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {day.dayNumber}
              </span>
              <input
                type="text"
                value={day.name}
                onChange={(e) => {
                  e.stopPropagation();
                  setDays((prev) =>
                    prev.map((d, i) => (i === dayIndex ? { ...d, name: e.target.value } : d)),
                  );
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent font-medium text-sm outline-none focus:underline"
                disabled={isLoading}
              />
              <span className="text-xs text-muted-foreground">
                {day.blocks.length} ejercicio{day.blocks.length !== 1 ? 's' : ''}
              </span>
            </div>
            {day.expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {day.expanded && (
            <div className="px-5 pb-5 space-y-3 border-t">
              {day.blocks.map((block, blockIndex) => (
                <div key={blockIndex} className="flex items-start gap-2 pt-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground mt-2.5">
                    {blockIndex + 1}
                  </span>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs text-muted-foreground">Ejercicio</label>
                      <select
                        value={block.exerciseId}
                        onChange={(e) =>
                          updateBlock(dayIndex, blockIndex, 'exerciseId', e.target.value)
                        }
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        disabled={isLoading}
                      >
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name}{' '}
                            {ex.muscle_groups.length > 0
                              ? `(${MUSCLE_LABELS[ex.muscle_groups[0]] ?? ex.muscle_groups[0]})`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Series</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={block.sets}
                        onChange={(e) =>
                          updateBlock(dayIndex, blockIndex, 'sets', parseInt(e.target.value) || 1)
                        }
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-center"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Reps (min–max)</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={block.repsMin}
                          onChange={(e) =>
                            updateBlock(
                              dayIndex,
                              blockIndex,
                              'repsMin',
                              e.target.value === '' ? '' : parseInt(e.target.value),
                            )
                          }
                          placeholder="8"
                          className="w-full rounded-lg border bg-background px-2 py-2 text-sm outline-none focus:border-primary text-center"
                          disabled={isLoading}
                        />
                        <span className="text-muted-foreground text-xs">–</span>
                        <input
                          type="number"
                          min="1"
                          value={block.repsMax}
                          onChange={(e) =>
                            updateBlock(
                              dayIndex,
                              blockIndex,
                              'repsMax',
                              e.target.value === '' ? '' : parseInt(e.target.value),
                            )
                          }
                          placeholder="12"
                          className="w-full rounded-lg border bg-background px-2 py-2 text-sm outline-none focus:border-primary text-center"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlock(dayIndex, blockIndex)}
                    className="mt-6 rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {exercises.length > 0 ? (
                <button
                  type="button"
                  onClick={() => addBlock(dayIndex)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium pt-1 transition-colors"
                  disabled={isLoading}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir ejercicio
                </button>
              ) : (
                <p className="text-xs text-muted-foreground pt-2">
                  No hay ejercicios disponibles.{' '}
                  <a href="/workouts/exercises" className="underline text-primary">
                    Añade ejercicios primero.
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/workouts/plans')}
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
          {isLoading
            ? isEdit
              ? 'Actualizando plan...'
              : 'Guardando plan...'
            : isEdit
              ? 'Actualizar plan'
              : 'Guardar plan'}
        </button>
      </div>
    </form>
  );
}
