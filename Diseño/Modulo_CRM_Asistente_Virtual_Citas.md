# 🧠 MÓDULO CRM INTEGRAL — ASISTENTE VIRTUAL HUMANIZADO & GESTIÓN DE CITAS

## App Integral de Gimnasio de Élite

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-CRM-V`  
> **Prioridad:** MVP Fase 1 (CRM core) + Fase 2 (Asistente Virtual + Citas completo)  
> **Módulos relacionados:** Módulo A (Perfiles & Rutinas), Módulo C (Nutrición IA), Módulo E (Marketplace), Módulo I (Incentivos), Módulo J (Panel Ejecutivo)

---

## 📋 TABLA DE CONTENIDO

1. [Visión General del Módulo](#1-visión-general-del-módulo)
2. [CRM de Miembros — Núcleo Central](#2-crm-de-miembros--núcleo-central)
3. [Motor de Riesgo & Retención Predictiva](#3-motor-de-riesgo--retención-predictiva)
4. [Asistente Virtual Humanizado — ARIA](#4-asistente-virtual-humanizado--aria)
5. [Sistema de Agendamiento & Gestión de Citas](#5-sistema-de-agendamiento--gestión-de-citas)
6. [Calendario Centralizado de Servicios](#6-calendario-centralizado-de-servicios)
7. [Bitácora de Interacciones (Interaction Log)](#7-bitácora-de-interacciones-interaction-log)
8. [Canales de Comunicación Integrados](#8-canales-de-comunicación-integrados)
9. [Workflows Automatizados de Retención](#9-workflows-automatizados-de-retención)
10. [Análisis del Comportamiento del Cliente](#10-análisis-del-comportamiento-del-cliente)
11. [Panel CRM para Staff & Admin](#11-panel-crm-para-staff--admin)
12. [Mejoras Adicionales & Funciones Sorpresa](#12-mejoras-adicionales--funciones-sorpresa)
13. [Arquitectura Técnica del Módulo](#13-arquitectura-técnica-del-módulo)
14. [Modelo de Datos](#14-modelo-de-datos)

---

## 1. VISIÓN GENERAL DEL MÓDULO

### 1.1 Propósito

El **Módulo CRM Integral** es el sistema nervioso central de la relación entre el gimnasio y sus miembros. Va mucho más allá de un directorio de contactos: es una plataforma de inteligencia relacional que combina:

- **CRM clásico** — perfiles, historial, segmentación, pipeline de ventas
- **Retención predictiva con IA** — detección temprana de riesgo de cancelación
- **Asistente Virtual Humanizado (ARIA)** — punto de contacto proactivo y reactivo 24/7
- **Gestión de citas multi-servicio** — agenda centralizada con confirmaciones y recordatorios
- **Bitácora de interacciones** — registro exhaustivo para análisis de comportamiento
- **Comunicación omnicanal** — WhatsApp, Telegram, redes sociales, llamada de voz, chat app, email

### 1.2 Filosofía de Diseño

> _"El gym que conoce a su miembro mejor de lo que él se conoce a sí mismo, nunca lo pierde."_

Cada interacción, cada visita, cada mensaje, cada cita — todo se convierte en inteligencia que permite al gimnasio **anticiparse** a las necesidades del miembro, **celebrar** sus logros y **rescatarlo** antes de que decida irse.

### 1.3 Principios del Asistente ARIA

| Principio        | Descripción                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| **Propositivo**  | Siempre tiene una siguiente acción sugerida para el miembro             |
| **Motivacional** | Conecta cada interacción con el objetivo declarado del miembro          |
| **Empático**     | Detecta el tono emocional y adapta su respuesta                         |
| **Respetuoso**   | Nunca presiona, nunca culpabiliza, siempre ofrece una salida digna      |
| **Amigable**     | Usa el nombre del miembro, recuerda detalles personales, celebra logros |
| **Proactivo**    | No espera que el miembro pregunte — anticipa y sugiere                  |
| **Consistente**  | Misma personalidad en todos los canales y en cualquier momento del día  |

---

## 2. CRM DE MIEMBROS — NÚCLEO CENTRAL

### 2.1 Ficha Maestra del Miembro

Cada miembro tiene una **Ficha Maestra** unificada accesible desde el panel de administración, el app del trainer y el asistente virtual. Contiene:

#### 📌 Datos Personales

```
- Nombre completo, apodo/nombre preferido
- Fecha de nacimiento + edad calculada automáticamente
- Género / identidad de género
- Foto de perfil (actualizable desde la app)
- Teléfonos: principal + alternativo
- Email principal + alternativo
- Dirección de residencia (para envíos de merchandising, si aplica)
- Contacto de emergencia: nombre, relación, teléfono
- Ocupación / horario laboral (para sugerir horarios de entreno óptimos)
- Idioma preferido de comunicación
- Cómo conoció el gym (canal de adquisición)
```

#### 💪 Datos de Membresía

```
- Tipo de membresía activa
- Fecha de inicio / fecha de vencimiento
- Historial de membresías anteriores (upgrades, downgrades, freezes)
- Trainer asignado (principal + sustituto)
- Nutricionista asignado (si aplica)
- Sede(s) autorizadas para acceso
- Accesos adicionales contratados (spa, clases especiales, etc.)
- Estado de la membresía: Activo / Freeze / Trial / Vencido / Cancelado
```

#### 🎯 Objetivos & Perfil Fitness

```
- Objetivo principal declarado en entrevista inicial
- Meta cuantificable + fecha límite
- Nivel fitness inicial: Principiante / Intermedio / Avanzado
- Nivel fitness actual (recalibrado en evaluaciones periódicas)
- Historial de evaluaciones físicas (fecha, métricas, evaluador)
- Lesiones o restricciones de movimiento documentadas
- Condiciones médicas relevantes (privado — solo staff autorizado)
- Preferencias de entrenamiento (horario, tipo de clase, trainer de preferencia)
- Actividades que disfruta / que evita
```

#### 📊 Métricas Corporales (Historial Completo)

```
- Peso (kg) — con historial temporal y gráfica
- Estatura (cm)
- IMC calculado automáticamente
- % Grasa corporal
- Masa muscular (kg)
- Masa ósea (kg)
- Metabolismo basal calculado
- Circunferencias: cintura, cadera, pecho, brazo derecho/izquierdo, muslo derecho/izquierdo
- Tensión arterial (si se registra)
- Frecuencia cardíaca en reposo
- Fotos de progreso: frente, perfil izquierdo, perfil derecho, dorso — con fecha
```

#### 💬 Preferencias de Comunicación

```
- Canal preferido: WhatsApp / Telegram / Email / Llamada / App
- Horario de contacto preferido (mañana / tarde / noche)
- Frecuencia de comunicación preferida
- Canales de redes sociales vinculados (con consentimiento explícito)
- Opt-in/out por tipo de mensaje:
    ✅ Recordatorios de citas
    ✅ Mensajes motivacionales
    ✅ Alertas de progreso
    ✅ Ofertas y promociones
    ✅ Noticias del gym
    ⬜ Newsletter nutricional
    ⬜ Challenges y competencias
```

#### 💰 Historial Financiero

```
- Método(s) de pago registrados
- Historial completo de cobros (fecha, monto, concepto, estado)
- Deuda de crédito marketplace (saldo actual + detalle de transacciones)
- Pagos pendientes / vencidos
- Descuentos y beneficios aplicados históricamente
- Valor total pagado en el gym (LTV acumulado)
```

---

### 2.2 Pipeline de Leads (Pre-Miembro)

Antes de ser miembro, el contacto pasa por un pipeline gestionado por ARIA y el equipo de ventas:

```
ETAPA 1: LEAD FRÍO
  ↓ Contacto inicial (web, redes sociales, referido, visita)
  → ARIA capta datos básicos y objetivo
  → Se asigna a vendedor/recepcionista

ETAPA 2: PROSPECTO CALIFICADO
  ↓ Interés confirmado, objetivo definido
  → ARIA agenda visita o trial gratuito
  → Tour personalizado del gym

ETAPA 3: TRIAL ACTIVO
  ↓ Período de prueba (3–7 días configurables)
  → ARIA da seguimiento diario durante el trial
  → Trainer asignado para sesión de evaluación

ETAPA 4: PROPUESTA ENVIADA
  ↓ Plan de membresía presentado
  → ARIA hace follow-up a las 24h, 48h, 72h
  → Manejo de objeciones con respuestas sugeridas

ETAPA 5: MIEMBRO ACTIVO ✅
  ↓ Contrato firmado, primer pago procesado
  → Workflow de bienvenida activado automáticamente
  → Onboarding completo con ARIA
```

### 2.3 Segmentación Dinámica de Miembros

El CRM crea y actualiza automáticamente segmentos basados en comportamiento real:

| Segmento                  | Criterio de Inclusión                      | Acción CRM Típica                          |
| ------------------------- | ------------------------------------------ | ------------------------------------------ |
| **Champions**             | Score >80, asistencia >90%, LTV alto       | Programa referral VIP, testimoniales       |
| **Loyalists**             | >12 meses activos, asistencia regular      | Beneficios de fidelidad, encuestas NPS     |
| **Potenciales Champions** | 6–12 meses, tendencia positiva             | Nurturing hacia nivel VIP                  |
| **En Riesgo — Leve**      | Score 40–60, inactividad 3–7 días          | Mensajes motivacionales ARIA               |
| **En Riesgo — Crítico**   | Score 61–80, inactividad 7–14 días         | Workflow de rescate intensivo              |
| **Hibernando**            | Sin visita 15–30 días                      | Win-back campaign agresiva                 |
| **Perdidos**              | Sin visita >30 días, membresía activa      | Oferta de re-enganche especial             |
| **Nuevos (<30 días)**     | Ingresaron en el último mes                | Onboarding intensivo, check-ins frecuentes |
| **Plateau**               | Sin progreso medible en 4+ semanas         | Re-evaluación y ajuste de plan             |
| **Nutrición Activa**      | Con plan nutricional asignado              | Seguimiento nutricional semanal            |
| **Pre-Churn**             | Falló pago + inactividad + quejas abiertas | Intervención humana inmediata              |

---

## 3. MOTOR DE RIESGO & RETENCIÓN PREDICTIVA

### 3.1 Algoritmo de Risk Score

El Risk Score (0–100) se recalcula cada 6 horas por miembro, ponderando 12 señales:

```
SEÑAL 1: Frecuencia de visitas (peso 25%)
  - Baseline personal: promedio de visitas de sus primeros 60 días
  - Si visitas actuales < 60% del baseline → señal activa
  - Penalización exponencial: cada día adicional aumenta el score

