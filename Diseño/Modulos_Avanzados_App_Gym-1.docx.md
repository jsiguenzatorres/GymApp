**MÓDULOS AVANZADOS**

**App Integral de Gimnasio de Élite**

_Diseño detallado de 10 módulos diferenciadores_

Perfiles de Usuario · CRM Inteligente · AI Nutricional · Seguimiento Dietético

Marketplace · Feedback · Blog · Administración · Gamificación · Panel Ejecutivo

Junio 2026 — Documento de Diseño e Implementación

# **ÍNDICE DE MÓDULOS**

| \#  | Módulo                                                               | Tecnologías Clave                             | Prioridad    |
| --- | -------------------------------------------------------------------- | --------------------------------------------- | ------------ |
| 1   | Perfiles de Usuario & Rutinas Personalizadas con Video               | React Native, Node.js, PostgreSQL, FFmpeg     | MVP — Fase 1 |
| 2   | CRM Inteligente de Retención & Asistente Virtual (WhatsApp/Telegram) | NLP, Twilio, WhatsApp Business API, Baileys   | MVP — Fase 1 |
| 3   | Asistente Nutricional IA \+ Plan de Dieta Personalizado              | LLM (GPT-4o / Claude), PDF OCR, RAG           | Fase 2       |
| 4   | Seguimiento Nutricional Diario (Foto \+ Galería \+ Macros)           | Vision AI, USDA API, Google ML Kit            | Fase 2       |
| 5   | Marketplace Interno (Suplementos, Clases, Artículos)                 | Stripe, MercadoPago, Node.js, CRM integration | Fase 2       |
| 6   | Feedback, Quejas, Sugerencias & Encuestas                            | Typeform-like engine, reporting               | Fase 2       |
| 7   | Blog & Portal Comunitario Público                                    | Next.js, CMS, moderación, SEO                 | Fase 3       |
| 8   | Gestión de Perfiles & Roles de Usuario                               | RBAC, Auth0/Supabase, permisos granulares     | MVP — Fase 1 |
| 9   | Sistema de Incentivos, Medallas & Regalías                           | Gamification engine, reglas automáticas       | Fase 3       |
| 10  | Panel Administrativo Ejecutivo (KPIs & BI completo)                  | Recharts, Metabase, exportación, alertas      | MVP — Fase 1 |

| 🏋️ MÓDULO 1 PERFILES DE USUARIO & RUTINAS PERSONALIZADAS CON VIDEO                                                                                                                                                                                                             |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Centralizar toda la información del miembro — datos físicos, objetivos, historial de progreso y rutinas asignadas — en un perfil unificado accesible desde la app, con ejercicios que incluyen video explicativo de técnica y registro de ejecución por sesión. |

## **1.1 Perfil Completo del Miembro**

| Datos de identidad             | Nombre, foto, fecha de nacimiento, género, teléfono, email, contacto de emergencia                                    |
| :----------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **Métricas físicas iniciales** | Peso, estatura, % de grasa corporal, IMC, masa muscular, circunferencias (cintura, cadera, pecho, brazos, muslos)     |
| **Historial médico relevante** | Lesiones previas, condiciones crónicas, medicamentos, restricciones de movimiento — privado, solo para trainer/médico |
| **Objetivos medibles**         | Categoría del objetivo \+ meta cuantificable \+ fecha límite                                                          |
| **Nivel fitness**              | Principiante / Intermedio / Avanzado — recalibrado tras evaluaciones periódicas                                       |
| **Trainer asignado**           | Vinculación directa al trainer responsable con canal de comunicación integrado                                        |
| **Notas privadas del trainer** | Observaciones sobre el miembro visibles solo para el staff                                                            |
| **Fotos de progreso**          | Galería cronológica con comparativa lado a lado (frente, perfil, dorso)                                               |

## **1.2 Categorías de Objetivo & Parámetros**

| Objetivo                      | Meta Cuantificable                        | KPIs de Seguimiento                                     | Período Típico    |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------- | ----------------- |
| Pérdida de peso               | X kg en Y semanas                         | Peso, % grasa, circunferencias, calorías quemadas       | 8–16 semanas      |
| Aumento de fuerza             | Subir X kg en ejercicio base              | 1RM por ejercicio, progresión de carga semanal          | 12–24 semanas     |
| Definición / Tonificación     | Reducir % grasa manteniendo masa muscular | % grasa, masa magra, circunferencias                    | 10–20 semanas     |
| Ganancia de masa muscular     | Aumentar X kg de masa magra               | Masa muscular (bioimpedancia), medidas, carga levantada | 16–24 semanas     |
| Resistencia cardiovascular    | Correr X km en Y minutos / VO2max         | Tiempo en prueba, FC en reposo, zona cardíaca           | 8–12 semanas      |
| Rehabilitación / Recuperación | Recuperar rango de movimiento             | ROM, escala de dolor, funcionalidad                     | Variable (médico) |
| Mantenimiento                 | Sostener métricas actuales                | Peso, adherencia al plan, asistencia                    | Continuo          |
| Rendimiento deportivo         | Meta específica de deporte                | Métricas del deporte \+ fuerza \+ resistencia           | Por temporada     |

## **1.3 Constructor de Rutinas Semanal (para el Trainer)**

El trainer accede desde su panel web o app al Constructor de Rutinas, donde diseña el plan semanal completo del miembro:

**ESTRUCTURA DEL PLAN SEMANAL**

- Plan \= N días de entrenamiento por semana (configurable 1–7 días)

- Cada día \= División de entrenamiento (ej: Día A, B, C, D como en la app SmartFit observada)

- Cada división \= Lista ordenada de ejercicios con: nombre, video, series × repeticiones, carga (kg), descanso (seg)

- El plan tiene fecha de inicio y vencimiento (ej: 'Expira en 26 días' como en la referencia)

- El trainer puede marcar un día como 'Propuesto' para que el sistema sugiera automáticamente al usuario

- Posibilidad de duplicar planes entre miembros con similar objetivo y nivel

- Planes de periodización: divididos en fases (mesociclos) de 4–6 semanas con progresión planificada

## **1.4 Librería de Ejercicios con Video**

