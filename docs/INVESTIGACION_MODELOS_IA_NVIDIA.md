# Investigación: modelos de IA de NVIDIA NIM como respaldo de Gemini

> Julio 2026 — origen: el gym tiene varias API keys de Gemini Pro (licencia docente
> universitaria de un socio), así que Gemini rara vez falla del todo. Aun así, se
> quería una cadena de respaldo real para que ningún asistente (ARIA, ZEUS, Business
> Coach, Nutrición IA) se quede mudo si Gemini falla por completo (cuota agotada,
> key revocada, incidente de Google, etc.).

## 1. Qué se implementó

Cadena de **3 niveles** para todos los asistentes de **texto** (no visión, no OCR):

1. **Gemini** (primario) — `gemini-2.5-flash-lite`, varias API keys con rotación automática.
2. **Gemma 4 31B** vía NVIDIA NIM (secundario) — rápido (~600-1500ms a primer token),
   solo texto. Se usa desde antes de esta ronda para ARIA.
3. **Qwen3.5 397B-A17B** vía NVIDIA NIM (terciario, nuevo) — modelo mucho más grande
   (397B total) pero de tipo MoE con solo ~17B parámetros activos por token, lo que en
   teoría lo mantiene razonablemente rápido pese a su tamaño. Además es multimodal
   (texto + imagen), aunque hoy solo se usa para texto. Es el último recurso: solo se
   intenta si Gemini Y Gemma ya fallaron ambos.

### Dónde vive el código

- `apps/api/src/modules/ai/nvidia-nim.service.ts` — cliente HTTP hacia NVIDIA NIM
  (`https://integrate.api.nvidia.com/v1/chat/completions`, compatible con OpenAI).
  Ahora soporta un modelo secundario (`this.model`, Gemma) y uno terciario
  (`this.tertiaryModel`, Qwen) vía `chat(..., model?)` y el atajo `chatTertiary(...)`.
- `apps/api/src/modules/ai/ai-fallback.service.ts` — **nuevo**. Orquesta los 3 niveles
  en un solo método (`chat(systemPrompt, message, history)`), devuelve
  `{ response, provider: 'gemini'|'gemma'|'qwen' }`. Todos los asistentes de texto
  ahora llaman a este servicio en vez de manejar el try/catch de Gemini+NVIDIA a mano.
- Registrado en `AiModule` (`@Global()`), así que cualquier servicio lo puede inyectar
  sin tocar imports de módulos.

### Quién lo usa hoy

| Asistente                                     | Archivo                | Método                       |
| --------------------------------------------- | ---------------------- | ---------------------------- |
| ARIA (chat CRM)                               | `crm.service.ts`       | `ariaChat`                   |
| ARIA (detectar miembro mencionado por nombre) | `crm.service.ts`       | `findMentionedMemberContext` |
| Business Coach                                | `analytics.service.ts` | `businessCoachQuery`         |
| ZEUS (coach de entrenamiento en vivo)         | `workout.service.ts`   | `zeusChat`                   |
| Nutrición IA — sugerencia de comidas          | `nutrition.service.ts` | `aiSuggest`                  |
| Nutrición IA — registro por texto/voz         | `nutrition.service.ts` | `logFromText`                |
| Nutrición IA — matching difuso de alimentos   | `nutrition.service.ts` | `matchFoodItemsFuzzy`        |
| Nutrición IA — análisis adaptativo del plan   | `nutrition.service.ts` | `adaptivePlanAnalysis`       |
| Nutrición IA — generador de recetas           | `nutrition.service.ts` | `generateRecipe`             |
| Nutrición IA — lista de compras               | `nutrition.service.ts` | `generateShoppingList`       |
| Co-piloto del nutricionista                   | `nutrition.service.ts` | `copilotChat`                |

### Configuración (variables de entorno, Doppler)

```
NVIDIA_NIM_API_KEY          # requerida para que el respaldo funcione
NVIDIA_NIM_MODEL             # opcional, default: google/gemma-4-31b-it (nivel 2)
NVIDIA_NIM_TERTIARY_MODEL    # opcional, default: qwen/qwen3.5-397b-a17b (nivel 3)
```

### Lo que NO tiene respaldo (a propósito)

- **Foto de comida / foto de producto** (visión — `generateWithImage` en
  `nutrition.service.ts` y `marketplace.service.ts`): sin cambios, sigue siendo
  Gemini-solo. Ver sección 3 para el porqué.
- **Extracción OCR de exámenes de laboratorio** (`uploadLabResult` en
  `nutrition.service.ts`): sin cambios, sigue siendo Gemini-solo. **No existe hoy
  ningún modelo NVIDIA viable para esto** — ver sección 3.
