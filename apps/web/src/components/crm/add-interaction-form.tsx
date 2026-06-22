'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  InteractionType,
  InteractionChannel,
  Sentiment,
  INTERACTION_TYPE_LABELS,
} from '@gymapp/shared-types';

interface AddInteractionFormProps {
  memberId: string;
  memberName: string;
  onClose?: () => void;
}

export function AddInteractionForm({ memberId, memberName, onClose }: AddInteractionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    interactionType: InteractionType.NOTE,
    channel: '' as string,
    subject: '',
    notes: '',
    sentiment: '' as string,
    outcome: '' as string,
    followUpAt: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      memberId,
      interactionType: form.interactionType,
      ...(form.channel ? { channel: form.channel } : {}),
      ...(form.subject ? { subject: form.subject } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
      ...(form.sentiment ? { sentiment: form.sentiment } : {}),
      ...(form.outcome ? { outcome: form.outcome } : {}),
      ...(form.followUpAt ? { followUpAt: form.followUpAt } : {}),
    };

    try {
      const res = await fetch('/api/proxy/crm/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al guardar interacción');
      router.refresh();
      onClose?.();
    } catch {
      setError('No se pudo guardar la interacción');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Registrando interacción con <strong>{memberName}</strong>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Tipo *</label>
          <select
            value={form.interactionType}
            onChange={(e) =>
              setForm({ ...form, interactionType: e.target.value as InteractionType })
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {Object.entries(INTERACTION_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Canal</label>
          <select
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Sin especificar</option>
            {Object.values(InteractionChannel).map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase().replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Sentimiento</label>
          <select
            value={form.sentiment}
            onChange={(e) => setForm({ ...form, sentiment: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Sin especificar</option>
            {Object.values(Sentiment).map((s) => (
              <option key={s} value={s}>
                {s === 'POSITIVE' ? 'Positivo' : s === 'NEGATIVE' ? 'Negativo' : 'Neutro'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Asunto</label>
        <input
          type="text"
          maxLength={200}
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          placeholder="Resumen breve"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notas</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Detalles de la interacción..."
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Resultado</label>
          <select
            value={form.outcome}
            onChange={(e) => setForm({ ...form, outcome: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Sin resultado</option>
            <option value="RESOLVED">Resuelto</option>
            <option value="PENDING">Pendiente</option>
            <option value="FOLLOW_UP">Requiere seguimiento</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Seguimiento</label>
          <input
            type="datetime-local"
            value={form.followUpAt}
            onChange={(e) => setForm({ ...form, followUpAt: e.target.value })}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? 'Guardando…' : 'Guardar interacción'}
        </button>
      </div>
    </form>
  );
}
