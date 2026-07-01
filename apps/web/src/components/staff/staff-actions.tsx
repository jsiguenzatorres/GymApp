'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Power, Loader2 } from 'lucide-react';

export function StaffActions({ staffId, isActive }: { staffId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function toggleActive() {
    setPending(true);
    setError(null);
    try {
      const res = isActive
        ? await fetch(`/api/proxy/staff/${staffId}`, { method: 'DELETE' })
        : await fetch(`/api/proxy/staff/${staffId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: true }),
          });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Error ${res.status}`);
      }
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Link
          href={`/staff/${staffId}/edit`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Link>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {isActive ? 'Desactivar' : 'Reactivar'}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
            <span className="text-xs font-medium text-gray-600">¿Confirmar?</span>
            <button
              onClick={toggleActive}
              disabled={pending}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50 ${
                isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {pending && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}
              Sí
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-white"
            >
              No
            </button>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