SEÑAL 2: Cambio en horario de visitas (peso 10%)
  - Miembro que siempre venía a las 7am y empieza a venir irregular
  - o deja de venir completamente en su horario habitual
  - Cambio detectado por análisis de distribución horaria

SEÑAL 3: No-shows a citas/clases (peso 15%)
  - 1 no-show: +5 puntos
  - 2 consecutivos: +15 puntos
  - 3+ consecutivos: +30 puntos

SEÑAL 4: Engagement en la app (peso 10%)
  - Días sin abrir la app (luego de período de uso activo)
  - Sin loguear workouts
  - Sin interacciones sociales (si las tenía)

SEÑAL 5: Respuesta a ARIA (peso 10%)
  - Mensajes de ARIA no leídos
  - Respuestas monosilábicas tras período de conversación fluida
  - Mensajes marcados con thumbs down o ignorados

SEÑAL 6: Pagos (peso 10%)
  - Fallo de pago: +10 puntos
  - Retraso en pago manual: +5 puntos
  - Solicitud de freeze: +8 puntos (señal pero no definitiva)

SEÑAL 7: Quejas abiertas sin resolver (peso 5%)
  - 1 queja abierta >48h: +5 puntos
  - Queja marcada como insatisfecha al cerrar: +10 puntos

SEÑAL 8: Progreso físico (peso 8%)
  - Sin registro de métricas en >21 días (si tenía hábito)
  - Sin avance en peso levantado en >4 semanas

SEÑAL 9: Interacción con citas (peso 5%)
  - Múltiples cancelaciones de citas en las últimas 2 semanas

SEÑAL 10: Tiempo en membresía (peso 3%)
  - Meses 2-3: riesgo natural más alto (luna de miel terminó)
  - Mes 11-12: riesgo de no renovación anual

SEÑAL 11: Historial de freezes (peso 2%)
  - 2+ freezes en 12 meses → patrón de inestabilidad

SEÑAL 12: NPS / feedback negativo (peso 7%)
  - NPS <6 en última encuesta: +15 puntos
  - Reseña de clase negativa reciente: +5 puntos
```

### 3.2 Tabla de Acciones por Score

| Score  | Nivel      | Color       | Acción Inmediata                              | Responsable               |
| ------ | ---------- | ----------- | --------------------------------------------- | ------------------------- |
| 0–25   | Excelente  | 🟢 Verde    | Ninguna — celebrar logros en próximo contacto | ARIA (proactivo positivo) |
| 26–40  | Estable    | 🔵 Azul     | Check-in mensual de ARIA                      | ARIA automático           |
| 41–55  | Atención   | 🟡 Amarillo | Mensaje motivacional + oferta de cita         | ARIA + alerta trainer     |
| 56–70  | En Riesgo  | 🟠 Naranja  | Workflow de retención nivel 1, ARIA activa    | ARIA + trainer asignado   |
| 71–85  | Crítico    | 🔴 Rojo     | Workflow nivel 2, contacto telefónico ARIA    | ARIA + admin notificado   |
| 86–100 | Emergencia | ⚫ Negro    | Intervención humana directa + oferta especial | Dueño / Director          |

---

## 4. ASISTENTE VIRTUAL HUMANIZADO — ARIA

### 4.1 Identidad y Personalidad de ARIA

**ARIA** (Asistente Relacional Inteligente del Gym) es el nombre del asistente virtual. Cada gimnasio puede personalizar su nombre, género y tono de personalidad desde el panel de configuración.

**Perfil de personalidad base:**

```
Nombre:         ARIA (personalizable por el gym)
Género:         Femenino por defecto (configurable)
Tono:           Cálido, motivador, profesional, cercano
Idioma:         Español (con soporte multi-idioma configurable)
Vocabulario:    Inclusivo, positivo, orientado a logros
Nunca:          Culpabiliza, presiona, usa lenguaje agresivo de ventas
Siempre:        Usa el nombre del miembro, recuerda su objetivo, celebra sus avances
```

**Ejemplo de apertura de ARIA:**

> _"¡Hola, María! 💪 ¿Cómo estás hoy? Vi que hace 3 días que no has podido venir al gym. ¿Todo bien por tu lado? Recuerda que cada sesión te acerca más a tu meta de perder esos 8 kg antes de julio. Si necesitas ajustar tu horario o hablar con tu trainer Carlos, aquí estoy para ayudarte 😊"_

### 4.2 Capacidades Conversacionales de ARIA

#### 🗓️ Gestión de Citas (Conversacional)

```
ARIA puede — sin intervención humana:
  ✅ Agendar nueva cita en cualquier servicio disponible
  ✅ Consultar disponibilidad en tiempo real
  ✅ Confirmar cita agendada
  ✅ Modificar fecha/hora de cita existente
  ✅ Cancelar cita con política de cancelación explicada
  ✅ Reagendar automáticamente si el trainer cancela
  ✅ Enviar recordatorios previos (24h, 2h antes)
  ✅ Confirmar asistencia del miembro
  ✅ Pedir feedback post-cita
```

#### 💪 Soporte de Entrenamiento (Conversacional)

```
ARIA puede:
  ✅ Explicar qué entreno está programado para hoy
  ✅ Decir cuántas sesiones lleva el miembro en el mes
  ✅ Compartir el progreso hacia el objetivo
  ✅ Notificar cuando el trainer actualizó su rutina
  ✅ Responder qué músculos trabaja un ejercicio
  ✅ Explicar el plan nutricional activo
  ✅ Recordar tomar los suplementos a la hora indicada
  ✅ Enviar el resumen de la semana de entrenamiento
```

#### 🛒 Soporte de Servicios y Marketplace

```
ARIA puede:
  ✅ Informar sobre productos disponibles en el marketplace
  ✅ Guiar una compra completa por chat
  ✅ Informar el saldo de crédito disponible
  ✅ Notificar cuando un producto favorito tiene oferta
  ✅ Responder consultas sobre precios de membresías
  ✅ Explicar cómo funcionan los puntos de fidelidad
  ✅ Informar sobre clases especiales y eventos próximos
```

#### 🆘 Manejo de Quejas y Situaciones Difíciles

```
ARIA maneja (con escalada inteligente a humano):
  ✅ Recibir y registrar quejas formales
  ✅ Pedir disculpas genuinas y empáticas
  ✅ Informar el tiempo estimado de resolución
  ✅ Escalar automáticamente si detecta:
     - Palabras clave de frustración alta ("harto", "cancelar", "terrible", "exijo")
     - Score de sentimiento negativo < -0.6
     - 3+ mensajes consecutivos negativos
     - Solicitud explícita de hablar con humano
  ✅ Transferir con contexto completo al staff disponible
```

### 4.3 Motor de Personalización Contextual

ARIA adapta cada mensaje basándose en el contexto completo del miembro:

```javascript
// Contexto que ARIA usa en cada respuesta:
context = {
  member: {
    name: "María García",
    nickname: "Mari",           // si lo registró
    goal: "Perder 8 kg para julio",
    currentScore: 62,           // en riesgo
    daysSinceLastVisit: 3,
    currentPlan: "Plan Pérdida de Peso - Semana 6",
    completionRate: 0.36,       // 36% del plan completado
    lastSession: {
      date: "2026-06-07",
      duration: 45,             // minutos
      exercisesCompleted: 5,
      note: "Levantó 40kg en Hack Squat — nuevo PR!"
    },
    nextAppointment: {
      type: "Sesión PT con Carlos",
      datetime: "2026-06-11 09:00",
      confirmationStatus: "pendiente"
    },
    nutritionAdherence: 0.68,   // 68% del plan nutricional seguido
    loyaltyLevel: "Plata",
    points: 2340,
    preferredChannel: "whatsapp",
    preferredTime: "mañana",
    communicationHistory: [...]
  }
}
```

Con este contexto, ARIA genera mensajes únicos — **no templates**:

```
❌ Template genérico:
"Hola [NOMBRE], te echamos de menos en el gym. ¡Ven pronto!"

✅ Mensaje personalizado de ARIA:
"¡Buenos días, Mari! ☀️ El lunes hiciste un PR increíble en Hack Squat con 40kg
— ¿te imaginas lo que vas a lograr si mantienes el ritmo? 💪

Esta semana te quedan 2 sesiones para completar la Semana 6 de tu plan.
Con ese ritmo, en 9 semanas más estarías alcanzando tu objetivo 🎯

Carlos tiene disponibilidad el jueves a las 7am o el viernes a las 6pm para
tu próxima sesión personalizada. ¿Cuál te queda mejor? 😊"
```

### 4.4 Flujos de Conversación de ARIA

#### FLUJO 1: Contacto Inicial (Lead Nuevo)

```
ARIA detecta nuevo contacto (web/WhatsApp/redes)
  ↓
Saludo de bienvenida + presentación de ARIA
  ↓
Pregunta por el objetivo principal (respuesta con botones rápidos):
  [Perder peso] [Ganar músculo] [Definición] [Rendimiento] [Salud general]
  ↓
Captura: nombre, teléfono, email, horario disponible
  ↓
Presenta los servicios del gym relevantes a su objetivo
  ↓