- **Comandos de voz en vivo de ZEUS** (speech-to-text): hoy usa OpenAI Whisper, no
  Gemini — está fuera del alcance de esta cadena de respaldo por completo (es un
  proveedor distinto, no una "falla de Gemini"). Ver sección 4 para una alternativa
  NVIDIA evaluada, si se quiere migrar el STT en el futuro (no es respaldo, sería
  reemplazo).
- `scientific-engine.service.ts` (`assessAndQueue`, evaluación automática de papers
  científicos para ZEUS por cron) — usa Gemini directamente sin respaldo. Se dejó
  fuera de este batch por ser una tarea interna de cron (no un asistente conversacional
  con usuario esperando respuesta en vivo), pero seguiría el mismo patrón si se decide
  cubrirla después.

## 2. Por qué Gemma y por qué Qwen (y no otro)

De todos los modelos investigados (sección 3), estos dos ganaron por:

- **Gemma 4 31B**: ya estaba probado en producción como respaldo de ARIA, con
  latencia conocida y aceptable para chat en vivo. Solo texto, sin visión — por eso
  "recomendada para los que apliquen" (todos los 11 usos de arriba son texto puro,
  así que aplica a todos).
- **Qwen3.5 397B-A17B**: de los modelos "grandes" (Mistral Medium 3.5 128B, Mistral
  Large 3 675B, Qwen3.5 397B), es el que tiene **menos parámetros activos por token**
  (~17B vs ~41B de Mistral Large 3 o los 128B completos de Mistral Medium, que es denso
  — usa TODOS sus parámetros siempre). Menos parámetros activos = probablemente más
  rápido, aunque esto **no se ha medido empíricamente todavía** (ver pendientes).
  Bonus: es multimodal, así que si en el futuro se decide dar respaldo a visión,
  ya está integrado el cliente.

**Importante:** la latencia real de Qwen contra el tráfico real de GymApp no se ha
benchmarcado — la elección de "terciario" es una apuesta razonada (menos params
activos, en teoría más rápido), no un hecho medido. Antes de confiar en él bajo
carga real, correr una prueba de carga simple comparando Gemma vs Qwen con el mismo
prompt tipo ARIA.

## 3. Catálogo completo de modelos investigados

### Chat de texto (candidatos a nivel 2/3)

| Modelo                                         | Arquitectura                   | Contexto | Multimodal                                   | Estado                                                                                                                |
| ---------------------------------------------- | ------------------------------ | -------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `google/gemma-4-31b-it`                        | Denso, 31B                     | —        | No (solo texto)                              | **En uso (nivel 2)**                                                                                                  |
| `qwen/qwen3.5-397b-a17b`                       | MoE, 397B total / ~17B activos | 262K–1M  | Sí (texto+imagen+video)                      | **En uso (nivel 3)**                                                                                                  |
| `mistralai/mistral-medium-3.5-128b`            | Denso, 128B (todos activos)    | 256K     | Sí (texto+imagen)                            | Evaluado, no usado — denso de 128B probablemente más lento que Qwen (MoE)                                             |
| `mistralai/mistral-large-3-675b-instruct-2512` | MoE, 675B total / ~41B activos | —        | Sí (texto+imagen), multilingüe incl. español | Evaluado, no usado — más parámetros activos que Qwen, candidato secundario si Qwen decepciona                         |
| `qwen/qwen3-30b-a3b`                           | MoE, 30B total / ~3B activos   | —        | Texto                                        | **Hallazgo nuevo, no probado** — mucho más liviano, candidato si Qwen3.5-397B resulta lento en el benchmark pendiente |
| `qwen/qwen3-235b-a22b`                         | MoE, 235B/22B activos          | —        | Texto                                        | Hallazgo nuevo, generación "clásica" de Qwen3 (anterior a 3.5), no evaluado a fondo                                   |
| `qwen/qwen3-next-80b-a3b`                      | MoE híbrido, 80B/3B activos    | —        | Texto                                        | Hallazgo nuevo, no evaluado a fondo                                                                                   |
| Familia Qwen3 densa (0.6B–32B)                 | Densos varios tamaños          | —        | Texto                                        | Mencionados en el catálogo, no evaluados individualmente                                                              |

### Visión (foto de comida / producto)

