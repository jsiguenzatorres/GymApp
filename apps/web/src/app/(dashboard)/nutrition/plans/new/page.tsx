'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Salad, Search, Calculator, Loader2 } from 'lucide-react';
import CopilotChat from './_components/CopilotChat';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

interface TmbTdeeResult {
  tmb_kcal: number;
  tmb_formula_used: string;
  tdee_kcal: number;
  factor_actividad: number;
  declared_activity_level: string;
  suggested_activity_level: string | null;
  activity_note: string | null;
  suggested: { kcal_target: number; protein_g: number; carbs_g: number; fat_g: number };
  warnings: string[];
}

const GOALS = [
  { value: 'WEIGHT_LOSS', label: 'Pérdida de peso', desc: 'Déficit calórico controlado' },
  { value: 'MUSCLE_GAIN', label: 'Ganancia muscular', desc: 'Superávit con proteína alta' },
  { value: 'MAINTENANCE', label: 'Mantenimiento', desc: 'Macros equilibrados' },
  { value: 'PERFORMANCE', label: 'Rendimiento', desc: 'Optimización para entrenamiento' },
];

// Plantillas de plan base (D-28) — distribución % de macros, punto de partida
// que el nutricionista personaliza, no un plan final.
const TEMPLATES = [
  {
    key: 'deficit_alta_proteina',
    label: 'Déficit Alta Proteína',
    goal: 'WEIGHT_LOSS',
    pct: { protein: 35, fat: 30, carbs: 35 },
    desc: 'Pérdida de grasa preservando masa muscular',
  },
  {
    key: 'superavit_limpio',
    label: 'Superávit Limpio',
    goal: 'MUSCLE_GAIN',
    pct: { protein: 30, fat: 25, carbs: 45 },
    desc: 'Ganancia muscular con mínima ganancia de grasa',
  },
  {
    key: 'recomposicion',
    label: 'Recomposición',
    goal: 'MAINTENANCE',
    pct: { protein: 30, fat: 30, carbs: 40 },
    desc: 'Perder grasa y ganar músculo simultáneamente',
  },
  {
    key: 'mantenimiento',
    label: 'Mantenimiento Saludable',
    goal: 'MAINTENANCE',
    pct: { protein: 25, fat: 30, carbs: 45 },
    desc: 'Sin objetivo de cambio de peso, solo bienestar',
  },
  {
    key: 'rendimiento',
    label: 'Rendimiento Deportivo',
    goal: 'PERFORMANCE',
    pct: { protein: 25, fat: 20, carbs: 55 },
    desc: 'Mayor carbohidrato total, timing peri-entreno',
  },
  {
    key: 'vegano_alto_rendimiento',
    label: 'Vegano Alto Rendimiento',
    goal: 'MUSCLE_GAIN',
    pct: { protein: 35, fat: 20, carbs: 45 },
    desc: 'Proteína alta por menor biodisponibilidad vegetal',
  },
];

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

