'use client';
import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';

type Segment = 'all' | 'all_active' | 'tier_pro' | 'tier_elite' | 'at_risk';

const SEGMENT_LABEL: Record<Segment, { label: string; desc: string }> = {
  all_active: { label: 'Activos + Trial', desc: 'Solo miembros con membresía activa o en prueba' },
  all: { label: 'Todos', desc: 'Incluye también freezeados y vencidos' },
  tier_pro: { label: 'NutriPro', desc: 'Miembros con add-on NutriPro activo' },
  tier_elite: { label: 'NutriElite', desc: 'Miembros con add-on NutriElite activo' },
  at_risk: { label: 'Riesgo alto', desc: 'Risk score ≥ 70 (para retención)' },
};

export function BroadcastForm({
  sendAction,
}: {
  sendAction: (fd: FormData) => Promise<{ ok: boolean; recipients?: number; error?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<Segment>('all_active');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<null | {
    ok: boolean;
    recipients?: number;
    error?: string;
  }>(null);

  const submit = () => {
    setResult(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('title', title);
      fd.set('body', body);
      fd.set('segment', segment);
      const res = await sendAction(fd);
      setResult(res);
      if (res.ok) {
        setTitle('');
        setBody('');
      }
    });
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-600">Segmento *</label>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(SEGMENT_LABEL) as Segment[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSegment(s)}
                className={`rounded-lg border p-3 text-left transition ${
                  segment === s
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    segment === s ? 'text-violet-700' : 'text-gray-900'
                  }`}
                >
                  {SEGMENT_LABEL[s].label}
                </p>
                <p className="mt-1 text-xs text-gray-500">{SEGMENT_LABEL[s].desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Título *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="🎉 Nuevo horario de clases"
          />
          <p className="mt-1 text-xs text-gray-400">{title.length}/100</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Mensaje *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="A partir del lunes 8 amplían los horarios de spinning..."
          />
          <p className="mt-1 text-xs text-gray-400">{body.length}/300</p>
        </div>

        {/* Preview push */}
        {(title || body) && (
          <div>
            <label className="text-xs font-semibold text-gray-600">Vista previa del push</label>
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <span className="text-lg">🏋️</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500">GymApp · ahora</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">
                    {title || '(sin título)'}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">{body || '(sin mensaje)'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={pending || !title.trim() || !body.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
            {pending ? 'Enviando…' : `Enviar a ${SEGMENT_LABEL[segment].label}`}
          </button>
        </div>

        {result && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              result.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {result.ok
              ? `✓ Notificación enviada a ${result.recipients} miembro${
                  result.recipients === 1 ? '' : 's'
                }`
              : `✕ Error: ${result.error}`}
          </div>
        )}
      </div>
    </div>
  );
}
