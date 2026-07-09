'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Building2, User } from 'lucide-react';

interface GymData {
  gymName: string;
  gymSlug: string;
}

interface OwnerData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

const EMPTY_GYM: GymData = { gymName: '', gymSlug: '' };
const EMPTY_OWNER: OwnerData = { firstName: '', lastName: '', email: '', password: '', phone: '' };

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

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400 ${extra}`;
}

export function CreateGymForm() {
  const [gymData, setGymData] = useState<GymData>(EMPTY_GYM);
  const [ownerData, setOwnerData] = useState<OwnerData>(EMPTY_OWNER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdGym, setCreatedGym] = useState<{ name: string; ownerEmail: string } | null>(null);

  function handleGymChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setGymData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'gymName') updated.gymSlug = slugify(value);
      return updated;
    });
    setError('');
  }

  function handleOwnerChange(e: React.ChangeEvent<HTMLInputElement>) {
    setOwnerData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[a-z0-9-]+$/.test(gymData.gymSlug)) {
      setError('El identificador solo puede contener letras minúsculas, números y guiones');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/proxy/auth/register', {
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
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        setError(body.message ?? 'Error al crear el gym');
        return;
      }

      setCreatedGym({ name: gymData.gymName, ownerEmail: ownerData.email });
      setGymData(EMPTY_GYM);
      setOwnerData(EMPTY_OWNER);
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }

  if (createdGym) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 text-sm font-semibold text-emerald-900">
          Gym &quot;{createdGym.name}&quot; creado correctamente
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          Comparte las credenciales con el dueño ({createdGym.ownerEmail}) para que inicie sesión.
        </p>
        <button
          onClick={() => setCreatedGym(null)}
          className="mt-4 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Crear otro gym
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Building2 className="h-4 w-4" />
          Información del gimnasio
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nombre del gimnasio *
            </label>
            <input
              name="gymName"
              required
              value={gymData.gymName}
              onChange={handleGymChange}
              placeholder="EliteFit Gym"
              className={inputCls()}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Identificador único *
            </label>
            <input
              name="gymSlug"
              required
              value={gymData.gymSlug}
              onChange={handleGymChange}
              placeholder="elitefit"
              className={inputCls()}
              disabled={isLoading}
            />
            <p className="mt-0.5 text-xs text-gray-400">
              Solo letras minúsculas, números y guiones
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">
          <User className="h-4 w-4" />
          Cuenta del dueño del gimnasio
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre *</label>
            <input
              name="firstName"
              required
              value={ownerData.firstName}
              onChange={handleOwnerChange}
              placeholder="Carlos"
              className={inputCls()}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Apellido *</label>
            <input
              name="lastName"
              required
              value={ownerData.lastName}
              onChange={handleOwnerChange}
              placeholder="Martínez"
              className={inputCls()}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email *</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="off"
              value={ownerData.email}
              onChange={handleOwnerChange}
              placeholder="carlos@tugimnasio.com"
              className={inputCls()}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Teléfono</label>
            <input
              name="phone"
              value={ownerData.phone}
              onChange={handleOwnerChange}
              placeholder="+503 7000 0000"
              className={inputCls()}
              disabled={isLoading}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Contraseña temporal *
            </label>
            <input
              name="password"
              type="text"
              required
              autoComplete="off"
              value={ownerData.password}
              onChange={handleOwnerChange}
              placeholder="Mín. 8 caracteres, una mayúscula, una minúscula y un número"
              className={inputCls()}
              disabled={isLoading}
            />
            <p className="mt-0.5 text-xs text-gray-400">
              Compártela con el dueño de forma segura — puede cambiarla luego desde su perfil.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Creando gym…' : 'Crear gimnasio'}
      </button>
    </form>
  );
}
