import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';

interface StaffMember {
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
  };
}

interface StaffStats {
  total: number;
  active: number;
  byRole: Record<string, number>;
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
    month: 'short',
    year: 'numeric',
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`;
  return fmtDate(iso);
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string; active?: string }>;
}) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.role) query.set('role', params.role);
  if (params.search) query.set('search', params.search);
  if (params.active) query.set('isActive', params.active);

  const [stats, staffList] = await Promise.all([
    serverFetch<StaffStats>('/api/v1/staff/stats'),
    serverFetch<StaffMember[]>(`/api/v1/staff?${query.toString()}`),
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Staff</h1>
          <p className="text-sm text-gray-500">Equipo activo del gimnasio</p>
        </div>
        <Link
          href="/staff/new"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          + Agregar staff
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2">
          <p className="text-sm text-gray-500">Total staff</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.total ?? '—'}</p>
          <p className="mt-1 text-xs text-gray-400">{stats?.active ?? 0} activos</p>
        </div>
        {Object.entries(ROLE_LABELS)
          .filter(([r]) => r !== 'GYM_OWNER')
          .map(([role, label]) => (
            <div key={role} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500 truncate">{label}s</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">{stats?.byRole[role] ?? 0}</p>
            </div>
          ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="search"
          defaultValue={params.search ?? ''}
          placeholder="Buscar por nombre o email…"
          className="flex-1 min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <select
          name="role"
          defaultValue={params.role ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROLE_LABELS)
            .filter(([r]) => r !== 'GYM_OWNER')
            .map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
        </select>
        <select
          name="active"
          defaultValue={params.active ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Filtrar
        </button>
      </form>

      {/* Table */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {!staffList?.length ? (
          <div className="p-16 text-center text-sm text-gray-500">
            <p className="text-lg font-medium text-gray-300">Sin resultados</p>
            <p className="mt-1">Agrega el primer miembro del equipo.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left">
              <tr className="text-xs font-medium text-gray-500">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Especialidades</th>
                <th className="px-4 py-3">Último acceso</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {s.first_name[0]}
                        {s.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {s.first_name} {s.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{s.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[s.user.role] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {ROLE_LABELS[s.user.role] ?? s.user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.specialties.slice(0, 3).map((sp) => (
                          <span
                            key={sp}
                            className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                          >
                            {sp}
                          </span>
                        ))}
                        {s.specialties.length > 3 && (
                          <span className="text-xs text-gray-400">+{s.specialties.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {timeAgo(s.user.last_login_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${s.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}
                      />
                      {s.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/staff/${s.id}`}
                      className="text-xs font-medium text-violet-600 hover:text-violet-800"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
