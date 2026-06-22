# 🏋️ MÓDULO WORKOUT BUILDER & SEGUIMIENTO DE PROGRESO

## Sistema de Entrenamiento de Élite — App Integral de Gimnasio

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-WKT`  
> **Prioridad:** MVP Fase 1 (core) + Fase 2 (IA Coach + Biblioteca avanzada)  
> **Módulos relacionados:** Perfiles (MOD-A), CRM/ARIA (MOD-CRM), Nutrición (MOD-C/D), Gamificación (MOD-I), Panel Ejecutivo (MOD-J)  
> **Inspiración benchmark:** PT Distinction, ABC Trainerize, JEFIT Elite, Fitbod, Dr. Muscle, SensAI, Exercise.com

---

## 📋 TABLA DE CONTENIDO

### PARTE I — BIBLIOTECA DE EJERCICIOS & RUTINAS

1. [Visión General & Filosofía del Módulo](#1-visión-general--filosofía-del-módulo)
2. [Biblioteca de Ejercicios — Arquitectura Completa](#2-biblioteca-de-ejercicios--arquitectura-completa)
3. [Sistema de Clasificación de Ejercicios](#3-sistema-de-clasificación-de-ejercicios)
4. [Contenido Multimedia por Ejercicio](#4-contenido-multimedia-por-ejercicio)
5. [Biblioteca de Rutinas & Plantillas](#5-biblioteca-de-rutinas--plantillas)
6. [Sistema de Periodización](#6-sistema-de-periodización)

### PARTE II — WORKOUT BUILDER (PANEL DEL TRAINER)

7. [Interfaz del Workout Builder — Trainer](#7-interfaz-del-workout-builder--trainer)
8. [Constructor de Plan de Entrenamiento](#8-constructor-de-plan-de-entrenamiento)
9. [IA Asistente del Trainer (Co-Piloto de Programación)](#9-ia-asistente-del-trainer-co-piloto-de-programación)
10. [Asignación y Gestión de Planes](#10-asignación-y-gestión-de-planes)

### PARTE III — EXPERIENCIA DEL MIEMBRO (APP)

11. [Dashboard de Entrenamiento del Miembro](#11-dashboard-de-entrenamiento-del-miembro)
12. [Ejecución de la Sesión en Tiempo Real](#12-ejecución-de-la-sesión-en-tiempo-real)
13. [Coach Virtual ZEUS — Asistencia Técnica Avanzada](#13-coach-virtual-zeus--asistencia-técnica-avanzada)
14. [Sustitución Inteligente de Ejercicios](#14-sustitución-inteligente-de-ejercicios)
15. [Seguimiento de Progreso & Analytics](#15-seguimiento-de-progreso--analytics)

### PARTE IV — INVESTIGACIÓN & ACTUALIZACIÓN CIENTÍFICA

16. [Motor de Investigación Científica Continua](#16-motor-de-investigación-científica-continua)
17. [Panel de Aprobación de Contenido (Admin)](#17-panel-de-aprobación-de-contenido-admin)
18. [Integraciones del Módulo](#18-integraciones-del-módulo)
19. [Modelo de Datos Completo](#19-modelo-de-datos-completo)

---

# PARTE I — BIBLIOTECA DE EJERCICIOS & RUTINAS

---

## 1. VISIÓN GENERAL & FILOSOFÍA DEL MÓDULO

### 1.1 Propósito

El **Módulo de Workout Builder & Progreso** es el corazón técnico del servicio de entrenamiento del gimnasio. Transforma la relación entre trainer y alumno de una dinámica informal en un **sistema de entrenamiento profesional, medible y personalizado** que rivaliza con los mejores softwares del mercado mundial.

Combina tres capas de valor:

- **Para el trainer:** herramientas de programación profesional que reducen el tiempo de diseño en 60% y aumentan la calidad del programa
- **Para el miembro:** una experiencia de entrenamiento guiada, motivadora y progresiva con su propio Coach Virtual disponible 24/7
- **Para el gym:** diferenciación competitiva real basada en ciencia del ejercicio actualizada continuamente

### 1.2 Filosofía de Diseño

| Principio                   | Descripción                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Ciencia primero**         | Cada programa se basa en principios probados: periodización, sobrecarga progresiva, especificidad, recuperación |
| **Mínima fricción**         | Registrar un set durante el entreno debe tomar 2 toques — nunca más                                             |
| **Contexto inteligente**    | La app sabe dónde estás, qué toca hoy, qué levantaste la semana pasada                                          |
| **Coach siempre presente**  | El miembro nunca está solo ante una duda técnica — ZEUS está ahí                                                |
| **Progreso visible**        | Cada sesión debe terminar con un dato nuevo que motive a regresar                                               |
| **Flexibilidad controlada** | El miembro puede adaptar su entrenamiento pero siempre dentro de los parámetros que el trainer diseñó           |

### 1.3 Referentes de la Industria Incorporados

Basado en la investigación realizada, integramos las mejores características de:

| Sistema             | Característica adoptada                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| **PT Distinction**  | Workout builder con supersets, giant sets, tempo, cues por ejercicio, periodización multi-fase |
| **ABC Trainerize**  | AI Workout Builder conversacional, 50% menos tiempo de programación reportado                  |
| **JEFIT Elite**     | NSPI Score, Movement Balance, Strength Engine, análisis de volumen por grupo muscular          |
| **Fitbod**          | Recovery-based programming, priorización de músculos frescos                                   |
| **Dr. Muscle**      | Daily undulating periodization, RIR-based effort, deloads automáticos                          |
| **SensAI**          | Integración con wearables (HRV, sueño) para ajustar intensidad en tiempo real                  |
| **Strong / Strive** | UI minimalista durante el entreno, teclado numérico personalizado, targets automáticos         |
| **Exercise.com**    | Periodización sport-specific, librería de 4,000+ ejercicios, coaching cues detallados          |

---

## 2. BIBLIOTECA DE EJERCICIOS — ARQUITECTURA COMPLETA

### 2.1 Estructura de la Biblioteca

```
BIBLIOTECA DE EJERCICIOS
├── 📚 Ejercicios del Sistema (Base — precargados)
│   ├── Ejercicios básicos universales (sentadilla, press, jalón, etc.)
│   ├── Ejercicios por maquinaria común de gimnasio
│   └── Ejercicios de peso corporal
│
├── 🏋️ Ejercicios del Gym (Personalizados por el propietario)
│   ├── Ejercicios en máquinas específicas del gym
│   ├── Ejercicios con equipamiento propio (bandas, cables, TRX, etc.)
│   └── Movimientos propietarios del gym
│
├── 👨‍🏫 Ejercicios del Trainer (Biblioteca privada por trainer)
│   ├── Variaciones personales de ejercicios
│   ├── Progresiones específicas del trainer
│   └── Ejercicios especializados por certificación
│
└── 🔬 Ejercicios Científicos (Curados por investigación)
    ├── Nuevos ejercicios aprobados por el admin
    ├── Variaciones basadas en evidencia reciente
    └── Ejercicios de rehabilitación / fisioterapia aprobados
```

### 2.2 Ficha Completa de Ejercicio

```yaml
ejercicio:
  id: UUID
  gym_id: UUID

  # ── IDENTIFICACIÓN ───────────────────────────────────────
  nombre_oficial: 'Sentadilla Hack con Máquina'
  nombre_alternativo: 'Machine Hack Squat'
  nombres_populares: ['Hack Squat', 'Sentadilla en Hack']
  codigo: 'LEG-HAC-001'
  fuente: system | gym_custom | trainer_custom | scientific_research
  creado_por: UUID_trainer_o_admin
  aprobado_por: UUID_admin # necesario para ejercicios de investigación

  # ── CLASIFICACIÓN ────────────────────────────────────────
  categoria_principal: 'Fuerza' # Fuerza | Cardio | Flexibilidad | Potencia | Rehabilitación | Funcional
  tipo_movimiento: 'Empuje' # Empuje | Jale | Bisagra | Sentadilla | Core | Rotación | Porteo
  patron_movimiento: 'Cuádriceps dominante'
  nivel_dificultad: 'Intermedio' # Principiante | Intermedio | Avanzado | Élite

  # ── MÚSCULOS ─────────────────────────────────────────────
  musculos_primarios:
    - nombre: 'Cuádriceps'
      porcentaje_activacion: 75
      region: 'anterior_muslo'
      coordenadas_silueta: { x1: 120, y1: 380, x2: 160, y2: 480 } # para el mapa SVG
    - nombre: 'Glúteo Mayor'
      porcentaje_activacion: 60
      region: 'gluteo'
      coordenadas_silueta: { x1: 100, y1: 300, x2: 160, y2: 370 }

  musculos_secundarios:
    - nombre: 'Isquiotibiales'
      porcentaje_activacion: 25
      region: 'posterior_muslo'
    - nombre: 'Gastrocnemio'
      porcentaje_activacion: 20
      region: 'pantorrilla'
    - nombre: 'Core / Estabilizadores'
      porcentaje_activacion: 15
      region: 'abdomen'

  musculos_antagonistas:
    - nombre: 'Tibial Anterior' # para programar balance muscular

  # ── EQUIPAMIENTO ─────────────────────────────────────────
  equipamiento_requerido: ['Máquina Hack Squat']
  equipamiento_alternativo: ['Barra libre + guía', 'Leg Press (variación)']
  disponible_sin_equipamiento: false

  # ── PARÁMETROS DE ENTRENAMIENTO ──────────────────────────
  rangos_recomendados:
    fuerza: { sets: '3-5', reps: '3-6', carga: '80-90% 1RM', descanso_seg: 180 }
    hipertrofia: { sets: '3-5', reps: '8-12', carga: '65-75% 1RM', descanso_seg: 90 }
    resistencia: { sets: '2-3', reps: '15-20', carga: '50-60% 1RM', descanso_seg: 45 }
    definicion: { sets: '3-4', reps: '12-15', carga: '60-70% 1RM', descanso_seg: 60 }
    rehabilitacion: { sets: '2-3', reps: '15-20', carga: 'Muy ligero', descanso_seg: 30 }

  tempo_recomendado: '3-1-2-0' # excéntrico-pausa_abajo-concéntrico-pausa_arriba

  carga_inicial_recomendada: # para cálculo del primer día
    hombre_principiante: '40-60 kg'
    mujer_principiante: '20-40 kg'

  # ── INSTRUCCIONES TÉCNICAS ───────────────────────────────
  posicion_inicial: |
    Coloca los pies en la plataforma a la anchura de los hombros.
    Espalda completamente apoyada en el respaldo acolchado.
    Hombros debajo de las almohadillas de forma cómoda.
    Rodillas ligeramente flexionadas — nunca totalmente extendidas.

  ejecucion: |
    FASE DESCENDENTE (excéntrica — 3 segundos):
    Flexiona las rodillas controladamente hacia abajo.
    Mantén la espalda pegada al respaldo en todo momento.
    Rodillas alineadas con la punta de los pies — no hacia adentro.
    Baja hasta que muslos estén paralelos o ligeramente por debajo.

    PAUSA ABAJO (1 segundo):
    Mantén la posición sin rebotar. Activa los cuádriceps conscientemente.

    FASE ASCENDENTE (concéntrica — 2 segundos):
    Empuja mediante los talones — no de puntillas.
    Extiende las rodillas hasta casi el bloqueo (deja 5-10° de flexión).
    Exhala durante el esfuerzo.

  puntos_clave_coaching:
    - 'Talones siempre en contacto con la plataforma'
    - 'Rodillas no deben colapsar hacia adentro (valgo de rodilla)'
    - 'Espalda nunca despegada del respaldo — señal de carga excesiva'
    - 'Rango completo sin dolor — la profundidad la dicta la anatomía del alumno'

  errores_frecuentes:
    - error: 'Rodillas colapsando hacia adentro (valgo de rodilla)'
      consecuencia: 'Lesión del ligamento cruzado anterior (LCA)'
      correccion: 'Coloca una banda elástica en las rodillas para crear resistencia externa'
      imagen_error: 'cdn/exercises/hack-squat-valgus-error.jpg'

    - error: 'Espalda despegada del respaldo en la subida'
      consecuencia: 'Carga excesiva en discos lumbares'
      correccion: 'Reduce el peso y practica apretando la espalda conscientemente'

    - error: 'Rango de movimiento incompleto (1/4 de sentadilla)'
      consecuencia: 'Desarrollo muscular limitado, patrones de movimiento deficientes'
      correccion: 'Reduce la carga hasta lograr el rango completo'

    - error: 'Respiración contenida durante toda la repetición'
      consecuencia: 'Maniobra de Valsalva — peligrosa con pesos altos'
      correccion: 'Inhala en la bajada, exhala en la subida'

  # ── CONTRAINDICACIONES & SEGURIDAD ───────────────────────
  contraindicaciones:
    - 'Lesión reciente de rodilla o ligamentos (LCA, LCP, menisco)'
    - 'Dolor lumbar agudo'
    - 'Reemplazo de cadera sin clearance médico'
    - 'Condromalacia patelar severa'

  precauciones:
    - 'Embarazo: solo con autorización médica y modificación del rango'
    - 'Hipertensión severa: monitorear respiración'

  modificaciones_posibles:
    - nombre: 'Hack Squat suave (rango reducido)'
      para: 'Principiantes, rehabilitación, rodillas sensibles'
      descripcion: 'Bajar solo hasta 90° o hasta el punto de comodidad'

    - nombre: 'Hack Squat unilateral'
      para: 'Corrección de asimetrías, avanzados'
      descripcion: 'Una pierna a la vez sobre la plataforma'

    - nombre: 'Hack Squat con pausa isométrica'
      para: 'Fuerza y control neuromuscular'
      descripcion: 'Mantener 3 segundos en la posición más baja'

  # ── EJERCICIOS ALTERNATIVOS ──────────────────────────────
  ejercicios_equivalentes: # mismos músculos primarios
    - ejercicio_id: UUID # Sentadilla Libre
      similitud: 0.90
    - ejercicio_id: UUID # Leg Press 45°
      similitud: 0.85
    - ejercicio_id: UUID # Goblet Squat
      similitud: 0.75
    - ejercicio_id: UUID # Prensa Hack con barra
      similitud: 0.95

  ejercicios_progresion: # para cuando el alumno avance
    - ejercicio_id: UUID # Hack Squat con pausa
    - ejercicio_id: UUID # Sentadilla frontal

  ejercicios_regresion: # para cuando necesite bajar dificultad
    - ejercicio_id: UUID # Leg Press (menos estabilizadores)
    - ejercicio_id: UUID # Sentadilla con TRX

  # ── MULTIMEDIA ───────────────────────────────────────────
  video_tecnica_url: 'cdn/exercises/hack-squat-technique.mp4'
  video_duracion_seg: 45
  video_errores_url: 'cdn/exercises/hack-squat-errors.mp4'
  gif_preview_url: 'cdn/exercises/hack-squat-preview.gif'
  foto_posicion_inicial: 'cdn/exercises/hack-squat-start.jpg'
  foto_posicion_final: 'cdn/exercises/hack-squat-bottom.jpg'
  mapa_muscular_svg: 'cdn/muscles/hack-squat-activation.svg'
  mapa_muscular_posterior_svg: 'cdn/muscles/hack-squat-activation-back.svg'
  audio_coaching_url: 'cdn/exercises/hack-squat-coaching.mp3' # ZEUS lee las instrucciones

  # ── CIENCIA & REFERENCIAS ────────────────────────────────
  referencias_cientificas:
    - 'Escamilla RF et al. (2001) — Biomechanics of the knee during closed kinetic chain exercises. Medicine & Science in Sports & Exercise'
    - 'Bloomquist K et al. (2013) — Effect of range of motion in heavy load squatting on muscle and tendon adaptations'

  beneficios_probados:
    - 'Desarrollo superior de cuádriceps vs. sentadilla libre en principiantes (Bloomquist 2013)'
    - 'Menor carga en columna vertebral que la sentadilla con barra'
    - 'Mayor aislamiento del cuádriceps lateral (vasto lateral)'

  fecha_ultima_revision: '2026-01-15'
  version: '2.1'

  # ── METADATA ─────────────────────────────────────────────
  activo: true
  aprobado: true
  veces_asignado: 1847 # estadística del uso en el gym
  rating_trainers: 4.8 # rating de trainers que lo usan
  created_at: timestamp
  updated_at: timestamp
