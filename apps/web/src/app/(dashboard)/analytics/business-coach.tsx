'use client';

import { useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';

const QUICK_QUESTIONS = [
  '¿Cuál es mi tasa de retención actual?',
  '¿Por qué bajaron los ingresos este mes?',
  '¿Cuántos miembros están en riesgo de cancelar?',
  '¿Qué debo mejorar para aumentar ingresos?',
];

interface BusinessCoachProps {
  askAction: (question: string) => Promise<string>;
}

export function BusinessCoach({ askAction }: BusinessCoachProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const result = await askAction(trimmed);
      setAnswer(result);
    } catch {
      setAnswer('Error al consultar el Business Coach. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 leading-none">Business Coach IA</h2>
          <p className="text-xs text-gray-500 mt-0.5">Consulta tus métricas en lenguaje natural</p>
        </div>
        <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-600">
          Beta
        </span>
      </div>

      {answer && (
        <div className="mb-4 rounded-lg border border-violet-100 bg-white p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          <p className="text-xs font-semibold text-violet-600 mb-2 uppercase tracking-wide">
            Análisis
          </p>
          {answer}
        </div>
      )}

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-violet-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analizando tus métricas...</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk(question)}
          placeholder="¿Por qué bajaron las membresías este mes?"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
          disabled={loading}
        />
        <button
          onClick={() => handleAsk(question)}
          disabled={!question.trim() || loading}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
          Preguntar
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuestion(q);
              handleAsk(q);
            }}
            disabled={loading}
            className="rounded-full bg-white border border-violet-200 px-3 py-1 text-xs text-violet-700 hover:bg-violet-50 disabled:opacity-40 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