| VIDEO TÉCNICA | Cada ejercicio tiene video propio de 20–90 seg mostrando: posición inicial, ejecución, errores comunes, variaciones. Alojado en CDN con reproducción offline posible. |
| :-----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Campo del Ejercicio        | Descripción                                                             | Ejemplo                             |
| -------------------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| Nombre                     | Nombre oficial \+ nombre coloquial                                      | Maquina Hack / Hack Squat           |
| Video técnica              | URL a video MP4/HLS en CDN, thumbnail                                   | video_hack_squat.mp4                |
| Músculos primarios         | Grupo muscular principal activado                                       | Cuádriceps, Glúteos                 |
| Músculos secundarios       | Grupos de apoyo                                                         | Mellizos, Core                      |
| Mapa muscular              | SVG/imagen del cuerpo con músculos en rojo (como en SmartFit)           | Imagen anatómica interactiva        |
| Equipamiento necesario     | Tipo de máquina o material requerido                                    | Máquina Hack Squat, Peso libre      |
| Dificultad                 | Nivel requerido del ejercicio                                           | Intermedio                          |
| Posición base              | Descripción texto de la postura inicial                                 | Espalda apoyada, pies al frente...  |
| Ejercicios alternativos    | Lista de ejercicios que activan los mismos músculos (CAMBIAR EJERCICIO) | Sentadilla, Leg Press, Step...      |
| Instrucciones de seguridad | Alertas de postura incorrecta y lesión potencial                        | No bloquear rodillas al extender... |

## **1.5 Ejecución de la Sesión por el Usuario (App Móvil)**

Vista de ejecución — inspirada en la interfaz SmartFit analizada — con flujo completo de sesión:

**FLUJO DE SESIÓN EN LA APP**

- 1\. Usuario abre la app → Ve 'PRÓXIMO ENTRENAMIENTO' con % de progreso del plan y sesiones (ej: 9/25)

- 2\. Toca 'Acceder a mi entrenamiento' → Selecciona la División del día (A/B/C/D)

- 3\. Ve la lista de ejercicios de esa división con thumbnail \+ nombre \+ series × reps \+ kg asignados

- 4\. Toca cada ejercicio → Pantalla de ejercicio individual con:

  - • Video técnica a pantalla completa (reproducción en bucle)

  - • Series y Repeticiones prescritas (ej: 3× 8 a 10\)

  - • Campo editable de Carga (kg) con botón lápiz para actualizar

  - • Timer de Descanso entre series (ej: 01:00 con botón play)

  - • EVOLUCIÓN DE LA CARGA: gráfica de línea con histórico de kg por fecha

  - • MIS ANOTACIONES: campo libre privado (ej: 'ajuste de asiento altura 3')

  - • ACTIVACIÓN MUSCULAR: mapa corporal con músculos activados en rojo

  - • CAMBIAR EJERCICIO: alternativas que activan los mismos grupos musculares

- 5\. Checkbox de completado por ejercicio → al marcar todos → botón 'FINALIZAR ENTRENAMIENTO'

- 6\. Post-sesión: resumen de sesión (duración, ejercicios completados, carga total levantada)

- 7\. Opción de calificar la sesión (1–5 ⭐) y dejar nota para el trainer

## **1.6 Dashboard de Progreso del Miembro**

| Métrica                          | Visualización                                   | Frecuencia de Actualización |
| -------------------------------- | ----------------------------------------------- | --------------------------- |
| Progreso del plan                | Barra y porcentaje (ej: 36% \- 9/25 sesiones)   | Tiempo real                 |
| Evolución de carga por ejercicio | Gráfica de línea (0→25→40 kg como en SmartFit)  | Por sesión                  |
| Adherencia semanal               | Calendario con días entrenados vs. planificados | Semanal                     |
| Métricas corporales              | Gráfica de línea: peso, % grasa, masa muscular  | Por evaluación              |
| Comparativa de fotos             | Antes/Después lado a lado por fecha             | Manual                      |
| Volumen total levantado          | KG totales por semana/mes                       | Por sesión                  |
| Personal Records (PRs)           | Récord máximo por ejercicio                     | Por sesión                  |
| Racha actual                     | Días consecutivos entrenando                    | Tiempo real                 |

## **1.7 Flujo de Datos e Inteligencia Artificial**

| 🤖 IA APLICADA | Motor de progresión automática: si el usuario ejecutó todas las reps con el peso asignado en las últimas 2 sesiones → sugiere aumentar carga un 5–10%. Si hay caída de rendimiento → alerta al trainer. Si el usuario no entrena X días → dispara workflow de retención (ver Módulo 2). |
| :------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 💬 MÓDULO 2 CRM INTELIGENTE DE RETENCIÓN & ASISTENTE VIRTUAL HUMANIZADO                                                                                                                                                                                                   |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PROPÓSITO:** Sistema de seguimiento proactivo del estado emocional y de asistencia del miembro, que activa comunicación personalizada y empática vía WhatsApp, Telegram, Email y llamada con IA para rescatar al usuario desmotivado antes de que cancele su membresía. |

## **2.1 Motor de Detección Temprana de Riesgo**

El CRM monitorea en tiempo real múltiples señales combinadas para calcular el Risk Score de cada miembro:

| Señal                          | Peso en Score | Umbral de Alerta                        | Acción Sugerida                    |
| ------------------------------ | ------------- | --------------------------------------- | ---------------------------------- |
| Días sin visita al gym         | 35%           | 3 días (habitual) / 7 días (esporádico) | Mensaje motivacional suave         |
| Descenso de frecuencia semanal | 20%           | 50% menos que baseline personal         | Llamada de seguimiento             |
| No-shows a clases reservadas   | 15%           | 2 consecutivos                          | SMS personalizado con reencuadre   |
| Sesiones de app sin abrir      | 10%           | 5 días sin abrir la app                 | Push: 'Te extrañamos, ¿todo bien?' |
| Caída en carga/rendimiento     | 10%           | 3 sesiones consecutivas en baja         | Mensaje del trainer con ajuste     |
| Pagos tardíos / fallidos       | 5%            | 1 fallo de pago                         | Contacto financiero empático       |
| Baja interacción social en app | 5%            | Sin likes/comments en 2 semanas         | Invitación a challenge grupal      |

