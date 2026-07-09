import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { PaymentStatusBadge } from '@/components/billing/payment-status-badge';
import { PaymentsExportButton } from './export-button';
import { Plus, Upload } from 'lucide-react';

export const metadata: Metadata = { title: 'Pagos — GymApp' };

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  description: string | null;
  invoice_type: string | null;
  voucher_number: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  paid_at: string | null;
  created_at: string;
  member: {
    first_name: string;
    last_name: string;
    user: { email: string };
  };
  membership: {
    type: { name: string };
  } | null;
}

interface PaymentsResponse {
  data: Payment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface BillingSummary {
  thisMonth: { total: number; count: number };
  lastMonth: { total: number; count: number };
  pending: { total: number; count: number };
  failedThisMonth: number;
  pendingReview: number;
  growth: number | null;
}

// Reune todo el conjunto filtrado (no solo la pagina actual) para exportar a
// Excel — pagina internamente contra el mismo endpoint, con un tope razonable
// para no colgar la request si el filtro devuelve miles de filas.
async function fetchAllFilteredPayments(baseQs: URLSearchParams): Promise<Payment[]> {
  const all: Payment[] = [];
  const MAX_PAGES = 20;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const qs = new URLSearchParams(baseQs);
    qs.set('page', String(page));
    qs.set('limit', '100');
    const result = await serverFetch<PaymentsResponse>(`/api/v1/payments?${qs.toString()}`);
    if (!result?.data?.length) break;
    all.push(...result.data);
    if (page >= result.meta.totalPages) break;
  }
  return all;
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    paymentType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia',
  STRIPE: 'Stripe',
  MERCADOPAGO: 'MercadoPago',
  OTHER: 'Otro',
};

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(amount);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function PaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.paymentType) qs.set('paymentType', params.paymentType);
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.page) qs.set('page', params.page);
  qs.set('limit', '25');

  const exportQs = new URLSearchParams();
  if (params.status) exportQs.set('status', params.status);
  if (params.paymentType) exportQs.set('paymentType', params.paymentType);
  if (params.startDate) exportQs.set('startDate', params.startDate);
  if (params.endDate) exportQs.set('endDate', params.endDate);

  const [result, summary, exportPayments] = await Promise.all([
    serverFetch<PaymentsResponse>(`/api/v1/payments?${qs.toString()}`),
    serverFetch<BillingSummary>('/api/v1/billing/summary'),
    fetchAllFilteredPayments(exportQs),
  ]);

  const payments = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: 25, totalPages: 1 };
  const hasFilters = !!(params.status || params.paymentType || params.startDate || params.endDate);
  const exportLabel = hasFilters ? 'filtrado' : new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
          <p className="text-sm text-muted-foreground">Historial de cobros y transacciones</p>
        </div>
        <div className="flex items-center gap-2">
          <PaymentsExportButton payments={exportPayments} filterLabel={exportLabel} />
          <Link
            href="/payments/upload-voucher"
            className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Upload className="h-4 w-4" />
            Subir comprobante
          </Link>
          <Link
            href="/payments/new"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar pago
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            label="Cobrado este mes"
            value={formatCurrency(summary.thisMonth.total)}
            sub={`${summary.thisMonth.count} transacciones`}
            growth={summary.growth}
          />
          <SummaryCard
            label="Mes anterior"
            value={formatCurrency(summary.lastMonth.total)}
            sub={`${summary.lastMonth.count} transacciones`}
          />
          <SummaryCard
            label="Pendiente de cobro"
            value={formatCurrency(summary.pending.total)}
            sub={`${summary.pending.count} pagos`}
            warn={summary.pending.count > 0}
          />
          <SummaryCard
            label="Fallidos este mes"
            value={String(summary.failedThisMonth)}
            sub="requieren seguimiento"
            warn={summary.failedThisMonth > 0}
          />
          <SummaryCard
            label="Comprobantes por revisar"
            value={String(summary.pendingReview)}
            sub="extraídos por IA"
            warn={summary.pendingReview > 0}
          />
        </div>
      )}

      {/* Filtros */}
      <PaymentsFilter
        currentStatus={params.status}
        currentType={params.paymentType}
        currentStart={params.startDate}
        currentEnd={params.endDate}
      />

      {/* Tabla */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <h3 className="mb-1 font-semibold">
            {hasFilters ? 'Sin resultados' : 'Sin pagos registrados'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {hasFilters
              ? 'Intenta con otros filtros.'
              : 'Los pagos en efectivo o tarjeta se registran desde aquí.'}
          </p>
          {!hasFilters && (
            <Link
              href="/payments/new"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Registrar primer pago
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Miembro
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                      Fecha
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {p.member.first_name} {p.member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.member.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrency(p.amount, p.currency)}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {PAYMENT_TYPE_LABELS[p.payment_type] ?? p.payment_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate">
                        {p.description ?? p.membership?.type.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {formatDate(p.paid_at ?? p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/payments/${p.id}`}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Página {meta.page} de {meta.totalPages} · {meta.total} pagos
              </span>
              <div className="flex gap-2">
                {meta.page > 1 && (
                  <a
                    href={`/payments?page=${meta.page - 1}`}
                    className="rounded-lg border px-3 py-1.5 hover:bg-muted transition-colors text-foreground"
                  >
                    Anterior
                  </a>
                )}
                {meta.page < meta.totalPages && (
                  <a
                    href={`/payments?page=${meta.page + 1}`}
                    className="rounded-lg border px-3 py-1.5 hover:bg-muted transition-colors text-foreground"
                  >
                    Siguiente
                  </a>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  growth,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  growth?: number | null;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p
          className={`text-2xl font-bold ${warn ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}
        >
          {value}
        </p>
        {growth !== undefined && growth !== null && (
          <span
            className={`text-xs font-medium mb-0.5 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {growth >= 0 ? '+' : ''}
            {growth}%
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function PaymentsFilter({
  currentStatus,
  currentType,
  currentStart,
  currentEnd,
}: {
  currentStatus?: string;
  currentType?: string;
  currentStart?: string;
  currentEnd?: string;
}) {
  const statuses = [
    { value: '', label: 'Todos' },
    { value: 'DRAFT', label: 'Borrador (IA)' },
    { value: 'SUCCEEDED', label: 'Exitoso' },
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'FAILED', label: 'Fallido' },
    { value: 'REFUNDED', label: 'Reembolsado' },
  ];

  const types = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CASH', label: 'Efectivo' },
    { value: 'CARD', label: 'Tarjeta' },
    { value: 'BANK_TRANSFER', label: 'Transferencia' },
    { value: 'STRIPE', label: 'Stripe' },
    { value: 'MERCADOPAGO', label: 'MercadoPago' },
  ];

  return (
    <form method="GET" className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Estado</label>
        <select
          name="status"
          defaultValue={currentStatus ?? ''}
          className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Tipo de pago</label>
        <select
          name="paymentType"
          defaultValue={currentType ?? ''}
          className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Desde</label>
        <input
          type="date"
          name="startDate"
          defaultValue={currentStart}
          className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Hasta</label>
        <input
          type="date"
          name="endDate"
          defaultValue={currentEnd}
          className="h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Filtrar
      </button>
      {(currentStatus || currentType || currentStart || currentEnd) && (
        <a
          href="/payments"
          className="flex h-9 items-center rounded-lg border px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Limpiar
        </a>
      )}
    </form>
  );
}
