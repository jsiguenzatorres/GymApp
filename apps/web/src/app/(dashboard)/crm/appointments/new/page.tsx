'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

interface StaffMember {
  id: string;
  user: { first_name: string; last_name: string };
  position: string;
}

const TYPE_OPTIONS = [
  { value: 'CONSULTATION', label: 'Consulta' },
  { value: 'TRAINING', label: 'Sesión de entrenamiento' },
  { value: 'EVALUATION', label: 'Evaluación física' },
  { value: 'FOLLOW_UP', label: 'Seguimiento' },
  { value: 'OTHER', label: 'Otro' },
];

export default function NewAppointmentPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    staffId: '',
    title: '',
    description: '',
    appointmentType: 'CONSULTATION',
    scheduledAt: '',
    durationMin: 60,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/proxy/staff?limit=50')
      .then((r) => r.json())
      .then((d: { data?: StaffMember[] } | StaffMember[]) => {
        const list = Array.isArray(d) ? d : (d.data ?? []);
        setStaff(list);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (memberSearch.length < 2) {
      setMembers([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/proxy/members?search=${encodeURIComponent(memberSearch)}&limit=8`)
        .then((r) => r.json())
        .then((d: { data?: Member[] } | Member[]) => {
          const list = Array.isArray(d) ? d : (d.data ?? []);
          setMembers(list);
          setShowDropdown(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) {
      setError('Selecciona un miembro');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string | number> = {
        memberId: selectedMember.id,
        title: form.title,
        appointmentType: form.appointmentType,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMin: Number(form.durationMin),
      };
      if (form.staffId) body.staffId = form.staffId;
      if (form.description) body.description = form.description;
      if (form.notes) body.notes = form.notes;

      const res = await fetch('/api/proxy/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error');
        setError(msg);
      } else {
        router.push('/crm/appointments');
        router.refresh();
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div>
        <Link
          href="/crm/appointments"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a citas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva cita</h1>
        <p className="text-sm text-gray-500 mt-1">Agenda una consulta o sesión con un miembro</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Member search */}
        <div className="space-y-1.5" ref={searchRef}>
          <label className="text-sm font-medium text-gray-700">Miembro</label>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-lg border border-violet-500 bg-violet-50 px-3 py-2.5">
              <span className="text-sm font-medium text-violet-800">
                {selectedMember.first_name} {selectedMember.last_name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setMemberSearch('');
                }}
                className="text-xs text-violet-500 hover:text-violet-800"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onFocus={() => members.length > 0 && setShowDropdown(true)}
                placeholder="Buscar por nombre..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {showDropdown && members.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setShowDropdown(false);
                        setMemberSearch('');
                      }}
                      className="px-3 py-2.5 text-sm cursor-pointer hover:bg-violet-50 hover:text-violet-800"
                    >
                      {m.first_name} {m.last_name}
                    </li>
                  ))}
                </ul>
              )}
              {memberSearch.length >= 2 && members.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">Sin resultados</p>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Título</label>
          <input
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            placeholder="Ej: Evaluación inicial, sesión de seguimiento..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Type + Staff */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={form.appointmentType}
              onChange={(e) => set('appointmentType', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Asignado a</label>
            <select
              value={form.staffId}
              onChange={(e) => set('staffId', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
            >
              <option value="">Sin asignar</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.user.first_name} {s.user.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Fecha y hora</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => set('scheduledAt', e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Duración (min)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={form.durationMin}
              onChange={(e) => set('durationMin', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            placeholder="Detalles adicionales de la cita..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Link
            href="/crm/appointments"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Agendando...' : 'Agendar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