| SCORE RANGE | 0–30: Miembro activo (verde) · 31–60: En observación (amarillo) · 61–80: En riesgo (naranja) · 81–100: Crítico — acción inmediata (rojo) |
| :---------: | :--------------------------------------------------------------------------------------------------------------------------------------- |

## **2.2 Workflows de Retención Automatizados**

**WORKFLOW: MIEMBRO INACTIVO 3 DÍAS (Risk Score 40–60)**

- Día 3: WhatsApp/SMS automático — Mensaje empático personalizado con nombre \+ dato de su progreso reciente

  - Ej: 'Hola María, notamos que llevas 3 días sin entrenar. Recuerda que ibas muy bien en tu objetivo de pérdida de peso 💪 ¿Todo bien?'

- Día 5: Email con Resumen de Progreso Proyectado (ver sección 2.3)

- Día 7: Asistente Virtual llama por WhatsApp con voz humanizada — check-in empático

- Día 10: El trainer asignado recibe alerta en su panel y puede enviar nota de voz personalizada

- Día 14: Workflow escalado a 'Crítico' — oferta de sesión de re-evaluación gratuita

**WORKFLOW: MIEMBRO EN RIESGO CRÍTICO (Risk Score 80+)**

- Inmediato: Alerta al admin y trainer en panel ejecutivo

- Día 1: Llamada del Asistente Virtual — conversación de rescate empática y personalizada

- Día 3: Oferta exclusiva de beneficio (sesión gratis, freeze, descuento especial)

- Día 5: Contacto directo del dueño/director del gym (escalación humana final)

## **2.3 Resumen de Progreso Proyectado (Por Inasistencias)**

Uno de los mensajes más poderosos de retención: mostrar al miembro cuánto ha perdido de avance (o cuánto hubiera ganado) por sus ausencias:

| EJEMPLO DE MENSAJE | Si María hubiera asistido sus 3 días faltantes esta semana, hoy estaría al 68% de su objetivo en lugar de 36%. Proyectamos que con su ritmo actual alcanzará su meta en 18 semanas — pero con asistencia regular podría lograrlo en 9 semanas 🎯 |
| :----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

- El cálculo usa datos reales del plan: sesiones completadas, progresión de carga, métricas corporales

- Se proyecta la fecha estimada de logro del objetivo según ritmo actual vs. ritmo óptimo

- El mensaje es siempre positivo y esperanzador — nunca culpabilizador

- El usuario puede responder al mensaje directamente → el asistente virtual capta la respuesta

## **2.4 Asistente Virtual Humanizado (WhatsApp & Telegram)**

| Canal             | Capacidad                                                                | Tecnología                              |
| ----------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| WhatsApp Business | Mensajes de texto, audio, video, documentos, botones de respuesta rápida | WhatsApp Business API (Meta) \+ webhook |
| Telegram          | Bot con comandos, teclados inline, respuestas, archivos                  | Telegram Bot API                        |
| Email             | Emails HTML personalizados con variables de perfil                       | SendGrid / Mailchimp API                |
| Llamada voz IA    | Conversación hablada humanizada 24/7                                     | Twilio \+ ElevenLabs TTS o similar      |
| SMS               | Mensajes cortos para alertas críticas y recordatorios                    | Twilio SMS                              |

### **Conversaciones que maneja el Asistente Virtual:**

- Motivación y acompañamiento emocional — responde con empatía y contexto del usuario

- Responder preguntas sobre su plan de entrenamiento y progreso

- Agendar o reagendar sesiones con el trainer

- Proporcionar información sobre horarios, clases y servicios del gym

- Capturar razón de inasistencia (trabajo, enfermedad, viaje) → actualiza CRM

- Manejar solicitudes de freeze o pausa de membresía con empathy first

- Escalar a humano cuando detecta: frustración alta, solicitud de cancelación definitiva, queja grave

| ⚠️ TONO SIEMPRE POSITIVO | El asistente NUNCA usa lenguaje de culpa, presión de ventas agresiva o amenazas. Siempre: empatía primero → dato de progreso → propuesta de acción → puerta abierta. |
| :----------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 🥗 MÓDULO 3 ASISTENTE NUTRICIONAL IA & PLAN DE DIETA PERSONALIZADO                                                                                                                                                                                                                        |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Especialista virtual en nutrición deportiva que entrevista al usuario mediante conversación guiada, procesa exámenes médicos en PDF, y genera un plan nutricional individualizado combinado con su rutina de ejercicios — todo basado en evidencia científica actualizada. |

| ⚕️ DISCLAIMER MÉDICO | Este módulo es una herramienta educativa y de orientación nutricional general. No sustituye la consulta con un nutricionista dietista o médico registrado. Las recomendaciones se basan en principios de nutrición deportiva ampliamente aceptados. Antes de iniciar cualquier plan nutricional, especialmente si existen condiciones médicas preexistentes, el usuario debe consultar a un profesional de la salud. El gimnasio y la plataforma no son responsables por consecuencias de uso inadecuado del plan generado. |
| :------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## **3.1 Entrevista Inicial de Nutrición (Conversación IA)**

El asistente conduce una entrevista conversacional en la app — tipo chat — recopilando toda la información necesaria para personalizar el plan:

| Bloque                       | Preguntas Clave                                                                    | Propósito                          |
| ---------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Datos básicos                | Peso actual, estatura, edad, género biológico, nivel de actividad física           | Cálculo de TMB y TDEE              |
| Objetivo nutricional         | Perder peso / Ganar músculo / Definir / Rendimiento / Salud general                | Ajuste de macro-ratio              |
| Hábitos alimenticios         | Número de comidas/día, horario de entrenamientos, preferencias, aversiones         | Distribución de comidas            |
| Restricciones dietéticas     | Vegetariano, vegano, sin gluten, sin lactosa, alergias específicas                 | Personalización del plan           |
| Historial médico nutricional | Diabetes, hipertensión, tiroides, colesterol, cirugías digestivas                  | Ajustes de seguridad               |
| Exámenes médicos (PDF)       | Hemograma, perfil lipídico, glucosa, hormonas, deficiencias                        | Personalización clínica            |
| Suplementación actual        | Proteína, creatina, vitaminas, otros — dosis y marca                               | Evitar duplicación / interacciones |
| Contexto de vida             | Trabajo (sedentario/físico), estrés, calidad de sueño, disponibilidad para cocinar | Adherencia real                    |

