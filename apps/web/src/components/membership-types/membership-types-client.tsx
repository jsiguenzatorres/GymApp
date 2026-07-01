'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Users,
  Tag,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MembershipType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_frequency: string;
  duration_days: number;
  max_freezes: number;
  max_freeze_days: number;
  features: string[];
  is_active: boolean;
  is_trial: boolean;
  sort_order: number;
  activeCount: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: 'Una vez',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  SEMI_ANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(amount);
}

function durationLabel(days: number) {
  if (days === 1) return '1 día';
  if (days < 7) return `${days} días`;
  if (days < 30) return `${Math.round(days / 7)} semanas`;
  if (days < 365) return `${Math.round(days / 30)} meses`;
  return `${Math.round(days / 365)} año(s)`;
}

export function MembershipTypesClient({ initialTypes }: { initialTypes: MembershipType[] }) {
  const [types, setTypes] = useState<MembershipType[]>(initialTypes);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (types.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Tag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-semibold">Sin tipos de membresía</h3>
        <p className="mb-6 text-sm text-muted-foreground max-w-sm">
          Crea los planes que ofrecerá tu gimnasio: mensual, trimestral, day pass, etc.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crear primer plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Button + Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo tipo
        </button>
      ) : (
        <CreateTypeForm
          onCreated={(newType) => {
            setTypes((prev) => [newType, ...prev]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Grid de tipos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {types.map((type) =>
          editingId === type.id ? (
            <EditTypeForm
              key={type.id}
              type={type}
              onUpdated={(updated) => {
                setTypes((prev) =>
                  prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
                );
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <MembershipTypeCard
              key={type.id}
              type={type}
              onEdit={() => setEditingId(type.id)}
              onToggled={(updated) =>
                setTypes((prev) =>
                  prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
                )
              }
            />
          ),
        )}
      </div>
    </div>
  );
}

function MembershipTypeCard({
  type,
  onEdit,
  onToggled,
}: {
  type: MembershipType;
  onEdit: () => void;
  onToggled: (t: Partial<MembershipType> & { id: string }) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await fetch(`/api/proxy/membership-types/${type.id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = (await res.json()) as { is_active: boolean };
        onToggled({ id: type.id, is_active: data.is_active });
      }
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 space-y-4 transition-opacity',
        !type.is_active && 'opacity-60',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{type.name}</h3>
            {type.is_trial && (
              <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                Trial
              </span>
            )}
            {!type.is_active && (
              <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">
                Inactivo
              </span>
            )}
          </div>
          {type.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title={type.is_active ? 'Desactivar' : 'Activar'}
          >
            {type.is_active ? (
              <ToggleRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Precio */}
      <div>
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(type.price, type.currency)}
        </span>
        <span className="text-sm text-muted-foreground ml-1">
          / {FREQUENCY_LABELS[type.billing_frequency] ?? type.billing_frequency}
        </span>
      </div>

      {/* Detalles */}
      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Duración: {durationLabel(type.duration_days)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>
            Congelaciones: {type.max_freezes}x · Máx {type.max_freeze_days} días
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>
            {type.activeCount} {type.activeCount === 1 ? 'miembro activo' : 'miembros activos'}
          </span>
        </div>
      </div>

      {/* Features */}
      {type.features.length > 0 && (
        <ul className="space-y-1">
          {type.features.slice(0, 4).map((f, i) => (
            <li key={i} className="flex items-center gap-1.5 text-xs text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              {f}
            </li>
          ))}
          {type.features.length > 4 && (
            <li className="text-xs text-muted-foreground pl-5">+{type.features.length - 4} más</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Formulario de creación ───────────────────────────────────────────────────

const FREQUENCIES = [
  { value: 'ONE_TIME', label: 'Una vez (day pass)' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMI_ANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

function CreateTypeForm({
  onCreated,
  onCancel,
}: {
  onCreated: (type: MembershipType) => void;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [featuresRaw, setFeaturesRaw] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    billingFrequency: 'MONTHLY',
    durationDays: '30',
    maxFreezes: '1',
    maxFreezeDays: '30',
    isTrial: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const features = featuresRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/proxy/membership-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price),
          billingFrequency: form.billingFrequency,
          durationDays: Number(form.durationDays),
          maxFreezes: Number(form.maxFreezes),
          maxFreezeDays: Number(form.maxFreezeDays),
          isTrial: form.isTrial,
          features,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al crear el tipo');
        return;
      }

      const created = (await res.json()) as MembershipType;
      onCreated({ ...created, activeCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
    'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
  );

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold mb-4">Nuevo tipo de membresía</h3>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Mensual Pro"
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Precio (USD)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
              placeholder="65.00"
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frecuencia de cobro</label>
            <select
              name="billingFrequency"
              value={form.billingFrequency}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Duración (días)</label>
            <input
              name="durationDays"
              type="number"
              min="1"
              required
              value={form.durationDays}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Máx. congelaciones</label>
            <input
              name="maxFreezes"
              type="number"
              min="0"
              value={form.maxFreezes}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Máx. días congelado</label>
            <input
              name="maxFreezeDays"
              type="number"
              min="0"
              value={form.maxFreezeDays}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Descripción (opcional)</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Acceso ilimitado + clases grupales"
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Beneficios incluidos{' '}
            <span className="font-normal text-muted-foreground text-xs">(uno por línea)</span>
          </label>
          <textarea
            value={featuresRaw}
            onChange={(e) => setFeaturesRaw(e.target.value)}
            placeholder={'Acceso 24/7\nClases grupales ilimitadas\nLocker incluido'}
            rows={3}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isTrial"
            checked={form.isTrial}
            onChange={handleChange}
            className="rounded"
            disabled={isLoading}
          />
          <span className="text-sm">Es un plan de prueba (trial)</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !form.name || !form.price}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Crear tipo'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Formulario de edición ─────────────────────────────────────────────────

function EditTypeForm({
  type,
  onUpdated,
  onCancel,
}: {
  type: MembershipType;
  onUpdated: (type: MembershipType) => void;
  onCancel: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [featuresRaw, setFeaturesRaw] = useState(type.features.join('\n'));

  const [form, setForm] = useState({
    name: type.name,
    description: type.description ?? '',
    price: String(type.price),
    billingFrequency: type.billing_frequency,
    durationDays: String(type.duration_days),
    maxFreezes: String(type.max_freezes),
    maxFreezeDays: String(type.max_freeze_days),
    isTrial: type.is_trial,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type: inputType } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const features = featuresRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/proxy/membership-types/${type.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          price: Number(form.price),
          billingFrequency: form.billingFrequency,
          durationDays: Number(form.durationDays),
          maxFreezes: Number(form.maxFreezes),
          maxFreezeDays: Number(form.maxFreezeDays),
          isTrial: form.isTrial,
          features,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(
          Array.isArray(body.message)
            ? body.message.join(', ')
            : (body.message ?? 'Error al actualizar el tipo'),
        );
        return;
      }

      const updated = (await res.json()) as MembershipType;
      onUpdated({ ...updated, activeCount: type.activeCount });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
    'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
  );

  return (
    <div className="rounded-xl border border-primary/40 bg-card p-5 sm:col-span-2 lg:col-span-3">
      <h3 className="font-semibold mb-4">Editar: {type.name}</h3>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Precio (USD)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Frecuencia de cobro</label>
            <select
              name="billingFrequency"
              value={form.billingFrequency}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Duración (días)</label>
            <input
              name="durationDays"
              type="number"
              min="1"
              required
              value={form.durationDays}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Máx. congelaciones</label>
            <input
              name="maxFreezes"
              type="number"
              min="0"
              value={form.maxFreezes}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Máx. días congelado</label>
            <input
              name="maxFreezeDays"
              type="number"
              min="0"
              value={form.maxFreezeDays}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Descripción (opcional)</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Beneficios incluidos{' '}
            <span className="font-normal text-muted-foreground text-xs">(uno por línea)</span>
          </label>
          <textarea
            value={featuresRaw}
            onChange={(e) => setFeaturesRaw(e.target.value)}
            rows={3}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isTrial"
            checked={form.isTrial}
            onChange={handleChange}
            className="rounded"
            disabled={isLoading}
          />
          <span className="text-sm">Es un plan de prueba (trial)</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !form.name || !form.price}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
