import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { MemberStatusBadge } from '@/components/members/member-status-badge';
import { MembershipActionsClient } from '@/components/members/membership-actions-client';
import { ArrowLeft, Phone, Mail, Calendar, MapPin, Shield } from 'lucide-react';

export const metadata: Metadata = { title: 'Perfil de Miembro — GymApp' };

interface MembershipType {
  name: string;
  billing_frequency: string;
  duration_days: number;
}

interface Membership {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  price_paid: string;
  currency: string;
  freeze_count: number;
  frozen_at: string | null;
  freeze_ends_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  type: MembershipType;
}

interface MemberDetail {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  birthdate: string | null;
  gender: string | null;
  status: string;
  risk_score: number;
  loyalty_level: string;
  source: string | null;
  notes: string | null;
  created_at: string;
  user: {
    email: string;
    is_active: boolean;
    last_login_at: string | null;
    email_verified: boolean;
  };
  memberships: Membership[];
}

const MEMBERSHIP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TRIAL: {
    label: 'Trial',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  ACTIVE: {
    label: 'Activo',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  FROZEN: {
    label: 'Congelado',
    color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

const LOYALTY_LABELS: Record<string, string> = {
  bronze: '🥉 Bronce',
  silver: '🥈 Plata',
  gold: '🥇 Oro',
  platinum: '💎 Platino',
  elite: '👑 Élite',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(Number(amount));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const member = await serverFetch<MemberDetail>(`/api/v1/members/${id}`);

  if (!member) notFound();

  const activeMembership = member.memberships.find((m) =>
    ['ACTIVE', 'TRIAL', 'FROZEN'].includes(m.status),
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a miembros
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
          {member.first_name[0]}
          {member.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {member.first_name} {member.last_name}
            </h1>
            <MemberStatusBadge status={member.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {LOYALTY_LABELS[member.loyalty_level] ?? member.loyalty_level}
            {' · '}
            Riesgo:{' '}
            <span
              className={
                member.risk_score >= 70
                  ? 'text-red-500 font-medium'
                  : member.risk_score >= 40
                    ? 'text-amber-500 font-medium'
                    : 'text-emerald-500 font-medium'
              }
            >
              {member.risk_score}/100
            </span>
          </p>
        </div>
        <Link
          href={`/members/${id}/edit`}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          Editar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info personal */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Información
          </h2>
          <div className="space-y-3">
            <InfoRow icon={Mail} label={member.user.email} />
            {member.phone && <InfoRow icon={Phone} label={member.phone} />}
            {member.birthdate && <InfoRow icon={Calendar} label={formatDate(member.birthdate)} />}
            {member.source && <InfoRow icon={MapPin} label={`Fuente: ${member.source}`} />}
            <InfoRow
              icon={Shield}
              label={member.user.email_verified ? 'Email verificado' : 'Email sin verificar'}
              muted={!member.user.email_verified}
            />
          </div>
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Registrado {formatDate(member.created_at)}
          </div>
        </div>

        {/* Membresía activa */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Membresía Activa
            </h2>
            <Link
              href={`/members/${id}/assign-membership`}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              {activeMembership ? 'Cambiar plan' : '+ Asignar plan'}
            </Link>
          </div>

          {activeMembership ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{activeMembership.type.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(activeMembership.price_paid, activeMembership.currency)}
                    {' · '}
                    {activeMembership.type.billing_frequency}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MEMBERSHIP_STATUS_CONFIG[activeMembership.status]?.color ?? 'bg-muted text-muted-foreground'}`}
                >
                  {MEMBERSHIP_STATUS_CONFIG[activeMembership.status]?.label ??
                    activeMembership.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Inicio</p>
                  <p className="font-medium text-sm">{formatDate(activeMembership.start_date)}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Vencimiento</p>
                  <p className="font-medium text-sm">{formatDate(activeMembership.end_date)}</p>
                </div>
              </div>

              {activeMembership.status === 'FROZEN' && activeMembership.freeze_ends_at && (
                <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 px-4 py-3 text-sm">
                  <p className="font-medium text-sky-700 dark:text-sky-300">Membresía congelada</p>
                  <p className="text-sky-600 dark:text-sky-400 text-xs mt-0.5">
                    Se descongela el {formatDate(activeMembership.freeze_ends_at)}
                  </p>
                </div>
              )}

              {/* Acciones rápidas */}
              <MembershipActionsClient
                memberId={id}
                membershipId={activeMembership.id}
                status={activeMembership.status}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground text-sm mb-3">No tiene un plan activo</p>
              <Link
                href={`/members/${id}/assign-membership`}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Asignar membresía
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Historial de membresías */}
      {member.memberships.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold">Historial de Membresías</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Inicio
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                  Fin
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {member.memberships.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{m.type.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${MEMBERSHIP_STATUS_CONFIG[m.status]?.color ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {MEMBERSHIP_STATUS_CONFIG[m.status]?.label ?? m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(m.start_date)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(m.end_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(m.price_paid, m.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {member.notes && (
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Notas
          </h2>
          <p className="text-sm text-foreground">{member.notes}</p>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  muted = false,
}: {
  icon: React.ElementType;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className={`text-sm ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
        {label}
      </span>
    </div>
  );
}
