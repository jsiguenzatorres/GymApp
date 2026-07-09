'use client';

import { ExportExcelButton } from '@/components/export-excel-button';
import type { ExcelSheet } from '@/lib/export-excel';

interface PaymentRow {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  invoice_type: string | null;
  voucher_number: string | null;
  subtotal: number | null;
  tax_amount: number | null;
  description: string | null;
  paid_at: string | null;
  created_at: string;
  member: { first_name: string; last_name: string; user: { email: string } };
  membership: { type: { name: string } } | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador (IA)',
  PENDING: 'Pendiente',
  PROCESSING: 'Procesando',
  SUCCEEDED: 'Exitoso',
  FAILED: 'Fallido',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia',
  STRIPE: 'Stripe',
  MERCADOPAGO: 'MercadoPago',
  OTHER: 'Otro',
};

function fmtDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-SV');
}

export function PaymentsExportButton({
  payments,
  filterLabel,
}: {
  payments: PaymentRow[];
  filterLabel: string;
}) {
  const sheets: ExcelSheet[] = [
    {
      name: 'Pagos',
      columns: [
        { header: 'Miembro', key: 'miembro', format: 'text', width: 26 },
        { header: 'Email', key: 'email', format: 'text', width: 28 },
        { header: 'Monto total', key: 'monto', format: 'currency' },
        { header: 'Subtotal', key: 'subtotal', format: 'currency' },
        { header: 'IVA (13%)', key: 'iva', format: 'currency' },
        { header: 'Método', key: 'metodo', format: 'text', width: 18 },
        { header: 'Estado', key: 'estado', format: 'text', width: 16 },
        { header: 'Tipo factura', key: 'factura', format: 'text', width: 14 },
        { header: 'N° comprobante', key: 'comprobante', format: 'text', width: 18 },
        { header: 'Plan', key: 'plan', format: 'text', width: 20 },
        { header: 'Concepto', key: 'concepto', format: 'text', width: 26 },
        { header: 'Fecha de pago', key: 'fecha', format: 'text', width: 20 },
      ],
      rows: payments.map((p) => ({
        miembro: `${p.member.first_name} ${p.member.last_name}`,
        email: p.member.user.email,
        monto: p.amount,
        subtotal: p.subtotal ?? '',
        iva: p.tax_amount ?? '',
        metodo: PAYMENT_TYPE_LABELS[p.payment_type] ?? p.payment_type,
        estado: STATUS_LABELS[p.status] ?? p.status,
        factura: p.invoice_type ?? '',
        comprobante: p.voucher_number ?? '',
        plan: p.membership?.type.name ?? '',
        concepto: p.description ?? '',
        fecha: fmtDate(p.paid_at ?? p.created_at),
      })),
    },
  ];

  return (
    <ExportExcelButton
      filename={`gymapp-pagos-${filterLabel}`}
      sheets={sheets}
      label={`Exportar (${payments.length})`}
    />
  );
}
