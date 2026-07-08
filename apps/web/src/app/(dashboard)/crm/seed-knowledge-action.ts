'use server';

import { serverFetch } from '@/lib/server-api';

export async function seedKnowledgeAction(): Promise<{ ok: boolean; error?: string }> {
  const res = await serverFetch('/api/v1/ai/rag/seed', { method: 'POST' });
  if (!res)
    return { ok: false, error: 'No se pudo generar el conocimiento (revisa sesión/permisos)' };
  return { ok: true };
}
