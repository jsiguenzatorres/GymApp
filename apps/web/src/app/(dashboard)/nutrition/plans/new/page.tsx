'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Salad, Search } from 'lucide-react';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
}

const GOALS = [
  { value: 'WEIGHT_LOSS', label: 'Pérdida de peso', desc: 'Déficit calórico controlado' },
  { value: 'MUSCLE_GAIN', label: 'Ganancia muscular', desc: 'Superávit con proteína alta' },
  { value: 'MAINTENANCE', label: 'Mantenimiento', desc: 'Macros equilibrados' },
  { value: 'PERFORMANCE', label: 'Rendimiento', desc: 'Optimización para entrenamiento' },
];

function inputCls(extra = '') {
  return `w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 ${extra}`;
}

export default function NewPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDrop, setShowDrop] = useState(false);

  const [form, setForm] = useState({
    name: '',
    goal: 'MAINTENANCE',
    kcal_target: '2000',
    protein_g: '150',
    carbs_g: '200',
    fat_g: '65',
    notes: '',
  });

  useEffect(() => {
    if (memberSearch.length < 2) {
      setMembers([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/proxy/members?search=${encodeURIComponent(memberSearch)}&limit=6`)
        .then((r) => r.json())
        .then((d: { data?: Member[] } | Member[]) => {
          setMembers(Array.isArray(d) ? d : (d.data ?? []));
          setShowDrop(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember) {
      setError('Selecciona un miembro');
      return;
    }
    if (!form.name.trim()) {
      setError('El nombre del plan es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/proxy/nutrition-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: selectedMember.id,
          name: form.name.trim(),
          goal: form.goal,
          kcal_target: parseInt(form.kcal_target),
          protein_g: parseInt(form.protein_g),
          carbs_g: parseInt(form.carbs_g),
          fat_g: parseInt(form.fat_g),
          notes: form.notes || undefined,
        }),
      });

      if (res.ok) {
        const plan = (await res.json()) as { id: string };
        router.push(`/nutrition/plans/${plan.id}`);
      } else {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        setError(Array.isArray(d.message) ? d.message.join(', ') : (d.message ?? 'Error'));
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  const macroTotal =
    parseInt(form.protein_g) * 4 + parseInt(form.carbs_g) * 4 + parseInt(form.fat_g) * 9;
  const kcalDiff = parseInt(form.kcal_target) - macroTotal;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/nutrition"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a nutrición
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo plan nutricional</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Miembro */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Salad className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-semibold text-gray-900">Miembro</p>
          </div>
          {selectedMember ? (
            <div className="flex items-center justify-between rounded-lg bg-violet-50 border border-violet-200 px-4 py-2.5">
              <span className="text-sm font-medium text-violet-800">
                {selectedMember.first_name} {selectedMember.last_name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-xs text-violet-500 hover:text-violet-800"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  onFocus={() => members.length > 0 && setShowDrop(true)}
                  placeholder="Buscar miembro por nombre..."
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
              </div>
              {showDrop && members.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {members.map((m) => (
                    <li
                      key={m.id}
                      onClick={() => {
                        setSelectedMember(m);
                        setShowDrop(false);
                        setMemberSearch('');
                      }}
                      className="cursor-pointer px-4 py-2.5 text-sm hover:bg-violet-50"
                    >
                      {m.first_name} {m.last_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Info del plan */}
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-900">Detalles del plan</p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Nombre del plan *</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
              placeholder="Ej: Plan pérdida de peso - Fase 1"
              className={inputCls()}
            />
          </div>

          {/* Goal grid */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Objetivo</label>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => set('goal', g.value)}
                  className={`rounded-lg border-2 p-3 text-left transition-all ${form.goal === g.value ? 'border-violet-500 bg-violet-50' : 'border-gray-100 hover:border-violet-200'}`}
                >
                  <p className="text-xs font-semibold text-gray-900">{g.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{g.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Macros */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Objetivos de macros
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Calorías objetivo (kcal)</label>
                <input
                  type="number"
                  min="0"
                  value={form.kcal_target}
                  onChange={(e) => set('kcal_target', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Proteína (g)</label>
                <input
                  type="number"
                  min="0"
                  value={form.protein_g}
                  onChange={(e) => set('protein_g', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Carbohidratos (g)</label>
                <input
                  type="number"
                  min="0"
                  value={form.carbs_g}
                  onChange={(e) => set('carbs_g', e.target.value)}
                  className={inputCls()}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Grasas (g)</label>
                <input
                  type="number"
                  min="0"
                  value={form.fat_g}
                  onChange={(e) => set('fat_g', e.target.value)}
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Macro calc */}
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-xs ${Math.abs(kcalDiff) < 50 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}
            >
              Macros calculan <strong>{macroTotal} kcal</strong> (
              {kcalDiff > 0
                ? `${kcalDiff} kcal bajo el objetivo`
                : `${Math.abs(kcalDiff)} kcal sobre el objetivo`}
              )
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Restricciones alimenticias, alergias, preferencias..."
              className={inputCls('resize-none')}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            href="/nutrition"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear plan'}
          </button>
        </div>
      </form>
    </div>
  );
}