```

---

## 3. SISTEMA DE CLASIFICACIÓN DE EJERCICIOS

### 3.1 Taxonomía Completa

```
NIVEL 1 — CATEGORÍA PRINCIPAL:
├── 💪 FUERZA
│   ├── Fuerza máxima (1-6 reps, >80% 1RM)
│   ├── Hipertrofia / Masa muscular (8-15 reps, 65-80% 1RM)
│   ├── Fuerza-resistencia (15-25 reps, <65% 1RM)
│   └── Potencia / Explosivo (velocidad máxima, <70% 1RM)
│
├── 🏃 CARDIO & RESISTENCIA
│   ├── HIIT (alta intensidad por intervalos)
│   ├── LISS (baja intensidad sostenida)
│   ├── Cardio en máquina (cinta, bicicleta, elíptica, remo)
│   └── Cardio funcional (jumping jacks, burpees, saltar cuerda)
│
├── 🤸 MOVILIDAD & FLEXIBILIDAD
│   ├── Estiramiento estático
│   ├── Estiramiento dinámico
│   ├── Movilidad articular
│   └── Foam rolling / auto-masaje
│
├── ⚡ FUNCIONAL & ATLÉTICO
│   ├── Movimientos olímpicos (clean, snatch, jerk)
│   ├── Entrenamiento funcional (kettlebell, TRX, bandas)
│   ├── Pliométrico (saltos, caídas controladas)
│   └── Específico de deporte
│
├── 🧘 CORE & ESTABILIZACIÓN
│   ├── Core antiflexión (plancha y variaciones)
│   ├── Core antirotación (Pallof press, bird-dog)
│   ├── Core antiextensión (hollow body, ab wheel)
│   └── Core dinámico (crunch, elevación de piernas)
│
└── 🩺 REHABILITACIÓN & TERAPÉUTICO
    ├── Rehabilitación de hombro
    ├── Rehabilitación de rodilla
    ├── Rehabilitación de espalda baja
    ├── Rehabilitación de cadera
    └── Activación / correctivos

NIVEL 2 — PATRÓN DE MOVIMIENTO:
  Empuje horizontal: press de banca, fondos, push-up
  Empuje vertical: press militar, Arnold press, handstand push-up
  Jale horizontal: remo, face pull, seated row
  Jale vertical: jalón, dominadas, pull-up
  Bisagra de cadera: peso muerto y variaciones, hip thrust, RDL
  Sentadilla: squat y variaciones
  Porteo: farmer carry, loaded carry, waiter walk
  Rotación: woodchop, pallof press, Russian twist

NIVEL 3 — GRUPO MUSCULAR PRIMARIO:
  Pectoral | Dorsal | Hombro | Bíceps | Tríceps | Antebrazo
  Cuádriceps | Isquiotibiales | Glúteos | Pantorrilla
  Abdomen | Oblicuos | Core profundo | Trapecio | Romboides

NIVEL 4 — EQUIPAMIENTO:
  Sin equipamiento (peso corporal)
  Mancuernas | Barra | Kettlebell | Bandas elásticas
  Máquinas de cables | Máquinas fijas | TRX / Suspensión
  Balón medicinal | Bosu | Step | Poleas

NIVEL 5 — TIPO DE CONTRACCIÓN:
  Concéntrico | Excéntrico | Isométrico | Isotónico | Pliométrico
```

### 3.2 Filtros de Búsqueda en la Biblioteca

```yaml
Filtros disponibles para trainers y ZEUS:

  Por objetivo: perdida_peso | masa_muscular | fuerza | definicion |
                resistencia | rehabilitacion | mantenimiento | deporte

  Por nivel: principiante | intermedio | avanzado | elite

  Por grupo muscular: (cualquiera de la taxonomía nivel 3)

  Por patrón de movimiento: (taxonomía nivel 2)

  Por equipamiento disponible: selección múltiple de equipos del gym

  Por tiempo disponible: <30 min | 30-45 min | 45-60 min | >60 min

  Por parte del cuerpo: tren_superior | tren_inferior | cuerpo_completo | core

  Por posición: de_pie | sentado | tumbado | de_rodillas | inclinado

  Por contraindicación: excluir ejercicios contraindicados para X condición

  Por popularidad: más_usados | mejor_valorados | nuevos | recomendados_IA

  Búsqueda semántica (texto libre):
    "algo para los glúteos sin máquinas"
    "ejercicio de empuje para principiantes sin dolor de hombro"
    "alternativa al peso muerto con lesión de espalda"
    → ZEUS interpreta y filtra
```

---

## 4. CONTENIDO MULTIMEDIA POR EJERCICIO

### 4.1 Video de Técnica — Estándares de Producción

```yaml
Estándar de video por ejercicio:

  VIDEO TÉCNICA PRINCIPAL (30-60 segundos):
    Estructura narrativa:
      00-05 seg: nombre del ejercicio + músculos que trabaja (pantalla + voz)
      05-15 seg: posición inicial — ángulo frontal
      15-30 seg: ejecución completa — 3 ángulos (frontal, lateral, diagonal)
      30-45 seg: puntos clave señalados con flechas/highlights
      45-60 seg: error #1 más común y corrección visual

    Requerimientos técnicos:
      Resolución: 1080p mínimo, 4K recomendado
      Velocidad: velocidad normal + cámara lenta (0.25x) para fases clave
      Audio: voz de ZEUS (TTS) o narración profesional en español
      Subtítulos: automáticos (para uso sin sonido en el gym)
      Marca de agua: logo del gym superpuesto sutilmente

    Modalidades de reproducción en la app:
      📱 Vista compacta (thumbnail + play durante la sesión)
      📺 Vista pantalla completa (con rotación horizontal)
      🔄 Bucle automático (repetición durante el descanso entre series)
      ⏩ Velocidades: 0.5x | 1x | 1.5x | Cámara lenta automática en fase difícil

    Descarga offline:
      El plan de la semana se descarga en WiFi
      Videos disponibles sin conexión durante la sesión en el gym

  VIDEO DE ERRORES FRECUENTES (20-40 segundos):
    Muestra el error visualmente (con ícono ❌)
    Muestra la corrección (con ícono ✅)
    Narrado por ZEUS con explicación empática (no regañando)

  GIF PREVIEW (5-8 segundos):
    Loop infinito del movimiento completo
    Para previsualización rápida en el catálogo
    Formato: .gif optimizado o .webp animado

  AUDIO COACHING (30-60 segundos):
    ZEUS lee las instrucciones técnicas en voz natural
    El miembro puede escuchar mientras ejecuta (auriculares)
    Sin necesidad de ver la pantalla durante el movimiento
    Incluye conteo de repeticiones opcional
```

### 4.2 Mapa de Activación Muscular (SVG Interactivo)

```
SILUETA HUMANA INTERACTIVA:

  Vistas disponibles:
    [Vista Frontal]  [Vista Posterior]  [Vista Lateral]  [Vista 3D]

  Codificación por color de intensidad:
    🔴 Rojo intenso:    >70% activación (músculo primario principal)
    🟠 Naranja:         50-70% activación (músculo primario secundario)
    🟡 Amarillo:        25-50% activación (músculo secundario)
    🔵 Azul claro:      10-25% activación (estabilizador)
    ⚪ Sin color:       Sin participación relevante

  Interactividad (tap en músculo):
    Al tocar un área de la silueta → popup informativo:
    "Cuádriceps: 75% de activación
     Región: Muslo anterior
     Función: Extensión de la rodilla
     💡 Tip: Enfoca tu mente aquí durante la subida (conexión mente-músculo)"

  Animación durante la ejecución:
    Los músculos se "iluminan" progresivamente durante el video
    sincronizados con las fases del movimiento

  Vista de balance muscular:
    Muestra desequilibrios: "Tu entrenamiento esta semana trabajó más
    el cuádriceps (derecho) que el izquierdo — considera ejercicios unilaterales"
