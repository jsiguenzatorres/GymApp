'use client';

import { useState } from 'react';
import { Camera, Loader2, CheckCircle2 } from 'lucide-react';

interface AnalyzedItem {
  name: string;
  grams: number;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}
interface AnalyzeResult {
  success: boolean;
  items: AnalyzedItem[];
  totals: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  confidence: 'low' | 'medium' | 'high';
  note: string;
}
interface FoodItemHit {
  id: string;
  name: string;
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function detectMealType(): string {
  const h = new Date().getHours();
  if (h < 11) return 'BREAKFAST';
  if (h < 16) return 'LUNCH';
  if (h < 19) return 'SNACK';
  return 'DINNER';
}

export default function PhotoAnalyzer({ memberId }: { memberId: string }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdxs, setSavedIdxs] = useState<Set<number>>(new Set());
  const [registerError, setRegisterError] = useState<string | null>(null);

  async function analyzePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setSavedIdxs(new Set());
    try {
      const dataUri = await fileToDataUri(file);
      const res = await fetch('/api/proxy/nutrition/photo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUri }),
      });
      const d = (await res.json()) as AnalyzeResult;
      if (d.success && d.items.length > 0) {
        setResult(d);
      } else {
        setError(d.note || 'No se pudo identificar comida en la foto');
      }
    } catch {
      setError('Error de red al analizar la foto');
    } finally {
      setAnalyzing(false);
    }
  }

  async function registerItem(item: AnalyzedItem, idx: number) {
    setSavingIdx(idx);
    setRegisterError(null);
    try {
      // Mismo patrón que mobile (nutrition-photo.tsx): buscar food_item existente
      // por nombre — no hay endpoint para crear uno on-the-fly desde esta pantalla.
      const searchRes = await fetch(
        `/api/proxy/food-items?search=${encodeURIComponent(item.name)}`,
      );
      const matches = (await searchRes.json()) as FoodItemHit[];
      const foodId =
        matches.find((f) => f.name.toLowerCase() === item.name.toLowerCase())?.id ?? matches[0]?.id;

      if (!foodId) {
        setRegisterError(
          `"${item.name}" no está en la biblioteca de alimentos — agrégalo primero.`,
        );
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const logRes = await fetch(`/api/proxy/members/${memberId}/food-diary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_item_id: foodId,
          date: today,
          meal_type: detectMealType(),
          quantity_g: item.grams,
          notes: `Identificado por IA · estimado: ${Math.round(item.kcal)} kcal`,
        }),
      });
      if (logRes.ok) {
        setSavedIdxs((prev) => new Set(prev).add(idx));
      } else {
        setRegisterError('No se pudo registrar en el diario');
      }
    } finally {
      setSavingIdx(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-gray-900">Foto del plato (IA visual)</p>
        </div>
        <label className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 cursor-pointer">
          {analyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
          {analyzing ? 'Analizando...' : 'Subir foto'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={analyzePhoto}
            disabled={analyzing}
          />
        </label>
      </div>

      <div className="px-5 py-4">
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!result && !error && (
          <p className="text-xs text-gray-400">
            Sube una foto del plato — la IA propone alimentos y macros, revisa antes de registrar.
          </p>
        )}
        {registerError && <p className="text-xs text-red-600 mb-2">{registerError}</p>}

        {result && (
          <div className="space-y-3">
            <p className="text-[11px] text-gray-400">
              Confianza: {result.confidence} · {result.note}
            </p>
            <div className="space-y-1.5">
              {result.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-800">
                      {item.name} <span className="text-gray-400">· {item.grams}g</span>
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {Math.round(item.kcal)} kcal · P:{Math.round(item.protein_g)}g C:
                      {Math.round(item.carbs_g)}g G:{Math.round(item.fat_g)}g
                    </p>
                  </div>
                  {savedIdxs.has(i) ? (
                    <span className="flex items-center gap-1 text-[11px] text-green-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Registrado
                    </span>
                  ) : (
                    <button
                      onClick={() => registerItem(item, i)}
                      disabled={savingIdx === i}
                      className="rounded-lg border border-violet-200 px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                    >
                      {savingIdx === i ? '...' : 'Registrar'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500">
              Total estimado: {Math.round(result.totals.kcal)} kcal
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
