import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Acceso — GymApp', template: '%s | GymApp' },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel izquierdo: formulario */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>

      {/* Panel derecho: branding — solo visible en desktop */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-sidebar relative overflow-hidden">
        {/* Gradiente de fondo */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-transparent to-amber-900/20 pointer-events-none" />

        {/* Contenido central */}
        <div className="relative z-10 text-center px-12 space-y-6">
          {/* Logo mark */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
            >
              <rect width="10" height="28" x="4" y="6" rx="3" fill="#A78BFA" />
              <rect width="10" height="28" x="26" y="6" rx="3" fill="#A78BFA" />
              <rect width="12" height="8" x="14" y="16" rx="3" fill="#FBBF24" />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-white tracking-tight">GymApp</h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Gestión inteligente para gimnasios de élite
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-left max-w-xs mx-auto">
            {[
              { icon: '⚡', text: 'Control de acceso en tiempo real' },
              { icon: '🧠', text: 'IA integrada con ARIA y ZEUS' },
              { icon: '📊', text: 'Analytics y BI ejecutivo' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="text-base">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decoración inferior */}
        <div className="absolute bottom-8 text-zinc-600 text-xs">
          © 2026 GymApp — Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}