```

---

## 5. BIBLIOTECA DE RUTINAS & PLANTILLAS

### 5.1 Arquitectura de la Biblioteca de Rutinas

```
BIBLIOTECA DE RUTINAS
│
├── 📖 PLANTILLAS DEL SISTEMA (precargadas, basadas en evidencia)
│   │
│   ├── POR OBJETIVO:
│   │   ├── 💪 Ganancia de Masa Muscular
│   │   │   ├── PPL (Push-Pull-Legs) 3-6 días
│   │   │   ├── Torso-Pierna (Upper-Lower) 4 días
│   │   │   ├── Full Body 3 días (principiantes)
│   │   │   └── Arnold Split 6 días
│   │   │
│   │   ├── 🔥 Pérdida de Peso & Definición
│   │   │   ├── HIIT + Fuerza 4 días
│   │   │   ├── Circuit Training 3-4 días
│   │   │   ├── Fuerza Metabólica 5 días
│   │   │   └── Cardio + Tonificación 3 días
│   │   │
│   │   ├── 🏋️ Fuerza Máxima
│   │   │   ├── StrongLifts 5x5 (principiantes)
│   │   │   ├── 5/3/1 Wendler
│   │   │   ├── GZCLP
│   │   │   └── Texas Method
│   │   │
│   │   ├── 🏃 Resistencia & Cardio
│   │   │   ├── Cardio Progresivo 3 días
│   │   │   ├── HIIT Protocolos (Tabata, EMOM, AMRAP)
│   │   │   └── Crossfit-style WOD
│   │   │
│   │   ├── 🤸 Movilidad & Bienestar
│   │   │   ├── Movilidad Total 3 días
│   │   │   ├── Yoga Fitness
│   │   │   └── Stretching Post-Entreno
│   │   │
│   │   └── 🩺 Rehabilitación (requiere aprobación del trainer)
│   │       ├── Retorno al entreno post-lesión
│   │       ├── Corrección postural
│   │       └── Fortalecimiento preventivo
│   │
│   ├── POR NIVEL:
│   │   ├── 🟢 Principiante (semanas 1-12)
│   │   ├── 🟡 Intermedio (6 meses - 2 años)
│   │   ├── 🔴 Avanzado (2+ años)
│   │   └── ⚫ Élite (competidores, atletas)
│   │
│   └── POR ESPECIALIDAD DEPORTIVA:
│       ├── Fútbol, basketball, tenis
│       ├── Atletismo, natación, ciclismo
│       ├── Artes marciales, boxeo
│       └── Escalada, surf, CrossFit
│
├── 👨‍🏫 RUTINAS DE MIS TRAINERS (biblioteca privada + compartida del gym)
│   ├── Rutinas guardadas por cada trainer
│   ├── Rutinas marcadas como "compartir con el gym"
│   └── Templates de programas por categoría
│
└── 🔬 RUTINAS DE INVESTIGACIÓN (aprobadas por el admin)
    ├── Protocolos científicamente validados recientes
    ├── Metodologías emergentes aprobadas
    └── Rutinas de especialistas invitados
```

### 5.2 Ficha de Plantilla de Rutina

```yaml
plantilla_rutina:
  id: UUID
  nombre: "PPL Hipertrofia — Intermedio 6 días"
  descripcion: "Push-Pull-Legs para ganancia muscular máxima.
                Diseñado para personas con 1-3 años de experiencia
                con acceso a equipamiento completo de gimnasio."

  objetivo: ganancia_muscular
  nivel: intermedio
  dias_por_semana: 6
  duracion_sesion_min: 60
  duracion_programa_semanas: 12

  estructura_semanal:
    lunes:    {tipo: "Push A", descripcion: "Pectoral, Hombro Anterior, Tríceps"}
    martes:   {tipo: "Pull A", descripcion: "Dorsal, Trapecio, Bíceps"}
    miercoles:{tipo: "Legs A", descripcion: "Cuádriceps dominante"}
    jueves:   {tipo: "Push B", descripcion: "Hombro, Pectoral Superior, Tríceps"}
    viernes:  {tipo: "Pull B", descripcion: "Dorsal ancho, Bíceps, Romboides"}
    sabado:   {tipo: "Legs B", descripcion: "Isquiotibiales, Glúteos, Pantorrilla"}
    domingo:  {tipo: "Descanso activo", descripcion: "Movilidad o caminata"}

  principios_aplicados:
    - "Frecuencia por músculo: 2x por semana (evidencia óptima para hipertrofia)"
    - "Volumen: 16-20 series por grupo muscular por semana"
    - "Progresión: sobrecarga progresiva doble (peso y volumen)"
    - "Periodización: bloque de acumulación semanas 1-4, intensificación 5-8, deload 9, peak 10-12"

  parametros_periodizacion:
    tipo: "linear_periodization"
    bloque_1: {semanas: "1-4", objetivo: "acumulacion", intensidad: "65-75%", volumen: "alto"}
    bloque_2: {semanas: "5-8", objetivo: "intensificacion", intensidad: "75-85%", volumen: "medio"}
    bloque_3: {semanas: "9",   objetivo: "deload", intensidad: "50-60%", volumen: "bajo"}
    bloque_4: {semanas: "10-12", objetivo: "pico", intensidad: "85-90%", volumen: "bajo-medio"}

  evaluaciones_incluidas:
    semana_4:  "Evaluación de progreso — ajuste de cargas"
    semana_8:  "Evaluación intermedia — foto de progreso + medidas"
    semana_12: "Evaluación final — comparativa completa"

  requisitos_previos:
    - "Conocimiento de técnica básica en ejercicios compuestos"
    - "Historial de entrenamiento: mínimo 3 meses continuos"
    - "Sin lesiones activas en hombros, rodillas o espalda"
    - "Capacidad de entrenar 6 días a la semana"

  nutricion_sugerida:
    superavit_calorico: "200-300 kcal sobre mantenimiento"
    proteina_g_kg: "1.8-2.2"
    nota: "Coordinar con el plan nutricional del módulo C"

  fuente: "Basado en evidencia de Schoenfeld (2010), Krieger (2010), Helms et al. (2014)"
  rating_trainers: 4.9
  veces_asignada: 234
  creada_por: "Sistema"
  actualizada: "2026-03-10"
```

---

## 6. SISTEMA DE PERIODIZACIÓN

### 6.1 Tipos de Periodización Soportados

```yaml
Periodización Lineal (LP):
  descripción: "Aumenta progresivamente la intensidad semana a semana"
  ideal_para: "Principiantes e intermedios — progreso continuo predecible"
  ejemplo:
    semana_1: "3×12 al 65% 1RM"
    semana_2: "3×10 al 70% 1RM"
    semana_3: "3×8 al 75% 1RM"
    semana_4: "3×6 al 80% 1RM"
    semana_5: "Deload — 2×12 al 55%"
  automatización: "El sistema sube el peso automáticamente según progresión"

Periodización Ondulante Diaria (DUP — Daily Undulating Periodization):
  descripción: "Varía el estímulo cada día dentro de la misma semana"
  ideal_para: "Intermedios y avanzados — evita adaptación rápida"
  ejemplo:
    lunes:    "Fuerza — 5×5 al 80%"
    miercoles:"Hipertrofia — 4×10 al 70%"
    viernes:  "Resistencia-Fuerza — 3×15 al 60%"
  automatización: "ZEUS ajusta la prescripción según el volumen acumulado"

Periodización por Bloques (Block Periodization):
  descripción: "Bloques de 3-6 semanas con énfasis específico"
  bloques:
    - nombre: "Acumulación (volumen alto)"
      semanas: 4
      enfoque: "Construir base — alta densidad, intensidad media"
    - nombre: "Transmutación (calidad de fuerza)"
      semanas: 3
      enfoque: "Convertir el volumen en fuerza"
    - nombre: "Realización (pico de rendimiento)"
      semanas: 2
      enfoque: "Expresar la fuerza máxima"
    - nombre: "Deload (recuperación)"
      semanas: 1
      enfoque: "Recuperar — reducir todo 40-50%"

Periodización Conjugada (Método Westside):
  descripción: "Desarrolla múltiples cualidades simultáneamente"
  ideal_para: "Avanzados, powerlifters"
  estructura:
    dia_ME: "Esfuerzo máximo — trabajo con cargas >90% en ejercicio principal variante"
    dia_DE: "Esfuerzo dinámico — trabajo explosivo con 55-70% a máxima velocidad"

Progresión Doble (Double Progression):
  descripción: "Primero llena las reps del rango, luego sube el peso"
  ideal_para: "Cualquier nivel — muy intuitivo"
  ejemplo:
    objetivo: "3×8-12 sentadilla"
    semana_1: "3×8 a 80kg (límite inferior del rango)"
    semana_2: "3×10 a 80kg"
    semana_3: "3×12 a 80kg (límite superior alcanzado)"
    semana_4: "3×8 a 85kg (sube 5kg, vuelve al límite inferior)"
  automatización: "★ EL MÁS RECOMENDADO PARA EL GYM — intuitivo y efectivo"
```

### 6.2 Semanas de Deload (Descarga)

```yaml
Deload automático:
  cuándo se activa (cualquiera de estos):
    - Cada 4-6 semanas según la plantilla
    - Cuando el RPE promedio de los últimos 5 entrenos > 9.0
    - Cuando hay 3 sesiones consecutivas sin superar el peso anterior
    - Cuando los datos de HRV del wearable muestran fatiga acumulada alta
    - Manualmente por el trainer en el plan

  tipos de deload:
    Deload de volumen: reducir series 50%, mantener intensidad
    Deload de intensidad: reducir peso 40-50%, mantener series
    Deload completo: reducir todo 50% + movilidad extra
    Deload activo: solo cardio ligero + movilidad (para muy fatigados)

  ZEUS avisa al miembro: 'Esta semana es tu semana de descarga 💆
    Puede parecer poco, pero el cuerpo necesita este tiempo
    para crecer y volverse más fuerte. Los estudios muestran
    que las 2 semanas post-deload son las de mayor progreso.
    ¡Confía en el proceso! 💪'
```

---

# PARTE II — WORKOUT BUILDER (PANEL DEL TRAINER)

---

## 7. INTERFAZ DEL WORKOUT BUILDER — TRAINER

### 7.1 Panel del Trainer — Visión General

```
PANEL DEL TRAINER — Carlos Gutiérrez
╔══════════════════════════════════════════════════════════════════╗
║  🏋️ WORKOUT BUILDER                                              ║
╠══════════════════════════════════════════════════════════════════╣
║  [📋 Mis Planes]  [📚 Biblioteca]  [👥 Mis Clientes]  [🤖 IA]  ║
╠════════════════════════════╦═════════════════════════════════════╣
║  MIS CLIENTES (18)         ║  CREAR NUEVO PLAN                  ║
║                            ║                                    ║
║  🔴 María G. — Plan vence  ║  [🤖 Crear con IA Asistida]        ║
║  🟡 Pedro R. — Semana 3    ║  [📋 Desde Plantilla]              ║
║  🟢 Ana T. — Semana 6      ║  [✏️ Crear desde Cero]             ║
║  🟢 Luis M. — Semana 10   ║  [📂 Duplicar Plan Existente]       ║
║  ...                       ║                                    ║
║  [Ver todos mis clientes]  ║                                    ║
╚════════════════════════════╩═════════════════════════════════════╝
```

### 7.2 Interfaz del Workout Builder — Vista Detallada

```
WORKOUT BUILDER — Plan de María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMACIÓN DEL PLAN:
  Nombre:         [Programa Pérdida de Peso — Fase 2        ]
  Objetivo:       [Pérdida de peso ▼]
  Duración:       [12 semanas]
  Días/semana:    [3 días ▼]
  Nivel:          [Intermedio ▼]
  Inicio:         [15/06/2026]

  Notas para María:
  [Este plan es la segunda fase de tu programa. Aumentamos
   la intensidad. ¡Ya estás lista para este nivel! 💪       ]

