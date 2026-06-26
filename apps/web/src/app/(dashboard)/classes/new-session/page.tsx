import { redirect } from 'next/navigation';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { ArrowLeft } from 'lucide-react';

interface ClassType {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
}

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

async function createSessionAction(formData: FormData) {
  'use server';
  const class_type_id = formData.get('class_type_id') as string;
  const scheduled_at = formData.get('scheduled_at') as string;
  const capacity = parseInt(formData.get('capacity') as string, 10);
  const trainer_id = formData.get('trainer_id') as string;
  const room = formData.get('room') as string;
  const notes = formData.get('notes') as string;

  await serverFetch('/api/v1/schedule/admin/sessions', {
    method: 'POST',
    body: JSON.stringify({
      class_type_id,
      scheduled_at: new Date(scheduled_at).toISOString(),
      capacity,
      trainer_id: trainer_id || undefined,
      room: room || undefined,
      notes: notes || undefined,
    }),
  });

  redirect('/classes?tab=schedule');
}

export default async function NewSessionPage() {
  const [types, staff] = await Promise.all([
    serverFetch<ClassType[]>('/api/v1/schedule/admin/class-types'),
    serverFetch<StaffMember[]>('/api/v1/staff'),
  ]);

  const activeTypes = (types ?? []).filter((t) => t.is_active);
  const trainers = (staff ?? []).filter(
    (s) => s.is_active && ['TRAINER', 'GYM_ADMIN', 'GYM_OWNER'].includes(s.role),
  );

  // Default datetime: tomorrow 7am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(7, 0, 0, 0);
  const defaultDatetime = tomorrow.toISOString().slice(0, 16);

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/classes?tab=schedule"
          className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Programar sesión</h1>
      </div>

      <form
        action={createSessionAction}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de clase <span className="text-red-500">*</span>
          </label>
          {activeTypes.length === 0 ? (
            <p className="text-sm text-amber-600">
              No hay tipos activos.{' '}
              <Link href="/classes/new-type" className="underline">
                Crea uno primero.
              </Link>
            </p>
          ) : (
            <select
              name="class_type_id"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Seleccionar...</option>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha y hora <span className="text-red-500">*</span>
          </label>
          <input
            name="scheduled_at"
            type="datetime-local"
            required
            defaultValue={defaultDatetime}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad <span className="text-red-500">*</span>
            </label>
            <input
              name="capacity"
              type="number"
              required
              min={1}
              max={200}
              defaultValue={20}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sala / Espacio</label>
            <input
              name="room"
              placeholder="Sala A, Piscina..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trainer (opcional)</label>
          <select
            name="trainer_id"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            <option value="">Sin asignar</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.first_name} {t.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Instrucciones especiales, equipo requerido..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/classes?tab=schedule"
            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={activeTypes.length === 0}
            className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            Programar sesión
          </button>
        </div>
      </form>
    </div>
  );
}
