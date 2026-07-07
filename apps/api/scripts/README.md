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

---

## `rehost-exercise-media.mjs`

Descarga las imágenes y videos que actualmente están **hot-link a wger.de** y los rehospeda en Supabase Storage, actualizando las URLs en la BD. Útil si en producción wger.de empieza a fallar, ralentizar o si quieres independencia total.

### Antes de correrlo

1. Crear bucket en Supabase Storage:
   - Dashboard → Storage → New bucket
   - Name: `exercise-media`
   - **Public bucket: ✅ ON**
   - (Opcional) usar otro nombre con la variable `SUPABASE_EXERCISE_BUCKET`

2. Verificar variables en env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (ya configuradas para avatars).

### Uso

```bash
# Probar sin escribir nada (cuenta y muestra una muestra)
pnpm --filter api exec node scripts/rehost-exercise-media.mjs --dry-run

# Probar con los primeros 10 ejercicios (validar antes de procesar todo)
pnpm --filter api exec node scripts/rehost-exercise-media.mjs --limit=10

# Solo imágenes / solo videos
pnpm --filter api exec node scripts/rehost-exercise-media.mjs --media=images
pnpm --filter api exec node scripts/rehost-exercise-media.mjs --media=videos

# Procesar TODO (recomendado después de validar con --dry-run y --limit)
pnpm --filter api exec node scripts/rehost-exercise-media.mjs
```

### Cómo es idempotente

Detecta si una URL ya NO contiene `wger.de` — esas las salta sin re-descargar. Puedes re-correrlo cuantas veces quieras.

### Volumen estimado

- ~1,079 imágenes (~80KB c/u) ≈ 85MB
- ~39 videos (.MOV, ~5MB c/u) ≈ 195MB
- **Total ≈ 280MB** — cabe en free tier de Supabase Storage (1GB).

### Tiempo

30-60 minutos sin interrupciones (descarga + upload secuencial). Si una descarga falla, la conserva con la URL original y continúa con la siguiente.

---

## `seed-food-items.mjs`

Pobla `food_items` (D-38) con ~148 alimentos comunes: proteínas, lácteos, carbohidratos base, legumbres, comidas típicas de El Salvador/CA (pupusas, tamales, casamiento, etc.), frutas, vegetales, frutos secos, aceites, bebidas, fast food y dulces. Macros por 100g aproximadas (USDA + tablas locales). Se insertan como alimentos **globales** (`gym_id = null`), visibles para todos los gyms.

### Uso

```bash
# Probar sin escribir a la BD
pnpm --filter api exec node scripts/seed-food-items.mjs --dry-run

# Insertar (idempotente por nombre — re-correrlo no duplica nada)
pnpm --filter api exec node scripts/seed-food-items.mjs
```
