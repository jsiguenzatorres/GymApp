'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    sku: '',
    image_url: '',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetch('/api/proxy/product-categories')
      .then((r) => r.json())
      .then((d: Category[]) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  function set(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!form.price || isNaN(Number(form.price))) {
      setError('Precio inválido');
      return;
    }

    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      is_active: form.is_active,
    };
    if (form.description) body.description = form.description;
    if (form.sku) body.sku = form.sku;
    if (form.image_url) body.image_url = form.image_url;
    if (form.category_id) body.category_id = form.category_id;

    try {
      const res = await fetch('/api/proxy/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/marketplace');
        router.refresh();
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(
          Array.isArray(d.message)
            ? d.message.join(', ')
            : (d.message ?? 'Error al crear producto'),
        );
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo producto</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <Package className="h-4 w-4 text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Información del producto</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Nombre *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            placeholder="Ej: Proteína Whey Isolate"
            className={inputCls()}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            placeholder="Descripción del producto..."
            className={inputCls('resize-none')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Precio (USD) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              required
              placeholder="0.00"
              className={inputCls()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Stock inicial</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              className={inputCls()}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">SKU</label>
            <input
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="Ej: PRO-WHY-001"
              className={inputCls()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Categoría</label>
            <select
              value={form.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              className={inputCls('bg-white')}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">URL de imagen</label>
          <input
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://..."
            className={inputCls()}
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div
            onClick={() => set('is_active', !form.is_active)}
            className={`relative h-5 w-9 cursor-pointer rounded-full transition-colors ${form.is_active ? 'bg-violet-600' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`}
            />
          </div>
          <span className="text-sm text-gray-600">Producto activo (visible en el catálogo)</span>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Link
            href="/marketplace"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
