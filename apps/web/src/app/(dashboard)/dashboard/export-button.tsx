'use client';

import { ExportExcelButton } from '@/components/export-excel-button';
import type { ExcelSheet } from '@/lib/export-excel';

interface AtRiskMember {
  id: string;
  first_name: string;
  last_name: string;
  risk_score: number;
  status: string;
  user?: { email?: string | null } | null;
}

interface PendingPtRequest {
  id: string;
  scheduled_at: string;
  member: { first_name: string; last_name: string };
  staff: { first_name: string; last_name: string } | null;
}

interface ExpiringMembership {
  id: string;
  end_date: string;
  member: { first_name: string; last_name: string };
  type: { name: string };
}

interface Complaint {
  id: string;
  created_at: string;
  member: { first_name: string; last_name: string } | null;
  notes: string | null;
}

interface NewLead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  assignee: { first_name: string; last_name: string } | null;
}

interface MarketplaceOrderRow {
  id: string;
  status: string;
  total: string | number;
  created_at: string;
  member: { first_name: string; last_name: string } | null;
  items: { product: { name: string } | null; quantity: number }[];
}

interface AdminSession {
  id: string;
  scheduled_at: string;
  class_type: { name: string };
  trainer: { first_name: string; last_name: string } | null;
  enrolled_count: number;
  capacity: number;
}

interface PointsTransaction {
  id: string;
  type: string;
  created_at: string;
  member: { first_name: string; last_name: string };
}

const GAMIFICATION_LABELS: Record<string, string> = {
  PR_ACHIEVED: 'Nuevo PR',
  BADGE_UNLOCKED: 'Insignia desbloqueada',
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-SV');
}

export function DashboardExportButton({
  atRiskMembers,
  pendingPt,
  expiringMemberships,
  complaints,
  newLeads,
  pendingOrders,
  todaySessions,
  recentWins,
}: {
  atRiskMembers: AtRiskMember[];
  pendingPt: PendingPtRequest[];
  expiringMemberships: ExpiringMembership[];
  complaints: Complaint[];
  newLeads: NewLead[];
  pendingOrders: MarketplaceOrderRow[];
  todaySessions: AdminSession[];
  recentWins: PointsTransaction[];
}) {
  const sheets: ExcelSheet[] = [
    {
      name: 'Miembros en riesgo de fuga',
      rows: atRiskMembers.map((m) => ({
        Nombre: `${m.first_name} ${m.last_name}`,
        'Score de riesgo': m.risk_score,
        Estado: m.status,
        Email: m.user?.email ?? '',
      })),
    },
    {
      name: 'Sesiones PT pendientes',
      rows: pendingPt.map((p) => ({
        Miembro: `${p.member.first_name} ${p.member.last_name}`,
        Trainer: p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Sin asignar',
        Fecha: fmtDateTime(p.scheduled_at),
      })),
    },
    {
      name: 'Membresias por vencer',
      rows: expiringMemberships.map((e) => ({
        Miembro: `${e.member.first_name} ${e.member.last_name}`,
        Plan: e.type.name,
        'Vence el': new Date(e.end_date).toLocaleDateString('es-SV'),
      })),
    },
    {
      name: 'Quejas abiertas',
      rows: complaints.map((c) => ({
        Miembro: c.member ? `${c.member.first_name} ${c.member.last_name}` : 'Anónimo',
        Detalle: c.notes ?? '',
        Fecha: fmtDateTime(c.created_at),
      })),
    },
    {
      name: 'Leads nuevos',
      rows: newLeads.map((l) => ({
        Nombre: `${l.first_name} ${l.last_name}`,
        Teléfono: l.phone ?? '',
        Email: l.email ?? '',
        Asignado: l.assignee ? `${l.assignee.first_name} ${l.assignee.last_name}` : 'Sin asignar',
        Fecha: fmtDateTime(l.created_at),
      })),
    },
    {
      name: 'Ordenes marketplace pendientes',
      rows: pendingOrders.map((o) => ({
        Miembro: o.member ? `${o.member.first_name} ${o.member.last_name}` : 'N/A',
        Estado: o.status,
        Total: Number(o.total),
        Items: o.items.reduce((sum, i) => sum + i.quantity, 0),
        Fecha: fmtDateTime(o.created_at),
      })),
    },
    {
      name: 'Clases de hoy',
      rows: todaySessions.map((s) => ({
        Clase: s.class_type.name,
        Trainer: s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}` : 'Sin asignar',
        Hora: fmtDateTime(s.scheduled_at),
        Inscritos: `${s.enrolled_count}/${s.capacity}`,
      })),
    },
    {
      name: 'Actividad reciente',
      rows: recentWins.map((t) => ({
        Miembro: `${t.member.first_name} ${t.member.last_name}`,
        Logro: GAMIFICATION_LABELS[t.type] ?? t.type,
        Fecha: fmtDateTime(t.created_at),
      })),
    },
  ];

  return (
    <ExportExcelButton
      filename={`gymapp-dashboard-${new Date().toISOString().slice(0, 10)}`}
      sheets={sheets}
      label="Descargar reporte Excel"
    />
  );
}
