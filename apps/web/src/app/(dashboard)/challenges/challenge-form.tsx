'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function ChallengeForm({ onSubmit }: { onSubmit: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
      >
        <Plus className="h-4 w-4" /> Nuevo reto
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Nuevo reto</h2>
        <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        action={async (fd) => {
          await onSubmit(fd);
          setOpen(false);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Emoji</label>
            <input
              name="cover_emoji"
              defaultValue="🏆"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Nombre *</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Reto 30 días consecutivos"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Descripción</label>
          <textarea
            name="description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Asiste al gym todos los días durante 30 días seguidos"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Tipo de meta *</label>
            <select
              name="goal_type"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="CHECKIN_COUNT">Check-ins</option>
              <option value="SESSION_COUNT">Sesiones</option>
              <option value="STREAK_DAYS">Días de racha</option>
              <option value="VOLUME_KG">Volumen total (kg)</option>
              <option value="CLASS_COUNT">Clases asistidas</option>
              <option value="KCAL_BURNED">Kcal quemadas</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Valor meta *</label>
            <input
              name="goal_value"
              type="number"
              required
              min={1}
              defaultValue={30}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Puntos premio</label>
            <input
              name="reward_points"
              type="number"
              min={0}
              defaultValue={500}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Inicia *</label>
            <input
              name="starts_at"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Termina *</label>
            <input
              name="ends_at"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Crear reto
          </button>
        </div>
      </form>
    </div>
  );
}
