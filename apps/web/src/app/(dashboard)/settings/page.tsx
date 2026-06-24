import { serverFetch } from '@/lib/server-api';
import { SettingsTabs } from '@/components/settings/settings-tabs';

interface GymProfile {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  saas_plan: string;
  timezone: string;
  country: string;
  currency: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  tax_id: string | null;
  legal_name: string | null;
  social_links: Record<string, string>;
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>;
}

interface PlanInfo {
  plan: string;
  maxMembers: number;
  activeMembers: number;
  usage: number;
  modules: string[];
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  ELITE: 'Élite',
  ENTERPRISE: 'Enterprise',
};

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-gray-100 text-gray-700',
  PRO: 'bg-blue-100 text-blue-700',
  ELITE: 'bg-violet-100 text-violet-700',
  ENTERPRISE: 'bg-amber-100 text-amber-800',
};

export default async function SettingsPage() {
  const [profile, plan] = await Promise.all([
    serverFetch<GymProfile>('/api/v1/gym/profile'),
    serverFetch<PlanInfo>('/api/v1/gym/plan'),
  ]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Gym</h1>
          <p className="text-sm text-gray-500">Perfil, horarios, redes sociales y datos fiscales</p>
        </div>
        {plan && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${PLAN_COLORS[plan.plan] ?? 'bg-gray-100 text-gray-700'}`}
          >
            Plan {PLAN_LABELS[plan.plan] ?? plan.plan}
          </span>
        )}
      </div>

      {/* Plan usage bar */}
      {plan && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Miembros activos</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {plan.activeMembers} de {plan.maxMembers === 9999 ? 'ilimitados' : plan.maxMembers}
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{plan.usage}%</p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                plan.usage >= 90
                  ? 'bg-red-500'
                  : plan.usage >= 70
                    ? 'bg-amber-400'
                    : 'bg-violet-500'
              }`}
              style={{ width: `${Math.min(plan.usage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs client component */}
      <SettingsTabs profile={profile} />
    </div>
  );
}
