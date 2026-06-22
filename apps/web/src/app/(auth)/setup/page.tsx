import type { Metadata } from 'next';
import { SetupGymForm } from '@/components/auth/setup-gym-form';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export const metadata: Metadata = { title: 'Crear Gimnasio' };

export default function SetupPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <rect
                  width="5"
                  height="14"
                  x="2"
                  y="3"
                  rx="1.5"
                  fill="currentColor"
                  className="text-primary"
                />
                <rect
                  width="5"
                  height="14"
                  x="13"
                  y="3"
                  rx="1.5"
                  fill="currentColor"
                  className="text-primary"
                />
                <rect
                  width="6"
                  height="4"
                  x="7"
                  y="8"
                  rx="1.5"
                  fill="currentColor"
                  className="text-amber-500"
                />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">GymApp</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Crea tu gimnasio</h1>
          <p className="text-sm text-muted-foreground">
            Configura tu espacio en minutos. Sin tarjeta de crédito.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <SetupGymForm />
    </div>
  );
}
