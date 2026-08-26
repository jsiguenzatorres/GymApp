'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventInput } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';

interface CalendarItem {
  id: string;
  kind: 'APPOINTMENT' | 'CLASS';
  appointment_type: string;
  title: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
}

// Mismo código de colores que StaffCalendarView (Fases 1-3 del calendario de
// agenda) — se duplica aquí en vez de importarlo para mantener este
// componente mini autocontenido.
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PENDING: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
  CONFIRMED: { bg: '#d8f5e3', border: '#16a34a', text: '#0f5c2c' },
  SCHEDULED: { bg: '#d8f5e3', border: '#16a34a', text: '#0f5c2c' },
  COMPLETED: { bg: '#d8f5e3', border: '#16a34a', text: '#0f5c2c' },
  CANCELLED: { bg: '#f4f2f7', border: '#c9c3d6', text: '#9b93ab' },
  REJECTED: { bg: '#f4f2f7', border: '#c9c3d6', text: '#9b93ab' },
  NO_SHOW: { bg: '#f4f2f7', border: '#c9c3d6', text: '#9b93ab' },
};

const KIND_ICON: Record<string, string> = {
  NUTRITION: '🥗',
  TRAINING: '💪',
  CLASS: '👥',
};

interface Props {
  staffId: string;
  // Se llama con "YYYY-MM-DDTHH:mm" (mismo formato que <input type="datetime-local">)
  // al hacer clic en un hueco vacío del calendario.
  onSlotClick?: (datetimeLocalValue: string) => void;
}

export function MiniStaffCalendar({ staffId, onSlotClick }: Props) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [businessHours, setBusinessHours] = useState<
    { daysOfWeek: number[]; startTime: string; endTime: string }[]
  >([]);
  const [hasSchedule, setHasSchedule] = useState<boolean | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  const loadAppointments = useCallback(
    async (from: string, to: string) => {
      if (!staffId) {
        setEvents([]);
        return;
      }
      const res = await fetch(
        `/api/proxy/staff/${staffId}/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      if (!res.ok) {
        setEvents([]);
        return;
      }
      const data = (await res.json()) as CalendarItem[];
      setEvents(
        data.map((item) => {
          const colors = STATUS_COLORS[item.status] ?? STATUS_COLORS.SCHEDULED;
          const start = new Date(item.scheduled_at);
          const end = new Date(start.getTime() + item.duration_min * 60000);
          const icon = KIND_ICON[item.appointment_type] ?? '📌';
          return {
            id: item.id,
            title: `${icon} ${item.title}`,
            start: start.toISOString(),
            end: end.toISOString(),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
          };
        }),
      );
    },
    [staffId],
  );

  const loadAvailability = useCallback(async () => {
    if (!staffId) {
      setBusinessHours([]);
      setHasSchedule(null);
      return;
    }
    const res = await fetch(`/api/proxy/staff/${staffId}/availability`);
    if (!res.ok) {
      setBusinessHours([]);
      setHasSchedule(null);
      return;
    }
    const data = (await res.json()) as {
      day_of_week: number;
      start_time: string;
      end_time: string;
    }[];
    setHasSchedule(data.length > 0);
    setBusinessHours(
      data.map((b) => ({
        daysOfWeek: [b.day_of_week],
        startTime: b.start_time,
        endTime: b.end_time,
      })),
    );
  }, [staffId]);

  useEffect(() => {
    loadAvailability();
    const api = calendarRef.current?.getApi();
    if (api && staffId) {
      loadAppointments(api.view.activeStart.toISOString(), api.view.activeEnd.toISOString());
    }
    // Solo se re-ejecuta al cambiar de entrenador; loadAppointments/loadAvailability
    // se recrean con la misma referencia estable vía useCallback([staffId]).
  }, [staffId]);

  function handleDateClick(arg: DateClickArg) {
    if (!onSlotClick) return;
    // arg.dateStr viene como "YYYY-MM-DDTHH:mm:ss" (calendario en timeZone="UTC")
    onSlotClick(arg.dateStr.slice(0, 16));
  }

  if (!staffId) return null;

  return (
    <div className="space-y-1.5">
      {hasSchedule === false && (
        <p className="text-xs text-amber-600">
          Este entrenador no tiene horario de trabajo configurado — el calendario no distingue horas
          libres de ocupadas todavía.
        </p>
      )}
      <div className="rounded-lg border border-gray-200 p-2">
        <style>{`.fc .fc-non-business { background: #f4f2f7; } .mini-staff-calendar .fc-toolbar-title { font-size: 0.875rem; }`}</style>
        <div className="mini-staff-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            locale={esLocale}
            height={360}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={false}
            timeZone="UTC"
            events={events}
            businessHours={businessHours.length > 0 ? businessHours : undefined}
            dateClick={handleDateClick}
            datesSet={(arg) => loadAppointments(arg.startStr, arg.endStr)}
          />
        </div>
      </div>
      <p className="text-[11px] text-gray-400">
        Haz clic en un espacio libre del calendario para llenar la fecha y hora automáticamente.
      </p>
    </div>
  );
}
