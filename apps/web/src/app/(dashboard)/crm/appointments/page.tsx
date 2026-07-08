import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import {
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_TYPE_LABELS,
  AppointmentType,
} from '@gymapp/shared-types';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_min: number;
  notes: string | null;
  member: { id: string; first_name: string; last_name: string };
  staff?: { user: { first_name: string; last_name: string } } | null;
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
  COMPLETED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-600',
  NO_SHOW: 'bg-amber-100 text-amber-700',
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);

  const appointments = await serverFetch<Appointment[]>(`/api/v1/appointments?${query.toString()}`);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas</h1>
          <p className="text-sm text-gray-500">Agenda de consultas y sesiones</p>
        </div>
        <Link
          href="/crm/appointments/new"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          + Nueva cita
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={params.status ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(APPOINTMENT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="from"
          defaultValue={params.from ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={params.to ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />

        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Filtrar
        </button>
        <Link
          href="/crm/appointments"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Limpiar
        </Link>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {!appointments?.length ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Sin citas para el período seleccionado.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Miembro</th>
                <th className="px-4 py-3">Cita</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Fecha y hora</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Asignado a</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/members/${a.member.id}`}
                      className="font-medium text-violet-700 hover:underline"
                    >
                      {a.member.first_name} {a.member.last_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{a.title}</p>
                    {a.description && <p className="text-xs text-gray-400">{a.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {APPOINTMENT_TYPE_LABELS[a.appointment_type] ?? a.appointment_type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                    {fmtDateTime(a.scheduled_at)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.duration_min} min</td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.staff ? `${a.staff.user.first_name} ${a.staff.user.last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status]}`}
                    >
                      {APPOINTMENT_STATUS_LABELS[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