Ofrece visita gratuita o trial
  ↓
Agenda la visita / trial → confirma → registra en CRM como lead calificado
  ↓
Envía recordatorio 24h y 2h antes de la visita
  ↓
Post-visita: ARIA hace seguimiento a las 4 horas
```

#### FLUJO 2: Onboarding de Nuevo Miembro (Primeras 72 horas)

```
Membresía activada (trigger automático)
  ↓
Hora 0: Mensaje de bienvenida personalizado + resumen de beneficios
  ↓
Hora 4: Invitación a completar el perfil en la app + link directo
  ↓
Día 1: ¿Cómo fue tu primera visita? + oferta de sesión de evaluación física
  ↓
Día 2: Agenda sesión de evaluación con trainer (ARIA gestiona la cita completa)
  ↓
Día 3: Post-evaluación: "¡Listo! Carlos te diseñó tu plan personalizado.
         Ya puedes verlo en la app 💪"
  ↓
Día 7: Primera semana completada — resumen de logros + siguiente meta
```

#### FLUJO 3: Check-in Motivacional Proactivo (Recurrente)

```
Frecuencia: configurable por el gym (sugerido: 2x/semana para miembros nuevos,
            1x/semana para activos regulares)
  ↓
ARIA revisa el contexto del miembro antes de enviar:
  - ¿Vino al gym en los últimos 2 días? → mensaje de celebración
  - ¿No ha venido en 2–3 días? → mensaje motivacional suave
  - ¿Está en racah de X días? → celebración de racha
  - ¿Cumple objetivo parcial esta semana? → refuerzo positivo
  - ¿Tiene cita próxima? → recordatorio + ánimo
  ↓
Genera mensaje personalizado con tono apropiado al estado
  ↓
Incluye SIEMPRE una micro-acción sugerida:
  → "¿Puedo ayudarte a agendar tu próxima sesión?"
  → "¿Quieres ver tu progreso de esta semana?"
  → "¿Hablamos de ajustar el horario de tus visitas?"
```

#### FLUJO 4: Gestión de Ausencia (Miembro Inactivo)

```
Trigger: Miembro no registra visita en X días (umbral configurable por segmento)
  ↓
DÍA 3 — Contacto empático:
"Hola [nombre], ¿todo bien? Notamos que llevas unos días sin pasar por aquí.
 A veces la vida se complica 😊 Sin presión, solo queríamos saber cómo estás.
 Si necesitas ajustar tu horario o algo del plan, aquí estamos 💪"
  ↓
Si responde: ARIA escucha la razón → adapta el mensaje → ofrece solución
Si no responde: continúa al día 5
  ↓
DÍA 5 — Resumen de progreso proyectado:
"[Nombre], calculamos que si retomas esta semana, podrías alcanzar [objetivo]
 en [X semanas]. Sin embargo, con el ritmo actual, se extendería a [Y semanas].
 Tu cuerpo recuerda cada esfuerzo que le has dado 💪 ¿Qué te dice tu corazón?"
  ↓
DÍA 7 — ARIA solicita llamada de voz humanizada:
"Hola [nombre], soy ARIA del Gym [nombre]. ¿Tienes 2 minutos para charlar?
 Quiero contarte algo sobre tu progreso que creo te va a motivar mucho 🎯"
  ↓
DÍA 10 — Alerta al trainer asignado + mensaje del trainer
  ↓
DÍA 14 — Oferta de rescate:
Sesión de re-evaluación gratuita / semana de freeze / descuento especial
Decisión del admin sobre qué ofrecer (configurable)
  ↓
DÍA 21 — Escalada a humano: admin o dueño contacta directamente
```

### 4.5 Tono y Lenguaje de ARIA por Situación

| Situación            | Tono                   | Ejemplo de Apertura                                     |
| -------------------- | ---------------------- | ------------------------------------------------------- |
| Celebración de logro | Eufórico, entusiasta   | "¡INCREÍBLE, [nombre]! 🎉🏆"                            |
| Check-in regular     | Cálido, amigable       | "¡Buenos días, [nombre]! ☀️"                            |
| Motivación suave     | Esperanzador, paciente | "Hola [nombre], solo pasaba a decirte que..."           |
| Rescate de inactivo  | Empático, sin presión  | "Oye [nombre], ¿todo bien por ahí? 😊"                  |
| Manejo de queja      | Serio, resolutivo      | "Entiendo perfectamente tu molestia, [nombre]..."       |
| Recordatorio de cita | Práctico, breve        | "¡Hola [nombre]! Solo un recordatorio de que mañana..." |
| Resumen de progreso  | Analítico, motivador   | "[Nombre], mira todo lo que has logrado este mes:"      |
| Post-cancelación     | Rescate, sin culpa     | "[Nombre], entendemos que hay momentos difíciles..."    |

---

## 5. SISTEMA DE AGENDAMIENTO & GESTIÓN DE CITAS

### 5.1 Tipos de Servicios Agendables

El catálogo de servicios se configura en el panel del administrador. Cada servicio tiene sus propios parámetros:

#### 🚲 Clases Grupales (Reserva por Slot)

```yaml
Servicio: Clase de Spinning
  tipo: clase_grupal
  duracion: 45 min
  capacidad_maxima: 20 personas
  instructor_requerido: true
  lista_de_espera: true (máx. 5 personas)
  politica_cancelacion:
    tiempo_minimo: 2 horas antes
    penalizacion_tardía: 1 no-show registrado
    cancelaciones_sin_penalizacion_mes: 2
  recordatorios: [24h_antes, 1h_antes]
  confirmacion_requerida: true (24h antes)
  modalidad: presencial | virtual | híbrido
  precio: incluido_en_membresia | precio_extra
  notas_adicionales: "Trae toalla y botella de agua"
```

```yaml
Servicio: Gimnasia Rítmica
  tipo: clase_grupal
  duracion: 60 min
  nivel_requerido: principiante | intermedio | avanzado
  equipo_necesario: "Aro, cinta o pelota (disponibles en el gym)"
  capacidad_maxima: 15 personas
  precio_extra: $5 por clase (si aplica)
```

```yaml
Servicio: Clase de Yoga
  tipo: clase_grupal
  duracion: 60 min
  capacidad_maxima: 15 personas
  modalidad: híbrido (presencial + streaming)
```

```yaml
Otros servicios grupales configurables:
  - Zumba / Baile fitness
  - CrossFit / HIIT
  - Pilates
  - Body Pump
  - Aqua Aeróbics (si hay piscina)
  - Meditación y Mindfulness
  - Artes Marciales / Boxing fitness
```

#### 🏋️ Entrenamiento Personalizado (PT Sessions)

```yaml
Servicio: Sesión PT — Fuerza & Potencia
  tipo: sesion_individual
  duracion: 60 min
  trainer_especifico: asignable por el admin o elegido por el miembro
  objetivo_sesion: fuerza | masa_muscular | perdida_peso | definicion | rehabilitacion
  evaluacion_inicial_requerida: true (primera sesión)
  notas_sesion: el trainer completa post-sesión (ejercicios, cargas, observaciones)
  frecuencia_sugerida: 2-3 veces por semana
  pack_disponible: packs de 8, 12 o 20 sesiones con precio especial
```

```yaml
Servicio: Sesión PT — Pérdida de Peso
Servicio: Sesión PT — Ganancia de Masa Muscular
Servicio: Sesión PT — Definición y Tonificación
Servicio: Sesión PT — Rehabilitación (con certificación requerida del trainer)
  → Cada uno con su protocolo, duración y notas específicas
```

#### 🥗 Servicios Nutricionales

```yaml
Servicio: Consulta Nutricional Inicial
  tipo: consulta_individual
  duracion: 60 min
  especialista: nutricionista asignado
  incluye: entrevista completa, análisis de hábitos, plan inicial
  requiere: ayuno 8h (ARIA recuerda al agendar), resultados de exámenes (si disponibles)
  frecuencia: primera vez → evaluación al mes → cada 2 meses

Servicio: Consulta Nutricional de Seguimiento
  tipo: consulta_individual
  duracion: 30 min
  incluye: revisión de adherencia, ajustes del plan, Q&A

Servicio: Taller de Nutrición Grupal
  tipo: taller
  duracion: 90 min
  capacidad: 20 personas
  temas: Macronutrientes, Suplementación, Nutrición pre/post-entreno
```

#### 🧘 Servicios de Bienestar Adicionales (Configurables)

```yaml
Servicio: Evaluación Física Completa
  duracion: 45 min
  incluye: bioimpedancia, medidas, test de fuerza y resistencia, VO2max estimado
  frecuencia_recomendada: cada 2 meses

Servicio: Masaje Deportivo
  duracion: 30 min | 60 min
  especialista: masajista / fisioterapeuta
  tipo: relajante | deportivo | recovery

Servicio: Sesión de Recuperación Activa
  tipo: sesión_guiada
  duracion: 30 min
  incluye: foam rolling, estiramientos guiados, movilidad

Servicio: Charla de Bienestar
  tipo: evento
  duracion: 60 min
  temas configurables por el admin
```

### 5.2 Flujo Completo de Agendamiento (vía ARIA)

```
USUARIO: "Quiero agendar una sesión de spinning para esta semana"
  ↓
ARIA:     Consulta disponibilidad en tiempo real del calendario
          "¡Claro, Mari! Tenemos clases de Spinning disponibles esta semana:
           📅 Martes 10/06 → 7:00am (4 lugares), 6:00pm (COMPLETA, 2 en espera)
           📅 Jueves 12/06 → 7:00am (8 lugares), 12:00pm (6 lugares)
           📅 Sábado 14/06 → 9:00am (3 lugares)
           ¿Cuál te queda mejor? 😊"
  ↓
USUARIO:  "El jueves a las 7"
  ↓
