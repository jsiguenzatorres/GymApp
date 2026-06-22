import Link from 'next/link';
import { MemberStatusBadge } from './member-status-badge';
import { cn } from '@/lib/utils';

interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  risk_score: number;
  loyalty_level: string;
  created_at: string;
  user: { email: string; last_login_at: string | null };
  activeMembership: {
    id: string;
    status: string;
    end_date: string;
    type: { name: string; billing_frequency: string } | null;
  } | null;
}

function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-red-600 dark:text-red-400'
      : score >= 40
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400';

  return <span className={cn('text-sm font-semibold tabular-nums', color)}>{score}</span>;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
      {initials.toUpperCase()}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function MembersTable({ members }: { members: MemberRow[] }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Miembro</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                Plan activo
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                Vence
              </th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">
                Riesgo
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                Registrado
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Initials name={`${member.first_name} ${member.last_name}`} />
                    <div>
                      <p className="font-medium text-foreground">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <MemberStatusBadge status={member.status} />
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {member.activeMembership ? (
                    <span className="text-foreground">
                      {member.activeMembership.type?.name ?? '—'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sin plan</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                  {member.activeMembership ? formatDate(member.activeMembership.end_date) : '—'}
                </td>
                <td className="px-4 py-3 text-center hidden sm:table-cell">
                  <RiskBadge score={member.risk_score} />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                  {formatDate(member.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/members/${member.id}`}
                    className="rounded-md px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
