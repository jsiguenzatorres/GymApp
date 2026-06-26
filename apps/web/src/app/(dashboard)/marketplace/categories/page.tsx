'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  _count: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await fetch('/api/proxy/product-categories');
      if (res.ok) {
        const d = (await res.json()) as Category[];
        setCategories(Array.isArray(d) ? d : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/proxy/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        setNewName('');
        setNewDesc('');
        await load();
      } else setError('Error creando categoría');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/product-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || undefined }),
      });
      if (res.ok) {
        setEditingId(null);
        await load();
      } else setError('Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/proxy/product-categories/${id}`, { method: 'DELETE' });
      if (res.ok) await load();
      else {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        setError(d.message ?? 'Error eliminando');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/marketplace"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500">Organiza los productos del catálogo</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2">
          <span className="text-sm text-red-600">{error}</span>
          <button onClick={() => setError(null)}>
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Create */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-gray-900">Nueva categoría</p>
        </div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de la categoría"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <input
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Descripción (opcional)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
        <button
          onClick={createCategory}
          disabled={!newName.trim() || saving}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Crear categoría
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
          <Tag className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">No hay categorías todavía</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm divide-y">
          {categories.map((cat) => (
            <div key={cat.id} className="px-5 py-4">
              {editingId === cat.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-violet-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Descripción"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(cat.id)}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">
                      {cat._count.products} producto{cat._count.products !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                        setEditDesc(cat.description ?? '');
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id, cat.name)}
                      disabled={saving}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
