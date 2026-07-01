'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface MemberData {
  first_name: string;
  last_name: string;
  phone: string | null;
  birthdate: string | null;
  gender: string | null;
  notes: string | null;
}

// Valores alineados con CreateMemberDto/UpdateMemberDto del backend (@IsIn(['M','F','X'])).
// Antes este form usaba MALE/FEMALE/OTHER, lo que hacia fallar la validacion
// en cuanto el usuario tocaba el select (400 Bad Request silencioso para el
// resto de campos tambien, porque la request completa se rechazaba).
const GENDER_OPTIONS = [
  { value: '', label: 'No especificado' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'X', label: 'Otro / Prefiero no decir' },
];

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = params.id;

  const [form, setForm] = useState<MemberData>({
    first_name: '',
    last_name: '',
    phone: '',
    birthdate: '',
    gender: '',
    notes: '',
  });
  const [fetchDone, setFetchDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proxy/members/${memberId}`)
      .then((r) => r.json())
      .then((data: MemberData) => {
        setForm({
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          phone: data.phone ?? '',
          birthdate: data.birthdate ? data.birthdate.split('T')[0] : '',
          gender: data.gender ?? '',
          notes: data.notes ?? '',
        });
        setFetchDone(true);
      });
  }, [memberId]);

  function set(field: keyof MemberData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        firstName: form.first_name,
        lastName: form.last_name,
      };
      if (form.phone) body.phone = form.phone;
      if (form.birthdate) body.birthdate = form.birthdate;
      if (form.gender) body.gender = form.gender;
      if (form.notes) body.notes = form.notes;

      const res = await fetch(`/api/proxy/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(data.message)
          ? data.message.join(', ')
          : (data.message ?? 'Error');
        setError(msg);
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

  if (!fetchDone) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <p className="text-sm text-gray-400">Cargando datos del miembro...</p>
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Editar miembro</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Apellido</label>
            <input
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+503 7000-0000"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
            <input
              type="date"
              value={form.birthdate ?? ''}
              onChange={(e) => set('birthdate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Género</label>
            <select
              value={form.gender ?? ''}
              onChange={(e) => set('gender', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Notas <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Observaciones del miembro..."
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
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
