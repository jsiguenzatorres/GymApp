import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/server-api';
import { MemberStatusBadge } from '@/components/members/member-status-badge';
import { MemberAvatarUploader } from '@/components/members/member-avatar-uploader';
import { MembershipActionsClient } from '@/components/members/membership-actions-client';
import { AddonsSection } from '@/components/members/addons-section';
import { WorkoutPlanSection } from '@/components/members/workout-plan-section';
import { CreditSection } from '@/components/members/credit-section';
import { HealthDataSection } from '@/components/members/health-data-section';
import { OnboardingStatusSection } from '@/components/members/onboarding-status';
import { MemberDetailTabs } from '@/components/members/member-detail-tabs';
import { revalidatePath } from 'next/cache';
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
  payment_status?: 'CURRENT' | 'PENDING' | 'OVERDUE';
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
  avatar_url: string | null;
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

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  CURRENT: {
    label: 'Al día',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  PENDING: {
    label: 'Pago pendiente',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  OVERDUE: {
    label: 'En mora',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

function StatusPills({ membership }: { membership: Membership }) {
  const membershipCfg = MEMBERSHIP_STATUS_CONFIG[membership.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[membership.payment_status ?? 'CURRENT'];
  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${membershipCfg?.color ?? 'bg-muted text-muted-foreground'}`}
        title="Estado de la membresía"
      >
        Membresía: {membershipCfg?.label ?? membership.status}
      </span>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentCfg.color}`}
        title="Estado del pago"
      >
        Pago: {paymentCfg.label}
      </span>
    </div>
  );
}

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

// ─── Credit Server Actions (J2) ────────────────────────────────────────────
async function fetchCreditAction(memberId: string) {
  'use server';
  const [balance, history] = await Promise.all([
    serverFetch<{ balance_usd: number }>(`/api/v1/admin/members/${memberId}/credit`),
    serverFetch<
      Array<{
        id: string;
        kind: 'CHARGE' | 'PAYMENT' | 'USE' | 'REFUND';
        amount_usd: string | number;
        balance_after: string | number;
        note: string | null;
        related_order_id: string | null;
        created_at: string;
      }>
    >(`/api/v1/admin/members/${memberId}/credit/history?limit=30`),
  ]);
  return { balance: balance?.balance_usd ?? 0, history: history ?? [] };
}

async function createCreditAction(memberId: string, formData: FormData) {
  'use server';
  const payload = {
    kind: formData.get('kind') as 'CHARGE' | 'PAYMENT' | 'USE' | 'REFUND',
    amount_usd: parseFloat(formData.get('amount_usd') as string),
    note: (formData.get('note') as string) || undefined,
  };
  const res = await serverFetch(`/api/v1/admin/members/${memberId}/credit`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  revalidatePath(`/members/${memberId}`);
  if (!res) return { ok: false, error: 'No se pudo registrar el movimiento' };
  return { ok: true };
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const member = await serverFetch<MemberDetail>(`/api/v1/members/${id}`);

  if (!member) notFound();

  // Crédito inicial (se refresca client-side al hacer mutación)
  const credit = await fetchCreditAction(id);

  const activeMemberships = member.memberships.filter((m) =>
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
        <MemberAvatarUploader
          memberId={id}
          initialUrl={member.avatar_url}
          initials={`${member.first_name[0]}${member.last_name[0]}`}
        />
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

        {/* Membresías activas — un miembro puede tener varias a la vez (ej.
            gimnasio + nutrición + entrenamiento personalizado) */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Membresías Activas
            </h2>
            <Link
              href={`/members/${id}/assign-membership`}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              + Agregar membresía
            </Link>
          </div>

          {activeMemberships.length > 0 ? (
            <div className="space-y-5">
              {activeMemberships.map((membership, i) => (
                <div
                  key={membership.id}
                  className={i > 0 ? 'space-y-4 pt-5 border-t' : 'space-y-4'}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{membership.type.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(membership.price_paid, membership.currency)}
                        {' · '}
                        {membership.type.billing_frequency}
                      </p>
                    </div>
                    <StatusPills membership={membership} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Inicio</p>
                      <p className="font-medium text-sm">{formatDate(membership.start_date)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Vencimiento</p>
                      <p className="font-medium text-sm">{formatDate(membership.end_date)}</p>
                    </div>
                  </div>

                  {membership.status === 'FROZEN' && membership.freeze_ends_at && (
                    <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 px-4 py-3 text-sm">
                      <p className="font-medium text-sky-700 dark:text-sky-300">
                        Membresía congelada
                      </p>
                      <p className="text-sky-600 dark:text-sky-400 text-xs mt-0.5">
                        Se descongela el {formatDate(membership.freeze_ends_at)}
                      </p>
                    </div>
                  )}

                  {/* Acciones rápidas */}
                  <MembershipActionsClient
                    memberId={id}
                    membershipId={membership.id}
                    status={membership.status}
                    startDate={membership.start_date}
                    endDate={membership.end_date}
                  />
                </div>
              ))}
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

      {/* Resto de secciones — en pestañas para no tener que hacer scroll por
          todo cuando solo se necesita consultar una cosa puntual */}
      <MemberDetailTabs
        tabs={[
          {
            id: 'historial',
            label: 'Historial de Membresías',
            content:
              member.memberships.length > 0 ? (
                <div className="rounded-lg border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                          Plan
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                          Estado
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                          Inicio
                        </th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">
                          Fin
                        </th>
                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {member.memberships.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{m.type.name}</td>
                          <td className="px-4 py-3">
                            <StatusPills membership={m} />
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
              ) : (
                <p className="text-sm text-muted-foreground px-1">Sin historial todavía.</p>
              ),
          },
          {
            id: 'onboarding',
            label: '📋 Onboarding',
            content: <OnboardingStatusSection memberId={id} />,
          },
          {
            id: 'entrenamiento',
            label: 'Plan de Entrenamiento',
            content: <WorkoutPlanSection memberId={id} />,
          },
          {
            id: 'addons',
            label: 'Add-ons',
            content: <AddonsSection memberId={id} />,
          },
          {
            id: 'credito',
            label: 'Crédito en cuenta',
            content: (
              <CreditSection
                memberId={id}
                initialBalance={credit.balance}
                initialHistory={credit.history}
                fetchAction={fetchCreditAction}
                createAction={createCreditAction}
              />
            ),
          },
          {
            id: 'salud',
            label: 'Datos de Salud',
            content: <HealthDataSection memberId={id} />,
          },
          {
            id: 'notas',
            label: 'Notas',
            content: member.notes ? (
              <div className="rounded-lg border bg-card p-5">
                <p className="text-sm text-foreground">{member.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground px-1">Sin notas.</p>
            ),
          },
        ]}
      />
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
