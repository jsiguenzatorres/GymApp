'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

export function PlanActions({ planId }: { planId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/proxy/workout-plans/${planId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al eliminar');
        return;
      }
      router.push('/workouts/plans');
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/workouts/plans/${planId}/edit`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
        Editar
      </Link>

      <Link
        href={`/workouts/plans/new?clone=${planId}`}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Duplicar
      </Link>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5">
          <span className="text-xs font-medium text-red-700">¿Confirmar?</span>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Sí, eliminar
          </button>
          <button
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={pending}
            className="rounded-md px-2 py-1 text-xs text-gray-700 hover:bg-white"
          >
            Cancelar
          </button>
        </div>
      )}

      {error && <span className="text-xs text-red-600 ml-2">{error}</span>}
    </div>
  );
}
