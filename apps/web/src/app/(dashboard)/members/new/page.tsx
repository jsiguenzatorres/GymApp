'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, CreditCard, Check } from 'lucide-react';

interface MembershipType {
  id: string;
  name: string;
  price: number;
  billing_frequency: string;
  duration_days: number;
}

const GENDER_OPTIONS = [
  { value: '', label: 'No especificado' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'X', label: 'Otro / Prefiero no decir' },
];

const SOURCE_OPTIONS = [
  { value: '', label: 'Sin especificar' },
  { value: 'walk-in', label: 'Visita directa (walk-in)' },
  { value: 'referral', label: 'Referido por otro miembro' },
  { value: 'social_media', label: 'Redes sociales' },
  { value: 'web', label: 'Sitio web' },
  { value: 'other', label: 'Otro' },
];

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'mes',
  QUARTERLY: 'trimestre',
  SEMIANNUAL: 'semestre',
  ANNUAL: 'año',
  ONE_TIME: 'pago único',
};

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

function SectionHeader({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
        <Icon className="h-4 w-4 text-violet-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}

export default function NewMemberPage() {
  // ── Personal data ──────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthdate: '',
    gender: '',
    source: '',
    notes: '',
  });

  // ── Membership assignment ─────────────────────────────────────────────────
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignMembership, setAssignMembership] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    memberId: string;
    tempPassword?: string;
    membershipWarn: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/proxy/membership-types')
      .then((r) => r.json())
      .then((d: MembershipType[] | { data?: MembershipType[] }) => {
        const list = Array.isArray(d) ? d : (d.data ?? []);
        setMembershipTypes(list);
        if (list.length > 0) setSelectedTypeId(list[0].id);
      })
      .catch(() => {});
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      // 1. Create member
      const memberBody: Record<string, string> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      };
      if (form.phone) memberBody.phone = form.phone;
      if (form.birthdate) memberBody.birthdate = form.birthdate;
      if (form.gender) memberBody.gender = form.gender;
      if (form.source) memberBody.source = form.source;
      if (form.notes) memberBody.notes = form.notes;

      const memberRes = await fetch('/api/proxy/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberBody),
      });

      if (!memberRes.ok) {
        const d = (await memberRes.json().catch(() => ({}))) as { message?: string | string[] };
        const rawMsg = Array.isArray(d.message)
          ? d.message.join(', ')
          : (d.message ?? 'Error al crear miembro');
        const msg =
          memberRes.status === 401
            ? 'Tu sesión expiró. Recarga la página y vuelve a iniciar sesión.'
            : memberRes.status === 403
              ? `Sin permisos: ${rawMsg}`
              : rawMsg;
        setError(msg);
        setLoading(false);
        return;
      }

      const newMember = (await memberRes.json()) as { id: string; tempPassword?: string };

      // 2. Assign membership if selected
      let membershipWarn = false;
      if (assignMembership && selectedTypeId) {
        const memRes = await fetch(`/api/proxy/members/${newMember.id}/memberships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ typeId: selectedTypeId, startDate }),
        });

        if (!memRes.ok) {
          membershipWarn = true;
        }
      }

      // Muestra pantalla de éxito con la contraseña temporal para compartir
      setSuccess({
        memberId: newMember.id,
        tempPassword: newMember.tempPassword,
        membershipWarn,
      });
    } catch {
      setError('Error de red. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const selectedType = membershipTypes.find((t) => t.id === selectedTypeId);

  // Pantalla de éxito con contraseña temporal (para que el admin pueda compartirla si el email no llega)
  if (success) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-lg font-bold text-emerald-900">Miembro creado</h2>
          <p className="text-sm text-emerald-800">
            {form.firstName} {form.lastName} ({form.email})
          </p>
          {success.membershipWarn && (
            <div className="rounded-lg border border-amber-300 bg-amber-100 p-2 text-xs text-amber-800">
              ⚠️ El miembro fue creado pero la asignación de membresía falló. Puedes reintentar
              desde su perfil.
            </div>
          )}
          {success.tempPassword && (
            <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-left">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                🔑 Contraseña temporal del miembro:
              </p>
              <code className="block rounded bg-white px-3 py-2 font-mono text-sm text-amber-900 select-all">
                {success.tempPassword}
              </code>
              <p className="mt-2 text-[11px] text-amber-700">
                Se envió un email de bienvenida a <strong>{form.email}</strong>. Si no llega,
                comparte esta contraseña con el miembro. Debe cambiarla en su primer login.
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-center pt-3">
            <Link
              href="/members"
              className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Ir a la lista
            </Link>
            <Link
              href={`/members/${success.memberId}`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Ver perfil del miembro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a miembros
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nuevo miembro</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registra un miembro nuevo. El email servirá para el acceso a la app móvil.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Sección 1: Datos personales ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <SectionHeader
            icon={User}
            title="Datos personales"
            sub="Campos obligatorios marcados con *"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Nombre *</label>
              <input
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                required
                placeholder="Ej: María"
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Apellido *</label>
              <input
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                required
                placeholder="Ej: González"
                className={inputCls()}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
                placeholder="maria@ejemplo.com"
                className={inputCls()}
              />
              <p className="text-xs text-gray-400">Se usará para el login en la app móvil</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Teléfono</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+503 7000-0000"
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Fecha de nacimiento</label>
              <input
                type="date"
                value={form.birthdate}
                onChange={(e) => set('birthdate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Género</label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className={inputCls('bg-white')}
              >
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">¿Cómo nos conoció?</label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className={inputCls('bg-white')}
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-gray-600">Notas internas</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                placeholder="Lesiones previas, preferencias, objetivos personales..."
                className={inputCls('resize-none')}
              />
            </div>
          </div>
        </div>

        {/* ── Sección 2: Membresía ── */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between mb-5">
            <SectionHeader
              icon={CreditCard}
              title="Membresía inicial"
              sub="Opcional — puedes asignarla después"
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setAssignMembership((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${assignMembership ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${assignMembership ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </div>
              <span className="text-xs text-gray-600">{assignMembership ? 'Sí' : 'No'}</span>
            </label>
          </div>

          {assignMembership && (
            <div className="space-y-4">
              {/* Plan grid */}
              {membershipTypes.length === 0 ? (
                <p className="text-sm text-gray-400">Cargando planes...</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {membershipTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTypeId(t.id)}
                      className={`rounded-lg border-2 p-4 text-left transition-all ${
                        selectedTypeId === t.id
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-100 hover:border-violet-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {t.duration_days} días ·{' '}
                            {FREQ_LABELS[t.billing_frequency] ?? t.billing_frequency}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-bold text-violet-700">
                            ${Number(t.price).toFixed(2)}
                          </span>
                          {selectedTypeId === t.id && <Check className="h-4 w-4 text-violet-600" />}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Start date */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Fecha de inicio</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls('max-w-xs')}
                />
              </div>

              {/* Summary */}
              {selectedType && (
                <div className="rounded-lg bg-violet-50 border border-violet-100 px-4 py-3 text-sm">
                  <p className="font-medium text-violet-800">
                    {selectedType.name} — ${Number(selectedType.price).toFixed(2)}
                  </p>
                  <p className="text-xs text-violet-600 mt-0.5">
                    Inicia el{' '}
                    {new Date(startDate + 'T12:00:00').toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {' · '}vence en {selectedType.duration_days} días
                  </p>
                </div>
              )}
            </div>
          )}

          {!assignMembership && (
            <p className="text-sm text-gray-400">
              El miembro quedará registrado sin plan activo. Puedes asignarlo desde su perfil.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/members"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? 'Registrando...'
              : assignMembership
                ? 'Registrar y asignar membresía'
                : 'Registrar miembro'}
          </button>
        </div>
      </form>
    </div>
  );
}
