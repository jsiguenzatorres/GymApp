'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  memberId: string;
  membershipId: string;
  status: string;
}

export function MembershipActionsClient({ memberId, membershipId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function callAction(action: 'freeze' | 'unfreeze' | 'cancel', body?: object) {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(
        `/api/proxy/members/${memberId}/memberships/${membershipId}/${action}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? 'Error al procesar la acción');
      } else {
        router.refresh();
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 pt-1">
        {status === 'ACTIVE' && (
          <button
            onClick={() => callAction('freeze')}
            disabled={loading !== null}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading === 'freeze' ? 'Procesando...' : 'Congelar'}
          </button>
        )}
        {status === 'FROZEN' && (
          <button
            onClick={() => callAction('unfreeze')}
            disabled={loading !== null}
            className="rounded-lg border border-emerald-300 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
          >
            {loading === 'unfreeze' ? 'Procesando...' : 'Descongelar'}
          </button>
        )}
        {['ACTIVE', 'FROZEN', 'TRIAL'].includes(status) && (
          <button
            onClick={() => callAction('cancel', { reason: 'Cancelado desde panel admin' })}
            disabled={loading !== null}
            className="rounded-lg border border-red-200 text-red-600 dark:text-red-400 px-3 py-1.5 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
          >
            {loading === 'cancel' ? 'Procesando...' : 'Cancelar membresía'}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