## **3.2 Procesamiento de Exámenes Médicos en PDF**

- El usuario adjunta PDF de resultados de laboratorio directamente en el chat

- El sistema extrae texto con OCR (pdfplumber \+ Tesseract para escaneados)

- La IA identifica valores relevantes: glucosa, hemoglobina, ferritina, vitamina D, B12, TSH, T3/T4, perfil lipídico, creatinina

- Compara valores contra rangos de referencia normales

- Incorpora hallazgos al plan nutricional (ej: ferritina baja → enfatizar hierro; vitamina D baja → suplementación recomendada)

- Los resultados quedan archivados en el perfil del miembro bajo acceso del trainer/médico asignado

| 🔒 PRIVACIDAD | Los exámenes médicos se almacenan encriptados (AES-256). Solo el usuario y el staff autorizado tienen acceso. Nunca se usan para entrenar modelos de IA ni se comparten con terceros. Cumplimiento: HIPAA (principios) y GDPR. |
| :-----------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## **3.3 Generación del Plan Nutricional**

| Componente del Plan      | Detalle                                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Cálculo calórico base    | TMB por Mifflin-St Jeor / Harris-Benedict \+ factor de actividad física (TDEE)               |
| Ajuste por objetivo      | Déficit \-500 kcal (pérdida peso) / \+300 kcal (ganancia muscular) / mantenimiento           |
| Distribución de macros   | Proteína (g/kg peso), Carbohidratos (%), Grasas (%) — ajustado por objetivo y exámenes       |
| Plan de 7 días           | Menú diario: desayuno, snack AM, almuerzo, snack PM, cena — con opciones y equivalentes      |
| Horario de nutrición     | Nutrientes perientrino: pre-workout, intra-workout (si aplica), post-workout                 |
| Lista de compras semanal | Agrupada por categoría: proteínas, carbohidratos, grasas, frutas/verduras                    |
| Suplementación sugerida  | Basada en objetivos \+ exámenes \+ plan de entrenamiento (con disclaimer de consulta médica) |
| Hidratación              | Litros recomendados/día \+ pautas de hidratación en entrenamiento                            |

## **3.4 Base de Conocimiento del Asistente (RAG — Retrieval-Augmented Generation)**

El asistente nutricional se alimenta de una biblioteca de conocimiento actualizable por el administrador:

| Tipo de Fuente        | Formato Aceptado                       | Ejemplos                                                        |
| --------------------- | -------------------------------------- | --------------------------------------------------------------- |
| Artículos científicos | PDF (PubMed, journals)                 | Estudios sobre proteína y síntesis muscular, ayuno intermitente |
| Guías clínicas        | PDF                                    | Guías de la OMS, AHA, AND sobre nutrición deportiva             |
| Videos educativos     | URL YouTube → transcripción automática | Charlas de nutricionistas deportivos reconocidos                |
| Podcasts / Audios     | MP3/M4A → transcripción Whisper        | Podcasts de nutrición y performance                             |
| Artículos web         | URL → scraping y parsing               | Examine.com, Precision Nutrition, Pubmed                        |
| Manuales propios      | PDF, DOCX                              | Protocolos del gym, planes de sus nutricionistas                |

| ⚠️ DISCLAIMER SUPLEMENTOS | Las sugerencias de suplementación son orientativas y basadas en evidencia publicada. No constituyen prescripción médica. El usuario debe consultar a su médico o nutricionista antes de iniciar cualquier suplemento, especialmente si toma medicamentos o tiene condiciones de salud. La plataforma no recibe compensación de marcas de suplementos. |
| :-----------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| 📊 MÓDULO 4 SEGUIMIENTO NUTRICIONAL DIARIO (FOTO \+ GALERÍA \+ MACROS)                                                                                                                                                                                          |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** El usuario registra sus comidas diarias mediante fotografía de su plato o seleccionando alimentos de una galería visual, y el sistema calcula automáticamente calorías, macronutrientes y micronutrientes con clasificación por tipo de ingesta. |

| ⚕️ DISCLAIMER CALÓRICO | Los valores nutricionales se basan en bases de datos validadas (USDA FoodData Central, Open Food Facts) y en estimaciones de IA visual. Los análisis de foto son aproximaciones — la precisión depende de la calidad de la imagen y el tamaño de la porción visible. Para condiciones médicas que requieran control estricto de nutrientes, se recomienda usar báscula y consulta con nutricionista. |
| :--------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

## **4.1 Registro por Fotografía (AI Vision)**

- Usuario toma foto de su plato o la importa de galería del teléfono

- La IA de visión (Google Vision API / GPT-4o Vision / Gemini Pro Vision) identifica:

  - • Alimentos presentes en el plato (nombre, variedad)

  - • Estimación de porción (gramos aproximados por alimento visible)

  - • Método de cocción (hervido, frito, asado) → impacta calorías

  - • Ingredientes adicionales visibles (salsas, aderezos, guarniciones)

- El sistema consulta la base de datos nutricional con los alimentos identificados

- Muestra resultado detallado editable: el usuario puede ajustar porciones estimadas

- La foto queda almacenada en el diario visual del usuario

## **4.2 Registro por Galería de Alimentos**

- Buscador de alimentos con autocompletado (nombre, marca, presentación)

- Base de datos: USDA FoodData Central \+ Open Food Facts \+ alimentos regionales LATAM

- El usuario especifica: cantidad (gramos, tazas, unidades) \+ preparación

- Favoritos guardados para acceso rápido de alimentos frecuentes

- Opción de escanear código de barras de productos empacados → datos automáticos

- Creación de comidas personalizadas (ej: 'Batido proteico de mi gym') guardadas en perfil

## **4.3 Desglose Nutricional Completo**

| Nivel           | Métricas Calculadas                                                                                                   | Visualización                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------- |
| MACRONUTRIENTES | Proteínas (g), Carbohidratos (g) \[totales \+ fibra \+ azúcares\], Grasas (g) \[totales \+ saturadas \+ insaturadas\] | Gráfica de dona por macros                                |
| MICRONUTRIENTES | Vitaminas: A, C, D, E, K, B1, B2, B3, B6, B12, Folato                                                                 | Minerales: Calcio, Hierro, Magnesio, Zinc, Sodio, Potasio | Tabla con %VD |
| CALORÍAS        | Total kcal por comida \+ Acumulado del día \+ Balance vs. objetivo (déficit/superávit)                                | Barra de progreso diaria                                  |
| HIDRATACIÓN     | Vasos de agua registrados (manual o tracker) vs. meta diaria                                                          | Iconos de vasos                                           |

