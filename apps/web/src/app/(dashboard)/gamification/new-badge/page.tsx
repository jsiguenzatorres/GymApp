import { redirect } from 'next/navigation';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { ArrowLeft } from 'lucide-react';

const CONDITION_TYPES = [
  { label: 'Check-ins acumulados', value: 'CHECKIN_COUNT' },
  { label: 'Workouts completados', value: 'WORKOUT_COUNT' },
  { label: 'Récords personales', value: 'PR_COUNT' },
  { label: 'FitCoins lifetime', value: 'POINTS_EARNED' },
  { label: 'Días consecutivos de asistencia', value: 'STREAK_DAYS' },
];

const EMOJI_PRESETS = [
  '🏆',
  '🥇',
  '🥈',
  '🥉',
  '🎖️',
  '⭐',
  '🌟',
  '💪',
  '🔥',
  '⚡',
  '🎯',
  '🏅',
  '👑',
  '💎',
  '🦁',
  '🚀',
  '🌙',
  '🏋️',
  '🤸',
  '🧘',
];

async function createBadgeAction(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string;
  const condition_type = formData.get('condition_type') as string;
  const condition_value = parseInt(formData.get('condition_value') as string, 10);

  await serverFetch('/api/v1/gamification/admin/badges', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description: description || undefined,
      icon,
      condition_type,
      condition_value,
    }),
  });

  redirect('/gamification?tab=badges');
}

export default function NewBadgePage() {
  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/gamification?tab=badges"
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo badge</h1>
      </div>

      <form
        action={createBadgeAction}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            placeholder="Ej. Guerrero del Hierro, Primer Check-in..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="description"
            rows={2}
            placeholder="Explica qué logro representa este badge..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ícono (emoji) <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {EMOJI_PRESETS.map((emoji, i) => (
              <label key={emoji} className="cursor-pointer">
                <input
                  type="radio"
                  name="icon"
                  value={emoji}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent text-xl hover:border-violet-300 transition-colors cursor-pointer">
                  {emoji}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            También puedes escribir cualquier emoji directamente en el campo de nombre.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condición para obtener el badge <span className="text-red-500">*</span>
          </label>
          <select
            name="condition_type"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            {CONDITION_TYPES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meta (número requerido) <span className="text-red-500">*</span>
          </label>
          <input
            name="condition_value"
            type="number"
            required
            min={1}
            placeholder="Ej. 10, 50, 100..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Ejemplo: si la condición es &quot;Check-ins acumulados&quot; y la meta es 50, el badge
            se otorga al check-in número 50.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/gamification?tab=badges"
            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Crear badge
          </button>
        </div>
      </form>
    </div>
  );
}