ESTRUCTURA SEMANAL:
  [+ Agregar Día]

  ┌─────────────────────────────────────────────────────────┐
  │  DÍA A — Lunes: Piernas, Glúteos & Core               │
  │  [✏️ Renombrar] [📋 Duplicar] [🗑️ Eliminar] [↕️ Mover] │
  ├─────────────────────────────────────────────────────────┤
  │  🔥 CALENTAMIENTO (5 min)                               │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │ ✓ Caminata en cinta             5 min 5 km/h       │ │
  │  │ ✓ Movilidad de cadera           10 reps            │ │
  │  │ [+ Agregar ejercicio de calentamiento]             │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                         │
  │  💪 BLOQUE PRINCIPAL                                    │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │ 1. Sentadilla Hack con Máquina                     │ │
  │  │    Series: [4]  Reps: [10-12]  Carga: [%1RM ▼] 70 │ │
  │  │    Descanso: [90 seg]  Tempo: [3-1-2-0]            │ │
  │  │    RPE objetivo: [7-8]                             │ │
  │  │    Cue del trainer: [Rodillas alineadas siempre]   │ │
  │  │    [🎥 Video] [💪 Músculos] [↕️] [🔄 Sustituir] [🗑️]│ │
  │  │                                                    │ │
  │  │ 2. Hip Thrust con Barra                            │ │
  │  │    Series: [4]  Reps: [12-15]  Carga: [kg] 40     │ │
  │  │    Descanso: [75 seg]  Progresión: [+2.5 kg/sem]  │ │
  │  │    [🎥 Video] [💪 Músculos] [↕️] [🔄 Sustituir] [🗑️]│ │
  │  │                                                    │ │
  │  │ ┌─ SUPERSET (A) ──────────────────────────────────┐│ │
  │  │ │ A1. Extensión de pierna    3×15  45 seg descanso ││ │
  │  │ │ A2. Curl femoral           3×15  45 seg          ││ │
  │  │ │ [Convertir a ejercicios separados]              ││ │
  │  │ └─────────────────────────────────────────────────┘│ │
  │  │                                                    │ │
  │  │ [🔍 Buscar ejercicio para agregar...]              │ │
  │  │ [🤖 Pedir sugerencia a la IA]                      │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                         │
  │  🧘 VUELTA A LA CALMA (5 min)                          │
  │  ┌────────────────────────────────────────────────────┐ │
  │  │ ✓ Estiramiento cuádriceps bilateral  30 seg c/u    │ │
  │  │ ✓ Estiramiento de glúteo (figura 4)  30 seg c/u    │ │
  │  └────────────────────────────────────────────────────┘ │
  │                                                         │
  │  📊 RESUMEN DÍA A:                                     │
  │  Tiempo total: ~55 min | Volumen: 16 series            │
  │  Músculos trabajados: 🔴Cuádriceps 🔴Glúteos 🟠Core    │
  └─────────────────────────────────────────────────────────┘
```

### 7.3 Tipos de Bloques de Ejercicios

```yaml
Tipos de agrupación de ejercicios soportados:

  Ejercicio estándar (individual):
    Sets × Reps normales
    Un ejercicio, descanso completo entre series

  Superset (2 ejercicios):
    A1 → A2 → descanso → A1 → A2...
    Músculos antagonistas o mismo músculo (intensificación)
    El sistema calcula el tiempo total incluyendo transiciones

  Giant Set (3-4 ejercicios):
    A1 → A2 → A3 → descanso → repetir
    Para condicionamiento o cuando el tiempo es limitado

  Circuit Training:
    Estación 1 → 2 → 3 → ... → descanso → repetir el circuito X veces
    Tiempo por estación O reps por estación
    Ideal para sesiones cardio-fuerza combinadas

  EMOM (Every Minute On the Minute):
    Al inicio de cada minuto: ejecutar X reps del ejercicio
    El tiempo restante del minuto = descanso
    El sistema maneja el timer automáticamente

  AMRAP (As Many Rounds/Reps As Possible):
    En X minutos: ejecutar el circuito la mayor cantidad de veces posible
    El sistema registra las rondas completadas

  TABATA:
    20 segundos trabajo / 10 segundos descanso × 8 rondas = 4 minutos
    El sistema maneja todo el timing

  Trabajo por Tiempo (Time-based):
    En lugar de reps: ejecutar el ejercicio por X segundos
    Para ejercicios de cardio o isométricos (plancha, etc.)

  Drop Set:
    Serie con peso máximo → reducir peso inmediatamente → continuar
    El sistema pide al usuario ingresar la carga reducida

  Pirámide Ascendente / Descendente:
    12 reps → 10 reps → 8 reps → 6 reps (subiendo peso)
    O al revés (bajando peso)
    El sistema sugiere el incremento de carga

  Rest-Pause:
    Serie pesada → pausa 10-15 seg → continuar la serie → pausa → continuar
    Para intensificación avanzada
```

---

## 8. CONSTRUCTOR DE PLAN DE ENTRENAMIENTO

### 8.1 Vista de Plan Multi-Semana (Macrociclo)

```
VISTA DE MACROCICLO — 12 Semanas
═══════════════════════════════════════════════════════════════

BLOQUE 1: ADAPTACIÓN (Semanas 1-4)
  Objetivo: Aprender la técnica y acostumbrar el cuerpo
  Intensidad: Baja-Media | Volumen: Medio

  S1  S2  S3  S4
  ◉───◉───◉───◉    Día A: Piernas + Glúteos
  ◉───◉───◉───◉    Día B: Torso Superior + Brazos
  ◉───◉───◉───◉    Día C: Cardio + Core + Movilidad

BLOQUE 2: DESARROLLO (Semanas 5-8)
  Objetivo: Aumentar la sobrecarga progresiva
  Intensidad: Media-Alta | Volumen: Alto

  S5  S6  S7  S8
  ◉───◉───◉───◉    Día A: Piernas (más volumen)
  ◉───◉───◉───◉    Día B: Torso + HIIT
  ◉───◉───◉───◉    Día C: Full Body + Core

BLOQUE 3: INTENSIFICACIÓN (Semanas 9-11)
  Objetivo: Máxima intensidad y resultados
  Intensidad: Alta | Volumen: Medio-Alto

SEMANA 12: DELOAD
  Objetivo: Recuperación activa
  [Ver detalles del deload]

═══════════════════════════════════════════════════════════════
[👁️ Vista calendario]  [📋 Vista lista]  [📊 Vista analytics]
[📤 Exportar plan PDF]  [✅ Asignar a María]
```

### 8.2 Progresión Automática de Cargas

```yaml
Configuración de progresión por ejercicio:
  progression_type: double_progression # La más recomendada para el gym

  double_progression:
    rep_range_min: 10
    rep_range_max: 12
    weight_increment_kg: 2.5 # cuánto subir cuando completa el rango
    regla: 'Cuando completes 3×12 con buena técnica → próxima semana 3×10 con +2.5kg'

  linear_progression:
    increment_per_session: 2.5 # sumar X kg cada sesión exitosa

  percentage_progression:
    increment_per_week: 2.5 # % del 1RM sube X% cada semana

  volume_progression:
    add_set_every_n_weeks: 2 # agregar 1 serie cada 2 semanas
    max_sets: 5

  autoregulation_RIR: # Basado en Reps In Reserve
    target_RIR: 2 # el alumno debe terminar con 2 reps en el tanque
    if_RIR_more_than_3: 'subir carga 5% la próxima sesión'
    if_RIR_less_than_1: 'mantener carga hasta recuperar técnica perfecta'
```

### 8.3 Panel de Balance Muscular del Programa

```
ANÁLISIS DE BALANCE DEL PLAN — María García

DISTRIBUCIÓN DE VOLUMEN SEMANAL:
                    Sets/semana  Objetivo  Estado
  Pectoral:         ████░░░░  8    ≥10     ⚠️ Bajo
  Dorsal:           ██████░░  12   ≥12     ✅ Ok
  Hombro:           █████░░░  10   ≥10     ✅ Ok
  Bíceps:           ████░░░░  8    ≥8      ✅ Ok
  Tríceps:          ████░░░░  8    ≥8      ✅ Ok
  Cuádriceps:       ████████  16   ≥16     ✅ Ok
  Isquiotibiales:   ██████░░  12   ≥12     ✅ Ok
  Glúteos:          ████████  16   ≥12     ✅ Excelente
  Core:             ██████░░  12   ≥10     ✅ Ok

RATIO EMPUJE:JALE:
  Horizontal → 1:1.2 (Push: 10 sets · Pull: 12 sets) ✅ Recomendado: 1:1 a 1:1.2
  Vertical   → 1:1.5 (Push: 6 sets · Pull: 9 sets)   ✅ Recomendado: 1:1 a 1:1.5

ALERTAS DEL TRAINER:
  ⚠️ "El pectoral está 2 series por debajo del mínimo. Sugiero agregar
      2 series de apertura con mancuernas al Día B."
  💡 "El volumen de glúteos es excelente para el objetivo de María.
      Mantener esta priorización en el bloque 2."

[Aplicar sugerencia automática] [Ver plan corregido]
```

---

## 9. IA ASISTENTE DEL TRAINER (CO-PILOTO DE PROGRAMACIÓN)

### 9.1 Generación de Plan con IA

ABC Trainerize reporta que los trainers que usan su AI Workout Builder reducen el tiempo de programación en 50%, ya que la IA genera el plan base con el contexto real del cliente mediante una interfaz conversacional que permite refinamiento en tiempo real. Nuestro sistema va un paso más allá:

```
FLUJO DE CREACIÓN CON IA:

TRAINER: [Selecciona a María García → Crear Plan con IA]

PANTALLA: "Cuéntame sobre el plan que quieres crear para María"

TRAINER escribe o dicta:
  "Crea un plan de 3 días para pérdida de peso. María es intermedia,
   tiene 6 meses de experiencia. No puede hacer ejercicios con mucho
   impacto por rodillas sensibles. Tiene acceso a todo el equipamiento
   del gym. Quiero énfasis en glúteos y core."

IA PROCESA (contexto del alumno):
  ✅ Leyó el perfil de María:
     - Objetivo: perder 8 kg en 12 semanas
     - Nivel: Intermedio (evaluación del 01/05/26)
     - Restricciones: rodilla sensible derecha (nota médica)
     - Métricas: 68 kg, 28% grasa corporal
     - Historial: 6 meses entrenando, últimos PR registrados
     - Plan anterior: completó Plan Pérdida Peso Fase 1 (semanas 1-8)

IA GENERA BORRADOR:
  "Creé un plan de 12 semanas, 3 días/semana para María,
   adaptado a sus condicionantes. Aquí está el borrador:

   📋 Día A: Piernas y Glúteos (bajo impacto)
   • Hip Thrust con Barra — eliminé sentadillas con salto por sus rodillas
   • Leg Press 45° — en lugar de Hack Squat (menos estrés rotuliano)
   • Abducción de cadera en máquina — prioridad glúteo medio
   • Extensión de pierna (rango reducido)
   • Plancha con progresiones

   📋 Día B: Torso + Cardio Metabolico
   📋 Día C: Full Body + Core

   He aplicado periodización lineal con progresión doble.
   El volumen inicia en 12 series/grupo y llega a 18 en semana 8.

   ¿Ajustas algo? Puedo modificar cualquier cosa."

TRAINER puede:
  ✅ Aprobar el plan directo
  ✏️ Editar ejercicios específicos en el builder
  💬 Continuar el diálogo: "Agrega HIIT al Día C, 15 minutos"
  🔄 Regenerar con diferentes parámetros
  📋 Mezclar con plantillas existentes
```

### 9.2 Sugerencias Contextuales del Co-Piloto

```yaml
Durante la creación del plan, el Co-Piloto IA sugiere en tiempo real:
  Al agregar ejercicio de pierna: '💡 Sugerencia: Ya tienes 3 ejercicios de cuádriceps.
    ¿Añades un ejercicio de isquiotibial para balancear?
    [Ver sugerencias de isquiotibiales]'

  Al configurar volumen muy alto: '⚠️ Advertencia: 22 series de pectoral por semana puede ser
    excesivo para el nivel intermedio de Pedro (riesgo de
    sobre-entrenamiento y meseta). Investigación de Krieger (2010)
    sugiere 10-20 series como óptimo para hipertrofia.
    [Aceptar de todas formas] [Reducir a 16 series]'

  Al elegir ejercicio de riesgo con historial médico:
    '🚨 Precaución: María tiene rodilla sensible documentada.
    El Peso Muerto Rumano puede ser problemático con alta carga.
    Alternativa sugerida: Extensión de cadera en máquina (sin
    carga en rodilla). ¿Quieres cambiar? [Sí] [Mantener ejercicio]'

  Al completar el plan: '✅ Plan listo. Resumen de calidad:
    - Balance muscular: 8.5/10 (ver sugerencia menor en pectoral)
    - Periodización: correcta (DUP aplicado)
    - Volumen total: óptimo para objetivo de María
    - Restricciones respetadas: ✅
    - Tiempo estimado por sesión: 48-55 min
    [Ver reporte completo] [Asignar a María]'
