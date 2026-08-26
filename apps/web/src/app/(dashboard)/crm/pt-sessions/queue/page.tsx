import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { revalidatePath } from 'next/cache';
import { Clock, Check, X, UserPlus, ArrowLeft } from 'lucide-react';

interface PendingPtRequest {
  id: string;
  scheduled_at: string;
  duration_min: number;
  notes: string | null;
  member: { id: string; first_name: string; last_name: string };
  staff: { id: string; first_name: string; last_name: string } | null;
}

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
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

export default async function PtSessionsQueuePage() {
  const [requests, trainers] = await Promise.all([
    serverFetch<PendingPtRequest[]>('/api/v1/pt-sessions/pending/gym'),
    serverFetch<Trainer[]>('/api/v1/staff?role=TRAINER&isActive=true'),
  ]);
  const list = requests ?? [];
  const trainerList = trainers ?? [];

  async function assign(id: string, formData: FormData) {
    'use server';
    const trainerId = formData.get('trainerId') as string;
    if (!trainerId) return;
    await serverFetch(`/api/v1/pt-sessions/${id}/assign-trainer`, {
      method: 'PATCH',
      body: JSON.stringify({ trainerId }),
    });
    revalidatePath('/crm/pt-sessions/queue');
  }

  async function confirm(id: string) {
    'use server';
    await serverFetch(`/api/v1/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'CONFIRMED' }),
    });
    revalidatePath('/crm/pt-sessions/queue');
  }

  async function reject(id: string) {
    'use server';
    await serverFetch(`/api/v1/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED', cancelledReason: 'No disponible en ese horario' }),
    });
    revalidatePath('/crm/pt-sessions/queue');
  }

  const unassignedCount = list.filter((r) => !r.staff).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cola de asignación — Sesiones PT</h1>
          <p className="text-sm text-gray-500">
            Todas las solicitudes del gym. El miembro solo propuso día y hora — asigna un entrenador
            a las que no lo tienen, o confirma/rechaza las ya asignadas.
          </p>
        </div>
        <Link
          href="/crm/pt-sessions"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Mis solicitudes
        </Link>
      </div>

      {unassignedCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          {unassignedCount} solicitud{unassignedCount !== 1 ? 'es' : ''} sin entrenador asignado
        </div>
      )}

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="p-16 text-center">
            <Clock className="mx-auto h-8 w-8 text-gray-300 mb-3" />
            <p className="font-medium text-gray-400">Sin solicitudes pendientes</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {list.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
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

                {r.staff ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Asignado a</p>
                      <p className="text-sm font-medium text-gray-900">
                        {r.staff.first_name} {r.staff.last_name}
                      </p>
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
                  </div>
                ) : (
                  <form action={assign.bind(null, r.id)} className="flex items-center gap-2">
                    <select
                      name="trainerId"
                      required
                      defaultValue=""
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="" disabled>
                        Elegir entrenador...
                      </option>
                      {trainerList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.first_name} {t.last_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Asignar
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
