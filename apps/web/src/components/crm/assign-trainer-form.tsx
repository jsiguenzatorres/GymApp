'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  requestId: string;
  scheduledAt: string;
  durationMin: number;
  trainers: Trainer[];
}

type AvailabilityState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'unavailable'; reason: string };

export function AssignTrainerForm({ requestId, scheduledAt, durationMin, trainers }: Props) {
  const router = useRouter();
  const [trainerId, setTrainerId] = useState('');
  const [availability, setAvailability] = useState<AvailabilityState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const requestSeq = useRef(0);

  const checkAvailability = useCallback(
    async (id: string) => {
      if (!id) {
        setAvailability({ status: 'idle' });
        return;
      }
      const seq = ++requestSeq.current;
      setAvailability({ status: 'checking' });
      try {
        const res = await fetch(
          `/api/proxy/staff/${id}/check-availability?scheduledAt=${encodeURIComponent(scheduledAt)}&durationMin=${durationMin}`,
        );
        if (seq !== requestSeq.current) return; // respuesta obsoleta (el operador ya cambió de entrenador)
        if (!res.ok) {
          setAvailability({ status: 'idle' });
          return;
        }
        const data = (await res.json()) as { available: boolean; reason?: string };
        setAvailability(
          data.available
            ? { status: 'available' }
            : { status: 'unavailable', reason: data.reason ?? 'No disponible' },
        );
      } catch {
        if (seq === requestSeq.current) setAvailability({ status: 'idle' });
      }
    },
    [scheduledAt, durationMin],
  );

  function handleSelect(id: string) {
    setTrainerId(id);
    checkAvailability(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trainerId) return;
    setSubmitting(true);
    try {
      await fetch(`/api/proxy/pt-sessions/${requestId}/assign-trainer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId }),
      });
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={trainerId}
        onChange={(e) => handleSelect(e.target.value)}
        required
        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
      >
        <option value="" disabled>
          Elegir entrenador...
        </option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.first_name} {t.last_name}
          </option>
        ))}
      </select>

      {availability.status === 'checking' && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
      )}
      {availability.status === 'available' && (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Disponible
        </span>
      )}
      {availability.status === 'unavailable' && (
        <span
          className="flex items-center gap-1 text-xs font-medium text-red-600"
          title={availability.reason}
        >
          <XCircle className="h-3.5 w-3.5" /> {availability.reason}
        </span>
      )}

      <button
        type="submit"
        disabled={!trainerId || submitting}
        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        <UserPlus className="h-3.5 w-3.5" />
        {submitting ? 'Asignando...' : 'Asignar'}
      </button>
    </form>
  );
}
