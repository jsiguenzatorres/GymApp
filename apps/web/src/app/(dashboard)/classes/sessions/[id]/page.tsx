import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { revalidatePath } from 'next/cache';
import { ArrowLeft, Check, X, Clock } from 'lucide-react';

interface SessionDetail {
  id: string;
  scheduled_at: string;
  capacity: number;
  room: string | null;
  status: string;
  class_type: { name: string; color: string };
  trainer: { first_name: string; last_name: string } | null;
  enrolled_count: number;
  waitlist_count: number;
}

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  checked_in_at: string | null;
  member: { id: string; first_name: string; last_name: string };
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ENROLLED: { label: 'Inscrito', cls: 'bg-blue-100 text-blue-700' },
  WAITLIST: { label: 'Lista de espera', cls: 'bg-amber-100 text-amber-700' },
  ATTENDED: { label: 'Asistió', cls: 'bg-emerald-100 text-emerald-700' },
  NO_SHOW: { label: 'No-show', cls: 'bg-red-100 text-red-700' },
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function SessionRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [session, enrollments] = await Promise.all([
    serverFetch<SessionDetail>(`/api/v1/schedule/admin/sessions/${id}`),
    serverFetch<Enrollment[]>(`/api/v1/schedule/admin/sessions/${id}/enrollments`),
  ]);

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Sesión no encontrada.</p>
        <Link href="/classes?tab=schedule" className="text-sm text-violet-600 hover:underline">
          Volver al horario
        </Link>
      </div>
    );
  }

  const list = enrollments ?? [];
  const roster = list.filter((e) => e.status === 'ENROLLED' || e.status === 'WAITLIST');
  const finished = list.filter((e) => e.status === 'ATTENDED' || e.status === 'NO_SHOW');

  async function checkIn(enrollmentId: string) {
    'use server';
    await serverFetch(
      `/api/v1/schedule/admin/sessions/${id}/enrollments/${enrollmentId}/check-in`,
      {
        method: 'PATCH',
      },
    );
    revalidatePath(`/classes/sessions/${id}`);
  }

  async function noShow(enrollmentId: string) {
    'use server';
    await serverFetch(`/api/v1/schedule/admin/sessions/${id}/enrollments/${enrollmentId}/no-show`, {
      method: 'PATCH',
    });
    revalidatePath(`/classes/sessions/${id}`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/classes?tab=schedule"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al horario
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="h-3.5 w-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: session.class_type.color }}
          />
          <h1 className="text-2xl font-bold text-gray-900">{session.class_type.name}</h1>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          {fmtDateTime(session.scheduled_at)}
          {session.room && ` · ${session.room}`}
          {session.trainer && ` · ${session.trainer.first_name} ${session.trainer.last_name}`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Inscritos</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {session.enrolled_count}/{session.capacity}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Lista de espera</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{session.waitlist_count}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Estado</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {session.status === 'SCHEDULED'
              ? 'Programada'
              : session.status === 'COMPLETED'
                ? 'Finalizada'
                : session.status}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-800">Marcar asistencia</h2>
        </div>
        {roster.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">Nadie inscrito todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {roster.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {e.member.first_name} {e.member.last_name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABEL[e.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABEL[e.status]?.label ?? e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {e.status === 'ENROLLED' && (
                      <div className="flex justify-end gap-2">
                        <form action={checkIn.bind(null, e.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Asistió
                          </button>
                        </form>
                        <form action={noShow.bind(null, e.id)}>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            No-show
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {finished.length > 0 && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-800">Historial</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {finished.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {e.member.first_name} {e.member.last_name}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABEL[e.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {STATUS_LABEL[e.status]?.label ?? e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-gray-400">
                    {e.checked_in_at ? new Date(e.checked_in_at).toLocaleTimeString('es-SV') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
