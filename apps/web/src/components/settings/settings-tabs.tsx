'use client';

import { useState } from 'react';

interface GymProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  saas_plan: string;
  timezone: string;
  country: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  tax_id: string | null;
  legal_name: string | null;
  social_links: Record<string, string>;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>;
}

const DAYS = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const TIMEZONES = [
  'America/El_Salvador',
  'America/Guatemala',
  'America/Tegucigalpa',
  'America/Managua',
  'America/Costa_Rica',
  'America/Panama',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Caracas',
  'America/Sao_Paulo',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 ${extra}`;
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
    >
      {saving ? 'Guardando…' : 'Guardar cambios'}
    </button>
  );
}

// ─── TAB: PERFIL ──────────────────────────────────────────────────────────────

function ProfileTab({ profile }: { profile: GymProfile }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    try {
      await fetch('/api/proxy/gym/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nombre del gym *</label>
          <input name="name" defaultValue={profile.name} required className={inputCls()} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Slug (URL)</label>
          <input value={profile.slug} disabled className={inputCls('bg-gray-50 text-gray-400')} />
          <p className="mt-0.5 text-xs text-gray-400">No editable — identificador único del gym</p>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-600">Descripción</label>
          <textarea
            name="description"
            defaultValue={profile.description ?? ''}
            rows={2}
            className={inputCls()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Ciudad</label>
          <input name="city" defaultValue={profile.city ?? ''} className={inputCls()} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Dirección</label>
          <input name="address" defaultValue={profile.address ?? ''} className={inputCls()} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Teléfono</label>
          <input name="phone" defaultValue={profile.phone ?? ''} className={inputCls()} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Email de contacto</label>
          <input
            name="email"
            type="email"
            defaultValue={profile.email ?? ''}
            className={inputCls()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Sitio web</label>
          <input name="website" defaultValue={profile.website ?? ''} className={inputCls()} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Zona horaria</label>
          <select name="timezone" defaultValue={profile.timezone} className={inputCls()}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Moneda</label>
          <select name="currency" defaultValue={profile.currency} className={inputCls()}>
            <option value="USD">USD — Dólar Americano</option>
            <option value="GTQ">GTQ — Quetzal</option>
            <option value="HNL">HNL — Lempira</option>
            <option value="CRC">CRC — Colón</option>
            <option value="MXN">MXN — Peso Mexicano</option>
            <option value="COP">COP — Peso Colombiano</option>
            <option value="PEN">PEN — Sol Peruano</option>
            <option value="BRL">BRL — Real Brasileño</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">País</label>
          <select name="country" defaultValue={profile.country} className={inputCls()}>
            <option value="SV">🇸🇻 El Salvador</option>
            <option value="GT">🇬🇹 Guatemala</option>
            <option value="HN">🇭🇳 Honduras</option>
            <option value="NI">🇳🇮 Nicaragua</option>
            <option value="CR">🇨🇷 Costa Rica</option>
            <option value="PA">🇵🇦 Panamá</option>
            <option value="MX">🇲🇽 México</option>
            <option value="CO">🇨🇴 Colombia</option>
            <option value="PE">🇵🇪 Perú</option>
            <option value="BR">🇧🇷 Brasil</option>
            <option value="US">🇺🇸 Estados Unidos</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} />
        {saved && <p className="text-sm text-emerald-600">✓ Guardado</p>}
      </div>
    </form>
  );
}

// ─── TAB: HORARIOS ────────────────────────────────────────────────────────────

function HoursTab({ profile }: { profile: GymProfile }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState<
    Record<string, { open: string; close: string; closed: boolean }>
  >(() => {
    const defaults: Record<string, { open: string; close: string; closed: boolean }> = {};
    DAYS.forEach(({ key }) => {
      defaults[key] = profile.operating_hours[key] ?? {
        open: '06:00',
        close: '22:00',
        closed: key === 'sun',
      };
    });
    return defaults;
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/proxy/gym/operating-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Define el horario de apertura y cierre de cada día.</p>
      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = hours[key] ?? { open: '06:00', close: '22:00', closed: false };
          return (
            <div
              key={key}
              className={`flex items-center gap-4 rounded-lg border p-3 ${day.closed ? 'border-gray-100 bg-gray-50' : 'border-gray-200 bg-white'}`}
            >
              <div className="w-24">
                <p
                  className={`text-sm font-medium ${day.closed ? 'text-gray-400' : 'text-gray-700'}`}
                >
                  {label}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={day.closed}
                  onChange={(e) =>
                    setHours((h) => ({ ...h, [key]: { ...day, closed: e.target.checked } }))
                  }
                  className="rounded"
                />
                Cerrado
              </label>
              <input
                type="time"
                value={day.open}
                disabled={day.closed}
                onChange={(e) =>
                  setHours((h) => ({ ...h, [key]: { ...day, open: e.target.value } }))
                }
                className="rounded border border-gray-200 px-2 py-1 text-sm disabled:opacity-40"
              />
              <span className="text-xs text-gray-400">—</span>
              <input
                type="time"
                value={day.close}
                disabled={day.closed}
                onChange={(e) =>
                  setHours((h) => ({ ...h, [key]: { ...day, close: e.target.value } }))
                }
                className="rounded border border-gray-200 px-2 py-1 text-sm disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} />
        {saved && <p className="text-sm text-emerald-600">✓ Guardado</p>}
      </div>
    </form>
  );
}

// ─── TAB: REDES SOCIALES ──────────────────────────────────────────────────────

function SocialTab({ profile }: { profile: GymProfile }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      [...fd.entries()].filter(([, v]) => (v as string).trim() !== ''),
    );
    try {
      await fetch('/api/proxy/gym/social-links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const links = profile.social_links ?? {};

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/misgym' },
        { name: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/misgym' },
        { name: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@misgym' },
        { name: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/50312345678' },
        { name: 'twitter', label: 'X / Twitter', placeholder: 'https://twitter.com/misgym' },
      ].map(({ name, label, placeholder }) => (
        <div key={name}>
          <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
          <input
            name={name}
            defaultValue={links[name] ?? ''}
            placeholder={placeholder}
            className={inputCls()}
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} />
        {saved && <p className="text-sm text-emerald-600">✓ Guardado</p>}
      </div>
    </form>
  );
}

// ─── TAB: DATOS FISCALES ──────────────────────────────────────────────────────

function FiscalTab({ profile }: { profile: GymProfile }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const body = { taxId: fd.get('taxId'), legalName: fd.get('legalName') };
    try {
      await fetch('/api/proxy/gym/fiscal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">
        Requerido para emisión de DTE (Documentos Tributarios Electrónicos) en El Salvador.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">NIT / RUC</label>
          <input
            name="taxId"
            defaultValue={profile.tax_id ?? ''}
            placeholder="0614-000000-000-0"
            className={inputCls()}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Razón social</label>
          <input
            name="legalName"
            defaultValue={profile.legal_name ?? ''}
            placeholder="Gym S.A. de C.V."
            className={inputCls()}
          />
        </div>
      </div>
      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">Integración DTE</p>
        <p className="mt-1 text-xs text-amber-700">
          La transmisión al Ministerio de Hacienda requiere configurar un proveedor DTE autorizado.
          Contacta a soporte para habilitarlo en tu plan.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} />
        {saved && <p className="text-sm text-emerald-600">✓ Guardado</p>}
      </div>
    </form>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'hours', label: 'Horarios' },
  { id: 'social', label: 'Redes sociales' },
  { id: 'fiscal', label: 'Datos fiscales' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function SettingsTabs({ profile }: { profile: GymProfile | null }) {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  if (!profile) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
        No se pudo cargar el perfil del gym.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Tab nav */}
      <div className="flex border-b border-gray-100">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-violet-600 text-violet-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'profile' && <ProfileTab profile={profile} />}
        {activeTab === 'hours' && <HoursTab profile={profile} />}
        {activeTab === 'social' && <SocialTab profile={profile} />}
        {activeTab === 'fiscal' && <FiscalTab profile={profile} />}
      </div>
    </div>
  );
}
