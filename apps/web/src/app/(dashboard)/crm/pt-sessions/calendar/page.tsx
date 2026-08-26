'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventInput } from '@fullcalendar/core';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface StaffOption {
  id: string;
  first_name: string;
  last_name: string;
  user: { role: string };
}

interface CalendarAppointment {
  id: string;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
  member: { first_name: string; last_name: string };
}

// Mismo código de colores propuesto para el calendario: PENDING = asignada
// esperando confirmación (azul), CONFIRMED/SCHEDULED/COMPLETED = resuelta
// (verde), el resto = fuera de juego (gris). "Disponible" y "Ocupado" llegan
// en la Fase 2, cuando exista el horario de trabajo del staff.
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  CONFIRMED: { bg: '#d8f5e3', border: '#16a34a', text: '#0f5c2c' },
  SCHEDULED: { bg: '#d8f5e3', border: '#16a34a', text: '#0f5c2c' },
  COMPLETED: { bg: '#d8f5e3', border: '#16a34a', text: '#0f5c2c' },
  CANCELLED: { bg: '#f4f2f7', border: '#c9c3d6', text: '#9b93ab' },
  REJECTED: { bg: '#f4f2f7', border: '#c9c3d6', text: '#9b93ab' },
  NO_SHOW: { bg: '#f4f2f7', border: '#c9c3d6', text: '#9b93ab' },
};

const ROLE_LABEL: Record<string, string> = {
  TRAINER: 'Entrenador',
  NUTRITIONIST: 'Nutricionista',
};

export default function StaffCalendarPage() {
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    fetch('/api/proxy/staff?role=TRAINER,NUTRITIONIST&isActive=true')
      .then((r) => r.json())
      .then((data: StaffOption[]) => {
        const list = data ?? [];
        setStaffList(list);
        if (list.length > 0) setSelectedStaffId(list[0].id);
      });
  }, []);

  const loadAppointments = useCallback(async (staffId: string, from: string, to: string) => {
    if (!staffId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/proxy/staff/${staffId}/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      if (!res.ok) {
        setEvents([]);
        return;
      }
      const data = (await res.json()) as CalendarAppointment[];
      setEvents(
        data.map((a) => {
          const colors = STATUS_COLORS[a.status] ?? STATUS_COLORS.SCHEDULED;
          const start = new Date(a.scheduled_at);
          const end = new Date(start.getTime() + a.duration_min * 60000);
          const kind = a.appointment_type === 'NUTRITION' ? '🥗' : '💪';
          return {
            id: a.id,
            title: `${kind} ${a.member.first_name} ${a.member.last_name}`,
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDatesSet = useCallback(
    (arg: { startStr: string; endStr: string }) => {
      loadAppointments(selectedStaffId, arg.startStr, arg.endStr);
    },
    [selectedStaffId, loadAppointments],
  );

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api && selectedStaffId) {
      loadAppointments(
        selectedStaffId,
        api.view.activeStart.toISOString(),
        api.view.activeEnd.toISOString(),
      );
    }
    // Deliberadamente solo [selectedStaffId] — el rango de fechas lo maneja
    // datesSet cuando el usuario navega el calendario, no este efecto.
  }, [selectedStaffId]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/crm/pt-sessions/queue"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario de agenda</h1>
            <p className="text-sm text-gray-500">
              Lo que ya tiene agendado cada entrenador o nutricionista — sesiones PT y citas de
              nutrición.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            {staffList.length === 0 && <option value="">Sin entrenadores activos</option>}
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} · {ROLE_LABEL[s.user.role] ?? s.user.role}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-2.5 text-xs text-gray-500 shadow-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#3b82f6' }} />
          Asignada, sin confirmar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#16a34a' }} />
          Confirmada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#c9c3d6' }} />
          Cancelada / rechazada
        </span>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,dayGridMonth',
          }}
          locale={esLocale}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          nowIndicator
          events={events}
          datesSet={handleDatesSet}
        />
      </div>
    </div>
  );
}
