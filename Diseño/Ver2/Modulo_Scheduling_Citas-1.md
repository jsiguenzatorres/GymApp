# 📅 MÓDULO SCHEDULING & CITAS (MOD-SCHED)

## Sistema de Agendamiento Integral — Clases, Sesiones PT & Servicios

### App Integral de Gimnasio de Élite — Documento de Diseño Detallado

### Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-SCHED`
> **Prioridad:** MVP Fase 1 (core) → Fase 2 (lista de espera inteligente, recurrencia avanzada)
> **Módulos relacionados:** CRM/ARIA (MOD-CRM), Membresías (MOD-MEM), Workout Builder (MOD-WKT), Nutrición (MOD-NUTRI), Gamificación (MOD-GAME), Panel Ejecutivo (MOD-ANALYTICS)
> **Principio rector:** _"Cada silla vacía en una clase es revenue perdido. Cada clase sobre-reservada es un miembro frustrado. El calendario perfecto nunca tiene ninguna de las dos cosas."_

---

## 📋 TABLA DE CONTENIDO

### PARTE I — FUNDAMENTOS

1. [Visión General & Tipos de Agendamiento](#1-visión-general--tipos-de-agendamiento)
2. [Arquitectura del Calendario Unificado](#2-arquitectura-del-calendario-unificado)

### PARTE II — CLASES GRUPALES

3. [Gestión de Clases Grupales — Panel Admin](#3-gestión-de-clases-grupales--panel-admin)
4. [Reserva de Clases — Experiencia del Miembro](#4-reserva-de-clases--experiencia-del-miembro)
5. [Lista de Espera Inteligente](#5-lista-de-espera-inteligente)
6. [Check-in de Clase & No-Shows](#6-check-in-de-clase--no-shows)

### PARTE III — SESIONES INDIVIDUALES (PT & SERVICIOS)

7. [Agendamiento de Sesiones PT](#7-agendamiento-de-sesiones-pt)
8. [Gestión de Disponibilidad de Trainers](#8-gestión-de-disponibilidad-de-trainers)
9. [Servicios Adicionales Agendables](#9-servicios-adicionales-agendables)

### PARTE IV — INTELIGENCIA & AUTOMATIZACIÓN

10. [ARIA en el Agendamiento — Agendar por Chat/Voz](#10-aria-en-el-agendamiento--agendar-por-chatvoz)
11. [Motor de Recordatorios & Confirmaciones](#11-motor-de-recordatorios--confirmaciones)
12. [Optimización Inteligente de Horarios](#12-optimización-inteligente-de-horarios)
13. [Políticas de Cancelación & Penalizaciones](#13-políticas-de-cancelación--penalizaciones)

### PARTE V — EXPERIENCIA & GESTIÓN

14. [Vista de Calendario del Miembro](#14-vista-de-calendario-del-miembro)
15. [Panel de Recepción — Vista Operacional del Día](#15-panel-de-recepción--vista-operacional-del-día)
16. [Reservas Recurrentes & Suscripción a Horarios Fijos](#16-reservas-recurrentes--suscripción-a-horarios-fijos)

### PARTE VI — INTEGRACIÓN & DATOS

17. [Integraciones del Módulo](#17-integraciones-del-módulo)
18. [Analytics de Scheduling (BI)](#18-analytics-de-scheduling-bi)
19. [Modelo de Datos Completo](#19-modelo-de-datos-completo)

---

# PARTE I — FUNDAMENTOS

---

## 1. VISIÓN GENERAL & TIPOS DE AGENDAMIENTO

### 1.1 Propósito

El **Módulo de Scheduling** es el sistema circulatorio operativo del gimnasio: coordina el tiempo de instructores, trainers, salas, equipamiento especial y miembros en un solo calendario vivo. Un gimnasio con clases medio vacías y trainers con huecos en su agenda está perdiendo dinero todos los días sin darse cuenta; un gimnasio con sobre-reserva y listas de espera mal gestionadas está generando frustración silenciosa que se convierte en cancelaciones.

Este módulo resuelve ambos problemas con un calendario unificado, inteligente, y profundamente integrado con CRM (ARIA sabe si alguien no confirmó), Gamificación (asistencia a clases suma puntos) y Analytics (el dueño ve ocupación en tiempo real).

### 1.2 Los 4 Tipos de Agendamiento que Cubre el Módulo

```yaml
TIPO 1 — CLASES GRUPALES (uno-a-muchos):
  Ejemplos: Spinning, Yoga, Zumba, HIIT, CrossFit-style WOD
  Característica: aforo fijo, horario recurrente semanal,
  un instructor para muchos miembros simultáneamente

TIPO 2 — SESIONES INDIVIDUALES (uno-a-uno):
  Ejemplos: Sesión de Personal Training, consulta nutricional,
  evaluación física
  Característica: un trainer/profesional dedicado a un miembro
  en un bloque de tiempo específico

TIPO 3 — SERVICIOS DE INSTALACIÓN (reserva de recurso):
  Ejemplos: cancha de squash, sala de crioterapia, uso exclusivo
  de un espacio con equipamiento limitado
  Característica: se reserva el RECURSO/ESPACIO, no
  necesariamente un profesional que lo atienda

TIPO 4 — EVENTOS ESPECIALES (uno-a-muchos, no recurrente):
  Ejemplos: Torneo de Fuerza (ya documentado en Módulo
  Gamificación, Sección 12), Taller de nutrición, clase de
  instructor invitado
  Característica: fecha única o de corta duración, cupo limitado,
  a veces con costo adicional
```

### 1.3 Principios de Diseño

| Principio                                 | Implementación                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Cero fricción para reservar**           | Reservar una clase toma 2 toques desde que se abre la app                                        |
| **Transparencia de disponibilidad**       | El miembro ve cupos reales en tiempo real, nunca reserva "a ciegas"                              |
| **Anti no-show**                          | Recordatorios inteligentes + políticas claras reducen el ausentismo sin ser punitivas de entrada |
| **Trainer como recurso protegido**        | El sistema nunca sobre-agenda a un trainer ni le da huecos improductivos evitables               |
| **Recuperación automática de cupos**      | Una cancelación libera el espacio instantáneamente a la lista de espera                          |
| **Integrado con el resto del ecosistema** | La cita se conecta con el plan de entreno, el CRM y la gamificación, no vive aislada             |

---

## 2. ARQUITECTURA DEL CALENDARIO UNIFICADO

### 2.1 Diagrama del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    CALENDARIO UNIFICADO DEL GYM                 │
│                                                                 │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Clases         │  │ Sesiones PT    │  │ Recursos/Salas    │  │
│  │ Grupales       │  │ Individuales   │  │ (canchas, spa)    │  │
│  └───────┬────────┘  └────────┬───────┘  └─────────┬─────────┘  │
│          │                    │                    │            │
│          └────────────────────┼────────────────────┘            │
│                               │                                 │
│                    ┌──────────▼──────────┐                     │
│                    │   MOTOR DE RESERVAS  │                     │
│                    │  - Validación aforo   │                     │
│                    │  - Validación membr.  │                     │
│                    │  - Validación trainer │                     │
│                    │    disponibilidad     │                     │
│                    └──────────┬──────────┘                     │
└───────────────────────────────┼─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐   ┌──────────▼─────────┐   ┌─────────▼────────┐
│  App Miembro    │   │  Panel Trainer     │   │  Panel Recepción  │
│  (reservar,     │   │  (ver mi agenda,   │   │  (vista del día,  │
│   ver mis citas)│   │   bloquear tiempo) │   │   check-ins)      │
└─────────────────┘   └────────────────────┘   └───────────────────┘
```

### 2.2 Por Qué un Calendario Unificado (no 3 sistemas separados)

```yaml
Decisión de diseño: las clases grupales, sesiones PT y reservas
de recursos comparten el MISMO motor de validación y la MISMA
tabla base de eventos, en lugar de sistemas independientes:

  Razón 1 — Visibilidad cruzada real:
    Un trainer que da clases grupales Y sesiones PT necesita ver
    TODO su tiempo ocupado en un solo lugar — si su agenda de PT
    y sus clases vivieran en sistemas distintos, se arriesga a
    doble-booking

  Razón 2 — Reglas de negocio compartidas:
    Validar membresía activa, verificar restricciones médicas,
    aplicar políticas de cancelación — toda esta lógica es
    idéntica sin importar el tipo de evento, así que vive en un
    solo Motor de Reservas reutilizado

  Razón 3 — Analytics consolidado:
    El dueño del gym quiere ver "ocupación total de mi gym hoy"
    sin tener que sumar manualmente 3 reportes de 3 sistemas
    distintos
```

---

# PARTE II — CLASES GRUPALES

---

## 3. GESTIÓN DE CLASES GRUPALES — PANEL ADMIN

### 3.1 Creación de una Clase (Plantilla Recurrente)

```
CREAR CLASE GRUPAL — Panel Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMACIÓN BÁSICA:
  Nombre:          [Spinning Elite                    ]
  Categoría:       [Cardio ▼]
  Descripción:     [Clase de spinning de alta intensidad
                    con música motivacional. Ideal para
                    quemar calorías y mejorar resistencia.]
  Nivel:           ○ Todos los niveles  ● Intermedio-Avanzado
  Imagen:          [Subir foto de la clase]

INSTRUCTOR:
  Instructor principal:  [Roberto Méndez ▼]
  Instructor sustituto:  [Laura Sánchez ▼]  (para ausencias)

HORARIO RECURRENTE:
  Días:            ☑ Lun  ☑ Mié  ☑ Vie  ☐ Mar  ☐ Jue  ☐ Sáb  ☐ Dom
  Hora inicio:     [07:00 am]
  Duración:        [45 minutos]
  Vigencia:        Desde [01/07/2026]  Hasta [Indefinido ▼]

UBICACIÓN & AFORO:
  Sala:            [Sala de Spinning ▼]
  Aforo máximo:    [20] personas
  Equipamiento requerido: Bicicleta de spinning (20 disponibles)

REGLAS DE RESERVA:
  Apertura de reservas:        [7 días antes] a las [00:00]
  Cierre de reservas:          [2 horas antes] de la clase
  Máximo de reservas simultáneas por miembro: [Sin límite ▼]
  Planes con acceso:           ☑ Todos los planes activos
                                ☐ Solo planes específicos: [___]
  Requiere pago adicional:     ○ No, incluida en membresía
                                ● Sí: $[5.00] por sesión (drop-in)

LISTA DE ESPERA:
  ☑ Activar lista de espera automática
  Notificar a la lista cuando se libera un cupo: [Inmediatamente]
  Tiempo para confirmar desde la lista de espera: [15 minutos]

[Vista previa del calendario]  [Guardar y Publicar]
```

### 3.2 Gestión de Excepciones (Cancelaciones Puntuales, Sustituciones)

```yaml
El calendario recurrente necesita manejar excepciones sin romper
el patrón general — un instructor que falta un día no debe
requerir "eliminar y recrear" toda la serie recurrente:

  Cancelar UNA sesión específica (ej. feriado):
    Admin selecciona la fecha puntual → "Cancelar esta sesión"
    → Sistema notifica automáticamente a todos los reservados
    → Libera el cupo sin afectar las demás fechas de la serie

  Cambiar instructor para UNA sesión (sustitución):
    Admin selecciona la fecha → "Asignar sustituto"
    → Notificación a los reservados: "Laura Sánchez sustituirá
      a Roberto en tu clase de Spinning de mañana"
    → El resto de la serie recurrente sigue con el instructor
      original sin cambios

  Modificar el aforo de UNA sesión (ej. mantenimiento de 3
  bicicletas):
    Admin ajusta el aforo solo para esa fecha específica
    → Si ya hay más reservados que el nuevo aforo, el sistema
      alerta al admin para decidir cómo gestionar el exceso
      (no cancela reservas automáticamente sin intervención humana)

  Modificar la serie completa hacia adelante (ej. cambio de
  horario permanente desde cierta fecha):
    Admin edita el horario y elige "Aplicar desde esta fecha
    en adelante" (no retroactivo) → todas las reservas futuras
    ya confirmadas reciben notificación del cambio de horario
```

---

## 4. RESERVA DE CLASES — EXPERIENCIA DEL MIEMBRO

### 4.1 Vista de Calendario de Clases

```
CLASES GRUPALES — GYM ÉLITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Hoy] [Mañana] [Esta semana] [Filtrar por tipo ▼]

LUNES 15 DE JUNIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

06:00am  🔥 HIIT Matutino
         Roberto Méndez · Sala Funcional
         ████████████████░░  16/20 cupos
         [Reservar]

07:00am  🚴 Spinning Elite
         Roberto Méndez · Sala de Spinning
         ████████████████████ 20/20 LLENO
         [Unirme a lista de espera (3 personas antes que tú)]

08:00am  🧘 Yoga Restaurativo
         Carmen López · Sala Zen
         ████░░░░░░░░░░░░░░░░  4/15 cupos
         [Reservar]

06:00pm  💃 Zumba
         Carmen López · Sala Principal
         ██████████████░░░░░░  14/20 cupos
         [Reservar]

07:00pm  🚴 Spinning Elite
         Laura Sánchez · Sala de Spinning
         ██████████░░░░░░░░░░  10/20 cupos
         [Reservar]

[Ver semana completa]  [Mis clases reservadas]
```

### 4.2 Flujo de Reserva (2 Toques, Sin Fricción)

```
PASO 1: Miembro toca [Reservar] en la clase deseada

PASO 2: Confirmación instantánea
  ┌────────────────────────────────────────────┐
  │  ✅ ¡Reservado!                             │
  │                                            │
  │  🚴 Spinning Elite                          │
  │  Lunes 15 de junio, 7:00pm                  │
  │  Con Laura Sánchez                          │
  │                                            │
  │  📍 Recuerda llegar 10 min antes            │
  │  🔔 Te recordaremos 2 horas antes            │
  │                                            │
  │  [Agregar a mi calendario]  [Cancelar reserva]│
  └────────────────────────────────────────────┘

Si la clase requiere pago adicional (drop-in fee):
  Se muestra el cobro ANTES de confirmar, usando el mismo flujo
  de checkout ya documentado en el Módulo de Billing — método
  de pago guardado, un toque para confirmar el cargo

Si el miembro no tiene acceso por su plan:
  "Esta clase es exclusiva para planes Elite y Anual. Tu plan
   actual (Básico) no incluye acceso a clases premium.
   [Ver mi plan] [Consultar upgrade]"
```

---

## 5. LISTA DE ESPERA INTELIGENTE

### 5.1 Mecánica de la Lista de Espera

```yaml
Cuando una clase está llena, el miembro puede unirse a la lista
de espera en lugar de simplemente ver "sin cupos":

  Posición en la fila: el miembro ve su posición exacta
  ("3 personas antes que tú")

  Liberación automática de cupo:
    Trigger: alguien cancela su reserva confirmada
    Acción: el sistema notifica INMEDIATAMENTE al primero de
    la lista de espera (push + WhatsApp vía ARIA)
    "¡Se liberó un cupo en Spinning Elite de las 7pm! Tienes
     15 minutos para confirmar antes de que pase a la siguiente
     persona en la fila. [Confirmar mi cupo]"
    Si no confirma en 15 minutos: pasa automáticamente al
    siguiente de la lista, y así sucesivamente

  Priorización de la lista de espera (configurable por el gym):
    Por defecto: orden de llegada (FIFO — primero en anotarse,
    primero en ser notificado)
    Alternativa configurable: prioridad por nivel de fidelidad
    (Módulo Gamificación) — miembros Oro/Platino/Élite reciben
    la notificación de cupo liberado antes que miembros Bronce,
    como beneficio de su nivel

  Salir de la lista de espera:
    El miembro puede retirarse en cualquier momento sin penalización
    — estar en lista de espera nunca genera cargo ni compromiso
```

### 5.2 Predicción de Liberación de Cupo (IA)

```yaml
Para reducir la incertidumbre de estar en lista de espera, el
sistema usa el historial de no-shows y cancelaciones de esa
clase específica para dar una estimación:

  "Basado en el historial de esta clase, normalmente se liberan
   1-2 cupos por cancelaciones de último momento. Tienes buenas
   probabilidades de conseguir cupo — te avisaremos en cuanto
   pase algo 😊"

  Esto se calcula con un promedio simple de las últimas 8-10
  sesiones de esa clase específica (no requiere un modelo de ML
  complejo, es una estadística directa sobre datos históricos
  ya almacenados en la tabla de reservas)
```

---

## 6. CHECK-IN DE CLASE & NO-SHOWS

### 6.1 Confirmación de Asistencia

```yaml
El check-in a una clase reservada se integra directamente con
el Módulo de Control de Acceso ya documentado (MOD-ACCESS):

  Si el miembro tiene una clase reservada y hace check-in general
  al gym (QR/NFC/facial) dentro de la ventana de 15 minutos antes
  del inicio de su clase:
    → El sistema AUTO-CONFIRMA su asistencia a la clase
      automáticamente, sin que tenga que hacer una acción
      adicional específica de "check-in de clase"

  Si el miembro no tiene reserva pero llega a la sala de la clase:
    → El instructor puede registrar su asistencia manualmente
      desde su panel (walk-in), sujeto a disponibilidad de cupo

REGISTRO DE NO-SHOW:
  Si la clase inicia y el miembro reservado NO hizo check-in
  general al gym en absoluto ese día:
    → Se marca automáticamente como no_show tras 10 minutos de
      iniciada la clase (configurable)
    → Esto alimenta:
      - El Risk Score de retención en CRM (patrón de no-shows
        repetido es señal de desconexión, ya documentado en el
        Módulo CRM)
      - Las políticas de penalización (Sección 13)
      - El aforo real reportado al dueño (diferencia entre
        "reservado" y "realmente asistió")
```

---

# PARTE III — SESIONES INDIVIDUALES (PT & SERVICIOS)

---

## 7. AGENDAMIENTO DE SESIONES PT

### 7.1 Flujo de Agendamiento de una Sesión Individual

```
AGENDAR SESIÓN CON MI TRAINER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mi trainer: Carlos Gutiérrez
Sesiones disponibles en mi plan: 2 de 4 usadas este mes

SELECCIONA UN DÍA:
  [Lun 15] [Mar 16] [Mié 17] [Jue 18] [Vie 19] [Sáb 20]

HORARIOS DISPONIBLES — Miércoles 17 de junio:
  ○ 9:00am - 9:45am
  ○ 10:00am - 10:45am
  ● 4:00pm - 4:45pm   ← seleccionado
  ○ 5:00pm - 5:45pm
  ○ 6:00pm - 6:45pm

TIPO DE SESIÓN:
  ● Entrenamiento según mi plan activo
  ○ Evaluación de progreso
  ○ Ajuste de rutina / consulta técnica

NOTA PARA TU TRAINER (opcional):
  [Me duele un poco el hombro derecho, quisiera que lo revisemos]

[✅ Confirmar sesión]

── Confirmación ──
✅ Sesión agendada con Carlos, miércoles 17 de junio, 4:00pm
Carlos recibió tu nota sobre el hombro y la revisará contigo.
[Agregar a mi calendario] [Cancelar]
```

### 7.2 Vinculación con el Plan de Entrenamiento

```yaml
Cuando se agenda una sesión de "Entrenamiento según mi plan
activo", el sistema conecta automáticamente con el Módulo
Workout Builder ya documentado:

  El trainer, al abrir su agenda del día, ve directamente qué
  día del plan le toca a cada cliente (ej. "María — Día B:
  Torso + Cardio") sin tener que buscarlo por separado

  Si el miembro agregó una nota (ej. "me duele el hombro"), el
  trainer la ve ANTES de la sesión y puede ajustar el plan de
  ese día sobre la marcha (ej. sustituir ejercicios de empuje
  de hombro por alternativas, usando la función de Sustitución
  Inteligente ya documentada en el Workout Builder, Sección 14)

  Al finalizar la sesión, el trainer puede dejar notas que se
  integran al historial del cliente en el CRM, visible en la
  Vista 360° del Miembro (Módulo Panel Ejecutivo, Sección 9)
```

---

## 8. GESTIÓN DE DISPONIBILIDAD DE TRAINERS

### 8.1 Configuración de Horario del Trainer

```yaml
Cada trainer configura su propia disponibilidad (con aprobación
del admin si el gym lo requiere):

  Horario semanal base:
    Lunes:     8:00am - 12:00pm, 2:00pm - 7:00pm
    Martes:    8:00am - 12:00pm, 2:00pm - 7:00pm
    ...

  Bloqueos puntuales (vacaciones, citas médicas, capacitación):
    El trainer marca fechas/horas específicas como no disponibles
    → El sistema automáticamente oculta esos horarios de la vista
      de agendamiento de sus clientes
    → Si ya había sesiones agendadas en ese bloque: alerta al
      admin y al trainer para reagendar con el cliente afectado

  Duración de sesión configurable por trainer:
    Trainer A: sesiones de 45 minutos
    Trainer B: sesiones de 60 minutos
    (afecta cómo se calculan los espacios disponibles en su
    calendario)

  Buffer entre sesiones:
    Configurable: 0, 5, 10 o 15 minutos de descanso entre citas
    consecutivas (evita que el trainer quede sin tiempo de
    transición, hidratación, o preparación del siguiente cliente)
```

### 8.2 Vista de Agenda del Trainer

```
MI AGENDA — Carlos Gutiérrez — Miércoles 17 de junio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

08:00  [DISPONIBLE]
09:00  María García — PT (Día B: Torso + Cardio)
       📝 Nota: "Me duele el hombro derecho"
10:00  [DISPONIBLE]
11:00  Pedro Ramírez — Evaluación de progreso mensual
12:00  [Almuerzo — bloqueado]
14:00  [DISPONIBLE]
15:00  Ana Torres — PT (Día A: Piernas)
16:00  [DISPONIBLE]
17:00  Clase grupal — HIIT (20 inscritos)
18:00  [DISPONIBLE]

RESUMEN DEL DÍA: 4 sesiones · 71% de ocupación
[Bloquear tiempo] [Ver semana] [Ver mis clientes]
```

---

## 9. SERVICIOS ADICIONALES AGENDABLES

```yaml
Más allá de clases y PT, el mismo motor de reservas cubre:
  Evaluaciones físicas (ya documentadas en el Workout Builder,
  Sección 4.2) — se agendan como un tipo de cita con duración
  estándar (30-45 min) y checklist específico para el trainer

  Consultas de nutrición (Módulo Nutrición, Sección 17) — se
  agendan con el nutricionista del gym, mismo motor compartido

  Servicios de spa/sauna/crioterapia (si el gym los ofrece,
  mencionados en el Módulo de Control de Acceso, Sección 11.1)
  — se reserva el RECURSO (la sala/equipo) por bloque de tiempo,
  no necesariamente un profesional

  Uso de canchas o espacios especializados (squash, básquet) —
  mismo patrón de reserva de recurso físico compartido entre
  miembros
```

---

# PARTE IV — INTELIGENCIA & AUTOMATIZACIÓN

---

## 10. ARIA EN EL AGENDAMIENTO — AGENDAR POR CHAT/VOZ

### 10.1 Flujo Conversacional de Agendamiento

```
MIEMBRO (WhatsApp): "Hola, quiero agendar mi sesión con Carlos
para esta semana"

ARIA:
"¡Claro, María! 😊 Carlos tiene estos horarios disponibles esta
semana:

  Miércoles 17:  9am, 2pm, 4pm
  Jueves 18:     10am, 3pm, 5pm
  Viernes 19:    9am, 11am

¿Cuál te funciona mejor?"

MIEMBRO: "El jueves a las 3"

ARIA:
"¡Perfecto! Agendé tu sesión con Carlos para el jueves 18 de
junio a las 3:00pm. Te recuerdo que te quedan 2 sesiones más
este mes.

Te enviaré un recordatorio 2 horas antes. ¿Algo más en lo que
te ayude? 💪"

--- Ejemplo de reagendamiento ---

MIEMBRO: "Necesito cambiar mi cita de mañana, algo me surgió"

ARIA:
"No hay problema. Tu sesión con Carlos era mañana jueves a las
3pm. Aquí tienes otros horarios disponibles con él esta semana:

  Viernes 19:  9am, 11am, 4pm
  Sábado 20:   10am

¿Prefieres alguno de estos, o quieres cancelarla sin reagendar?"
```

### 10.2 Reglas de lo que ARIA Puede y No Puede Hacer en Agendamiento

```yaml
ARIA SÍ puede (de forma autónoma, sin intervención humana):
  ✅ Mostrar disponibilidad real de clases y trainers
  ✅ Crear una reserva cuando el miembro confirma un horario
  disponible
  ✅ Cancelar una reserva a solicitud del miembro (respetando
  la política de cancelación vigente, Sección 13)
  ✅ Reagendar dentro de la disponibilidad existente
  ✅ Agregar a la lista de espera si la clase está llena
  ✅ Enviar recordatorios y confirmaciones

ARIA NO puede (requiere acción de un humano):
  ❌ Crear un nuevo horario de clase que no existe en el sistema
  ❌ Forzar un cupo cuando la clase está al 100% (solo puede
  ofrecer lista de espera)
  ❌ Cambiar el instructor asignado a una clase
  ❌ Aprobar excepciones a la política de cancelación (ej. si
  el miembro pide exoneración de una penalización, ARIA
  escala al admin en lugar de decidir por su cuenta)
  ❌ Modificar la disponibilidad configurada por un trainer
```

---

## 11. MOTOR DE RECORDATORIOS & CONFIRMACIONES

### 11.1 Secuencia de Comunicaciones por Tipo de Evento

```yaml
CLASE GRUPAL:
  Al reservar:              Confirmación inmediata (push + in-app)
  24 horas antes:           Recordatorio (push)
  2 horas antes:            Recordatorio con opción de cancelar
                            (push + WhatsApp vía ARIA)
  15 min después de iniciada
  (si no hubo check-in):     Se registra no-show, sin notificación
                            adicional al miembro en este momento
                            (se aborda en el resumen semanal, no
                            de forma inmediata/punitiva)

SESIÓN PT:
  Al agendar:               Confirmación + notificación al trainer
  24 horas antes:           Recordatorio al miembro Y al trainer
  2 horas antes:            Recordatorio con detalles (ej. "trae
                            ropa cómoda", nota si el trainer dejó
                            instrucciones previas)
  Si el trainer necesita cancelar:
                            Notificación inmediata al miembro con
                            opciones de reagendar, priorizadas por
                            urgencia (ej. "tu sesión de hoy fue
                            cancelada por Carlos — aquí tienes 3
                            horarios para reagendar hoy mismo")

EVALUACIÓN FÍSICA / CONSULTA NUTRICIONAL:
  Recordatorio adicional de preparación:
    "Recuerda venir en ayunas de 3 horas para tu evaluación de
     composición corporal" (o el requisito específico del servicio)
```

### 11.2 Confirmación Activa vs. Pasiva (Reducción de No-Shows)

```yaml
Para clases o sesiones de alta demanda (definido por el admin,
ej. clases que históricamente tienen alta tasa de no-show),
el sistema puede requerir CONFIRMACIÓN ACTIVA:

  24 horas antes: "¿Sigues asistiendo a tu clase de Spinning
  mañana a las 7am? [Sí, confirmo] [No podré ir]"

  Si el miembro no responde en X horas (configurable): el cupo
  se libera automáticamente a la lista de espera, dando prioridad
  a quienes SÍ quieren asistir realmente

  Esto se activa SOLO para clases con historial de alta demanda
  y alta tasa de no-show — no se aplica de forma genérica a
  todas las reservas, para no generar fricción innecesaria en
  el resto
```

---

## 12. OPTIMIZACIÓN INTELIGENTE DE HORARIOS

### 12.1 Sugerencias al Admin Basadas en Datos Reales

```yaml
El sistema analiza patrones de ocupación (ya visible en el
Panel Ejecutivo, Módulo Analytics, Sección 5.1) y genera
sugerencias accionables:

  "La clase de Pilates de las 10am tiene 45% de ocupación
   promedio en las últimas 8 semanas, mientras que hay demanda
   reprimida los martes y jueves a las 6pm (lista de espera
   promedio de 4 personas en Spinning ese horario). ¿Considerar
   mover Pilates a un horario de menor demanda y agregar una
   sesión adicional de Spinning?"

  "El instructor Roberto tiene 94% de ocupación en sus clases
   vs. 58% promedio del gym — sus horarios están funcionando
   muy bien. ¿Considerar darle más slots?"

  "Hay 3 horas cada martes donde ningún trainer tiene sesiones
   agendadas y el gym tiene buena afluencia de miembros —
   posible oportunidad para una clase grupal nueva o promoción
   de sesiones PT en ese bloque"

Estas sugerencias se muestran en el Panel Ejecutivo ya
documentado, sección de alertas operacionales (Módulo Panel
Ejecutivo, Sección 10.1, categoría OPERACIONAL)
```

---

## 13. POLÍTICAS DE CANCELACIÓN & PENALIZACIONES

### 13.1 Configuración de Políticas por Tipo de Evento

```yaml
El gym configura políticas de cancelación diferenciadas:

CLASES GRUPALES:
  Cancelación con >2 horas de anticipación: sin penalización
  Cancelación con <2 horas: cuenta como "cancelación tardía"
  No-show (no cancela ni asiste): cuenta como no-show

  Umbral de penalización (configurable):
    3 no-shows o cancelaciones tardías en 30 días →
    restricción temporal: el miembro debe confirmar sus
    próximas 2 reservas con 24h de anticipación mínima
    (en lugar de reservar libremente), como medida educativa,
    no punitiva económica

SESIONES PT (usan sesiones limitadas del plan del miembro):
  Cancelación con >24 horas: la sesión NO se descuenta del
  total mensual, se puede reagendar libremente
  Cancelación con <24 horas: configurable por el gym —
    Opción A: se descuenta la sesión del total (política estricta)
    Opción B: se descuenta solo a partir de la 2da cancelación
    tardía del mes (política con tolerancia)
  No-show sin aviso: siempre se descuenta la sesión

  Cancelación INICIADA POR EL TRAINER (enfermedad, emergencia):
    Nunca se descuenta del total del miembro, sin excepción
```

### 13.2 Comunicación de la Política (Nunca Punitiva en el Tono)

```yaml
Ejemplo de mensaje cuando aplica una política de cancelación
tardía — el tono es informativo, no de regaño:

  "Hola María, veo que cancelaste tu sesión de hoy con menos
   de 24 horas de anticipación. Según la política del gym, esta
   sesión se cuenta dentro de tu total mensual. Si tienes algún
   imprevisto recurrente que dificulte el aviso con más
   anticipación, cuéntame y vemos cómo ajustar tu horario para
   que te sea más cómodo 😊"

Esto es coherente con el principio ya establecido para ARIA en
el resto del sistema: nunca usar lenguaje de culpa, y siempre
buscar entender la causa antes de simplemente aplicar la regla
de forma fría.
```

---

# PARTE V — EXPERIENCIA & GESTIÓN

---

## 14. VISTA DE CALENDARIO DEL MIEMBRO

### 14.1 Mi Agenda Consolidada

```
MI AGENDA — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTA SEMANA:

Lunes 15
  💪 09:00am — Sesión PT con Carlos (Día B: Torso + Cardio)
  🚴 07:00pm — Spinning Elite con Laura

Miércoles 17
  💪 04:00pm — Sesión PT con Carlos
  🥗 05:30pm — Consulta nutricional con Dra. Ana López

Viernes 19
  🧘 08:00am — Yoga Restaurativo con Carmen

[Ver mes completo]  [+ Agendar algo nuevo]

PRÓXIMA ACCIÓN REQUERIDA:
  ⏰ Confirma tu clase de Yoga del viernes (se requiere
     confirmación por alta demanda) [Confirmar] [Cancelar]

MIS SESIONES PT ESTE MES: 2 de 4 usadas
```

---

## 15. PANEL DE RECEPCIÓN — VISTA OPERACIONAL DEL DÍA

### 15.1 Extensión del Dashboard de Recepción Ya Documentado

```yaml
El Panel Ejecutivo (Módulo Analytics, Sección 16) ya define un
"Dashboard de Recepción" básico. Este módulo lo extiende con
el detalle completo de scheduling operacional:

  Vista de "Próximas 2 horas" con TODOS los tipos de evento
  (clases, PT, servicios) en una sola línea de tiempo

  Indicador visual de confirmaciones pendientes (para que
  recepción pueda hacer seguimiento manual si alguien no
  confirmó y el sistema automático no fue suficiente)

  Botón de "Walk-in" — registrar a alguien que llega sin
  reserva previa a una clase con cupo disponible, o agendar
  una sesión PT de último momento si el trainer tiene un hueco
```

---

## 16. RESERVAS RECURRENTES & SUSCRIPCIÓN A HORARIOS FIJOS

### 16.1 "Mi Horario Fijo" — Reserva Automática Recurrente

```yaml
Para miembros con rutina estable (ej. "siempre voy a Spinning
los lunes, miércoles y viernes a las 7am"), el sistema permite
suscribirse a un horario recurrente en lugar de reservar
manualmente cada semana:

  Configuración:
    "Reservar automáticamente: Spinning Elite, Lun/Mié/Vie 7am"
    → Cada semana, el sistema reserva el cupo automáticamente
      apenas se abre la ventana de reservas (ej. 7 días antes)
    → Si por alguna razón no hay cupo disponible esa semana
      específica (ej. mantenimiento excepcional): notificación
      inmediata al miembro para que decida una alternativa

  Beneficio para el miembro: nunca se le olvida reservar y
  nunca se queda sin cupo en su clase habitual porque el sistema
  la aseguró apenas se abrió la ventana

  Beneficio para el gym: mayor previsibilidad de ocupación,
  mejor dato para planificación de trainers y aforo

  El miembro puede pausar o cancelar la suscripción recurrente
  en cualquier momento sin afectar reservas ya confirmadas de
  semanas anteriores
```

---

# PARTE VI — INTEGRACIÓN & DATOS

---

## 17. INTEGRACIONES DEL MÓDULO

```yaml
Con Módulo de Control de Acceso (MOD-ACCESS):
  - El check-in general al gym auto-confirma asistencia a
    clases/sesiones reservadas (Sección 6.1)
  - Los no-shows se detectan cruzando reservas vs. logs de acceso

Con Módulo CRM/ARIA (MOD-CRM):
  - ARIA agenda, reagenda y cancela citas conversacionalmente
    (Sección 10)
  - Patrones de no-show alimentan el Risk Score de retención
  - Recordatorios y confirmaciones usan el mismo pipeline de
    notificaciones multi-canal ya documentado en la Arquitectura
    Técnica

Con Módulo Workout Builder (MOD-WKT):
  - Sesiones PT muestran al trainer el día del plan correspondiente
  - Evaluaciones físicas agendadas se vinculan con el historial
    de progreso del miembro

Con Módulo Nutrición (MOD-NUTRI):
  - Consultas nutricionales comparten el mismo motor de reservas
  - El nutricionista ve su agenda igual que un trainer (Módulo
    Nutrición, Sección 17.1)

Con Módulo Gamificación (MOD-GAME):
  - Asistencia a clases suma puntos (ya documentado, Sección 2.2
    del Módulo Gamificación: "Asistir a clase grupal: 20 pts")
  - Rachas de asistencia a una clase específica generan medallas
    (ej. "Clases 4 semanas consecutivas mismo tipo: 75 pts")

Con Módulo Billing (MOD-BIL):
  - Clases con costo adicional (drop-in) procesan el cobro
    directamente en el flujo de reserva
  - Servicios agendables con costo (ej. sesión de spa) usan el
    mismo checkout ya documentado

Con Panel Ejecutivo (MOD-ANALYTICS):
  - Ocupación de clases y sesiones alimenta el dashboard operacional
  - Alertas de clases con ocupación baja/alta (ya esbozado en
    el Módulo Panel Ejecutivo, Sección 10.1)
```

---

## 18. ANALYTICS DE SCHEDULING (BI)

```yaml
KPIs específicos de scheduling que se integran al Panel Ejecutivo:
  Tasa de ocupación por clase, instructor y horario
  Tasa de no-show por clase y por miembro (individual y agregada)
  Tiempo promedio de conversión de lista de espera (¿cuánto
  tarda en llenarse un cupo liberado?)
  Utilización de trainers (% de su horario disponible que está
  efectivamente agendado)
  Revenue generado por clases con costo adicional (drop-in fees)
  Servicios/recursos más y menos utilizados (canchas, spa, etc.)
  Efectividad de recordatorios (¿la confirmación activa realmente
  reduce no-shows medible antes/después de activarla?)
```

---

## 19. MODELO DE DATOS COMPLETO

```sql
-- ─────────────────────────────────────────────────────────────
-- CLASES GRUPALES (plantilla recurrente)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE class_templates (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                  UUID NOT NULL REFERENCES gyms(id),
  name                    VARCHAR(150) NOT NULL,
  category                VARCHAR(50),
  description             TEXT,
  level                   VARCHAR(30),
  image_url               TEXT,
  primary_instructor_id    UUID REFERENCES staff(id),
  substitute_instructor_id UUID REFERENCES staff(id),
  room_resource_id         UUID REFERENCES facility_resources(id),
  max_capacity            INTEGER NOT NULL,
  duration_minutes        INTEGER NOT NULL,
  recurrence_days         INTEGER[],       -- [1,3,5] = Lun, Mié, Vie
  start_time              TIME NOT NULL,
  valid_from              DATE NOT NULL,
  valid_until             DATE,
  booking_opens_days_before INTEGER DEFAULT 7,
  booking_closes_hours_before INTEGER DEFAULT 2,
  eligible_plans          TEXT[],
  requires_payment        BOOLEAN DEFAULT FALSE,
  drop_in_price           DECIMAL(10,2),
  waitlist_enabled        BOOLEAN DEFAULT TRUE,
  waitlist_confirm_minutes INTEGER DEFAULT 15,
  requires_active_confirmation BOOLEAN DEFAULT FALSE,
  is_active               BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INSTANCIAS DE CLASE (una fecha/hora específica, generada
-- desde la plantilla recurrente, permite excepciones puntuales)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE class_instances (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_template_id       UUID NOT NULL REFERENCES class_templates(id),
  gym_id                  UUID NOT NULL REFERENCES gyms(id),
  scheduled_at             TIMESTAMP NOT NULL,
  instructor_id            UUID REFERENCES staff(id),  -- override puntual
  max_capacity_override    INTEGER,                    -- override puntual
  status                  VARCHAR(20) DEFAULT 'scheduled',
  -- scheduled|cancelled|completed
  cancellation_reason      TEXT,
  current_reservations     INTEGER DEFAULT 0,
  created_at              TIMESTAMP DEFAULT NOW(),
  UNIQUE (class_template_id, scheduled_at)
);

-- ─────────────────────────────────────────────────────────────
-- RESERVAS (unificado para clases, PT, servicios)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                  UUID NOT NULL REFERENCES gyms(id),
  member_id               UUID NOT NULL REFERENCES members(id),
  booking_type            VARCHAR(20) NOT NULL,
  -- group_class|pt_session|resource|special_event
  class_instance_id        UUID REFERENCES class_instances(id),
  staff_id                UUID REFERENCES staff(id),   -- trainer/nutricionista
  resource_id              UUID REFERENCES facility_resources(id),
  scheduled_start          TIMESTAMP NOT NULL,
  scheduled_end            TIMESTAMP NOT NULL,
  status                  VARCHAR(20) DEFAULT 'confirmed',
  -- confirmed|cancelled|completed|no_show|pending_confirmation
  confirmation_required    BOOLEAN DEFAULT FALSE,
  confirmed_at             TIMESTAMP,
  cancelled_at             TIMESTAMP,
  cancellation_reason      TEXT,
  is_late_cancellation     BOOLEAN DEFAULT FALSE,
  checked_in_at             TIMESTAMP,
  member_note              TEXT,
  staff_note                TEXT,
  payment_required         BOOLEAN DEFAULT FALSE,
  transaction_id            UUID REFERENCES transactions(id),
  counted_against_plan_sessions BOOLEAN DEFAULT FALSE,
  booked_via               VARCHAR(20) DEFAULT 'app',
  -- app|aria_chat|aria_voice|reception|recurring_subscription
  created_at              TIMESTAMP DEFAULT NOW(),
  INDEX (member_id, scheduled_start DESC),
  INDEX (staff_id, scheduled_start DESC)
);

-- ─────────────────────────────────────────────────────────────
-- LISTA DE ESPERA
-- ─────────────────────────────────────────────────────────────
CREATE TABLE waitlist_entries (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_instance_id        UUID NOT NULL REFERENCES class_instances(id),
  member_id               UUID NOT NULL REFERENCES members(id),
  position                INTEGER NOT NULL,
  status                  VARCHAR(20) DEFAULT 'waiting',
  -- waiting|notified|confirmed|expired|withdrawn
  notified_at              TIMESTAMP,
  confirmation_deadline     TIMESTAMP,
  joined_at                TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- DISPONIBILIDAD DE STAFF (trainers, nutricionistas)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE staff_availability (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                UUID NOT NULL REFERENCES staff(id),
  day_of_week             INTEGER NOT NULL,   -- 1-7
  start_time              TIME NOT NULL,
  end_time                TIME NOT NULL,
  session_duration_minutes INTEGER DEFAULT 45,
  buffer_minutes           INTEGER DEFAULT 0,
  effective_from           DATE NOT NULL,
  effective_until          DATE
);

CREATE TABLE staff_blocked_times (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id                UUID NOT NULL REFERENCES staff(id),
  blocked_start            TIMESTAMP NOT NULL,
  blocked_end              TIMESTAMP NOT NULL,
  reason                  VARCHAR(100),
  created_at              TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- RECURSOS DE INSTALACIÓN (salas, canchas, equipos especiales)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE facility_resources (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                  UUID NOT NULL REFERENCES gyms(id),
  name                    VARCHAR(100) NOT NULL,
  resource_type           VARCHAR(30),    -- room|court|equipment|spa
  capacity                INTEGER DEFAULT 1,
  requires_staff           BOOLEAN DEFAULT FALSE,
  is_active               BOOLEAN DEFAULT TRUE
);

-- ─────────────────────────────────────────────────────────────
-- RESERVAS RECURRENTES (suscripción a horario fijo)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE recurring_booking_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id               UUID NOT NULL REFERENCES members(id),
  class_template_id        UUID NOT NULL REFERENCES class_templates(id),
  status                  VARCHAR(20) DEFAULT 'active',
  -- active|paused|cancelled
  paused_until             DATE,
  created_at              TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CHECKLIST DE CONFIGURACIÓN

```
CONFIGURACIÓN INICIAL:
□ Catálogo de clases grupales creado con horarios recurrentes
□ Trainers con disponibilidad semanal configurada
□ Políticas de cancelación definidas para clases y PT
□ Recursos de instalación (salas, canchas) registrados si aplica
□ Reglas de lista de espera configuradas (tiempo de confirmación,
  priorización)
□ Plantillas de recordatorio (24h, 2h) personalizadas con el
  tono del gym

VALIDACIÓN:
□ Probar el flujo completo: reserva → recordatorio → check-in
  → auto-confirmación de asistencia
□ Probar la liberación de cupo desde lista de espera end-to-end
□ Verificar que ARIA puede agendar/cancelar/reagendar
  correctamente en un ambiente de prueba
□ Confirmar que el check-in general del gym confirma asistencia
  a clases automáticamente (integración con Control de Acceso)
```

---

_Documento generado: Junio 2026_
_Versión: 1.0_
_Módulo: GYM-MOD-SCHED_
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_
_Próxima revisión: Septiembre 2026_
