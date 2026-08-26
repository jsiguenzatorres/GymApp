import { StaffCalendarView } from '@/components/staff/staff-calendar-view';

export default function NutritionistCalendarPage() {
  return (
    <StaffCalendarView
      role="NUTRITIONIST"
      title="Calendario de nutricionistas"
      subtitle="Lo que ya tiene agendado cada nutricionista — citas de nutrición."
      backHref="/nutrition"
      emptyStaffLabel="Sin nutricionistas activos"
    />
  );
}
