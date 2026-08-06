'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Loader2,
  Package,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

interface MemberResult {
  id: string;
  first_name: string;
  last_name: string;
  user: { email: string };
}

interface ProductResult {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
}

interface CartItem {
  product: ProductResult;
  quantity: number;
}

export default function NewOrderPage() {
  const router = useRouter();

  // Miembro
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);
  const [searchingMember, setSearchingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberResult | null>(null);

  // Productos
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [markDelivered, setMarkDelivered] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const searchMembers = useCallback(async (value: string) => {
    setMemberSearch(value);
    setSelectedMember(null);
    if (value.length < 2) {
      setMemberResults([]);
      return;
    }
    setSearchingMember(true);
    try {
      const res = await fetch(`/api/proxy/members?search=${encodeURIComponent(value)}&limit=5`);
      if (res.ok) {
        const data = (await res.json()) as { data: MemberResult[] };
        setMemberResults(data.data ?? []);
      }
    } finally {
      setSearchingMember(false);
    }
  }, []);

  const searchProducts = useCallback(async (value: string) => {
    setProductSearch(value);
    if (value.length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingProduct(true);
    try {
      const res = await fetch(
        `/api/proxy/products?search=${encodeURIComponent(value)}&onlyActive=true`,
      );
      if (res.ok) {
        const data = (await res.json()) as ProductResult[];
        setProductResults(data.filter((p) => p.stock > 0).slice(0, 8));
      }
    } finally {
      setSearchingProduct(false);
    }
  }, []);

  function addToCart(product: ProductResult) {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch('');
    setProductResults([]);
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== productId) return c;
          const qty = Math.min(c.product.stock, Math.max(1, c.quantity + delta));
          return { ...c, quantity: qty };
        })
        .filter(Boolean),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }

  const total = cart.reduce((sum, c) => sum + Number(c.product.price) * c.quantity, 0);

  async function handleSubmit() {
    if (!selectedMember) {
      setError('Selecciona un miembro');
      return;
    }
    if (cart.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/proxy/marketplace-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember.id,
          notes: notes || undefined,
          items: cart.map((c) => ({ product_id: c.product.id, quantity: c.quantity })),
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al crear la venta');
        return;
      }

      const order = (await res.json()) as { id: string };

      if (markDelivered) {
        await fetch(`/api/proxy/marketplace-orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DELIVERED' }),
        });
      }

      router.push('/marketplace/orders');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/marketplace/orders"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva venta</h1>
          <p className="text-sm text-gray-500">Registra una venta de mostrador para un miembro</p>
        </div>
      </div>

      {/* Miembro */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-gray-700">Miembro</label>
        <div className="relative mt-1.5">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {searchingMember ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => searchMembers(e.target.value)}
            placeholder="Buscar por nombre o email..."
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {memberResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {memberResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMember(m);
                    setMemberSearch(`${m.first_name} ${m.last_name}`);
                    setMemberResults([]);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    {m.first_name[0]}
                    {m.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedMember && (
          <p className="mt-2 text-sm font-medium text-emerald-600">
            ✓ {selectedMember.first_name} {selectedMember.last_name} seleccionado
          </p>
        )}
      </div>

      {/* Productos */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="text-sm font-medium text-gray-700">Agregar productos</label>
        <div className="relative mt-1.5">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {searchingProduct ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <Search className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={productSearch}
            onChange={(e) => searchProducts(e.target.value)}
            placeholder="Buscar producto..."
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {productResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToCart(p)}
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
                    <p className="text-xs text-gray-400">{p.stock} disponibles</p>
                  </div>
                  <span className="text-sm font-semibold text-violet-700">
                    ${Number(p.price).toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        {cart.length === 0 ? (
          <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
            <ShoppingCart className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">Aún no has agregado productos</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {cart.map((c) => (
              <div
                key={c.product.id}
                className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{c.product.name}</p>
                  <p className="text-xs text-gray-400">${Number(c.product.price).toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => changeQty(c.product.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{c.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(c.product.id, 1)}
                    disabled={c.quantity >= c.product.stock}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="w-16 text-right text-sm font-semibold text-gray-900">
                  ${(Number(c.product.price) * c.quantity).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFromCart(c.product.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-sm font-medium text-gray-500">Total</span>
              <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notas + opciones */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Notas <span className="text-xs font-normal text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Notas internas sobre esta venta..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={markDelivered}
            onChange={(e) => setMarkDelivered(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Marcar como entregada y pagada ahora (venta de mostrador)
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/marketplace/orders')}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedMember || cart.length === 0}
          className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Registrando venta...' : `Registrar venta — $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
