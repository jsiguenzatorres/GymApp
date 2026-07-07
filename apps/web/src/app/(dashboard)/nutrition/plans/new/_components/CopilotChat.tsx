'use client';

import { useState } from 'react';
import { Bot, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface PlanSummary {
  goal: string;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
interface SampleMeal {
  meal_type: string;
  description: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
interface CopilotResponse {
  success: boolean;
  message: string;
  plan_summary: PlanSummary | null;
  sample_day: SampleMeal[] | null;
}
interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: 'Desayuno',
  LUNCH: 'Almuerzo',
  DINNER: 'Cena',
  SNACK: 'Snack',
};

export default function CopilotChat({
  memberId,
  onUsePlan,
}: {
  memberId: string;
  onUsePlan: (plan: PlanSummary, sampleDay: SampleMeal[] | null) => void;
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [history, setHistory] = useState<GeminiMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CopilotResponse | null>(null);
  const [applied, setApplied] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    setApplied(false);
    try {
      const res = await fetch('/api/proxy/nutrition/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, message: text, history }),
      });
      const d = (await res.json()) as CopilotResponse;
      setMessages((prev) => [...prev, { role: 'ai', text: d.message }]);
      setHistory((prev) => [
        ...prev,
        { role: 'user', parts: [{ text }] },
        { role: 'model', parts: [{ text: JSON.stringify(d) }] },
      ]);
      setLastResult(d);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Error de red — intenta de nuevo.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b px-4 py-3 bg-gradient-to-r from-violet-50 to-white">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Co-piloto IA del nutricionista</p>
          <p className="text-[11px] text-gray-400">
            Describe el plan que quieres — la IA propone macros y un día de ejemplo
          </p>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-[11px] text-gray-400 text-center py-3">
            Ej: "Crea un plan de 1900 kcal, alta en proteína, 4 comidas al día, sin mariscos ni
            frutos secos, platillos salvadoreños fáciles de preparar"
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-tl-sm px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
            </div>
          </div>
        )}
      </div>

      {lastResult?.plan_summary && (
        <div className="border-t bg-violet-50 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-violet-800">
            Propuesta: {lastResult.plan_summary.kcal_target} kcal · P:
            {lastResult.plan_summary.protein_g}g C:{lastResult.plan_summary.carbs_g}g G:
            {lastResult.plan_summary.fat_g}g
          </p>
          {lastResult.sample_day && lastResult.sample_day.length > 0 && (
            <div className="space-y-1">
              {lastResult.sample_day.map((meal, i) => (
                <p key={i} className="text-[11px] text-violet-700">
                  <strong>{MEAL_LABELS[meal.meal_type] ?? meal.meal_type}:</strong>{' '}
                  {meal.description} ({Math.round(meal.kcal)} kcal)
                </p>
              ))}
            </div>
          )}
          {applied ? (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Aplicado al formulario
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!lastResult.plan_summary) return;
                onUsePlan(lastResult.plan_summary, lastResult.sample_day);
                setApplied(true);
              }}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              Usar este plan
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t px-3 py-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe el plan que quieres..."
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:border-violet-400 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
