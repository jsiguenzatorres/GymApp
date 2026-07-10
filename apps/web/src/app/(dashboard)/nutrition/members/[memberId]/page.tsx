import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import {
  ArrowLeft,
  AlertTriangle,
  FlaskConical,
  Salad,
  Plus,
  Activity,
  TrendingUp,
} from 'lucide-react';

interface MemberOverview {
  member: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    birthdate: string | null;
    gender: string | null;
    status: string;
  };
  profile: {
    dieta_base?: string;
    alergias?: string[];
    intolerancias?: string[];
    condiciones_medicas?: string[];
    antecedente_tca_declarado?: boolean;
    tca_clinical_review_completed?: boolean;
  } | null;
  active_plan: {
    id: string;
    name: string;
    goal: string;
    kcal_target: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  } | null;
  plans_history: Array<{ id: string; name: string; goal: string; created_at: string }>;
  adherence: {
    kcal_target: number;
    avg_kcal_30d: number;
    adherence_pct: number | null;
    days_logged_30d: number;
    days_in_range: number;
    logging_consistency_pct: number;
  } | null;
  recent_entries: Array<{
    id: string;
    date: string;
    meal_type: string;
    quantity_g: number;
    kcal: number;
    food_item: { name: string };
  }>;
  risk_alerts: Array<{
    id: string;
    pattern_detected: string;
    reviewed: boolean;
    created_at: string;
  }>;
  lab_results: Array<{
    id: string;
    lab_date: string | null;
    reviewed_by_nutritionist: boolean;
    document_url: string;
  }>;
}

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  PERFORMANCE: 'Rendimiento',
};

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  LUNCH: 'Almuerzo',
  DINNER: 'Cena',
  SNACK: 'Snack',
};

const RISK_PATTERN_LABELS: Record<string, string> = {
  restriccion_extrema: 'Restricción calórica extrema (< 1,200 kcal/día)',
  obsesion_registro: 'Registro obsesivo (muchos registros al día)',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-SV', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default async function MemberNutritionOverviewPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await params;
  const overview = await serverFetch<MemberOverview>(
    `/api/v1/nutrition/members/${memberId}/overview`,
  );

  if (!overview) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
        <p className="text-sm font-medium text-gray-500">
          No se pudo cargar la ficha nutricional de este miembro.
        </p>
        <Link
          href="/crm/appointments"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a citas
        </Link>
      </div>
    );
  }

  const { member, profile, active_plan, adherence, recent_entries, risk_alerts, lab_results } =
    overview;
  const pendingAlerts = risk_alerts.filter((a) => !a.reviewed);

  return (
    <div className="space-y-6">
      <Link
        href="/crm/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a citas
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {member.first_name} {member.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Ficha nutricional — datos para diagnóstico</p>
        </div>
        {active_plan ? (
          <Link
            href={`/nutrition/plans/${active_plan.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Salad className="h-4 w-4" /> Ver plan completo
          </Link>
        ) : (
          <Link
            href={`/nutrition/plans/new?memberId=${member.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Crear plan
          </Link>
        )}
      </div>

      {/* Alertas de riesgo alimentario */}
      {pendingAlerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm font-semibold text-red-800">
              {pendingAlerts.length} alerta{pendingAlerts.length > 1 ? 's' : ''} de seguimiento
              pendiente{pendingAlerts.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-1.5">
            {pendingAlerts.map((a) => (
              <div key={a.id} className="rounded-lg bg-white/60 px-3 py-2 text-xs text-red-900">
                {RISK_PATTERN_LABELS[a.pattern_detected] ?? a.pattern_detected} —{' '}
                {fmtDate(a.created_at)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TCA declarado */}
      {profile?.antecedente_tca_declarado && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ Antecedente de trastorno de conducta alimentaria declarado
          </p>
          <p className="text-xs text-amber-700 mt-1">
            {profile.tca_clinical_review_completed
              ? 'Revisión clínica ya completada.'
              : 'Pendiente de revisión clínica presencial — no se pueden crear planes de pérdida de peso hasta completarla.'}
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Adherencia */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-gray-900">Adherencia (últimos 30 días)</p>
          </div>
          {!active_plan || !adherence ? (
            <p className="text-sm text-gray-400">
              Sin plan activo — no hay objetivo con qué comparar.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-500">Promedio vs. objetivo</span>
                <span className="text-lg font-bold text-gray-900">
                  {adherence.avg_kcal_30d} / {adherence.kcal_target} kcal
                </span>
              </div>
              {adherence.adherence_pct !== null && (
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className={`h-2 rounded-full ${
                      adherence.adherence_pct >= 85 && adherence.adherence_pct <= 115
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, adherence.adherence_pct)}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                Registró {adherence.days_logged_30d} de {adherence.days_in_range} días (
                {adherence.logging_consistency_pct}% consistencia)
              </p>
            </div>
          )}
        </div>

        {/* Perfil nutricional */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-gray-900">Perfil nutricional</p>
          </div>
          {!profile ? (
            <p className="text-sm text-gray-400">Sin perfil registrado aún.</p>
          ) : (
            <div className="space-y-1.5 text-xs text-gray-600">
              <p>
                <span className="font-medium text-gray-800">Dieta:</span>{' '}
                {profile.dieta_base ?? '—'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Alergias:</span>{' '}
                {profile.alergias?.length ? profile.alergias.join(', ') : 'Ninguna declarada'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Intolerancias:</span>{' '}
                {profile.intolerancias?.length ? profile.intolerancias.join(', ') : 'Ninguna'}
              </p>
              <p>
                <span className="font-medium text-gray-800">Condiciones médicas:</span>{' '}
                {profile.condiciones_medicas?.length
                  ? profile.condiciones_medicas.join(', ')
                  : 'Ninguna declarada'}
              </p>
            </div>
          )}
        </div>

        {/* Plan activo */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Salad className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-gray-900">Plan activo</p>
          </div>
          {!active_plan ? (
            <p className="text-sm text-gray-400">Sin plan asignado.</p>
          ) : (
            <div className="space-y-1.5 text-xs text-gray-600">
              <p className="text-sm font-semibold text-gray-900">{active_plan.name}</p>
              <p>{GOAL_LABELS[active_plan.goal] ?? active_plan.goal}</p>
              <p>
                {active_plan.kcal_target} kcal · P: {active_plan.protein_g}g · C:{' '}
                {active_plan.carbs_g}g · G: {active_plan.fat_g}g
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Registro de alimentación reciente */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">Registro de alimentación reciente</p>
        </div>
        {recent_entries.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Sin registros aún.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent_entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{e.food_item.name}</p>
                  <p className="text-xs text-gray-400">
                    {MEAL_LABELS[e.meal_type] ?? e.meal_type} · {fmtDate(e.date)} · {e.quantity_g}g
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-700">{Math.round(e.kcal)} kcal</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exámenes de laboratorio */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">Exámenes de laboratorio</p>
        </div>
        {lab_results.length === 0 ? (
          <p className="p-5 text-sm text-gray-400">Sin exámenes cargados.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {lab_results.map((r) => (
              <a
                key={r.id}
                href={r.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50"
              >
                <span className="text-gray-700">
                  {r.lab_date ? fmtDate(r.lab_date) : 'Fecha no especificada'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.reviewed_by_nutritionist
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {r.reviewed_by_nutritionist ? 'Revisado' : 'Pendiente de revisión'}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