```

---

## 10. ASIGNACIÓN Y GESTIÓN DE PLANES

### 10.1 Asignación al Miembro

```yaml
Proceso de asignación:

  1. Trainer selecciona el plan terminado
  2. Revisa el resumen de calidad del plan
  3. Personaliza la nota de entrega:
     "María, este es tu Plan Fase 2. Incrementamos la intensidad
      respecto a la Fase 1. Presta atención a la técnica de Hip Thrust
      — puse un video especial. ¡Tú puedes! 💪 — Carlos"

  4. Configura las opciones de asignación:
     □ Notificar al miembro inmediatamente
     □ Programar inicio: [15/06/2026]
     □ Sesión de introducción al plan: [Agendar cita]
     □ Enviar PDF del plan por email
     □ Permitir al miembro ver el plan completo ○ Sólo el día actual

  5. Sistema activa el plan:
     - El miembro ve el plan en su app
     - ZEUS recibe el contexto del plan para asistencia
     - CRM actualiza el estado del alumno
     - ARIA envía mensaje de bienvenida al nuevo plan
```

### 10.2 Seguimiento del Trainer — Panel de Alumnos

```
MIS CLIENTES — Dashboard del Trainer Carlos G.

CLIENTES ACTIVOS (18)
═══════════════════════════════════════════════════════════════
  NOMBRE          PLAN              SEM   ADHER.  PROGRESO   ALERTA
  María García    Pérdida Peso F2   6/12  78%     ▲ Bueno    ⚠️ PR roto
  Pedro Ramírez   PPL Hipertrofia   3/12  91%     ▲ Excelente ⭐
  Ana Torres      Fuerza Inicial    8/12  55%     ▬ Meseta   🔴 Bajo
  Luis Moreno     Rehabilitación    4/8   88%     ▲ Bueno    ✅
  Carmen Ruiz     Plan Custom       2/10  100%    ▲ Sorpresa ⭐⭐

ALERTAS DE ESTA SEMANA:
  🔴 Ana Torres no completó 3 de 5 sesiones — Risk Score 68
     [Ver perfil] [Enviar mensaje] [Ajustar plan]

  ⭐ Pedro Ramírez batió su PR en Press de Banca: 80 kg × 5
     [Enviar felicitación] [Ver su progreso]

  📊 Carlos Mejía completa 4 semanas — evaluación de progreso sugerida
     [Agendar evaluación]

RENDIMIENTO DE MIS PLANES (últimos 3 meses):
  Adherencia promedio de mis clientes:    79%  (gym: 71%)
  PRs generados esta semana:              12
  Clientes que alcanzaron su meta:         3
  Clientes en riesgo de abandono:         2
  Rating promedio de mis planes:          4.8/5.0
```

---

# PARTE III — EXPERIENCIA DEL MIEMBRO (APP)

---

## 11. DASHBOARD DE ENTRENAMIENTO DEL MIEMBRO

### 11.1 Pantalla Principal de Entrenamiento

```
📱 PANTALLA ENTRENAMIENTO — María García

╔════════════════════════════════════════════════════╗
║  💪 MI ENTRENAMIENTO                    12:34pm    ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  PLAN: Pérdida de Peso Fase 2                      ║
║  Semana 6 de 12  ████████░░░░  50%                 ║
║                                                    ║
║  HOY: MARTES — DÍA B (Torso + Cardio)             ║
║  ┌──────────────────────────────────────────────┐  ║
║  │  🔥 LISTO PARA EMPEZAR                       │  ║
║  │  Duración estimada: 52 min                   │  ║
║  │  Ejercicios: 8   •   Series: 22              │  ║
║  │                                              │  ║
║  │  [▶️ COMENZAR ENTRENAMIENTO]                  │  ║
║  └──────────────────────────────────────────────┘  ║
║                                                    ║
║  RACHA ACTUAL: 🔥 12 días consecutivos             ║
║                                                    ║
║  MI SEMANA:                                        ║
║  Lu ✅  Ma ▶️  Mi 🔲  Ju 🔲  Vi 🔲  Sa 🔲  Do 🔲   ║
║                                                    ║
║  ESTO SEMANA:                                      ║
║  📊 Volumen total: 2,840 kg levantados            ║
║  ⭐ 1 PR batido: Leg Press 110 kg                  ║
╠════════════════════════════════════════════════════╣
║  PRÓXIMOS DÍAS:                                    ║
║  Jueves → Día C: Full Body + Core                 ║
║  Sábado → Día A: Piernas + Glúteos (repite)       ║
║                                                    ║
║  MENSAJE DE CARLOS (tu trainer):                  ║
║  "María, esta semana agrega 2.5kg al Hip Thrust.  ║
║   ¡Llevas semanas comiéndotelo con técnica perfecta!║
║   — Carlos 💪"                                    ║
╚════════════════════════════════════════════════════╝
```

---

## 12. EJECUCIÓN DE LA SESIÓN EN TIEMPO REAL

### 12.1 Flujo de la Sesión Completa

```
AL PRESIONAR "COMENZAR ENTRENAMIENTO":

PANTALLA 1: CALENTAMIENTO
  ╔══════════════════════════════════════════════╗
  ║  🔥 CALENTAMIENTO (5 min)                    ║
  ║  DÍA B — Torso + Cardio Metabólico           ║
  ╠══════════════════════════════════════════════╣
  ║                                              ║
  ║  1. Caminata en cinta         5 min 5 km/h  ║
  ║     [▶️ Iniciar timer 5:00]                  ║
  ║                                              ║
  ║  2. Círculos de hombros       10 reps c/lado ║
  ║     [✅ Completado]                          ║
  ║                                              ║
  ║  ZEUS: "Antes de empezar hoy, quiero         ║
  ║   recordarte: mantén los omóplatos retrae-   ║
  ║   dos en todos los ejercicios de empuje.     ║
  ║   Esto protege tus hombros y maximiza el     ║
  ║   trabajo del pectoral 💪"                   ║
  ║                                              ║
  ║  [⏭️ Saltar calentamiento]                   ║
  ║  [▶️ Comenzar bloque principal]               ║
  ╚══════════════════════════════════════════════╝

PANTALLA 2: EJERCICIO INDIVIDUAL (Diseño mínimo fricción)
  ╔══════════════════════════════════════════════╗
  ║  Ejercicio 1 de 8  ·  Serie 1 de 4          ║
  ╠══════════════════════════════════════════════╣
  ║                                              ║
  ║  [  VIDEO/GIF DEL EJERCICIO EN BUCLE  ]      ║
  ║  [  Toca para pantalla completa      ]       ║
  ║                                              ║
  ║  PRESS DE BANCA CON BARRA                   ║
  ║  Pectoral · Hombro Ant. · Tríceps           ║
  ║                                              ║
  ╠══════════════════════════════════════════════╣
  ║  PRESCRIPCIÓN:                               ║
  ║  ████████████  4 series × 10-12 reps        ║
  ║  Peso objetivo: 42.5 kg  (↑ 2.5 kg hoy)    ║
  ║  Descanso: 90 seg  ·  Tempo: 3-1-2-0        ║
  ║                                              ║
  ║  REGISTRAR ESTA SERIE:                       ║
  ║  ┌─────────────┬──────────────────────────┐ ║
  ║  │  PESO (kg)  │          REPS            │ ║
  ║  │  ┌───────┐  │  ┌───┐  ┌───┐  ┌───┐   │ ║
  ║  │  │  42.5 │  │  │ 8 │  │ 9 │  │10 │   │ ║
  ║  │  └───────┘  │  └───┘  └───┘  └───┘   │ ║
  ║  │  [-] [+]   │  [-] [+] más opciones   │ ║
  ║  └─────────────┴──────────────────────────┘ ║
  ║                                              ║
  ║  RPE: [6] [7] [8] [9] [10]  (¿qué tan       ║
  ║       difícil fue?) — opcional              ║
  ║                                              ║
  ║  [✅ SERIE COMPLETADA → INICIAR DESCANSO]    ║
  ╚══════════════════════════════════════════════╝

PANTALLA 3: DESCANSO ENTRE SERIES (Timer)
  ╔══════════════════════════════════════════════╗
  ║  ⏱️ DESCANSO                                 ║
  ╠══════════════════════════════════════════════╣
  ║                                              ║
  ║            01:23                             ║
  ║         ████████░░  (90 seg)                 ║
  ║                                              ║
  ║  SERIE 1 completada: 42.5 kg × 11 reps      ║
  ║  ⭐ ¡Superaste tu récord anterior de 10 reps!║
  ║                                              ║
  ║  DURANTE EL DESCANSO:                        ║
  ║  ZEUS: "Excelente trabajo en la primera      ║
  ║   serie, Mari. En la siguiente serie,        ║
  ║   intenta bajar más lento (3 segundos)       ║
  ║   para maximizar el tiempo bajo tensión 💡"  ║
  ║                                              ║
  ║  [🎥 Repasar técnica]  [💪 Ver músculos]    ║
  ║  [⏭️ Saltar descanso]                        ║
  ╚══════════════════════════════════════════════╝

PANTALLA 4: RESUMEN POST-EJERCICIO (aparece al completar todas las series)
  "Press de Banca completado ✅
   Mejor serie: 42.5 kg × 11 reps
   Volumen total: 42.5 × 40 reps = 1,700 kg
   vs. semana pasada: +85 kg de volumen (+5%) ↑"
  [Continuar al siguiente ejercicio →]
```

### 12.2 Pantalla de Resumen de Sesión (Post-Entreno)

```
🏆 SESIÓN COMPLETADA — DÍA B
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DURACIÓN REAL: 54 min (estimada: 52 min)

RESUMEN DE RENDIMIENTO:
  Ejercicios completados:   8/8  ✅
  Series totales:          22/22 ✅
  Volumen total:           4,285 kg
  vs. sesión anterior:     +320 kg ↑ 7.5%

PERSONALES RÉCORDS HOY:
  🥇 Press de Banca: 42.5 kg × 11 reps (anterior: ×10)
  🥇 Remo con Barra: 45 kg × 12 reps (nuevo peso)

ANÁLISIS DE RPE (esfuerzo percibido):
  Promedio RPE: 7.4/10 — Zona óptima de hipertrofia ✅
  Ejercicio más difícil: HIIT final (RPE 9)

GRUPOS MUSCULARES TRABAJADOS:
  [Silueta con áreas activadas coloreadas]
  🔴 Pectoral · 🔴 Dorsal · 🟠 Hombros
  🟡 Bíceps · 🟡 Tríceps · 🔵 Core

RECUPERACIÓN ESTIMADA:
  Pectoral: necesita 48h antes del próximo trabajo intenso
  Dorsal: necesita 48h
  → ✅ Tu próximo entreno (Jueves-Día C) es Full Body + Core
     Sin conflicto de recuperación

MENSAJE DE ZEUS:
  "¡Sesión fantástica, María! 🎉 Tu volumen subió 7.5% esta semana.
   Estás en el camino correcto hacia tu meta.
   Bebe ~500ml de agua ahora y considera una fuente de proteína
   en los próximos 30 minutos para optimizar la recuperación 💪
   ¡Hasta el jueves!"

[📤 Compartir en el feed]  [📊 Ver gráficas detalladas]
[💬 Comentar a Carlos (trainer)]  [🏠 Volver al inicio]
```

---

## 13. COACH VIRTUAL ZEUS — ASISTENCIA TÉCNICA AVANZADA

### 13.1 Identidad y Personalidad de ZEUS

```yaml
ZEUS — Coach Virtual de Entrenamiento
  (Z: Zone · E: Expert · U: Universal · S: Support)

Perfil de personalidad:
  Nombre:       ZEUS (personalizable por el gym)
  Especialidad: Ciencia del ejercicio, técnica de movimiento,
                programación del entrenamiento, fisiología deportiva
  Tono:         Experto pero accesible — como el mejor trainer del mundo
                que también es tu amigo
  Vocabulario:  Técnico cuando debe serlo, simple cuando es necesario
  Valores:      Seguridad primero, resultados probados, progreso sostenible

ZEUS vs ARIA:
  ZEUS: Coach de entrenamiento — rutinas, técnica, progreso físico
  ARIA: Asistente de relaciones — motivación, citas, CRM, nutrición
  Trabajan en conjunto: ARIA puede escalar a ZEUS para preguntas técnicas
