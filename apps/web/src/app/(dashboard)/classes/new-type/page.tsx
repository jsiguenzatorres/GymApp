import { redirect } from 'next/navigation';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { ArrowLeft } from 'lucide-react';

const COLORS = [
  { label: 'Azul', value: '#1d4ed8' },
  { label: 'Violeta', value: '#7c3aed' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Ámbar', value: '#d97706' },
  { label: 'Rojo', value: '#dc2626' },
  { label: 'Rosa', value: '#db2777' },
  { label: 'Cyan', value: '#0891b2' },
  { label: 'Naranja', value: '#ea580c' },
];

const DIFFICULTIES = [
  { label: 'Básico', value: 'BEGINNER' },
  { label: 'Intermedio', value: 'INTERMEDIATE' },
  { label: 'Avanzado', value: 'ADVANCED' },
];

async function createClassTypeAction(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const color = formData.get('color') as string;
  const duration_minutes = parseInt(formData.get('duration_minutes') as string, 10);
  const difficulty = formData.get('difficulty') as string;

  await serverFetch('/api/v1/schedule/admin/class-types', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: description || undefined,
      color,
      duration_minutes,
      difficulty: difficulty || undefined,
    }),
  });

  redirect('/classes?tab=types');
}

export default function NewClassTypePage() {
  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/classes?tab=types"
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo tipo de clase</h1>
      </div>

      <form
        action={createClassTypeAction}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="Ej. Yoga, Spinning, Pilates"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Describe brevemente la clase..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color de identificación
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c, i) => (
              <label key={c.value} className="flex flex-col items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c.value}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span
                  className="h-8 w-8 rounded-full ring-2 ring-transparent ring-offset-2 peer-checked:ring-gray-900 hover:ring-gray-400 transition-all"
                  style={{ backgroundColor: c.value }}
                />
                <span className="text-xs text-gray-500">{c.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración (minutos) <span className="text-red-500">*</span>
            </label>
            <input
              name="duration_minutes"
              type="number"
              required
              min={15}
              max={180}
              defaultValue={60}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
            <select
              name="difficulty"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Sin especificar</option>
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/classes?tab=types"
            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Crear tipo
          </button>
        </div>
      </form>
    </div>
  );
}
