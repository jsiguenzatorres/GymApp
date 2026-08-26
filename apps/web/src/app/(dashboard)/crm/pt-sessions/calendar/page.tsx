import { StaffCalendarView } from '@/components/staff/staff-calendar-view';

export default function TrainerCalendarPage() {
  return (
    <StaffCalendarView
      role="TRAINER"
      title="Calendario de entrenadores"
      subtitle="Lo que ya tiene agendado cada entrenador — sesiones PT y clases grupales."
      backHref="/crm/pt-sessions/queue"
      emptyStaffLabel="Sin entrenadores activos"
    />
  );
}
