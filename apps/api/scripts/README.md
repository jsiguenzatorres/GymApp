# Scripts del API

Scripts de mantenimiento y data import para el backend NestJS.

## `import-exercises.mjs`

Importa biblioteca masiva de ejercicios desde dos fuentes gratuitas:

- **Capa 1: free-exercise-db** — UNLICENSE (dominio público), ~870 ejercicios con instrucciones
- **Capa 2: wger.de API** — CC-BY-SA, ~845 ejercicios, prefiere traducción al español si está disponible

Los registros se insertan como **ejercicios globales** (`gym_id = null`) por defecto, así son visibles para todos los gyms. Pasa `--gym-id=<uuid>` para asociarlos a un gym específico.

### Requisitos

- `DATABASE_URL` configurada (lee el `.env` del workspace `api`)
- Conexión a internet (descarga datasets en runtime)

### Uso

Desde la raíz del repo:

```bash
# Importar ambas fuentes (recomendado)
pnpm --filter api exec node scripts/import-exercises.mjs

# Sólo free-exercise-db
pnpm --filter api exec node scripts/import-exercises.mjs --source=free

# Sólo wger.de
pnpm --filter api exec node scripts/import-exercises.mjs --source=wger

# Probar sin escribir a la BD (ver muestra y conteo)
pnpm --filter api exec node scripts/import-exercises.mjs --dry-run

# Importar para un gym específico
pnpm --filter api exec node scripts/import-exercises.mjs --gym-id=8bcc228c-0a5a-4729-8350-82c76663fe10
```

### Qué hace internamente

1. **Descarga**: ambas fuentes en memoria
2. **Normaliza**: mapea músculos, equipamiento, categoría y dificultad al vocabulario interno (`BICEPS`, `BARBELL`, `STRENGTH`, `BEGINNER`, etc.)
3. **Dedup**: si dos fuentes dan el mismo ejercicio (por nombre normalizado), conserva el que tenga más datos (más músculos + descripción)
4. **Insert idempotente**: detecta ejercicios ya existentes en la BD por nombre normalizado y los omite. Re-correrlo no duplica nada.

### Resultado esperado

- ~870 ejercicios desde free-exercise-db (todos en inglés)
- ~600-800 ejercicios adicionales desde wger (mezcla inglés/español según traducción comunitaria)
- Tras dedup: **~1,200-1,500 ejercicios únicos** en la tabla `exercises`

### Licencias y atribución

- `free-exercise-db` (Unlicense) — sin obligación legal, sin atribución requerida
- `wger.de` (CC-BY-SA 3.0/4.0) — al usar contenido textual literal hay que mencionar la fuente. Recomendación: incluir en la página "Acerca de" o créditos:
  > Catálogo de ejercicios basado en free-exercise-db (dominio público) y wger.de (CC-BY-SA).

Ver `Diseño/Ver2/Investigacion_Fuentes_Biblioteca_Ejercicios.md` para el análisis completo y la capa 3 (videos profesionales MuscleWiki, comercial $20-60 único, post-lanzamiento).
