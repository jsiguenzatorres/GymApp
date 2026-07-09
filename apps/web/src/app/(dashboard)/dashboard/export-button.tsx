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
      columns: [
        { header: 'Nombre', key: 'nombre', format: 'text', width: 26 },
        { header: 'Score de riesgo', key: 'score', format: 'integer' },
        { header: 'Estado', key: 'estado', format: 'text', width: 16 },
        { header: 'Email', key: 'email', format: 'text', width: 28 },
      ],
      rows: atRiskMembers.map((m) => ({
        nombre: `${m.first_name} ${m.last_name}`,
        score: m.risk_score,
        estado: m.status,
        email: m.user?.email ?? '',
      })),
    },
    {
      name: 'Sesiones PT pendientes',
      columns: [
        { header: 'Miembro', key: 'miembro', format: 'text', width: 26 },
        { header: 'Trainer', key: 'trainer', format: 'text', width: 22 },
        { header: 'Fecha', key: 'fecha', format: 'text', width: 20 },
      ],
      rows: pendingPt.map((p) => ({
        miembro: `${p.member.first_name} ${p.member.last_name}`,
        trainer: p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Sin asignar',
        fecha: fmtDateTime(p.scheduled_at),
      })),
    },
    {
      name: 'Membresias por vencer',
      columns: [
        { header: 'Miembro', key: 'miembro', format: 'text', width: 26 },
        { header: 'Plan', key: 'plan', format: 'text', width: 20 },
        { header: 'Vence el', key: 'vence', format: 'text', width: 16 },
      ],
      rows: expiringMemberships.map((e) => ({
        miembro: `${e.member.first_name} ${e.member.last_name}`,
        plan: e.type.name,
        vence: new Date(e.end_date).toLocaleDateString('es-SV'),
      })),
    },
    {
      name: 'Quejas abiertas',
      columns: [
        { header: 'Miembro', key: 'miembro', format: 'text', width: 26 },
        { header: 'Detalle', key: 'detalle', format: 'text', width: 44 },
        { header: 'Fecha', key: 'fecha', format: 'text', width: 20 },
      ],
      rows: complaints.map((c) => ({
        miembro: c.member ? `${c.member.first_name} ${c.member.last_name}` : 'Anónimo',
        detalle: c.notes ?? '',
        fecha: fmtDateTime(c.created_at),
      })),
    },
    {
      name: 'Leads nuevos',
      columns: [
        { header: 'Nombre', key: 'nombre', format: 'text', width: 26 },
        { header: 'Teléfono', key: 'telefono', format: 'text', width: 16 },
        { header: 'Email', key: 'email', format: 'text', width: 28 },
        { header: 'Asignado', key: 'asignado', format: 'text', width: 22 },
        { header: 'Fecha', key: 'fecha', format: 'text', width: 20 },
      ],
      rows: newLeads.map((l) => ({
        nombre: `${l.first_name} ${l.last_name}`,
        telefono: l.phone ?? '',
        email: l.email ?? '',
        asignado: l.assignee ? `${l.assignee.first_name} ${l.assignee.last_name}` : 'Sin asignar',
        fecha: fmtDateTime(l.created_at),
      })),
    },
    {
      name: 'Ordenes marketplace pendientes',
      columns: [
        { header: 'Miembro', key: 'miembro', format: 'text', width: 26 },
        { header: 'Estado', key: 'estado', format: 'text', width: 16 },
        { header: 'Total', key: 'total', format: 'currency' },
        { header: 'Items', key: 'items', format: 'integer' },
        { header: 'Fecha', key: 'fecha', format: 'text', width: 20 },
      ],
      rows: pendingOrders.map((o) => ({
        miembro: o.member ? `${o.member.first_name} ${o.member.last_name}` : 'N/A',
        estado: o.status,
        total: Number(o.total),
        items: o.items.reduce((sum, i) => sum + i.quantity, 0),
        fecha: fmtDateTime(o.created_at),
      })),
    },
    {
      name: 'Clases de hoy',
      columns: [
        { header: 'Clase', key: 'clase', format: 'text', width: 24 },
        { header: 'Trainer', key: 'trainer', format: 'text', width: 22 },
        { header: 'Hora', key: 'hora', format: 'text', width: 20 },
        { header: 'Inscritos', key: 'inscritos', format: 'text', width: 14 },
      ],
      rows: todaySessions.map((s) => ({
        clase: s.class_type.name,
        trainer: s.trainer ? `${s.trainer.first_name} ${s.trainer.last_name}` : 'Sin asignar',
        hora: fmtDateTime(s.scheduled_at),
        inscritos: `${s.enrolled_count}/${s.capacity}`,
      })),
    },
    {
      name: 'Actividad reciente',
      columns: [
        { header: 'Miembro', key: 'miembro', format: 'text', width: 26 },
        { header: 'Logro', key: 'logro', format: 'text', width: 24 },
        { header: 'Fecha', key: 'fecha', format: 'text', width: 20 },
      ],
      rows: recentWins.map((t) => ({
        miembro: `${t.member.first_name} ${t.member.last_name}`,
        logro: GAMIFICATION_LABELS[t.type] ?? t.type,
        fecha: fmtDateTime(t.created_at),
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
