import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { StaffActions } from '@/components/staff/staff-actions';

interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  member: { first_name: string; last_name: string };
}

interface StaffDetail {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  bio: string | null;
  specialties: string[];
  is_active: boolean;
  hired_at: string;
  user: {
    id: string;
    email: string;
    role: string;
    last_login_at: string | null;
    two_fa_enabled: boolean;
  };
  appointments: Appointment[];
}

const ROLE_LABELS: Record<string, string> = {
  GYM_OWNER: 'Propietario',
  GYM_ADMIN: 'Administrador',
  TRAINER: 'Entrenador',
  RECEPTIONIST: 'Recepcionista',
  NUTRITIONIST: 'Nutricionista',
};

const ROLE_COLORS: Record<string, string> = {
  GYM_OWNER: 'bg-violet-100 text-violet-700',
  GYM_ADMIN: 'bg-blue-100 text-blue-700',
  TRAINER: 'bg-emerald-100 text-emerald-700',
  RECEPTIONIST: 'bg-amber-100 text-amber-700',
  NUTRITIONIST: 'bg-pink-100 text-pink-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await serverFetch<StaffDetail>(`/api/v1/staff/${id}`);

  if (!staff) notFound();

  return (
    <div className="max-w-4xl space-y-6 p-6">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a staff
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-xl font-bold text-violet-700">
          {staff.first_name[0]}
          {staff.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {staff.first_name} {staff.last_name}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                staff.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${staff.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
              />
              {staff.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[staff.user.role] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {ROLE_LABELS[staff.user.role] ?? staff.user.role}
          </span>
        </div>
        <StaffActions staffId={staff.id} isActive={staff.is_active} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info personal */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4 lg:col-span-1">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Información
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-gray-700">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              {staff.user.email}
            </div>
            {staff.phone && (
              <div className="flex items-center gap-2.5 text-gray-700">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                {staff.phone}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-gray-700">
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              Contratado el {fmtDate(staff.hired_at)}
            </div>
            <div className="flex items-center gap-2.5 text-gray-700">
              <Clock className="h-4 w-4 shrink-0 text-gray-400" />
              {staff.user.last_login_at
                ? `Último acceso: ${fmtDateTime(staff.user.last_login_at)}`
                : 'Nunca ha iniciado sesión'}
            </div>
            <div className="flex items-center gap-2.5 text-gray-700">
              <ShieldCheck
                className={`h-4 w-4 shrink-0 ${staff.user.two_fa_enabled ? 'text-emerald-500' : 'text-gray-300'}`}
              />
              2FA {staff.user.two_fa_enabled ? 'activado' : 'no activado'}
            </div>
          </div>

          {staff.specialties.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {staff.specialties.map((sp) => (
                  <span
                    key={sp}
                    className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {staff.bio && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bio
              </h3>
              <p className="text-sm text-gray-600">{staff.bio}</p>
            </div>
          )}
        </div>

        {/* Citas recientes */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Citas recientes (últimos 30 días)
          </h2>
          {staff.appointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">Sin citas registradas</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {staff.appointments.map((apt) => (
                <li key={apt.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-gray-700">
                    {apt.member.first_name} {apt.member.last_name}
                  </span>
                  <span className="text-xs text-gray-400">{fmtDateTime(apt.scheduled_at)}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {apt.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