ARIA:     "¡Perfecto! Agendando...
           ✅ Clase de Spinning
           📅 Jueves 12 de junio a las 7:00am
           👨‍🏫 Instructor: Roberto Méndez
           📍 Sala de Clases B, Nivel 2

           Te enviaré un recordatorio mañana y el jueves a las 6am.
           Si necesitas cancelar, hazlo con al menos 2 horas de anticipación.

           ¡Ya tienes 3 clases agendadas esta semana! Vas muy bien 💪
           ¿Necesitas algo más?"
  ↓
SISTEMA:  Crea la cita en el calendario
          Registra la interacción en la bitácora
          Programa los recordatorios automáticos
          Actualiza la ocupación de la clase en tiempo real
          Notifica al instructor de la nueva reserva
```

### 5.3 Gestión de Citas — Todas las Operaciones

#### Agendar Nueva Cita

```
Canales: App / ARIA (WhatsApp, Telegram, chat) / Web / Recepción
Pasos:
  1. Seleccionar servicio
  2. Ver disponibilidad (ARIA muestra slots relevantes según historial)
  3. Elegir fecha y hora
  4. Confirmar datos (el miembro y trainer/instructor asignado)
  5. Confirmación automática por canal preferido
  6. Registro en calendario centralizado
  7. Programación automática de recordatorios
```

#### Modificar Cita Existente

```
USUARIO: "ARIA, necesito cambiar mi sesión del jueves"
  ↓
ARIA:   "Claro, veo tu sesión PT con Carlos el jueves 12/06 a las 9am.
         ¿La quieres mover a otro día/hora, o cancelarla?
         Carlos tiene disponibilidad el viernes a las 8am o lunes a las 7am.
         ¿Cuál te viene mejor?"
  ↓
PROCESO: Cancela la cita original (sin penalización si cumple política)
         Crea la nueva cita
         Notifica al trainer del cambio
         Actualiza calendario centralizado
         Envía confirmación de cambio al miembro
```

#### Cancelar Cita

```
ARIA maneja la cancelación con:
  1. Verificar si está dentro del período sin penalización
  2. Si está dentro: cancelar sin penalización + preguntar si reagendar
  3. Si está fuera: informar la penalización + preguntar si confirma cancelación
  4. Post-cancelación: ARIA ofrece inmediatamente una nueva fecha
  5. Registrar cancelación con motivo en la bitácora
  6. Si es cancelación recurrente (3+ en un mes): alerta al trainer asignado
```

#### Confirmar Cita (Recordatorio Inteligente)

```
SISTEMA envía recordatorio 24h antes:
  "¡Hola Mari! ⏰ Mañana tienes:
   🏋️ Sesión PT con Carlos
   📅 Jueves 12/06 · 9:00am
   📍 Área de Pesas, Planta Baja

   ¿Confirmas asistencia?
   [✅ Sí, ahí estaré] [📅 Necesito cambiar la hora] [❌ Debo cancelar]"

Al confirmar → registro en bitácora + notificación al trainer
Sin respuesta → recordatorio 2h antes (automatico)
```

---

## 6. CALENDARIO CENTRALIZADO DE SERVICIOS

### 6.1 Vistas del Calendario

#### Vista del Miembro (App)

```
Mis Citas Próximas:
  ┌─────────────────────────────────────────────────────────┐
  │ HOY · Martes 10 junio                                   │
  │  • Sin citas programadas                                │
  │                                                         │
  │ MAÑANA · Miércoles 11 junio                             │
  │  • 07:00 Spinning - Sala B - Roberto M.    [Confirmada] │
  │                                                         │
  │ JUEVES 12 junio                                         │
  │  • 09:00 Sesión PT - Carlos G.             [Confirmada] │
  │                                                         │
  │ VIERNES 13 junio                                        │
  │  • Sin citas                                            │
  │  [+ Agendar algo para el viernes]                       │
  │                                                         │
  │ SÁBADO 14 junio                                         │
  │  • 11:00 Consulta Nutricional - Dra. López [Pendiente]  │
  └─────────────────────────────────────────────────────────┘
```

#### Vista del Trainer (Panel Staff)

```
Mi Agenda — Carlos Gutiérrez (PT)
Semana del 10 al 16 de junio 2026

Lunes:    7:00 María García · 9:00 Pedro Ramírez · 11:00 Ana Torres
Martes:   7:00 Luis Moreno · LIBRE 9:00-11:00 · 12:00 Sandra Pérez
Miércoles: 7:00 [LIBRE] · 9:00 José Martínez · 11:00 Carmen Ruiz
Jueves:   7:00 [LIBRE] · 9:00 María García · 11:00 Roberto Sánchez
Viernes:  8:00 Ana Torres · 10:00 [LIBRE] · 12:00 Luis Moreno
```

#### Vista Administrativa (Panel Admin)

```
Ocupación de Servicios — Semana actual
┌───────────────┬──────┬──────┬──────┬──────┬──────┐
│ Servicio      │ Lun  │ Mar  │ Mié  │ Jue  │ Vie  │
├───────────────┼──────┼──────┼──────┼──────┼──────┤
│ Spinning 7am  │ 100% │  85% │  70% │  90% │  60% │
│ Spinning 6pm  │  95% │ 100% │  80% │ 100% │  75% │
│ Yoga 8am      │  60% │  —   │  55% │  —   │  65% │
│ PT - Carlos   │  85% │  70% │  60% │  80% │  50% │
│ PT - Laura    │  90% │  85% │  70% │  85% │  60% │
│ Nutrición     │  —   │  80% │  —   │  60% │  —   │
└───────────────┴──────┴──────┴──────┴──────┴──────┘
🔴 100%  🟠 >80%  🟡 >60%  🟢 <60%
```

### 6.2 Gestión de Capacidad y Listas de Espera

```
Lista de Espera Inteligente:
  1. Miembro solicita clase llena → ARIA lo coloca en waitlist automáticamente
  2. Al abrirse un lugar:
     - ARIA notifica al primer miembro en la lista
     - Tiene 15 minutos para confirmar (configurable)
     - Si no confirma → ARIA notifica al siguiente
  3. Si el lugar no se llena:
     - ARIA notifica a miembros con historial en esa clase que no asistieron esa semana
     - Mensaje: "Oye [nombre], ¡se liberó un lugar en Spinning de hoy a las 7pm! 🎉
                 ¿Te apunto? Tienes 10 minutos para confirmar 😊"
```

### 6.3 Reglas del Calendario (Configurables por Admin)

```yaml
reglas_globales:
  ventana_agendamiento_minima: 30 minutos antes # mínimo con qué antelación se puede agendar
  ventana_agendamiento_maxima: 30 días # máximo cuántos días en adelante
  max_citas_activas_por_miembro: 5 # citas simultáneas en estado pendiente
  recordatorio_1: 24 horas antes
  recordatorio_2: 2 horas antes
  confirmacion_requerida: true # si no confirma, se libera el slot

politica_cancelacion:
  tiempo_sin_penalizacion: 2 horas # cancelaciones libres de penalización
  penalizacion: registro_no_show # tipo de penalización
  max_no_shows_mes: 3 # tras el 3ro: restricción de reservas
  max_cancelaciones_tardias_mes: 2 # tras el 2do: alerta al staff

reglas_por_servicio:
  sesion_pt:
    ventana_cancelacion: 4 horas
    cobro_cancelacion_tardia: true
    monto_cobro: 50% del valor de la sesión
```

---

## 7. BITÁCORA DE INTERACCIONES (INTERACTION LOG)

### 7.1 Estructura de Cada Registro

Cada interacción con el miembro — sea iniciada por ARIA, por el staff o por el propio miembro — genera un registro completo en la bitácora:

```json
{
  "interaction_id": "INT-2026-06-10-001847",
  "member_id": "MBR-00421",
  "member_name": "María García Pérez",
  "timestamp": "2026-06-10T08:47:23Z",
  "timezone": "America/El_Salvador",

  "interaction": {
    "type": "outbound_automated",
    "channel": "whatsapp",
    "direction": "outbound",
    "initiated_by": "ARIA_system",
    "reason": "inactivity_3_days",
    "risk_score_at_time": 62,
    "workflow_id": "WF-RETENTION-LEVEL1",
    "workflow_step": 1
  },

  "message": {
    "content": "¡Buenos días, Mari! ☀️ Hace 3 días que no te vemos por aquí...",
    "format": "text",
    "language": "es",
    "sentiment_target": "empathetic_motivational",
    "call_to_action": "agenda_session"
  },

  "member_response": {
    "responded": true,
    "response_time_minutes": 14,
    "channel_responded": "whatsapp",
    "content": "Hola! Sí, estuve enferma 🤧 ya estoy mejor",
    "sentiment_score": 0.3,
    "sentiment_label": "neutral_positive",
    "detected_emotions": ["openness", "explanation"],
    "intent_detected": "explanation_absence",
    "keywords_extracted": ["enferma", "mejor"]
  },

  "aria_followup": {
    "generated": true,
    "response": "¡Qué bueno que ya te mejoraste! 😊 El cuerpo a veces necesita...",
    "action_taken": "rescheduled_next_contact_48h",
    "appointment_offered": true,
    "appointment_accepted": false
  },

  "outcome": {
    "status": "positive_response",
    "member_engaged": true,
    "risk_score_change": -8,
    "new_risk_score": 54,
    "appointment_created": false,
    "escalated_to_human": false,
    "follow_up_scheduled": "2026-06-12T09:00:00Z",
    "notes": "Miembro informó enfermedad reciente. Reducir frecuencia de contacto. Reagendar cuando confirme vuelta."
  },

  "staff_visibility": {
    "trainer_notified": false,
    "admin_notified": false,
    "visible_in_crm": true,
    "tags": ["enfermedad", "ausencia_justificada", "retención_nivel1"]
  }
}
```

### 7.2 Tipos de Interacciones Registradas

| Tipo                     | Código                 | Descripción                                 |
| ------------------------ | ---------------------- | ------------------------------------------- |
| Contacto inicial de lead | `LEAD_FIRST_CONTACT`   | Primera vez que un prospecto contacta       |
| Onboarding bienvenida    | `ONBOARD_WELCOME`      | Secuencia de bienvenida del nuevo miembro   |
| Check-in proactivo ARIA  | `ARIA_CHECKIN`         | Mensajes regulares de seguimiento           |
| Alerta de inactividad    | `RETENTION_ALERT`      | Contacto por ausencia detectada             |
| Agendamiento de cita     | `APPT_CREATED`         | Nueva cita agendada por cualquier canal     |
| Modificación de cita     | `APPT_MODIFIED`        | Cambio de fecha/hora/servicio               |
| Cancelación de cita      | `APPT_CANCELLED`       | Cita cancelada con motivo registrado        |
| Recordatorio enviado     | `REMINDER_SENT`        | Recordatorio automático previo a cita       |
| Confirmación de cita     | `APPT_CONFIRMED`       | Miembro confirma asistencia                 |
| Post-sesión feedback     | `POST_SESSION`         | Feedback después de cita o clase            |
| Queja/sugerencia         | `FEEDBACK_SUBMITTED`   | Registro de queja o sugerencia              |
| Escalada a humano        | `ESCALATED_HUMAN`      | Transferencia a staff                       |
| Resolución de queja      | `FEEDBACK_RESOLVED`    | Cierre de queja con satisfacción            |
| Actualización de plan    | `PLAN_UPDATED`         | Trainer actualizó rutina o plan nutricional |
| PR / Logro               | `ACHIEVEMENT_UNLOCKED` | Nuevo record personal u objetivo alcanzado  |
| Compra en marketplace    | `PURCHASE_MADE`        | Transacción en la tienda del gym            |
| Encuesta NPS             | `NPS_SURVEY`           | Resultado de encuesta de satisfacción       |
| Llamada de voz ARIA      | `VOICE_CALL`           | Llamada de voz del asistente virtual        |
| Comunicación social      | `SOCIAL_INTERACTION`   | Interacción desde red social vinculada      |

### 7.3 Dashboard de Bitácora (Panel Admin)

```
Vista Timeline del Miembro — María García

