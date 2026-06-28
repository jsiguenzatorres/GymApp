# 🏋️ INVESTIGACIÓN: FUENTES DE DATOS PARA BIBLIOTECA DE EJERCICIOS

## Población de Base de Datos Supabase — App Integral de Gimnasio de Élite

### Documento de Investigación & Implementación — Versión 1.0 · Junio 2026

---

> **Propósito:** Identificar y evaluar todas las fuentes disponibles (APIs, datasets abiertos, scrapers) para poblar la biblioteca de ejercicios del Módulo Workout Builder (MOD-WKT) con datos de calidad profesional, videos, imágenes y clasificación completa por músculo/equipamiento/dificultad.

---

## 📋 TABLA DE CONTENIDO

1. [Resumen Ejecutivo & Recomendación](#1-resumen-ejecutivo--recomendación)
2. [Fuente A — free-exercise-db (Dominio Público)](#2-fuente-a--free-exercise-db-dominio-público)
3. [Fuente B — wger.de (Open Source / AGPL+CC-BY-SA)](#3-fuente-b--wgerde-open-source--agplcc-by-sa)
4. [Fuente C — ExRx.net API (Licencia Comercial)](#4-fuente-c--exrxnet-api-licencia-comercial)
5. [Fuente D — MuscleWiki API (Licencia Comercial)](#5-fuente-d--musclewiki-api-licencia-comercial)
6. [Fuente E — WorkoutX API (Licencia Comercial)](#6-fuente-e--workoutx-api-licencia-comercial)
7. [Fuente F — ExerciseDB / RapidAPI](#7-fuente-f--exercisedb--rapidapi)
8. [Fuentes Institucionales & Validación Científica](#8-fuentes-institucionales--validación-científica)
9. [Videos: Estrategia de Obtención y Licenciamiento](#9-videos-estrategia-de-obtención-y-licenciamiento)
10. [Tabla Comparativa Completa](#10-tabla-comparativa-completa)
11. [Estrategia de Población Recomendada (Híbrida)](#11-estrategia-de-población-recomendada-híbrida)
12. [Mapeo de Datos al Schema de la App](#12-mapeo-de-datos-al-schema-de-la-app)
13. [Script de Importación a Supabase](#13-script-de-importación-a-supabase)
14. [Plan de Enriquecimiento con IA](#14-plan-de-enriquecimiento-con-ia)
15. [Checklist de Cumplimiento Legal](#15-checklist-de-cumplimiento-legal)

---

## 1. RESUMEN EJECUTIVO & RECOMENDACIÓN

### 1.1 Hallazgo Principal

Después de investigar a profundidad APIs comerciales, datasets abiertos, software open-source y sitios institucionales, la recomendación es una **estrategia híbrida en 3 capas** que combina:

```yaml
CAPA 1 — Base gratuita inmediata (Semana 1):
  Fuente: free-exercise-db (GitHub, dominio público)
  Resultado: ~870 ejercicios con datos estructurados + imágenes
  Costo: $0
  Tiempo de implementación: 1-2 días

CAPA 2 — Ampliación open-source (Semana 2-3):
  Fuente: wger.de API (AGPL + CC-BY-SA 3.0/4.0)
  Resultado: +845 ejercicios adicionales, multilingüe (incluye español nativo)
  Costo: $0
  Tiempo de implementación: 3-5 días

CAPA 3 — Videos profesionales HD (Mes 2, antes del lanzamiento):
  Fuente: MuscleWiki API o WorkoutX API (comercial)
  Resultado: videos HD demostrativos para los 150-300 ejercicios más usados
  Costo: $10-30/mes (según volumen)
  Tiempo de implementación: 1-2 semanas (incluye mapeo y curación)

RESULTADO FINAL ESPERADO:
  ~1,200-1,500 ejercicios únicos en la biblioteca
  100% con datos estructurados (músculos, equipamiento, instrucciones)
  100% en español (traducido/curado)
  ~300+ con video HD profesional (los de mayor uso)
  ~870+ con imágenes estáticas (suficiente para el resto)
  Costo total: $0-30/mes + tiempo de curación
```

### 1.2 Por Qué Esta Estrategia (y no comprar todo de una sola API)

```yaml
Razón 1 — Ninguna fuente sola es suficiente:
  free-exercise-db: datos excelentes pero solo fotos JPG, sin video
  wger: buena base + multilingüe pero imágenes limitadas, sin video en muchos casos
  MuscleWiki/ExRx/WorkoutX: videos HD excelentes pero de pago y en inglés

Razón 2 — Control total de los datos:
  Al importar a Supabase (no consumir vía API en vivo), el gym:
  - No depende de que el proveedor externo siga existiendo
  - Puede traducir, editar y enriquecer libremente
  - No paga por cada consulta — paga una vez por enriquecer, listo para siempre
  - Cumple con el requisito de "biblioteca propia" del documento de Workout Builder

Razón 3 — Presupuesto realista para LATAM:
  Comprar el plan ULTRA de MuscleWiki o el plan PRO de ExRx para 2,100+
  ejercicios con video cuesta $50-150/mes de forma recurrente.
  Mucho mejor: pagar 1-2 meses del plan más barato, exportar/curar todo
  lo necesario, e integrar localmente. Pago único, no recurrente.
```

---

## 2. FUENTE A — free-exercise-db (Dominio Público)

### 2.1 Datos de la Fuente

```yaml
Nombre:        free-exercise-db
Mantenedor:    yuhonas (GitHub) — basado en el dataset original de Ollie Jennings
URL:           https://github.com/yuhonas/free-exercise-db
Licencia:      ⭐ UNLICENSE (Dominio Público total) — la licencia MÁS permisiva que existe
               Sin atribución requerida, sin restricciones de uso comercial
Formato:       JSON (un archivo por ejercicio + un JSON combinado)
Tamaño:        800+ ejercicios (variantes reportan hasta 873 en forks actualizados)
Imágenes:      Sí — fotos JPG reales (2 por ejercicio: posición inicial/final)
Videos:        ❌ No incluye
Idioma:        Inglés únicamente (requiere traducción)
Demo browsable: https://yuhonas.github.io/free-exercise-db/
```

### 2.2 Estructura Exacta del Schema

```json
{
  "id": "Alternate_Incline_Dumbbell_Curl",
  "name": "Alternate Incline Dumbbell Curl",
  "force": "pull",
  "level": "beginner",
  "mechanic": "isolation",
  "equipment": "dumbbell",
  "primaryMuscles": ["biceps"],
  "secondaryMuscles": ["forearms"],
  "instructions": ["Sit down on an incline bench with a dumbbell in each hand...", "..."],
  "category": "strength",
  "images": ["Alternate_Incline_Dumbbell_Curl/0.jpg", "Alternate_Incline_Dumbbell_Curl/1.jpg"]
}
```

```yaml
Valores posibles de cada campo (vocabulario controlado):
  force: push | pull | static | null
  level: beginner | intermediate | expert
  mechanic: compound | isolation | null
  equipment: body only | machine | barbell | dumbbell | cable | kettlebells |
    bands | medicine ball | exercise ball | e-z curl bar | foam roll | null
  category: strength | stretching | plyometrics | strongman |
    powerlifting | cardio | olympic weightlifting

  Grupos musculares (primaryMuscles / secondaryMuscles):
    abdominals | abductors | adductors | biceps | calves | chest |
    forearms | glutes | hamstrings | lats | lower back | middle back |
    neck | quadriceps | shoulders | traps | triceps
```

### 2.3 Cómo Descargar e Importar

```bash
# Opción 1: Clonar el repo completo (incluye todas las imágenes)
git clone https://github.com/yuhonas/free-exercise-db.git
cd free-exercise-db

# El archivo combinado ya viene listo para procesar:
cat dist/exercises.json | jq length
# → 800+ (output: número total de ejercicios)

# Opción 2: Descargar solo el JSON combinado (sin clonar todo)
curl -o exercises.json \
  https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json

# Las imágenes se acceden con esta URL base + el path del campo "images":
# https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{path}
# Ejemplo: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Air_Bike/0.jpg
```

### 2.4 Ventajas y Limitaciones

```yaml
✅ VENTAJAS:
  - Licencia Unlicense = cero riesgo legal, cero atribución necesaria
  - Schema limpio y ya estructurado en JSON listo para importar
  - Buena cobertura de equipamiento (barra, mancuerna, máquina, peso corporal)
  - Incluye powerlifting, olympic weightlifting, plyometrics, stretching
  - Instrucciones paso a paso ya redactadas (solo requieren traducción)
  - Sin necesidad de API key, sin límites de requests, descarga total libre

❌ LIMITACIONES:
  - Sin videos (solo 2 fotos JPG por ejercicio)
  - Sin clasificación de patrón de movimiento (empuje horizontal/vertical, etc.)
  - Sin porcentaje de activación muscular (solo lista de músculos, sin %)
  - Sin errores frecuentes ni coaching cues estructurados
  - Todo en inglés — requiere traducción profesional al español
  - Imágenes son fotos estáticas de calidad variable (no ilustraciones)
```

---

## 3. FUENTE B — wger.de (Open Source / AGPL+CC-BY-SA)

### 3.1 Datos de la Fuente

```yaml
Nombre:        wger ("vigour" en alemán) — Workout Manager
URL principal: https://wger.de
Repositorio:   https://github.com/wger-project/wger
API pública:   https://wger.de/api/v2/
Documentación: https://wger.readthedocs.io/

Licencia del software: AGPL-3.0 (o posterior)
Licencia del contenido (ejercicios/datos): CC-BY-SA 3.0 / 4.0
  → CC-BY-SA SÍ permite uso comercial, PERO requiere:
    1. Atribución (dar crédito a wger.de y a los autores originales)
    2. Compartir-Igual (Share-Alike): si derivas/modificas el contenido,
       debes licenciar tu versión derivada bajo la misma licencia CC-BY-SA

  ⚠️ IMPLICACIÓN IMPORTANTE:
    El Share-Alike de CC-BY-SA puede ser problemático para una app comercial
    cerrada. Recomendación: usar wger como REFERENCIA y BASE DE DATOS
    ESTRUCTURAL (nombres, taxonomía, relaciones músculo-ejercicio), pero
    reescribir las descripciones/instrucciones con texto propio para
    evitar la obligación de Share-Alike sobre contenido textual derivado.
    Las imágenes/videos contribuidos por la comunidad SÍ deben mantener
    atribución si se usan literalmente.

Tamaño:        845+ ejercicios (catálogo en inglés, el más completo)
Idiomas:       30 idiomas, INCLUYE ESPAÑOL NATIVO (traducciones comunitarias)
Imágenes:      Sí, contribuidas por la comunidad (no todos los ejercicios tienen)
Videos:        Sí, contribuidas por la comunidad (cobertura parcial, variable)
Self-hostable: Sí — se puede instalar localmente vía Docker
```

### 3.2 Endpoints Clave de la API

```yaml
Base URL: https://wger.de/api/v2/

# Sin autenticación (públicos):
GET /exercise/                    → lista de ejercicios (legacy, deprecando)
GET /exercisebaseinfo/            → ⭐ RECOMENDADO: toda la info en 1 sola llamada
                                     (incluye músculos, equipamiento, traducciones,
                                      imágenes — evita N llamadas separadas)
GET /exercisecategory/            → categorías (Abs, Arms, Back, Calves, Chest,
                                     Legs, Shoulders, Triceps, Biceps, etc.)
GET /muscle/                      → catálogo completo de músculos con imagen
                                     de la silueta anatómica (¡muy útil para
                                     el mapa muscular SVG de nuestro sistema!)
GET /equipment/                   → catálogo de equipamiento (Barbell, Dumbbell,
                                     Kettlebells, Machine, Bodyweight, etc.)
GET /exerciseimage/                → imágenes vinculadas a cada ejercicio
GET /video/                        → videos vinculados a cada ejercicio

# Parámetros de filtro útiles:
GET /exercise/?category=10                    → filtrar por categoría
GET /exercise/?muscles=4                       → filtrar por músculo primario
GET /exercise/?equipment=3                     → filtrar por equipamiento
GET /exercisebaseinfo/?language=4              → filtrar por idioma (4 = español)
```

### 3.3 Ejemplo de Respuesta (exercisebaseinfo)

```json
{
  "id": 345,
  "category": { "id": 10, "name": "Legs" },
  "muscles": [
    {
      "id": 10,
      "name": "Quadriceps femoris",
      "name_en": "Quads",
      "is_front": true,
      "image_url_main": "...",
      "image_url_secondary": "..."
    }
  ],
  "muscles_secondary": [{ "id": 8, "name": "Gluteus maximus", "is_front": false }],
  "equipment": [{ "id": 1, "name": "Barbell" }],
  "exercises": [
    {
      "language": 4,
      "name": "Sentadilla con barra",
      "description": "<p>Coloca la barra sobre los trapecios...</p>",
      "translations": ["..."]
    }
  ],
  "images": [{ "image": "https://wger.de/media/exercise-images/345/squat-1.jpg", "is_main": true }]
}
```

### 3.4 Cómo Obtener los Datos (3 métodos)

```yaml
MÉTODO 1 — Consumo directo de la API pública (más simple):
  Sin necesidad de autenticación para datos públicos.
  curl "https://wger.de/api/v2/exercisebaseinfo/?language=4&format=json&limit=100"
  Limitación: paginado, hay que iterar todas las páginas (offset)

MÉTODO 2 — Self-host + sync (más control, recomendado si se planea
            contribuir o necesitar volumen alto):
  git clone https://github.com/wger-project/docker.git
  cd docker && docker compose up -d
  docker compose exec web python3 manage.py sync-exercises
  docker compose exec web python3 manage.py download-exercise-images
  docker compose exec web python3 manage.py download-exercise-videos
  → Esto descarga TODO localmente, incluidos videos, en tu propia infraestructura
  → Después puedes leer directamente la base de datos PostgreSQL de wger
    y migrar/transformar los datos a tu schema de Supabase

MÉTODO 3 — Dataset pre-scrapeado vía Apify (más rápido, sin código):
  https://apify.com/parseforge/wger-exercise-database-scraper
  - 845+ ejercicios, 19 campos por registro
  - Exportable directo a CSV/Excel/JSON/XML
  - Filtra por idioma (incluye español), categoría, equipamiento
  - Sin necesidad de programar el scraper — interfaz point-and-click
  - Costo: gratis con cuenta Apify (créditos limitados) o ~$5-15 de créditos
```

### 3.5 El Tesoro Oculto — Endpoint de Músculos con Imágenes Anatómicas

```yaml
GET /api/v2/muscle/

Este endpoint es EXTREMADAMENTE valioso para nuestro sistema porque:
  - Devuelve la silueta anatómica de cada músculo (image_url_main, image_url_secondary)
  - Indica is_front (vista anterior/posterior)
  - Esto es la base PERFECTA para construir el "Mapa de Activación Muscular SVG"
    descrito en el Módulo Workout Builder (sección 4.2 del documento original)

Lista de los ~16 músculos catalogados en wger:
  Anterior deltoid, Biceps brachii, Biceps femoris, Brachialis,
  Gastrocnemius, Gluteus maximus, Latissimus dorsi, Obliquus externus
  abdominis, Pectoralis major, Quadriceps femoris, Rectus abdominis,
  Serratus anterior, Soleus, Trapezius, Triceps brachii, etc.

  Acción recomendada: descargar estas 16 imágenes anatómicas base y
  usarlas como capa de "highlight" en nuestro componente MuscleMap.tsx
  (definido en la arquitectura de la app móvil)
```

---

## 4. FUENTE C — ExRx.net API (Licencia Comercial)

### 4.1 Por Qué ExRx.net es la Referencia de Oro Científica

```yaml
Antecedentes:
  ExRx.net (Exercise Prescription on the Internet) existe desde 1999 (25+ años).
  Es la fuente más citada académicamente en kinesiología y ciencias del
  ejercicio. Endosada por organizaciones profesionales del sector fitness.

  A diferencia de free-exercise-db o wger (comunidad abierta sin revisión
  experta estricta), ExRx.net tiene:
    - Clasificación de SINERGISTAS y ESTABILIZADORES (no solo músculo primario)
    - Terminología anatómica precisa y validada
    - Más de 2,100 ejercicios clasificados profesionalmente

Licencia y costo:
  API JSON REST con Bearer Token
  Planes: Pro plan da acceso a los 2,100+ ejercicios completos
  Sin pricing público exacto en la página (requiere contacto directo via
  formulario en https://exrx.net/Store/Other/Licensing)
  Históricamente sus planes de licencia de contenido han sido accesibles
  para desarrolladores independientes (en el rango de $50-200 según uso)

Estructura de queries (5 grandes categorías):
  1. Global Query (todo el catálogo)
  2. Cardio Conditioning
  3. Plyometrics
  4. Stretch (estiramientos)
  5. Weight Training (entrenamiento con pesas)
```

### 4.2 Qué Aporta que Otras Fuentes No Tienen

```yaml
Datos diferenciadores de ExRx.net:
  ✅ Sinergistas y estabilizadores (no solo "músculo principal")
     → Esto alimenta perfectamente nuestro campo "musculos_secundarios"
       con mayor precisión científica que cualquier otra fuente
  ✅ Nombres alternativos de ejercicios (ej: "Seal Row" = "Cambered Barbell
     Lying Row" = "Dumbbell Lying Row") → excelente para el buscador
     semántico de ZEUS descrito en el Módulo Workout Builder
  ✅ 25+ años de curación profesional — cero ejercicios "inventados" o
     mal clasificados por usuarios anónimos

Recomendación de uso:
  No es necesario suscribirse de forma permanente. Sugerencia:
  1. Contactar para una licencia de 1-2 meses o plan más económico
  2. Exportar/documentar los 300-500 ejercicios más relevantes para
     gimnasios (no necesitamos los 2,100 — muchos son variantes de
     stretching o cardio muy específico)
  3. Usar esos datos para ENRIQUECER (no reemplazar) lo ya importado
     de free-exercise-db y wger, especialmente el campo de sinergistas
  4. Cancelar la suscripción una vez completada la extracción
```

---

## 5. FUENTE D — MuscleWiki API (Licencia Comercial)

### 5.1 Por Qué MuscleWiki es la Mejor Opción para VIDEO

```yaml
Esta es, de las fuentes investigadas, la que tiene LA MEJOR PROPUESTA
para resolver el requisito de "videos de ejercicios con su explicación
técnica" mencionado explícitamente en el documento de Workout Builder.

Datos de la fuente:
  URL:          https://api.musclewiki.com/
  Catálogo:     1,900+ ejercicios
  Videos:       7,500+ — CADA ejercicio tiene MÚLTIPLES ángulos:
                  - Vista frontal (modelo masculino)
                  - Vista lateral (modelo masculino)
                  - Vista frontal (modelo femenino)
                  - Vista lateral (modelo femenino)
                → Esto es EXACTAMENTE lo que pedimos en el documento:
                  "videos por ejercicio... con su explicación técnica"
  Filtrado:     45 grupos musculares (mucho más granular que las 16-17
                de otras fuentes)
  Body Map:     Incluye bodymap_male / bodymap_female — mapas corporales
                interactivos ya construidos (tier ULTRA/MEGA)

Planes y precios (mensual, sin permanencia):
  BASIC:    Gratis — 500 llamadas/mes vía Playground web (sin API directa)
  TESTING:  $10/mes — 1,000 llamadas/mes, acceso API directo completo
  PRO:      según tabla de precios (acceso ampliado)
  ULTRA:    incluye rutinas/routines + bodymap (tier alto)
  MEGA:     tier máximo, incluye todo

  Comercial: TODOS los planes de pago incluyen derechos de uso comercial
  completos, sin cargos de licenciamiento adicionales. Esto es ideal
  para nuestro caso — podemos construir y vender la app sin restricciones.
```

### 5.2 Estrategia de Extracción Recomendada

```yaml
Plan de acción sugerido:
  1. Contratar tier TESTING ($10/mes) por 1-2 meses
  2. Hacer un script de extracción masiva (rate-limited) que descargue:
     - Lista completa de ejercicios con sus metadatos
     - URLs de los videos (descargar y re-hostear en nuestro propio
       Cloudflare R2 / S3 — NUNCA hotlinkear directamente al proveedor,
       porque si cancelamos el plan, los videos dejarían de funcionar)
  3. Priorizar la descarga para los ~300 ejercicios más comunes en
     gimnasios LATAM (lista en sección 11.3 de este documento)
  4. Re-alojar todos los videos descargados en nuestro CDN propio
  5. Cancelar la suscripción tras completar la extracción

⚠️ IMPORTANTE - Verificar Términos de Servicio antes de descargar en
  bulk: algunas APIs prohíben el "scraping masivo para uso offline"
  incluso con plan pagado, y solo permiten consumo en vivo vía API.
  Se debe revisar el ToS específico de MuscleWiki al momento de
  contratar, y si es necesario, contactar a su equipo de soporte
  para confirmar que el caso de uso (re-hosteo permanente tras pago)
  es válido bajo su licencia comercial. Si no lo permiten, usar la
  API en modo "live" con caché de 30 días en lugar de descarga permanente.
```

---

## 6. FUENTE E — WorkoutX API (Licencia Comercial)

### 6.1 La Alternativa Más Transparente y Económica

```yaml
URL:           https://workoutxapp.com/
Catálogo:      1,400+ ejercicios (otra fuente menciona 1,321 con GIF)
Animaciones:   GIF (no video MP4) — todas las 1,400+ exercises incluidas
               en TODOS los tiers, incluido el gratis
Granularidad:  Incluye datos que otras APIs NO tienen:
                 - Calorías quemadas por minuto (MET values, escalado por peso)
                 - Nivel de dificultad explícito
                 - Mecánica: aislamiento vs. compuesto
                 - Dirección de fuerza: push/pull
                 - Endpoint de "alternativas" con score de confianza
                 - Endpoint de "equipment-swap" (intercambio de equipo,
                   ej: "no tengo barra, dame el equivalente con mancuerna")
                   → ¡Esto es EXACTAMENTE la función de "Sustitución
                   Inteligente de Ejercicios" de nuestro Módulo 14!

Precios (sin middleware, API directa, sin RapidAPI):
  FREE:     500 requests/mes, 30 req/min — sin tarjeta de crédito
  $9.99/mes: 3,000 requests/mes
  $15.99/mes: 10,000 requests/mes
  $24.99/mes: 35,000 requests/mes

Generación dinámica:
  Incluye endpoint de "generar workout" y "generar splits" basado en
  parámetros — útil como referencia para nuestro propio Co-Piloto IA
  del Workout Builder, aunque nuestro ARIA/ZEUS ya cubre esto con LLM.
```

### 6.2 Por Qué Considerar WorkoutX como Primera Opción de Pago

```yaml
Ventajas sobre MuscleWiki para nuestro caso específico:
  ✅ Más económico para volumen alto ($15.99 = 10,000 requests vs.
     $10 = 1,000 requests de MuscleWiki)
  ✅ Sin necesidad de tarjeta para probar (reduce friction)
  ✅ Datos de calorías y MET — directamente útiles para nuestro Módulo
     de Nutrición (cálculo de calorías quemadas por sesión)
  ✅ Endpoint de "equipment swap" ya resuelve parte de la lógica de
     sustitución de ejercicios que documentamos como función propia

Limitación vs. MuscleWiki:
  ❌ Solo GIF, no video MP4 con audio/narración
  ❌ Sin vista de body map interactivo incluido
  ❌ Catálogo algo menor (1,400 vs. 1,900 de MuscleWiki)

Recomendación: usar WorkoutX para ENRIQUECER metadata (calorías, MET,
alternativas, equipment-swap) en TODOS los ejercicios, y reservar el
gasto en video real (MuscleWiki) solo para los ejercicios estrella.
```

---

## 7. FUENTE F — ExerciseDB / RapidAPI

### 7.1 Evaluación

```yaml
URL:           https://github.com/ExerciseDB/exercisedb-api
Catálogo:      11,000+ ejercicios (el catálogo MÁS GRANDE de todas las fuentes)
Distribución:  Vía RapidAPI marketplace (intermediario)
Contenido:     target body parts, equipment, video, gifs, images,
               instrucciones paso a paso, "exercise tips"

⚠️ ADVERTENCIAS IMPORTANTES encontradas en la documentación oficial:
  "These endpoints are for exploration only and not recommended for
   production integration — strict rate limits and potential instability
   may apply"

  Esto significa que aunque el catálogo es enorme (11,000+), el
  proveedor mismo advierte que no es estable para producción sin
  contratar un plan formal vía RapidAPI.

Riesgo adicional (mencionado por comparativas independientes):
  "Dependency risk: If RapidAPI changes pricing or policies, your app
   is affected" — depender de un intermediario añade un punto de
   fragilidad adicional vs. contratar directo con el proveedor.

Recomendación:
  Usar SOLO como fuente de referencia cruzada para verificar nombres
  de ejercicios poco comunes o nichos, pero NO como fuente principal
  de producción dado el riesgo de inestabilidad y dependencia de
  RapidAPI como intermediario.
```

---

## 8. FUENTES INSTITUCIONALES & VALIDACIÓN CIENTÍFICA

### 8.1 Fuentes para Validar Calidad y Seguridad (no para bulk import)

```yaml
ACE (American Council on Exercise):
  URL: https://www.acefitness.org/resources/everyone/exercise-library/
  Contenido: Biblioteca pública de ejercicios con instrucciones
             profesionalmente redactadas, body parts, equipment,
             difficulty, imágenes, atribución clara
  Uso recomendado: Fuente de VALIDACIÓN para nuestro Motor de
  Investigación Científica Continua (Sección 16 del Módulo Workout
  Builder) — ACE es una de las "organizaciones oficiales monitoreadas"
  que ya identificamos en ese documento
  Hay un scraper disponible vía Apify ("Scrapes the ACE public exercise
  library... For fitness apps, RAG systems, and health pipelines that
  require provenance-verified exercise content")

NSCA (National Strength and Conditioning Association):
  No tiene API pública de ejercicios, pero es la fuente de referencia
  para VALIDAR la programación, periodización y protocolos de
  seguridad — ya identificada como fuente en nuestro Motor de
  Investigación Científica

ACSM (American College of Sports Medicine):
  Position stands y guidelines — para validar parámetros de
  series/repeticiones/intensidad, no para datos de ejercicios individuales

PubMed / Google Scholar:
  Para los estudios específicos citados en cada ficha de ejercicio
  (ej: "Escamilla RF et al. 2001" ya citado en el ejemplo de Hack
  Squat del documento original) — búsqueda manual o vía Motor de
  Investigación Científica automatizado, no scraping masivo

Federaciones de Powerlifting/Halterofilia (IPF, IWF):
  Para validar la técnica oficial de competencia en sentadilla, press
  de banca, peso muerto, snatch, clean & jerk — relevante para el
  catálogo de "Movimientos Olímpicos" mencionado en la taxonomía
  del Módulo Workout Builder
```

---

## 9. VIDEOS: ESTRATEGIA DE OBTENCIÓN Y LICENCIAMIENTO

### 9.1 El Problema Específico de los Videos

```yaml
De todas las fuentes investigadas, el panorama de VIDEO es:

  Gratis y dominio público:        ❌ Ninguna fuente gratuita tiene video MP4
  Gratis con GIF (no video):       ✅ free-exercise-db (no), WorkoutX (sí, GIF)
  Comunidad (calidad variable):    ✅ wger (parcial, contribuido por usuarios)
  Comercial profesional HD:        ✅ MuscleWiki (mejor opción, múltiples ángulos)

CONCLUSIÓN: Para tener video profesional HD con explicación técnica
como se pide explícitamente en el documento de Workout Builder, NO
hay alternativa gratuita de calidad suficiente. Se requiere SÍ o SÍ
una de estas 3 rutas:
```

### 9.2 Las 3 Rutas Posibles para Video (en orden de recomendación)

```yaml
RUTA 1 — Licenciar de MuscleWiki (RECOMENDADA):
  Costo: $10-30/mes por 1-2 meses = $20-60 total
  Resultado: Videos HD profesionales multi-ángulo para 300-500 ejercicios
  Pros: Rápido, profesional, ya están en inglés (se puede agregar
        narración en español encima con ZEUS TTS, o subtítulos)
  Contras: Requiere re-alojar para no depender del proveedor

RUTA 2 — Producción propia con el trainer del gym (COMPLEMENTARIA):
  Costo: Tiempo del equipo (cámara + trainer + edición)
  Resultado: Videos 100% propios, sin licencia de terceros, en español
             nativo, con la VOZ del trainer del gym (mayor conexión
             con los miembros — "mi propio Carlos me explica esto")
  Aplicación: Usar para los 30-50 ejercicios MÁS usados del catálogo
             del gym específico (sentadilla, press, peso muerto,
             jalón, remo, etc.) — son pocos pero los que el miembro
             ve constantemente
  Ventaja estratégica: Esto es lo que describe la Sección 12.1 del
  Módulo de Gamificación como "ARIA Voice Cloning" — se puede grabar
  al trainer estrella y tener su voz/imagen en el contenido más visto

RUTA 3 — Generación de avatar/animación 3D (FUTURO, Fase 3):
  Costo: Mayor inversión inicial, pero costo marginal $0 por ejercicio
         adicional una vez construido el pipeline
  Herramientas: Motores como Synthesia, HeyGen, o un modelo 3D
  rigging personalizado (más complejo, requiere especialista en
  animación) podrían generar demostraciones sintéticas
  Recomendación: NO prioritario para el lanzamiento — evaluar en
  Fase 3 cuando haya presupuesto y datos de qué ejercicios son
  más consultados

ESTRATEGIA HÍBRIDA FINAL RECOMENDADA:
  20% de los ejercicios (los ~300 más usados) → Video MuscleWiki
    re-alojado + voz de ZEUS narrando en español por encima
  5% de los ejercicios (los ~50 fundamentales: sentadilla, press,
    peso muerto, dominadas, etc.) → Video propio grabado con el
    trainer del gym, en español, con su personalidad
  75% restante (ejercicios de uso ocasional o muy específicos) →
    Solo imagen estática (de free-exercise-db o wger) + GIF si
    está disponible (de WorkoutX) — suficiente para ejercicios
    poco frecuentes, no justifica el costo de video para cada uno
```

### 9.3 Pipeline Técnico de Procesamiento de Video

```yaml
Si se licencia video de MuscleWiki o se produce video propio,
el pipeline de procesamiento antes de subir a Supabase/CDN es:

  1. Descarga/recepción del video fuente (MP4, mínimo 1080p)

  2. Recorte y estandarización:
     - Duración objetivo: 30-60 segundos (según especificación del
       Módulo Workout Builder, sección 4.1)
     - Aspect ratio: 9:16 (vertical, para mobile-first) o 16:9
       (horizontal, para tablet/desktop) — considerar generar ambos
     - FFmpeg para recorte, compresión y conversión

  3. Generación de variantes (usando FFmpeg):
     - Velocidad normal (1x)
     - Cámara lenta (0.25x) para la fase técnica crítica
     - GIF preview de 5-8 segundos en loop (para thumbnails)
     - Versión muda con subtítulos quemados (para uso sin sonido en el gym)

  4. Narración en español (si el video fuente es en inglés/mudo):
     - Guion generado a partir del campo "instructions" del ejercicio
     - TTS con ElevenLabs usando la voz de ZEUS (ya definida en el
       Módulo Workout Builder, sección 13.1)
     - Mezclar audio narrado sobre el video sin sonido original

  5. Subida a almacenamiento:
     - Cloudflare R2 o Supabase Storage (bucket "exercise-videos")
     - Generar URL pública/firmada según corresponda
     - Actualizar el campo video_tecnica_url en la tabla exercises

  6. Control de calidad:
     - Un trainer revisa cada video antes de marcarlo "aprobado=true"
     - Esto conecta directamente con el Panel de Aprobación de
       Contenido descrito en la Sección 17 del Módulo Workout Builder
```

---

## 10. TABLA COMPARATIVA COMPLETA

```
                      free-      wger      ExRx.net   MuscleWiki  WorkoutX   ExerciseDB
                      exercise-                                              (RapidAPI)
                      db
─────────────────────────────────────────────────────────────────────────────────────────
Costo                 $0         $0        $$ (cont.)  $10-30/mes $0-25/mes  $$ (RapidAPI)
Catálogo (#)           870        845       2,100+       1,900      1,400      11,000+
Video MP4              ❌         Parcial    ❌          ✅✅✅      ❌         ✅
GIF animado            ❌         ❌         ❌          ❌          ✅✅✅     ✅
Imágenes JPG           ✅✅       Parcial    ✅          ✅          ✅         ✅
Español nativo         ❌         ✅✅✅      ❌          ❌          ❌         ❌
Sinergistas/Estab.     ❌         ❌         ✅✅✅       ❌          ❌         ❌
% Activación muscular  ❌         ❌         ❌           ❌          ❌         ❌
Nombres alternativos   ❌         Parcial    ✅✅✅       ❌          ✅         ❌
Body map interactivo   ❌         ✅ (img)   ❌           ✅✅ (tier)  ❌         ❌
Calorías/MET           ❌         ❌         ❌           ❌          ✅✅✅     ❌
Equipment-swap         ❌         ❌         ❌           ❌          ✅✅       ❌
Self-hostable          ✅✅✅     ✅✅✅      ❌           ❌          ❌         ❌
Licencia comercial OK  ✅✅✅     ✅* (S-A)  ✅           ✅          ✅         ✅
Riesgo dependencia     Ninguno    Ninguno    Medio        Medio       Medio      Alto (RapidAPI)
Estabilidad producción Total      Total      Alta         Alta        Alta       Baja (advertido)
─────────────────────────────────────────────────────────────────────────────────────────
* wger: licencia CC-BY-SA del contenido requiere atribución + share-alike en derivados
```

---

## 11. ESTRATEGIA DE POBLACIÓN RECOMENDADA (HÍBRIDA)

### 11.1 Plan de Ejecución en 4 Fases

```yaml
FASE 1 — Importación masiva base (Días 1-3):
  Acción: Importar free-exercise-db completo (870 ejercicios) a Supabase
  Resultado: Biblioteca funcional básica desde el día 3
  Sin costo

FASE 2 — Ampliación y multilingüe (Días 4-10):
  Acción: Importar wger.de vía API o Apify scraper (845 ejercicios,
          priorizando los disponibles en español)
  Deduplicación: cruzar contra lo ya importado de Fase 1 por nombre
          normalizado (lowercase, sin acentos) para evitar duplicados
  Resultado: ~1,200-1,400 ejercicios únicos, mejor cobertura en español
  Sin costo

FASE 3 — Enriquecimiento de metadata (Días 11-15):
  Acción: Contratar WorkoutX 1 mes ($9.99-15.99) para extraer:
          calorías/MET, nivel de dificultad, mecánica, alternativas,
          equipment-swap → cruzar y enriquecer los registros ya
          existentes (no duplicar, solo agregar campos faltantes)
  Costo: ~$15 una sola vez

FASE 4 — Video profesional para el Top 300 (Semanas 3-4):
  Acción A: Contratar MuscleWiki 1-2 meses, extraer y re-alojar
            video para los ~300 ejercicios identificados como más
            usados (ver lista sugerida en 11.3)
  Acción B: Grabar en paralelo con el/los trainer(s) del gym piloto
            los ~50 ejercicios fundamentales con su propia voz
  Costo: ~$20-60 (MuscleWiki) + tiempo de producción propia

RESULTADO FINAL:
  Biblioteca de ~1,200-1,500 ejercicios
  100% con datos estructurados completos
  ~300-350 con video profesional (top de uso)
  Costo total: ~$35-75 (pago único, no recurrente)
  Tiempo total: ~4 semanas trabajando en paralelo con el desarrollo
```

### 11.2 Traducción al Español — Estrategia

```yaml
Para el contenido que llega en inglés (free-exercise-db, MuscleWiki,
WorkoutX, ExRx):

  Nombres de ejercicios:
    NO traducir literalmente palabra por palabra — usar el nombre
    que un entrenador latinoamericano realmente usaría.
    Ejemplo: "Alternate Incline Dumbbell Curl" → "Curl Alternado con
    Mancuerna en Banco Inclinado" (no "Curl de Mancuerna Inclinado
    Alternado" que suena a traducción automática)

  Instrucciones (campo instructions):
    Usar un LLM (Claude) con un prompt específico de "traduce y
    adapta este texto de instrucciones de ejercicio al español
    neutro/latinoamericano, con tono de coach profesional, sin
    sonar a traducción literal" — procesar en batch los 1,200+
    registros

  Validación humana:
    Un trainer certificado del gym piloto debe revisar al menos
    el Top 300 (los de video) antes de publicarlos — los 900+
    restantes (solo texto/imagen) pueden auto-publicarse con
    revisión por muestreo (10% aleatorio revisado)
```

### 11.3 Lista Sugerida — Los ~300 Ejercicios "Top de Uso" para Priorizar Video

```yaml
Esta lista cubre los ejercicios que aparecen en el 90%+ de las rutinas
reales de gimnasio (priorizar estos para video profesional):

PIERNAS (40 ejercicios):
  Sentadilla con barra, Sentadilla goblet, Sentadilla búlgara,
  Sentadilla Hack (máquina), Leg Press 45°, Leg Press horizontal,
  Extensión de pierna, Curl femoral (sentado/tumbado), Peso muerto
  convencional, Peso muerto rumano, Peso muerto sumo, Hip Thrust,
  Puente de glúteo, Zancadas (todas variantes), Step up, Abducción
  de cadera, Aducción de cadera, Elevación de talones (de pie/sentado),
  Sentadilla frontal, Good morning, etc.

EMPUJE/PECHO/HOMBRO (45 ejercicios):
  Press de banca (barra/mancuerna, plano/inclinado/declinado),
  Press militar (barra/mancuerna), Press Arnold, Aperturas con
  mancuerna, Cruce de poleas, Pec deck (máquina), Fondos en paralelas,
  Push-up (y variantes), Elevaciones laterales, Elevaciones frontales,
  Pájaro/elevación posterior, Face pull, Press de hombro en máquina, etc.

JALE/ESPALDA/BÍCEPS (45 ejercicios):
  Dominadas (pronas/supinas), Jalón al pecho, Remo con barra,
  Remo con mancuerna, Remo en máquina (sentado), Remo en T,
  Peso muerto (ver piernas), Curl de bíceps (barra/mancuerna/EZ),
  Curl martillo, Curl en banco Scott, Curl en polea, Pull-over, etc.

TRÍCEPS (15 ejercicios):
  Press francés, Extensión de tríceps en polea, Patada de tríceps,
  Fondos en banco, Press cerrado en banca, etc.

CORE/ABDOMEN (25 ejercicios):
  Plancha (y variantes), Crunch, Elevación de piernas, Rueda
  abdominal, Russian twist, Pallof press, Hollow body, etc.

FUNCIONAL/OLÍMPICO (20 ejercicios):
  Kettlebell swing, Clean, Snatch, Thruster, Burpee, Farmer carry,
  Box jump, Battle ropes, Wall ball, etc.

CARDIO/MÁQUINAS (15 ejercicios):
  Caminadora (técnica), Bicicleta estática, Elíptica, Remo (máquina),
  Escaladora, etc.

MOVILIDAD/ESTIRAMIENTO (30 ejercicios):
  Los estiramientos post-entreno más comunes por grupo muscular

TOTAL: ~235 ejercicios base × variantes de equipamiento = ~300
```

---

## 12. MAPEO DE DATOS AL SCHEMA DE LA APP

### 12.1 Tabla de Correspondencia de Campos

```yaml
Mapeo: free-exercise-db / wger  →  nuestra tabla `exercises` (definida
en el Módulo Workout Builder, Sección 19)

free-exercise-db.id              → exercises.code (slug único)
free-exercise-db.name            → exercises.name (tras traducción)
free-exercise-db.force           → exercises.movement_type
                                    (push→"Empuje", pull→"Jale",
                                     static→"Isométrico")
free-exercise-db.level           → exercises.difficulty_level
                                    (beginner→Principiante,
                                     intermediate→Intermedio,
                                     expert→Avanzado)
free-exercise-db.mechanic        → (nuevo campo sugerido: is_compound)
free-exercise-db.equipment       → exercises.equipment_required (array)
free-exercise-db.primaryMuscles  → exercises.primary_muscles (JSONB,
                                    requiere agregar % de activación
                                    manualmente o vía IA — ver sección 14)
free-exercise-db.secondaryMuscles→ exercises.secondary_muscles (JSONB)
free-exercise-db.instructions    → exercises.execution (tras traducción
                                    y reformateo a fases: posición
                                    inicial/ejecución/errores)
free-exercise-db.category        → exercises.category (Fuerza, Cardio,
                                    Flexibilidad, etc. — mapeo directo)
free-exercise-db.images[0]       → exercises.foto_posicion_inicial
free-exercise-db.images[1]       → exercises.foto_posicion_final

wger.exercisebaseinfo.muscles    → exercises.primary_muscles
wger.exercisebaseinfo.muscles_secondary → exercises.secondary_muscles
wger.muscle.image_url_main       → (alimenta tabla separada
                                    `muscle_anatomy_references` para
                                    construir el SVG del MuscleMap)
wger.equipment.name              → exercises.equipment_required
wger.exercise.translations[es]   → exercises.name + exercises.execution
                                    (cuando language=4/español exista)

ExRx.net (cuando se licencie)    → enriquece exercises.secondary_muscles
                                    con distinción sinergista/estabilizador
                                    (requiere ampliar JSONB con sub-tipo)

MuscleWiki/WorkoutX video        → exercises.video_tecnica_url,
                                    exercises.gif_preview_url

WorkoutX MET/calorías            → (nuevo campo sugerido en exercises:
                                    met_value DECIMAL — para integrar
                                    con el cálculo de calorías quemadas
                                    del Módulo de Nutrición)
```

### 12.2 Campos que NINGUNA Fuente Externa Provee (Requieren Curación Manual o IA)

```yaml
Estos campos, definidos como parte de la "Ficha Completa de Ejercicio"
en el Módulo Workout Builder (sección 2.2), no existen en ninguna
fuente externa y deben generarse:

  ❌ porcentaje_activacion (% específico por músculo)
     → Generar con IA basándose en literatura EMG (electromiografía)
       cuando esté disponible, o estimación razonable de un trainer
       certificado para el resto

  ❌ coordenadas_silueta (para el SVG interactivo)
     → Requiere mapeo manual UNA VEZ por cada músculo (no por
       ejercicio) — son ~25-30 regiones musculares fijas, reutilizables
       en todos los ejercicios que activen ese músculo

  ❌ errores_frecuentes con consecuencia/corrección estructurados
     → Generar con IA (Claude) a partir de las instrucciones +
       conocimiento de fisioterapia, validado por un trainer

  ❌ rangos_recomendados por objetivo (fuerza/hipertrofia/resistencia)
     → Aplicar las tablas estándar de la literatura (ya documentadas
       en el Módulo Workout Builder sección 2.2) — son fórmulas
       generales aplicables a cualquier ejercicio de fuerza, no
       requieren dato externo por ejercicio

  ❌ ejercicios_equivalentes con score de similitud
     → Calcular programáticamente comparando primary_muscles +
       secondary_muscles + movement_pattern entre todos los pares
       de ejercicios (algoritmo de similitud de conjuntos, ej. Jaccard)
       — totalmente automatizable, no requiere fuente externa

  ❌ referencias_científicas específicas
     → Estas SÍ requieren investigación puntual (PubMed) y se añaden
       gradualmente, priorizando los ejercicios del Top 300 (sección 11.3)
```

---

## 13. SCRIPT DE IMPORTACIÓN A SUPABASE

### 13.1 Script Completo (Node.js) — Importar free-exercise-db

```javascript
// import-free-exercise-db.js
// Importa el dataset completo de free-exercise-db a Supabase
// Requiere: npm install @supabase/supabase-js node-fetch

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // service role para bulk insert
);

const SOURCE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Mapeo de vocabularios controlados
const FORCE_MAP = { push: 'Empuje', pull: 'Jale', static: 'Isométrico' };
const LEVEL_MAP = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  expert: 'Avanzado',
};
const CATEGORY_MAP = {
  strength: 'Fuerza',
  stretching: 'Flexibilidad',
  plyometrics: 'Potencia',
  cardio: 'Cardio',
  strongman: 'Funcional',
  powerlifting: 'Fuerza',
  olympic_weightlifting: 'Potencia',
};
const EQUIPMENT_MAP = {
  'body only': ['Peso corporal'],
  barbell: ['Barra'],
  dumbbell: ['Mancuernas'],
  machine: ['Máquina'],
  cable: ['Polea/Cable'],
  kettlebells: ['Kettlebell'],
  bands: ['Banda elástica'],
  'medicine ball': ['Balón medicinal'],
  'exercise ball': ['Fitball'],
  'e-z curl bar': ['Barra EZ'],
  'foam roll': ['Foam roller'],
  other: ['Otro'],
};
const MUSCLE_MAP = {
  abdominals: 'Abdomen',
  abductors: 'Abductores',
  adductors: 'Aductores',
  biceps: 'Bíceps',
  calves: 'Pantorrilla',
  chest: 'Pectoral',
  forearms: 'Antebrazo',
  glutes: 'Glúteos',
  hamstrings: 'Isquiotibiales',
  lats: 'Dorsal ancho',
  'lower back': 'Lumbar',
  'middle back': 'Dorsal medio',
  neck: 'Cuello',
  quadriceps: 'Cuádriceps',
  shoulders: 'Hombro',
  traps: 'Trapecio',
  triceps: 'Tríceps',
};

async function translateWithClaude(text, context) {
  // Llamada a la API de Anthropic para traducir/adaptar texto
  // Ver sección 14 de este documento para el prompt completo
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Traduce y adapta este texto de ${context} de un
ejercicio de gimnasio al español neutro/latinoamericano, con tono
profesional de entrenador personal. No traduzcas literalmente,
adapta naturalmente. Devuelve SOLO el texto traducido, sin comentarios:

${text}`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content[0].text.trim();
}

async function importExercise(raw, gymId) {
  // Traducir nombre e instrucciones
  const translatedName = await translateWithClaude(raw.name, 'nombre');
  const translatedInstructions = await Promise.all(
    raw.instructions.map((i) => translateWithClaude(i, 'instrucción técnica')),
  );

  const exercise = {
    gym_id: gymId, // null = ejercicio del sistema (compartido)
    nombre_oficial: translatedName,
    nombre_alternativo: raw.name, // conservamos el original en inglés
    codigo: raw.id, // slug original como código único
    fuente: 'free_exercise_db',
    categoria_principal: CATEGORY_MAP[raw.category] || 'Fuerza',
    tipo_movimiento: FORCE_MAP[raw.force] || null,
    nivel_dificultad: LEVEL_MAP[raw.level] || 'Intermedio',
    equipamiento_requerido: EQUIPMENT_MAP[raw.equipment] || ['Otro'],
    musculos_primarios: raw.primaryMuscles.map((m) => ({
      nombre: MUSCLE_MAP[m] || m,
      porcentaje_activacion: null, // pendiente de enriquecimiento (sección 14)
    })),
    musculos_secundarios: raw.secondaryMuscles.map((m) => ({
      nombre: MUSCLE_MAP[m] || m,
      porcentaje_activacion: null,
    })),
    ejecucion: translatedInstructions.join('\n\n'),
    foto_posicion_inicial: raw.images[0] ? IMAGE_BASE + raw.images[0] : null,
    foto_posicion_final: raw.images[1] ? IMAGE_BASE + raw.images[1] : null,
    activo: true,
    aprobado: false, // requiere revisión humana antes de publicar
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('exercises').insert(exercise).select();

  if (error) {
    console.error(`❌ Error importando ${raw.id}:`, error.message);
    return null;
  }
  console.log(`✅ Importado: ${translatedName}`);
  return data[0];
}

async function main() {
  console.log('📥 Descargando dataset de free-exercise-db...');
  const response = await fetch(SOURCE_URL);
  const exercises = await response.json();
  console.log(`📦 ${exercises.length} ejercicios encontrados`);

  // Procesar en lotes pequeños para no saturar la API de traducción
  const BATCH_SIZE = 5;
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((ex) => importExercise(ex, null)));
    console.log(`📊 Progreso: ${Math.min(i + BATCH_SIZE, exercises.length)}/${exercises.length}`);
    // Pequeña pausa para respetar rate limits de la API de traducción
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('🎉 Importación completada');
}

main().catch(console.error);
```

### 13.2 Script de Deduplicación (tras importar wger sobre free-exercise-db)

```javascript
// deduplicate-exercises.js
// Detecta y fusiona ejercicios duplicados entre fuentes distintas

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function normalize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-z0-9\s]/g, '') // quitar símbolos
    .replace(/\s+/g, ' ')
    .trim();
}

// Distancia de Levenshtein simplificada para detectar nombres muy similares
function similarity(a, b) {
  const na = normalize(a),
    nb = normalize(b);
  if (na === nb) return 1.0;
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.length === 0) return 1.0;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

async function findDuplicates() {
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, nombre_oficial, fuente, musculos_primarios')
    .eq('activo', true);

  const duplicateGroups = [];
  const processed = new Set();

  for (let i = 0; i < allExercises.length; i++) {
    if (processed.has(allExercises[i].id)) continue;
    const group = [allExercises[i]];

    for (let j = i + 1; j < allExercises.length; j++) {
      if (processed.has(allExercises[j].id)) continue;
      const sim = similarity(allExercises[i].nombre_oficial, allExercises[j].nombre_oficial);
      if (sim > 0.85) {
        group.push(allExercises[j]);
        processed.add(allExercises[j].id);
      }
    }

    if (group.length > 1) {
      duplicateGroups.push(group);
      processed.add(allExercises[i].id);
    }
  }

  console.log(`🔍 Encontrados ${duplicateGroups.length} grupos de posibles duplicados`);

  // Generar reporte para revisión humana (NO fusionar automáticamente
  // sin supervisión — los falsos positivos son costosos)
  for (const group of duplicateGroups) {
    console.log('---');
    group.forEach((ex) => console.log(`  [${ex.fuente}] ${ex.nombre_oficial} (${ex.id})`));
  }

  return duplicateGroups;
}

findDuplicates().catch(console.error);
```

### 13.3 Schema SQL Adicional (extiende el de Workout Builder)

```sql
-- Tabla auxiliar para referencias anatómicas musculares
-- (alimentada desde wger /api/v2/muscle/)
CREATE TABLE muscle_anatomy_references (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muscle_name           VARCHAR(100) NOT NULL,
  muscle_name_en        VARCHAR(100),
  is_front_view         BOOLEAN DEFAULT TRUE,
  svg_silhouette_url    TEXT,              -- imagen base para el MuscleMap
  source                VARCHAR(30) DEFAULT 'wger',
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Tabla de tracking del origen y proceso de enriquecimiento
-- (para auditoría y saber qué falta procesar)
CREATE TABLE exercise_import_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id           UUID REFERENCES exercises(id),
  source                VARCHAR(30) NOT NULL,
  source_id             VARCHAR(100),
  imported_at           TIMESTAMP DEFAULT NOW(),
  translated            BOOLEAN DEFAULT FALSE,
  enriched_muscles_pct  BOOLEAN DEFAULT FALSE,
  enriched_video        BOOLEAN DEFAULT FALSE,
  enriched_errors       BOOLEAN DEFAULT FALSE,
  reviewed_by_trainer   BOOLEAN DEFAULT FALSE,
  reviewed_by           UUID REFERENCES staff(id),
  reviewed_at           TIMESTAMP
);

-- Extensión de la tabla exercises (agregar campos no contemplados
-- originalmente, identificados durante el mapeo de fuentes externas)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS met_value DECIMAL(4,2);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_compound BOOLEAN;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS source_attribution TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS gif_preview_url_alt TEXT;
```

---

## 14. PLAN DE ENRIQUECIMIENTO CON IA

### 14.1 Prompt para Generar Porcentajes de Activación Muscular

```yaml
Dado que ninguna fuente gratuita provee % de activación EMG real,
se puede usar IA para generar estimaciones razonables basadas en
biomecánica conocida, claramente marcadas como "estimación" y
sujetas a revisión por un especialista:

PROMPT (usar con Claude vía API, batch para los 1,200+ ejercicios):

"Eres un especialista en biomecánica y fisiología del ejercicio.
Dado el siguiente ejercicio y su lista de músculos primarios y
secundarios, estima el porcentaje aproximado de activación muscular
de cada músculo basándote en literatura EMG conocida para ejercicios
similares. Esto es una ESTIMACIÓN EDUCATIVA, no un dato clínico exacto.

Ejercicio: {nombre}
Descripción/ejecución: {ejecucion}
Músculos primarios listados: {musculos_primarios}
Músculos secundarios listados: {musculos_secundarios}

Responde SOLO en este formato JSON, sin texto adicional:
{
  \"primarios\": [{\"musculo\": \"...\", \"porcentaje\": NN}],
  \"secundarios\": [{\"musculo\": \"...\", \"porcentaje\": NN}]
}

El total no necesita sumar 100% (hay overlap y estabilizadores no
listados). Usa rangos típicos: primario dominante 60-80%, primario
secundario 40-60%, secundario relevante 15-35%, estabilizador 5-15%."
```

### 14.2 Prompt para Generar Errores Frecuentes y Correcciones

```yaml
PROMPT:

"Eres un entrenador personal certificado (NSCA-CPT) con 15 años de
experiencia. Para el siguiente ejercicio, genera los 3 errores
técnicos más frecuentes que cometen las personas, basándote en tu
conocimiento de biomecánica y lesiones deportivas comunes.

Ejercicio: {nombre}
Ejecución correcta: {ejecucion}
Músculos trabajados: {musculos_primarios}

Para cada error, responde en este formato JSON (array de 3 objetos):
[
  {
    \"error\": \"descripción breve del error técnico\",
    \"consecuencia\": \"qué riesgo o limitación genera\",
    \"correccion\": \"cómo corregirlo en una frase práctica\"
  }
]

Sé específico y técnico pero comprensible. No inventes riesgos
exagerados — basa todo en biomecánica real y sentido común de
entrenamiento seguro."
```

### 14.3 Prompt para Calcular Ejercicios Equivalentes (Algorítmico + IA)

```yaml
Este paso es MEJOR resolverlo con un algoritmo determinístico
(no IA) ya que es matemáticamente calculable:

ALGORITMO (pseudocódigo):

función calcular_similitud(ejercicio_A, ejercicio_B):
  musculos_A = set(ejercicio_A.primarios + ejercicio_A.secundarios)
  musculos_B = set(ejercicio_B.primarios + ejercicio_B.secundarios)

  // Índice de Jaccard sobre músculos compartidos
  interseccion = musculos_A ∩ musculos_B
  union = musculos_A ∪ musculos_B
  similitud_muscular = len(interseccion) / len(union)

  // Bonus si el patrón de movimiento coincide
  bonus_patron = 0.15 si ejercicio_A.patron == ejercicio_B.patron sino 0

  // Penalización si el equipamiento es muy distinto
  penalizacion_equipo = -0.10 si no comparten ningún equipamiento sino 0

  similitud_final = min(1.0, similitud_muscular + bonus_patron + penalizacion_equipo)
  retornar similitud_final

// Ejecutar para TODOS los pares de ejercicios de la biblioteca
// Guardar solo los pares con similitud > 0.70 en la tabla
// exercise_equivalents (no guardar todos los pares — serían millones)

Esto alimenta directamente:
  - El campo "ejercicios_equivalentes" de la ficha de ejercicio
  - La función de "Sustitución Inteligente de Ejercicios" (Módulo
    Workout Builder, Sección 14) que ZEUS usa para sugerir alternativas
```

---

## 15. CHECKLIST DE CUMPLIMIENTO LEGAL

```yaml
ANTES DE LANZAR LA BIBLIOTECA EN PRODUCCIÓN:

FREE-EXERCISE-DB (Unlicense):
  ✅ Sin obligación legal — pero buena práctica: mencionar en
     "Acerca de" o créditos del software: "Datos base de ejercicios
     cortesía de free-exercise-db (dominio público)"

WGER (CC-BY-SA 3.0/4.0 sobre contenido):
  ⚠️ Si se usan TEXTOS literales de wger sin reescribir:
     □ Incluir atribución visible: "Contenido de ejercicios basado
       en wger.de, licenciado bajo CC-BY-SA"
     □ Evaluar con asesor legal si el Share-Alike aplica a nuestra
       app comercial cerrada (recomendación: reescribir todo el
       texto con IA para evitar esta obligación — solo usar la
       TAXONOMÍA/ESTRUCTURA de wger, no su texto literal)
  ✅ Si se usa solo como REFERENCIA estructural (nombres, categorías,
     relaciones músculo-ejercicio) y se reescribe el contenido:
     no hay obligación de Share-Alike (los hechos/taxonomías no son
     copyrightables, solo la expresión textual específica)

MUSCLEWIKI / WORKOUTX / EXRX (comercial):
  □ Confirmar por escrito con cada proveedor que su licencia permite:
     - Re-alojar el video/contenido en nuestra propia infraestructura
       de forma permanente (no solo consumo en vivo vía API)
     - Uso en una app comercial SaaS que se vende a terceros (gyms)
       — verificar si esto cuenta como "uso comercial estándar" o
       requiere un tier "Enterprise/White-label" especial
  □ Guardar captura/PDF de los Términos de Servicio vigentes al
     momento de la contratación (por si cambian después)
  □ Una vez cancelada la suscripción, verificar que el contenido
     ya descargado/pagado se puede seguir usando indefinidamente
     (algunos ToS exigen eliminar el contenido al cancelar — leer
     con cuidado la cláusula de "post-termination rights")

ACE / FUENTES INSTITUCIONALES:
  □ Si se usa contenido de ACE u otra organización profesional como
     referencia de validación (no como bulk import), citar la fuente
     en el campo "referencias_cientificas" de cada ejercicio relevante

VIDEOS PROPIOS (grabados con trainers del gym):
  ✅ Sin restricción de terceros, pero asegurar:
     □ Contrato/consentimiento firmado del trainer que aparece en
       cámara (uso de su imagen y voz en el producto comercial)
     □ Si se usa "voice cloning" de su voz para ZEUS (como sugerido
       en el Módulo de Gamificación), consentimiento explícito y
       específico para ESE uso (clonación de voz es sensible)

DISCLAIMER GENERAL A INCLUIR EN LA APP:
  "La información técnica de ejercicios mostrada en esta aplicación
   proviene de fuentes profesionales y de dominio público, así como
   de contenido producido por el equipo del gimnasio. Es de carácter
   educativo general y no sustituye la supervisión de un entrenador
   certificado presencial. Consulta a un profesional de la salud
   antes de iniciar cualquier programa de ejercicio."
```

---

## 📎 APÉNDICE — RESUMEN DE ACCIÓN INMEDIATA

```yaml
PARA EMPEZAR HOY MISMO (sin esperar a contratar nada de pago):

  1. Clonar free-exercise-db:
     git clone https://github.com/yuhonas/free-exercise-db.git

  2. Adaptar el script de la Sección 13.1 con tus credenciales reales
     de Supabase y Anthropic API

  3. Correr la importación en un ambiente de desarrollo/staging primero
     (NO en producción directamente)

  4. Revisar una muestra de 20-30 ejercicios traducidos para calibrar
     el prompt de traducción antes de procesar los 870 completos

  5. En paralelo, registrar cuenta gratuita en wger.de y explorar el
     endpoint /api/v2/exercisebaseinfo/?language=4 para ver cuántos
     ejercicios ya tienen traducción española nativa de la comunidad

  6. Definir con el equipo: ¿quién será el trainer que grabará los
     ~50 videos fundamentales en español? Reservar tiempo de grabación
     en las próximas 2-3 semanas

PRESUPUESTO TOTAL ESTIMADO PARA LA BIBLIOTECA COMPLETA:
  $0 (Fases 1-2, gratis) + $15 (WorkoutX, Fase 3) + $20-60 (MuscleWiki,
  Fase 4) + tiempo de producción propia = ~$35-75 USD, pago único
```

---

_Documento generado: Junio 2026_
_Versión: 1.0_
_Tipo: Investigación de Fuentes de Datos — Implementación Técnica_
_Complementa: Módulo Workout Builder & Seguimiento de Progreso (GYM-MOD-WKT)_
_Próxima revisión: Tras completar la Fase 1 de importación_