## **4.4 Clasificación de Ingestas del Día**

| Tipo de Ingesta        | Icono | Descripción                                                     |
| ---------------------- | ----- | --------------------------------------------------------------- |
| Desayuno               | 🌅    | Primera comida del día (post-ayuno nocturno)                    |
| Snack Mañana           | 🍎    | Pequeña ingesta entre desayuno y almuerzo                       |
| Almuerzo               | 🍽️    | Comida principal del mediodía                                   |
| Merienda / Snack Tarde | 🥜    | Ingesta entre almuerzo y cena                                   |
| Cena                   | 🌙    | Última comida principal del día                                 |
| Pre-Workout            | ⚡    | Comida previa al entrenamiento (1–2h antes)                     |
| Post-Workout           | 💪    | Comida/batido de recuperación (0–60 min post-entreno)           |
| Suplementos            | 💊    | Registro de suplementos tomados (proteína, creatina, vitaminas) |

## **4.5 Dashboard Nutricional Diario/Semanal**

- Vista de hoy: barras de macros completadas vs. objetivo (color verde/amarillo/rojo)

- Historial semanal: gráfica de barras apiladas de macros por día

- Adherencia al plan: % de días en los que el usuario cumplió su meta calórica ±10%

- Diario visual: galería de fotos de comidas de la semana ordenadas por día

- Insights automáticos: 'Esta semana consumiste 20g menos de proteína de lo recomendado'

- Comparativa entrenamiento vs. nutrición: días con buen entreno y buena nutrición vs. solo uno

| 🛒 MÓDULO 5 MARKETPLACE INTERNO DEL GYM                                                                                                                                                                                                                                            |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Plataforma de comercio electrónico integrada a la app del miembro donde el gym vende suplementos, alimentos saludables, artículos, clases especializadas y servicios adicionales — con gestión completa por el propietario, sistema de crédito y pasarelas de pago. |

## **5.1 Gestión de Catálogo (Panel del Propietario/Admin)**

| Campo del Producto      | Descripción                                                                       | Notas                          |
| ----------------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| Nombre del producto     | Texto corto descriptivo                                                           | Buscable en la app             |
| Descripción detallada   | Texto largo con ingredientes, beneficios, modo de uso                             | Soporte markdown               |
| Categoría               | Suplementos / Alimentos / Artículos deportivos / Clases / Servicios / Merchandise | Filtros en app                 |
| Presentación            | Opciones: talla S/M/L, sabor vainilla/chocolate, 500g/1kg                         | Variantes con stock propio     |
| Precio regular          | Precio base en moneda local                                                       | Con soporte multi-moneda       |
| Precio de descuento     | Precio con oferta \+ fecha de inicio/fin de la promoción                          | Badge 'Oferta' en app          |
| Fotografías             | Hasta 5 fotos del producto (galería en app)                                       | Compresión automática          |
| Código de barras        | EAN/QR para escaneo en mostrador                                                  | Vinculado a inventario         |
| Stock disponible        | Unidades en inventario con alerta de stock mínimo                                 | Descuento automático al vender |
| Activo/Inactivo         | Toggle para mostrar u ocultar del catálogo                                        | Sin borrar el historial        |
| Destacado               | Producto aparece en banner principal de la tienda                                 | Máximo 5 destacados            |
| Instrucciones de retiro | Texto para el miembro (mostrador, horario, etc.)                                  | Se muestra en orden confirmada |

## **5.2 Experiencia de Compra del Miembro (App)**

- Home de tienda: banners de destacados \+ grid de productos por categoría

- Buscador con filtros: categoría, precio, disponibilidad, ofertas

- Página de producto: fotos, descripción, macros/ingredientes (si aplica), reseñas de otros miembros

- Carrito de compra con resumen antes de pagar

- Selección de método de pago:

  - • Tarjeta de crédito/débito (Stripe)

  - • MercadoPago / Pago local (según región)

  - • Crédito en cuenta del gym (ver sección 5.3)

- Confirmación de orden con número único \+ instrucciones de retiro en mostrador

- Historial de órdenes con estado: Pendiente → En preparación → Listo para retirar → Retirado

## **5.3 Sistema de Crédito (Cuenta por Cobrar)**

| CRÉDITO GYM | El miembro puede comprar a crédito hasta un límite definido por el admin. El sistema lleva la cuenta por cobrar individual con detalle de transacciones. Al pagar (parcial o total), el balance se descuenta automáticamente. Reportes de cartera disponibles en panel ejecutivo. |
| :---------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

| Función                    | Descripción                                               |
| -------------------------- | --------------------------------------------------------- |
| Límite de crédito          | Configurable por admin: global o por miembro individual   |
| Estado de cuenta           | El miembro ve su saldo deudor en tiempo real desde la app |
| Alertas de deuda           | Notificación automática cuando alcanza 80% del límite     |
| Abono de pagos             | Registro de pagos parciales o totales con comprobante     |
| Intereses / Penalizaciones | Configurable: 0% (beneficio) o tasa definida por el admin |
| Reporte cartera admin      | Lista de miembros con deuda, monto, antigüedad, contacto  |
| Integración CRM            | Deuda alta → señal adicional en Risk Score de retención   |

## **5.4 Integración con CRM y Logística**

- Cada compra queda vinculada al perfil del miembro en el CRM

- Las recomendaciones de productos son personalizadas por IA: si el usuario tiene objetivo de 'ganancia muscular' → suplementos de proteína aparecen primero

- El staff ve en su panel de mostrador las órdenes 'Listas para retirar' con nombre del miembro

- Scan del QR del miembro en mostrador confirma el retiro y cierra la orden

- Reportes de ventas integrados al panel ejecutivo (Módulo 10\)

| 📋 MÓDULO 6 FEEDBACK, QUEJAS, SUGERENCIAS & ENCUESTAS                                                                                                                                                                       |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Canal formal y organizado para que los miembros expresen su experiencia, reporten problemas y aporten ideas — con seguimiento, reportería y cierre de loop tanto para el miembro como para el administrador. |

