'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface ShoppingCategory {
  name: string;
  items: { name: string; quantity: string; purpose?: string }[];
}
interface ShoppingListResult {
  estimated_cost_usd?: number;
  categories: ShoppingCategory[];
  tips: string[];
}

export default function ShoppingList({ memberId }: { memberId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShoppingListResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy/nutrition/shopping-list/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });
      const d = (await res.json()) as ShoppingListResult & { success: boolean; error?: string };
      if (d.success !== false && d.categories?.length) {
        setResult(d);
      } else {
        setError(d.error ?? 'No se pudo generar la lista de compras');
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-violet-600" />
          <p className="text-sm font-semibold text-gray-900">Lista de compras semanal</p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {loading ? 'Generando...' : 'Generar'}
        </button>
      </div>

      <div className="px-5 py-4">
        {error && <p className="text-xs text-red-600">{error}</p>}
        {!result && !error && (
          <p className="text-xs text-gray-400">
            Genera una lista basada en el plan activo del miembro (o 2000 kcal balanceado si no
            tiene plan).
          </p>
        )}
        {result && (
          <div className="space-y-3">
            {result.estimated_cost_usd !== undefined && (
              <p className="text-xs text-gray-500">
                Costo estimado:{' '}
                <span className="font-semibold text-gray-800">${result.estimated_cost_usd}</span>
              </p>
            )}
            {result.categories.map((cat) => (
              <div key={cat.name}>
                <p className="text-xs font-semibold text-gray-700 mb-1">{cat.name}</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {cat.items.map((it, i) => (
                    <li key={i}>
                      · {it.quantity} {it.name}
                      {it.purpose && <span className="text-gray-400"> — {it.purpose}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {result.tips.length > 0 && (
              <div className="text-[11px] text-violet-700 bg-violet-50 rounded-lg p-2 space-y-0.5">
                {result.tips.map((t, i) => (
                  <p key={i}>💡 {t}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
