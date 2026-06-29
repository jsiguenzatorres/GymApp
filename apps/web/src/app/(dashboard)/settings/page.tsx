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

interface FounderStatus {
  gym_is_founder: boolean;
  gym_founder_plan_type: string | null;
  gym_founder_locked_price: number | null;
  gym_founder_locked_at: string | null;
  offer: {
    active: boolean;
    total_slots: number;
    claimed_slots: number;
    available_slots: number;
    starter_price: number;
    pro_price: number;
    elite_price: number;
    deadline_at: string | null;
  };
}

export default async function SettingsPage() {
  const [profile, plan, founder] = await Promise.all([
    serverFetch<GymProfile>('/api/v1/gym/profile'),
    serverFetch<PlanInfo>('/api/v1/gym/plan'),
    serverFetch<FounderStatus>('/api/v1/founder-offer/my-status'),
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

      {/* Founder offer status (J6) */}
      {founder &&
        (founder.gym_is_founder ? (
          <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-5xl">👑</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-amber-900">Eres Gym Fundador</h2>
                <p className="mt-1 text-sm text-amber-800">
                  Tu precio de <strong>${founder.gym_founder_locked_price?.toFixed(2)}/mes</strong>{' '}
                  está congelado de por vida (plan {founder.gym_founder_plan_type}).
                </p>
                {founder.gym_founder_locked_at && (
                  <p className="mt-1 text-xs text-amber-700">
                    Reclamado el{' '}
                    {new Date(founder.gym_founder_locked_at).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : founder.offer.active && founder.offer.available_slots > 0 ? (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
            <h2 className="text-lg font-bold text-violet-900">
              🎁 Oferta Plan Fundadores disponible
            </h2>
            <p className="mt-1 text-sm text-violet-800">
              Quedan <strong>{founder.offer.available_slots}</strong> de {founder.offer.total_slots}{' '}
              cupos para convertirte en gym fundador y congelar tu precio de por vida.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded bg-white p-2">
                <p className="font-semibold text-gray-500">Starter</p>
                <p className="text-lg font-bold text-violet-700">
                  ${founder.offer.starter_price}/mes
                </p>
              </div>
              <div className="rounded bg-white p-2">
                <p className="font-semibold text-gray-500">Pro</p>
                <p className="text-lg font-bold text-violet-700">${founder.offer.pro_price}/mes</p>
              </div>
              <div className="rounded bg-white p-2">
                <p className="font-semibold text-gray-500">Elite</p>
                <p className="text-lg font-bold text-violet-700">
                  ${founder.offer.elite_price}/mes
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-violet-700">
              Contacta soporte para reclamar tu plan fundador antes de que se agoten los cupos.
            </p>
          </div>
        ) : null)}

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