● 10/06 08:47  ARIA WhatsApp → Contacto retención (inactiva 3 días) · Score: 62
  └─ Respondió en 14 min: "Estuve enferma" · Score bajó a: 54

● 07/06 09:15  Sesión PT completada · Carlos Gutiérrez · 45 min
  └─ Nota trainer: "PR en Hack Squat 40kg 🎯 Excelente progreso"

● 05/06 18:00  Clase Spinning · Asistió ✅ · Calificación: ⭐⭐⭐⭐⭐

● 04/06 08:00  Reminder cita PT · WhatsApp · Confirmó asistencia ✅

● 03/06 11:23  ARIA WhatsApp → Check-in proactivo · Respondió positivamente
  └─ Agendó sesión PT para el 07/06

● 02/06 07:00  Check-in al gym · Sesión libre · 62 min

● 01/06 19:30  Compra marketplace · Proteína Whey 1kg · $45 · Crédito gym

[Ver más · Filtrar por tipo · Exportar período]
```

### 7.4 Análisis de Patrones Extraíbles de la Bitácora

```
ANÁLISIS AUTOMÁTICO DISPONIBLE:

1. Tiempo de respuesta promedio del miembro por canal
2. Canal de mayor engagement (donde más responde y más rápido)
3. Horario del día con mejor tasa de respuesta
4. Tipo de mensaje con mayor tasa de apertura/respuesta
5. Correlación: mensaje ARIA → visita al gym (siguiente 72h)
6. Correlación: tipo de clase → NPS más alto
7. Miembros que nunca responden a ARIA (detectar canal equivocado)
8. Eficacia de cada workflow de retención (% miembros recuperados)
9. Motivos más frecuentes de ausencia (de textos analizados por NLP)
10. Patrones de cancelación de citas (día, hora, servicio más cancelado)
11. Velocidad de escalada: tiempo promedio de lead → miembro activo
12. Tasa de conversión de no-shows a reagendamiento
```

---

## 8. CANALES DE COMUNICACIÓN INTEGRADOS

### 8.1 WhatsApp Business API

```yaml
Configuración:
  provider: Meta WhatsApp Business API
  numero_dedicado: número oficial del gym (con sello azul verificado)

Capacidades:
  - Mensajes de texto en formato markdown
  - Mensajes de audio (nota de voz de ARIA humanizada con TTS)
  - Imágenes (fotos de progreso, mapa del gym, foto del instructor)
  - Videos (demostraciones de ejercicios, resultados de transformación)
  - Documentos PDF (plan nutricional, rutina semanal, facturas)
  - Botones de respuesta rápida (máx. 3 opciones)
  - Listas de opciones (hasta 10 items — para selección de horarios)
  - Templates aprobados por Meta (para mensajes 24h+ sin respuesta previa)
  - Llamadas de voz (WhatsApp Call con ARIA)

Privacidad y cumplimiento:
  - Opt-in explícito requerido del miembro al registrarse
  - Opción de opt-out en cualquier momento: "STOP" o botón en app
  - Mensajes de marketing solo con template aprobado y opt-in activo
  - Datos no compartidos con Meta para entrenamiento de modelos
```

### 8.2 Telegram Bot

```yaml
Bot name: @[GymName]_ARIA_bot (configurable)

Comandos disponibles:
  /inicio    - Menú principal de ARIA
  /citas     - Ver mis citas y agendar nueva
  /progreso  - Ver mi progreso y métricas
  /rutina    - Ver mi plan de entrenamiento actual
  /nutricion - Ver mi plan nutricional
  /tienda    - Ir al marketplace
  /ayuda     - FAQ del gym
  /puntos    - Ver mis puntos de fidelidad
  /contacto  - Hablar con un humano

Funcionalidades especiales:
  - Teclado inline persistente para navegación rápida
  - Menú de contexto según el estado actual del miembro
  - Canal de noticias del gym (broadcast uno-a-muchos)
  - Grupos de reto/challenge (miembros en el mismo reto)
  - Bot de voz: ARIA puede enviar mensajes de audio en Telegram
```

### 8.3 Redes Sociales (Acceso con Consentimiento)

```yaml
Plataformas integradas (el miembro da acceso desde la app):
  Instagram Direct:
    - ARIA puede responder mensajes directos
    - Detecta comentarios del miembro en posts del gym
    - Puede enviar stories privadas de progreso al miembro
    - El miembro puede agendar citas directo desde un DM

  Facebook Messenger:
    - Bot ARIA disponible en el perfil del gym en Facebook
    - Integración con widget de Messenger en el sitio web del gym
    - Respuesta a comentarios en publicaciones del gym
    - Inicio de conversación desde anuncios de Facebook Ads

  TikTok / Twitter/X (solo lectura):
    - Detección de menciones del gym (@gymname)
    - Alertas al community manager si hay menciones negativas
    - No envío de mensajes privados (por restricciones de la plataforma)

Consentimiento y privacidad:
  - El miembro activa explícitamente cada red social en su perfil
  - Puede desactivar en cualquier momento
  - ARIA nunca publica en nombre del miembro
  - Las interacciones en redes se registran en la bitácora con tag "social"
```

### 8.4 Llamadas de Voz con ARIA

```yaml
Motor de voz:
  TTS (Text-to-Speech): ElevenLabs / Azure Speech / Google Cloud TTS
  Voz: femenina, neutra, cálida (configurable por el gym)
  Idioma principal: Español (Latinoamérica)

Tipos de llamada:
  1. Llamada de retención (ARIA inicia):
    - Script generado dinámicamente basado en el perfil del miembro
    - Duración objetivo: 2–3 minutos
    - Capacidad de respuesta: ARIA entiende respuestas simples (sí/no, números)
    - Si la conversación se complica → transferencia inmediata a humano

  2. Llamada de confirmación de cita (ARIA inicia):
    - 'Hola [nombre], llamo para confirmar su cita de mañana...'
    - Detecta respuesta: confirma / cancela / pide cambio
    - Actualiza el sistema según la respuesta

  3. Llamada de bienvenida (post registro):
    - Configuración opcional del gym
    - ARIA da la bienvenida y presenta los servicios clave

  Infraestructura:
    Provider: Twilio Voice + ElevenLabs
    Grabación: opcional, con consentimiento del miembro
    Transcripción: automática → almacenada en bitácora
```

### 8.5 Email Inteligente

```yaml
Tipos de email enviados:
  Transaccionales (siempre):
    - Confirmación de membresía / bienvenida
    - Confirmación de cita (con botones de acción)
    - Factura de cobro
    - Cambio de contraseña
    - Confirmación de compra en marketplace

  Motivacionales (opt-in):
    - Resumen semanal de progreso (personalizado)
    - Plan nutricional semanal en PDF adjunto
    - Reporte mensual de logros (diseño visual tipo informe)
    - Newsletter del gym (tips, recetas, noticias)

  Retención (según Risk Score):
    - "Te echamos de menos" (inactivos 5+ días)
    - "Mira cuánto has logrado" (con datos reales)
    - "Oferta especial para ti" (basada en Risk Score crítico)

  Diseño:
    - Templates HTML responsivos (mobile-first)
    - Personalización de nombre, objetivo, métricas en cada email
    - Botones de CTA dinámicos según el contexto
    - Píxel de apertura para tracking
    - UTM automáticos para analytics
```

---

## 9. WORKFLOWS AUTOMATIZADOS DE RETENCIÓN

### 9.1 Biblioteca de Workflows

#### WF-001: Bienvenida Completa (Onboarding)

```
Trigger: Nuevo miembro registrado
Duración: 7 días
Pasos:
  H+0:  WhatsApp — Bienvenida calurosa + link a la app
  H+4:  Email — Bienvenida formal + resumen de beneficios + tutorial app
  D+1:  WhatsApp — "¿Cómo fue tu primer día?" + oferta de evaluación física
  D+2:  WhatsApp — Agenda sesión de evaluación con trainer
  D+4:  App Push — "Tu plan personalizado está casi listo!"
  D+5:  WhatsApp — Plan de rutina listo + cómo usarlo
  D+7:  Email — "Tu primera semana: resumen de logros" + invitación a clase grupal
