'use client';

import { useState, useTransition } from 'react';
import { serverFetch } from '@/lib/server-api';

async function seedKnowledgeAction(): Promise<{ ok: boolean; error?: string }> {
  'use server';
  const res = await serverFetch('/api/v1/ai/rag/seed', { method: 'POST' });
  if (!res)
    return { ok: false, error: 'No se pudo generar el conocimiento (revisa sesión/permisos)' };
  return { ok: true };
}

export function SeedKnowledgeButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            setResult(await seedKnowledgeAction());
          });
        }}
        disabled={pending}
        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title="Genera el conocimiento base de ARIA a partir de los datos actuales del gym"
      >
        {pending ? 'Generando...' : '🧠 Sembrar conocimiento'}
      </button>
      {result && (
        <p className={`text-xs ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
          {result.ok ? '✓ Conocimiento actualizado' : result.error}
        </p>
      )}
    </div>
  );
}
