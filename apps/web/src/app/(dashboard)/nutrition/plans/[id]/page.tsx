'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Salad, Bot, Send, Loader2, Trash2, Plus } from 'lucide-react';

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

  const loadDiary = useCallback(async () => {
    const res = await fetch(`/api/proxy/members/${plan?.member.id}/food-diary?date=${date}`);
    if (res.ok) setDiary((await res.json()) as DiaryData);
  }, [plan, date]);

  useEffect(() => {
    Promise.all([fetch(`/api/proxy/nutrition-plans/${id}`).then((r) => r.json())])
      .then(([p]: [Plan]) => {
        setPlan(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (plan) loadDiary();
  }, [plan, loadDiary]);

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
          <span className="text-xs text-gray-400">{date}</span>
        </div>
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