```

#### WF-002: Cumpleaños del Miembro

```
Trigger: Día del cumpleaños
  D-3:  Email — "Tu cumpleaños se acerca!" + gift card de puntos (monto configurable)
  D-0:  WhatsApp — Felicitación personalizada de ARIA + beneficio especial del día
        App Push — Notificación de celebración en la app
  D+1:  Email — Recordatorio de usar el beneficio (si no lo hizo)
```

#### WF-003: Logro de Objetivo Alcanzado

```
Trigger: Métricas alcanzan la meta declarada
  Inmediato: WhatsApp — ARIA celebra el logro con entusiasmo máximo
             App Push — Notificación de medalla + puntos especiales
  D+1:  Email — "Tu historia de transformación" + invitación al blog
        Alerta admin — Para posible testimonial / foto transformación
  D+3:  WhatsApp — "¿Cuál será tu próximo objetivo?" + propuesta de nueva meta
```

#### WF-004: Retención Nivel 1 (Inactividad 3–7 días)

```
Trigger: Sin check-in en 3 días (para miembro con frecuencia habitual alta)
  D+3:  WhatsApp — Mensaje empático de ARIA (sin presión)
  D+5:  Email — Resumen de progreso proyectado (datos reales)
  D+5:  WhatsApp — Seguimiento si no respondió D+3
  D+7:  WhatsApp Voice Note — ARIA envía audio motivacional de 30 seg
  D+7:  Alerta trainer en panel — para seguimiento personalizado
```

#### WF-005: Retención Nivel 2 (Inactividad 7–14 días)

```
Trigger: Sin check-in en 7 días
  D+7:  WhatsApp — "Queremos ayudarte a retomar" + oferta de sesión gratuita
  D+8:  Llamada de voz ARIA — conversación de 2–3 min
  D+9:  Email — "Lo que te estás perdiendo" con tu progreso proyectado
  D+11: WhatsApp — Mensaje del trainer asignado (manual o auto-generado)
  D+14: Oferta especial: freeze gratis / sesión PT / descuento
```

#### WF-006: Retención Crítica (14+ días / Pre-Cancelación)

```
Trigger: Risk Score >80 O solicitud de cancelación iniciada
  D+0:  Inmediato: alerta al admin y dueño en panel ejecutivo
  D+0:  WhatsApp — ARIA: "Antes de que te vayas, queremos hablar contigo"
  D+1:  Llamada de voz ARIA — script de rescate empático con oferta especial
  D+2:  Email — Oferta personalizada de retención (plan de pago, freeze, beneficio)
  D+3:  WhatsApp — "Solo queremos saber si podemos mejorar algo para ti"
  D+5:  Contacto humano directo (trainer o admin) — ARIA prepara el contexto completo
```

#### WF-007: Win-Back (Ex-Miembro Cancelado)

```
Trigger: Membresía cancelada hace 30 / 60 / 90 días
  D+30: Email — "Te extrañamos" + resumen de lo que ha mejorado el gym
  D+60: WhatsApp — Oferta de regreso especial (primer mes reducido)
  D+90: Email final — Última oferta + invitación a eventos gratuitos
  D+180: Solo email de noticias (si no opt-out) para mantener presencia
```

#### WF-008: Renovación Anual (Pre-Vencimiento)

```
Trigger: 30 días antes del vencimiento de membresía anual
  D-30: Email — "Tu membresía vence en 30 días" + beneficios de renovación anticipada
  D-15: WhatsApp — Recordatorio + oferta de renovación con descuento por anticipar
  D-7:  App Push + WhatsApp — "Quedan 7 días" + resumen del año (logros, sesiones, etc.)
  D-3:  WhatsApp — Última oportunidad de descuento
  D-0:  WhatsApp — "Hoy vence tu membresía" + link de pago directo
  D+3:  Si no renovó → inicia WF-005
```

### 9.2 Editor de Workflows (Panel Admin)

El administrador tiene un editor visual de workflows donde puede:

```
✅ Ver todos los workflows activos y sus métricas (tasa de éxito, pasos con mayor respuesta)
✅ Crear nuevos workflows con editor drag-and-drop
✅ Editar el contenido de los mensajes (ARIA regenera el tono automáticamente)
✅ Cambiar los tiempos entre pasos
✅ Activar / desactivar workflows por segmento
✅ A/B testing: 2 versiones de un mensaje → el sistema mide cuál convierte mejor
✅ Ver el miembro individual en qué paso de qué workflow se encuentra
✅ Intervenir manualmente en cualquier punto (pausar ARIA para ese miembro)
```

---

## 10. ANÁLISIS DEL COMPORTAMIENTO DEL CLIENTE

### 10.1 Métricas de Comportamiento por Miembro

El sistema analiza y expone estas métricas para cada miembro en su ficha CRM:

```
ENGAGEMENT SCORE (0-100):
  Componentes: asistencia + respuesta a ARIA + interacciones en app + feedback + compras
  Tendencia: gráfica de los últimos 90 días (subiendo / estable / bajando)

PATRÓN DE VISITAS:
  - Días y horarios habituales (distribución tipo heatmap)
  - Duración promedio de cada visita
  - Consistencia del patrón (irregular / regular / muy regular)
  - Comparativa: patrón actual vs. patrón de hace 30 días

RECEPTIVIDAD A COMUNICACIONES:
  - Tasa de apertura de emails: X%
  - Tasa de respuesta a WhatsApp: X%
  - Tiempo promedio de respuesta: X minutos
  - Canal con mejor receptividad: WhatsApp / Email / Telegram
  - Horario de mayor receptividad: 8–9am / 12–1pm / 7–9pm

COMPORTAMIENTO DE CITAS:
  - Tasa de cumplimiento: citas completadas / citas agendadas = X%
  - Tasa de cancelación oportuna: X%
  - Tasa de no-shows: X%
  - Tipo de servicio con mayor adherencia
  - Patrón de cancelaciones (¿siempre un día específico? ¿siempre el mismo servicio?)

PERFIL DE COMPRA (Marketplace):
  - Categorías preferidas
  - Ticket promedio por compra
  - Frecuencia de compra
  - Uso de crédito vs. pago directo
  - Respuesta a ofertas (¿compra más cuando hay descuento?)
```

### 10.2 Análisis de Sentimiento de Interacciones

```
Para cada mensaje de texto recibido del miembro, el sistema ejecuta:

NLP SENTIMENT ANALYSIS:
  - Score de sentimiento: -1.0 (muy negativo) a +1.0 (muy positivo)
  - Emociones detectadas: alegría / tristeza / enojo / frustración / motivación / neutro
  - Intent detection: queja / consulta / cancelación / agradecimiento / solicitud

CAMBIO DE PATRÓN DE SENTIMIENTO:
  Si el promedio de sentimiento de los últimos 5 mensajes cae >0.3 puntos
  → Alerta automática en el CRM: "Cambio de tono detectado en [nombre]"
  → ARIA ajusta su tono a más empático y menos comercial

PALABRAS CLAVE DE RIESGO (alertas inmediatas):
  Cancelar / no voy a renovar / muy caro / mala atención / harto/a / decepcionado/a
  → Activación inmediata de WF-006 (Retención Crítica)
  → Alerta al admin en tiempo real
```

### 10.3 Reportes de Comportamiento Grupal

```
REPORTE: Análisis de Motivos de Inactividad (mensual)
  - Top 5 razones detectadas en respuestas a ARIA
  - % "enfermedad", % "trabajo", % "viaje", % "desmotivación", % "sin respuesta"
  - Comparativa vs. mes anterior
  → Acción: si "desmotivación" > 20%, revisar variedad de clases o planes

REPORTE: Efectividad de Workflows de Retención
  - Para cada workflow: Miembros en proceso / % completaron todo el flujo / % volvieron al gym
  - Paso con mayor caída (donde los miembros dejan de responder)
  - Canal con mayor tasa de éxito en retención
  → Permite optimizar continuamente los mensajes y tiempos

REPORTE: Patrones de Cancelación de Citas
  - Servicio con más cancelaciones
  - Instructor con más cancelaciones (puede indicar problema de servicio)
  - Día/hora con más cancelaciones de último momento
  → Permite ajustar políticas y capacidad

REPORTE: Comportamiento por Cohorte de Ingreso
  - Miembros que ingresaron el mismo mes: ¿cómo evolucionó su retención?
  - Comparativa de cohortes: ¿qué mes tuvo mejor retención a 6 meses?
  - Correlación: método de captación → LTV (¿los de referidos duran más?)
```

---

## 11. PANEL CRM PARA STAFF & ADMIN

### 11.1 Vista del Trainer

```
Mi Dashboard — Carlos Gutiérrez

📊 MIS CLIENTES ACTIVOS: 18 miembros
   🔴 En Riesgo: 3  [Ver lista]
   🟡 Atención: 4   [Ver lista]
   🟢 Bien: 11

📅 MIS CITAS HOY:
   07:00 María García — PT Fuerza ✅ Confirmada
   09:00 Pedro Ramírez — PT Pérdida de Peso 🔄 Pendiente confirmación
   11:00 Ana Torres — Evaluación Física ✅ Confirmada

📝 PENDIENTES:
   • Actualizar notas de sesión de María G. (ayer)
   • Revisar plan semanal de Luis M. (vence en 3 días)
   • Responder mensaje de Sandra P. (esperando 4h)

💬 ACTIVIDAD RECIENTE DE MIS CLIENTES:
   María G.: ARIA la contactó hace 2h — respondió positivamente
   Pedro R.: Sin visita en 5 días — riesgo amarillo
   Ana T.: Agendó clase de yoga extra esta semana 🌟
