'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

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

export default function NewClassTypePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [duration, setDuration] = useState(60);
  const [difficulty, setDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/schedule/admin/class-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || undefined,
          color,
          duration_minutes: duration,
          difficulty: difficulty || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(body.message)
          ? body.message.join(', ')
          : (body.message ?? `Error ${res.status}`);
        setError(
          res.status === 403
            ? `El plan actual de tu gym no permite esta funcionalidad. (${msg})`
            : msg,
        );
        return;
      }
      router.push('/classes?tab=types');
      router.refresh();
    } catch {
      setError('Error de red. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }

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
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
      >
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ej. Yoga, Spinning, Pilates"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe brevemente la clase..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color de identificación
          </label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <label key={c.value} className="flex flex-col items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="color"
                  value={c.value}
                  checked={color === c.value}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only peer"
                  disabled={loading}
                />
                <span
                  className="h-8 w-8 rounded-full ring-2 ring-transparent ring-offset-2 peer-checked:ring-gray-900 hover:ring-gray-400 transition-all"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: color === c.value ? `0 0 0 2px ${c.value}` : undefined,
                  }}
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
              type="number"
              required
              min={15}
              max={180}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
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
            disabled={loading || !name.trim()}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Creando...' : 'Crear tipo'}
          </button>
        </div>
      </form>
    </div>
  );
}