## **6.1 Tipos de Comunicación**

| Tipo                   | Descripción                                                | Urgencia | Tiempo de Respuesta Target |
| ---------------------- | ---------------------------------------------------------- | -------- | -------------------------- |
| Queja formal           | Problema con instalaciones, staff, servicio, facturación   | Alta     | 24 horas                   |
| Sugerencia             | Idea de mejora: nuevo horario, nueva clase, equipamiento   | Media    | 72 horas                   |
| Reseña de clase        | Calificación 1–5 \+ comentario de una clase o sesión       | Baja     | Automático                 |
| Encuesta NPS           | ¿Recomendarías este gym? (0–10) \+ razón                   | Baja     | Trimestral automática      |
| Encuesta personalizada | Encuestas creadas por el admin sobre temas específicos     | Variable | Según diseño               |
| Reporte de incidente   | Lesión en instalaciones, emergencia, problema de seguridad | Crítica  | Inmediata                  |

## **6.2 Flujo de Queja (para el Miembro)**

- Miembro abre la app → Sección 'Atención y Soporte' → 'Nueva queja/sugerencia'

- Selecciona categoría → Escribe descripción (opcional: adjunta foto o video del problema)

- Recibe número de ticket de seguimiento inmediatamente

- Notificaciones de estado: Recibida → En revisión → Resuelta → Cerrada

- Puede agregar información adicional mientras el ticket está abierto

- Al cerrarse: opción de calificar la resolución (¿quedó satisfecho?)

## **6.3 Panel de Gestión (para el Admin)**

- Bandeja de entrada de tickets con filtros: tipo, estado, urgencia, categoría, fecha

- Asignación de tickets a staff responsable con notificación automática

- Historial de comunicación: mensajes internos del staff \+ mensajes al miembro

- SLA automático: alerta si un ticket de alta urgencia supera 24h sin respuesta

- Dashboard de KPIs de satisfacción: tiempo de respuesta promedio, % resueltos, NPS mensual

- Análisis de tendencias: categorías de queja más frecuentes, horarios con más reportes

## **6.4 Encuestas Automáticas**

| Encuesta             | Trigger                                            | Métricas Obtenidas                                           |
| -------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Post-clase           | 30 min después de asistir a una clase              | Rating del instructor, dificultad, recomendaría la clase     |
| NPS mensual          | Último día del mes para todos los miembros activos | Net Promoter Score, razón, comentario libre                  |
| Post-cancel          | Al iniciar proceso de cancelación                  | Razón principal de cancelación — dato crucial para retención |
| Bienvenida (30 días) | 30 días después de iniciar membresía               | Experiencia inicial, expectativas cumplidas                  |
| Aniversario          | 1 año de membresía                                 | Logros percibidos, satisfacción general                      |
| Ad-hoc admin         | Creada manualmente por admin                       | Cualquier tema: nuevo equipamiento, cambio de horario, etc.  |

| 📰 MÓDULO 7 BLOG & PORTAL COMUNITARIO PÚBLICO                                                                                                                                                                          |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Espacio público y moderado donde los miembros comparten sus experiencias, transformaciones y consejos — generando comunidad, contenido SEO orgánico y prueba social que atrae nuevos prospectos al gym. |

## **7.1 Tipos de Contenido**

| Tipo                       | Autor           | Moderación                             | Visibilidad                  |
| -------------------------- | --------------- | -------------------------------------- | ---------------------------- |
| Artículos del gym          | Staff/Admin     | Sin moderación (autor autorizado)      | Pública \+ SEO               |
| Historia de transformación | Miembro         | Aprobación del admin antes de publicar | Pública (con consentimiento) |
| Testimonial corto          | Miembro         | Aprobación del admin                   | Pública                      |
| Tips de entrenamiento      | Trainer         | Sin moderación (author \= staff)       | Pública \+ SEO               |
| Recetas saludables         | Miembro o Staff | Moderación básica                      | Pública                      |
| Reto completado            | Miembro         | Automática (si no infringe normas)     | Pública                      |
| Pregunta a la comunidad    | Miembro         | Automática \+ filtro de lenguaje       | Solo miembros (login)        |

## **7.2 Panel de Moderación (Admin)**

- Cola de publicaciones pendientes de aprobación con preview completo

- Aprobación, rechazo con razón o solicitud de edición — notificación automática al miembro

- Filtro automático de palabras prohibidas, spam y contenido inapropiado (primera capa)

- Reportes de contenido por otros usuarios → el admin revisa

- Historial de moderación con razones documentadas

- Configuración de categorías, etiquetas y estructura del blog

## **7.3 SEO & Visibilidad**

- URLs amigables para SEO: /blog/transformacion-maria-perdio-15kg

- Meta tags automáticos basados en el contenido del post

- Sitemap XML actualizado automáticamente

- Schema markup para artículos (Google puede mostrarlos en búsqueda enriquecida)

- Integración con redes sociales: botones de compartir, Open Graph tags

| 🔐 MÓDULO 8 GESTIÓN DE PERFILES & ROLES DE USUARIO                                                                                                                                                                                                                    |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Sistema de control de acceso basado en roles (RBAC) que define qué puede ver y hacer cada tipo de usuario — desde el miembro básico hasta el super-usuario propietario del gym — garantizando seguridad, privacidad y separación de responsabilidades. |

## **8.1 Roles del Sistema**

| Rol                  | Descripción                                                                                           | Módulos con Acceso                              |
| -------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| SUPER ADMIN (Dueño)  | Acceso total a todo el sistema, configuración global, reportes completos, datos de todos los usuarios | TODOS sin restricción                           |
| ADMINISTRADOR        | Gestión operativa completa sin acceso a configuración de seguridad y finanzas globales                | Módulos 1-9, Panel ejecutivo parcial            |
| TRAINER / INSTRUCTOR | Perfil propio, acceso a sus clientes asignados, rutinas, seguimiento, mensajería                      | M1(sus clientes), M2(sus clientes), M6(recibir) |
| RECEPCIONISTA        | Check-in, reservas, POS, consulta de membresías, registro de quejas                                   | M1(lectura), M5(POS), M6                        |
| NUTRICIONISTA        | Acceso a perfiles nutricionales, exámenes médicos, planes de dieta de sus clientes                    | M3, M4(sus clientes)                            |
| MIEMBRO ACTIVO       | App móvil: sus propios datos, rutinas, nutrición, marketplace, blog, feedback                         | M1(propio), M2(recibir), M3-7(propio)           |
| MIEMBRO TRIAL        | Acceso limitado por período de prueba — sin marketplace crédito, sin plan nutricional                 | M1(básico), M2(recibir)                         |
| MIEMBRO INACTIVO     | Solo lectura de su historial, no puede reservar ni comprar                                            | Solo lectura archivo                            |

