import { serverFetch } from '@/lib/server-api';
import { revalidatePath } from 'next/cache';
import { Clock, Check, X } from 'lucide-react';

interface PendingPtRequest {
  id: string;
  scheduled_at: string;
  duration_min: number;
  notes: string | null;
  member: { id: string; first_name: string; last_name: string };
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function PtSessionsPage() {
  const requests = await serverFetch<PendingPtRequest[]>('/api/v1/pt-sessions/pending');
  const list = requests ?? [];

  async function confirm(id: string) {
    'use server';
    await serverFetch(`/api/v1/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    revalidatePath('/crm/pt-sessions');
  }

  async function reject(id: string) {
    'use server';
    await serverFetch(`/api/v1/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED', cancelledReason: 'No disponible en ese horario' }),
    });
    revalidatePath('/crm/pt-sessions');
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de sesión PT</h1>
        <p className="text-sm text-gray-500">
          Miembros que solicitaron una sesión individual contigo — confírmalas o recházalas.
        </p>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="font-medium text-gray-400">Sin solicitudes pendientes</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {list.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {r.member.first_name} {r.member.last_name}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {fmtDateTime(r.scheduled_at)} · {r.duration_min} min
                  </p>
                  {r.notes && <p className="mt-1 text-xs text-gray-400">"{r.notes}"</p>}
                </div>
                <div className="flex gap-2">
                  <form action={confirm.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Confirmar
                    </button>
                  </form>
                  <form action={reject.bind(null, r.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Rechazar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
