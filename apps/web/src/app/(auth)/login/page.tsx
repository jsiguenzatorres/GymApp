import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Iniciar Sesión' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-md border">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">GymApp</h1>
          <p className="text-muted-foreground text-sm">Ingresa tus credenciales para continuar</p>
        </div>
        {/* LoginForm se implementa en Sprint 1.1 */}
        <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground text-center">
          Formulario de login — Sprint 1.1
        </div>
      </div>
    </div>
  );
}
