'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  User,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'gym' | 'owner';

interface GymData {
  gymName: string;
  gymSlug: string;
}

interface OwnerData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function SetupGymForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('gym');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [gymData, setGymData] = useState<GymData>({ gymName: '', gymSlug: '' });
  const [ownerData, setOwnerData] = useState<OwnerData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleGymChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGymData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'gymName') {
        updated.gymSlug = slugify(value);
      }
      return updated;
    });
    setError('');
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOwnerData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleGymNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymData.gymName || !gymData.gymSlug) return;
    if (!/^[a-z0-9-]+$/.test(gymData.gymSlug)) {
      setError('El identificador solo puede contener letras minúsculas, números y guiones');
      return;
    }
    setStep('owner');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ownerData.password !== ownerData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gymName: gymData.gymName,
            gymSlug: gymData.gymSlug,
            firstName: ownerData.firstName,
            lastName: ownerData.lastName,
            email: ownerData.email,
            password: ownerData.password,
            phone: ownerData.phone || undefined,
          }),
        },
      );

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al crear el gym');
        return;
      }

      // Auto-login después del registro
      const loginResult = await signIn('credentials', {
        email: ownerData.email,
        password: ownerData.password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (loginResult?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/login?registered=1');
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = cn(
    'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
    'outline-none ring-offset-background transition-shadow',
    'focus:border-primary focus:ring-2 focus:ring-ring/30',
    'disabled:opacity-50',
  );

  return (
    <div className="space-y-6">
      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {(['gym', 'owner'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : i < ['gym', 'owner'].indexOf(step)
                    ? 'bg-success text-white'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {i < ['gym', 'owner'].indexOf(step) ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium',
                step === s ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {s === 'gym' ? 'Tu gimnasio' : 'Tu cuenta'}
            </span>
            {i < 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Gym info */}
      {step === 'gym' && (
        <form onSubmit={handleGymNext} className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <Building2 className="h-4 w-4" />
            Información del gimnasio
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gymName" className="text-sm font-medium text-foreground">
              Nombre del gimnasio
            </label>
            <input
              id="gymName"
              name="gymName"
              type="text"
              required
              value={gymData.gymName}
              onChange={handleGymChange}
              placeholder="EliteFit Gym"
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gymSlug" className="text-sm font-medium text-foreground">
              Identificador único{' '}
              <span className="font-normal text-muted-foreground text-xs">(URL de tu gym)</span>
            </label>
            <div className="flex items-center gap-0">
              <span className="rounded-l-lg border border-r-0 bg-muted px-3 py-2.5 text-sm text-muted-foreground select-none">
                gymapp.app/
              </span>
              <input
                id="gymSlug"
                name="gymSlug"
                type="text"
                required
                value={gymData.gymSlug}
                onChange={handleGymChange}
                placeholder="elitefit"
                className={cn(inputClass, 'rounded-l-none')}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Solo letras minúsculas, números y guiones
            </p>
          </div>

          <button
            type="submit"
            disabled={!gymData.gymName || !gymData.gymSlug}
            className={cn(
              'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground',
              'transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
            )}
          >
            Continuar
          </button>
        </form>
      )}

      {/* Step 2: Owner info */}
      {step === 'owner' && (
        <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
            <User className="h-4 w-4" />
            Tu cuenta de administrador
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                Nombre
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={ownerData.firstName}
                onChange={handleOwnerChange}
                placeholder="Carlos"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Apellido
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={ownerData.lastName}
                onChange={handleOwnerChange}
                placeholder="Martínez"
                className={inputClass}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={ownerData.email}
              onChange={handleOwnerChange}
              placeholder="carlos@tugimnasio.com"
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-3.5 w-3.5" />
              Contraseña
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={ownerData.password}
                onChange={handleOwnerChange}
                placeholder="Mín. 8 caracteres"
                className={cn(inputClass, 'pr-10')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, una mayúscula, una minúscula y un número
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={ownerData.confirmPassword}
              onChange={handleOwnerChange}
              placeholder="Repite la contraseña"
              className={inputClass}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('gym');
                setError('');
              }}
              className="rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground',
                'transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]',
                'flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Creando gym...' : 'Crear gimnasio'}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <a
          href="/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Inicia sesión
        </a>
      </p>
    </div>
  );
}
