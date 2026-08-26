'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventInput } from '@fullcalendar/core';
import {
  ArrowLeft,
  Loader2,
  Clock,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface StaffOption {
  id: string;
  first_name: string;
  last_name: string;
}

interface CalendarItem {
  id: string;
  kind: 'APPOINTMENT' | 'CLASS';
  appointment_type: string;
  title: string;
  status: string;
  scheduled_at: string;
  duration_min: number;
}

interface AvailabilityBlock {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface FreeRange {
  start: string;
  end: string;
}

interface AvailableSlotsResponse {
  date: string;
  durationMin: number;
  hasAvailability: boolean;
  freeRanges: FreeRange[];
}

// Mismo código de colores propuesto para el calendario: PENDING = asignada
// esperando confirmación (azul), CONFIRMED/SCHEDULED/COMPLETED = resuelta
// (verde), el resto = fuera de juego (gris). Aplica igual a citas 1:1 y a
// clases grupales (ClassSession usa el mismo vocabulario de status).
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

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function emptyBlock(dayOfWeek: number): AvailabilityBlock {
  return { dayOfWeek, startTime: '06:00', endTime: '14:00' };
}

interface Props {
  role: 'TRAINER' | 'NUTRITIONIST';
  title: string;
  subtitle: string;
  backHref: string;
  emptyStaffLabel: string;
}

export function StaffCalendarView({ role, title, subtitle, backHref, emptyStaffLabel }: Props) {
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Horario de trabajo (Fase 2)
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<AvailabilityBlock[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Buscador de disponibilidad (Fase 3)
  const [showFinder, setShowFinder] = useState(false);
  const [finderDate, setFinderDate] = useState('');
  const [finderDuration, setFinderDuration] = useState('60');
  const [finderResult, setFinderResult] = useState<AvailableSlotsResponse | null>(null);
  const [finderLoading, setFinderLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/proxy/staff?role=${role}&isActive=true`)
      .then((r) => r.json())
      .then((data: StaffOption[]) => {
        const list = data ?? [];
        setStaffList(list);
        if (list.length > 0) setSelectedStaffId(list[0].id);
      });
  }, [role]);

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
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async (staffId: string) => {
    if (!staffId) {
      setAvailability([]);
      return;
    }
    setLoadingSchedule(true);
    try {
      const res = await fetch(`/api/proxy/staff/${staffId}/availability`);
      if (res.ok) {
        const data = (await res.json()) as {
          day_of_week: number;
          start_time: string;
          end_time: string;
        }[];
        setAvailability(
          data.map((b) => ({
            dayOfWeek: b.day_of_week,
            startTime: b.start_time,
            endTime: b.end_time,
          })),
        );
      } else {
        setAvailability([]);
      }
    } finally {
      setLoadingSchedule(false);
    }
  }, []);

  const handleDatesSet = useCallback(
    (arg: { startStr: string; endStr: string }) => {
      loadAppointments(selectedStaffId, arg.startStr, arg.endStr);
    },
    [selectedStaffId, loadAppointments],
  );

  useEffect(() => {
    setEditingSchedule(false);
    setShowFinder(false);
    setFinderResult(null);
    loadAvailability(selectedStaffId);
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

  function openScheduleEditor() {
    setScheduleDraft(availability.length > 0 ? availability : []);
    setEditingSchedule(true);
  }

  function addDraftBlock(dayOfWeek: number) {
    setScheduleDraft((prev) => [...prev, emptyBlock(dayOfWeek)]);
  }

  function removeDraftBlock(index: number) {
    setScheduleDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDraftBlock(index: number, patch: Partial<AvailabilityBlock>) {
    setScheduleDraft((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  async function saveSchedule() {
    if (!selectedStaffId) return;
    setSavingSchedule(true);
    try {
      const res = await fetch(`/api/proxy/staff/${selectedStaffId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: scheduleDraft }),
      });
      if (res.ok) {
        setAvailability(scheduleDraft);
        setEditingSchedule(false);
      }
    } finally {
      setSavingSchedule(false);
    }
  }

  async function searchAvailability() {
    if (!selectedStaffId || !finderDate) return;
    setFinderLoading(true);
    setFinderResult(null);
    try {
      const res = await fetch(
        `/api/proxy/staff/${selectedStaffId}/available-slots?date=${finderDate}&durationMin=${finderDuration}`,
      );
      if (res.ok) {
        setFinderResult((await res.json()) as AvailableSlotsResponse);
      }
    } finally {
      setFinderLoading(false);
    }
  }

  function fmtSlotTime(iso: string) {
    // timeZone: 'UTC' — mismo motivo que timeZone="UTC" en FullCalendar más
    // abajo: todo el módulo trata los horarios como "HH:mm literal", sin
    // conversión de zona horaria.
    return new Date(iso).toLocaleTimeString('es-SV', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
  }

  // FullCalendar sombrea automáticamente todo lo que NO cae dentro de
  // businessHours (clase .fc-non-business) — así se ve "ocupado por defecto,
  // fuera de horario" sin tener que calcular huecos a mano.
  const businessHours = availability.map((b) => ({
    daysOfWeek: [b.dayOfWeek],
    startTime: b.startTime,
    endTime: b.endTime,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          >
            {staffList.length === 0 && <option value="">{emptyStaffLabel}</option>}
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={openScheduleEditor}
            disabled={!selectedStaffId}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            Editar horario
          </button>
          <button
            type="button"
            onClick={() => setShowFinder((v) => !v)}
            disabled={!selectedStaffId}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            Buscar disponibilidad
          </button>
        </div>
      </div>

      {showFinder && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-900">
            Buscar disponibilidad — {staffList.find((s) => s.id === selectedStaffId)?.first_name}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Fecha</label>
              <input
                type="date"
                value={finderDate}
                onChange={(e) => setFinderDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Duración (min)</label>
              <input
                type="number"
                min="15"
                step="15"
                value={finderDuration}
                onChange={(e) => setFinderDuration(e.target.value)}
                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <button
              type="button"
              onClick={searchAvailability}
              disabled={!finderDate || finderLoading}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {finderLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {finderResult && (
            <div className="pt-1">
              {!finderResult.hasAvailability ? (
                <p className="flex items-center gap-1.5 text-sm text-red-600">
                  <XCircle className="h-4 w-4" />
                  Sin disponibilidad ese día para {finderResult.durationMin} min (fuera de horario
                  de trabajo o completo)
                </p>
              ) : (
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Huecos libres de al menos {finderResult.durationMin} min:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {finderResult.freeRanges.map((r, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        {fmtSlotTime(r.start)} – {fmtSlotTime(r.end)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {editingSchedule && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">
              Horario de trabajo — {staffList.find((s) => s.id === selectedStaffId)?.first_name}
            </p>
            <p className="text-xs text-gray-400">
              Define en qué bloques horarios está disponible cada día. Puedes agregar varios bloques
              por día (ej. mañana y tarde).
            </p>
          </div>

          <div className="space-y-3">
            {DAY_NAMES.map((dayName, dayOfWeek) => {
              const blocksForDay = scheduleDraft
                .map((b, i) => ({ ...b, i }))
                .filter((b) => b.dayOfWeek === dayOfWeek);
              return (
                <div
                  key={dayOfWeek}
                  className="flex flex-wrap items-start gap-3 border-b border-gray-50 pb-3 last:border-0"
                >
                  <span className="w-24 shrink-0 pt-1.5 text-sm font-medium text-gray-700">
                    {dayName}
                  </span>
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {blocksForDay.length === 0 && (
                      <span className="pt-1.5 text-xs text-gray-400">Sin horario asignado</span>
                    )}
                    {blocksForDay.map((b) => (
                      <div
                        key={b.i}
                        className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2 py-1.5"
                      >
                        <input
                          type="time"
                          value={b.startTime}
                          onChange={(e) => updateDraftBlock(b.i, { startTime: e.target.value })}
                          className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs"
                        />
                        <span className="text-xs text-gray-400">–</span>
                        <input
                          type="time"
                          value={b.endTime}
                          onChange={(e) => updateDraftBlock(b.i, { endTime: e.target.value })}
                          className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => removeDraftBlock(b.i)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addDraftBlock(dayOfWeek)}
                      className="flex items-center gap-1 rounded-lg border border-dashed border-gray-300 px-2 py-1.5 text-xs text-gray-500 hover:border-violet-400 hover:text-violet-600"
                    >
                      <Plus className="h-3 w-3" /> Agregar bloque
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setEditingSchedule(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveSchedule}
              disabled={savingSchedule}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {savingSchedule ? 'Guardando...' : 'Guardar horario'}
            </button>
          </div>
        </div>
      )}

      {!editingSchedule && !loadingSchedule && availability.length === 0 && selectedStaffId && (
        <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
          Todavía no tiene horario de trabajo configurado — el calendario se ve igual todo el tiempo
          hasta que se defina uno.
        </div>
      )}

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
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-gray-300 bg-gray-100" />
          Fuera de horario de trabajo
        </span>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <style>{`.fc .fc-non-business { background: #f4f2f7; }`}</style>
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
          // El horario de trabajo se guarda y calcula en el backend como
          // "HH:mm literal" (sin conversión de zona horaria — un solo gym,
          // una sola zona horaria). FullCalendar por defecto interpretaría
          // los timestamps ISO y los businessHours en la zona horaria LOCAL
          // del navegador, lo que podría desalinear el sombreado visual del
          // buscador de disponibilidad (que sí calcula en UTC "literal").
          // Forzamos timeZone="UTC" para que todo el calendario use la misma
          // convención que el backend, sin conversiones.
          timeZone="UTC"
          events={events}
          businessHours={businessHours.length > 0 ? businessHours : undefined}
          datesSet={handleDatesSet}
        />
      </div>
    </div>
  );
}
