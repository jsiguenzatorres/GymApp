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
      rows: [
        { Métrica: 'Período', Valor: `${finance.period.start} a ${finance.period.end}` },
        { Métrica: 'Ingresos del período', Valor: finance.total_revenue },
        { Métrica: 'Ingresos período anterior', Valor: finance.total_prev_revenue },
        { Métrica: 'Crecimiento %', Valor: finance.growth_pct ?? 'N/A' },
        { Métrica: 'ARPU', Valor: finance.insights.arpu },
        { Métrica: 'Miembros activos considerados', Valor: finance.insights.active_members },
        { Métrica: 'Ingreso mensual en riesgo', Valor: finance.insights.revenue_at_risk },
        { Métrica: 'Miembros en riesgo alto', Valor: finance.insights.at_risk_member_count },
        { Métrica: 'Deuda total', Valor: finance.debt.total },
      ],
    },
    {
      name: 'Ingresos por categoria',
      rows: [
        { Categoría: 'Membresías', Monto: finance.revenue.memberships },
        { Categoría: 'Planes nutricionales', Monto: finance.revenue.nutrition_plans },
        { Categoría: 'Otros add-ons', Monto: finance.revenue.other_addons },
        { Categoría: 'Marketplace', Monto: finance.revenue.marketplace },
        { Categoría: 'Otros pagos', Monto: finance.revenue.other },
      ],
    },
    {
      name: 'Deuda por categoria',
      rows: [
        {
          Categoría: 'Membresías pendientes',
          Monto: finance.debt.memberships_pending,
          Pagos: finance.debt.memberships_pending_count,
        },
        {
          Categoría: 'Otros pagos pendientes',
          Monto: finance.debt.other_pending,
          Pagos: finance.debt.other_pending_count,
        },
        {
          Categoría: 'Crédito de tienda',
          Monto: finance.debt.store_credit,
          Pagos: finance.debt.store_credit_debtor_count,
        },
      ],
    },
    {
      name: 'Top productos',
      rows: finance.top_products.map((p) => ({
        Producto: p.name,
        Cantidad: p.quantity,
        Ingreso: p.revenue,
      })),
    },
    {
      name: 'Metodos de pago',
      rows: finance.payment_methods.map((pm) => ({
        Método: PAYMENT_METHOD_LABELS[pm.type] ?? pm.type,
        Monto: pm.amount,
      })),
    },
    {
      name: 'Marketplace por categoria',
      rows: finance.marketplace.by_category.map((c) => ({
        Categoría: c.name,
        Ingreso: c.revenue,
      })),
    },
    {
      name: 'Tendencia mensual',
      rows: revenueTrend.map((r) => ({
        Mes: r.month,
        Ingresos: r.revenue,
        Transacciones: r.transactions,
        'Nuevos miembros': r.newMembers,
      })),
    },
    {
      name: 'Membresias por plan',
      rows: membershipBreakdown.map((m) => ({
        Plan: m.name,
        Miembros: m.count,
        Precio: m.price,
      })),
    },
    {
      name: 'Miembros por estado',
      rows: memberStatusDistribution.map((s) => ({
        Estado: STATUS_LABELS[s.status] ?? s.status,
        Cantidad: s.count,
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
