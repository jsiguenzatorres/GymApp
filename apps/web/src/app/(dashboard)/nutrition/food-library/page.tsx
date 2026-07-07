'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Plus, BadgeCheck, Pencil, Trash2 } from 'lucide-react';

interface FoodItem {
  id: string;
  gym_id: string | null;
  name: string;
  brand: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  is_verified: boolean;
  source: string | null;
}

type FoodForm = {
  name: string;
  brand: string;
  kcal_per_100g: string;
  protein_per_100g: string;
  carbs_per_100g: string;
  fat_per_100g: string;
};

const EMPTY_FORM: FoodForm = {
  name: '',
  brand: '',
  kcal_per_100g: '',
  protein_per_100g: '',
  carbs_per_100g: '',
  fat_per_100g: '',
};

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

export default function FoodLibraryPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FoodForm>(EMPTY_FORM);

  // Edición / borrado (mejora D-35)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FoodForm>(EMPTY_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/food-items?search=${encodeURIComponent(q)}`);
      if (res.ok) setItems((await res.json()) as FoodItem[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  function set(field: keyof typeof form, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function createFood(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/food-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim() || undefined,
          kcal_per_100g: parseFloat(form.kcal_per_100g) || 0,
          protein_per_100g: parseFloat(form.protein_per_100g) || 0,
          carbs_per_100g: parseFloat(form.carbs_per_100g) || 0,
          fat_per_100g: parseFloat(form.fat_per_100g) || 0,
        }),
      });
      if (res.ok) {
        setForm(EMPTY_FORM);
        setShowCreate(false);
        await load(search);
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

  function startEdit(f: FoodItem) {
    setEditingId(f.id);
    setEditError(null);
    setEditForm({
      name: f.name,
      brand: f.brand ?? '',
      kcal_per_100g: String(f.kcal_per_100g),
      protein_per_100g: String(f.protein_per_100g),
      carbs_per_100g: String(f.carbs_per_100g),
      fat_per_100g: String(f.fat_per_100g),
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/proxy/food-items/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          brand: editForm.brand.trim() || undefined,
          kcal_per_100g: parseFloat(editForm.kcal_per_100g) || 0,
          protein_per_100g: parseFloat(editForm.protein_per_100g) || 0,
          carbs_per_100g: parseFloat(editForm.carbs_per_100g) || 0,
          fat_per_100g: parseFloat(editForm.fat_per_100g) || 0,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await load(search);
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setEditError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
      }
    } catch {
      setEditError('Error de red');
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeFood(id: string) {
    if (!confirm('¿Eliminar este alimento? No se puede deshacer.')) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/proxy/food-items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await load(search);
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setDeleteError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
      }
    } catch {
      setDeleteError('Error de red');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/nutrition"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a nutrición
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de alimentos</h1>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" /> Agregar alimento
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Alimentos disponibles para registrar en el diario y generar planes. Los alimentos que
          agregues aquí quedan visibles para todo tu gym.
        </p>
      </div>

      {showCreate && (
        <form onSubmit={createFood} className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-900">Nuevo alimento</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Marca (opcional)</label>
              <input
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                className={inputCls()}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Kcal/100g</label>
              <input
                type="number"
                min="0"
                value={form.kcal_per_100g}
                onChange={(e) => set('kcal_per_100g', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Proteína/100g</label>
              <input
                type="number"
                min="0"
                value={form.protein_per_100g}
                onChange={(e) => set('protein_per_100g', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Carbos/100g</label>
              <input
                type="number"
                min="0"
                value={form.carbs_per_100g}
                onChange={(e) => set('carbs_per_100g', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Grasas/100g</label>
              <input
                type="number"
                min="0"
                value={form.fat_per_100g}
                onChange={(e) => set('fat_per_100g', e.target.value)}
                className={inputCls()}
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {creating ? 'Guardando...' : 'Guardar alimento'}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimento..."
          className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none"
        />
      </div>

      {deleteError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs text-red-600">
          {deleteError}
        </p>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y">
        {loading ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Sin resultados</p>
        ) : (
          items.map((f) =>
            editingId === f.id ? (
              <div key={f.id} className="px-5 py-3 space-y-2 bg-violet-50">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre"
                    className={inputCls()}
                  />
                  <input
                    value={editForm.brand}
                    onChange={(e) => setEditForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="Marca (opcional)"
                    className={inputCls()}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ['kcal_per_100g', 'Kcal'],
                      ['protein_per_100g', 'Prot'],
                      ['carbs_per_100g', 'Carb'],
                      ['fat_per_100g', 'Gras'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className="text-[10px] text-gray-500">{label}/100g</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm[field]}
                        onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                        className={inputCls()}
                      />
                    </div>
                  ))}
                </div>
                {editError && <p className="text-xs text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {savingEdit ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div key={f.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    {f.name}
                    {f.is_verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
                    {f.gym_id === null && (
                      <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">
                        Global
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {f.brand && `${f.brand} · `}
                    {f.source ?? 'manual'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs text-gray-500">
                    <p className="font-semibold text-gray-800">{f.kcal_per_100g} kcal/100g</p>
                    <p>
                      P:{f.protein_per_100g} C:{f.carbs_per_100g} G:{f.fat_per_100g}
                    </p>
                  </div>
                  {f.gym_id !== null && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(f)}
                        className="flex h-7 w-7 items-center justify-center rounded text-gray-300 hover:text-violet-600"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeFood(f.id)}
                        disabled={deletingId === f.id}
                        className="flex h-7 w-7 items-center justify-center rounded text-gray-300 hover:text-red-500 disabled:opacity-40"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}
