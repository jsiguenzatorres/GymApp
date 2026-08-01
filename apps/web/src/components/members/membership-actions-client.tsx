'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  memberId: string;
  membershipId: string;
  status: string;
  startDate: string;
  endDate: string;
}

// Coincide con formatDate() de la página (toLocaleDateString sin timeZone,
// es decir hora local del sistema) — un slice(0,10) directo del ISO en UTC
// puede caer un día antes/después de la fecha que el usuario ve mostrada.
function toDateInputValue(iso: string) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MembershipActionsClient({
  memberId,
  membershipId,
  status,
  startDate,
  endDate,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingDates, setEditingDates] = useState(false);
  const [dates, setDates] = useState({
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
  });

  async function callAction(action: 'freeze' | 'unfreeze' | 'cancel' | 'dates', body?: object) {
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
        setEditingDates(false);
        router.refresh();
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(null);
    }
  }

  async function saveDates() {
    await callAction('dates', { startDate: dates.startDate, endDate: dates.endDate });
  }

  if (editingDates) {
    return (
      <div className="space-y-2 pt-1">
        <div className="flex gap-2">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Inicio</label>
            <input
              type="date"
              value={dates.startDate}
              onChange={(e) => setDates((d) => ({ ...d, startDate: e.target.value }))}
              className="rounded-lg border bg-background px-2 py-1.5 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Fin</label>
            <input
              type="date"
              value={dates.endDate}
              onChange={(e) => setDates((d) => ({ ...d, endDate: e.target.value }))}
              className="rounded-lg border bg-background px-2 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveDates}
            disabled={loading !== null}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading === 'dates' ? 'Guardando...' : 'Guardar fechas'}
          </button>
          <button
            onClick={() => setEditingDates(false)}
            disabled={loading !== null}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setEditingDates(true)}
          disabled={loading !== null}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Editar fechas
        </button>
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
