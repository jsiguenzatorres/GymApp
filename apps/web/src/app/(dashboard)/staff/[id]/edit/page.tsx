'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const ROLES = [
  { value: 'GYM_ADMIN', label: 'Administrador' },
  { value: 'TRAINER', label: 'Entrenador' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
  { value: 'NUTRITIONIST', label: 'Nutricionista' },
];

interface StaffData {
  first_name: string;
  last_name: string;
  phone: string | null;
  bio: string | null;
  specialties: string[];
  user: { role: string };
}

function inputCls() {
  return 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500';
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGymOwner, setIsGymOwner] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    specialties: '',
    role: 'TRAINER',
  });

  useEffect(() => {
    fetch(`/api/proxy/staff/${id}`)
      .then((r) => r.json())
      .then((data: StaffData) => {
        setForm({
          firstName: data.first_name,
          lastName: data.last_name,
          phone: data.phone ?? '',
          bio: data.bio ?? '',
          specialties: data.specialties.join(', '),
          role: data.user.role,
        });
        setIsGymOwner(data.user.role === 'GYM_OWNER');
      })
      .catch(() => setError('Error cargando datos del staff'))
      .finally(() => setLoadingStaff(false));
  }, [id]);

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          bio: form.bio.trim() || undefined,
          specialties: form.specialties
            ? form.specialties
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(
          Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? 'Error'),
        );
      }

      // Rol se actualiza en un endpoint separado — solo si cambio y no es el owner
      if (!isGymOwner && form.role) {
        const roleRes = await fetch(`/api/proxy/staff/${id}/role`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: form.role }),
        });
        if (!roleRes.ok) {
          const body = (await roleRes.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? 'Error actualizando rol');
        }
      }

      router.push(`/staff/${id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setLoading(false);
    }
  }

  if (loadingStaff) {
    return <div className="p-6 text-sm text-gray-400">Cargando datos del staff...</div>;
  }

  return (
    <div className="max-w-xl space-y-6 p-6">
      <Link
        href={`/staff/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al perfil
      </Link>

      <h1 className="text-xl font-bold text-gray-900">Editar staff</h1>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
      >
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Nombre</label>
            <input
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              required
              className={inputCls()}
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Apellido</label>
            <input
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              required
              className={inputCls()}
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Teléfono</label>
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={inputCls()}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            Rol {isGymOwner && <span className="text-gray-400">(no editable — propietario)</span>}
          </label>
          <select
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
            className={inputCls()}
            disabled={loading || isGymOwner}
          >
            {isGymOwner ? (
              <option value="GYM_OWNER">Propietario</option>
            ) : (
              ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={2}
            className={inputCls()}
            disabled={loading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">
            Especialidades <span className="text-gray-400">(separadas por coma)</span>
          </label>
          <input
            value={form.specialties}
            onChange={(e) => set('specialties', e.target.value)}
            className={inputCls()}
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href={`/staff/${id}`}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
