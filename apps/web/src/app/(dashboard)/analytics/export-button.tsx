'use client';

import { ExportExcelButton } from '@/components/export-excel-button';
import type { ExcelSheet } from '@/lib/export-excel';

interface FinanceBreakdown {
  period: { start: string; end: string };
  total_revenue: number;
  total_prev_revenue: number;
  growth_pct: number | null;
  revenue: {
    memberships: number;
    nutrition_plans: number;
    other_addons: number;
    marketplace: number;
    other: number;
  };
  marketplace: {
    orders_count: number;
    revenue: number;
    by_category: { name: string; revenue: number }[];
  };
  top_products: { id: string; name: string; revenue: number; quantity: number }[];
  payment_methods: { type: string; amount: number }[];
  debt: {
    total: number;
    memberships_pending: number;
    memberships_pending_count: number;
    other_pending: number;
    other_pending_count: number;
    store_credit: number;
    store_credit_debtor_count: number;
  };
  insights: {
    arpu: number;
    active_members: number;
    revenue_at_risk: number;
    at_risk_member_count: number;
  };
}

interface RevenueTrendEntry {
  month: string;
  revenue: number;
  transactions: number;
  newMembers: number;
}

interface MembershipEntry {
  name: string;
  count: number;
  price: number;
}

interface MemberStatusEntry {
  status: string;
  count: number;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  BANK_TRANSFER: 'Transferencia',
  STRIPE: 'Stripe',
  MERCADOPAGO: 'MercadoPago',
  OTHER: 'Otro',
};

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  TRIAL: 'Trial',
  FREEZE: 'Congelado',
  EXPIRED: 'Expirado',
  PRE_CANCEL: 'Pre-cancelar',
  CANCELLED: 'Cancelado',
  LEAD: 'Lead',
};

export function AnalyticsExportButton({
  finance,
  revenueTrend,
  membershipBreakdown,
  memberStatusDistribution,
}: {
  finance: FinanceBreakdown | null;
  revenueTrend: RevenueTrendEntry[];
  membershipBreakdown: MembershipEntry[];
  memberStatusDistribution: MemberStatusEntry[];
}) {
  if (!finance) return null;

  const sheets: ExcelSheet[] = [
    {
      name: 'Resumen',
      columns: [
        { header: 'Métrica', key: 'metrica', format: 'text', width: 32 },
        { header: 'Valor', key: 'valor', format: 'text', width: 28 },
      ],
      rows: [
        { metrica: 'Período', valor: `${finance.period.start} a ${finance.period.end}` },
        { metrica: 'Ingresos del período', valor: fmtMoney(finance.total_revenue) },
        { metrica: 'Ingresos período anterior', valor: fmtMoney(finance.total_prev_revenue) },
        {
          metrica: 'Crecimiento %',
          valor: finance.growth_pct !== null ? `${finance.growth_pct}%` : 'N/A',
        },
        { metrica: 'ARPU', valor: fmtMoney(finance.insights.arpu) },
        { metrica: 'Miembros activos considerados', valor: finance.insights.active_members },
        { metrica: 'Ingreso mensual en riesgo', valor: fmtMoney(finance.insights.revenue_at_risk) },
        { metrica: 'Miembros en riesgo alto', valor: finance.insights.at_risk_member_count },
        { metrica: 'Deuda total', valor: fmtMoney(finance.debt.total) },
      ],
    },
    {
      name: 'Ingresos por categoria',
      columns: [
        { header: 'Categoría', key: 'categoria', format: 'text', width: 26 },
        { header: 'Monto', key: 'monto', format: 'currency' },
      ],
      rows: [
        { categoria: 'Membresías', monto: finance.revenue.memberships },
        { categoria: 'Planes nutricionales', monto: finance.revenue.nutrition_plans },
        { categoria: 'Otros add-ons', monto: finance.revenue.other_addons },
        { categoria: 'Marketplace', monto: finance.revenue.marketplace },
        { categoria: 'Otros pagos', monto: finance.revenue.other },
      ],
    },
    {
      name: 'Deuda por categoria',
      columns: [
        { header: 'Categoría', key: 'categoria', format: 'text', width: 26 },
        { header: 'Monto', key: 'monto', format: 'currency' },
        { header: 'Pagos', key: 'pagos', format: 'integer' },
      ],
      rows: [
        {
          categoria: 'Membresías pendientes',
          monto: finance.debt.memberships_pending,
          pagos: finance.debt.memberships_pending_count,
        },
        {
          categoria: 'Otros pagos pendientes',
          monto: finance.debt.other_pending,
          pagos: finance.debt.other_pending_count,
        },
        {
          categoria: 'Crédito de tienda',
          monto: finance.debt.store_credit,
          pagos: finance.debt.store_credit_debtor_count,
        },
      ],
    },
    {
      name: 'Top productos',
      columns: [
        { header: 'Producto', key: 'producto', format: 'text', width: 32 },
        { header: 'Cantidad', key: 'cantidad', format: 'integer' },
        { header: 'Ingreso', key: 'ingreso', format: 'currency' },
      ],
      rows: finance.top_products.map((p) => ({
        producto: p.name,
        cantidad: p.quantity,
        ingreso: p.revenue,
      })),
    },
    {
      name: 'Metodos de pago',
      columns: [
        { header: 'Método', key: 'metodo', format: 'text', width: 22 },
        { header: 'Monto', key: 'monto', format: 'currency' },
      ],
      rows: finance.payment_methods.map((pm) => ({
        metodo: PAYMENT_METHOD_LABELS[pm.type] ?? pm.type,
        monto: pm.amount,
      })),
    },
    {
      name: 'Marketplace por categoria',
      columns: [
        { header: 'Categoría', key: 'categoria', format: 'text', width: 26 },
        { header: 'Ingreso', key: 'ingreso', format: 'currency' },
      ],
      rows: finance.marketplace.by_category.map((c) => ({
        categoria: c.name,
        ingreso: c.revenue,
      })),
    },
    {
      name: 'Tendencia mensual',
      columns: [
        { header: 'Mes', key: 'mes', format: 'text', width: 14 },
        { header: 'Ingresos', key: 'ingresos', format: 'currency' },
        { header: 'Transacciones', key: 'transacciones', format: 'integer' },
        { header: 'Nuevos miembros', key: 'nuevos', format: 'integer' },
      ],
      rows: revenueTrend.map((r) => ({
        mes: r.month,
        ingresos: r.revenue,
        transacciones: r.transactions,
        nuevos: r.newMembers,
      })),
    },
    {
      name: 'Membresias por plan',
      columns: [
        { header: 'Plan', key: 'plan', format: 'text', width: 24 },
        { header: 'Miembros', key: 'miembros', format: 'integer' },
        { header: 'Precio', key: 'precio', format: 'currency' },
      ],
      rows: membershipBreakdown.map((m) => ({
        plan: m.name,
        miembros: m.count,
        precio: m.price,
      })),
    },
    {
      name: 'Miembros por estado',
      columns: [
        { header: 'Estado', key: 'estado', format: 'text', width: 20 },
        { header: 'Cantidad', key: 'cantidad', format: 'integer' },
      ],
      rows: memberStatusDistribution.map((s) => ({
        estado: STATUS_LABELS[s.status] ?? s.status,
        cantidad: s.count,
      })),
    },
  ];

  return (
    <ExportExcelButton
      filename={`gymapp-analytics-${finance.period.start}_a_${finance.period.end}`}
      sheets={sheets}
      label="Descargar reporte Excel"
    />
  );
}
