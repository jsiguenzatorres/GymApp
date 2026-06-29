'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function BlogEditor({ onSubmit }: { onSubmit: (fd: FormData) => Promise<void> }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
      >
        <Plus className="h-4 w-4" /> Nuevo post
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Nuevo post</h2>
        <button
          onClick={() => setOpen(false)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
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
        <div>
          <label className="text-xs font-semibold text-gray-600">Título *</label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="5 ejercicios para fortalecer tu core"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Categoría</label>
            <input
              name="category"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="entrenamiento"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Autor</label>
            <input
              name="author_name"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Coach Juan"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Cover URL (opcional)</label>
          <input
            name="cover_url"
            type="url"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Excerpt (resumen breve)</label>
          <textarea
            name="excerpt"
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Una línea o dos que aparezcan en la lista"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Contenido (Markdown) *</label>
          <textarea
            name="content_md"
            required
            rows={12}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm"
            placeholder={'# Encabezado\n\nPuedes escribir en **markdown**.\n\n- Tip 1\n- Tip 2'}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Tags (separados por coma)</label>
          <input
            name="tags"
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="core, fuerza, principiantes"
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_published" />
          <span className="text-sm text-gray-700">Publicar inmediatamente</span>
        </label>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Crear post
          </button>
        </div>
      </form>
    </div>
  );
}
