import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { QrValidator } from '@/components/access/qr-validator';

interface AccessLog {
  id: string;
  result: string;
  method: string;
  occurred_at: string;
  member?: { id: string; first_name: string; last_name: string } | null;
}

interface AccessStats {
  todayGranted: number;
  todayDenied: number;
  weekGranted: number;
  recentLogs: AccessLog[];
}

interface LogsResponse {
  items: AccessLog[];
  total: number;
  page: number;
  pages: number;
}

const RESULT_COLORS: Record<string, string> = {
  GRANTED: 'bg-emerald-100 text-emerald-700',
  DENIED_EXPIRED: 'bg-amber-100 text-amber-700',
  DENIED_INVALID: 'bg-red-100 text-red-600',
  DENIED_INACTIVE: 'bg-red-100 text-red-600',
  DENIED_NO_MEMBERSHIP: 'bg-red-100 text-red-600',
  DENIED_REPLAY: 'bg-amber-100 text-amber-700',
};

const RESULT_LABELS: Record<string, string> = {
  GRANTED: 'Concedido',
  DENIED_EXPIRED: 'Expirado',
  DENIED_INVALID: 'Inválido',
  DENIED_INACTIVE: 'Inactivo',
  DENIED_NO_MEMBERSHIP: 'Sin membresía',
  DENIED_REPLAY: 'Replay',
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: 'numeric',
    month: 'short',
  });
}

export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; page?: string }>;
}) {
  const params = await searchParams;

  const query = new URLSearchParams();
  if (params.result) query.set('result', params.result);
  if (params.page) query.set('page', params.page);

  const [stats, logs] = await Promise.all([
    serverFetch<AccessStats>('/api/v1/access/stats'),
    serverFetch<LogsResponse>(`/api/v1/access/logs?${query.toString()}`),
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Control de Acceso</h1>
        <p className="text-sm text-gray-500">QR dinámico — HMAC-SHA256, 60 segundos de vigencia</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Entradas hoy</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600">{stats?.todayGranted ?? '—'}</p>
          <p className="mt-1 text-xs text-gray-400">accesos concedidos</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Denegados hoy</p>
          <p className="mt-1 text-3xl font-bold text-red-500">{stats?.todayDenied ?? '—'}</p>
          <p className="mt-1 text-xs text-gray-400">intentos fallidos</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Entradas esta semana</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{stats?.weekGranted ?? '—'}</p>
          <p className="mt-1 text-xs text-gray-400">últimos 7 días</p>
        </div>
      </div>

      {/* Recent + Validator */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent access log */}
        <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Accesos recientes</h2>
          {!stats?.recentLogs.length ? (
            <p className="text-sm text-gray-500">Sin registros todavía.</p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {stats.recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${log.result === 'GRANTED' ? 'bg-emerald-500' : 'bg-red-400'}`}
                    />
                    <div>
                      {log.member ? (
                        <Link
                          href={`/members/${log.member.id}`}
                          className="text-sm font-medium text-violet-700 hover:underline"
                        >
                          {log.member.first_name} {log.member.last_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">Desconocido</span>
                      )}
                      <p className="text-xs text-gray-400">{fmtDateTime(log.occurred_at)}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${RESULT_COLORS[log.result] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {RESULT_LABELS[log.result] ?? log.result}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Manual validator */}
        <QrValidator />
      </div>

      {/* Full log table */}
      <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900">Historial de accesos</h2>
          <form method="GET" className="flex gap-2">
            <select
              name="result"
              defaultValue={params.result ?? ''}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(RESULT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              Filtrar
            </button>
          </form>
        </div>

        {!logs?.items.length ? (
          <div className="p-12 text-center text-sm text-gray-500">Sin registros.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-left">
                <tr className="text-xs font-medium text-gray-500">
                  <th className="px-4 py-3">Miembro</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Método</th>
                  <th className="px-4 py-3">Fecha y hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.items.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {log.member ? (
                        <Link
                          href={`/members/${log.member.id}`}
                          className="font-medium text-violet-700 hover:underline"
                        >
                          {log.member.first_name} {log.member.last_name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RESULT_COLORS[log.result] ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {RESULT_LABELS[log.result] ?? log.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{log.method}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {fmtDateTime(log.occurred_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {logs.pages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500">
                  Mostrando página {logs.page} de {logs.pages} ({logs.total} registros)
                </p>
                <div className="flex gap-2">
                  {logs.page > 1 && (
                    <Link
                      href={`?${new URLSearchParams({ ...params, page: String(logs.page - 1) })}`}
                      className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      ← Anterior
                    </Link>
                  )}
                  {logs.page < logs.pages && (
                    <Link
                      href={`?${new URLSearchParams({ ...params, page: String(logs.page + 1) })}`}
                      className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
                    >
                      Siguiente →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
