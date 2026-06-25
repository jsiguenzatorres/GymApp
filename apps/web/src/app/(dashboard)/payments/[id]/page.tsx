import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CreditCard, User, Calendar, FileText, Tag } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { PaymentStatusBadge } from '@/components/billing/payment-status-badge';
import { RefundButton } from '@/components/billing/refund-button';

export const metadata: Metadata = { title: 'Detalle de Pago — GymApp' };

interface PaymentDetail {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  description: string | null;
  notes: string | null;
  invoice_type: string | null;
  gateway_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    user: { email: string };
  };
  membership: {
    id: string;
    start_date: string;
    end_date: string | null;
    type: { name: string; price: number };
  } | null;
  payment_method: {
    gateway: string;
    last_four: string | null;
    card_brand: string | null;
  } | null;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta (POS)',
  BANK_TRANSFER: 'Transferencia bancaria',
  STRIPE: 'Stripe',
  MERCADOPAGO: 'MercadoPago',
  OTHER: 'Otro',
};

const INVOICE_LABELS: Record<string, string> = {
  CF: 'CF — Consumidor Final',
  CCF: 'CCF — Crédito Fiscal',
  NC: 'NC — Nota de Crédito',
};

function fmtCurrency(n: number, currency = 'USD') {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm border-b border-gray-50 last:border-0">
      <span className="text-muted-foreground shrink-0 w-40">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      {children}
    </div>
  );
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await serverFetch<PaymentDetail>(`/api/v1/payments/${id}`);
  if (!payment) notFound();

  const isRefundable =
    payment.status === 'SUCCEEDED' && !['STRIPE', 'MERCADOPAGO'].includes(payment.payment_type);

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back + header */}
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pagos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {fmtCurrency(payment.amount, payment.currency)}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              ID: <span className="font-mono text-xs">{payment.id}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PaymentStatusBadge status={payment.status} />
            {isRefundable && <RefundButton paymentId={payment.id} />}
          </div>
        </div>
      </div>

      {/* Payment info */}
      <Section title="Información del pago" icon={CreditCard}>
        <InfoRow label="Monto">{fmtCurrency(payment.amount, payment.currency)}</InfoRow>
        <InfoRow label="Estado">
          <PaymentStatusBadge status={payment.status} />
        </InfoRow>
        <InfoRow label="Método">
          {PAYMENT_TYPE_LABELS[payment.payment_type] ?? payment.payment_type}
        </InfoRow>
        {payment.invoice_type && (
          <InfoRow label="Tipo de factura">
            {INVOICE_LABELS[payment.invoice_type] ?? payment.invoice_type}
          </InfoRow>
        )}
        {payment.gateway_reference && (
          <InfoRow label="Referencia gateway">
            <span className="font-mono text-xs">{payment.gateway_reference}</span>
          </InfoRow>
        )}
        {payment.payment_method && (
          <InfoRow label="Tarjeta">
            {payment.payment_method.card_brand ?? payment.payment_method.gateway}
            {payment.payment_method.last_four && ` •••• ${payment.payment_method.last_four}`}
          </InfoRow>
        )}
        {payment.description && <InfoRow label="Descripción">{payment.description}</InfoRow>}
      </Section>

      {/* Member */}
      <Section title="Miembro" icon={User}>
        <InfoRow label="Nombre">
          <Link href={`/members/${payment.member.id}`} className="text-primary hover:underline">
            {payment.member.first_name} {payment.member.last_name}
          </Link>
        </InfoRow>
        <InfoRow label="Email">{payment.member.user.email}</InfoRow>
        {payment.membership && (
          <>
            <InfoRow label="Plan">{payment.membership.type.name}</InfoRow>
            <InfoRow label="Inicio de membresía">{fmtDate(payment.membership.start_date)}</InfoRow>
            {payment.membership.end_date && (
              <InfoRow label="Vence">{fmtDate(payment.membership.end_date)}</InfoRow>
            )}
          </>
        )}
      </Section>

      {/* Dates */}
      <Section title="Fechas" icon={Calendar}>
        <InfoRow label="Fecha de pago">{fmtDate(payment.paid_at)}</InfoRow>
        <InfoRow label="Registrado">{fmtDate(payment.created_at)}</InfoRow>
        <InfoRow label="Última actualización">{fmtDate(payment.updated_at)}</InfoRow>
      </Section>

      {/* Notes */}
      {payment.notes && (
        <Section title="Notas internas" icon={FileText}>
          <p className="text-sm text-foreground whitespace-pre-wrap">{payment.notes}</p>
        </Section>
      )}

      {/* Invoice type tag */}
      {payment.invoice_type && (
        <Section title="Facturación" icon={Tag}>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
              {INVOICE_LABELS[payment.invoice_type] ?? payment.invoice_type}
            </span>
            <span className="text-xs text-muted-foreground">
              Factura DTE (integración con Ministerio de Hacienda — Fase 2)
            </span>
          </div>
        </Section>
      )}
    </div>
  );
}
