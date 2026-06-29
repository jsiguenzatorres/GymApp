import { BroadcastForm } from './broadcast-form';
import { serverFetch } from '@/lib/server-api';
import { revalidatePath } from 'next/cache';

async function sendBroadcastAction(
  formData: FormData,
): Promise<{ ok: boolean; recipients?: number; error?: string }> {
  'use server';
  const payload = {
    title: formData.get('title') as string,
    body: formData.get('body') as string,
    segment:
      (formData.get('segment') as 'all' | 'all_active' | 'tier_pro' | 'tier_elite' | 'at_risk') ??
      'all_active',
    type: 'BROADCAST',
  };
  if (!payload.title?.trim() || !payload.body?.trim()) {
    return { ok: false, error: 'Título y mensaje son requeridos' };
  }
  const res = await serverFetch<{ recipients: number }>('/api/v1/notifications/admin/broadcast', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  revalidatePath('/broadcast');
  if (!res) return { ok: false, error: 'No se pudo enviar (revisa sesión y permisos)' };
  return { ok: true, recipients: res.recipients };
}

export default function BroadcastPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📢 Mensaje masivo</h1>
        <p className="text-sm text-gray-500">
          Envía una notificación push a un grupo de miembros. Llega al app y se persiste en su
          centro de notificaciones.
        </p>
      </div>

      <BroadcastForm sendAction={sendBroadcastAction} />

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900">
        <p className="font-semibold">💡 Buenas prácticas:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>Limita los broadcasts a 1-2 por semana para no saturar.</li>
          <li>Usa &quot;Riesgo alto&quot; para campañas de retención dirigida.</li>
          <li>Los mensajes muy largos se cortan al mostrar el push en lock screen.</li>
        </ul>
      </div>
    </div>
  );
}
