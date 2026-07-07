'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Salad,
  Bot,
  Send,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  AlertTriangle,
  FlaskConical,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import RecipeGenerator from './_components/RecipeGenerator';
import ShoppingList from './_components/ShoppingList';
import PhotoAnalyzer from './_components/PhotoAnalyzer';
import AdaptiveAnalysis from './_components/AdaptiveAnalysis';

interface Plan {
  id: string;
  name: string;
  goal: string;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string | null;
  is_active: boolean;
  member: { id: string; first_name: string; last_name: string };
}

interface TodayMacros {
  has_plan: boolean;
  is_training_day?: boolean;
  today?: { kcal_target: number; protein_g: number; carbs_g: number; fat_g: number };
}

interface PlanHistoryEntry {
  id: string;
  name: string;
  goal: string;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  changed_at: string;
}

interface NutritionProfile {
  dieta_base?: string;
  alergias?: string[];
  intolerancias?: string[];
  restricciones_religiosas?: string | null;
  alimentos_evitar?: string[];
  alimentos_favoritos?: string[];
  presupuesto?: string;
  tiempo_cocina?: string | null;
  height_cm?: number | null;
  activity_level?: string | null;
  condiciones_medicas?: string[];
  requiere_supervision_clinica?: boolean;
  antecedente_tca_declarado?: boolean;
  tca_clinical_review_completed?: boolean;
}

const DIETAS_BASE = [
  'omnivoro',
  'vegetariano',
  'vegano',
  'pescetariano',
  'keto',
  'paleo',
  'mediterranea',
  'flexitariano',
];
const PRESUPUESTOS = ['bajo', 'medio', 'alto'];
const TIEMPOS_COCINA = ['menos_15_min', '15_30_min', '30_60_min', 'sin_limite'];
const ACTIVITY_LEVELS = ['sedentario', 'ligero', 'moderado', 'activo', 'muy_activo'];

function listToText(arr?: string[]) {
  return (arr ?? []).join(', ');
}
function textToList(text: string) {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
interface DiaryEntry {
  id: string;
  meal_type: string;
  quantity_g: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string | null;
  food_item: { id: string; name: string; brand: string | null };
}
interface DiaryData {
  entries: DiaryEntry[];
  totals: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
}
interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface LabMarker {
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  out_of_range: boolean;
}
interface LabResult {
  id: string;
  document_url: string;
  lab_date: string | null;
  extracted_markers: LabMarker[] | null;
  ai_note: string | null;
  reviewed_by_nutritionist: boolean;
  nutritionist_notes: string | null;
  plan_adjusted_as_result: boolean;
  created_at: string;
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  LUNCH: 'Almuerzo',
  DINNER: 'Cena',
  SNACK: 'Snack',
};
const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: 'Pérdida de peso',
  MUSCLE_GAIN: 'Ganancia muscular',
  MAINTENANCE: 'Mantenimiento',
  PERFORMANCE: 'Rendimiento',
};