```

### 13.2 Capacidades de ZEUS

```yaml
ZEUS puede responder en texto Y audio (TTS):

  CATEGORÍA 1 — TÉCNICA DE EJERCICIOS:
    "¿Cómo se hace correctamente la sentadilla?"
    → ZEUS explica con referencias al video, activa el mapa muscular,
      menciona los 3 errores más comunes y cómo evitarlos

    "Siento dolor en la rodilla al hacer sentadilla"
    → ZEUS: "Eso es una señal importante. Primero: detente y no
      fuerces el movimiento. El dolor puede indicar varias cosas:
      [Posibles causas] → [Modificaciones seguras] → [Cuándo ver a un médico]
      ¿El dolor es agudo/punzante o sordo/difuso?
      (Si es agudo: detén el entrenamiento y consulta a un médico)"

    "¿Cuánto peso debo poner en el press de banca?"
    → ZEUS calcula basándose en el historial del miembro:
      "Según tus últimos registros, trabajaste con 40 kg la semana pasada
       con RPE 7. Para hoy, sugiero empezar con 40 kg y subir a 42.5 kg
       si las primeras 2 series se sienten a RPE 6-7."

  CATEGORÍA 2 — COMPRENSIÓN DEL PLAN:
    "¿Por qué hago Día B hoy y no el Día C?"
    → ZEUS: "Tu trainer Carlos organizó el plan para dar 48h de recuperación
      al dorsal después del Día A. Es la secuencia óptima según la periodización
      que diseñó para ti. Si necesitas cambiar el día, puedo ayudarte a
      reagendar sin romper la recuperación."

    "¿Para qué sirve el tempo 3-1-2-0?"
    → ZEUS explica la periodización del tempo con ejemplo práctico

  CATEGORÍA 3 — PROGRESO Y ANÁLISIS:
    "¿Cómo voy con mi objetivo?"
    → ZEUS genera resumen verbal con datos reales:
      "Llevas 6 semanas del plan. Tu fuerza en piernas subió 22%.
       Perdiste 1.8 cm de cintura desde la evaluación inicial.
       Vas por buen camino para alcanzar tu objetivo en semana 12."

    "¿Por qué no estoy progresando en el press?"
    → Análisis de ZEUS: revisa los últimos 4 registros, identifica el patrón
      y ofrece 3 posibles causas con soluciones

  CATEGORÍA 4 — EDUCACIÓN DEPORTIVA:
    "¿Qué es la sobrecarga progresiva?"
    "¿Por qué descanso más tiempo en series pesadas?"
    "¿Qué es el RPE y cómo lo uso?"
    "¿Qué hace la creatina exactamente?"
    → Respuestas basadas en la base de conocimiento científico del gym

  CATEGORÍA 5 — SOPORTE EN TIEMPO REAL:
    Disponible DURANTE la sesión (sin salir de la pantalla de ejercicio)
    Botón [🎙️ Preguntar a ZEUS] visible durante todo el entreno
    Respuesta en máx. 3 segundos
    El miembro puede preguntar en texto o audio (hablar mientras entrena)
```

### 13.3 Modo Audio de ZEUS (Coaching de Voz)

```yaml
Coaching de voz durante la sesión:

  ACTIVACIÓN:
    Botón [🎙️ Modo Voz] en la pantalla de ejercicio
    O comando de voz: "Hey ZEUS" (como un asistente de voz)
    Compatible con auriculares Bluetooth del miembro

  ZEUS HABLA PROACTIVAMENTE:
    Al iniciar cada ejercicio: "(Nombre del ejercicio).
    Recuerda: (1 cue técnico clave del trainer o del sistema)"

    Cuenta atrás del descanso:
    "Descanso terminando... 10, 9, 8... prepárate para la siguiente serie"

    Motivación en la última serie:
    "Esta es la última y la más importante.
     Tú puedes con esto. Enfoca en la técnica."

    Al batir un PR:
    "¡NUEVO RÉCORD PERSONAL! Acabas de superar tu mejor marca.
     Eso es lo que pasa cuando eres consistente 🔥"

  EL MIEMBRO PUEDE DECIR:
    "Zeus, pausa el timer" → pausa el descanso
    "Zeus, siguiente ejercicio" → avanza
    "Zeus, ¿qué músculo activo aquí?" → responde en voz
    "Zeus, necesito una alternativa a este ejercicio" → sugiere
    "Zeus, cómo se hace esto" → reproduce el audio de instrucciones
    "Zeus, tengo 20 minutos menos hoy" → adapta el plan restante

  MODO SILENCIO (en el gym):
    Si el miembro está en zona del gym sin auriculares:
    Las respuestas de ZEUS van en texto a la pantalla
    ZEUS detecta contexto y reduce las intervenciones de voz
```

### 13.4 Base de Conocimiento de ZEUS (RAG Especializado)

```yaml
La inteligencia de ZEUS se alimenta de:
  CAPA 1 — Datos del miembro (alta prioridad):
    - Plan de entrenamiento actual (ejercicios, cargas, objetivos)
    - Historial de rendimiento (PRs, volumen, RPE histórico)
    - Evaluación física más reciente
    - Lesiones y restricciones documentadas
    - Plan nutricional activo (para consejos integrados)
    - Wearable data (si conectado): HRV, sueño, FC en reposo

  CAPA 2 — Biblioteca del gym (media prioridad):
    - Fichas completas de todos los ejercicios
    - Notas del trainer asignado
    - Protocolos del gym para situaciones específicas
    - Historial de respuestas de ZEUS en este gym (aprendizaje local)

  CAPA 3 — Base científica (respaldo):
    - Investigaciones científicas aprobadas (ver Sección 16)
    - Guías de organizaciones: ACSM, NSCA, ACE, EXRX.NET
    - Bibliografía especializada curada por el admin
    - Actualizaciones mensuales de nueva evidencia

  CAPA 4 — Conocimiento base del LLM:
    - Fisiología del ejercicio general
    - Biomecánica de movimientos fundamentales
    - Principios de programación del entrenamiento
    - Primeros auxilios básicos y protocolos de seguridad

  LO QUE ZEUS NUNCA HACE: ❌ Diagnosticar lesiones o condiciones médicas
    ❌ Prescribir medicamentos o suplementos sin disclaimer
    ❌ Contradecir las instrucciones específicas del trainer asignado
    ❌ Sugerir ejercicios contraindicados sin clearance del trainer
    ❌ Reemplazar la evaluación médica profesional
```

---

## 14. SUSTITUCIÓN INTELIGENTE DE EJERCICIOS

### 14.1 Proceso de Sustitución (Vista del Miembro)

```
El miembro toca [🔄 Cambiar este ejercicio] en cualquier momento:

PANTALLA DE SUSTITUCIÓN:
╔══════════════════════════════════════════════════════════╗
║  🔄 CAMBIAR EJERCICIO                                    ║
║  Ejercicio actual: Sentadilla Hack con Máquina           ║
║  Músculos: Cuádriceps (75%) · Glúteos (60%)             ║
╠══════════════════════════════════════════════════════════╣
║  ¿Por qué quieres cambiar?                               ║
║  ○ La máquina está ocupada                               ║
║  ○ Siento molestia o incomodidad                         ║
║  ○ No sé cómo hacer este ejercicio                       ║
║  ○ Quiero variedad hoy                                   ║
║  ○ No hay este equipamiento disponible hoy               ║
╠══════════════════════════════════════════════════════════╣
║  SUGERENCIAS DE ZEUS (activan los mismos músculos):      ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ 🥇 Leg Press 45°          Similitud: 95%          │    ║
║  │    "La mejor alternativa. Menos estrés lumbar"   │    ║
║  │    Series prescritas: 4×10-12 · Ajuste carga: -10%│   ║
║  │    [🎥 Ver video] [✅ Usar este]                  │    ║
║  └──────────────────────────────────────────────────┘    ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ 🥈 Goblet Squat con Kettlebell  Similitud: 82%   │    ║
║  │    "Buena opción sin máquina. Agrega balance"    │    ║
║  │    [🎥 Ver video] [✅ Usar este]                  │    ║
║  └──────────────────────────────────────────────────┘    ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │ 🥉 Sentadilla con Barra Libre    Similitud: 90%  │    ║
║  │    "Más técnica requerida. Usa la misma carga"   │    ║
║  │    [🎥 Ver video] [✅ Usar este]                  │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                          ║
║  ZEUS: "Para el motivo 'máquina ocupada', el Leg Press   ║
║   es la mejor opción porque trabaja los mismos          ║
║   músculos con la misma intensidad."                    ║
╠══════════════════════════════════════════════════════════╣
║  [🔍 Buscar otro ejercicio]  [Cancelar]                  ║
╚══════════════════════════════════════════════════════════╝
```

### 14.2 Lógica del Algoritmo de Sustitución

```yaml
El algoritmo considera en orden de prioridad:

  1. Músculos activados (similitud ≥ 80% para considerarse equivalente)
  2. Equipamiento disponible en el gym (sin mostrar lo que no hay)
  3. Restricciones del miembro (nunca sugerir ejercicios contraindicados)
  4. Nivel de dificultad (no sugerir ejercicio más difícil sin advertencia)
  5. Contexto del motivo:
     - Máquina ocupada → alternativas sin esa máquina específica
     - Dolor → alternativas de menor impacto + recomendación de consultar trainer
     - No sabe hacer → alternativas más simples + tutorial de ZEUS
     - Variedad → cualquier equivalente no usado recientemente

  Registro del cambio:
    - El sistema anota qué ejercicio se cambió, por cuál y por qué
    - El trainer ve en su dashboard: "María cambió Hack Squat por Leg Press
      (máquina ocupada) en la sesión del martes"
    - Si el mismo ejercicio se cambia 3+ veces: alerta al trainer
      "María evita consistentemente la Sentadilla Hack. ¿Revisamos el plan?"
```

---

## 15. SEGUIMIENTO DE PROGRESO & ANALYTICS

### 15.1 Dashboard de Progreso del Miembro

```
📊 MI PROGRESO — María García

TABS: [Por Objetivo] [Por Músculo] [Por Ejercicio] [Historial]

═══ TAB: POR OBJETIVO (vista principal) ═══════════════════════

  MI META: Perder 8 kg para el 15 de septiembre de 2026
  Inicio: 12 de mayo · Hoy: 10 de junio (29 días)

  ┌──────────────────────────────────────────────────────────┐
  │  PROGRESO HACIA TU META                                  │
  │                                                          │
  │  Peso corporal:                                          │
  │  Inicio: 68.0 kg   →   Hoy: 65.8 kg   (-2.2 kg)        │
  │  Meta:   60.0 kg   Restante: 5.8 kg                     │
  │  ████████████░░░░░░░░░░░  27.5% del objetivo alcanzado  │
  │                                                          │
  │  Gráfica de peso (4 semanas):                            │
  │   68.0●                                                  │
  │   67.0  ●                                                │
  │   66.0    ●●                                             │
  │   65.0      ●●●                                          │
  │   64.0 ············· (meta para semana 12)               │
  │       S1  S2  S3  S4  S5  S6                            │
  │                                                          │
  │  Ritmo actual: -0.55 kg/semana                           │
  │  Ritmo necesario: -0.73 kg/semana para llegar a tiempo  │
  │  ZEUS: "Estás progresando bien. Para acelerar el ritmo, │
  │   considera 10 min extra de cardio los martes 💡"       │
  └──────────────────────────────────────────────────────────┘

  MÉTRICAS CORPORALES (última evaluación vs inicio):

  ┌─────────────────────┬──────────────┬────────────┬────────┐
  │ Métrica             │ Inicio       │ Semana 4   │ Cambio │
  ├─────────────────────┼──────────────┼────────────┼────────┤
  │ Peso                │ 68.0 kg      │ 65.8 kg    │ -2.2↓  │
  │ % Grasa corporal    │ 28.0%        │ 26.5%      │ -1.5↓  │
  │ Masa muscular       │ 48.9 kg      │ 49.2 kg    │ +0.3↑  │
  │ Cintura             │ 82 cm        │ 80 cm      │ -2 cm↓ │
  │ Cadera              │ 98 cm        │ 96.5 cm    │ -1.5↓  │
  └─────────────────────┴──────────────┴────────────┴────────┘
  [Ver comparativa de fotos]

═══ TAB: POR EJERCICIO ═══════════════════════════════════════

  EVOLUCIÓN DE FUERZA — Mis ejercicios principales:

  Press de Banca:  [Seleccionar ejercicio ▼]
  Gráfica de 1RM estimado:
   45 ─────────────────●──●
   42                ●
   40           ●●●
   37       ●●
   35 ●●●
      S1 S2 S3 S4 S5 S6 S7 S8

  1RM estimado actual: 47.5 kg
  Mejora desde el inicio: +12.5 kg (+36%) ↑

  Todos mis PRs:
  ┌───────────────────┬──────────────┬──────────────────────┐
  │ Ejercicio         │ PR actual    │ Fecha               │
  ├───────────────────┼──────────────┼──────────────────────┤
  │ Press de Banca    │ 42.5 kg ×12  │ Hoy (NUEVO 🏆)      │
  │ Sentadilla Hack   │ 60 kg × 10   │ 05/06/2026          │
  │ Hip Thrust        │ 70 kg × 12   │ 08/06/2026          │
  │ Remo Barra        │ 45 kg × 12   │ Hoy (NUEVO 🏆)      │
  │ Plancha           │ 2:45 min     │ 01/06/2026          │
  └───────────────────┴──────────────┴──────────────────────┘