```

### 11.2 Vista del Recepcionista

```
Dashboard Recepción — Turno Mañana

CHECK-INS HOY: 47 registrados hasta ahora
PRÓXIMAS CLASES:
  09:00 Yoga — 12/15 confirmados · 3 en lista de espera
  10:00 Spinning — 18/20 confirmados · ARIA enviando recordatorios

CITAS HOY QUE REQUIEREN ATENCIÓN:
  • José Martínez — Consulta Nutricional 11am — no confirmó → ARIA ya envió recordatorio
  • Carmen Ruiz — Llegó sin cita — verificar disponibilidad trainer

LEADS DEL DÍA:
  • 2 leads nuevos vía WhatsApp — ARIA en proceso de calificación
  • 1 visita de trial agendada para las 3pm — preparar recibimiento
```

### 11.3 Vista del Admin / Dueño

```
PANEL CRM — Resumen Ejecutivo

📊 ESTADO DE RETENCIÓN HOY:
   ⚫ Emergencia (Score 86-100): 2 miembros  [ACCIÓN REQUERIDA]
   🔴 Críticos (71-85): 8 miembros
   🟠 En Riesgo (56-70): 15 miembros
   🟡 Atención (41-55): 23 miembros
   🟢 Estables (0-40): 187 miembros

💬 ACTIVIDAD DE ARIA HOY:
   Mensajes enviados: 47
   Respuestas recibidas: 31 (66% tasa de respuesta)
   Citas agendadas por ARIA: 8
   Escaladas a humano: 2
   Workflows activos: 34 miembros en algún workflow

📅 CALENDARIO HOY:
   Clases: 6 programadas · 89% ocupación promedio
   PT Sessions: 22 confirmadas · 3 pendientes
   Consultas Nutrición: 4 confirmadas
   Lista de espera activa: 7 personas en 3 clases

⚠️ ALERTAS:
   → Pedro Vásquez: solicitud de cancelación detectada — WF-006 activo
   → Clase Spinning 6pm: 100% de capacidad, 5 en lista de espera
   → Trainer Carlos G.: reportó enfermedad — 3 sesiones sin cobertura
```

---

## 12. MEJORAS ADICIONALES & FUNCIONES SORPRESA

### 12.1 🎙️ ARIA Voice Cloning (Ultra-Personalización)

> El gym puede grabar la voz de su propio instructor estrella o nutricionista, entrenar un modelo de voz con ElevenLabs, y tener a ARIA hablar con la voz reconocida de ese profesional para los miembros que lo tienen asignado.

_El miembro recibe una llamada de voz que suena exactamente como su trainer Carlos — aunque sea ARIA quien genera el contenido._

### 12.2 📸 ARIA Analiza Fotos de Progreso

> Cuando el miembro sube una foto de progreso (frente, perfil, dorso), ARIA puede usar visión por computadora para:
>
> - Detectar cambios visibles en composición corporal vs. foto anterior
> - Generar un comentario motivacional específico ("Noto que tu postura ha mejorado mucho")
> - Sugerir ángulos o iluminación para mejor comparativa futura

_(Con disclaimer claro de que es estimación visual, no diagnóstico médico)_

### 12.3 🧠 Detección de "Vida Real" (Life Event Detection)

> ARIA analiza el texto de los mensajes del miembro para detectar eventos de vida relevantes que explican inactividad y permiten respuestas ultra-empáticas:

| Patrón Detectado                            | Categoría           | Respuesta de ARIA                              |
| ------------------------------------------- | ------------------- | ---------------------------------------------- |
| "estoy de viaje" / "fuera de la ciudad"     | Viaje               | Sugiere workout sin equipo para el viaje       |
| "tuve un bebé" / "estoy embarazada"         | Maternidad          | Información sobre rutinas postparto / prenatal |
| "perdí el trabajo" / "problemas económicos" | Situación económica | Plan de pausa / opciones de pago flexible      |
| "me operé" / "estoy en recuperación"        | Salud               | Derivación a trainer de rehabilitación         |
| "perdí a alguien" / "duelo"                 | Pérdida personal    | Máxima empatía, zero presión, presencia        |
| "nuevo trabajo" / "más ocupado"             | Cambio de rutina    | Propuesta de nuevo horario adaptado            |

### 12.4 🤝 "Buddy Matching" — Compañero de Entreno

> ARIA puede sugerir a dos miembros que podrían entrenar juntos, basándose en:
>
> - Objetivo similar (ambos quieren ganar masa muscular)
> - Nivel fitness compatible
> - Horario de visita coincidente
> - Ambos han expresado querer motivación externa
>
> Con consentimiento de ambos, ARIA los presenta:
> _"Hola Carlos, te presento a Miguel. Ambos entrenan los martes y jueves a las 7am y tienen objetivos similares. ¿Les gustaría probar una sesión juntos? 💪"_

### 12.5 📊 "Cápsula del Tiempo" — Reporte de Transformación

> Cada 3 meses, ARIA genera automáticamente un **Reporte de Transformación Visual** del miembro:
>
> - Comparativa de fotos de progreso
> - Evolución de todas las métricas con gráficas
> - Cargas levantadas mes 1 vs. mes 3
> - Adherencia al plan nutricional
> - Logros desbloqueados en el período
> - Mensaje personalizado del trainer y de ARIA
> - PDF descargable y compartible
>
> _Este reporte es extremadamente viral en redes sociales cuando el miembro lo comparte_

### 12.6 ⚡ "Modo Urgente" para ARIA

> Cuando un miembro responde a ARIA a altas horas de la noche o en fin de semana con señales de angustia o crisis, el sistema tiene un modo de respuesta especial:
>
> - Detecta sentimiento muy negativo en horarios atípicos
> - Responde con empatía máxima inmediata
> - Ofrece recursos de apoyo si detecta palabras relacionadas con bienestar emocional grave
> - Alerta discreta al admin al día siguiente con contexto

### 12.7 🌡️ Predictor de "Luna de Miel Terminada"

> El riesgo más alto de cancelación ocurre en el mes 2–3 (fin del entusiasmo inicial). El sistema:
>
> - Activa automáticamente un "WF Anti-Luna de Miel" en la semana 6 de membresía
> - Introduce variedad: ofrece clase diferente, nuevo reto, introducción a un servicio aún no probado
> - ARIA dice: _"Mari, llevas 6 semanas y tu progreso es increíble. Pero sé que a veces la rutina puede aburrir un poco. ¿Probamos algo nuevo esta semana? 😊"_

### 12.8 📱 Widget "ARIA en tu WhatsApp" para el Gym (Modo Staff)

> Los trainers y el staff pueden tener ARIA como asistente interno de WhatsApp:
>
> - "ARIA, ¿cuándo es la próxima cita de María García?"
> - "ARIA, resume el historial de interacciones de Pedro Ramírez"
> - "ARIA, envíale un mensaje motivacional a los miembros en riesgo de hoy"
> - "ARIA, ¿qué clases tienen baja ocupación esta semana?"

### 12.9 🎯 "Micro-Compromisos" de ARIA (Habit Stacking)

> ARIA no solo agenda citas — crea mini-compromisos con el miembro para mantener el momentum:
>
> - "Mari, ¿a qué hora vas a ir mañana? Dime una hora y yo te pongo el despertador en la app"
> - Al día siguiente a esa hora: "¡Buenos días! Son las 6:30am, es tu momento 💪 ¿Vamos?"
> - Si fue: "¡Lo hiciste! ¿A qué hora irás pasado mañana?"
> - _Psicología de habit stacking: compromisos verbales + seguimiento = 40% más adherencia_

### 12.10 🔄 Integración con Google Calendar / Apple Calendar

> Las citas del gym se sincronizan automáticamente al calendario personal del miembro:
>
> - Al agendar una cita vía ARIA → opción de "Agregar a mi Google Calendar"
> - Con recordatorio integrado al calendario personal
> - El miembro no puede "olvidarse" — aparece en su agenda diaria

---

## 13. ARQUITECTURA TÉCNICA DEL MÓDULO

### 13.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE CANALES (Input/Output)               │
│  WhatsApp API │ Telegram Bot │ Instagram DM │ FB Messenger      │
│  Voice (Twilio) │ Email (SendGrid) │ App Push (FCM) │ Web Chat  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                  CAPA DE ORQUESTACIÓN (ARIA Engine)             │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ NLP Engine  │  │ Context Mgr  │  │ Response Generator  │    │
│  │ (Sentiment) │  │ (Member State│  │ (LLM + Templates)   │    │
│  │ (Intent)    │  │  + History)  │  │ (Tone Adapter)      │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ Risk Engine │  │ Workflow     │  │ Appointment         │    │
│  │ (Score Calc)│  │ Orchestrator │  │ Manager             │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    CAPA DE DATOS                                │
│                                                                 │
│  PostgreSQL (CRM Core)  │  Redis (Cache + Real-time)           │
│  Interaction Log        │  Elasticsearch (Búsqueda + Analytics) │
│  Calendar DB            │  Vector DB (RAG + Semantic Search)    │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Stack Tecnológico Específico del Módulo

| Componente         | Tecnología                                      | Justificación                                |
| ------------------ | ----------------------------------------------- | -------------------------------------------- |
| LLM para ARIA      | Claude claude-sonnet-4-20250514 (Anthropic API) | Mejor tono empático, instrucciones complejas |
| NLP / Sentiment    | Google Natural Language API                     | Precisión en español latinoamericano         |
| TTS Voz ARIA       | ElevenLabs (voz clonada) o Google WaveNet       | Calidad natural en español                   |
| STT (Voz a Texto)  | OpenAI Whisper                                  | Mejor precisión en español con ruido         |
| WhatsApp           | Meta Cloud API (Business)                       | Oficial, escalable, sin terceros             |
| Telegram           | Bot API (nativa)                                | Gratuita, sin intermediarios                 |
| Voz Telefónica     | Twilio Programmable Voice                       | Estándar de industria                        |
| Email              | SendGrid (Twilio)                               | Entregabilidad, templates, analytics         |
| Push Notifications | Firebase Cloud Messaging                        | Gratuito, confiable, iOS + Android           |
| Calendar Sync      | Google Calendar API + Apple EventKit            | Cobertura total de usuarios                  |
| Task Queue         | Bull (Redis-based) + Node.js                    | Workflows asincrónicos confiables            |
| Real-time          | Socket.io                                       | Panel admin en tiempo real                   |

### 13.3 Seguridad y Privacidad

```yaml
Datos personales:
  - Encriptación AES-256 en reposo para todos los datos del miembro
  - TLS 1.3 en tránsito en todos los canales
  - PII (datos personales identificables) separados en tablas aisladas
  - Anonimización automática para reportes agregados

