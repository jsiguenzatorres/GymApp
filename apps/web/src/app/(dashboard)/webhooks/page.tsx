import { serverFetch } from '@/lib/server-api';
import Link from 'next/link';

interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  external_id: string;
  payload: unknown;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  received_at: string;
}

const PROVIDER_COLOR: Record<string, string> = {
  stripe: 'bg-violet-100 text-violet-700',
  mercadopago: 'bg-cyan-100 text-cyan-700',
  unknown: 'bg-gray-100 text-gray-600',
};

export default async function WebhooksPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; processed?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.provider) qs.set('provider', params.provider);
  if (params.processed) qs.set('processed', params.processed);
  const events =
    (await serverFetch<WebhookEvent[]>(`/api/v1/admin/billing/webhooks?${qs.toString()}`)) ?? [];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🪝 Log de webhooks</h1>
        <p className="text-sm text-gray-500">
          Eventos recibidos de Stripe, MercadoPago y otros providers. Útil para debuggear pagos.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/webhooks"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !params.provider
              ? 'bg-violet-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Todos
        </Link>
        <Link
          href="/webhooks?provider=stripe"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.provider === 'stripe'
              ? 'bg-violet-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Stripe
        </Link>
        <Link
          href="/webhooks?provider=mercadopago"
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.provider === 'mercadopago'
              ? 'bg-violet-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          MercadoPago
        </Link>
        <span className="mx-2 self-center text-gray-300">·</span>
        <Link
          href={`/webhooks${params.provider ? `?provider=${params.provider}&` : '?'}processed=false`}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.processed === 'false'
              ? 'bg-amber-500 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Sin procesar
        </Link>
        <Link
          href={`/webhooks${params.provider ? `?provider=${params.provider}&` : '?'}processed=true`}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            params.processed === 'true'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Procesados
        </Link>
      </div>

      {/* Tabla */}
      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
          Sin eventos para los filtros seleccionados
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">External ID</th>
                <th className="px-4 py-3">Recibido</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        PROVIDER_COLOR[ev.provider] ?? PROVIDER_COLOR.unknown
                      }`}
                    >
                      {ev.provider}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{ev.event_type}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-500">
                    {ev.external_id.slice(0, 32)}
                    {ev.external_id.length > 32 ? '…' : ''}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(ev.received_at).toLocaleString('es-SV', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2">
                    {ev.processed ? (
                      <span className="text-xs font-semibold text-emerald-600">✓ Procesado</span>
                    ) : ev.error ? (
                      <span className="text-xs font-semibold text-red-600" title={ev.error}>
                        ✕ Error
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-600">⏳ Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-xs text-gray-400">
        Mostrando los últimos {events.length} eventos. Los webhooks se procesan en orden FIFO en
        Fase 2 (subscription engine completo).
      </div>
    </div>
  );
}