## **8.2 Permisos Granulares por Módulo**

Además de los roles predefinidos, el Super Admin puede configurar permisos individuales:

- Leer / Escribir / Editar / Eliminar por cada sección del sistema

- Acceso por sede/locación (un trainer solo ve miembros de su sede)

- Restricción de descuentos: el recepcionista puede dar descuento máximo del X%

- Visibilidad de datos sensibles: solo el dueño y admin ven historial médico completo

- Auditoría: registro de quién hizo qué acción y cuándo en cada módulo

## **8.3 Autenticación & Seguridad**

| Mecanismo                | Descripción                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| Autenticación            | Email \+ contraseña \+ 2FA opcional (OTP por SMS o app autenticadora)                |
| Login social             | Google, Apple ID, Facebook (para miembros — opcional)                                |
| Sesiones                 | JWT con expiración \+ refresh token seguro                                           |
| Contraseña               | Política: mínimo 8 caracteres, mayúscula, número, carácter especial                  |
| Recuperación             | Email de reset con link de un solo uso \+ expiración 24h                             |
| Inactividad              | Cierre de sesión automático tras 30 min inactivo en panel admin                      |
| Encriptación en tránsito | TLS 1.3 para todas las comunicaciones                                                |
| Encriptación en reposo   | AES-256 para datos sensibles (médicos, financieros)                                  |
| Cumplimiento             | GDPR (derecho al olvido, portabilidad de datos), principios HIPAA para datos médicos |

| 🏆 MÓDULO 9 SISTEMA DE INCENTIVOS, MEDALLAS & REGALÍAS                                                                                                                                                                                                                |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Motor de gamificación que reconoce y premia los comportamientos más valiosos del miembro — asistencia, disciplina, progreso, contribución social — con asignación automática de medallas, niveles y regalías tangibles, visible en un panel de logros. |

## **9.1 Categorías de Logros y Medallas**

| Categoría  | Medalla / Logro        | Trigger Automático                            | Recompensa Sugerida                |
| ---------- | ---------------------- | --------------------------------------------- | ---------------------------------- |
| ASISTENCIA | Semana Perfecta        | 7 días de 7 entrenados                        | 50 puntos                          |
| ASISTENCIA | Mes de Hierro          | Asistencia al 90%+ del mes                    | 200 puntos \+ badge dorado         |
| ASISTENCIA | 1 Año Contigo          | 12 meses como miembro activo                  | Sesión de PT gratis \+ badge élite |
| DISCIPLINA | Racha 30 días          | 30 días consecutivos entrenando               | Descuento 10% próxima mensualidad  |
| DISCIPLINA | Madrugador Élite       | 10 entrenamientos antes de las 7am            | Merchandise del gym                |
| DISCIPLINA | Plan Completo          | Completa el 100% de un plan sin modificar     | Evaluación física gratis           |
| PROGRESO   | Primera PR             | Primer récord personal en cualquier ejercicio | 100 puntos \+ celebración en app   |
| PROGRESO   | Meta Lograda           | Alcanza el objetivo declarado en el período   | Reconocimiento en blog/redes       |
| PROGRESO   | Transformación 30 días | Mejora medible de métricas en 30 días         | Foto antes/después destacada       |
| SOCIAL     | Referidor              | Refiere 1 miembro que se registra             | Mes gratis o descuento             |
| SOCIAL     | Top Reviewer           | 10 reseñas de clases con calidad              | Badge 'Voz de la Comunidad'        |
| NUTRICIÓN  | Semana Saludable       | Registra comidas 7 días seguidos              | 100 puntos extra                   |
| RESCATE    | El que no se rindió    | Regresa tras 14+ días de inactividad          | Sesión de bienvenida \+ puntos     |
| COMUNIDAD  | Aportador de Ideas     | Sugerencia implementada por el gym            | Mención especial \+ regalía VIP    |

## **9.2 Sistema de Puntos & Canje**

| Check-in al gym               | 10 puntos por visita          |
| :---------------------------- | :---------------------------- |
| **Clase grupal completada**   | 20 puntos                     |
| **Sesión de PT completada**   | 30 puntos                     |
| **Registrar comidas del día** | 15 puntos                     |
| **Completar evaluación**      | 50 puntos                     |
| **Referir un nuevo miembro**  | 200 puntos                    |
| **Reseña de clase (calidad)** | 20 puntos                     |
| **Sugerencia implementada**   | 150 puntos                    |
| **Medalla desbloqueada**      | Puntos según nivel de medalla |

### **Canje de puntos:**

- 500 pts → Botella de agua del gym

- 1,000 pts → 1 sesión de PT gratis

- 2,000 pts → 20% descuento en próxima mensualidad

- 5,000 pts → Mes gratis

- 10,000 pts → Membresía anual con descuento especial

## **9.3 Niveles de Membresía Élite**

| Nivel   | Puntos Acumulados | Beneficios Exclusivos                                                          | Badge Visual |
| ------- | ----------------- | ------------------------------------------------------------------------------ | ------------ |
| BRONCE  | 0 – 999           | Acceso estándar a la app y funciones básicas                                   | 🥉 Bronce    |
| PLATA   | 1,000 – 4,999     | Prioridad en lista de espera de clases, 5% descuento retail                    | 🥈 Plata     |
| ORO     | 5,000 – 14,999    | Acceso anticipado a nuevas clases, 10% descuento, evaluación física gratis     | 🥇 Oro       |
| PLATINO | 15,000 – 29,999   | Locker reservado, 15% descuento, 1 mes freeze gratis/año, invitados especiales | 💎 Platino   |
| ÉLITE   | 30,000+           | Membresía VIP, 20% descuento, PT mensual, acceso a eventos privados            | 👑 Élite     |

