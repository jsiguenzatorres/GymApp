'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: { id: string; name: string; image_url: string | null };
}

interface Order {
  id: string;
  status: string;
  total: number;
  notes: string | null;
  created_at: string;
  member: { id: string; first_name: string; last_name: string };
  items: OrderItem[];
}

interface PagedOrders {
  data: Order[];
  total: number;
  totalPages: number;
  page: number;
}

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  { value: 'CONFIRMED', label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  { value: 'READY', label: 'Listo', color: 'bg-violet-100 text-violet-700' },
  { value: 'DELIVERED', label: 'Entregado', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-gray-100 text-gray-500' },
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUSES.find((x) => x.value === status);
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s?.color ?? 'bg-gray-100 text-gray-500'}`}
    >
      {s?.label ?? status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) qs.set('status', statusFilter);
      const res = await fetch(`/api/proxy/marketplace-orders?${qs}`);
      if (res.ok) {
        const d = (await res.json()) as PagedOrders;
        setOrders(d.data ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      await fetch(`/api/proxy/marketplace-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  const nextStatuses: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['READY', 'CANCELLED'],
    READY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500">
            {total} pedido{total !== 1 ? 's' : ''} en total
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => {
              setStatusFilter(s.value);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s.value
                ? 'bg-violet-600 text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            No hay pedidos {statusFilter ? `con estado "${statusFilter}"` : 'aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={o.status} />
                    <span className="text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString('es-SV', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Link
                    href={`/members/${o.member.id}`}
                    className="text-sm font-semibold text-violet-700 hover:underline"
                  >
                    {o.member.first_name} {o.member.last_name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    {o.items.map((i) => `${i.product.name} ×${i.quantity}`).join(' · ')}
                  </p>
                  {o.notes && <p className="text-xs text-gray-400 mt-1 italic">{o.notes}</p>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-base font-bold text-gray-900">
                    ${Number(o.total).toFixed(2)}
                  </span>
                  <div className="flex gap-1.5">
                    {(nextStatuses[o.status] ?? []).map((ns) => {
                      const label = STATUSES.find((x) => x.value === ns)?.label ?? ns;
                      const isCancel = ns === 'CANCELLED';
                      return (
                        <button
                          key={ns}
                          onClick={() => updateStatus(o.id, ns)}
                          disabled={updatingId === o.id}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                            isCancel
                              ? 'border border-red-200 text-red-600 hover:bg-red-50'
                              : 'bg-violet-600 text-white hover:bg-violet-700'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
