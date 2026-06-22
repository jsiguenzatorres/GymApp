'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormState {
  email: string;
  password: string;
  totp: string;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [form, setForm] = useState<FormState>({ email: '', password: '', totp: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        totp: form.totp || undefined,
        redirect: false,
        callbackUrl,
      });

      if (!result?.ok) {
        const errMsg = result?.error ?? 'Credenciales inválidas';
        if (errMsg === 'two_fa_required') {
          setShowTotp(true);
          setError('Ingresa tu código de autenticación de dos factores');
        } else if (
          errMsg.toLowerCase().includes('two_fa') ||
          errMsg.toLowerCase().includes('2fa')
        ) {
          setShowTotp(true);
          setError('Se requiere código 2FA');
        } else {
          setError('Email o contraseña incorrectos');
        }
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Error global */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="admin@tugimnasio.com"
          className={cn(
            'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
            'outline-none ring-offset-background transition-shadow',
            'focus:border-primary focus:ring-2 focus:ring-ring/30',
            'disabled:opacity-50',
          )}
          disabled={isLoading}
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Contraseña
          </label>
          <a
            href="/reset-password"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={cn(
              'w-full rounded-lg border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none ring-offset-background transition-shadow',
              'focus:border-primary focus:ring-2 focus:ring-ring/30',
              'disabled:opacity-50',
            )}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Toggle 2FA */}
      {!showTotp && (
        <button
          type="button"
          onClick={() => setShowTotp(true)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Tengo autenticación de dos factores (2FA)
        </button>
      )}

      {/* Campo TOTP */}
      {showTotp && (
        <div className="space-y-1.5 animate-fade-in">
          <label
            htmlFor="totp"
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            Código de verificación (2FA)
          </label>
          <input
            id="totp"
            name="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={form.totp}
            onChange={handleChange}
            placeholder="000000"
            className={cn(
              'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground tracking-widest text-center',
              'outline-none ring-offset-background transition-shadow',
              'focus:border-primary focus:ring-2 focus:ring-ring/30',
              'disabled:opacity-50',
            )}
            disabled={isLoading}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Ingresa el código de 6 dígitos de tu aplicación autenticadora
          </p>
        </div>
      )}

      {/* Botón submit */}
      <button
        type="submit"
        disabled={isLoading || !form.email || !form.password}
        className={cn(
          'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground',
          'transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          'flex items-center justify-center gap-2',
        )}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </button>

      {/* Link registro */}
      <p className="text-center text-sm text-muted-foreground">
        ¿Eres nuevo?{' '}
        <a
          href="/setup"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Crea tu gimnasio
        </a>
      </p>
    </form>
  );
}