## **9.4 Panel de Incentivos (Admin)**

- Lista de todos los miembros con su nivel, puntos, medallas desbloqueadas

- Configuración de reglas de asignación automática (el admin puede editar triggers y recompensas)

- Asignación manual de medallas especiales o puntos extraordinarios

- Alertas de miembros que están a pocos puntos de subir de nivel

- Reporte de canjes: qué recompensas se han canjeado, valor monetario implicado

- Dashboard de engagement: correlación entre nivel de medallas y tasa de retención

| 📈 MÓDULO 10 PANEL ADMINISTRATIVO EJECUTIVO (KPIs & BI COMPLETO)                                                                                                                                                                                           |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PROPÓSITO:** Centro de mando del propietario/administrador con visibilidad total del negocio en tiempo real — desde métricas globales hasta el detalle individual de cada miembro — con dashboards visuales, alertas automáticas y reportes exportables. |

## **10.1 Dashboard Principal (Home Ejecutivo)**

Vista de un solo pantallazo con los KPIs más críticos del negocio:

**TARJETAS DE KPI — FILA SUPERIOR (Tiempo Real)**

- 👥 Miembros Activos: número actual vs. mes anterior (↑↓%)

- 💰 Revenue Hoy: acumulado del día vs. promedio diario del mes

- 📅 Check-ins Hoy: visitas registradas hoy \+ histograma por hora

- ⚠️ En Riesgo: número de miembros con Risk Score \>60 (clicable para ver lista)

- 🛒 Ventas Retail Hoy: total marketplace \+ POS

- 📋 Tickets Abiertos: quejas/sugerencias sin resolver (con SLA breakdown)

**GRÁFICOS PRINCIPALES — FILA CENTRAL**

- Gráfica MRR: línea de los últimos 12 meses \+ proyección próximos 3 meses

- Funnel de conversión: Leads → Visitas → Trials → Miembros (con tasas por etapa)

- Mapa de calor de asistencia: horas × días de la semana (últimas 4 semanas)

- Donut chart: distribución de revenue por categoría (membresías, PT, retail, clases especiales)

**ALERTAS AUTOMÁTICAS — FILA INFERIOR**

- 🔴 Miembros críticos (Risk Score \>80): lista con botón de acción directa

- 🟠 Clases con baja ocupación próximas 48h (\<30%): propuesta de acción

- 🟡 Pagos fallidos pendientes de resolución: monto y número

- 🔵 Medallas desbloqueadas no notificadas al miembro

## **10.2 Módulos de Reporte Detallados**

| Reporte      | KPIs Incluidos                                                                   | Filtros                   | Exportación     |
| ------------ | -------------------------------------------------------------------------------- | ------------------------- | --------------- |
| Membresías   | Activos, nuevos, cancelaciones, freezes, LTV, ARPU, churn rate por cohorte       | Período, tipo, objetivo   | PDF, Excel, CSV |
| Financiero   | MRR, ARR, revenue por categoría, pagos fallidos, cartera crédito, CAC            | Período, sede, categoría  | PDF, Excel      |
| Asistencia   | Check-ins totales, frecuencia por miembro, horas pico, retención por visita      | Período, sede, miembro    | CSV, Excel      |
| Clases       | Ocupación por clase/instructor/horario, no-shows, calificaciones, revenue        | Período, instructor, tipo | PDF, Excel      |
| Staff        | Clases impartidas, revenue generado, retención de clientes, comisiones           | Período, empleado         | PDF, Excel      |
| Retención    | Cohort analysis 12m, curva de churn, at-risk list, campañas enviadas             | Cohorte, período          | PDF, Excel      |
| Nutrición    | % miembros con plan activo, adherencia promedio, metas nutricionales vs. reales  | Período                   | CSV             |
| Marketplace  | Ventas por producto/categoría, cartera crédito, productos sin stock              | Período, categoría        | PDF, Excel      |
| Feedback/NPS | NPS mensual, tickets por categoría, tiempo de resolución, satisfacción           | Período, categoría        | PDF             |
| Gamificación | Distribución de niveles, medallas emitidas, puntos canjeados, ROI de recompensas | Período                   | Excel           |

## **10.3 Vista de Miembro Individual (Drill-down)**

El admin puede buscar cualquier miembro y ver su perfil completo 360°:

| Datos del perfil     | Foto, datos personales, membresía activa, fecha de inicio, trainer asignado     |
| :------------------- | :------------------------------------------------------------------------------ |
| **Métricas físicas** | Historial completo de peso, % grasa, medidas con gráficas temporales            |
| **Asistencia**       | Calendario de visitas, frecuencia semanal, racha actual, inasistencias          |
| **Financiero**       | Historial de pagos, deuda de crédito, membresía contratada, upgrades/downgrades |
| **Entrenamiento**    | Plan actual, progreso, PRs, sesiones completadas, evolución de cargas           |
| **Nutrición**        | Plan activo, adherencia, registro de comidas de la semana                       |
| **Comunicaciones**   | Todos los mensajes enviados/recibidos por cualquier canal con fecha             |
| **Feedback**         | Quejas abiertas y cerradas, encuestas respondidas, reseñas escritas             |
| **Gamificación**     | Puntos acumulados, nivel, medallas, historial de canjes                         |
| **Risk Score**       | Score actual con desglose de señales \+ historial de evolución del score        |

## **10.4 Configuración Global del Sistema**

- Datos del gym: nombre, logo, colores (personalización de la app), dirección, horarios

- Tipos de membresía: crear, editar, archivar — precios, beneficios, duración

- Políticas: cancelación, freeze, no-shows, penalizaciones — configurables sin código

- Notificaciones: qué se notifica, a quién, por qué canal — reglas globales

- Integraciones: tokens API de Stripe, WhatsApp, pasarelas — configuración segura

- Multi-sede: agregar nuevas locaciones, asignar staff, políticas diferenciadas por sede

- Backup: exportación completa de todos los datos del gym en JSON/CSV bajo demanda

**FIN DEL DOCUMENTO — Módulos Avanzados v2.0**

_10 Módulos Diseñados · Junio 2026_

Integrar al documento base: Investigacion_Apps_Elite_Gimnasios.docx