export default function NewPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDrop, setShowDrop] = useState(false);

  const [form, setForm] = useState({
    name: '',
    goal: 'MAINTENANCE',
    kcal_target: '2000',
    protein_g: '150',
    carbs_g: '200',
    fat_g: '65',
    notes: '',
  });

  const [tmbTdee, setTmbTdee] = useState<TmbTdeeResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Preseleccionar miembro si se llega con ?memberId=... (ej. desde la ficha nutricional)
  useEffect(() => {
    const memberId = searchParams.get('memberId');
    if (!memberId) return;
    fetch(`/api/proxy/members/${memberId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Member | null) => {
        if (m?.id) setSelectedMember(m);
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (memberSearch.length < 2) {
      setMembers([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/proxy/members?search=${encodeURIComponent(memberSearch)}&limit=6`)
        .then((r) => r.json())
        .then((d: { data?: Member[] } | Member[]) => {
          setMembers(Array.isArray(d) ? d : (d.data ?? []));
          setShowDrop(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setError(null);
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    const kcal = parseInt(form.kcal_target) || 2000;
    const protein_g = Math.round((kcal * t.pct.protein) / 100 / 4);
    const fat_g = Math.round((kcal * t.pct.fat) / 100 / 9);
    const carbs_g = Math.round((kcal * t.pct.carbs) / 100 / 4);
    setForm((p) => ({
      ...p,
      goal: t.goal,
      protein_g: String(protein_g),
      carbs_g: String(carbs_g),
      fat_g: String(fat_g),
      notes: p.notes || t.desc,
    }));
    setTmbTdee(null);
  }

  function applyCopilotPlan(
    plan: { goal: string; kcal_target: number; protein_g: number; carbs_g: number; fat_g: number },
    sampleDay: { meal_type: string; description: string }[] | null,
  ) {
    const notesFromSample = sampleDay?.length
      ? sampleDay.map((m) => `${m.meal_type}: ${m.description}`).join(' · ')
      : '';
    setForm((p) => ({
      ...p,
      goal: plan.goal,
      kcal_target: String(plan.kcal_target),
      protein_g: String(plan.protein_g),
      carbs_g: String(plan.carbs_g),
      fat_g: String(plan.fat_g),
      notes: p.notes || notesFromSample,
    }));
    setTmbTdee(null);
  }

  async function calculateTmbTdee() {
    if (!selectedMember) return;
    setCalculating(true);
    setCalcError(null);
    try {
      const res = await fetch('/api/proxy/nutrition/calculate-tmb-tdee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selectedMember.id, goal: form.goal }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setCalcError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
        return;
      }
      const result = (await res.json()) as TmbTdeeResult;
      setTmbTdee(result);
      setForm((p) => ({
        ...p,
        kcal_target: String(result.suggested.kcal_target),
        protein_g: String(result.suggested.protein_g),
        carbs_g: String(result.suggested.carbs_g),
        fat_g: String(result.suggested.fat_g),
      }));
    } catch {
      setCalcError('Error de red');
    } finally {
      setCalculating(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) {
      setError('Selecciona un miembro');
      return;
    }
    if (!form.name.trim()) {
      setError('El nombre del plan es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/proxy/nutrition-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember.id,
          name: form.name.trim(),
          goal: form.goal,
          kcal_target: parseInt(form.kcal_target),
          protein_g: parseInt(form.protein_g),
          carbs_g: parseInt(form.carbs_g),
          fat_g: parseInt(form.fat_g),
          notes: form.notes || undefined,
          ...(tmbTdee
            ? {
                tmb_kcal: tmbTdee.tmb_kcal,
                tmb_formula_used: tmbTdee.tmb_formula_used,
                tdee_kcal: tmbTdee.tdee_kcal,
                factor_actividad: tmbTdee.factor_actividad,
              }
            : {}),
        }),
      });

      if (res.ok) {
        const plan = (await res.json()) as { id: string };
        router.push(`/nutrition/plans/${plan.id}`);
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  const macroTotal =
    parseInt(form.protein_g) * 4 + parseInt(form.carbs_g) * 4 + parseInt(form.fat_g) * 9;
  const kcalDiff = parseInt(form.kcal_target) - macroTotal;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/nutrition"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a nutrición
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo plan nutricional</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Miembro */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Salad className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-gray-900">Miembro</p>
          </div>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-lg bg-violet-50 border border-violet-200 px-4 py-2.5">
              <span className="text-sm font-medium text-violet-800">
                {selectedMember.first_name} {selectedMember.last_name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setTmbTdee(null);
                }}
                className="text-xs text-violet-500 hover:text-violet-800"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onFocus={() => members.length > 0 && setShowDrop(true)}
                  placeholder="Buscar miembro por nombre..."
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {showDrop && members.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setShowDrop(false);
                        setMemberSearch('');
                        setTmbTdee(null);
                      }}
                      className="cursor-pointer px-4 py-2.5 text-sm hover:bg-violet-50"
                    >
                      {m.first_name} {m.last_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {selectedMember && (
          <CopilotChat memberId={selectedMember.id} onUsePlan={applyCopilotPlan} />
        )}

        {/* Info del plan */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-900">Detalles del plan</p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Nombre del plan *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              placeholder="Ej: Plan pérdida de peso - Fase 1"
              className={inputCls()}
            />
          </div>

          {/* Plantillas de plan base (D-28) */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Plantilla de plan (opcional — punto de partida)
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  title={t.desc}
                  className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-left hover:border-violet-300 hover:bg-violet-50"
                >
                  <p className="text-[11px] font-semibold text-gray-800 whitespace-nowrap">
                    {t.label}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    P{t.pct.protein}/G{t.pct.fat}/C{t.pct.carbs}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Goal grid */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Objetivo</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => set('goal', g.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${form.goal === g.value ? 'border-violet-500 bg-violet-50' : 'border-gray-100 hover:border-violet-200'}`}
                >
                  <p className="text-xs font-semibold text-gray-900">{g.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Macros */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600 block">Objetivos de macros</label>
              <button
                type="button"
                onClick={calculateTmbTdee}
                disabled={!selectedMember || calculating}
                className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-40"
              >
                {calculating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Calculator className="h-3 w-3" />
                )}
                Calcular con TMB/TDEE
              </button>
            </div>

            {calcError && (
              <p className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-[11px] text-red-600">
                {calcError}
              </p>
            )}

            {tmbTdee && (
              <div className="mb-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[11px] text-blue-800 space-y-1">
                <p>
                  TMB: <strong>{tmbTdee.tmb_kcal} kcal</strong> ({tmbTdee.tmb_formula_used}) · TDEE:{' '}
                  <strong>{tmbTdee.tdee_kcal} kcal</strong> (factor {tmbTdee.factor_actividad})
                </p>
                {tmbTdee.activity_note && <p className="text-blue-600">{tmbTdee.activity_note}</p>}
                {tmbTdee.warnings.map((w, i) => (
                  <p key={i} className="text-amber-700">
                    ⚠️ {w}
                  </p>
                ))}
                <p className="text-blue-500">
                  Macros prellenadas — puedes ajustarlas manualmente antes de guardar.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Calorías objetivo (kcal)</label>
                <input
                  type="number"
                  min="0"
                  value={form.kcal_target}
                  onChange={(e) => set('kcal_target', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Proteína (g)</label>
                <input
                  type="number"
                  min="0"
                  value={form.protein_g}
                  onChange={(e) => set('protein_g', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Carbohidratos (g)</label>
                <input
                  type="number"
                  min="0"
                  value={form.carbs_g}
                  onChange={(e) => set('carbs_g', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Grasas (g)</label>
                <input
                  type="number"
                  min="0"
                  value={form.fat_g}
                  onChange={(e) => set('fat_g', e.target.value)}
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Macro calc */}
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-xs ${Math.abs(kcalDiff) < 50 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
            >
              Macros calculan <strong>{macroTotal} kcal</strong> (
              {kcalDiff > 0
                ? `${kcalDiff} kcal bajo el objetivo`
                : `${Math.abs(kcalDiff)} kcal sobre el objetivo`}
              )
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Restricciones alimenticias, alergias, preferencias..."
              className={inputCls('resize-none')}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            href="/nutrition"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