Cumplimiento:
  - GDPR: derecho al olvido (eliminación completa en <30 días), portabilidad de datos
  - CCPA: aplicable si gym tiene miembros en California
  - Consentimiento explícito documentado para cada canal de comunicación
  - Logs de auditoría: quién accedió a qué datos de qué miembro y cuándo

Retención de datos:
  - Datos de miembros activos: indefinido
  - Datos de ex-miembros: 2 años desde cancelación (configurable)
  - Grabaciones de voz: 90 días (con consentimiento)
  - Logs de interacción: 3 años (para análisis de comportamiento)
```

---

## 14. MODELO DE DATOS

### 14.1 Entidades Principales

```sql
-- Tabla central del miembro
CREATE TABLE members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID REFERENCES gyms(id),
  -- Identidad
  first_name            VARCHAR(100) NOT NULL,
  last_name             VARCHAR(100) NOT NULL,
  nickname              VARCHAR(50),
  date_of_birth         DATE,
  gender                VARCHAR(20),
  profile_photo_url     TEXT,
  -- Contacto
  phone_primary         VARCHAR(20),
  phone_secondary       VARCHAR(20),
  email_primary         VARCHAR(150) UNIQUE,
  email_secondary       VARCHAR(150),
  address               JSONB,  -- {street, city, state, zip}
  emergency_contact     JSONB,  -- {name, relation, phone}
  occupation            VARCHAR(100),
  -- Membresía
  membership_type_id    UUID REFERENCES membership_types(id),
  membership_status     VARCHAR(20) DEFAULT 'active',  -- active/frozen/trial/expired/cancelled
  membership_start      DATE,
  membership_end        DATE,
  trainer_id            UUID REFERENCES staff(id),
  nutritionist_id       UUID REFERENCES staff(id),
  -- Objetivos
  primary_goal          VARCHAR(50),  -- weight_loss/muscle_gain/definition/...
  goal_target           JSONB,        -- {metric, value, unit, target_date}
  fitness_level         VARCHAR(20),  -- beginner/intermediate/advanced
  -- Comunicación
  preferred_channel     VARCHAR(20) DEFAULT 'whatsapp',
  preferred_time        VARCHAR(20),  -- morning/afternoon/evening
  comm_opt_ins          JSONB,        -- {reminders:true, marketing:true, ...}
  -- Social channels (encrypted)
  social_channels       JSONB,        -- {whatsapp:"+503...", telegram:"@user", ...}
  -- CRM
  lead_source           VARCHAR(50),
  risk_score            INTEGER DEFAULT 0,
  risk_updated_at       TIMESTAMP,
  loyalty_level         VARCHAR(20) DEFAULT 'bronze',
  loyalty_points        INTEGER DEFAULT 0,
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Calendario y citas
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID REFERENCES gyms(id),
  member_id             UUID REFERENCES members(id),
  service_id            UUID REFERENCES services(id),
  staff_id              UUID REFERENCES staff(id),  -- trainer/instructor/nutritionist
  -- Tiempo
  scheduled_at          TIMESTAMP NOT NULL,
  duration_minutes      INTEGER NOT NULL,
  ends_at               TIMESTAMP GENERATED ALWAYS AS (scheduled_at + (duration_minutes || ' minutes')::interval) STORED,
  -- Estado
  status                VARCHAR(20) DEFAULT 'pending',  -- pending/confirmed/completed/cancelled/no_show
  confirmation_sent_at  TIMESTAMP,
  confirmed_at          TIMESTAMP,
  confirmed_by          VARCHAR(20),  -- member/staff/auto
  -- Cancelación
  cancelled_at          TIMESTAMP,
  cancellation_reason   TEXT,
  cancellation_by       VARCHAR(20),
  late_cancellation     BOOLEAN DEFAULT FALSE,
  -- Post-sesión
  completed_at          TIMESTAMP,
  session_notes         TEXT,         -- notas del trainer post-sesión
  member_rating         SMALLINT,     -- 1-5
  member_feedback       TEXT,
  -- Agendado por
  booked_via            VARCHAR(20),  -- app/aria/web/reception
  booked_by_aria        BOOLEAN DEFAULT FALSE,
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Bitácora de interacciones
CREATE TABLE interaction_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID REFERENCES gyms(id),
  member_id             UUID REFERENCES members(id),
  -- Clasificación
  interaction_type      VARCHAR(50) NOT NULL,  -- ver tabla de tipos
  direction             VARCHAR(10) NOT NULL,  -- inbound/outbound
  initiated_by          VARCHAR(20),           -- aria/staff/member/system
  channel               VARCHAR(20) NOT NULL,  -- whatsapp/telegram/email/voice/app/...
  -- Contexto
  risk_score_at_time    INTEGER,
  workflow_id           VARCHAR(50),
  workflow_step         INTEGER,
  -- Contenido
  message_content       TEXT,        -- encriptado para mensajes personales
  message_format        VARCHAR(20), -- text/audio/video/document
  -- Respuesta del miembro
  member_responded      BOOLEAN DEFAULT FALSE,
  response_time_min     INTEGER,
  response_content      TEXT,        -- encriptado
  sentiment_score       DECIMAL(3,2),
  sentiment_label       VARCHAR(30),
  intent_detected       VARCHAR(50),
  -- Outcome
  outcome_status        VARCHAR(30), -- positive/neutral/negative/escalated
  risk_score_change     INTEGER,
  appointment_created   UUID REFERENCES appointments(id),
  escalated_to_human    BOOLEAN DEFAULT FALSE,
  escalated_to_staff_id UUID REFERENCES staff(id),
  follow_up_scheduled   TIMESTAMP,
  notes                 TEXT,
  tags                  TEXT[],
  -- Metadata
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Servicios configurables del gym
CREATE TABLE services (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID REFERENCES gyms(id),
  name                  VARCHAR(100) NOT NULL,
  service_type          VARCHAR(30),    -- group_class/pt_session/consultation/workshop/...
  description           TEXT,
  duration_minutes      INTEGER NOT NULL,
  max_capacity          INTEGER,        -- null = individual (PT, consulta)
  requires_staff        BOOLEAN DEFAULT TRUE,
  price                 DECIMAL(10,2),  -- null = included in membership
  is_included_in_membership BOOLEAN DEFAULT TRUE,
  cancellation_window_hours INTEGER DEFAULT 2,
  late_cancellation_penalty VARCHAR(30),  -- no_show_flag/charge_50pct/...
  allows_waitlist       BOOLEAN DEFAULT TRUE,
  waitlist_max          INTEGER DEFAULT 5,
  reminder_before_hours INTEGER[],      -- [24, 2] = recordatorios 24h y 2h antes
  requires_confirmation BOOLEAN DEFAULT TRUE,
  confirmation_deadline_hours INTEGER DEFAULT 12,
  notes_for_member      TEXT,    -- "Trae toalla y botella de agua"
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- Risk Score History (para análisis de tendencia)
CREATE TABLE member_risk_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id         UUID REFERENCES members(id),
  score             INTEGER NOT NULL,
  score_breakdown   JSONB,  -- {signal_1: 15, signal_2: 8, ...}
  calculated_at     TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CONFIGURACIÓN INICIAL DEL GYM

### Checklist de Configuración del Módulo CRM + ARIA

```
CONFIGURACIÓN BASE:
□ Nombre y personalidad de ARIA (nombre, género, tono)
□ Idioma(s) de comunicación soportados
□ Logo y foto de perfil para WhatsApp Business
□ Número de WhatsApp Business configurado y verificado
□ Bot de Telegram configurado (@nombre_bot)
□ Plantillas de WhatsApp aprobadas por Meta (transaccionales + retención)

CANALES:
□ WhatsApp Business API: token de acceso, webhook configurado
□ Telegram Bot API: token configurado
□ Email (SendGrid): dominio verificado, templates configurados
□ Twilio Voice: número de teléfono para llamadas
□ ElevenLabs: voz de ARIA configurada y probada
□ Firebase: proyecto configurado para push notifications

SERVICIOS DEL GYM:
□ Catálogo de servicios cargado (todos los servicios agendables)
□ Horarios de disponibilidad de cada servicio
□ Staff asignado a cada tipo de servicio
□ Precios y políticas de cancelación configuradas
□ Capacidades máximas y listas de espera configuradas

WORKFLOWS:
□ WF-001 Bienvenida: mensajes personalizados con el nombre del gym
□ WF-004/005/006 Retención: umbrales de días configurados por segmento
□ WF-008 Renovación: ajustar tiempos según política del gym
□ Workflows ad-hoc según servicios especiales del gym

CRM:
□ Segmentos personalizados del gym (si hay reglas adicionales)
□ Señales del Risk Score ajustadas (pesos por tipo de gym)
□ Políticas de escalada a humano configuradas
□ Staff habilitado para recibir alertas (WhatsApp personal del trainer/admin)
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulo: GYM-MOD-CRM-V_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión sugerida: Septiembre 2026_
