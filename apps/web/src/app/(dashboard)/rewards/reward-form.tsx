'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function RewardForm({ onSubmit }: { onSubmit: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
      >
        <Plus className="h-4 w-4" /> Nueva recompensa
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Nueva recompensa</h2>
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
              defaultValue="🎁"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-center text-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Nombre *</label>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Ej: Botella personalizada del gym"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Descripción</label>
          <textarea
            name="description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Botella de 750ml con el logo del gym, varios colores"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Costo (puntos) *</label>
            <input
              name="cost_points"
              type="number"
              required
              min={1}
              defaultValue={500}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Stock (-1 = ilimitado)</label>
            <input
              name="stock"
              type="number"
              defaultValue={-1}
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
            Crear recompensa
          </button>
        </div>
      </form>
    </div>
  );
}
