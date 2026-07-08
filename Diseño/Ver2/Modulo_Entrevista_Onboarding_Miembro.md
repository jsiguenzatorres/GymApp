# 📋 MÓDULO ENTREVISTA INICIAL DEL MIEMBRO

## Evaluación de Objetivos, Planificación & Guía Nutricional — Onboarding Inteligente

### App Integral de Gimnasio de Élite — Documento de Diseño Detallado

### Versión 1.0 · Julio 2026

---

> **Código del Módulo:** `GYM-FEAT-ONBOARDING`
> **Módulos relacionados:** Workout Builder (MOD-WKT), Nutrición (MOD-NUTRI), CRM/ARIA (MOD-CRM), Membresías (MOD-MEM)
> **Principio rector:** _"La primera entrevista determina si el plan de entrenamiento le sirve a esa persona específica, o si es una plantilla genérica con su nombre encima."_

---

## 📋 TABLA DE CONTENIDO

1. [Visión General & Por Qué Esto Importa](#1-visión-general--por-qué-esto-importa)
2. [Arquitectura de la Entrevista — Los 7 Bloques](#2-arquitectura-de-la-entrevista--los-7-bloques)
3. [Bloque 1 — Selección de Objetivo Principal](#3-bloque-1--selección-de-objetivo-principal)
4. [Bloque 2 — Estilo de Planificación del Entrenamiento](#4-bloque-2--estilo-de-planificación-del-entrenamiento)
5. [Bloque 3 — Datos Biométricos & Antropométricos](#5-bloque-3--datos-biométricos--antropométricos)
6. [Bloque 4 — Historial de Salud & Seguridad (PAR-Q+)](#6-bloque-4--historial-de-salud--seguridad-par-q)
7. [Bloque 5 — Historial & Experiencia de Entrenamiento](#7-bloque-5--historial--experiencia-de-entrenamiento)
8. [Bloque 6 — Estilo de Vida & Contexto Práctico](#8-bloque-6--estilo-de-vida--contexto-práctico)
9. [Bloque 7 — Evaluación Física Inicial (Presencial, con el Trainer)](#9-bloque-7--evaluación-física-inicial-presencial-con-el-trainer)
10. [Salida de la Entrevista — El Perfil que Recibe el Trainer](#10-salida-de-la-entrevista--el-perfil-que-recibe-el-trainer)
11. [Guía de Entrevista Nutricional](#11-guía-de-entrevista-nutricional)
12. [Módulo de Seguimiento — Evaluaciones Posteriores & Comparativa](#12-módulo-de-seguimiento--evaluaciones-posteriores--comparativa)
13. [Experiencia en la App — Pantallas Completas](#13-experiencia-en-la-app--pantallas-completas)
14. [Modelo de Datos Completo](#14-modelo-de-datos-completo)
15. [Integraciones del Módulo](#15-integraciones-del-módulo)

---

## 1. VISIÓN GENERAL & POR QUÉ ESTO IMPORTA

### 1.1 El Problema que Resuelve

La imagen de referencia que inspiró este módulo (una pantalla de selección de objetivo estilo Fitbod/Freeletics) señala algo importante: **la personalización empieza en la primera pregunta, no en el primer entrenamiento**. Un gimnasio que asigna el mismo plan genérico a todos sus miembros —sin importar si quieren ganar músculo, mejorar su composición corporal o prepararse para una carrera— está desperdiciando la razón principal por la que alguien paga una membresía con acompañamiento profesional en lugar de ver videos gratis en YouTube.

Esta entrevista inicial es el puente entre el Módulo de Membresías (que ya documenta el "Onboarding Digital del Nuevo Miembro" a nivel administrativo) y el Módulo Workout Builder (que necesita saber el objetivo para generar el plan). Es la pieza que faltaba entre ambos.

### 1.2 Principios de Diseño

| Principio                      | Implementación                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Progresiva, no abrumadora**  | Se divide en bloques cortos, no un formulario de 80 campos de una vez                                                                                 |
| **Con propósito visible**      | Cada pregunta explica brevemente para qué sirve, igual que el ejemplo de la imagen ("Entrenarás con..." explica la consecuencia de elegir esa opción) |
| **Segura por diseño**          | Preguntas de salud usan un instrumento validado (PAR-Q+), no inventado                                                                                |
| **Accionable para el trainer** | El resultado no es un PDF que nadie lee — es un perfil estructurado que alimenta directamente el Workout Builder                                      |
| **Neutral y funcional**        | Los datos corporales se tratan como información objetiva de referencia, nunca como juicio sobre la persona                                            |
| **Repetible**                  | El mismo instrumento se reutiliza en evaluaciones de seguimiento para comparar (Sección 12)                                                           |

---

## 2. ARQUITECTURA DE LA ENTREVISTA — LOS 7 BLOQUES

```yaml
La entrevista completa se divide en 7 bloques, diseñados para
completarse en dos momentos distintos:

  MOMENTO 1 — Autoservicio en la app (el miembro solo, 8-12 min):
    Bloque 1: Objetivo principal
    Bloque 2: Estilo de planificación del entrenamiento
    Bloque 3: Datos biométricos y antropométricos
    Bloque 4: Historial de salud y seguridad (PAR-Q+)
    Bloque 5: Historial y experiencia de entrenamiento
    Bloque 6: Estilo de vida y contexto práctico

  MOMENTO 2 — Presencial con el trainer (15-20 min, primera cita):
    Bloque 7: Evaluación física inicial (mediciones, tests)

Por qué esta división:
  Los bloques 1-6 son información que el miembro puede dar sin
  supervisión y AHORRA tiempo de trainer costoso llenándolos antes
  de pisar el gym. El Bloque 7 requiere presencia física (báscula,
  cinta métrica, tests de movimiento) y es también el momento
  donde se construye la relación humana con el trainer — no se
  reemplaza por un formulario.
```

---

## 3. BLOQUE 1 — SELECCIÓN DE OBJETIVO PRINCIPAL

### 3.1 Diseño de Pantalla (Inspirado en la Referencia Adjunta)

Manteniendo el mismo patrón visual que la imagen de referencia — ícono, título breve, y una frase que explica _qué implica_ elegir esa opción — pero ampliado con las categorías relevantes para un gimnasio integral (no solo fuerza):

```
¿CUÁL ES TU OBJETIVO PRINCIPAL?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💪  Aumentar masa muscular
    Entrenarás con volumen e intensidad progresiva,
    combinando ejercicios compuestos con trabajo
    localizado según el grupo muscular que lo necesite.

⚖️  Mejorar composición corporal
    Combinarás entrenamiento de fuerza con trabajo
    cardiovascular para favorecer cambios en tu
    composición corporal mientras preservas tu músculo.

🏋️  Aumentar fuerza máxima
    Priorizarás ejercicios compuestos con cargas altas
    y pocas repeticiones, maximizando tu capacidad de
    levantar más peso con seguridad.

🎯  Tonificar y recomponer
    Combinarás entrenamiento de resistencia tradicional
    con trabajo metabólico para optimizar tu composición
    corporal de forma equilibrada.

❤️  Salud general y bienestar
    Entrenarás para la salud a largo plazo, equilibrando
    movilidad, salud cardiovascular y fuerza funcional
    para sentirte mejor en tu día a día.

🏃  Rendimiento deportivo específico
    Desarrollarás cualidades físicas específicas para tu
    deporte o actividad (indícanos cuál en el siguiente paso).

🩺  Rehabilitación / retorno post-lesión
    Trabajaremos de forma progresiva y supervisada,
    priorizando la recuperación segura por encima de
    la intensidad. Este objetivo requiere aprobación
    de tu trainer antes de iniciar.

[Selecciona una opción para continuar]
```

```yaml
Nota de diseño importante:
  Cada tarjeta es de SELECCIÓN ÚNICA para el objetivo PRINCIPAL
  (evita planes contradictorios: no se puede maximizar fuerza
  pura y resistencia de maratón simultáneamente con la misma
  prioridad). Sin embargo, inmediatamente después se pregunta
  por un objetivo SECUNDARIO opcional, reconociendo que las
  personas reales rara vez tienen un solo interés:

  "¿Tienes algún objetivo secundario que también te importe?"
  (Selección única, opcional, mismas 7 opciones menos la ya elegida)

  Esto alimenta al Workout Builder para que el Co-Piloto IA
  balancee el plan (ej. objetivo principal "masa muscular" +
  secundario "salud general" → el plan prioriza hipertrofia pero
  incluye movilidad y trabajo cardiovascular ligero, en vez de
  ignorarlo por completo)
```

### 3.2 Objetivo Deportivo Específico (si aplica)

```yaml
Si el miembro eligió "Rendimiento deportivo específico":

  "¿Para qué deporte o actividad te preparas?"
  Campo de selección + texto libre:
    □ Fútbol  □ Baloncesto  □ Running/Maratón  □ Ciclismo
    □ Natación  □ Artes marciales/Boxeo  □ CrossFit/Competencia
    □ Tenis/Pádel  □ Escalada  □ Otro: ______

  "¿Tienes una fecha objetivo o evento próximo?"
  [Selector de fecha]  [No tengo fecha específica]

  Esto activa plantillas de periodización específicas para
  deporte, ya documentadas en el Módulo Workout Builder
  (Sección 5.1, categoría "Por Especialidad Deportiva")
```

---

## 4. BLOQUE 2 — ESTILO DE PLANIFICACIÓN DEL ENTRENAMIENTO

### 4.1 La Pregunta Central que Pediste

Esta es la pregunta que define **quién controla el plan** — respondiendo directamente a tu pedido de "cómo se planificaron los entrenamientos (planifica todo por mi, planificaré todos mis entrenamientos, híbrido, etc.)":

```
¿CÓMO PREFIERES QUE FUNCIONE TU ENTRENAMIENTO?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧑‍🏫  Guiado completamente por mi trainer
     Tu trainer diseña, programa y ajusta tu plan completo.
     Tú solo te presentas y ejecutas — ideal si prefieres
     cero fricción de decisiones y máxima supervisión experta.

🧑‍💻  Yo planifico todo por mi cuenta
     Tienes acceso completo al Workout Builder para crear
     tus propias rutinas, con ZEUS disponible para dudas
     técnicas. Ideal si ya tienes experiencia y prefieres
     autonomía total.

🤝  Híbrido — mi trainer diseña, yo ajusto sobre la marcha
     Tu trainer crea el plan base y la progresión general,
     pero tú puedes sustituir ejercicios, ajustar el día que
     entrenas, o modificar detalles según cómo te sientas
     ese día — dentro de los límites que tu trainer definió.

🤖  Guiado por IA con supervisión de mi trainer
     ZEUS genera y ajusta tu plan basándose en tu progreso
     real, tu trainer lo revisa y aprueba periódicamente.
     Ideal si buscas adaptación constante con respaldo
     profesional de fondo.

[Selecciona una opción]

💡 Puedes cambiar esta preferencia en cualquier momento
   desde tu perfil.
```

### 4.2 Cómo Esta Elección Cambia el Sistema

```yaml
Esta respuesta se conecta directamente con el Módulo Workout
Builder ya documentado y determina permisos y flujos:

  "Guiado completamente por mi trainer":
    allow_member_view_ahead = false (solo ve el día actual,
    ya definido como opción en Módulo Workout Builder, Sección 10.1)
    El miembro NO tiene acceso al botón "Cambiar ejercicio" sin
    aprobación — cualquier sustitución la pide vía ARIA y el
    trainer la aprueba
    El plan se genera 100% desde el panel del trainer

  "Yo planifico todo por mi cuenta":
    El miembro obtiene acceso al Workout Builder en modo
    simplificado para uso personal (mismo motor, interfaz
    adaptada para no-profesional)
    Puede usar el Co-Piloto IA directamente sin intermediación
    del trainer (con las mismas barandillas de seguridad ya
    documentadas: advertencias de volumen excesivo, restricciones
    médicas, etc.)
    El trainer del gym NO recibe notificaciones de cada cambio
    que haga (a menos que actualice una restricción médica)

  "Híbrido":
    El trainer diseña el plan base con el Workout Builder normal
    El miembro SÍ tiene el botón de "Sustitución Inteligente de
    Ejercicios" habilitado (ya documentado en Workout Builder,
    Sección 14) sin requerir aprobación previa
    El trainer recibe un resumen semanal de qué sustituciones hizo
    el miembro (no en tiempo real, para no generar ruido), con
    alerta solo si el mismo ejercicio se evita 3+ veces (patrón
    ya definido en Sección 14.2 del Workout Builder)

  "Guiado por IA con supervisión":
    ZEUS ajusta cargas y progresión automáticamente basándose en
    RPE reportado y rendimiento real (usando la lógica de
    autorregulación ya documentada, Módulo Workout Builder,
    Sección 8.2)
    El trainer recibe el plan generado para aprobación antes de
    cada nuevo bloque/mesociclo (no revisa sesión por sesión)
```

---

## 5. BLOQUE 3 — DATOS BIOMÉTRICOS & ANTROPOMÉTRICOS

### 5.1 Datos Base

```yaml
DATOS OBLIGATORIOS:
  Fecha de nacimiento           → calcula edad automáticamente
  Sexo biológico                → necesario para fórmulas de TMB
                                   (Módulo Nutrición, Sección 4.1)
                                   y rangos de referencia de fuerza
  Estatura                      → cm (o selector pies/pulgadas)
  Peso actual                   → kg (o lb), con nota de que se
                                   puede actualizar en cualquier
                                   momento, no es un dato fijo

DATOS OPCIONALES (mejoran la precisión, se piden sin presión):
  Nivel de actividad física diaria fuera del gym (sedentario,
  trabajo de pie, trabajo físico, etc.) → factor de actividad
  para el cálculo de TDEE

Cómo se presenta (tono neutro, funcional, sin comentarios sobre
apariencia):
  "Estos datos nos ayudan a calcular tus necesidades energéticas
   y a establecer una línea base objetiva para medir tu progreso
   con el tiempo. Puedes actualizarlos cuando quieras."

Nota de implementación: estos campos son puramente informativos
y de referencia — el sistema nunca los presenta junto a
comparaciones sociales, rankings públicos, ni lenguaje evaluativo.
Son datos de trabajo para el trainer y el motor de cálculo
nutricional, no una calificación de la persona.
```

### 5.2 Composición Corporal (Si el Gym Tiene el Equipo)

```yaml
Si el gym cuenta con báscula de bioimpedancia u otro método:
  Estos datos se capturan en el Bloque 7 (presencial), NO se
  le pide al miembro que los autoreporte de memoria — son
  mediciones, no un dato que la persona simplemente "sabe"

  % de grasa corporal, masa muscular, agua corporal, metabolismo
  basal estimado — todos estos alimentan directamente el motor
  de cálculo nutricional (fórmula Katch-McArdle, ya documentada
  en Módulo Nutrición, Sección 4.1) y el perfil físico del
  Workout Builder (Sección 4.2 de ese documento)
```

---

## 6. BLOQUE 4 — HISTORIAL DE SALUD & SEGURIDAD (PAR-Q+)

### 6.1 Por Qué un Instrumento Validado y No Preguntas Improvisadas

La investigación de la industria es consistente: el estándar recomendado para el cribado de salud pre-ejercicio es el **PAR-Q+** (Physical Activity Readiness Questionnaire), no un cuestionario inventado. Esto ya se mencionaba como parte de la "Declaración de Salud" en el Módulo de Membresías original (Sección 5.3) — este bloque lo formaliza como parte estructurada de la entrevista.

```yaml
PREGUNTAS DEL PAR-Q+ (adaptadas, formato sí/no):

  1. ¿Un médico te ha dicho alguna vez que tienes una condición
     cardíaca y que solo deberías realizar actividad física
     recomendada por un médico?
  2. ¿Sientes dolor en el pecho en reposo, durante tus actividades
     diarias, o al hacer ejercicio?
  3. ¿Has perdido el equilibrio debido a mareos o has perdido la
     consciencia en los últimos 12 meses?
  4. ¿Te han diagnosticado alguna otra condición crónica (además
     de las mencionadas)? (diabetes, asma, presión arterial alta,
     condiciones renales, etc.)
  5. ¿Actualmente tomas medicamentos recetados para alguna
     condición crónica?
  6. ¿Tienes actualmente (o has tenido recientemente) un problema
     óseo, articular o de tejido blando que podría empeorar con
     la actividad física? (espalda, rodilla, cadera, hombro, etc.)
  7. ¿Un médico te ha dicho que debes hacer actividad física
     únicamente bajo supervisión médica?

RESULTADO:
  Si TODAS las respuestas son "No" → el miembro puede iniciar
  actividad física general sin restricciones adicionales

  Si CUALQUIER respuesta es "Sí" → el sistema no bloquea el
  proceso, pero:
    1. Marca el perfil con requiere_evaluacion_medica_previa = true
    2. Genera un resumen para el trainer con las respuestas
       específicas marcadas como "Sí" (nunca interpretaciones o
       diagnósticos automáticos — solo el dato reportado)
    3. Muestra al miembro: "Gracias por compartir esto. Es
       importante que tu trainer conozca esta información antes
       de diseñar tu plan. Recomendamos que consultes con tu
       médico si no lo has hecho recientemente, especialmente
       antes de iniciar actividad de alta intensidad."
    4. El trainer NO puede aprobar un plan de alta intensidad
       para este miembro sin marcar explícitamente que revisó
       la información y decidió cómo proceder (mismo patrón de
       "aprobación requerida" ya usado en otras partes del sistema)
```

### 6.2 Preguntas Adicionales de Contexto de Salud (Complementan el PAR-Q+)

```yaml
Estas preguntas no reemplazan el PAR-Q+, lo complementan con
contexto útil para el diseño del plan (no son de cribado médico,
son de personalización):

  Lesiones previas o actuales (campo libre + selector de zona
  corporal): "Cuéntanos sobre cualquier lesión pasada o actual
  que debamos tener en cuenta" — alimenta directamente el campo
  de "restricciones médicas" ya usado por ZEUS en el Workout
  Builder para filtrar ejercicios contraindicados (Sección 9,
  "restricciones médicas" en el contexto de ZEUS)

  Cirugías relevantes (ortopédicas, abdominales, cardíacas)

  Calidad de sueño habitual (escala simple: mala / regular /
  buena) — relevante para el Recovery Score si el miembro conecta
  un wearable después (Módulo Workout Builder, Sección 15.2)

  Nivel de estrés percibido (escala simple) — contexto útil para
  ARIA al calibrar el tono de sus mensajes motivacionales
```

---

## 7. BLOQUE 5 — HISTORIAL & EXPERIENCIA DE ENTRENAMIENTO

```yaml
PREGUNTAS:

  "¿Cuánta experiencia tienes entrenando con pesas/en gimnasio?"
    □ Ninguna, soy completamente nuevo/a
    □ Menos de 6 meses
    □ 6 meses - 2 años
    □ 2-5 años
    □ Más de 5 años

  "¿Has entrenado en los últimos 3 meses?"
    □ Sí, de forma regular   □ Sí, esporádicamente   □ No

  "¿Con qué tipo de entrenamiento tienes más experiencia?"
    (selección múltiple)
    □ Pesas/Máquinas  □ Peso corporal  □ Cardio  □ Clases grupales
    □ CrossFit  □ Deportes de equipo  □ Yoga/Pilates  □ Ninguno

  "¿Cuántos días a la semana te gustaría entrenar?"
    ○ 2 días  ○ 3 días  ○ 4 días  ○ 5 días  ○ 6+ días
    (esto alimenta directamente la "duración_semanas" y
    "dias_por_semana" del plan en el Workout Builder, Sección 8.1)

  "¿Cuánto tiempo tienes disponible por sesión?"
    ○ 30 min  ○ 45 min  ○ 60 min  ○ 90+ min

  "¿Qué equipamiento tienes disponible?" (si entrena también
  fuera del gym, ej. en casa o viajando)
    □ Gimnasio completo  □ Mancuernas en casa  □ Bandas elásticas
    □ Solo peso corporal  □ Kit básico (barra + discos)

Este bloque es lo que determina el NIVEL inicial (Principiante/
Intermedio/Avanzado) que ya se usa como campo obligatorio en la
ficha de ejercicio y de plan (Módulo Workout Builder, Sección 2.2
y 5.2) — en lugar de que el trainer lo adivine en la primera
sesión, ya llega con una hipótesis de partida que luego se
confirma o ajusta en la evaluación física presencial (Bloque 7).
```

---

## 8. BLOQUE 6 — ESTILO DE VIDA & CONTEXTO PRÁCTICO

```yaml
Estas preguntas identifican barreras reales, siguiendo la buena
práctica documentada en la investigación: entender qué obstáculos
ha enfrentado el cliente en el pasado ayuda a anticipar dificultades
y brindar apoyo personalizado desde el primer día.

  "¿Qué te ha impedido lograr tus objetivos de fitness en el
  pasado?" (selección múltiple, campo libre disponible)
    □ Falta de tiempo  □ Falta de motivación/consistencia
    □ No saber qué hacer  □ Lesiones  □ Falta de resultados visibles
    □ Costo  □ Nunca lo había intentado en serio  □ Otro: ___

  "¿Qué días y horarios sueles tener disponibles para entrenar?"
    (selector de franjas horarias por día — alimenta el Módulo
    de Scheduling para sugerir horarios de trainer/clases que
    coincidan)

  "¿Prefieres entrenar solo/a, con un compañero, o en grupo?"
    Esto conecta con el Buddy Matching ya documentado en el
    Módulo de Gamificación (Sección 10)

  "¿Cómo prefieres recibir seguimiento y motivación?"
    □ Mensajes frecuentes de ánimo  □ Solo lo esencial, sin
    saturarme  □ Retos y competencia  □ Datos y métricas, poco
    texto motivacional
    (esto calibra el tono y frecuencia de ARIA para este miembro
    específico, personalizando la relación desde el día 1)
```

---

## 9. BLOQUE 7 — EVALUACIÓN FÍSICA INICIAL (PRESENCIAL, CON EL TRAINER)

### 9.1 Por Qué Este Bloque Requiere al Trainer

La evidencia de la industria es clara en que la evaluación física real debe adaptarse a la capacidad actual de la persona — pruebas simples de movimiento para principiantes, no pruebas de fuerza pesada que puedan lastimar o desanimar. Esto requiere el juicio de un profesional presente, no un formulario automático.

### 9.2 Estructura de la Evaluación Presencial

Esta sección **amplía y formaliza** la "Evaluación Física Inicial" ya esbozada en el Módulo de Membresías (Sección 4.2), integrándola directamente con el objetivo elegido en el Bloque 1:

```yaml
COMPONENTE A — Mediciones biométricas (ya documentado, se
reconfirma aquí como parte del flujo):
  Peso, % grasa corporal (bioimpedancia), masa muscular,
  circunferencias (cintura, cadera, pecho, brazo, muslo,
  pantorrilla), fotos de progreso (frente/perfil/dorso, con
  consentimiento explícito ya documentado)

COMPONENTE B — Screening de movimiento (SIEMPRE, sin importar
el objetivo — es lo que la evidencia llama "chequeos simples de
movimiento" apropiados para cualquier nivel):
  Sentadilla corporal (profundidad, alineación de rodillas,
  compensaciones visibles)
  Bisagra de cadera (patrón básico de peso muerto sin carga)
  Movilidad de hombro (elevación completa, rotación)
  Plancha (tiempo sostenido con buena forma, no al fallo)
  El trainer registra observaciones cualitativas, no solo
  números — esto alimenta directamente las "restricciones" y
  "modificaciones" que el Workout Builder ya usa para filtrar
  ejercicios (Sección 2.2 de ese módulo)

COMPONENTE C — Tests específicos SEGÚN el objetivo elegido en
el Bloque 1 (aquí es donde la entrevista y la evaluación física
se conectan directamente):

  Si el objetivo es FUERZA o MASA MUSCULAR:
    Test de fuerza submáxima en 2-3 ejercicios compuestos
    (ej. estimación de 1RM vía tablas de reps-a-fallo con carga
    submáxima, nunca un 1RM real en la primera sesión sin
    preparación)

  Si el objetivo es COMPOSICIÓN CORPORAL:
    Test de capacidad cardiovascular básica (ej. test de escalón
    3 minutos con FC de recuperación, ya mencionado en el Módulo
    de Membresías, Sección 4.2)
    Circunferencias con mayor énfasis para tracking futuro

  Si el objetivo es SALUD GENERAL:
    Combinación ligera de A y B, sin tests de máximo esfuerzo,
    priorizando movilidad y capacidad funcional cotidiana

  Si el objetivo es RENDIMIENTO DEPORTIVO:
    Tests específicos de la disciplina (ej. salto vertical para
    baloncesto, test de velocidad para fútbol) — el trainer
    selecciona de un catálogo según el deporte indicado en el
    Bloque 1.2

  Si el objetivo es REHABILITACIÓN:
    Este componente lo diseña completamente el trainer o un
    fisioterapeuta según el caso — el sistema no prescribe
    tests estandarizados aquí, solo documenta lo que el
    profesional decida evaluar

COMPONENTE D — Conversación de objetivos SMART (cierre de la
evaluación presencial):
  El trainer y el miembro traducen el objetivo general elegido
  en el Bloque 1 a una meta específica y medible:
  "Aumentar masa muscular" → "Ganar masa magra medible en 4 meses"
  "Mejorar composición corporal" → "Mejorar mi composición
  corporal en 3 meses manteniendo mi fuerza actual"
  Esta meta específica se guarda como el "objetivo_smart" del
  perfil y es lo que luego se usa para medir éxito en las
  evaluaciones de seguimiento (Sección 12)
```

---

## 10. SALIDA DE LA ENTREVISTA — EL PERFIL QUE RECIBE EL TRAINER

### 10.1 Resumen Ejecutivo para el Trainer

Al completar los 7 bloques, el sistema genera automáticamente una ficha de una sola pantalla — no un formulario largo que el trainer tenga que leer entero antes de cada sesión:

```
PERFIL DE ONBOARDING — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 OBJETIVO: Mejorar composición corporal (secundario: Salud general)
📋 META SMART: Mejorar composición corporal en 3 meses, manteniendo fuerza
🧑‍🏫 MODO DE PLANIFICACIÓN: Híbrido (trainer diseña, ella ajusta)

⚠️ ALERTAS DE SALUD:
   PAR-Q+: Reportó presión arterial alta (medicada) → revisar
   antes de prescribir alta intensidad
   Lesión reportada: molestia ocasional en rodilla derecha

📊 NIVEL ESTIMADO: Intermedio (2 años de experiencia previa,
   inactiva últimos 4 meses)
📅 DISPONIBILIDAD: 4 días/semana, sesiones de 45 min, mañanas

🏋️ EVALUACIÓN FÍSICA (completada 15/06):
   Datos completos disponibles en su ficha
   Screening de movimiento: buena sentadilla, ligera compensación
   en rodilla derecha al descender — evitar sentadilla profunda
   con carga alta inicialmente

💬 PREFERENCIAS DE COMUNICACIÓN: Mensajes frecuentes de ánimo,
   le gustan los retos

📝 BARRERAS PREVIAS REPORTADAS: Falta de tiempo, no saber qué hacer

[Ver entrevista completa]  [Ir al Workout Builder para esta cliente]
```

### 10.2 Cómo Esto Pre-Llena el Workout Builder

```yaml
Al hacer clic en "Ir al Workout Builder para esta cliente", el
trainer llega al constructor (ya documentado en el Módulo Workout
Builder, Sección 7-8) con estos campos YA completados desde la
entrevista, en lugar de partir de cero:

  Objetivo del plan → heredado del Bloque 1
  Nivel → heredado del Bloque 5 + confirmado en Bloque 7
  Días por semana → heredado del Bloque 5
  Duración de sesión → heredado del Bloque 5
  Restricciones a excluir automáticamente del catálogo de
  ejercicios → heredadas de Bloques 4 y 7 (ej. el sistema ya
  filtra sentadilla profunda con carga alta para María)
  Modo de permisos (cuánto puede ajustar ella misma) → heredado
  del Bloque 2

  Si el trainer usa el Co-Piloto IA (Módulo Workout Builder,
  Sección 9), el prompt inicial ya viene pre-cargado con este
  contexto, ahorrando al trainer tener que describirlo manualmente
  cada vez.
```

---

## 11. GUÍA DE ENTREVISTA NUTRICIONAL

### 11.1 Relación con el Onboarding General

Esta guía es la versión especializada para cuando el miembro activa el Módulo de Nutrición (ya documentado, Sección 3 — "Perfil Nutricional del Miembro"). Aquí se detalla el **formato de entrevista** (cómo se hacen las preguntas, en qué orden, con qué tono) que complementa los _campos de datos_ ya definidos en ese módulo.

### 11.2 Estructura de la Entrevista Nutricional (6 Momentos)

```yaml
MOMENTO 1 — Encuadre (antes de cualquier pregunta):
  Mensaje de apertura, ya sea en texto en la app o dicho por el
  nutricionista en persona:

  "Antes de armar tu plan, quiero conocerte un poco. No hay
   respuestas correctas o incorrectas — entre más honesta seas,
   mejor podremos diseñar algo que realmente puedas sostener,
   no un plan perfecto en el papel que nadie sigue en la
   práctica."

  Este encuadre importa: reduce la presión de "dar la respuesta
  que se espera" y abre espacio para honestidad sobre hábitos
  reales.

MOMENTO 2 — Relación actual con la comida y objetivo (abierto,
sin números todavía):
  "¿Cómo describirías tu relación con la comida hoy en día?"
  "¿Qué te gustaría que fuera diferente?"
  "¿Has seguido planes de alimentación antes? ¿Qué funcionó y
   qué no?"

  Estas preguntas abiertas, antes de cualquier dato numérico,
  permiten detectar tempranamente si conviene un enfoque distinto
  (ver Momento 6)

MOMENTO 3 — Objetivo nutricional específico:
  Mismo campo ya definido en el Módulo Nutrición (Sección 3.1):
  pérdida de grasa / ganancia muscular / recomposición /
  mantenimiento / rendimiento / objetivo clínico

MOMENTO 4 — Preferencias, restricciones y contexto práctico:
  Los campos ya definidos en el Módulo Nutrición (Sección 3.1):
  dieta base, alergias, intolerancias, alimentos que le gustan/
  no le gustan, presupuesto, tiempo de cocina, comidas por día

MOMENTO 5 — Contexto de estilo de vida relevante para nutrición:
  "¿Cómo es un día típico de comidas para ti ahora?" (abierto,
  deja que la persona describa su patrón real en sus palabras,
  no un formulario de check-boxes que fuerce categorías)
  "¿Comes fuera de casa frecuentemente? ¿En qué contexto?"
  "¿Cómo es tu relación con el alcohol/bebidas?" (información
  relevante para el plan, preguntada sin juicio)

MOMENTO 6 — Cierre de acompañamiento (el más importante):
  Antes de generar cualquier plan con enfoque calórico, se
  pregunta explícitamente, con calidez y sin que suene a alarma:

  "¿Hay algo sobre la comida o tu cuerpo que te gustaría que
   tu nutricionista tenga en cuenta con especial cuidado?"

  Esta pregunta se hace UNA vez, de forma abierta, y sin importar
  la respuesta, el tono siguiente es el mismo: cálido y sin
  alarma. Da espacio a que la persona comparta lo que considere
  relevante, sin que el sistema tenga que indagar más allá de
  lo que ella misma decida compartir.
```

### 11.3 Cuando la Persona Comparte Algo que Requiere Cuidado Especial

Esta sección formaliza y extiende lo ya establecido en el Módulo de Nutrición (Sección 13.4), aplicándolo específicamente al momento de la entrevista inicial:

```yaml
Si el miembro comparte, en el Momento 6 o en cualquier otro punto
de la entrevista, algo que sugiera que su relación con la comida
o su cuerpo necesita un acompañamiento particularmente cuidadoso:

  LO QUE EL SISTEMA HACE:
    El plan nutricional se construye en conversación directa con
    el nutricionista humano del gym, presencial o por videollamada,
    priorizando esa charla por encima de activar de inmediato
    cualquier registro de comidas o seguimiento numérico
    ARIA-Nutrición (Módulo Nutrición, Sección 13) mantiene un
    enfoque general de bienestar en sus mensajes para este
    miembro hasta que el nutricionista defina el enfoque adecuado

  LO QUE EL SISTEMA NUNCA HACE:
    No le pone ninguna etiqueta a la persona en ningún lugar del
    sistema visible para ella
    No profundiza ni pide más detalles en el momento — lo que la
    persona decidió compartir es información suficiente para que
    el nutricionista tome la conversación desde ahí
    No hace comentarios sobre su cuerpo o su alimentación en
    ningún punto posterior

  ESTE ENFOQUE ES CONSISTENTE con el resto de la plataforma:
    el sistema puede ser un excelente organizador de información
    y facilitador de la relación con el profesional humano, pero
    el acompañamiento real en estos temas siempre lo lleva una
    persona, no la tecnología.
```

### 11.4 Guía de Tono para el Nutricionista Humano (Material de Apoyo)

```yaml
Adicional a las preguntas mismas, se entrega al nutricionista
del gym una breve guía de buenas prácticas de entrevista,
como material de referencia (no como script rígido):

  "Preguntas abiertas antes que cerradas: deja que la persona
   describa su situación en sus propias palabras antes de pedirle
   que elija de una lista."

  "Evita comentar sobre la apariencia física de la persona,
   incluso con intención positiva — frases bien intencionadas
   pueden interpretarse de formas que no esperas."

  "No es necesario centrar la conversación inicial en números si
   la persona no los trae primero — hay tiempo de sobra para eso
   una vez establecida la relación de confianza."

  "Si algo en la conversación te genera duda sobre cuál es el
   mejor enfoque para esa persona, no dudes en simplemente
   agendar una segunda conversación antes de decidir — no hay
   prisa por completar el plan en la primera sesión."
```

---

## 12. MÓDULO DE SEGUIMIENTO — EVALUACIONES POSTERIORES & COMPARATIVA

### 12.1 Frecuencia de Reevaluación

La buena práctica documentada en la industria es reevaluar cada 4-8 semanas según el objetivo del cliente, repitiendo los tests clave de la evaluación inicial para tener comparaciones objetivas:

```yaml
Frecuencia sugerida por el sistema (ajustable por el trainer):
  Objetivo de composición corporal: cada 4 semanas
  Objetivo de fuerza / masa muscular: cada 6-8 semanas
  Objetivo de salud general: cada 8-12 semanas
  Rehabilitación: según criterio del profesional a cargo

El sistema programa automáticamente un recordatorio de
"evaluación de seguimiento pendiente" en el calendario del
trainer y del miembro (usando el mismo motor de Scheduling ya
documentado) cuando se acerca la fecha sugerida.
```

### 12.2 Estructura de la Evaluación de Seguimiento

```yaml
La evaluación de seguimiento REUTILIZA la misma estructura del
Bloque 7 (Sección 9), no un instrumento distinto — esto es lo
que permite la comparación directa:

  Se repiten EXACTAMENTE los mismos componentes:
    Mediciones biométricas (peso, % grasa, circunferencias, fotos)
    Screening de movimiento (¿mejoró la compensación de rodilla
    de María? ¿ya no aparece?)
    Los mismos tests específicos del objetivo (mismo protocolo de
    fuerza submáxima, mismo test cardiovascular, etc.)

  Además, se agregan 2 preguntas cualitativas nuevas en cada
  seguimiento:
    "¿Qué tan alineado sientes que está tu progreso con tu
     objetivo original?" (escala 1-5)
    "¿Necesitas ajustar tu objetivo o tu meta original?"
    (permite reconocer que los objetivos evolucionan legítimamente
    con el tiempo, no fuerza a la persona a seguir una meta que
    ya no le hace sentido)
```

### 12.3 Vista Comparativa — El Corazón de Esta Funcionalidad

```
MI PROGRESO — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  [Evaluación Inicial] [Semana 4] [Semana 8] [Semana 12 ●]

COMPARATIVA COMPLETA:
  El trainer ve lado a lado todas las métricas registradas en
  cada evaluación (composición corporal, circunferencias,
  capacidad cardiovascular, fuerza), con la evolución entre
  cada punto de control claramente visible.

SCREENING DE MOVIMIENTO — Evolución:
  Compensación de rodilla derecha en sentadilla:
    Inicial: Presente, moderada
    Semana 8: Presente, leve
    Semana 12: No observable ✅
  → El trainer ya puede progresar a sentadilla con carga completa

TESTS ESPECÍFICOS (según objetivo — composición corporal):
  Capacidad cardiovascular (FC de recuperación tras test de
  escalón): mejora sostenida en cada evaluación ✅

PROGRESO HACIA LA META:
  "Mejorar composición corporal en 3 meses, manteniendo fuerza"
  ████████████████████████████████░░  Bien encaminada hacia el
  objetivo, con la fuerza mantenida según los tests de control ✅

FOTOS DE PROGRESO (con consentimiento del miembro):
  [Comparativa lado a lado: Inicial | Semana 12]

NOTA DEL TRAINER:
  "María, tu progreso está prácticamente en línea con lo que
   planteamos. La rodilla ya no muestra compensación, así que
   desde la próxima semana progresamos a sentadilla con carga
   completa. ¡Excelente trabajo! — Carlos"

[Reevaluar meta]  [Programar próxima evaluación]
[Exportar reporte PDF]  [Compartir con mi nutricionista]
```

```yaml
Nota de diseño: las métricas de composición corporal siempre se
muestran junto con indicadores funcionales (fuerza mantenida,
mejora cardiovascular, movimiento sin compensaciones) — nunca de
forma aislada como si el peso o el porcentaje de grasa fueran el
único indicador de éxito. Esto refuerza que el progreso real es
multidimensional, y le da al trainer un cuadro completo en lugar
de una sola cifra descontextualizada.
```

### 12.4 Alertas Automáticas de Estancamiento o Retroceso

```yaml
El sistema compara automáticamente cada nueva evaluación contra
la anterior y contra la meta original, generando alertas al
trainer (nunca al miembro directamente, para evitar ansiedad
por un dato aislado sin contexto profesional):

  Progreso mejor de lo esperado:
    "María está superando el ritmo esperado hacia su meta.
     Considera si la meta original sigue siendo relevante o si
     conviene establecer un nuevo objetivo una vez alcanzado el
     actual."

  Progreso estancado (2+ evaluaciones sin cambio significativo):
    "El progreso de María se ha estancado en las últimas 2
     evaluaciones. Esto puede deberse a adherencia, necesidad de
     ajustar el plan, factores de vida, o que el cuerpo se adaptó
     al estímulo actual. Considera revisar con ella en la próxima
     sesión."
    (Nunca se asume automáticamente que el estancamiento es "culpa"
    del miembro — se presenta como algo a explorar en conversación)

  Cambios que ameritan atención profesional:
    Si una métrica cambia de forma abrupta o inconsistente con el
    patrón esperado (ej. un cambio de peso muy rápido no alineado
    con el plan, o pérdida de fuerza significativa sin causa
    aparente), el sistema simplemente marca el dato para
    conversación humana — no interpreta ni alarma, solo señala
    que hay algo digno de revisar en persona.
```

---

## 13. EXPERIENCIA EN LA APP — PANTALLAS COMPLETAS

### 13.1 Progreso de la Entrevista (Autoservicio)

```
COMPLETA TU PERFIL — Paso 3 de 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

●━━━━●━━━━●━━━━○━━━━○━━━━○
Objetivo  Plan   Datos  Salud  Historial  Estilo

[Contenido del bloque actual]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[← Atrás]                              [Continuar →]

💡 Puedes guardar y continuar después — tu progreso
   se guarda automáticamente.
```

### 13.2 Pantalla Final de Confirmación

```
¡LISTO, MARÍA! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ya tenemos lo que necesitamos para empezar a diseñar
tu plan.

RESUMEN:
🎯 Objetivo: Mejorar composición corporal
🧑‍🏫 Plan: Híbrido — Carlos diseña, tú ajustas
📅 4 días/semana, sesiones de 45 min

PRÓXIMO PASO:
Tu evaluación física con Carlos está agendada para
el miércoles 17 de junio a las 9:00am. Ahí
completaremos las mediciones y definiremos tu meta
específica juntos.

[Ver mi cita]  [Ir a mi perfil]
```

---

## 14. MODELO DE DATOS COMPLETO

```sql
-- ─────────────────────────────────────────────────────────────
-- PERFIL DE ONBOARDING DEL MIEMBRO (Bloques 1-6, autoservicio)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_onboarding_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL UNIQUE REFERENCES members(id),

  -- Bloque 1: Objetivo
  objetivo_principal          VARCHAR(50) NOT NULL,
  objetivo_secundario          VARCHAR(50),
  deporte_especifico            VARCHAR(50),
  fecha_evento_objetivo          DATE,

  -- Bloque 2: Estilo de planificación
  modo_planificacion            VARCHAR(30) NOT NULL,
  -- guiado_trainer | autogestionado | hibrido | ia_supervisada

  -- Bloque 3: Biométricos (autoreportados, se confirman en Bloque 7)
  fecha_nacimiento              DATE,
  sexo_biologico                VARCHAR(20),
  estatura_cm                  DECIMAL(5,2),
  peso_autoreportado_kg          DECIMAL(5,2),
  nivel_actividad_diaria          VARCHAR(30),

  -- Bloque 4: PAR-Q+ (JSONB con las 7 respuestas)
  parq_respuestas_json           JSONB NOT NULL,
  requiere_evaluacion_medica_previa BOOLEAN DEFAULT FALSE,
  lesiones_reportadas             TEXT,
  cirugias_relevantes             TEXT,
  calidad_sueno                  VARCHAR(20),
  nivel_estres                   VARCHAR(20),

  -- Bloque 5: Historial de entrenamiento
  experiencia_entrenamiento        VARCHAR(30),
  activo_ultimos_3_meses           VARCHAR(30),
  tipos_entrenamiento_previo        TEXT[],
  dias_por_semana_deseados          INTEGER,
  duracion_sesion_deseada_min        INTEGER,
  equipamiento_disponible_externo     TEXT[],
  nivel_estimado                   VARCHAR(20),
  -- calculado a partir de experiencia + actividad reciente

  -- Bloque 6: Estilo de vida
  barreras_previas                 TEXT[],
  disponibilidad_horaria_json         JSONB,
  preferencia_social                 VARCHAR(20),
  -- solo | pareja | grupo
  preferencia_comunicacion             VARCHAR(30),

  -- Estado del proceso
  bloques_completados                INTEGER DEFAULT 0,
  completado_en                     TIMESTAMP,
  created_at                       TIMESTAMP DEFAULT NOW(),
  updated_at                       TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- EVALUACIONES FÍSICAS (Bloque 7 inicial + seguimientos,
-- MISMA tabla para permitir comparación directa)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE physical_assessments (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL REFERENCES members(id),
  trainer_id                   UUID REFERENCES staff(id),
  assessment_type               VARCHAR(20) DEFAULT 'seguimiento',
  -- inicial | seguimiento
  assessment_number             INTEGER NOT NULL,
  -- 0 = inicial, 1, 2, 3... = seguimientos consecutivos
  assessment_date                DATE NOT NULL,

  -- Componente A: Biométricos
  peso_kg                       DECIMAL(5,2),
  porcentaje_grasa_corporal        DECIMAL(4,2),
  masa_muscular_kg                DECIMAL(5,2),
  agua_corporal_pct                DECIMAL(4,2),
  metabolismo_basal_kcal            DECIMAL(7,2),
  circunferencia_cintura_cm          DECIMAL(5,2),
  circunferencia_cadera_cm           DECIMAL(5,2),
  circunferencia_pecho_cm            DECIMAL(5,2),
  circunferencia_brazo_der_cm         DECIMAL(5,2),
  circunferencia_brazo_izq_cm         DECIMAL(5,2),
  circunferencia_muslo_der_cm         DECIMAL(5,2),
  circunferencia_muslo_izq_cm         DECIMAL(5,2),
  circunferencia_pantorrilla_cm        DECIMAL(5,2),
  fotos_progreso_urls               TEXT[],
  fotos_consentimiento_otorgado        BOOLEAN DEFAULT FALSE,

  -- Componente B: Screening de movimiento
  screening_sentadilla_json           JSONB,
  screening_bisagra_cadera_json        JSONB,
  screening_movilidad_hombro_json       JSONB,
  screening_plancha_segundos            INTEGER,
  observaciones_movimiento              TEXT,

  -- Componente C: Tests específicos del objetivo (flexible por tipo)
  tests_especificos_json              JSONB,
  -- estructura variable según objetivo, ej:
  -- {"tipo": "fuerza", "press_banca_est_1rm": 45, ...}
  -- {"tipo": "cardio", "test_escalon_fc_recuperacion": 96, ...}

  -- Componente D: Meta SMART
  objetivo_smart_texto                 TEXT,
  objetivo_smart_metrica_clave           VARCHAR(50),
  objetivo_smart_valor_objetivo            DECIMAL(7,2),
  objetivo_smart_fecha_limite              DATE,

  -- Preguntas cualitativas de seguimiento (solo assessment_type=seguimiento)
  percepcion_alineacion_progreso            SMALLINT,  -- escala 1-5
  ajuste_meta_solicitado                    BOOLEAN DEFAULT FALSE,

  notas_trainer                         TEXT,
  created_at                            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ALERTAS DE PROGRESO (comparativa automática entre evaluaciones)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE progress_alerts (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL REFERENCES members(id),
  assessment_id                 UUID REFERENCES physical_assessments(id),
  alert_type                    VARCHAR(30) NOT NULL,
  -- progreso_superior | estancamiento | atencion_profesional
  alert_details_json              JSONB,
  visible_to_trainer_only          BOOLEAN DEFAULT TRUE,
  reviewed                       BOOLEAN DEFAULT FALSE,
  reviewed_by                    UUID REFERENCES staff(id),
  reviewed_at                    TIMESTAMP,
  created_at                    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ENTREVISTA NUTRICIONAL (extiende member_nutrition_profiles
-- ya definida en el Módulo Nutrición, Sección 20, con los
-- campos cualitativos específicos de la entrevista)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE member_nutrition_profiles
  ADD COLUMN IF NOT EXISTS relacion_actual_comida_texto TEXT,
  ADD COLUMN IF NOT EXISTS intentos_previos_planes_texto TEXT,
  ADD COLUMN IF NOT EXISTS patron_comidas_actual_texto TEXT,
  ADD COLUMN IF NOT EXISTS come_fuera_contexto TEXT,
  ADD COLUMN IF NOT EXISTS requiere_consulta_previa_nutricionista BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fecha_entrevista_nutricional TIMESTAMP;
```

---

## 15. INTEGRACIONES DEL MÓDULO

```yaml
Con Módulo de Membresías (MOD-MEM):
  - Esta entrevista se activa automáticamente como parte del
    flujo de "Onboarding Digital del Nuevo Miembro" ya documentado
    (Sección 4 de ese módulo), insertándose entre el Paso 6
    (pago inicial) y el Paso 7 (activación y bienvenida)
  - La "Evaluación Física Inicial" ya mencionada ahí (Sección 4.2)
    ES el Bloque 7 de este módulo — se formaliza y amplía aquí,
    no se duplica

Con Módulo Workout Builder (MOD-WKT):
  - El perfil completo pre-llena el constructor de planes
    (Sección 10.2 de este documento)
  - El modo de planificación elegido determina permisos exactos
    en la app (Sección 4.2)
  - Las restricciones del PAR-Q+ y el screening de movimiento
    alimentan el filtrado automático de ejercicios contraindicados

Con Módulo Nutrición (MOD-NUTRI):
  - La guía de entrevista nutricional (Sección 11) es el
    complemento conversacional a los campos ya definidos en el
    "Perfil Nutricional del Miembro" de ese módulo
  - El enfoque de acompañamiento cuidadoso (Sección 11.3) se
    conecta directamente con las salvaguardas ya documentadas
    ahí (Sección 13.4)

Con Módulo CRM/ARIA (MOD-CRM):
  - Las preferencias de comunicación (Bloque 6) calibran el tono
    y frecuencia de ARIA desde el primer día
  - Las barreras previas reportadas alimentan los workflows de
    retención proactiva (ej. si reportó "falta de tiempo" como
    barrera histórica, ARIA puede anticipar ese riesgo)

Con Módulo de Scheduling (MOD-SCHED):
  - La disponibilidad horaria reportada en el Bloque 6 se usa
    para sugerir horarios de trainer y clases al agendar
  - Las evaluaciones de seguimiento se programan automáticamente
    como citas en el calendario compartido

Con Módulo de Gamificación (MOD-GAME):
  - Completar la entrevista inicial completa otorga puntos y
    puede desbloquear una medalla de bienvenida
  - La preferencia social (Bloque 6) alimenta el Buddy Matching
```

---

## 📎 APÉNDICE — CHECKLIST DE IMPLEMENTACIÓN

```yaml
□ Los 7 bloques de la entrevista implementados con guardado
  automático de progreso (permite continuar después)
  entre pasos
□ Instrumento PAR-Q+ implementado con las 7 preguntas estándar,
  sin modificaciones que alteren su validez
□ Flujo de alerta médica probado: un "Sí" en el PAR-Q+ marca
  correctamente el perfil y notifica al trainer sin bloquear
  el proceso de onboarding
□ Integración con Workout Builder verificada: los campos se
  heredan correctamente al abrir el constructor por primera vez
□ Guía de entrevista nutricional entregada como material de
  referencia al equipo de nutricionistas del gym
□ Protocolo de acompañamiento cuidadoso (Sección 11.3) revisado
  y aprobado por el nutricionista responsable antes de activarse
  en producción
□ Evaluaciones de seguimiento programables desde el panel del
  trainer, reutilizando la misma estructura que la evaluación
  inicial
□ Vista comparativa de progreso probada con datos de al menos
  3 evaluaciones consecutivas de un miembro piloto
□ Alertas automáticas de estancamiento/progreso configuradas
  y dirigidas SOLO al trainer, nunca de forma directa y sin
  contexto al miembro
```

---

_Documento generado: Julio 2026_
_Versión: 1.0_
_Tipo: Funcionalidad de Onboarding — Complementa Módulos de Membresías, Workout Builder y Nutrición_
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_
_Próxima revisión: Tras el primer ciclo completo de evaluaciones de seguimiento con el gym piloto_
