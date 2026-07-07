# 🥗 MÓDULO NUTRICIÓN — ELITE AI-POWERED (MOD-NUTRI)

## Plan Nutricional, Tracking Inteligente & Coach Nutricional IA

### App Integral de Gimnasio de Élite — Documento de Diseño Detallado

### Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-NUTRI`
> **Prioridad:** Fase 2 (core) → Fase 3 (sub-módulos avanzados: lab analysis, food scanner CV)
> **Módulos relacionados:** Workout Builder (MOD-WKT), CRM/ARIA (MOD-CRM), Marketplace (MOD-MKT), Gamificación (MOD-GAME), Panel Ejecutivo (MOD-ANALYTICS)
> **Principio rector:** _"La nutrición decide el 70% del resultado. El gym que solo entrena a sus miembros deja la mitad del trabajo sin hacer."_

---

## 📋 TABLA DE CONTENIDO

### PARTE I — FUNDAMENTOS & ARQUITECTURA

1. [Visión General & Benchmark de la Industria](#1-visión-general--benchmark-de-la-industria)
2. [Los 12 Sub-Módulos de Nutrición](#2-los-12-sub-módulos-de-nutrición)
3. [Perfil Nutricional del Miembro](#3-perfil-nutricional-del-miembro)

### PARTE II — GENERACIÓN DEL PLAN

4. [Motor de Cálculo Nutricional (TMB, TDEE, Macros)](#4-motor-de-cálculo-nutricional-tmb-tdee-macros)
5. [Constructor de Plan Nutricional — Panel del Nutricionista](#5-constructor-de-plan-nutricional--panel-del-nutricionista)
6. [Co-Piloto IA para Generación de Planes](#6-co-piloto-ia-para-generación-de-planes)
7. [Análisis de Laboratorio & Ajuste Médico](#7-análisis-de-laboratorio--ajuste-médico)

### PARTE III — EXPERIENCIA DEL MIEMBRO

8. [Dashboard Nutricional del Miembro](#8-dashboard-nutricional-del-miembro)
9. [Registro de Comidas — Los 4 Métodos](#9-registro-de-comidas--los-4-métodos)
10. [Food Scanner — Análisis de Foto del Plato con IA Visual](#10-food-scanner--análisis-de-foto-del-plato-con-ia-visual)
11. [Biblioteca de Recetas & Meal Prep](#11-biblioteca-de-recetas--meal-prep)
12. [Asistente de Voz Nutricional](#12-asistente-de-voz-nutricional)

### PARTE IV — INTELIGENCIA & CIENCIA

13. [ARIA-Nutrición — El Coach Nutricional Virtual](#13-aria-nutrición--el-coach-nutricional-virtual)
14. [Motor de Ajuste Automático de Macros](#14-motor-de-ajuste-automático-de-macros)
15. [Educación Nutricional & Motor de Investigación Científica](#15-educación-nutricional--motor-de-investigación-científica)
16. [Suplementación Personalizada](#16-suplementación-personalizada)

### PARTE V — INTEGRACIÓN & DATOS

17. [Panel del Nutricionista — Gestión de Clientes](#17-panel-del-nutricionista--gestión-de-clientes)
18. [Integraciones del Módulo](#18-integraciones-del-módulo)
19. [Analytics de Nutrición (BI)](#19-analytics-de-nutrición-bi)
20. [Modelo de Datos Completo](#20-modelo-de-datos-completo)

---

# PARTE I — FUNDAMENTOS & ARQUITECTURA

---

## 1. VISIÓN GENERAL & BENCHMARK DE LA INDUSTRIA

### 1.1 Propósito

El **Módulo de Nutrición** cierra el círculo del resultado físico del miembro. Un plan de entrenamiento perfecto sin una nutrición alineada produce resultados mediocres — la ciencia del ejercicio es consistente en que la composición corporal se determina mayoritariamente por la alimentación. Este módulo convierte al gimnasio en un centro de transformación integral, no solo un lugar para levantar pesas.

A diferencia de una app de conteo de calorías genérica, este módulo está **integrado nativamente** con el resto de la plataforma: el plan de entrenamiento del miembro ajusta sus necesidades calóricas, ZEUS coordina con el nutricionista, y el marketplace del gym sugiere productos que encajan con el plan — todo en un solo ecosistema.

### 1.2 Benchmark de la Industria — Qué Adoptamos de Cada Líder

```yaml
Investigación de plataformas líderes de nutrición digital,
adaptando lo mejor de cada una a nuestro contexto de gimnasio:

  MyFitnessPal (el estándar de facto de tracking):
    Adoptado: base de datos de alimentos masiva, código de barras,
    registro rápido con favoritos/recientes, tracking de macros simple

  Cronometer (precisión nutricional superior):
    Adoptado: tracking de micronutrientes (no solo macros), precisión
    en la base de datos de alimentos, gráficas de tendencia detalladas

  ZOE (personalización basada en ciencia + biomarcadores):
    Adoptado: el concepto de ajustar recomendaciones según respuesta
    metabólica individual, uso de datos de laboratorio para personalizar

  Noom (psicología del cambio de hábito):
    Adoptado: enfoque conductual, educación progresiva en lugar de
    solo prescripción, msgs diarios de coaching psicológico-nutricional

  HealthifyMe (Coach IA conversacional, mercado emergente similar
  al nuestro):
    Adoptado: el "Coach IA" que responde dudas nutricionales en
    lenguaje natural — inspiración directa para ARIA-Nutrición

  Foodvisor (reconocimiento de alimentos por foto):
    Adoptado: el concepto central del Food Scanner (Sección 10)

  Diferenciador vs. TODAS: ninguna de estas está integrada con
  un sistema de gestión de gimnasio — nuestra ventaja es que el
  plan nutricional conoce el plan de entrenamiento, el trainer,
  las evaluaciones físicas y el historial completo del miembro
  en la misma plataforma, sin fricciones de sincronización manual.
```

### 1.3 Principios de Diseño

| Principio                       | Implementación                                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Ciencia, no dietas de moda**  | Cálculos basados en fórmulas validadas (Mifflin-St Jeor, Katch-McArdle), sin promesas irreales           |
| **Fricción mínima de registro** | Registrar una comida en <10 segundos — foto, voz, o favoritos                                            |
| **Personalización real**        | El plan se adapta al objetivo, biometría, preferencias, alergias y presupuesto del miembro               |
| **Profesional supervisado**     | La IA asiste, pero un nutricionista humano revisa y aprueba planes — nunca reemplaza el criterio clínico |
| **Integrado, no aislado**       | Entrenamiento, nutrición y progreso viven en el mismo ecosistema de datos                                |
| **Educación sobre restricción** | El miembro entiende el "por qué", no solo sigue números ciegamente                                       |

---

## 2. LOS 12 SUB-MÓDULOS DE NUTRICIÓN

```yaml
Arquitectura modular del sistema de nutrición completo:

  1. AGENTE IA CORE           → Motor central de recomendaciones (ARIA-Nutrición)
  2. ANÁLISIS DE LABORATORIO  → Ingesta de exámenes médicos, ajuste de plan
  3. FOOD SCANNER (Visión)    → Reconocimiento de alimentos por foto (Google Vision)
  4. GENERADOR DE PLANES      → Motor de cálculo + Co-Piloto IA para el nutricionista
  5. RECETARIO                → Biblioteca de recetas alineadas al plan del miembro
  6. TRACKING MACRO/MICRO     → Registro diario y visualización de progreso nutricional
  7. EDUCACIÓN 3D ANATÓMICA   → Visualización de cómo los nutrientes afectan el cuerpo
  8. MOTOR DE INVESTIGACIÓN   → Actualización continua con evidencia científica nueva
  9. ASISTENTE DE VOZ         → Registro y consultas nutricionales por voz
  10. SUPLEMENTACIÓN          → Recomendaciones conectadas al Marketplace
  11. INTEGRACIÓN BI          → Analytics para el Panel Ejecutivo del gym
  12. GESTIÓN DE CONSULTAS    → Agenda y seguimiento del nutricionista con sus clientes

Cada sub-módulo se detalla en las secciones correspondientes de
este documento. Esta lista sirve como mapa de navegación del
alcance completo del módulo.
```

---

## 3. PERFIL NUTRICIONAL DEL MIEMBRO

### 3.1 Datos Recopilados en el Onboarding Nutricional

```yaml
Al activar el módulo de nutrición (incluido en planes Pro/Elite
del SaaS, ver Estrategia Comercial), el miembro completa:

DATOS BIOMÉTRICOS (heredados del perfil general, Módulo A):
  Peso, estatura, edad, sexo biológico, % grasa corporal (si
  disponible de evaluación física), nivel de actividad física

OBJETIVO NUTRICIONAL:
  ○ Pérdida de peso / grasa corporal
  ○ Ganancia de masa muscular
  ○ Recomposición corporal (perder grasa y ganar músculo)
  ○ Mantenimiento / salud general
  ○ Rendimiento deportivo específico
  ○ Objetivo clínico (bajo supervisión de nutricionista, ej.
    control de diabetes, hipertensión — requiere derivación
    a profesional certificado, no solo IA)

PREFERENCIAS & RESTRICCIONES ALIMENTARIAS:
  Dieta base: □ Omnívoro □ Vegetariano □ Vegano □ Pescetariano
              □ Keto □ Paleo □ Mediterránea □ Flexitariano
  Alergias:   □ Frutos secos □ Mariscos □ Lácteos □ Gluten
              □ Huevo □ Soja □ Otro: ______
  Intolerancias: □ Lactosa □ Fructosa □ Otro: ______
  Restricciones religiosas/culturales: □ Kosher □ Halal □ Ninguna
  Alimentos que no le gustan: (campo libre, hasta 10 items)
  Alimentos favoritos: (campo libre, para personalizar recetas)

CONTEXTO PRÁCTICO:
  Presupuesto para alimentación: Bajo / Medio / Alto
  Tiempo disponible para cocinar: <15 min / 15-30 min / 30-60 min / Sin límite
  ¿Cocina en casa o come fuera frecuentemente?
  Número de comidas preferidas al día: 3 / 4 / 5 / 6
  Horario de entrenamiento habitual (para timing de nutrientes)

HISTORIAL DE SALUD (opcional, mejora la precisión del plan):
  Condiciones médicas relevantes: diabetes, hipertensión,
  problemas tiroideos, síndrome de ovario poliquístico, etc.
  Medicamentos que puedan afectar el metabolismo o apetito
  Cirugías bariátricas previas
  Historial de trastornos de la conducta alimentaria
    ⚠️ CRÍTICO: si el miembro indica antecedentes de TCA, el
    sistema NO genera un plan restrictivo automatizado — deriva
    obligatoriamente a consulta con el nutricionista humano antes
    de activar cualquier tracking de calorías (ver Sección 13.4
    para las salvaguardas éticas completas)
```

### 3.2 Perfil Nutricional — Estructura de Datos

```yaml
member_nutrition_profile:
  member_id: UUID
  objetivo: 'perdida_grasa'
  dieta_base: 'omnivoro'
  alergias: ['frutos_secos', 'mariscos']
  intolerancias: []
  restricciones_religiosas: null
  alimentos_evitar: ['brócoli', 'hígado']
  alimentos_favoritos: ['pollo', 'arroz', 'aguacate', 'avena']
  presupuesto: 'medio'
  tiempo_cocina: '15_30_min'
  comidas_por_dia_preferidas: 4
  come_fuera_frecuencia: '2_veces_semana'
  condiciones_medicas: []
  requiere_supervision_clinica: false
  fecha_ultimo_perfil_actualizado: timestamp
```

---

# PARTE II — GENERACIÓN DEL PLAN

---

## 4. MOTOR DE CÁLCULO NUTRICIONAL (TMB, TDEE, MACROS)

### 4.1 Fórmulas Científicas Utilizadas

```yaml
CÁLCULO DE TASA METABÓLICA BASAL (TMB):

  Fórmula Mifflin-St Jeor (estándar de oro, usada por defecto):
    Hombres: TMB = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) + 5
    Mujeres: TMB = (10 × peso_kg) + (6.25 × altura_cm) - (5 × edad) - 161

  Fórmula Katch-McArdle (más precisa SI hay % de grasa corporal
  medido, ej. de una evaluación física con bioimpedancia):
    TMB = 370 + (21.6 × masa_magra_kg)
    masa_magra_kg = peso_kg × (1 - %grasa_corporal/100)

  El sistema usa Katch-McArdle automáticamente cuando existe una
  evaluación física reciente (<60 días) con % de grasa corporal
  registrada (Módulo Workout Builder, Sección 4.2); si no, usa
  Mifflin-St Jeor con los datos biométricos básicos.

CÁLCULO DE GASTO ENERGÉTICO TOTAL DIARIO (TDEE):

  TDEE = TMB × Factor de Actividad

  Factores de actividad:
    Sedentario (poco o ningún ejercicio):          TMB × 1.2
    Ligero (ejercicio 1-3 días/semana):             TMB × 1.375
    Moderado (ejercicio 3-5 días/semana):           TMB × 1.55
    Activo (ejercicio 6-7 días/semana):             TMB × 1.725
    Muy activo (ejercicio intenso diario + trabajo
    físico):                                         TMB × 1.9

  El sistema AJUSTA automáticamente el factor de actividad usando
  los datos reales de asistencia y volumen de entrenamiento del
  Módulo Workout Builder (no solo lo que el miembro reporta
  subjetivamente) — si el miembro dice "muy activo" pero solo
  entrena 2 veces por semana según sus check-ins reales, el
  sistema sugiere ajustar a "ligero/moderado" y le explica por qué.

AJUSTE SEGÚN OBJETIVO:

  Pérdida de grasa:        TDEE - déficit (15-25% del TDEE)
    Déficit conservador (recomendado, sostenible): -15% a -20%
    Déficit agresivo (solo bajo supervisión, corto plazo): -25%
    NUNCA generar automáticamente un déficit >25% ni un total
    calórico por debajo del TMB — riesgo de salud, requiere
    aprobación explícita del nutricionista humano

  Ganancia muscular:       TDEE + superávit (10-20% del TDEE)
    Superávit conservador (minimiza ganancia de grasa): +10%
    Superávit moderado (recomendado para principiantes): +15-20%

  Mantenimiento/Recomposición: TDEE ± 5% (ciclo según entrenamiento)

CÁLCULO DE MACRONUTRIENTES:

  Proteína (prioridad #1, basada en g/kg de peso corporal):
    Pérdida de grasa:     1.8 - 2.4 g/kg (alto, preserva músculo
                           en déficit — evidencia de Helms et al.)
    Ganancia muscular:    1.6 - 2.2 g/kg
    Mantenimiento:        1.4 - 1.8 g/kg
    Adultos mayores (>60 años, cualquier objetivo): +0.2-0.4 g/kg
    adicional (evidencia de mayor resistencia anabólica con la edad)

  Grasas (mínimo por salud hormonal, no bajar de este piso):
    Mínimo: 0.6 g/kg de peso corporal (nunca menos, riesgo hormonal)
    Rango recomendado: 0.8 - 1.2 g/kg

  Carbohidratos (el remanente calórico tras proteína y grasa):
    Carbohidratos_g = (Calorías_totales - (Proteína_g × 4) -
                        (Grasa_g × 9)) / 4
    Ajustado hacia arriba en días de entrenamiento intenso
    (nutrient timing, ver Sección 4.2), hacia abajo en días de
    descanso — esto es DUP (Daily Undulating) aplicado a nutrición,
    coherente con el mismo principio ya usado en periodización de
    entrenamiento (Módulo Workout Builder, Sección 6)
```

### 4.2 Distribución de Nutrientes por Día de Entrenamiento (Nutrient Timing)

```yaml
El sistema conecta el calendario del plan de entrenamiento activo
del miembro (Módulo Workout Builder) con la distribución calórica
diaria, no dando el mismo plan fijo los 7 días de la semana:

  DÍA DE ENTRENAMIENTO INTENSO (ej. Día de Piernas, alto volumen):
    Carbohidratos: +10-15% sobre el promedio semanal
    Timing: mayor concentración de carbos 2-3h antes y 1h después
    del entreno (ventana peri-entreno)

  DÍA DE DESCANSO:
    Carbohidratos: -10-15% bajo el promedio semanal
    Grasas: ligeramente más altas para compensar calorías totales
    Proteína: se mantiene CONSTANTE todos los días (la síntesis
    proteica muscular se beneficia de ingesta estable, no cíclica)

  Este patrón es TRANSPARENTE para el miembro: el plan que ve en
  su dashboard ya viene ajustado por día, no tiene que calcularlo
  él mismo — ARIA-Nutrición le explica el porqué si pregunta
  ("¿Por qué hoy tengo más carbos que ayer?")
```

---

## 5. CONSTRUCTOR DE PLAN NUTRICIONAL — PANEL DEL NUTRICIONISTA

### 5.1 Interfaz del Constructor de Planes

```
CONSTRUCTOR DE PLAN NUTRICIONAL — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATOS BASE (calculados automáticamente, editables por el nutricionista):
  TMB (Katch-McArdle):        1,485 kcal
  TDEE (actividad moderada):   2,301 kcal
  Objetivo: Pérdida de grasa (déficit 18%)
  Calorías objetivo:           1,887 kcal/día

  [🔄 Recalcular con nuevos datos]  [✏️ Ajustar manualmente]

DISTRIBUCIÓN DE MACROS:
  Proteína:  [180g] ████████████████░░░░  38% (720 kcal)
  Grasas:    [55g]  ████████░░░░░░░░░░░░  26% (495 kcal)
  Carbos:    [168g] ██████████████░░░░░░  36% (672 kcal)
  [Ajustar con sliders] — el sistema recalcula el resto al mover uno

DISTRIBUCIÓN SEMANAL (vinculada al plan de entreno activo):
  Lunes (Piernas):      1,950 kcal · Carbos +15%
  Martes (Descanso):    1,820 kcal · Carbos -12%
  Miércoles (Torso):    1,900 kcal
  ...
  [Ver calendario completo]  [Sincronizar con plan de entreno]

ESTRUCTURA DE COMIDAS (según preferencia: 4 comidas/día):
  Desayuno    (25%): 472 kcal
  Almuerzo    (35%): 660 kcal
  Merienda    (10%): 189 kcal
  Cena        (30%): 566 kcal
  [Personalizar distribución]  [Agregar snack post-entreno]

RESTRICCIONES APLICADAS (heredadas del perfil):
  ✅ Sin frutos secos, sin mariscos
  ✅ Presupuesto medio — recetas usan ingredientes accesibles en
     El Salvador (no ingredientes importados de difícil acceso)

NOTAS DEL NUTRICIONISTA PARA MARÍA:
  [Este plan prioriza proteína alta para preservar tu masa
   muscular mientras bajas grasa. Ajustaremos en 2 semanas
   según tu progreso. — Dra. Ana López]

[🤖 Generar plan de comidas con IA]  [📋 Usar plantilla]
[✅ Aprobar y Asignar]  [💾 Guardar como borrador]
```

### 5.2 Plantillas de Plan Base (Punto de Partida)

```yaml
Plantillas precargadas por objetivo (el nutricionista las usa
como base y personaliza, no arranca de cero cada vez):

  "Déficit Moderado — Alta Proteína":
    Para: pérdida de grasa preservando músculo
    Distribución: 35% proteína / 30% grasa / 35% carbos
    Déficit: 18-20% del TDEE

  "Superávit Limpio — Ganancia Muscular":
    Para: masa muscular con mínima ganancia de grasa
    Distribución: 30% proteína / 25% grasa / 45% carbos
    Superávit: 12-15% del TDEE

  "Recomposición — Ciclado":
    Para: perder grasa y ganar músculo simultáneamente
    (funciona mejor en principiantes o retorno tras pausa larga)
    Días de entreno: superávit ligero / Días de descanso: déficit ligero

  "Mantenimiento Saludable":
    Para: miembros sin objetivo de cambio de peso, solo bienestar
    Distribución: 25% proteína / 30% grasa / 45% carbos
    Calorías: = TDEE

  "Rendimiento Deportivo":
    Para: atletas o miembros con objetivo de performance específico
    Mayor carbohidrato total, timing estricto peri-entreno

  "Vegano de Alto Rendimiento":
    Para: miembros veganos con objetivo de masa muscular
    (requiere atención especial a fuentes de proteína completa:
    combinación de legumbres + cereales, suplementación de B12,
    hierro, y consideración de mayor volumen de proteína total
    por menor biodisponibilidad de proteína vegetal)
```

---

## 6. CO-PILOTO IA PARA GENERACIÓN DE PLANES

### 6.1 Flujo de Generación Asistida (Análogo al Co-Piloto del Workout Builder)

```
El nutricionista interactúa con el Co-Piloto de forma conversacional,
igual que el Co-Piloto del Workout Builder ya documentado:

NUTRICIONISTA: "Crea un plan de 1,900 kcal para María, alta en
proteína, 4 comidas al día, sin mariscos ni frutos secos, con
platillos típicos salvadoreños que sean fáciles de preparar"

IA PROCESA (contexto real de María, ya cargado del perfil):
  ✅ Leyó el perfil: objetivo pérdida de grasa, presupuesto medio,
     15-30 min para cocinar, alergias registradas
  ✅ Leyó el plan de entrenamiento activo: PPL 4 días, para
     ajustar el nutrient timing

IA GENERA BORRADOR:
  "Creé un plan de 7 días para María con las restricciones
   indicadas. Prioricé proteínas accesibles (pollo, huevo, frijol,
   queso fresco) y carbohidratos complejos típicos de la dieta
   salvadoreña (arroz, plátano, tortilla de maíz, avena).

   Ejemplo del Lunes (día de piernas, carbos +15%):
   • Desayuno: Avena con banano y huevos revueltos — 470 kcal
   • Almuerzo: Pollo a la plancha, arroz, ensalada, frijoles — 660 kcal
   • Merienda: Yogur natural con fruta — 190 kcal
   • Cena: Pescado blanco al horno con vegetales y camote — 565 kcal

   ¿Ajusto algo? Puedo cambiar cualquier comida por otra opción
   dentro del mismo perfil de macros."

NUTRICIONISTA puede:
  ✅ Aprobar directo
  ✏️ Pedir cambios específicos: "Cambia la cena del martes, a
     María no le gusta el pescado"
  🔄 Regenerar la semana completa con otro enfoque
  📋 Guardar como nueva plantilla reutilizable para otros clientes
     con perfil similar
```

### 6.2 Sugerencias Contextuales del Co-Piloto

```yaml
Durante la construcción, el Co-Piloto sugiere en tiempo real,
igual que su análogo en el Workout Builder:

  Al detectar bajo consumo de fibra:
    "💡 Este plan tiene solo 12g de fibra — la recomendación es
     25-30g/día. ¿Agrego más vegetales o cambio el carbohidrato
     de arroz blanco a arroz integral en 2 comidas?"

  Al detectar desequilibrio de grasas:
    "⚠️ El plan tiene 0.5g/kg de grasa, por debajo del mínimo
     saludable de 0.6g/kg. Esto puede afectar la producción
     hormonal de María. Sugiero agregar aguacate o aceite de
     oliva en el almuerzo. [Ajustar automáticamente]"

  Al considerar restricciones médicas:
    "🚨 María tiene registrada sensibilidad a la lactosa. El plan
     que generé incluye yogur y queso en 3 comidas. ¿Cambio a
     alternativas sin lactosa (leche de almendra, queso vegano)
     o confirmas que puede consumir lácteos bajos en lactosa?"

  Al completar el plan:
    "✅ Plan completo. Resumen de calidad:
     - Macros: dentro del objetivo (±3%) ✅
     - Variedad: 18 alimentos distintos en la semana (buena
       variedad, reduce monotonía) ✅
     - Costo estimado semanal: $28-35 (dentro del presupuesto
       medio indicado) ✅
     - Fibra diaria promedio: 27g ✅
     [Ver reporte completo] [Asignar a María]"
```

---

## 7. ANÁLISIS DE LABORATORIO & AJUSTE MÉDICO

### 7.1 Ingesta de Exámenes de Laboratorio

```yaml
El miembro (o el nutricionista) puede subir resultados de
laboratorio para personalizar aún más el plan:

  Formatos aceptados: PDF, foto del examen físico (JPG/PNG)
  Procesamiento: OCR + extracción estructurada vía Claude Vision
  (siguiendo el mismo patrón de "análisis de documento estructurado"
  ya usado en otras partes del sistema, no video en tiempo real)

  Marcadores relevantes que el sistema extrae y interpreta:
    Perfil lipídico: colesterol total, LDL, HDL, triglicéridos
    Glucosa en ayunas / Hemoglobina A1c (indicador de resistencia
    a la insulina — relevante para ajustar carbohidratos)
    Perfil tiroideo: TSH, T3, T4 (afecta el metabolismo basal)
    Vitamina D, B12, hierro/ferritina (deficiencias comunes que
    afectan energía y rendimiento)
    Función renal (creatinina) — relevante si hay alta ingesta
    de proteína planificada
    Perfil hepático — relevante para ciertas recomendaciones de
    suplementación

  IMPORTANTE — límites éticos estrictos:
    El sistema NUNCA diagnostica ni interpreta el examen como
    "tienes la enfermedad X". Solo señala valores fuera de rango
    de referencia y SIEMPRE recomienda que el nutricionista (o el
    médico del miembro) interprete clínicamente el resultado antes
    de que cualquier ajuste de plan se active.

    Flujo obligatorio:
    1. Sistema extrae y estructura los datos del PDF/foto
    2. Sistema muestra al NUTRICIONISTA (no directamente al
       miembro) los valores fuera de rango con contexto
    3. El nutricionista decide si ajusta el plan y cómo
    4. Solo entonces el miembro ve el plan actualizado — nunca
       ve una interpretación automática de sus propios exámenes
       sin que un profesional la haya revisado primero
```

### 7.2 Ejemplo de Ajuste Basado en Laboratorio

```
ALERTA PARA EL NUTRICIONISTA — Examen de María García (subido hoy)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VALORES FUERA DE RANGO DE REFERENCIA DETECTADOS:
  Vitamina D: 18 ng/mL  (rango de referencia del lab: 30-100 ng/mL)
  Ferritina:  22 ng/mL  (rango de referencia del lab: 30-300 ng/mL)

VALORES DENTRO DE RANGO NORMAL:
  Glucosa en ayunas: 88 mg/dL ✅
  Perfil lipídico: dentro de parámetros ✅

SUGERENCIA DEL SISTEMA (requiere tu revisión y aprobación):
  "Los valores de Vitamina D y Ferritina de María están por
   debajo del rango de referencia de su laboratorio. Esto es
   común y frecuentemente asintomático, pero puede relacionarse
   con fatiga o menor rendimiento en el entrenamiento.

   Como nutricionista, podrías considerar:
   - Incluir más fuentes de hierro en su plan (carnes rojas
     magras, legumbres, espinaca con vitamina C para mejorar
     absorción)
   - Conversar con ella sobre exposición solar y posible
     suplementación de Vitamina D (esto último es decisión
     médica/nutricional profesional, no algo que el sistema
     recomiende de forma automática)

   Esta es información de apoyo — la interpretación clínica y
   cualquier recomendación de suplementación queda a tu criterio
   profesional."

[✅ Ajustar plan con más fuentes de hierro]  [📝 Agregar nota
para consulta presencial]  [Ignorar por ahora]
```

---

# PARTE III — EXPERIENCIA DEL MIEMBRO

---

## 8. DASHBOARD NUTRICIONAL DEL MIEMBRO

### 8.1 Pantalla Principal — Hoy

```
🥗 MI NUTRICIÓN — Hoy, Lunes 15 de junio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CALORÍAS DE HOY (día de Piernas — carbos ajustados +15%):
  ┌──────────────────────────────────────────────────┐
  │         1,340 / 1,950 kcal consumidas             │
  │  ████████████████████░░░░░░░░  69%                │
  │         610 kcal restantes hoy                    │
  └──────────────────────────────────────────────────┘

MACROS DE HOY:
  Proteína:  125g / 180g  ████████████████░░░░  69%
  Grasas:     38g / 55g   █████████████░░░░░░░  69%
  Carbos:    142g / 195g  ██████████████░░░░░░  73%

COMIDAS DE HOY:
  ✅ Desayuno    472 kcal   [Ver detalle]
  ✅ Almuerzo    660 kcal   [Ver detalle]
  ⏳ Merienda    — pendiente —   [+ Registrar]
  ⏳ Cena        — pendiente —   [+ Registrar]

  [📸 Foto del plato]  [🎙️ Por voz]  [🔍 Buscar alimento]
  [⭐ Mis favoritos]

MENSAJE DE ARIA-NUTRICIÓN:
  "¡Vas muy bien, María! 💪 Hoy es día de piernas, así que tu
   cena tiene más carbos de lo usual — aprovecha para reponer
   energía. Con 610 kcal restantes, un buen plato de cena sería:
   150g de pollo + 1 taza de arroz + vegetales. ¿Te gustaría
   que te sugiera 3 opciones de cena que encajen perfecto?"

RACHA DE REGISTRO: 🔥 8 días consecutivos
```

### 8.2 Vista de Progreso Nutricional (Analytics del Miembro)

```
MI PROGRESO NUTRICIONAL — Últimas 4 semanas
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ADHERENCIA AL PLAN:
  Semana 1: ████████████████░░░░  82%
  Semana 2: ██████████████████░░  91%
  Semana 3: █████████████████░░░  87%
  Semana 4: ███████████████████░  95%  ← Mejorando ↑

PROMEDIO DE MACROS vs. OBJETIVO:
  Proteína:  Promedio 172g  (objetivo 180g)  — 96% cumplimiento ✅
  Grasas:    Promedio 58g   (objetivo 55g)   — 105% (ligero exceso)
  Carbos:    Promedio 160g  (objetivo 168g)  — 95% cumplimiento ✅

DÍAS CON MEJOR Y PEOR ADHERENCIA:
  Mejor:  Lunes, Miércoles (días de entreno — más disciplina)
  Peor:   Sábado (fines de semana — patrón común, ARIA lo sabe)

CORRELACIÓN CON PROGRESO FÍSICO:
  "En las semanas con >90% de adherencia, tu pérdida de peso
   promedió 0.6 kg/semana. En la semana 1 (82% adherencia),
   fue de solo 0.2 kg. La consistencia está funcionando 📈"

[Ver mi diario completo]  [Exportar reporte para mi nutricionista]
```

---

## 9. REGISTRO DE COMIDAS — LOS 4 MÉTODOS

### 9.1 Resumen de los Métodos de Registro

```
┌────────────────────────────────────────────────────────────────┐
│         4 FORMAS DE REGISTRAR UNA COMIDA (mínima fricción)      │
├──────────┬───────────────────────────────────────────────────────┤
│ MÉTODO 1 │ 📸 FOTO DEL PLATO — Analizado por IA visual           │
│ MÉTODO 2 │ 🎙️ VOZ — "Comí pollo con arroz y ensalada"           │
│ MÉTODO 3 │ 🔍 BÚSQUEDA/BARCODE — Base de datos de alimentos      │
│ MÉTODO 4 │ ⭐ FAVORITOS/RECIENTES — Un toque para repetir         │
└──────────┴───────────────────────────────────────────────────────┘
```

### 9.2 Método 3 — Búsqueda y Código de Barras

```yaml
Base de datos de alimentos:
  Fuente primaria: Open Food Facts (base de datos abierta,
  colaborativa, con cobertura amplia de productos de LATAM
  incluyendo marcas locales de El Salvador y Centroamérica)
  Fuente secundaria: USDA FoodData Central (para alimentos
  genéricos/naturales sin marca — frutas, verduras, carnes)
  Fuente terciaria: base de datos propia del gym (platillos
  típicos locales curados por el nutricionista, ej. "pupusas",
  "casamiento", que no están bien representados en bases de
  datos internacionales)

  Escaneo de código de barras:
    Cámara del teléfono → lee EAN-13/UPC → busca en Open Food
    Facts → si existe, autocompleta calorías y macros
    Si no existe: el miembro puede agregarlo manualmente y
    opcionalmente contribuirlo a la base de datos del gym para
    que otros miembros lo encuentren después

  Alimentos favoritos y recientes:
    El sistema aprende qué come habitualmente el miembro
    Los 10 alimentos/platillos más frecuentes aparecen como
    accesos directos de 1 toque
    "Repetir el desayuno de ayer" — un botón para el patrón
    más común (avena + huevo, en el caso de María)
```

---

## 10. FOOD SCANNER — ANÁLISIS DE FOTO DEL PLATO CON IA VISUAL

### 10.1 Arquitectura de la Funcionalidad (Consistente con el Resto del Sistema)

```yaml
Aplicando el mismo principio arquitectónico ya establecido para
AI Form Check (documento de la funcionalidad de cámara): NO se
usa un modelo de video en tiempo real. Se usa un modelo de visión
que analiza UNA foto estática, que es exactamente para lo que
Claude Vision y Google Vision SÍ están optimizados (identificación
y clasificación de objetos en una imagen fija, no tracking de
movimiento en video).

FLUJO:

PASO 1 — Captura:
  Miembro toma foto del plato (o sube una de galería)
  Opcional: foto de "antes" y "después" para estimar cuánto comió
  realmente si no terminó el plato completo

PASO 2 — Reconocimiento de alimentos (Google Cloud Vision +
  Claude Vision combinados):
  Google Vision: detección de objetos y etiquetado inicial rápido
  (identifica "hay pollo, hay arroz, hay vegetales verdes")
  Claude Vision: razonamiento contextual sobre la composición
  del plato, estimación de porciones por referencia visual (tamaño
  del plato, comparación con objetos de referencia como cubiertos),
  y estructuración de la respuesta en formato utilizable

PASO 3 — Estimación de macros:
  El sistema cruza los alimentos identificados con la base de
  datos nutricional (Open Food Facts / USDA) para estimar
  calorías y macros de la porción detectada

PASO 4 — Confirmación del usuario (CRÍTICO — nunca automático
  sin revisión):
  El resultado de la IA se muestra como una PROPUESTA editable,
  nunca se registra directamente sin que el miembro confirme
  cantidades — el reconocimiento de porciones por foto tiene
  margen de error conocido y el miembro conoce mejor su propia
  porción real
```

### 10.2 Experiencia de Usuario del Food Scanner

```
📸 ESCÁNER DE COMIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[FOTO DEL PLATO TOMADA]

🤖 Analizando tu plato...

── Resultado (editable) ──

Detecté en tu plato:
  🍗 Pechuga de pollo a la plancha    ~150g   248 kcal
  🍚 Arroz blanco                     ~1 taza  205 kcal
  🥗 Ensalada mixta con aceite         ~1 porción  85 kcal
  🫘 Frijoles                          ~1/2 taza  114 kcal

  [✏️ Ajustar cantidades]  [➕ Agregar algo que falta]
                            [➖ Quitar algo]

TOTAL ESTIMADO:  652 kcal
  Proteína: 42g  |  Grasas: 18g  |  Carbos: 78g

¿Es correcto?
  [✅ Sí, registrar así]  [✏️ Corregir manualmente]

💡 ARIA: "Este plato encaja muy bien con tu objetivo de hoy.
   Tu proteína está en buen nivel. Si quieres, puedes agregar
   más vegetales para la fibra — ¡pero está balanceado! 👍"
```

### 10.3 Precisión y Limitaciones (Transparencia con el Usuario)

```yaml
Es importante comunicar honestamente las limitaciones, igual que
se hizo con AI Form Check:

  Precisión esperada: buena para identificar QUÉ alimentos hay,
  moderada para estimar CANTIDADES exactas (por eso el paso de
  confirmación/edición es obligatorio, no opcional)

  Casos donde funciona mejor:
    Platos con alimentos claramente separados y visibles
    Porciones estándar reconocibles (un plato, no una olla)
    Buena iluminación

  Casos donde requiere más ajuste manual del usuario:
    Alimentos mezclados/guisados (difícil separar componentes)
    Salsas y aderezos (calorías "escondidas" difíciles de estimar
    visualmente — el sistema pregunta explícitamente "¿le pusiste
    aceite o mantequilla para cocinar?")
    Platillos muy locales sin buena representación en el
    entrenamiento del modelo (aquí es donde la base de datos
    curada por el nutricionista del gym, mencionada en 9.2, se
    vuelve valiosa — permite mejorar el reconocimiento de
    "pupusas", "yuca frita", etc. con el tiempo)

  Mensaje de honestidad en la primera vez que se usa:
    "El escáner de comida es una guía rápida, no una báscula de
     precisión. Es una gran herramienta para no perder el hábito
     de registrar, incluso cuando no tienes tiempo de pesar todo.
     Ajusta las cantidades si sabes que tu porción fue diferente."
```

---

## 11. BIBLIOTECA DE RECETAS & MEAL PREP

### 11.1 Estructura de la Biblioteca de Recetas

```yaml
Cada receta en el sistema tiene:
  nombre, foto, tiempo de preparación, dificultad
  ingredientes con cantidades (escalable por porciones, igual
  patrón que el widget de recipe_display_v0 ya usado en el sistema)
  instrucciones paso a paso
  información nutricional completa (calorías, macros, fibra,
  sodio) por porción
  etiquetas: objetivo compatible, restricciones (vegano, sin
  gluten, etc.), costo estimado, tiempo de preparación
  origen: recetas curadas por el equipo de nutrición del gym +
  recetas típicas locales adaptadas a fines fitness

Filtrado inteligente:
  El miembro ve SOLO recetas compatibles con su perfil (sin sus
  alergias, dentro de su presupuesto, dentro de su tiempo
  disponible) — no una biblioteca genérica de miles de recetas
  irrelevantes para él

Meal Prep (preparación semanal):
  Sugerencias de "cocina el domingo, come toda la semana"
  Recetas que escalan bien (se pueden hacer en lote y refrigerar/
  congelar sin perder calidad)
  Lista de compras automática generada a partir del plan semanal
  completo — con integración directa al Marketplace del gym
  (Módulo MKT) para los productos que el gym vende (proteína,
  suplementos) y una lista aparte para lo que debe comprar en
  el supermercado
```

### 11.2 Generación de Lista de Compras

```
MI LISTA DE COMPRAS — Semana del 15-21 junio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Basada en tu plan nutricional de esta semana:

PROTEÍNAS:
  □ Pechuga de pollo — 1.2 kg
  □ Huevos — 18 unidades
  □ Queso fresco — 300g
  □ Frijoles — 1 kg

CARBOHIDRATOS:
  □ Arroz — 1.5 kg
  □ Avena — 500g
  □ Plátano — 7 unidades
  □ Tortillas de maíz — 1 paquete

VEGETALES Y FRUTAS:
  □ Lechuga, tomate, cebolla — para ensaladas
  □ Banano — 7 unidades

DISPONIBLE EN TU GYM 🛒 (Marketplace):
  □ Proteína Whey Vainilla — para tus batidos post-entreno
  □ Avena Premium del gym (mejor precio que en supermercado)
  [Agregar al carrito del Marketplace]

Costo estimado total: $32-38
[✅ Marcar como comprado]  [📤 Compartir lista]  [🔄 Regenerar]
```

---

## 12. ASISTENTE DE VOZ NUTRICIONAL

### 12.1 Registro y Consultas por Voz (Mismo Patrón que ARIA/ZEUS)

```yaml
Consistente con la arquitectura de voz ya establecida para ARIA
y ZEUS (Whisper para STT, ElevenLabs para TTS), el registro
nutricional por voz sigue el mismo patrón validado:

REGISTRO DE COMIDA POR VOZ:

  MIEMBRO (audio): "Comí dos huevos revueltos con una tortilla
  y un vaso de jugo de naranja"

  SISTEMA (transcribe con Whisper, interpreta con Claude):
  "Registré:
   • 2 huevos revueltos — 180 kcal
   • 1 tortilla de maíz — 95 kcal
   • 1 vaso de jugo de naranja natural — 110 kcal
   Total: 385 kcal | Proteína: 16g | Carbos: 42g | Grasas: 16g

   ¿Es correcto? [Sí, guardar] [Corregir]"

CONSULTAS POR VOZ:

  "¿Cuántas calorías me quedan hoy?"
  "¿Qué puedo comer de cena que tenga poca grasa?"
  "¿Es buena la avena para mi objetivo?"
  "¿Cuánta proteína llevo esta semana en promedio?"
  "Recomiéndame un snack de menos de 200 calorías"

  Todas estas se resuelven vía ARIA-Nutrición (Sección 13),
  usando el mismo pipeline RAG + LLM ya documentado en la
  Arquitectura Técnica general del proyecto.
```

---

# PARTE IV — INTELIGENCIA & CIENCIA

---

## 13. ARIA-NUTRICIÓN — EL COACH NUTRICIONAL VIRTUAL

### 13.1 Relación con ARIA y ZEUS (Consistencia del Ecosistema de IA)

```yaml
El sistema ya tiene 2 personalidades de IA bien definidas:
  ARIA: CRM, retención, motivación, agendamiento
  ZEUS: coach técnico de entrenamiento

Para nutrición, la decisión de diseño es que NO se crea una
tercera personalidad separada — se extiende ARIA con
especialización nutricional ("ARIA-Nutrición" es un MODO de
ARIA, no un personaje nuevo), porque:

  1. La nutrición está más cerca del dominio de "hábitos diarios
     y motivación" (territorio de ARIA) que de "técnica de
     movimiento" (territorio de ZEUS)
  2. Evita fragmentar la relación del miembro en 3 asistentes
     distintos — ARIA ya es su "amiga" en la app, y ahora también
     sabe de nutrición, igual que un buen coach de vida real
     suele orientar en ambos frentes
  3. Reduce la complejidad de mantenimiento de prompts y contexto

ARIA en modo nutrición usa el mismo pipeline RAG documentado en
la Arquitectura Técnica (Sección 11), con una capa de contexto
adicional específica de nutrición.
```

### 13.2 System Prompt de ARIA-Nutrición

```typescript
const ARIA_NUTRITION_SYSTEM_PROMPT = `
Eres ARIA, la asistente virtual del gimnasio {gymName}. Ahora
estás ayudando a {memberName} con su nutrición.

PLAN NUTRICIONAL ACTIVO:
{nutritionPlan}

REGISTRO DE HOY:
{todaysFoodLog}

PERFIL NUTRICIONAL:
{nutritionProfile}

RESTRICCIONES MÉDICAS Y ALERGIAS:
{medicalRestrictions}

PRINCIPIOS DE TU ORIENTACIÓN NUTRICIONAL:
1. Nunca prescribes ni modificas el plan nutricional por tu
   cuenta — el plan fue diseñado y aprobado por un nutricionista
   certificado. Tu rol es ayudar al miembro a SEGUIRLO, entenderlo
   y resolver dudas del día a día, no rediseñarlo.
2. Si el miembro pregunta algo que requiere cambiar el plan de
   forma sustancial (ej. "quiero bajar más rápido", "quiero
   cambiar de dieta completamente"), tu respuesta es conectarlo
   con su nutricionista, no decidir tú el cambio.
3. Nunca dabas consejos médicos ni diagnósticos. Si el miembro
   menciona síntomas (mareos, fatiga extrema, dolor), sugieres
   consultar a un profesional de salud, no nutricional.
4. Vigilancia de señales de alerta de trastornos alimentarios:
   si detectas lenguaje que sugiere restricción extrema, culpa
   excesiva por comer, o patrones compulsivos, NO refuerces esos
   patrones y activa el protocolo de alerta al nutricionista
   humano (ver tus instrucciones de seguridad del sistema).
5. Celebra la adherencia y el esfuerzo, no solo el resultado en
   la báscula — la relación saludable con la comida es tan
   importante como los macros.
6. Sé práctica: si el miembro no sabe qué comer con lo que tiene
   en casa, ayúdale a improvisar dentro de su plan, no le exijas
   perfección rígida.
7. Responde siempre en español latinoamericano, con calidez y
   sin juicio.
`;
```

### 13.3 Ejemplos de Interacción

```
MIEMBRO: "Hoy me salí mucho del plan, comí pizza y no hice
ejercicio. Me siento súper culpable"

ARIA-NUTRICIÓN:
"Oye, respira 😊 Un día no define tu progreso — lo que define
tu resultado es lo que haces la mayoría de los días, y tú llevas
8 días seguidos registrando y con 91% de adherencia esta semana.
Eso es excelente.

La culpa no ayuda, pero sí ayuda seguir mañana con tu plan normal.
¿Retomamos con el desayuno de mañana? Si quieres, puedo sugerirte
algo ligero para hoy en la noche si todavía tienes hambre 💪"

---

MIEMBRO: "¿Puedo comer huevo todos los días? ¿No sube el
colesterol?"

ARIA-NUTRICIÓN:
"Buena pregunta. La evidencia científica actual (incluyendo
estudios de la American Heart Association) muestra que para la
mayoría de las personas, el huevo con moderación (1-2 al día) no
tiene un impacto negativo significativo en el colesterol sanguíneo
— el colesterol dietético afecta mucho menos de lo que se pensaba
hace años.

Dicho esto, si tienes antecedentes familiares de colesterol alto
o alguna condición cardiovascular, vale la pena que se lo
comentes a la Dra. López en tu próxima consulta para que lo
evalúe con tu caso específico. ¿Quieres que te agende una cita
para revisarlo? 😊"
```

### 13.4 Salvaguardas Éticas Críticas (Trastornos de la Conducta Alimentaria)

```yaml
Esta es la sección más importante de todo el módulo desde el
punto de vista de responsabilidad y seguridad del usuario:

DETECCIÓN DE SEÑALES DE ALERTA (el sistema monitorea patrones,
no juzga momentos aislados):

  Patrones de restricción extrema:
    Registro consistente de <1,200 kcal/día sin que el plan lo
    indique (muy por debajo del déficit prescrito)
    Saltarse comidas de forma repetida y creciente

  Patrones de preocupación obsesiva:
    Pesarse o registrar comida múltiples veces al día de forma
    creciente y ansiosa (más allá del uso normal esperado)
    Lenguaje en las interacciones con ARIA que indica culpa
    extrema, autocrítica severa, o reglas alimentarias rígidas
    ("no puedo comer nada de eso", "soy un fracaso por comer esto")

  Patrones de atracones o purga:
    Registro de ingesta calórica muy por encima de lo habitual
    seguido de compensación extrema (ejercicio excesivo repentino,
    ayuno prolongado inmediato)

ACCIÓN DEL SISTEMA (nunca diagnóstico, siempre derivación):

  1. ARIA NUNCA menciona "trastorno alimentario" ni ninguna
     etiqueta clínica al miembro — esto es diagnóstico y está
     fuera de su alcance y del alcance de cualquier IA

  2. ARIA ajusta su tono: deja de enfocarse en números/calorías
     en la conversación y se enfoca en bienestar general

  3. El sistema genera una alerta INTERNA (no visible al miembro)
     para el nutricionista y/o el trainer asignado:
     "⚠️ Patrón de atención: [Nombre] muestra señales que ameritan
      una conversación de seguimiento cercano. Detalles: [patrón
      detectado, sin diagnosticar]. Se recomienda contacto humano
      cercano antes de continuar ajustando el plan automatizado."

  4. Mientras la alerta está activa, el sistema PAUSA cualquier
     sugerencia automática de reducir más calorías o macros —
     solo el nutricionista humano puede hacer cambios durante
     este período

  5. Si el miembro había indicado en el onboarding (Sección 3.1)
     antecedentes de TCA, el plan nunca se genera con enfoque de
     restricción calórica automatizada desde el inicio — se
     deriva directo a consulta profesional presencial antes de
     activar cualquier tracking numérico

Esta salvaguarda es coherente con los principios ya establecidos
para ARIA y ZEUS en el resto del sistema (nunca reforzar
comportamientos autodestructivos, siempre derivar a supervisión
humana en temas de salud sensibles) y se relaciona directamente
con las buenas prácticas de bienestar del usuario ya documentadas
a nivel de plataforma completa.
```

---

## 14. MOTOR DE AJUSTE AUTOMÁTICO DE MACROS

### 14.1 Ajuste Basado en Progreso Real (No Solo Tiempo Transcurrido)

```yaml
Cada 2 semanas (configurable), el sistema evalúa el progreso real
del miembro y SUGIERE (nunca aplica automáticamente sin aprobación
del nutricionista) ajustes al plan:

LÓGICA DE EVALUACIÓN:

  Si el objetivo es pérdida de grasa:
    Pérdida real < 0.2% del peso corporal/semana durante 2+ semanas
    consecutivas, CON adherencia al plan >85% (descarta que el
    problema sea simplemente no seguir el plan):
    → Sugerir reducir calorías 5-8% adicional, o evaluar aumento
       de actividad física (coordinado con el Módulo Workout Builder)

    Pérdida real > 1% del peso corporal/semana (más rápido de lo
    saludable, riesgo de pérdida de masa muscular):
    → Sugerir aumentar calorías ligeramente, revisar si el déficit
       es demasiado agresivo

  Si el objetivo es ganancia muscular:
    Ganancia de peso <0.1% semanal durante 3+ semanas con
    adherencia >85% y entrenamiento consistente (verificado con
    Módulo Workout Builder):
    → Sugerir aumentar calorías 5-10%

    Ganancia de peso >0.5% semanal (probable ganancia excesiva de
    grasa, no solo músculo):
    → Sugerir moderar el superávit calórico

TODO ajuste sugerido pasa por el nutricionista para aprobación
antes de aplicarse al plan del miembro — el sistema NUNCA cambia
el plan de forma completamente autónoma sin supervisión humana,
siguiendo el mismo principio de "IA asiste, profesional decide"
establecido en el resto del módulo.
```

---

## 15. EDUCACIÓN NUTRICIONAL & MOTOR DE INVESTIGACIÓN CIENTÍFICA

### 15.1 Extensión del Motor de Investigación Ya Existente

```yaml
El Módulo Workout Builder ya define un "Motor de Investigación
Científica Continua" (Sección 16 de ese documento) que monitorea
fuentes académicas y actualiza la biblioteca de ejercicios. Se
extiende el MISMO motor para cubrir nutrición, en lugar de crear
un sistema paralelo:

FUENTES ADICIONALES MONITOREADAS PARA NUTRICIÓN:
  International Society of Sports Nutrition (ISSN) — position
  stands sobre proteína, creatina, timing de nutrientes
  Academy of Nutrition and Dietetics
  American Journal of Clinical Nutrition
  Examine.com (base de datos de suplementos con evidencia
  clasificada por calidad de estudio)
  Alan Aragon, Eric Helms, Layne Norton (ya identificados como
  fuentes de referencia en el documento original del Workout
  Builder, Sección 16.1 — trabajan tanto en fuerza como en
  nutrición deportiva)

TIPOS DE ACTUALIZACIONES QUE GENERA PARA NUTRICIÓN:
  Nueva evidencia sobre timing de proteína (ej. ventana anabólica)
  Actualización de rangos recomendados de macronutrientes
  Nueva evidencia sobre suplementos (qué funciona, qué no)
  Alertas de seguridad sobre dietas de moda sin respaldo científico

Mismo proceso de aprobación: pasa por el Panel de Aprobación de
Contenido ya documentado (Módulo Workout Builder, Sección 17),
ahora incluyendo al nutricionista del gym como aprobador para
contenido de nutrición específicamente.
```

### 15.2 Contenido Educativo para el Miembro

```yaml
Biblioteca educativa dentro de la app (no solo prescripción,
sino comprensión — principio de diseño #6 de la Sección 1.3):

  Micro-lecciones cortas (2-3 minutos de lectura), desbloqueadas
  progresivamente:
    "¿Por qué la proteína es tan importante?"
    "Qué son realmente los macros y por qué importan"
    "El mito del 'metabolismo lento'"
    "Cómo leer una etiqueta nutricional"
    "Suplementos: cuáles tienen evidencia real y cuáles no"
    "Por qué un día 'malo' no arruina tu progreso"

  Formato: texto corto + opción de audio (narrado por ARIA,
  mismo pipeline TTS) para consumir mientras se cocina o se viaja

  Gamificación conectada (Módulo GAME): completar lecciones
  otorga puntos, medalla "Estudiante de Nutrición" tras completar
  la serie básica
```

---

## 16. SUPLEMENTACIÓN PERSONALIZADA

### 16.1 Recomendaciones Conectadas al Marketplace

```yaml
Basado en el perfil, objetivo y (si están disponibles) resultados
de laboratorio del miembro, el sistema sugiere categorías de
suplementos con evidencia científica sólida — SIEMPRE conectando
con productos reales disponibles en el Marketplace del gym
(Módulo MKT ya documentado):

  Para objetivo de ganancia muscular:
    Proteína en polvo (si no alcanza el objetivo de proteína
    solo con comida — el sistema calcula el déficit real)
    Creatina monohidrato (el suplemento con mayor evidencia
    científica para fuerza e hipertrofia)

  Para objetivo de pérdida de grasa:
    Proteína en polvo (ayuda a alcanzar la proteína alta del
    plan sin exceso calórico de otras fuentes)
    Multivitamínico (si el déficit calórico es prolongado,
    reduce riesgo de deficiencias de micronutrientes)

  Basado en laboratorio (solo con aprobación del nutricionista,
  nunca automático — ver Sección 7.1):
    Vitamina D, hierro, omega-3, según hallazgos específicos

  IMPORTANTE: el sistema NUNCA presenta esto como "necesitas
  comprar esto" de forma agresiva — se presenta como información
  educativa primero ("esto es lo que la evidencia dice sobre
  X suplemento para tu objetivo"), con la opción de compra en
  el Marketplace como conveniencia, no como venta forzada. Esto
  es coherente con el principio de "asistente de compra que
  conoce el objetivo del miembro" ya establecido en el Módulo
  Marketplace (Sección 11).
```

---

# PARTE V — INTEGRACIÓN & DATOS

---

## 17. PANEL DEL NUTRICIONISTA — GESTIÓN DE CLIENTES

### 17.1 Dashboard del Nutricionista

```
PANEL NUTRICIONISTA — Dra. Ana López
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MIS CLIENTES (32 activos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NOMBRE          PLAN           ADHERENCIA  ALERTA
  María García    Déficit Prot.  91%         —
  Pedro Ramírez   Superávit      78%         ⚠️ Meseta 3 sem
  Ana Torres      Mantenimiento  95%         —
  Carlos Mejía    Déficit Prot.  62%         🔴 Baja adherencia
  ...
  [Ver todos]

ALERTAS QUE REQUIEREN MI ATENCIÓN:
  🔴 Carlos Mejía — Adherencia bajó a 62% (era 85% hace 2 semanas)
     [Ver detalle] [Enviar mensaje] [Agendar consulta]

  🟡 Pedro Ramírez — Sin progreso en peso, 3 semanas, adherencia OK
     Sistema sugiere: aumentar calorías 8% (superávit insuficiente)
     [Revisar sugerencia] [Ajustar manualmente] [Ignorar]

  📋 3 exámenes de laboratorio nuevos pendientes de revisión
     [Ver exámenes]

CONSULTAS DE HOY:
  10:00am — María García (seguimiento quincenal)
  2:00pm  — Nuevo cliente: Roberto Sánchez (evaluación inicial)

RENDIMIENTO DE MIS PLANES (últimos 3 meses):
  Adherencia promedio de mis clientes:     84%  (gym: 76%)
  Clientes que alcanzaron su meta:          8
  Rating promedio de mis consultas:        4.9/5.0
```

### 17.2 Vista 360° Nutricional del Cliente

```yaml
Al entrar al perfil de un cliente específico, el nutricionista ve:
  Timeline completo de planes (histórico de todos los planes
  asignados, no solo el actual)
  Gráficas de adherencia superpuestas con progreso físico real
  (peso, % grasa) para correlacionar directamente
  Registro de comidas completo, con capacidad de filtrar por
  fecha o tipo de comida
  Todos los exámenes de laboratorio subidos, con histórico de
  valores a través del tiempo (gráfica de tendencia, ej. cómo
  ha evolucionado la ferritina en los últimos 6 meses)
  Historial de conversaciones relevantes con ARIA-Nutrición
  (resumen, no el chat completo palabra por palabra — respeta
  privacidad pero da contexto útil)
  Notas privadas del nutricionista (solo visibles para el staff,
  nunca para el miembro) para observaciones clínicas sensibles
```

---

## 18. INTEGRACIONES DEL MÓDULO

```yaml
Con Módulo Workout Builder (MOD-WKT):
  - El plan de entrenamiento activo ajusta el nutrient timing
    diario (Sección 4.2)
  - Las evaluaciones físicas (bioimpedancia) alimentan el cálculo
    de TMB vía Katch-McArdle (más preciso que Mifflin-St Jeor)
  - ZEUS puede recordar la ventana de proteína post-entreno
    (ya mencionado en el documento original del Workout Builder,
    Sección 12.2) — ahora ese recordatorio se coordina con el
    plan nutricional real del miembro, no es genérico

Con Módulo CRM/ARIA (MOD-CRM):
  - ARIA-Nutrición es una extensión de ARIA, comparte el mismo
    historial de relación y contexto del miembro
  - Las alertas de patrones de riesgo alimentario (Sección 13.4)
    se integran al sistema de Risk Score y workflows ya existentes
  - Adherencia nutricional alta correlaciona con menor Risk Score
    de cancelación (dato para el modelo de retención)

Con Módulo Marketplace (MOD-MKT):
  - Lista de compras conecta directo con productos del gym
  - Recomendaciones de suplementación conectadas al catálogo
  - Los combos "diseñados por el nutricionista" ya mencionados
    en el Módulo Marketplace (Sección 11.2) se generan desde
    este módulo

Con Módulo Gamificación (MOD-GAME):
  - Puntos por registro diario consistente de comidas
  - Medallas de nutrición (ej. "7 días de registro perfecto")
  - Racha nutricional visible en el dashboard gamificado

Con Panel Ejecutivo (MOD-ANALYTICS):
  - KPIs de adopción y adherencia nutricional agregados a nivel
    de gym (ya esbozado en el Módulo Panel Ejecutivo, Sección 7.1)
  - Reporte de correlación entre nutrición y retención/resultados
```

---

## 19. ANALYTICS DE NUTRICIÓN (BI)

### 19.1 Extensión del Dashboard Ejecutivo

```yaml
Estos KPIs se integran al Panel Ejecutivo ya documentado
(Sección 7 de ese módulo), ampliando lo que ya existía:

  Adopción del módulo: % de miembros con plan nutricional activo
  Adherencia promedio del gym (comparativa entre nutricionistas
  si hay más de uno en el staff)
  Correlación nutrición-retención: ¿los miembros con plan
  nutricional activo tienen menor churn?
  Correlación nutrición-resultados: ¿los miembros con alta
  adherencia nutricional alcanzan sus metas físicas más rápido?
  Uso del Food Scanner vs. registro manual (para entender qué
  método prefieren los miembros y optimizar la UX)
  Consultas de nutricionista: ocupación de agenda, satisfacción
```

---

## 20. MODELO DE DATOS COMPLETO

```sql
-- ─────────────────────────────────────────────────────────────
-- PERFIL NUTRICIONAL DEL MIEMBRO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_nutrition_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL UNIQUE REFERENCES members(id),
  objetivo                    VARCHAR(30) NOT NULL,
  dieta_base                  VARCHAR(30) DEFAULT 'omnivoro',
  alergias                    TEXT[],
  intolerancias                TEXT[],
  restricciones_religiosas     VARCHAR(30),
  alimentos_evitar             TEXT[],
  alimentos_favoritos           TEXT[],
  presupuesto                  VARCHAR(20) DEFAULT 'medio',
  tiempo_cocina                 VARCHAR(20),
  comidas_por_dia_preferidas    INTEGER DEFAULT 4,
  condiciones_medicas           TEXT[],
  requiere_supervision_clinica  BOOLEAN DEFAULT FALSE,
  antecedente_tca_declarado     BOOLEAN DEFAULT FALSE,
  created_at                    TIMESTAMP DEFAULT NOW(),
  updated_at                    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PLANES NUTRICIONALES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE nutrition_plans (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                       UUID NOT NULL REFERENCES gyms(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  nutritionist_id              UUID REFERENCES staff(id),
  status                       VARCHAR(20) DEFAULT 'draft',
  -- draft|active|completed|superseded
  tmb_kcal                    DECIMAL(7,2),
  tmb_formula_used             VARCHAR(30),        -- mifflin_st_jeor|katch_mcardle
  tdee_kcal                    DECIMAL(7,2),
  factor_actividad              DECIMAL(3,2),
  objetivo                     VARCHAR(30),
  calorias_objetivo_diarias     DECIMAL(7,2),
  proteina_g                   DECIMAL(6,2),
  grasas_g                     DECIMAL(6,2),
  carbohidratos_g               DECIMAL(6,2),
  distribucion_por_dia_json     JSONB,   -- ajustes por día de entreno/descanso
  numero_comidas                INTEGER DEFAULT 4,
  distribucion_comidas_json     JSONB,   -- % por comida (desayuno, almuerzo, etc.)
  ai_generated                  BOOLEAN DEFAULT FALSE,
  ai_generation_prompt          TEXT,
  nota_nutricionista             TEXT,
  fecha_inicio                  DATE,
  fecha_proxima_revision          DATE,
  created_at                    TIMESTAMP DEFAULT NOW(),
  updated_at                    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- COMIDAS PLANIFICADAS (dentro de un plan)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE planned_meals (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nutrition_plan_id            UUID NOT NULL REFERENCES nutrition_plans(id),
  day_of_week                  INTEGER,             -- 1-7
  meal_type                    VARCHAR(20),          -- desayuno|almuerzo|merienda|cena|snack
  recipe_id                    UUID REFERENCES recipes(id),
  custom_description            TEXT,
  calorias                     DECIMAL(7,2),
  proteina_g                   DECIMAL(6,2),
  grasas_g                     DECIMAL(6,2),
  carbohidratos_g                DECIMAL(6,2),
  created_at                    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- REGISTRO DIARIO DE COMIDAS (food log)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE food_log_entries (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL REFERENCES members(id),
  logged_at                    TIMESTAMP NOT NULL DEFAULT NOW(),
  meal_type                    VARCHAR(20),
  registration_method           VARCHAR(20),          -- photo|voice|search|barcode|favorite
  food_items_json               JSONB NOT NULL,       -- [{nombre, cantidad, unidad, kcal, macros}]
  total_kcal                    DECIMAL(7,2),
  total_proteina_g               DECIMAL(6,2),
  total_grasas_g                 DECIMAL(6,2),
  total_carbohidratos_g           DECIMAL(6,2),
  photo_url                     TEXT,
  ai_confidence_score            DECIMAL(3,2),        -- si vino del Food Scanner
  user_edited_after_ai           BOOLEAN DEFAULT FALSE,
  created_at                    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- RECETARIO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE recipes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                       UUID REFERENCES gyms(id),   -- null = receta del sistema
  nombre                       VARCHAR(200) NOT NULL,
  foto_url                      TEXT,
  tiempo_preparacion_min          INTEGER,
  dificultad                    VARCHAR(20),
  porciones_base                  INTEGER DEFAULT 1,
  ingredientes_json               JSONB NOT NULL,
  instrucciones                  TEXT NOT NULL,
  kcal_por_porcion                DECIMAL(7,2),
  proteina_g_por_porcion            DECIMAL(6,2),
  grasas_g_por_porcion              DECIMAL(6,2),
  carbohidratos_g_por_porcion        DECIMAL(6,2),
  fibra_g_por_porcion                DECIMAL(6,2),
  etiquetas_dieta                  TEXT[],          -- ['vegano','sin_gluten',...]
  costo_estimado                   VARCHAR(20),
  origen                          VARCHAR(30) DEFAULT 'sistema',
  aprobado                        BOOLEAN DEFAULT FALSE,
  created_at                      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- EXÁMENES DE LABORATORIO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE lab_results (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL REFERENCES members(id),
  uploaded_by                  UUID REFERENCES staff(id),
  document_url                  TEXT NOT NULL,
  lab_date                      DATE,
  extracted_markers_json          JSONB,      -- valores extraídos vía OCR/Claude Vision
  flagged_out_of_range_json       JSONB,      -- marcadores fuera de rango
  reviewed_by_nutritionist         BOOLEAN DEFAULT FALSE,
  reviewed_at                    TIMESTAMP,
  nutritionist_notes              TEXT,
  plan_adjusted_as_result          BOOLEAN DEFAULT FALSE,
  created_at                      TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ALERTAS DE PATRONES DE RIESGO (Sección 13.4)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE nutrition_risk_alerts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL REFERENCES members(id),
  gym_id                       UUID NOT NULL REFERENCES gyms(id),
  pattern_detected               VARCHAR(50),   -- restriccion_extrema|obsesion|atracon_purga
  detection_details_json          JSONB,
  severity                       VARCHAR(20) DEFAULT 'atencion',
  auto_suggestions_paused          BOOLEAN DEFAULT TRUE,
  notified_to_staff_id             UUID REFERENCES staff(id),
  reviewed                       BOOLEAN DEFAULT FALSE,
  reviewed_at                    TIMESTAMP,
  resolution_notes                TEXT,
  created_at                      TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CHECKLIST DE CONFIGURACIÓN

```
CONFIGURACIÓN INICIAL DEL MÓDULO:
□ Nutricionista(s) del gym registrados con rol y permisos correctos
□ Plantillas de plan base (Sección 5.2) cargadas y revisadas
□ Base de datos de alimentos conectada (Open Food Facts + USDA)
□ Recetario inicial con mínimo 30 recetas locales curadas
□ Integración de Google Vision + Claude Vision para Food Scanner
  probada con casos reales de comida salvadoreña/centroamericana
□ Protocolo de alertas de riesgo alimentario (Sección 13.4)
  revisado y aprobado por el nutricionista responsable
□ System prompt de ARIA-Nutrición cargado con el contexto del gym
□ Flujo de exámenes de laboratorio probado end-to-end
□ Integración con Marketplace para sugerencias de suplementos
  y lista de compras

VALIDACIÓN CON EL GYM PILOTO:
□ Al menos 1 nutricionista certificado ha revisado y aprobado
  manualmente 10 planes generados por el Co-Piloto IA antes de
  confiar en la generación asistida para el resto de clientes
□ Feedback de 5-10 miembros piloto sobre el Food Scanner recopilado
□ Verificar que ninguna alerta de riesgo alimentario fue generada
  incorrectamente (falsos positivos) revisando los primeros casos
  manualmente con el nutricionista
```

---

_Documento generado: Junio 2026_
_Versión: 1.0_
_Módulo: GYM-MOD-NUTRI_
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_
_Próxima revisión: Septiembre 2026_