| Modelo                                  | Qué hace                                                                                        | Estado                                                                                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `meta/llama-3.1-nemotron-nano-vl-8b-v1` | VLM de "document intelligence": describe imágenes, responde preguntas sobre ellas, OCR embebido | Candidato razonable para foto de comida/producto, **no implementado** — sin garantía de igualar calidad de Gemini Vision en estimación nutricional |
| NVIDIA NV-CLIP                          | Embeddings imagen-texto (tipo CLIP)                                                             | Útil para _matching_ de producto contra catálogo (complementa el `pg_trgm` que ya usamos), no para describir libremente — **no implementado**      |
| `nvidia/neva-22b`                       | VLM tipo LLaVA, más antiguo                                                                     | Bajo interés, probablemente superado por los Nemotron VL                                                                                           |
| Qwen3.5-397B-A17B                       | También es multimodal                                                                           | Ya integrado como cliente (nivel 3 de texto) — reutilizable para visión si se decide, sin trabajo adicional de infraestructura                     |

### OCR (exámenes de laboratorio)

| Modelo                                                | Idiomas declarados                                                                                                                                                                      | Veredicto                                                                                                                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nvidia/nemotron-ocr-v2`                              | **Inglés, chino (simp./trad.), japonés, coreano, ruso — sin español**, confirmado con 4 fuentes independientes (model card HuggingFace, blog oficial NVIDIA, página NGC del contenedor) | **Descartado.** No hay forma confiable de usarlo con reportes de laboratorio en español sin arriesgar precisión en datos médicos sensibles                                           |
| `nvidia/nemotron-parse`, `nvidia/nemoretriever-parse` | Solo inglés documentado                                                                                                                                                                 | Descartados por el mismo motivo                                                                                                                                                      |
| —                                                     | —                                                                                                                                                                                       | **Conclusión: no hay ningún modelo OCR viable en el catálogo de NVIDIA para este caso de uso.** Se mantiene Gemini como único proveedor, sin respaldo, para exámenes de laboratorio. |

### Voz (speech-to-text, comandos en vivo de ZEUS)

> Nota: ZEUS hoy usa **OpenAI Whisper** para STT, no Gemini — esto sería un cambio de
> proveedor, no un respaldo de Gemini. Se investigó igual porque el usuario preguntó
> por "los demás modelos" del catálogo NVIDIA en general.

| Modelo                                     | Idiomas                                                                                   | Latencia                                | Veredicto                                                                                                                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nvidia/nemotron-3.5-asr-streaming` (0.6B) | ~40 idiomas/locales, **es-US y es-ES confirmados como "transcription-ready"** (WER ~4.1%) | Streaming real, configurable hasta 80ms | **Mejor candidato encontrado** — publicado ~junio 2026, arquitectura pensada específicamente para audio en vivo de baja latencia. Vale la pena pilotar si se quiere complementar/reemplazar Whisper. |
| NVIDIA Parakeet                            | Se afirmó soporte amplio es-US/es-ES en todas sus variantes                               | —                                       | **La afirmación amplia fue refutada en verificación adversarial** — antes de usarlo hay que confirmar puntualmente qué variante específica de Parakeet (si alguna) declara español; no asumir.       |

## 4. Aviso de Términos de Servicio (recordatorio permanente)

Los endpoints gratuitos de `build.nvidia.com` están definidos en el ToS de NVIDIA
explícitamente para **prototipado y evaluación**, no para tráfico de producción real
de un negocio con usuarios pagando. Usarlos como **respaldo de emergencia intermitente**
(que es lo que se implementó — Gemini responde casi siempre) es más defendible que
usarlos como ruta primaria, pero formalmente sigue siendo una zona gris contractual.
Si el volumen de fallbacks reales llega a ser frecuente, hay que evaluar pasar a
NVIDIA AI Enterprise (de pago) para los modelos que se terminen usando en serio.

## 5. Pendientes / próximos pasos

1. **Benchmark real de latencia**: medir Gemma vs Qwen3.5-397B con el mismo tipo de
   prompt de ARIA/ZEUS, bajo condiciones realistas, antes de confiar en Qwen como
   nivel 3 en producción real (hoy es una apuesta razonada, no un hecho medido).
2. Si Qwen3.5-397B resulta lento, probar `qwen/qwen3-30b-a3b` (mucho más liviano,
   hallazgo nuevo de esta ronda) como reemplazo del nivel 3.
3. Pilotar `nvidia/nemotron-3.5-asr-streaming` para comandos de voz de ZEUS, como
   posible complemento o reemplazo de OpenAI Whisper (proyecto aparte, no respaldo).
4. Si se quiere de verdad un barrido **exhaustivo página por página** de
   `build.nvidia.com/models` (esta investigación se enfocó en preguntas puntuales,
   no en un inventario 100% completo del catálogo), correr una ronda de investigación
   dedicada solo a eso.
5. `scientific-engine.service.ts` (`assessAndQueue`) quedó sin el respaldo de 3 niveles
   — evaluar si vale la pena dado que es una tarea de cron, no un chat en vivo.
