'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Loader2,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  image_url: string | null;
  category: { id: string; name: string } | null;
}

interface StockMovement {
  id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  balance_after: number;
  reason: string | null;
  related_order_id: string | null;
  created_by_name: string | null;
  created_at: string;
}

interface PagedMovements {
  data: StockMovement[];
  total: number;
  totalPages: number;
  page: number;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StockAdjustPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<ProductSearchResult | null>(null);

  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movPage, setMovPage] = useState(1);
  const [movTotalPages, setMovTotalPages] = useState(1);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const loadMovements = useCallback(async (productId: string, page: number) => {
    setLoadingMovements(true);
    try {
      const res = await fetch(
        `/api/proxy/products/${productId}/stock-movements?page=${page}&limit=15`,
      );
      if (res.ok) {
        const d = (await res.json()) as PagedMovements;
        setMovements(d.data ?? []);
        setMovTotalPages(d.totalPages ?? 1);
        setMovPage(d.page ?? 1);
      }
    } finally {
      setLoadingMovements(false);
    }
  }, []);

  const handleSearch = useCallback(async (value: string) => {
    setSearch(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/proxy/products?search=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = (await res.json()) as ProductSearchResult[];
        setResults(data.slice(0, 8));
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  function selectProduct(p: ProductSearchResult) {
    setSelected(p);
    setSearch(p.name);
    setResults([]);
    setQuantity('');
    setReason('');
    setMovementType('IN');
    setError('');
    setSuccess('');
    loadMovements(p.id, 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError('Ingresa una cantidad mayor a 0');
      return;
    }
    const delta = movementType === 'IN' ? qty : -qty;
    if (movementType === 'OUT' && qty > selected.stock) {
      setError('No puedes registrar una salida mayor al stock actual');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/proxy/products/${selected.id}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, reason: reason || undefined }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al registrar el movimiento');
        return;
      }
      const updated = (await res.json()) as { stock: number };
      setSelected((prev) => (prev ? { ...prev, stock: updated.stock } : prev));
      setQuantity('');
      setReason('');
      setSuccess('Movimiento registrado correctamente');
      loadMovements(selected.id, 1);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/marketplace"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajuste de inventario</h1>
          <p className="text-sm text-gray-500">
            Registra entradas (compras a proveedor) y salidas o correcciones — el kardex lleva el
            historial completo por producto
          </p>
        </div>
      </div>

      {/* Buscador de producto */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-gray-700">Producto</label>
        <div className="relative mt-1.5">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSelected(null);
              handleSearch(e.target.value);
            }}
            placeholder="Buscar producto por nombre..."
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.category && <p className="text-xs text-gray-400">{p.category.name}</p>}
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{p.stock} uds</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <>
          {/* Formulario de movimiento */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                {selected.sku && <p className="text-xs text-gray-400">SKU: {selected.sku}</p>}
              </div>
              <p className="text-sm text-gray-500">
                Stock actual: <strong className="text-gray-900">{selected.stock} unidades</strong>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMovementType('IN')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  movementType === 'IN'
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <ArrowUpCircle className="h-4 w-4" /> Entrada (compra)
              </button>
              <button
                type="button"
                onClick={() => setMovementType('OUT')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  movementType === 'OUT'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <ArrowDownCircle className="h-4 w-4" /> Salida / corrección
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Motivo <span className="text-xs font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Compra a proveedor, producto dañado..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !quantity}
              className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registrando...' : 'Registrar movimiento'}
            </button>
          </form>

          {/* Kardex */}
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">
                Kardex — historial de movimientos
              </p>
            </div>
            {loadingMovements ? (
              <div className="p-5 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">Sin movimientos registrados todavía.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-5 py-2.5">Fecha</th>
                      <th className="px-5 py-2.5">Tipo</th>
                      <th className="px-5 py-2.5 text-right">Cantidad</th>
                      <th className="px-5 py-2.5 text-right">Saldo</th>
                      <th className="px-5 py-2.5">Motivo</th>
                      <th className="px-5 py-2.5">Realizado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-5 py-2.5 text-gray-500 whitespace-nowrap">
                          {formatDateTime(m.created_at)}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.type === 'IN'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {m.type === 'IN' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right font-medium text-gray-900">
                          {m.type === 'IN' ? '+' : '-'}
                          {m.quantity}
                        </td>
                        <td className="px-5 py-2.5 text-right text-gray-500">{m.balance_after}</td>
                        <td className="px-5 py-2.5 text-gray-500">
                          {m.reason ?? (m.related_order_id ? 'Venta' : '—')}
                        </td>
                        <td className="px-5 py-2.5 text-gray-500">{m.created_by_name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {movTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                <p className="text-xs text-gray-500">
                  Página {movPage} de {movTotalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadMovements(selected.id, Math.max(1, movPage - 1))}
                    disabled={movPage === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => loadMovements(selected.id, Math.min(movTotalPages, movPage + 1))}
                    disabled={movPage === movTotalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
