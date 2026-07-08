import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { Calendar, Plus, LayoutGrid, Clock } from 'lucide-react';

interface ClassType {
  id: string;
  name: string;
  description: string | null;
  color: string;
  duration_minutes: number;
  difficulty: string | null;
  is_active: boolean;
}

interface AdminSession {
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

const DIFF_LABEL: Record<string, string> = {
  BEGINNER: 'Básico',
  INTERMEDIATE: 'Medio',
  ADVANCED: 'Avanzado',
};
const DIFF_COLOR: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700',
  INTERMEDIATE: 'bg-amber-100 text-amber-700',
  ADVANCED: 'bg-red-100 text-red-700',
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = 'types' } = await searchParams;

  const [types, sessions] = await Promise.all([
    serverFetch<ClassType[]>('/api/v1/schedule/admin/class-types'),
    serverFetch<AdminSession[]>('/api/v1/schedule/admin/sessions'),
  ]);

  const typeList = types ?? [];
  const sessionList = sessions ?? [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clases & Horarios</h1>
          <p className="text-sm text-gray-500">
            {typeList.length} tipos · {sessionList.length} sesiones próximas
          </p>
        </div>
        {tab === 'types' ? (
          <Link
            href="/classes/new-type"
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo tipo
          </Link>
        ) : (
          <Link
            href="/classes/new-session"
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            Programar sesión
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tipos activos</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {typeList.filter((t) => t.is_active).length}
          </p>
          <p className="mt-1 text-xs text-gray-400">de {typeList.length} totales</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sesiones (30 días)</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{sessionList.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inscritos total</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {sessionList.reduce((s, x) => s + x.enrolled_count, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">En lista espera</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {sessionList.reduce((s, x) => s + x.waitlist_count, 0)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'types', label: 'Tipos de clase', icon: LayoutGrid },
          { key: 'schedule', label: 'Horario próximo', icon: Calendar },
        ].map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/classes?tab=${key}`}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>

      {/* Tab: Tipos de clase */}
      {tab === 'types' && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {typeList.length === 0 ? (
            <div className="p-16 text-center">
              <LayoutGrid className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="font-medium text-gray-400">Sin tipos de clase creados</p>
              <p className="mt-1 text-sm text-gray-400">
                Crea tipos como Yoga, Spinning, Pilates, etc.
              </p>
              <Link
                href="/classes/new-type"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Crear primer tipo
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left">
                <tr className="text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Duración</th>
                  <th className="px-4 py-3">Dificultad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {typeList.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: t.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{t.name}</p>
                          {t.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3.5 w-3.5" />
                        {t.duration_minutes} min
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.difficulty ? (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFF_COLOR[t.difficulty] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {DIFF_LABEL[t.difficulty] ?? t.difficulty}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        />
                        {t.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ToggleTypeForm typeId={t.id} isActive={t.is_active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Tab: Horario */}
      {tab === 'schedule' && (
        <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
          {sessionList.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="mx-auto h-8 w-8 text-gray-300 mb-3" />
              <p className="font-medium text-gray-400">Sin sesiones programadas</p>
              <p className="mt-1 text-sm text-gray-400">
                Programa clases para que los miembros puedan inscribirse.
              </p>
              <Link
                href="/classes/new-session"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Programar primera sesión
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left">
                <tr className="text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Fecha & hora</th>
                  <th className="px-4 py-3">Clase</th>
                  <th className="px-4 py-3">Trainer</th>
                  <th className="px-4 py-3">Sala</th>
                  <th className="px-4 py-3">Inscritos</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessionList.map((s) => {
                  const pct = Math.round((s.enrolled_count / s.capacity) * 100);
                  const fillColor =
                    pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-emerald-600';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {fmtDateTime(s.scheduled_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.class_type.color }}
                          />
                          {s.class_type.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {s.trainer ? (
                          `${s.trainer.first_name} ${s.trainer.last_name}`
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{s.room ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${fillColor}`}>
                          {s.enrolled_count}/{s.capacity}
                        </span>
                        {s.waitlist_count > 0 && (
                          <span className="ml-1 text-xs text-amber-600">
                            +{s.waitlist_count} espera
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {s.status === 'SCHEDULED' ? 'Programada' : s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/classes/sessions/${s.id}`}
                          className="text-xs font-medium text-violet-600 hover:text-violet-800"
                        >
                          Ver asistencia
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

function ToggleTypeForm({ typeId, isActive }: { typeId: string; isActive: boolean }) {
  return (
    <form
      action={async () => {
        'use server';
        await serverFetch(`/api/v1/schedule/admin/class-types/${typeId}/toggle`, {
          method: 'PATCH',
        });
      }}
    >
      <button
        type="submit"
        className={`text-xs font-medium ${isActive ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}`}
      >
        {isActive ? 'Desactivar' : 'Activar'}
      </button>
    </form>
  );
}
