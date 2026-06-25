import { serverFetch } from '@/lib/server-api';
import {
  UnreadFilter,
  MarkAllReadButton,
  NotificationItem,
} from '@/components/notifications/notifications-actions';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  channel: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotifResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pages: number;
}

const TYPE_ICON: Record<string, string> = {
  'payment.failed': '💳',
  'payment.succeeded': '✅',
  'membership.activated': '🎉',
  'membership.expired': '⚠️',
  'workout.pr_achieved': '🏆',
  'workout.plan_assigned': '📋',
  'crm.risk_score_high': '🔶',
  'crm.risk_score_critical': '🚨',
  'crm.member_created': '👤',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('es-SV', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ unreadOnly?: string; page?: string }>;
}) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.unreadOnly === 'true') query.set('unreadOnly', 'true');
  if (params.page) query.set('page', params.page);

  const data = await serverFetch<NotifResponse>(`/api/v1/notifications?${query.toString()}`);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          {data && (
            <p className="text-sm text-gray-500">
              {data.unreadCount > 0 ? `${data.unreadCount} sin leer · ` : ''}
              {data.total} en total
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <UnreadFilter checked={params.unreadOnly === 'true'} />
          <MarkAllReadButton disabled={!data || data.unreadCount === 0} />
        </div>
      </div>

      {/* List */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        {!data?.items.length ? (
          <div className="p-16 text-center">
            <p className="text-3xl">🔔</p>
            <p className="mt-2 text-sm text-gray-400">
              Sin notificaciones{params.unreadOnly === 'true' ? ' sin leer' : ''}.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.items.map((n) => (
              <NotificationItem key={n.id} id={n.id} isRead={n.is_read}>
                <span className="mt-0.5 shrink-0 text-2xl">{TYPE_ICON[n.type] ?? '🔔'}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}
                    >
                      {n.title}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-violet-500" />}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${n.channel === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {n.channel === 'EMAIL' ? 'Email' : 'In-app'}
                      </span>
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{n.body}</p>
                  <p className="mt-1 text-xs text-gray-400">{fmtDate(n.created_at)}</p>
                </div>
              </NotificationItem>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <p className="text-xs text-gray-500">
              Página {data.page} de {data.pages}
            </p>
            <div className="flex gap-2">
              {data.page > 1 && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(data.page - 1) })}`}
                  className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  ← Anterior
                </a>
              )}
              {data.page < data.pages && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(data.page + 1) })}`}
                  className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Siguiente →
                </a>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
