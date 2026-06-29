import { serverFetch } from '@/lib/server-api';
import Link from 'next/link';

interface AdminSubscription {
  id: string;
  quantity: number;
  frequency_days: number;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  next_delivery_at: string;
  last_delivered_at: string | null;
  total_deliveries: number;
  product: { id: string; name: string; price: string | number; image_url: string | null };
  member: { id: string; first_name: string; last_name: string; phone: string | null };
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  const subs =
    (await serverFetch<AdminSubscription[]>(`/api/v1/admin/subscriptions?${qs.toString()}`)) ?? [];

  // Calcular MRR aproximado (productos × precio / frequency_days × 30)
  const activeSubs = subs.filter((s) => s.status === 'ACTIVE');
  const mrr = activeSubs.reduce(
    (acc, s) => acc + (Number(s.product.price) * s.quantity * 30) / s.frequency_days,
    0,
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔁 Suscripciones de productos</h1>
        <p className="text-sm text-gray-500">
          Suscripciones recurrentes que los miembros tienen activas a productos del marketplace.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Activas</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{activeSubs.length}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Pausadas</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">
            {subs.filter((s) => s.status === 'PAUSED').length}
          </p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-violet-700">MRR proyectado</p>
          <p className="mt-1 text-3xl font-bold text-violet-700">
            ${mrr.toFixed(2)}
            <span className="text-sm text-violet-500">/mes</span>
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Link
          href="/subscriptions"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !params.status
              ? 'bg-violet-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Activas + Pausadas
        </Link>
        <Link
          href="/subscriptions?status=ACTIVE"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.status === 'ACTIVE'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Activas
        </Link>
        <Link
          href="/subscriptions?status=PAUSED"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.status === 'PAUSED'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Pausadas
        </Link>
        <Link
          href="/subscriptions?status=CANCELLED"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.status === 'CANCELLED'
              ? 'bg-gray-700 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Canceladas
        </Link>
      </div>

      {/* Tabla */}
      {subs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          Sin suscripciones para los filtros seleccionados
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Miembro</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Frecuencia</th>
                <th className="px-4 py-3">Próxima</th>
                <th className="px-4 py-3">Entregas</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link
                      href={`/members/${s.member.id}`}
                      className="text-violet-700 hover:underline"
                    >
                      {s.member.first_name} {s.member.last_name}
                    </Link>
                    {s.member.phone && <p className="text-xs text-gray-400">{s.member.phone}</p>}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {s.quantity}× {s.product.name}
                    <p className="text-xs text-gray-400">
                      ${Number(s.product.price).toFixed(2)} c/u
                    </p>
                  </td>
                  <td className="px-4 py-2 text-xs">cada {s.frequency_days}d</td>
                  <td className="px-4 py-2 text-xs">
                    {new Date(s.next_delivery_at).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="px-4 py-2 text-xs text-center font-semibold">
                    {s.total_deliveries}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        STATUS_COLOR[s.status]
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
