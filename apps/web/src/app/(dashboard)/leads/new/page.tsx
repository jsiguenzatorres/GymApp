import { redirect } from 'next/navigation';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { ArrowLeft } from 'lucide-react';

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

const SOURCES = [
  { label: 'Visita directa', value: 'WALK_IN' },
  { label: 'Sitio web', value: 'WEB' },
  { label: 'Referido', value: 'REFERRAL' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'Facebook', value: 'FACEBOOK' },
  { label: 'Otro', value: 'OTHER' },
];

async function createLeadAction(formData: FormData) {
  'use server';
  const first_name = formData.get('first_name') as string;
  const last_name = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const source = formData.get('source') as string;
  const notes = formData.get('notes') as string;
  const assigned_to = formData.get('assigned_to') as string;

  await serverFetch('/api/v1/leads', {
    method: 'POST',
    body: JSON.stringify({
      first_name,
      last_name,
      email: email || undefined,
      phone: phone || undefined,
      source: source || 'OTHER',
      notes: notes || undefined,
      assigned_to: assigned_to || undefined,
    }),
  });
  redirect('/leads');
}

export default async function NewLeadPage() {
  const staff = await serverFetch<StaffMember[]>('/api/v1/staff');
  const activeStaff = (staff ?? []).filter((s) => s.is_active);

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/leads" className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo lead</h1>
      </div>

      <form
        action={createLeadAction}
        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-5"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="first_name"
              required
              placeholder="Juan"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              name="last_name"
              required
              placeholder="Pérez"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="phone"
              type="tel"
              placeholder="+503 7000-0000"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="juan@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuente</label>
            <select
              name="source"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
            <select
              name="assigned_to"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Sin asignar</option>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Interés en membresía mensual, viene recomendado por..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/leads"
            className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Registrar lead
          </button>
        </div>
      </form>
    </div>
  );
}
