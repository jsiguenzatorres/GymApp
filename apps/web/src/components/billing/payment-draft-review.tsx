'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraftPayment {
  id: string;
  amount: number;
  currency: string;
  payment_type: string;
  invoice_type: string | null;
  voucher_number: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  paid_at: string | null;
  description: string | null;
  notes: string | null;
  voucher_url: string | null;
  voucher_ai_note: string | null;
}

const PAYMENT_TYPES = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta (terminal POS)' },
  { value: 'BANK_TRANSFER', label: 'Transferencia bancaria' },
  { value: 'OTHER', label: 'Otro' },
];

const INVOICE_TYPES = [
  { value: '', label: 'Sin factura' },
  { value: 'CF', label: 'CF — Consumidor Final' },
  { value: 'CCF', label: 'CCF — Crédito Fiscal' },
];

const inputClass = cn(
  'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
  'outline-none focus:border-primary focus:ring-2 focus:ring-ring/30 disabled:opacity-50',
);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function PaymentDraftReview({ payment }: { payment: DraftPayment }) {
  const router = useRouter();
  const isVoucherPdf = payment.voucher_url?.toLowerCase().endsWith('.pdf');

  const [form, setForm] = useState({
    amount: payment.amount ? payment.amount.toString() : '',
    subtotal: payment.subtotal !== null ? payment.subtotal.toString() : '',
    taxAmount: payment.tax_amount !== null ? payment.tax_amount.toString() : '',
    voucherNumber: payment.voucher_number ?? '',
    paymentType: payment.payment_type,
    invoiceType: payment.invoice_type ?? '',
    paidAt: payment.paid_at ? payment.paid_at.slice(0, 16) : new Date().toISOString().slice(0, 16),
    description: payment.description ?? '',
    notes: payment.notes ?? '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubtotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const subtotal = e.target.value;
    setForm((prev) => {
      const sub = Number(subtotal);
      if (subtotal === '' || Number.isNaN(sub)) return { ...prev, subtotal };
      const tax = round2(sub * 0.13);
      return { ...prev, subtotal, taxAmount: tax.toFixed(2), amount: round2(sub + tax).toFixed(2) };
    });
    setError('');
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/proxy/payments/${payment.id}/confirm-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          subtotal: form.subtotal ? Number(form.subtotal) : undefined,
          taxAmount: form.taxAmount ? Number(form.taxAmount) : undefined,
          voucherNumber: form.voucherNumber || undefined,
          paymentType: form.paymentType,
          invoiceType: form.invoiceType || undefined,
          paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : undefined,
          description: form.description || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al confirmar el pago');
        return;
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('¿Descartar este comprobante? El pago quedará marcado como cancelado.')) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/proxy/payments/${payment.id}/reject-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Datos incorrectos o comprobante ilegible' }),
      });
      if (!res.ok) {
        setError('Error al descartar el comprobante');
        return;
      }
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-5 space-y-4">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Borrador — extraído automáticamente del comprobante
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Revisa y corrige los datos antes de confirmar. Este pago NO cuenta como cobro real hasta
            que lo confirmes.
          </p>
          {payment.voucher_ai_note && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 italic">
              &quot;{payment.voucher_ai_note}&quot;
            </p>
          )}
        </div>
      </div>

      {payment.voucher_url && (
        <a
          href={payment.voucher_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline"
        >
          <FileText className="h-3.5 w-3.5" />
          {isVoucherPdf ? 'Ver comprobante (PDF)' : 'Ver comprobante (imagen)'}
        </a>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleConfirm} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Número de comprobante</label>
          <input
            name="voucherNumber"
            value={form.voucherNumber}
            onChange={handleChange}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Subtotal</label>
            <input
              name="subtotal"
              type="number"
              min="0"
              step="0.01"
              value={form.subtotal}
              onChange={handleSubtotalChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">IVA (13%)</label>
            <input
              name="taxAmount"
              type="number"
              value={form.taxAmount}
              readOnly
              className={cn(inputClass, 'bg-muted/50')}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Valor total *</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
            <select
              name="paymentType"
              value={form.paymentType}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            >
              {PAYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tipo de factura</label>
            <select
              name="invoiceType"
              value={form.invoiceType}
              onChange={handleChange}
              className={inputClass}
              disabled={isLoading}
            >
              {INVOICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Fecha y hora del pago</label>
          <input
            name="paidAt"
            type="datetime-local"
            value={form.paidAt}
            onChange={handleChange}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descripción</label>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            className={inputClass}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleReject}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Descartar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isLoading ? 'Confirmando...' : 'Confirmar pago'}
          </button>
        </div>
      </form>
    </div>
  );
}
