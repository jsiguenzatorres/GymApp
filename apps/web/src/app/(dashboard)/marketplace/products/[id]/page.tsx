'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Trash2, Plus, Minus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  category_id: string | null;
  category: { id: string; name: string } | null;
}

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockDelta, setStockDelta] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
    sku: '',
    image_url: '',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/proxy/products/${id}`).then((r) => r.json()),
      fetch('/api/proxy/product-categories').then((r) => r.json()),
    ])
      .then(([product, cats]: [Product, Category[]]) => {
        setForm({
          name: product.name,
          description: product.description ?? '',
          price: String(product.price),
          stock: product.stock,
          sku: product.sku ?? '',
          image_url: product.image_url ?? '',
          category_id: product.category_id ?? '',
          is_active: product.is_active,
        });
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => setError('Error cargando producto'))
      .finally(() => setLoadingProduct(false));
  }, [id]);

  function set(field: string, value: string | boolean | number) {
    setForm((p) => ({ ...p, [field]: value }));
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setLoading(true);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      is_active: form.is_active,
    };
    if (form.description) body.description = form.description;
    if (form.sku) body.sku = form.sku;
    if (form.image_url) body.image_url = form.image_url;
    if (form.category_id) body.category_id = form.category_id;

    try {
      const res = await fetch(`/api/proxy/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.push('/marketplace');
        router.refresh();
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  async function adjustStock(delta: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/products/${id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        const p = (await res.json()) as { stock: number };
        setForm((prev) => ({ ...prev, stock: p.stock }));
        setStockDelta('');
      } else setError('Error ajustando stock');
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try {
      await fetch(`/api/proxy/products/${id}`, { method: 'DELETE' });
      router.push('/marketplace');
      router.refresh();
    } catch {
      setError('Error eliminando');
      setLoading(false);
    }
  }

  if (loadingProduct)
    return <div className="animate-pulse text-sm text-gray-400 p-8">Cargando producto...</div>;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar producto</h1>
      </div>

      {/* Stock card */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500 mb-3">
          Ajuste de stock actual: <strong className="text-gray-900">{form.stock} unidades</strong>
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => adjustStock(-1)}
            disabled={form.stock === 0 || loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="number"
            value={stockDelta}
            onChange={(e) => setStockDelta(e.target.value)}
            placeholder="0"
            className="w-20 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const d = parseInt(stockDelta);
              if (!isNaN(d) && d !== 0) adjustStock(d);
            }}
            disabled={!stockDelta || loading}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40"
          >
            Aplicar
          </button>
          <button
            type="button"
            onClick={() => adjustStock(1)}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
            <Package className="h-4 w-4 text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Datos del producto</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Nombre *</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className={inputCls()}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            className={inputCls('resize-none')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Precio (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={inputCls()}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">SKU</label>
            <input
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              className={inputCls()}
            />
          </div>
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

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">URL de imagen</label>
          <input
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
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
          <span className="text-sm text-gray-600">Producto activo</span>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
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
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