function MacroBar({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = Math.min(100, (current / Math.max(target, 1)) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">
          {Math.round(current)}g / {target}g
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [diary, setDiary] = useState<DiaryData | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Food log form
  const [showAddFood, setShowAddFood] = useState(false);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [mealType, setMealType] = useState('LUNCH');
  const [quantityG, setQuantityG] = useState('100');
  const [addingFood, setAddingFood] = useState(false);

  // AI chat
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Perfil nutricional (D-25 / D-24)
  const [profile, setProfile] = useState<NutritionProfile>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Edición inline de macros del plan (side-effect mínimo de D-26)
  const [editingPlan, setEditingPlan] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PlanHistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Nutrient timing (D-27)
  const [todayMacros, setTodayMacros] = useState<TodayMacros | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    goal: 'MAINTENANCE',
    kcal_target: '0',
    protein_g: '0',
    carbs_g: '0',
    fat_g: '0',
  });
  const [savingPlan, setSavingPlan] = useState(false);

  // Exámenes de laboratorio (D-29)
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [uploadingLab, setUploadingLab] = useState(false);
  const [reviewingLabId, setReviewingLabId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [planAdjusted, setPlanAdjusted] = useState(false);
  const [savingReview, setSavingReview] = useState(false);

  const loadDiary = useCallback(async () => {
    const res = await fetch(`/api/proxy/members/${plan?.member.id}/food-diary?date=${date}`);
    if (res.ok) setDiary((await res.json()) as DiaryData);
  }, [plan, date]);

  const refetchPlan = useCallback(async () => {
    const res = await fetch(`/api/proxy/nutrition-plans/${id}`);
    if (res.ok) {
      const p = (await res.json()) as Plan;
      setPlan(p);
      setPlanForm({
        name: p.name,
        goal: p.goal,
        kcal_target: String(p.kcal_target),
        protein_g: String(p.protein_g),
        carbs_g: String(p.carbs_g),
        fat_g: String(p.fat_g),
      });
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetch(`/api/proxy/nutrition-plans/${id}`).then((r) => r.json())])
      .then(([p]: [Plan]) => {
        setPlan(p);
        setPlanForm({
          name: p.name,
          goal: p.goal,
          kcal_target: String(p.kcal_target),
          protein_g: String(p.protein_g),
          carbs_g: String(p.carbs_g),
          fat_g: String(p.fat_g),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (plan) loadDiary();
  }, [plan, loadDiary]);

  useEffect(() => {
    if (!plan) return;
    fetch(`/api/proxy/members/${plan.member.id}/nutrition/today-macros`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: TodayMacros | null) => setTodayMacros(d))
      .catch(() => {});
  }, [plan]);

  useEffect(() => {
    if (!plan) return;
    fetch(`/api/proxy/members/${plan.member.id}/nutrition-profile`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p: NutritionProfile | null) => setProfile(p ?? {}))
      .catch(() => {});
  }, [plan]);

  function setP<K extends keyof NutritionProfile>(field: K, value: NutritionProfile[K]) {
    setProfile((p) => ({ ...p, [field]: value }));
    setProfileSaved(false);
  }

  async function saveProfile() {
    if (!plan) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/proxy/members/${plan.member.id}/nutrition-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) setProfileSaved(true);
    } finally {
      setSavingProfile(false);
    }
  }

  async function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyLoaded) {
      const res = await fetch(`/api/proxy/nutrition-plans/${id}/history`);
      if (res.ok) setHistory((await res.json()) as PlanHistoryEntry[]);
      setHistoryLoaded(true);
    }
  }

  async function savePlan() {
    setSavingPlan(true);
    try {
      const res = await fetch(`/api/proxy/nutrition-plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: planForm.name,
          goal: planForm.goal,
          kcal_target: parseInt(planForm.kcal_target),
          protein_g: parseInt(planForm.protein_g),
          carbs_g: parseInt(planForm.carbs_g),
          fat_g: parseInt(planForm.fat_g),
        }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Plan;
        setPlan(updated);
        setEditingPlan(false);
        setHistoryLoaded(false); // se creó una entrada nueva de historial
      }
    } finally {
      setSavingPlan(false);
    }
  }

  const loadLabResults = useCallback(async () => {
    if (!plan) return;
    const res = await fetch(`/api/proxy/members/${plan.member.id}/lab-results`);
    if (res.ok) setLabResults((await res.json()) as LabResult[]);
  }, [plan]);

  useEffect(() => {
    loadLabResults();
  }, [loadLabResults]);

  async function uploadLabResult(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !plan) return;
    setUploadingLab(true);
    try {
      const dataUri = await fileToDataUri(file);
      await fetch('/api/proxy/nutrition/lab-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: plan.member.id, document: dataUri }),
      });
      await loadLabResults();
    } finally {
      setUploadingLab(false);
    }
  }

  function startReview(lab: LabResult) {
    setReviewingLabId(lab.id);
    setReviewNotes(lab.nutritionist_notes ?? '');
    setPlanAdjusted(lab.plan_adjusted_as_result);
  }

  async function saveLabReview() {
    if (!reviewingLabId) return;
    setSavingReview(true);
    try {
      const res = await fetch(`/api/proxy/lab-results/${reviewingLabId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionist_notes: reviewNotes || undefined,
          plan_adjusted_as_result: planAdjusted,
        }),
      });
      if (res.ok) {
        setReviewingLabId(null);
        await loadLabResults();
      }
    } finally {
      setSavingReview(false);
    }
  }

  useEffect(() => {
    if (foodSearch.length < 2) {
      setFoodItems([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/proxy/food-items?search=${encodeURIComponent(foodSearch)}`)
        .then((r) => r.json())
        .then((d: FoodItem[]) => setFoodItems(Array.isArray(d) ? d : []))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [foodSearch]);

  async function addFoodEntry() {
    if (!selectedFood || !plan) return;
    setAddingFood(true);
    try {
      await fetch(`/api/proxy/members/${plan.member.id}/food-diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_item_id: selectedFood.id,
          plan_id: id,
          date,
          meal_type: mealType,
          quantity_g: parseFloat(quantityG),
        }),
      });
      setSelectedFood(null);
      setFoodSearch('');
      setQuantityG('100');
      setShowAddFood(false);
      await loadDiary();
    } finally {
      setAddingFood(false);
    }
  }

  async function deleteEntry(entryId: string) {
    setDeletingId(entryId);
    try {
      await fetch(`/api/proxy/food-diary/${entryId}`, { method: 'DELETE' });
      await loadDiary();
    } finally {
      setDeletingId(null);
    }
  }

  async function sendAiMessage() {
    if (!aiInput.trim() || aiLoading) return;
    const msg = aiInput.trim();
    setAiMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setAiInput('');
    setAiLoading(true);
    try {
      const res = await fetch('/api/proxy/nutrition/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: id, context: msg }),
      });
      if (res.ok) {
        const d = (await res.json()) as { response: string };
        setAiMessages((prev) => [...prev, { role: 'ai', text: d.response }]);
      }
    } finally {
      setAiLoading(false);
    }
  }

  if (loading)
    return <div className="animate-pulse text-sm text-gray-400 p-8">Cargando plan...</div>;
  if (!plan) return <div className="p-8 text-sm text-red-500">Plan no encontrado</div>;

  const entriesByMeal = MEAL_ORDER.reduce<Record<string, DiaryEntry[]>>((acc, m) => {
    acc[m] = (diary?.entries ?? []).filter((e) => e.meal_type === m);
    return acc;
  }, {});

  const kcalPct = Math.min(100, ((diary?.totals.kcal ?? 0) / plan.kcal_target) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/nutrition"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              {GOAL_LABELS[plan.goal] ?? plan.goal}
            </span>
            {!plan.is_active && <span className="text-xs text-gray-400">Inactivo</span>}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{plan.name}</h1>
          <Link
            href={`/members/${plan.member.id}`}
            className="text-sm text-violet-600 hover:underline"
          >
            {plan.member.first_name} {plan.member.last_name}
          </Link>
        </div>
        {/* Date selector */}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-violet-500 focus:outline-none"
        />
      </div>

      {/* Macro progress */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-3">
        <div className="flex justify-between items-baseline mb-1">
          <p className="text-sm font-semibold text-gray-900">Progreso del día</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{date}</span>
            <button
              onClick={toggleHistory}
              className="text-[11px] text-gray-400 hover:text-violet-600 underline decoration-dotted"
            >
              Historial
            </button>
            <button
              onClick={() => setEditingPlan((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-violet-600"
              title="Editar macros del plan"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="rounded-lg bg-gray-50 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-700">
              Historial de cambios ({history.length})
            </p>
            {history.length === 0 ? (
              <p className="text-[11px] text-gray-400">Sin cambios previos registrados.</p>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="text-[11px] text-gray-500 border-b border-gray-100 pb-1.5 last:border-0"
                >
                  <span className="text-gray-400">{new Date(h.changed_at).toLocaleString()}</span>
                  {' — '}
                  <strong>{h.name}</strong> ({GOAL_LABELS[h.goal] ?? h.goal}) · {h.kcal_target} kcal
                  · P:{h.protein_g}g C:{h.carbs_g}g G:{h.fat_g}g
                </div>
              ))
            )}
          </div>
        )}

        {editingPlan ? (
          <div className="space-y-3 rounded-lg bg-gray-50 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-500">Nombre</label>
                <input
                  value={planForm.name}
                  onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500">Objetivo</label>
                <select
                  value={planForm.goal}
                  onChange={(e) => setPlanForm((p) => ({ ...p, goal: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
                >
                  {Object.entries(GOAL_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(['kcal_target', 'protein_g', 'carbs_g', 'fat_g'] as const).map((f) => (
                <div key={f}>
                  <label className="text-[10px] text-gray-500">
                    {f === 'kcal_target' ? 'Kcal' : f.replace('_g', '')}
                  </label>
                  <input
                    type="number"
                    value={planForm[f]}
                    onChange={(e) => setPlanForm((p) => ({ ...p, [f]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={savePlan}
                disabled={savingPlan}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {savingPlan ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditingPlan(false)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Nutrient timing (D-27): ajuste de HOY según si ya entrenó */}
            {todayMacros?.has_plan && todayMacros.today && (
              <div
                className={`rounded-lg px-3 py-2 text-[11px] ${todayMacros.is_training_day ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-600'}`}
              >
                {todayMacros.is_training_day
                  ? '💪 Hoy entrenó — carbos ajustados +12%: '
                  : '😴 Día de descanso — carbos ajustados -12%: '}
                {todayMacros.today.carbs_g}g carbos · {todayMacros.today.fat_g}g grasas ·{' '}
                {todayMacros.today.kcal_target} kcal (proteína igual: {todayMacros.today.protein_g}
                g)
              </div>
            )}

            {/* Kcal big bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">Calorías</span>
                <span className="text-gray-500">
                  {Math.round(diary?.totals.kcal ?? 0)} / {plan.kcal_target} kcal
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100">
                <div
                  className="h-2.5 rounded-full bg-violet-500 transition-all"
                  style={{ width: `${kcalPct}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <MacroBar
                label="Proteína"
                current={diary?.totals.protein_g ?? 0}
                target={plan.protein_g}
                color="bg-blue-500"
              />
              <MacroBar
                label="Carbohidratos"
                current={diary?.totals.carbs_g ?? 0}
                target={plan.carbs_g}
                color="bg-amber-500"
              />
              <MacroBar
                label="Grasas"
                current={diary?.totals.fat_g ?? 0}
                target={plan.fat_g}
                color="bg-green-500"
              />
            </div>
          </>
        )}
      </div>

      {/* Perfil nutricional del miembro (D-25 / D-24) */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-gray-900">Perfil nutricional del miembro</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Dieta base</label>
            <select
              value={profile.dieta_base ?? 'omnivoro'}
              onChange={(e) => setP('dieta_base', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
            >
              {DIETAS_BASE.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Presupuesto</label>
            <select
              value={profile.presupuesto ?? 'medio'}
              onChange={(e) => setP('presupuesto', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
            >
              {PRESUPUESTOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Tiempo de cocina</label>
            <select
              value={profile.tiempo_cocina ?? ''}
              onChange={(e) => setP('tiempo_cocina', e.target.value || undefined)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
            >
              <option value="">—</option>
              {TIEMPOS_COCINA.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Altura (cm) — para TMB/TDEE</label>
            <input
              type="number"
              value={profile.height_cm ?? ''}
              onChange={(e) =>
                setP('height_cm', e.target.value ? parseFloat(e.target.value) : null)
              }
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Nivel de actividad</label>
            <select
              value={profile.activity_level ?? ''}
              onChange={(e) => setP('activity_level', e.target.value || undefined)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
            >
              <option value="">—</option>
              {ACTIVITY_LEVELS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Alergias (separadas por coma)</label>
            <input
              value={listToText(profile.alergias)}
              onChange={(e) => setP('alergias', textToList(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Intolerancias</label>
            <input
              value={listToText(profile.intolerancias)}
              onChange={(e) => setP('intolerancias', textToList(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Alimentos a evitar</label>
            <input
              value={listToText(profile.alimentos_evitar)}
              onChange={(e) => setP('alimentos_evitar', textToList(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-gray-500">Alimentos favoritos</label>
            <input
              value={listToText(profile.alimentos_favoritos)}
              onChange={(e) => setP('alimentos_favoritos', textToList(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-gray-500">Condiciones médicas relevantes</label>
          <input
            value={listToText(profile.condiciones_medicas)}
            onChange={(e) => setP('condiciones_medicas', textToList(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          />
        </div>

        {/* Salvaguarda TCA (D-24) */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
          <label className="flex items-start gap-2 text-xs text-amber-900">
            <input
              type="checkbox"
              checked={profile.antecedente_tca_declarado ?? false}
              onChange={(e) => setP('antecedente_tca_declarado', e.target.checked)}
              className="mt-0.5"
            />
            <span>
              El miembro declaró un antecedente de trastorno de conducta alimentaria (TCA). Marcar
              esto bloquea la creación de nuevos planes de pérdida de peso hasta revisión
              profesional.
            </span>
          </label>

          {profile.antecedente_tca_declarado && (
            <label className="flex items-start gap-2 text-xs text-amber-900 pl-1 pt-1 border-t border-amber-200">
              <input
                type="checkbox"
                checked={profile.tca_clinical_review_completed ?? false}
                onChange={(e) => setP('tca_clinical_review_completed', e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                Marcar SOLO después de que un nutricionista certificado revisó el caso en consulta
                presencial. Esto desbloquea la creación de planes de pérdida de peso para este
                miembro.
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {savingProfile ? 'Guardando...' : 'Guardar perfil'}
          </button>
          {profileSaved && <span className="text-xs text-green-600">Guardado ✓</span>}
        </div>
      </div>

      {/* Exámenes de laboratorio (D-29) */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-gray-900">Exámenes de laboratorio</p>
          </div>
          <label className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer">
            {uploadingLab ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Subir foto o PDF
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={uploadLabResult}
              disabled={uploadingLab}
            />
          </label>
        </div>

        {labResults.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">
            Sin exámenes subidos. La IA solo extrae valores — nunca diagnostica.
          </p>
        ) : (
          <div className="divide-y">
            {labResults.map((lab) => (
              <div key={lab.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <a
                      href={lab.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Ver documento
                    </a>
                    <span className="text-[10px] text-gray-400">
                      {new Date(lab.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {lab.reviewed_by_nutritionist ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> Revisado
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Pendiente de revisión
                    </span>
                  )}
                </div>

                {lab.extracted_markers && lab.extracted_markers.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {lab.extracted_markers.map((m, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-2 py-1 text-[11px] ${m.out_of_range ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}
                      >
                        {m.name}: <strong>{m.value}</strong> {m.unit}
                        {m.reference_range && (
                          <span className="text-gray-400"> (ref: {m.reference_range})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {lab.ai_note && <p className="text-[11px] text-gray-400">{lab.ai_note}</p>}

                {!lab.reviewed_by_nutritionist &&
                  (reviewingLabId === lab.id ? (
                    <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={2}
                        placeholder="Notas del nutricionista (interpretación clínica, recomendaciones)..."
                        className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs resize-none"
                      />
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={planAdjusted}
                          onChange={(e) => setPlanAdjusted(e.target.checked)}
                        />
                        Se ajustó el plan como resultado de este examen
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={saveLabReview}
                          disabled={savingReview}
                          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                          {savingReview ? 'Guardando...' : 'Marcar como revisado'}
                        </button>
                        <button
                          onClick={() => setReviewingLabId(null)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startReview(lab)}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      Revisar y marcar como leído
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Diary */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <p className="text-sm font-semibold text-gray-900">Diario alimenticio</p>
          <button
            onClick={() => setShowAddFood((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        {/* Add food form */}
        {showAddFood && (
          <div className="border-b bg-violet-50 px-5 py-4 space-y-3">
            <div className="relative">
              <input
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                placeholder="Buscar alimento..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
              />
              {foodItems.length > 0 && !selectedFood && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                  {foodItems.map((f) => (
                    <li
                      key={f.id}
                      onClick={() => {
                        setSelectedFood(f);
                        setFoodSearch(f.name);
                        setFoodItems([]);
                      }}
                      className="cursor-pointer px-3 py-2 text-xs hover:bg-violet-50"
                    >
                      <span className="font-medium">{f.name}</span>
                      {f.brand && <span className="text-gray-400"> · {f.brand}</span>}
                      <span className="text-gray-400"> · {f.kcal_per_100g} kcal/100g</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {selectedFood && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Cantidad (g)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityG}
                    onChange={(e) => setQuantityG(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Comida</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white"
                  >
                    {MEAL_ORDER.map((m) => (
                      <option key={m} value={m}>
                        {MEAL_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addFoodEntry}
                    disabled={addingFood}
                    className="w-full rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {addingFood ? '...' : 'Agregar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Entries by meal */}
        {MEAL_ORDER.map((meal) => {
          const entries = entriesByMeal[meal] ?? [];
          if (entries.length === 0 && !showAddFood) return null;
          return (
            <div key={meal} className="border-b last:border-0">
              <p className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {MEAL_LABELS[meal]}
              </p>
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-5 py-2 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.food_item.name}</p>
                    <p className="text-xs text-gray-400">
                      {e.quantity_g}g · {Math.round(e.kcal)} kcal · P:{Math.round(e.protein_g)}g C:
                      {Math.round(e.carbs_g)}g G:{Math.round(e.fat_g)}g
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEntry(e.id)}
                    disabled={deletingId === e.id}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-300 hover:text-red-500 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {entries.length === 0 && (
                <p className="px-5 py-2 text-xs text-gray-300">Sin registros</p>
              )}
            </div>
          );
        })}

        {!diary?.entries.length && !showAddFood && (
          <div className="py-8 text-center">
            <Salad className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">Sin registros para este día</p>
          </div>
        )}
      </div>

      {/* Paridad con mobile (D-30 a D-33) */}
      <PhotoAnalyzer memberId={plan.member.id} />
      <AdaptiveAnalysis memberId={plan.member.id} onApplied={refetchPlan} />
      <RecipeGenerator />
      <ShoppingList memberId={plan.member.id} />

      {/* AI Nutrition Advisor */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 border-b px-5 py-3.5 bg-gradient-to-r from-violet-50 to-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Nutricionista IA</p>
            <p className="text-xs text-gray-400">Sugerencias personalizadas con Gemini</p>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto p-4 space-y-3">
          {aiMessages.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">
              Pregunta sobre sugerencias de comidas, ajuste de macros o estrategias nutricionales
              para este miembro.
            </p>
          )}
          {aiMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        {aiMessages.length === 0 && (
          <div className="border-t border-b px-4 py-2 flex gap-2 overflow-x-auto">
            {[
              'Sugerir comidas para completar macros de hoy',
              '¿Qué desayuno con proteína alta?',
              'Ideas para snack bajo en calorías',
            ].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setAiInput(s);
                }}
                className="shrink-0 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] text-violet-700 hover:bg-violet-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendAiMessage();
          }}
          className="flex items-center gap-2 px-4 py-3"
        >
          <input
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Pregunta al nutricionista IA..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-violet-400 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={!aiInput.trim() || aiLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
