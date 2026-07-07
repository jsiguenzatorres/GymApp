'use client';

import { useState } from 'react';
import { TrendingUp, Loader2, AlertTriangle } from 'lucide-react';

interface AnalysisResult {
  success: boolean;
  error?: string;
  current_targets?: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  progress?: {
    weight_change_kg: number | null;
    sessions_28d: number;
    adherence_pct: number;
    avg_kcal: number;
  };
  risk_alert_active?: boolean;
  analysis?: {
    verdict: 'on_track' | 'needs_adjustment' | 'needs_complete_review';
    headline: string;
    diagnosis: string;
    adjustments: { target_kcal_delta: number; target_protein_g_delta: number; rationale: string };
    recommendations: string[];
    next_review_in_days: number;
  };
}

const VERDICT_LABELS: Record<string, { label: string; color: string }> = {
  on_track: { label: 'En buen camino', color: 'bg-green-100 text-green-700' },
  needs_adjustment: { label: 'Necesita ajuste', color: 'bg-amber-100 text-amber-700' },
  needs_complete_review: { label: 'Requiere revisión completa', color: 'bg-red-100 text-red-700' },
};

export default function AdaptiveAnalysis({
  memberId,
  onApplied,
}: {
  memberId: string;
  onApplied: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [applied, setApplied] = useState(false);

  async function analyze() {
    setLoading(true);
    setResult(null);
    setApplied(false);
    try {
      const res = await fetch('/api/proxy/nutrition/adaptive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      setResult((await res.json()) as AnalysisResult);
    } finally {
      setLoading(false);
    }
  }

  async function applyAdjustment() {
    if (!result?.analysis) return;
    setApplying(true);
    try {
      const res = await fetch('/api/proxy/nutrition/adaptive-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          target_kcal_delta: result.analysis.adjustments.target_kcal_delta,
          target_protein_g_delta: result.analysis.adjustments.target_protein_g_delta,
        }),
      });
      if (res.ok) {
        setApplied(true);
        onApplied();
      }
    } finally {
      setApplying(false);
    }
  }

  const verdict = result?.analysis ? VERDICT_LABELS[result.analysis.verdict] : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-gray-900">Análisis adaptativo (28 días)</p>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {loading ? 'Analizando...' : 'Analizar progreso'}
        </button>
      </div>

      <div className="px-5 py-4">
        {result && !result.success && (
          <p className="text-xs text-red-600">{result.error ?? 'No se pudo generar el análisis'}</p>
        )}
        {!result && (
          <p className="text-xs text-gray-400">
            Cruza peso, sesiones y adherencia de los últimos 28 días para sugerir ajustes al plan.
          </p>
        )}

        {result?.success && result.analysis && (
          <div className="space-y-3">
            {result.risk_alert_active && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Hay una alerta de seguimiento nutricional activa para este miembro — no se sugieren
                reducciones de calorías hasta que se revise.
              </div>
            )}

            <div className="flex items-center gap-2">
              {verdict && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${verdict.color}`}>
                  {verdict.label}
                </span>
              )}
              <p className="text-sm font-semibold text-gray-900">{result.analysis.headline}</p>
            </div>
            <p className="text-xs text-gray-600">{result.analysis.diagnosis}</p>

            {result.progress && (
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-[10px] text-gray-400">Peso</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {result.progress.weight_change_kg !== null
                      ? `${result.progress.weight_change_kg > 0 ? '+' : ''}${result.progress.weight_change_kg}kg`
                      : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-[10px] text-gray-400">Sesiones</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {result.progress.sessions_28d}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-[10px] text-gray-400">Adherencia</p>
                  <p className="text-xs font-semibold text-gray-800">
                    {result.progress.adherence_pct}%
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2">
                  <p className="text-[10px] text-gray-400">Kcal prom.</p>
                  <p className="text-xs font-semibold text-gray-800">{result.progress.avg_kcal}</p>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-violet-50 p-3 text-xs text-violet-800">
              Ajuste sugerido: {result.analysis.adjustments.target_kcal_delta > 0 ? '+' : ''}
              {result.analysis.adjustments.target_kcal_delta} kcal ·{' '}
              {result.analysis.adjustments.target_protein_g_delta > 0 ? '+' : ''}
              {result.analysis.adjustments.target_protein_g_delta}g proteína
              <p className="mt-1 text-violet-700">{result.analysis.adjustments.rationale}</p>
            </div>

            {result.analysis.recommendations.length > 0 && (
              <ul className="text-xs text-gray-600 space-y-0.5">
                {result.analysis.recommendations.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            )}

            {applied ? (
              <p className="text-xs text-green-600">Ajuste aplicado al plan ✓</p>
            ) : (
              <button
                onClick={applyAdjustment}
                disabled={
                  applying ||
                  (result.analysis.adjustments.target_kcal_delta === 0 &&
                    result.analysis.adjustments.target_protein_g_delta === 0)
                }
                className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-40"
              >
                {applying ? 'Aplicando...' : 'Aplicar ajuste al plan'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
