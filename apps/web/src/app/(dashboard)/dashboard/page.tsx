import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground text-sm">Resumen de actividad del gimnasio</p>
      </div>
      {/* KPI cards y gráficas se implementan en Sprint 1.7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Miembros Activos', 'Ingresos del Mes', 'Check-ins Hoy', 'Riesgo de Churn'].map(
          (label) => (
            <div key={label} className="rounded-lg border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1">—</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
