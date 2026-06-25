'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';

interface MembershipType {
  id: string;
  name: string;
  price: string;
  currency: string;
  billing_frequency: string;
  duration_days: number;
  description?: string;
  is_active: boolean;
}

const FREQ_LABELS: Record<string, string> = {
  ONE_TIME: 'Pago único',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMI_ANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(Number(amount));
}

export default function AssignMembershipPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [types, setTypes] = useState<MembershipType[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/proxy/membership-types')
      .then((r) => r.json())
      .then((data: MembershipType[] | { data?: MembershipType[] }) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setTypes(list.filter((t) => t.is_active));
      })
      .catch(() => setFetchError(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/members/${memberId}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeId: selected, startDate, notes: notes || undefined }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : (data.message ?? 'Error al asignar'),
        );
      } else {
        router.push(`/members/${memberId}`);
        router.refresh();
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href={`/members/${memberId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Asignar membresía</h1>
        <p className="text-sm text-gray-500 mt-1">Selecciona el plan y la fecha de inicio</p>
      </div>

      {fetchError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          No se pudieron cargar los planes. Recarga la página.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Plan selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Plan de membresía</label>
          {types.length === 0 && !fetchError ? (
            <p className="text-sm text-gray-400 py-4 text-center">Cargando planes...</p>
          ) : (
            <div className="grid gap-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                    selected === t.id
                      ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-500'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {FREQ_LABELS[t.billing_frequency] ?? t.billing_frequency}
                      {' · '}
                      {t.duration_days} días
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">
                      {formatCurrency(t.price, t.currency)}
                    </span>
                    {selected === t.id && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fecha de inicio */}
        <div className="space-y-1.5">
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
            Fecha de inicio
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ej: Promo diciembre, pago en efectivo..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Link
            href={`/members/${memberId}`}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!selected || loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Asignando...' : 'Asignar membresía'}
          </button>
        </div>
      </form>
    </div>
  );
}
