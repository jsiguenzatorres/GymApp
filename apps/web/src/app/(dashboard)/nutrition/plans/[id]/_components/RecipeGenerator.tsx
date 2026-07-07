'use client';

import { useState } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';

interface Recipe {
  title: string;
  description: string;
  servings: number;
  prep_time_min: number;
  cook_time_min: number;
  ingredients: { name: string; quantity: string; notes?: string }[];
  steps: string[];
  macros_per_serving: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  tips: string[];
}

const QUICK_INGREDIENTS = [
  'pollo',
  'res',
  'huevo',
  'arroz',
  'frijoles',
  'tortilla',
  'tomate',
  'aguacate',
  'avena',
  'atún',
];

export default function RecipeGenerator() {
  const [selected, setSelected] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(ing: string) {
    setSelected((prev) => (prev.includes(ing) ? prev.filter((i) => i !== ing) : [...prev, ing]));
  }

  async function generate() {
    const extra = customIngredient
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const ingredients = [...selected, ...extra];
    if (ingredients.length === 0) {
      setError('Selecciona o escribe al menos un ingrediente');
      return;
    }
    setLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const res = await fetch('/api/proxy/nutrition/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, preferences: preferences || undefined }),
      });
      const d = (await res.json()) as { success: boolean; recipe: Recipe | null; error?: string };
      if (d.success && d.recipe) {
        setRecipe(d.recipe);
      } else {
        setError(d.error ?? 'No se pudo generar la receta');
      }
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <ChefHat className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-semibold text-gray-900">Generador de recetas IA</p>
      </div>

      <div className="px-5 py-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_INGREDIENTS.map((ing) => (
            <button
              key={ing}
              type="button"
              onClick={() => toggle(ing)}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                selected.includes(ing)
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-violet-200'
              }`}
            >
              {ing}
            </button>
          ))}
        </div>

        <input
          value={customIngredient}
          onChange={(e) => setCustomIngredient(e.target.value)}
          placeholder="Otros ingredientes (separados por coma)"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        />
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          rows={2}
          placeholder="Preferencias (alergias, restricciones, tiempo disponible)..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:border-violet-500 focus:outline-none"
        />

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {loading ? 'Generando...' : 'Generar receta'}
        </button>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {recipe && (
          <div className="rounded-lg bg-gray-50 p-4 space-y-3 mt-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{recipe.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{recipe.description}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {recipe.servings} porciones · {recipe.prep_time_min}min prep ·{' '}
                {recipe.cook_time_min}min cocción
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Ingredientes</p>
              <ul className="text-xs text-gray-600 space-y-0.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i}>
                    · {ing.quantity} {ing.name}
                    {ing.notes && <span className="text-gray-400"> ({ing.notes})</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1">Preparación</p>
              <ol className="text-xs text-gray-600 space-y-0.5 list-decimal list-inside">
                {recipe.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
            <div className="flex gap-3 text-[11px] text-gray-500">
              <span>{recipe.macros_per_serving.kcal} kcal</span>
              <span>P: {recipe.macros_per_serving.protein_g}g</span>
              <span>C: {recipe.macros_per_serving.carbs_g}g</span>
              <span>G: {recipe.macros_per_serving.fat_g}g</span>
            </div>
            {recipe.tips.length > 0 && (
              <div className="text-[11px] text-violet-700 bg-violet-50 rounded-lg p-2 space-y-0.5">
                {recipe.tips.map((t, i) => (
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