```

### 15.2 Analytics Avanzados (Inspirados en JEFIT Elite)

```yaml
Analytics disponibles en la app del miembro:

  VOLUMEN TOTAL POR GRUPO MUSCULAR:
    Tonelaje semanal (series × reps × kg) por músculo
    Gráfica de distribución: "¿Estás entrenando todos los grupos?"
    Basado en investigación: JEFIT recomienda rastrear el tonelaje total
    (peso × reps × sets) por grupo muscular por semana para
    asegurar sobrecarga progresiva a nivel del macrociclo

  STRENGTH SCORE (Puntuación de Fuerza):
    Score calculado: suma ponderada de 1RM estimados en ejercicios principales
    comparado con promedio de miembros del gym con mismo género, edad y nivel
    "Tu fuerza en piernas está en el percentil 72 de miembros similares 💪"

  MOVEMENT BALANCE INDEX:
    Ratio empuje:jale horizontal y vertical
    Alerta si hay desequilibrio significativo (>20% diferencia)
    "Tu espalda está 30% más débil que tu pecho — Carlos ajustará tu próximo plan"

  ADHERENCIA & CONSISTENCIA:
    Tasa de asistencia al plan: semanas completadas vs. planificadas
    Racha más larga de asistencia
    Día/hora de mayor consistencia personal
    "Tus martes y jueves tienen 95% de adherencia. Los sábados, 60%."

  RECOVERY SCORE (si tiene wearable conectado):
    HRV de la mañana + duración/calidad del sueño (Oura, Whoop, Garmin)
    Recomendación diaria: "Hoy tu recuperación es alta (82/100) — día ideal para entrenamiento intenso"
    O: "Tu HRV está bajo (42). Considera reducir la intensidad hoy o hacer movilidad."

  PROYECCIÓN DE OBJETIVOS:
    "A tu ritmo actual, alcanzarás tu peso objetivo en 11 semanas"
    "Si mantienes la mejora de fuerza actual, en 8 semanas podrías entrenar a nivel avanzado"
```

---

# PARTE IV — INVESTIGACIÓN & ACTUALIZACIÓN CIENTÍFICA

---

## 16. MOTOR DE INVESTIGACIÓN CIENTÍFICA CONTINUA

### 16.1 Sistema de Actualización de la Biblioteca

Las mejores apps de fitness deportivo basan su contenido en principios de construcción muscular comprobados científicamente y en investigación revisada por pares, con actualización continua. Nuestro sistema implementa esto de forma estructurada:

```yaml
Motor de investigación (ejecuta mensualmente):

  FUENTES MONITOREADAS AUTOMÁTICAMENTE:

    Revistas científicas (PubMed/RSS):
      - Journal of Strength and Conditioning Research (JSCR)
      - Medicine & Science in Sports & Exercise (MSSE)
      - European Journal of Sport Science
      - Sports Medicine
      - International Journal of Sport Nutrition and Exercise Metabolism

    Organizaciones oficiales:
      - ACSM (American College of Sports Medicine) — guidelines y position stands
      - NSCA (National Strength and Conditioning Association)
      - ACE (American Council on Exercise)
      - EXRX.NET — base de datos de ejercicios con referencias

    Expertos reconocidos monitoreados:
      - Dr. Brad Schoenfeld (hipertrofia)
      - Dr. Andy Galpin (rendimiento deportivo)
      - Eric Helms PhD (nutrición y fuerza)
      - Dr. Layne Norton (ciencia del entrenamiento)
      - Dr. Stuart McGill (salud lumbar y core)

    Medios especializados verificados:
      - PubMed Fitness Research Summaries
      - Stronger by Science
      - Renaissance Periodization (Mike Israetel PhD)
      - Barbell Medicine

  PROCESO DE SELECCIÓN (IA):
    El sistema busca y filtra artículos con criterios:
    1. Estudio con participantes humanos (no ratas)
    2. Muestra ≥ 20 participantes (para relevancia estadística)
    3. Diseño: RCT o estudio longitudinal controlado
    4. Publicado en revista con peer review
    5. Relevante para: técnica de ejercicio, programación, o rehabilitación
    6. No contradice consenso científico mayoritario establecido

    Puntuación automática de calidad del estudio:
    - Tamaño de muestra (peso 25%)
    - Calidad del diseño (peso 35%)
    - Relevancia práctica para el gym (peso 25%)
    - Novedad vs. conocimiento existente (peso 15%)

  LO QUE SE ENVÍA AL ADMIN:
    Resumen ejecutivo de cada hallazgo (máx. 200 palabras)
    Implicación práctica: "¿Qué cambiaría en la biblioteca?"
    Nivel de evidencia: A (muy sólido) | B (sólido) | C (preliminar)
    Sugerencia del sistema: "Agregar ejercicio X" | "Modificar protocolo Y"
    Link al artículo original
```

### 16.2 Tipos de Actualizaciones que Puede Generar la Investigación

```yaml
Nuevos ejercicios documentados:
  Un ejercicio o variación nuevo con evidencia de mayor eficacia
  Ejemplo: "Hip Thrust Modificado con Pie Elevado — 28% mayor activación
           de glúteo mayor que el standard según Contreras et al. 2026"
  → El sistema propone agregarlo a la biblioteca con la ficha completa generada por IA

Corrección de técnica establecida:
  Nueva evidencia que modifica la técnica recomendada de un ejercicio
  Ejemplo: "Nuevo metaanálisis muestra que sentadilla profunda es
           superior a parcial para cuádriceps en miembros sin dolor de rodilla"
  → El sistema propone actualizar la ficha del ejercicio

Nuevo protocolo de entrenamiento:
  Una metodología nueva con evidencia de resultados superiores
  Ejemplo: "Blood Flow Restriction (BFR) Training — resultados de hipertrofia
           equivalentes al entrenamiento pesado con cargas muy ligeras (20-30%)"
  → El sistema propone agregar una nueva plantilla de rutina a la biblioteca

Advertencia de seguridad:
  Evidencia de lesiones asociadas a una técnica específica
  Ejemplo: "Kipping pull-ups asociados a mayor tasa de lesión de hombro
           en practicantes sin base de fuerza adecuada"
  → El sistema propone agregar contraindicación al ejercicio

Actualización de dosificación:
  Nueva evidencia sobre rangos óptimos de series/repeticiones
  Ejemplo: "Schoenfeld 2026 confirma que rangos 6-35 reps son
           igualmente efectivos para hipertrofia si se lleva cerca del fallo"
  → El sistema propone actualizar los parámetros de las plantillas relevantes
```

---

## 17. PANEL DE APROBACIÓN DE CONTENIDO (ADMIN)

### 17.1 Cola de Revisión del Administrador

```
PANEL ADMIN — REVISIÓN DE CONTENIDO CIENTÍFICO

NUEVAS PROPUESTAS (5 pendientes de revisión)
═════════════════════════════════════════════

