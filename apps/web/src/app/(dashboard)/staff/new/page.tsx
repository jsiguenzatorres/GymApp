'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle, UserPlus, CheckCircle2 } from 'lucide-react';

const ROLES = [
  { value: 'GYM_ADMIN', label: 'Administrador' },
  { value: 'TRAINER', label: 'Entrenador' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
  { value: 'NUTRITIONIST', label: 'Nutricionista' },
];

export default function NewStaffPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'TRAINER',
    bio: '',
    specialties: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tempPassword?: string } | null>(null);

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Nombre, apellido y email son obligatorios');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          role: form.role,
          bio: form.bio.trim() || undefined,
          specialties: form.specialties
            ? form.specialties
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(
          Array.isArray(body.message)
            ? body.message.join(', ')
            : (body.message ?? `Error ${res.status}`),
        );
        return;
      }
      const data = (await res.json()) as { tempPassword?: string };
      setSuccess({ tempPassword: data.tempPassword });
    } catch {
      setError('Error de red. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-6 max-w-xl">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h2 className="text-lg font-bold text-emerald-900">Staff agregado</h2>
          <p className="text-sm text-emerald-800">
            {form.firstName} {form.lastName} ha sido agregado al equipo.
          </p>
          {success.tempPassword && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left">
              <p className="text-xs font-semibold text-amber-900 mb-1">⚠️ Contraseña temporal:</p>
              <code className="block rounded bg-white px-3 py-2 font-mono text-sm text-amber-900 select-all">
                {success.tempPassword}
              </code>
              <p className="mt-2 text-[11px] text-amber-700">
                Comparte esta contraseña con {form.firstName} — debe cambiarla en su primer inicio.
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <Link
              href="/staff"
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Volver a staff
            </Link>
            <button
              onClick={() => {
                setSuccess(null);
                setForm({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  role: 'TRAINER',
                  bio: '',
                  specialties: '',
                });
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Agregar otro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/staff" className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Agregar staff</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <UserPlus className="h-4 w-4 text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Información del staff</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Nombre *</label>
            <input
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Apellido *</label>
            <input
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
            placeholder="entrenador@tugym.com"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Teléfono</label>
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Rol *</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              disabled={loading}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Bio breve</label>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={2}
            placeholder="Experiencia, especialización..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
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
            placeholder="Hipertrofia, CrossFit, Pilates"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/staff"
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
            {loading ? 'Creando...' : 'Agregar staff'}
          </button>
        </div>
      </form>
    </div>
  );
}
