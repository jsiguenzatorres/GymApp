'use client';

import { useState, useEffect } from 'react';
import { Plus, Tag, Power } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: string;
  applies_to_type_ids: string[];
  starts_at: string | null;
  expires_at: string | null;
  max_uses_total: number | null;
  max_uses_per_member: number;
  first_time_only: boolean;
  times_used: number;
  is_active: boolean;
}

interface MembershipType {
  id: string;
  name: string;
}

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  max_uses_total: '',
  max_uses_per_member: '1',
  first_time_only: false,
  expires_at: '',
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [appliesTo, setAppliesTo] = useState<string[]>([]); // vacío = todos

  async function load() {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        fetch('/api/proxy/coupons').then((r) => r.json()),
        fetch('/api/proxy/membership-types')
          .then((r) => r.json())
          .then((d: MembershipType[] | { data?: MembershipType[] }) =>
            Array.isArray(d) ? d : (d.data ?? []),
          ),
      ]);
      setCoupons(Array.isArray(c) ? c : []);
      setTypes(t);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleType(id: string) {
    setAppliesTo((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.discount_value) {
      setError('Código, nombre y valor de descuento son obligatorios');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description || undefined,
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          applies_to_type_ids: appliesTo,
          max_uses_total: form.max_uses_total ? parseInt(form.max_uses_total, 10) : undefined,
          max_uses_per_member: parseInt(form.max_uses_per_member, 10) || 1,
          first_time_only: form.first_time_only,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        }),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        setAppliesTo([]);
        setShowCreate(false);
        await load();
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
      }
    } catch {
      setError('Error de red');
    } finally {
      setCreating(false);
    }
  }

  async function toggleCoupon(id: string) {
    await fetch(`/api/proxy/coupons/${id}/toggle`, { method: 'PATCH' });
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Cupones y descuentos</h1>
          <p className="text-sm text-gray-500 mt-1">Códigos promocionales para membresías</p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" /> Nuevo cupón
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createCoupon}
          className="rounded-xl border bg-white p-5 shadow-sm space-y-3"
        >
          <p className="text-sm font-semibold text-gray-900">Nuevo cupón</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Código *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="VERANO2026"
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Promoción Verano"
                className={inputCls()}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Descripción</label>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className={inputCls()}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Tipo de descuento</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value }))}
                className={inputCls('bg-white')}
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto fijo ($)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Valor *</label>
              <input
                type="number"
                min="0"
                value={form.discount_value}
                onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percentage' ? '20' : '15.00'}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Vence (opcional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
                className={inputCls()}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">
                Máximo de usos totales (vacío = ilimitado)
              </label>
              <input
                type="number"
                min="1"
                value={form.max_uses_total}
                onChange={(e) => setForm((p) => ({ ...p, max_uses_total: e.target.value }))}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Máximo de usos por miembro</label>
              <input
                type="number"
                min="1"
                value={form.max_uses_per_member}
                onChange={(e) => setForm((p) => ({ ...p, max_uses_per_member: e.target.value }))}
                className={inputCls()}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">
              Aplica a (vacío = todos los planes)
            </label>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    appliesTo.includes(t.id)
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={form.first_time_only}
              onChange={(e) => setForm((p) => ({ ...p, first_time_only: e.target.checked }))}
            />
            Solo para miembros nuevos (sin membresías previas)
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {creating ? 'Guardando...' : 'Guardar cupón'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Cargando...</p>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center">
            <Tag className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">Sin cupones creados aún</p>
          </div>
        ) : (
          coupons.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-violet-100 px-2 py-0.5 font-mono text-xs font-semibold text-violet-700">
                    {c.code}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  {!c.is_active && <span className="text-xs text-gray-400">Inactivo</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.discount_type === 'percentage'
                    ? `${c.discount_value}% off`
                    : `$${c.discount_value} off`}
                  {' · '}
                  {c.times_used} usado(s){c.max_uses_total ? ` de ${c.max_uses_total}` : ''}
                  {c.first_time_only && ' · solo miembros nuevos'}
                  {c.expires_at && ` · vence ${new Date(c.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={() => toggleCoupon(c.id)}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                  c.is_active
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                }`}
              >
                <Power className="h-3 w-3" />
                {c.is_active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
