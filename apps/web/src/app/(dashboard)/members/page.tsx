import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { MembersTable } from '@/components/members/members-table';
import { UserPlus } from 'lucide-react';
import type { MemberStatus } from '@gymapp/shared-types';

export const metadata: Metadata = { title: 'Miembros — GymApp' };

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone: string | null;
  status: MemberStatus;
  risk_score: number;
  loyalty_level: string;
  source: string | null;
  created_at: string;
  user: { email: string; last_login_at: string | null };
  activeMembership: {
    id: string;
    status: string;
    end_date: string;
    type: { name: string; billing_frequency: string } | null;
  } | null;
}

interface MembersResponse {
  data: MemberRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', params.page);
  qs.set('limit', '20');

  const result = await serverFetch<MembersResponse>(`/api/v1/members?${qs.toString()}`);

  const members = result?.data ?? [];
  const meta = result?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Miembros</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} {meta.total === 1 ? 'miembro registrado' : 'miembros registrados'}
          </p>
        </div>
        <Link
          href="/members/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo miembro
        </Link>
      </div>

      {/* Filtros */}
      <MembersFilter currentSearch={params.search} currentStatus={params.status} />

      {/* Tabla */}
      {members.length === 0 ? (
        <EmptyState hasFilters={!!(params.search || params.status)} />
      ) : (
        <>
          <MembersTable members={members} />
          <Pagination meta={meta} currentSearch={params.search} currentStatus={params.status} />
        </>
      )}
    </div>
  );
}

function MembersFilter({
  currentSearch,
  currentStatus,
}: {
  currentSearch?: string;
  currentStatus?: string;
}) {
  const statuses = [
    { value: '', label: 'Todos' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'TRIAL', label: 'Trial' },
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'FREEZE', label: 'Congelado' },
    { value: 'EXPIRED', label: 'Expirado' },
    { value: 'PRE_CANCEL', label: 'Pre-Cancelación' },
    { value: 'CANCELLED', label: 'Cancelado' },
  ];

  return (
    <form method="GET" className="flex flex-wrap gap-3">
      <input
        name="search"
        type="search"
        defaultValue={currentSearch}
        placeholder="Buscar por nombre, email, teléfono..."
        className="h-9 w-72 rounded-lg border bg-background px-3 text-sm placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring/30"
      />
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
      <button
        type="submit"
        className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Buscar
      </button>
      {(currentSearch || currentStatus) && (
        <a
          href="/members"
          className="flex h-9 items-center rounded-lg border px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          Limpiar
        </a>
      )}
    </form>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <UserPlus className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 font-semibold">
        {hasFilters ? 'Sin resultados' : 'Aún no hay miembros'}
      </h3>
      <p className="mb-6 text-sm text-muted-foreground max-w-sm">
        {hasFilters
          ? 'Intenta con otros filtros de búsqueda.'
          : 'Registra tu primer miembro para comenzar a gestionar el gimnasio.'}
      </p>
      {!hasFilters && (
        <Link
          href="/members/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Agregar primer miembro
        </Link>
      )}
    </div>
  );
}

function Pagination({
  meta,
  currentSearch,
  currentStatus,
}: {
  meta: { total: number; page: number; totalPages: number };
  currentSearch?: string;
  currentStatus?: string;
}) {
  if (meta.totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const qs = new URLSearchParams();
    if (currentSearch) qs.set('search', currentSearch);
    if (currentStatus) qs.set('status', currentStatus);
    qs.set('page', String(page));
    return `/members?${qs.toString()}`;
  };

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Página {meta.page} de {meta.totalPages} · {meta.total} miembros
      </span>
      <div className="flex gap-2">
        {meta.page > 1 && (
          <a
            href={buildHref(meta.page - 1)}
            className="rounded-lg border px-3 py-1.5 hover:bg-muted transition-colors text-foreground"
          >
            Anterior
          </a>
        )}
        {meta.page < meta.totalPages && (
          <a
            href={buildHref(meta.page + 1)}
            className="rounded-lg border px-3 py-1.5 hover:bg-muted transition-colors text-foreground"
          >
            Siguiente
          </a>
        )}
      </div>
    </div>
  );
}