📄 PROPUESTA #1 — NUEVO EJERCICIO
  Ejercicio: "Hip Thrust con Pie Elevado"
  Fuente: Contreras et al. (2026) — Journal of Strength Research
  Nivel de evidencia: A
  Relevancia para el gym: Alta (objetivo glúteos es el #1 de nuestros miembros)
  IA dice: "Agregar a categoría Glúteos como variante avanzada del Hip Thrust"

  [📋 Ver ficha completa generada]  [🎥 Video propuesto]
  [✅ Aprobar] [✏️ Editar y Aprobar] [❌ Rechazar] [📌 Para revisión con trainers]

📄 PROPUESTA #2 — ACTUALIZACIÓN DE TÉCNICA
  Ejercicio afectado: Sentadilla con Barra (ficha actual)
  Cambio propuesto: Agregar variación de profundidad según anatomía individual
  Fuente: Myer et al. (2025) — Position Stand NSCA
  Cambio en: Sección "Errores frecuentes" + "Puntos clave"

  [👁️ Ver diff: texto actual vs. propuesto]
  [✅ Aprobar cambio] [❌ Mantener versión actual]

📄 PROPUESTA #3 — NUEVA PLANTILLA DE RUTINA
  Rutina: "Blood Flow Restriction (BFR) — Protocolo de Rehabilitación"
  Indicada para: Post-operatorio, personas mayores, lesiones
  Evidencia: Múltiples estudios 2023-2026 (nivel A)
  Nota del sistema: "Requiere formación específica del trainer — agregar advertencia"

  [📋 Ver plantilla completa]
  [✅ Aprobar (con advertencia de certificación)] [❌ Rechazar]

CONTENIDO APROBADO RECIENTE:
  ✅ 15/05/2026 — Bulgarian Split Squat variante con mancuernas (Carlos G. aprobó)
  ✅ 02/05/2026 — Actualización del protocolo de calentamiento (Admin aprobó)
  ❌ 20/04/2026 — Ejercicio de alta velocidad sin equipo (rechazado: riesgo de lesión)
```

### 17.2 Proceso de Aprobación Formal

```yaml
Flujo de aprobación de nuevo contenido:
  NIVEL 1 — IA (automático, sin intervención humana):
    ✅ Actualizar precios de ejercicios en el catálogo
    ✅ Agregar sinónimos a ejercicios existentes
    ✅ Actualizar estadísticas de uso

  NIVEL 2 — Admin (aprobación del dueño o director): ✅ Nuevos ejercicios a la biblioteca del gym
    ✅ Actualización de fichas técnicas existentes
    ✅ Nuevas plantillas de rutinas
    ✅ Cambios en clasificaciones o taxonomía

  NIVEL 3 — Admin + Trainer Senior (para contenido de alto impacto):
    ✅ Ejercicios de rehabilitación o terapéuticos
    ✅ Protocolos de alta intensidad (BFR, Cluster Sets, etc.)
    ✅ Ejercicios que involucran equipamiento no estándar
    ✅ Cambios que afectan contraindicaciones de seguridad

  NIVEL 4 — Admin + Profesional de salud externo: ✅ Protocolos para condiciones médicas específicas
    ✅ Ejercicios post-quirúrgicos
    ✅ Modificaciones para poblaciones especiales (embarazadas, adultos mayores)

Trazabilidad completa:
  Cada ejercicio o rutina en la biblioteca tiene:
    - Quién lo creó y cuándo
    - Quién lo aprobó y cuándo
    - Fuente de la evidencia científica (si aplica)
    - Historial de versiones y cambios
    - Quién lo asignó a qué alumnos (para alertas si hay retiro)
```

---

## 18. INTEGRACIONES DEL MÓDULO

```yaml
Con Módulo de Perfiles (MOD-A):
  - Las restricciones médicas del perfil filtran ejercicios automáticamente
  - Las métricas físicas se comparan en el dashboard de progreso
  - Las fotos de progreso se vinculan con las sesiones de entrenamiento

Con CRM / ARIA (MOD-CRM):
  - ARIA recibe alertas de PRs para enviar felicitaciones automáticas
  - Inactividad en el entrenamiento aumenta el Risk Score de retención
  - ZEUS puede escalar a ARIA si detecta frustración o desmotivación extrema
  - El trainer ve en su CRM el historial de entrenamiento al comunicarse

Con Nutrición (MOD-C/D):
  - El volumen de entrenamiento calibra las necesidades calóricas del plan nutricional
  - ZEUS puede sugerir nutrición perientrino basada en el tipo de sesión
  - Post-sesión: ZEUS recuerda la ventana de proteína post-entreno
  - El registro de sesión actualiza el cálculo de calorías quemadas del día

Con Wearables (MOD externo):
  - Apple HealthKit / Google Fit: FC durante entreno, calorías, pasos
  - Garmin / Polar: datos biométricos avanzados durante el ejercicio
  - Whoop / Oura Ring: HRV y sueño para Recovery Score diario
  - Ajuste automático de intensidad basado en Recovery Score

Con Gamificación (MOD-I):
  - Cada sesión completada suma puntos
  - PRs generan medallas y notificaciones especiales
  - Rachas de asistencia desbloquean logros
  - Leaderboard de fuerza por ejercicio entre miembros del gym

Con Panel Ejecutivo (MOD-J):
  - KPIs de adherencia al entrenamiento por trainer y por plan
  - Ejercicios más populares para compras del marketplace (suplementos)
  - Alertas de mesetas frecuentes por ejercicio (señal de necesidad de variedad)
  - Performance de los trainers basado en progreso de sus alumnos
```

---

## 19. MODELO DE DATOS COMPLETO

```sql
-- ─────────────────────────────────────────────────────────────
-- EJERCICIOS — BASE DE DATOS DE LA BIBLIOTECA
-- ─────────────────────────────────────────────────────────────
CREATE TABLE exercises (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                  UUID REFERENCES gyms(id),   -- null = ejercicio del sistema
  name                    VARCHAR(200) NOT NULL,
  alternate_names         TEXT[],
  code                    VARCHAR(50),
  source                  VARCHAR(20) DEFAULT 'system',
  category                VARCHAR(30) NOT NULL,
  movement_type           VARCHAR(30),
  movement_pattern        VARCHAR(50),
  difficulty_level        VARCHAR(20) DEFAULT 'intermediate',
  primary_muscles         JSONB NOT NULL,             -- [{muscle, activation_pct, svg_coords}]
  secondary_muscles       JSONB DEFAULT '[]',
  antagonist_muscles      JSONB DEFAULT '[]',
  equipment_required      TEXT[],
  equipment_alternatives  TEXT[],
  no_equipment_possible   BOOLEAN DEFAULT FALSE,
  recommended_ranges      JSONB,                      -- {strength, hypertrophy, endurance, ...}
  recommended_tempo       VARCHAR(10),
  starting_position       TEXT,
  execution              TEXT,
  key_coaching_points     TEXT[],
  common_errors           JSONB DEFAULT '[]',         -- [{error, consequence, correction, image_url}]
  contraindications       TEXT[],
  precautions             TEXT[],
  modifications           JSONB DEFAULT '[]',
  equivalent_exercises    JSONB DEFAULT '[]',         -- [{exercise_id, similarity}]
  progression_exercises   UUID[],
  regression_exercises    UUID[],
  video_technique_url     TEXT,
  video_duration_sec      INTEGER,
  video_errors_url        TEXT,
  gif_preview_url         TEXT,
  muscle_map_svg_url      TEXT,
  muscle_map_back_svg_url TEXT,
  audio_coaching_url      TEXT,
  scientific_references   TEXT[],
  proven_benefits         TEXT[],
  is_active               BOOLEAN DEFAULT TRUE,
  is_approved             BOOLEAN DEFAULT FALSE,
  approved_by             UUID REFERENCES staff(id),
  approved_at             TIMESTAMP,
  last_reviewed_at        DATE,
  version                 VARCHAR(10) DEFAULT '1.0',
  times_assigned          INTEGER DEFAULT 0,
  trainer_rating          DECIMAL(3,2),
  created_by              UUID REFERENCES staff(id),
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PLANES DE ENTRENAMIENTO (macro-estructura)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE training_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                  UUID NOT NULL REFERENCES gyms(id),
  trainer_id              UUID REFERENCES staff(id),
  member_id               UUID NOT NULL REFERENCES members(id),
  name                    VARCHAR(200) NOT NULL,
  description             TEXT,
  objective               VARCHAR(50) NOT NULL,
  level                   VARCHAR(20) NOT NULL,
  days_per_week           INTEGER NOT NULL,
  duration_weeks          INTEGER NOT NULL,
  status                  VARCHAR(20) DEFAULT 'draft', -- draft|active|completed|cancelled
  periodization_type      VARCHAR(30),                 -- linear|DUP|block|conjugate
  periodization_config    JSONB,
  start_date              DATE,
  end_date                DATE,
  current_week            INTEGER DEFAULT 1,
  trainer_note_to_member  TEXT,
  allow_member_view_ahead BOOLEAN DEFAULT FALSE,
  created_from_template   UUID REFERENCES plan_templates(id),
  template_id             UUID REFERENCES plan_templates(id),
  ai_generated            BOOLEAN DEFAULT FALSE,
  ai_generation_prompt    TEXT,
  is_template             BOOLEAN DEFAULT FALSE,
  template_name           VARCHAR(200),
  template_category       VARCHAR(50),
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- DÍAS DE ENTRENAMIENTO (dentro del plan)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE training_days (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                 UUID NOT NULL REFERENCES training_plans(id),
  day_name                VARCHAR(100) NOT NULL,      -- "Día A", "Piernas", "Push"
  day_type                VARCHAR(30),                 -- training|rest|active_recovery
  position                INTEGER NOT NULL,            -- orden en la semana
  week_days_scheduled     INTEGER[],                   -- [1,3,5] = lunes, mié, vie
  estimated_duration_min  INTEGER,
  notes_for_member        TEXT,
  created_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- BLOQUES DE EJERCICIOS (dentro del día)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE exercise_blocks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_day_id         UUID NOT NULL REFERENCES training_days(id),
  block_type              VARCHAR(20) DEFAULT 'standard',
  -- standard|warmup|superset|giant_set|circuit|emom|amrap|tabata|cooldown
  block_name              VARCHAR(100),                -- "Superset A", "Calentamiento"
  position                INTEGER NOT NULL,
  rest_between_rounds_sec INTEGER,
  total_rounds            INTEGER DEFAULT 1,           -- para circuitos y EMOM
  time_cap_seconds        INTEGER,                     -- para AMRAP
  notes                   TEXT,
  created_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- EJERCICIOS PRESCRITOS (dentro del bloque)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE prescribed_exercises (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id                UUID NOT NULL REFERENCES exercise_blocks(id),
  exercise_id             UUID NOT NULL REFERENCES exercises(id),
  position                INTEGER NOT NULL,
  sets                    INTEGER,
  reps_min                INTEGER,
  reps_max                INTEGER,
  duration_seconds        INTEGER,                     -- para ejercicios por tiempo
  load_type               VARCHAR(20) DEFAULT 'kg',   -- kg|lbs|bodyweight|%1RM|RPE|RIR
  load_value              DECIMAL(8,2),
  load_percentage_1rm     DECIMAL(5,2),
  target_rpe              DECIMAL(3,1),
  target_rir              INTEGER,
  rest_seconds            INTEGER DEFAULT 90,
  tempo                   VARCHAR(10),                 -- "3-1-2-0"
  trainer_coaching_cue    TEXT,
  progression_type        VARCHAR(30),
  progression_config      JSONB,
  notes                   TEXT,
  created_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SESIONES EJECUTADAS (registro histórico)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE workout_sessions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id               UUID NOT NULL REFERENCES members(id),
  training_plan_id        UUID REFERENCES training_plans(id),
  training_day_id         UUID REFERENCES training_days(id),
  week_number             INTEGER,
  status                  VARCHAR(20) DEFAULT 'in_progress',
  started_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMP,
  duration_minutes        INTEGER,
  total_volume_kg         DECIMAL(12,2),               -- series × reps × kg total
  average_rpe             DECIMAL(3,1),
  member_notes            TEXT,
  trainer_notes           TEXT,
  recovery_score          INTEGER,                     -- de wearable al inicio de la sesión
  session_rating          SMALLINT,                    -- 1-5 del miembro
  created_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SERIES EJECUTADAS (el granular del registro)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE executed_sets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id              UUID NOT NULL REFERENCES workout_sessions(id),
  prescribed_exercise_id  UUID REFERENCES prescribed_exercises(id),
  exercise_id             UUID NOT NULL REFERENCES exercises(id),
  actual_exercise_id      UUID REFERENCES exercises(id), -- si fue sustituido
  substitution_reason     VARCHAR(50),
  set_number              INTEGER NOT NULL,
  reps_completed          INTEGER,
  weight_kg               DECIMAL(8,2),
  duration_seconds        INTEGER,
  rpe                     DECIMAL(3,1),
  rir                     INTEGER,
  tempo_used              VARCHAR(10),
  is_personal_record      BOOLEAN DEFAULT FALSE,
  pr_type                 VARCHAR(30),                  -- weight|reps|volume|1rm_estimated
  pr_previous_value       DECIMAL(10,2),
  notes                   TEXT,
  executed_at             TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- RÉCORDS PERSONALES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE personal_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id               UUID NOT NULL REFERENCES members(id),
  exercise_id             UUID NOT NULL REFERENCES exercises(id),
  record_type             VARCHAR(20) NOT NULL,         -- max_weight|max_reps|max_volume|est_1rm
  value                   DECIMAL(10,2) NOT NULL,
  reps_at_weight          INTEGER,
  set_id                  UUID REFERENCES executed_sets(id),
  achieved_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  superseded_at           TIMESTAMP,
  is_current              BOOLEAN DEFAULT TRUE,
  UNIQUE (member_id, exercise_id, record_type, is_current)
    DEFERRABLE INITIALLY DEFERRED
);

-- ─────────────────────────────────────────────────────────────
-- INVESTIGACIÓN CIENTÍFICA (cola de aprobación)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE research_proposals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                  UUID NOT NULL REFERENCES gyms(id),
  proposal_type           VARCHAR(30) NOT NULL,         -- new_exercise|update_exercise|new_template|safety_update
  title                   VARCHAR(300) NOT NULL,
  source_url              TEXT,
  source_citation         TEXT,
  evidence_level          VARCHAR(5),                   -- A|B|C
  relevance_score         DECIMAL(3,2),
  practical_implication   TEXT,
  ai_summary              TEXT,
  proposed_changes        JSONB,
  affected_exercise_id    UUID REFERENCES exercises(id),
  status                  VARCHAR(20) DEFAULT 'pending', -- pending|approved|rejected|needs_review
  reviewed_by             UUID REFERENCES staff(id),
  reviewed_at             TIMESTAMP,
  rejection_reason        TEXT,
  auto_detected           BOOLEAN DEFAULT TRUE,
  detected_at             TIMESTAMP DEFAULT NOW(),
  created_at              TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CHECKLIST DE CONFIGURACIÓN DEL MÓDULO

```
BIBLIOTECA DE EJERCICIOS:
□ Mínimo 200 ejercicios cargados (con fichas completas o en progreso)
□ Videos de técnica para los 50 ejercicios más usados del gym
□ Mapas musculares SVG para los ejercicios principales
□ Clasificación y etiquetado completo de todos los ejercicios
□ Ejercicios específicos de los equipos del gym identificados
□ Contraindicaciones cargadas para ejercicios de riesgo moderado/alto

PLANTILLAS DE RUTINAS:
□ Mínimo 10 plantillas por categoría de objetivo principales
□ Plantillas para cada nivel (principiante, intermedio, avanzado)
□ Plantillas con duración: 3, 4, 5 y 6 días por semana
□ Al menos 1 plantilla de rehabilitación básica aprobada

PANEL DEL TRAINER:
□ Al menos 2 trainers capacitados en el Workout Builder
□ Cada trainer tiene sus plantillas propias configuradas
□ Sistema de alerta de balance muscular calibrado
□ Co-Piloto IA probado con casos reales de clientes del gym

ZEUS — COACH VIRTUAL:
□ Base de conocimiento inicial cargada (ejercicios + fuentes científicas)
□ Voz de ZEUS configurada (TTS en español, tono apropiado)
□ Comandos de voz probados en la app
□ Flujo de escalada a humano configurado (cuándo ZEUS llama al trainer)

INVESTIGACIÓN CIENTÍFICA:
□ Fuentes de monitoreo configuradas (mínimo PubMed + NSCA)
□ Criterios de filtrado de calidad ajustados para el nivel del gym
□ Responsable de revisión de propuestas designado (admin o trainer senior)
□ Frecuencia de revisión establecida (sugerido: mensual)

INTEGRACIONES:
□ Wearables configurados (Apple Health / Google Fit como mínimo)
□ Gamificación: puntos y medallas por entreno activados
□ ARIA recibe alertas de PRs del módulo
□ Panel ejecutivo muestra KPIs de entrenamiento
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulo: GYM-MOD-WKT_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Fuentes de investigación: Exercise.com, PT Distinction, ABC Trainerize, JEFIT, Fitbod, Dr. Muscle, SensAI, Schoenfeld (2010), Krieger (2010), Helms et al. (2014)_  
_Próxima revisión: Septiembre 2026_
