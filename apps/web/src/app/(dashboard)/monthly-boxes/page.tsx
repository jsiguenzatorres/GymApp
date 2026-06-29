import { serverFetch } from '@/lib/server-api';
import { redirect } from 'next/navigation';
import { BoxForm } from './box-form';

interface MonthlyBox {
  id: string;
  month: string;
  title: string;
  description: string | null;
  contents: Array<{ name: string; brand?: string; quantity: number; qty_unit?: string }>;
  cover_url: string | null;
  delivery_date: string | null;
  is_published: boolean;
  _count?: { requests: number };
}

interface DeliveryRequest {
  id: string;
  status: 'REQUESTED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  delivery_address: string | null;
  notes: string | null;
  requested_at: string;
  member: { id: string; first_name: string; last_name: string; phone: string | null };
  box: { id: string; title: string; month: string };
}

const STATUS_COLOR: Record<string, string> = {
  REQUESTED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-amber-100 text-amber-700',
  READY: 'bg-emerald-100 text-emerald-700',
  DELIVERED: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-700',
};

async function upsertBoxAction(formData: FormData) {
  'use server';
  const contentsRaw = formData.get('contents_json') as string;
  let contents: unknown = [];
  try {
    contents = JSON.parse(contentsRaw || '[]');
  } catch {
    contents = [];
  }
  const payload = {
    month: (formData.get('month') as string) || undefined,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || undefined,
    contents,
    cover_url: (formData.get('cover_url') as string) || undefined,
    delivery_date: (formData.get('delivery_date') as string) || undefined,
    is_published: formData.get('is_published') === 'on',
  };
  await serverFetch('/api/v1/admin/monthly-boxes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  redirect('/monthly-boxes');
}

async function updateRequestStatusAction(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  await serverFetch(`/api/v1/admin/monthly-boxes/requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
  redirect('/monthly-boxes');
}

export default async function MonthlyBoxesPage() {
  const [boxes, requests] = await Promise.all([
    serverFetch<MonthlyBox[]>('/api/v1/admin/monthly-boxes'),
    serverFetch<DeliveryRequest[]>('/api/v1/admin/monthly-boxes/requests'),
  ]);

  const activeRequests = (requests ?? []).filter(
    (r) => r.status !== 'DELIVERED' && r.status !== 'CANCELLED',
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📦 Caja del mes</h1>
        <p className="text-sm text-gray-500">
          Configura la caja premium incluida en la suscripción NutriElite.
        </p>
      </div>

      <BoxForm onSubmit={upsertBoxAction} />

      {/* Solicitudes activas */}
      {activeRequests.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5">
          <h2 className="mb-3 text-lg font-bold text-amber-900">
            🚚 {activeRequests.length} solicitudes activas
          </h2>
          <div className="space-y-2">
            {activeRequests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {r.member.first_name} {r.member.last_name}
                    {r.member.phone && (
                      <span className="ml-2 text-xs text-gray-500">{r.member.phone}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {r.box.title} · {r.box.month}
                  </p>
                  {r.delivery_address && (
                    <p className="mt-1 text-xs text-gray-600">📍 {r.delivery_address}</p>
                  )}
                  {r.notes && <p className="mt-1 text-xs italic text-gray-500">📝 {r.notes}</p>}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    STATUS_COLOR[r.status]
                  }`}
                >
                  {r.status}
                </span>
                {(['PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] as const).map((s) => (
                  <form action={updateRequestStatusAction} className="inline" key={s}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      type="submit"
                      disabled={r.status === s}
                      className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-30"
                    >
                      {s === 'PREPARING'
                        ? 'Preparando'
                        : s === 'READY'
                          ? 'Lista'
                          : s === 'DELIVERED'
                            ? '✓ Entregada'
                            : '✕'}
                    </button>
                  </form>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de cajas */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          {boxes?.length ?? 0} cajas creadas
        </h2>
        {!boxes || boxes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
            Crea la caja de este mes arriba
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {boxes.map((b) => (
              <div
                key={b.id}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
              >
                {b.cover_url && (
                  <div
                    className="h-32 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${b.cover_url})` }}
                  />
                )}
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">
                      {b.month}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        b.is_published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {b.is_published ? 'Publicada' : 'Borrador'}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      📦 {b._count?.requests ?? 0} solicitudes
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{b.title}</h3>
                  {b.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{b.description}</p>
                  )}
                  {b.contents.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      {b.contents.slice(0, 4).map((c, i) => (
                        <li key={i}>
                          • {c.quantity}
                          {c.qty_unit ? `${c.qty_unit}` : ''} {c.name}
                          {c.brand && <span className="text-gray-400"> ({c.brand})</span>}
                        </li>
                      ))}
                      {b.contents.length > 4 && (
                        <li className="text-gray-400">+ {b.contents.length - 4} items más</li>
                      )}
                    </ul>
                  )}
                  {b.delivery_date && (
                    <p className="mt-2 text-xs text-amber-700">
                      📅 Entrega:{' '}
                      {new Date(b.delivery_date).toLocaleDateString('es-SV', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
