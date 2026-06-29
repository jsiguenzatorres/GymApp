'use client';
import { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';

interface ContentItem {
  name: string;
  brand?: string;
  quantity: number;
  qty_unit?: string;
}

const currentMonth = () => {
  // No usar Date.now / new Date() en cliente sin guardar; aquí se ejecuta en
  // browser, no en script de workflow, así que sí podemos hacerlo.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function BoxForm({ onSubmit }: { onSubmit: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [draft, setDraft] = useState<ContentItem>({ name: '', quantity: 1 });

  const addItem = () => {
    if (!draft.name.trim()) return;
    setContents((prev) => [...prev, draft]);
    setDraft({ name: '', quantity: 1 });
  };

  const removeItem = (i: number) => {
    setContents((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
      >
        <Plus className="h-4 w-4" /> Nueva caja del mes
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Nueva caja</h2>
        <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-gray-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form
        action={async (fd) => {
          fd.set('contents_json', JSON.stringify(contents));
          await onSubmit(fd);
          setOpen(false);
          setContents([]);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Mes (YYYY-MM)</label>
            <input
              name="month"
              defaultValue={currentMonth()}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Fecha entrega</label>
            <input
              name="delivery_date"
              type="date"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Título *</label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Caja Octubre — Definición"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Descripción</label>
          <textarea
            name="description"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Productos seleccionados por el nutricionista para tu fase de definición"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Cover URL</label>
          <input
            name="cover_url"
            type="url"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>

        {/* Builder de contenido */}
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <label className="text-xs font-semibold text-gray-600">Contenido de la caja</label>

          {contents.length > 0 && (
            <ul className="mt-2 space-y-1">
              {contents.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded bg-gray-50 px-2 py-1 text-xs"
                >
                  <span className="flex-1">
                    <span className="font-semibold">{c.quantity}</span>
                    {c.qty_unit ? c.qty_unit : ''} {c.name}
                    {c.brand && <span className="text-gray-400"> ({c.brand})</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 grid grid-cols-[1fr_80px_60px_auto] gap-2">
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Proteína whey"
              className="rounded border border-gray-200 px-2 py-1 text-xs"
            />
            <input
              value={draft.brand ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
              placeholder="Marca"
              className="rounded border border-gray-200 px-2 py-1 text-xs"
            />
            <input
              type="number"
              min={1}
              value={draft.quantity}
              onChange={(e) =>
                setDraft((d) => ({ ...d, quantity: parseInt(e.target.value, 10) || 1 }))
              }
              className="rounded border border-gray-200 px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={addItem}
              className="rounded bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-700"
            >
              +
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_published" />
          <span className="text-sm text-gray-700">Publicar inmediatamente</span>
        </label>

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
            Crear caja
          </button>
        </div>
      </form>
    </div>
  );
}
