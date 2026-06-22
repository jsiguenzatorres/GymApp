# 🏆 MÓDULO GAMIFICACIÓN & COMUNIDAD (MOD-GAME)

## Sistema de Engagement, Fidelización y Comunidad — App Integral de Gimnasio de Élite

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-GAME`  
> **Prioridad:** Fase 2 (core) → Fase 3 (comunidad avanzada)  
> **Módulos relacionados:** Todos los módulos del sistema (es una capa transversal)  
> **Principio rector:** _"El gym que convierte el esfuerzo en juego, nunca pierde a sus miembros."_

---

## 📋 TABLA DE CONTENIDO

1. [Visión General & Psicología del Engagement](#1-visión-general--psicología-del-engagement)
2. [Motor de Puntos — Sistema de Economía Interna](#2-motor-de-puntos--sistema-de-economía-interna)
3. [Sistema de Medallas & Logros](#3-sistema-de-medallas--logros)
4. [Niveles de Membresía Gamificada (Progresión)](#4-niveles-de-membresía-gamificada-progresión)
5. [Challenges — Retos Individuales y Grupales](#5-challenges--retos-individuales-y-grupales)
6. [Leaderboards — Tablas de Clasificación](#6-leaderboards--tablas-de-clasificación)
7. [Sistema de Referidos](#7-sistema-de-referidos)
8. [Feed Social — Comunidad Interna del Gym](#8-feed-social--comunidad-interna-del-gym)
9. [Grupos & Comunidades por Objetivo](#9-grupos--comunidades-por-objetivo)
10. [Buddy Matching — Compañero de Entreno](#10-buddy-matching--compañero-de-entreno)
11. [Tienda de Recompensas (Reward Store)](#11-tienda-de-recompensas-reward-store)
12. [Eventos & Competencias Internas del Gym](#12-eventos--competencias-internas-del-gym)
13. [Experiencia del Miembro — App Gamificada](#13-experiencia-del-miembro--app-gamificada)
14. [Panel de Gestión de Gamificación (Admin)](#14-panel-de-gestión-de-gamificación-admin)
15. [Analytics de Engagement & Comunidad](#15-analytics-de-engagement--comunidad)
16. [Integración con Todos los Módulos](#16-integración-con-todos-los-módulos)
17. [Modelo de Datos Completo](#17-modelo-de-datos-completo)

---

## 1. VISIÓN GENERAL & PSICOLOGÍA DEL ENGAGEMENT

### 1.1 El Problema que Resuelve

```
EL CICLO DE ABANDONO DEL GYM (el enemigo número 1):

  Semana 1-4:    Motivación alta → asistencia perfecta
  Semana 5-8:    La novedad pasa → faltas ocasionales
  Semana 9-12:   La rutina aburre → visitas irregulares
  Mes 4-6:       Sin resultados visibles → frustración
  Mes 6:         Cancelación

El 67% de los miembros de gym cancelan antes de los 6 meses.
La causa #1 no es el precio ni la distancia: es la DESMOTIVACIÓN.

LA SOLUCIÓN — Gamificación:
  Convertir cada visita, cada set, cada logro en un hito celebrado.
  Crear una identidad de "atleta" que el miembro no quiere perder.
  Construir una comunidad que extraña al miembro cuando falta.
  Hacer que abrir la app sea tan adictivo como Instagram, pero saludable.
```

### 1.2 Principios de Diseño de Gamificación

```yaml
Principios psicológicos aplicados:

  PROGRESO VISIBLE (Progress Principle):
    El cerebro libera dopamina al ver progreso, incluso en pasos pequeños
    Implementación: barras de progreso, porcentajes, rachas visuales
    Efecto: el miembro quiere "completar la barra"

  IDENTIDAD & STATUS (Social Identity):
    Las personas actúan según cómo se identifican a sí mismas
    Implementación: niveles (Bronce → Élite), títulos, badges visibles
    Efecto: "Soy un miembro Élite del gym" → no puede dejar de ir

  PRESIÓN SOCIAL POSITIVA (Social Proof):
    Ver que otros progresan motiva a seguir
    Implementación: leaderboards, feed de logros, challenges grupales
    Efecto: "Si Pedro puede levantarlo, yo también"

  RECIPROCIDAD (Reciprocity):
    El gym celebra cada logro → el miembro siente lealtad
    Implementación: felicitaciones automáticas, recompensas sorpresa
    Efecto: "Este gym me conoce y me valora"

  AVERSIÓN A LA PÉRDIDA (Loss Aversion):
    Perder algo duele más que ganar lo mismo
    Implementación: rachas que se pierden al faltar, niveles que pueden bajar
    Efecto: "No puedo perder mi racha de 30 días"

  AUTONOMÍA (Self-Determination):
    Elegir los propios retos aumenta el compromiso
    Implementación: challenges personalizables, metas propias
    Efecto: el miembro siente que el programa es suyo, no impuesto

  SORPRESA & VARIEDAD (Variable Reward):
    Las recompensas impredecibles son más adictivas que las predecibles
    Implementación: medallas sorpresa, bonus inesperados, cofres de recompensa
    Efecto: el miembro siempre espera algo nuevo
```

### 1.3 Pilares del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                 LOS 6 PILARES DE GAMIFICACIÓN                   │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│ PUNTOS   │ MEDALLAS │ NIVELES  │CHALLENGES│LEADERBOARD│COMUNIDAD│
│          │          │          │          │           │         │
│ Economía │ Logros   │Progresión│  Retos   │ Ranking   │  Feed   │
│ interna  │ únicos   │de status │ y metas  │ social    │ social  │
│          │          │          │          │           │ interno │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 2. MOTOR DE PUNTOS — SISTEMA DE ECONOMÍA INTERNA

### 2.1 Arquitectura del Sistema de Puntos

```yaml
Los puntos son la moneda del gimnasio — se ganan por comportamientos
positivos y se canjen por recompensas reales. El sistema tiene que
ser simple de entender pero profundo en sus mecánicas.

Nombre de los puntos (personalizable por el gym):
  Default: "FitCoins" o "GymPoints" (el gym elige el nombre)
  El nombre aparece en toda la app y comunicaciones
  Ejemplos creativos: "FitPoints", "EliteCoins", "PowerTokens"
```

### 2.2 Tabla Completa de Ganancia de Puntos

```yaml
ASISTENCIA & CHECK-IN:
  Check-in al gym (cualquier día): 10 pts
  Check-in en horario pico (6-8am / 6-8pm): 15 pts  ← incentiva horarios descongestionados
  Check-in 3 días consecutivos: 25 pts bonus
  Check-in 5 días consecutivos: 50 pts bonus
  Check-in 7 días consecutivos (racha semanal): 100 pts bonus
  Semana perfecta (todos los días planificados): 150 pts bonus
  30 días de racha activa: 500 pts MEGA BONUS
  Primera visita después de inactividad (regreso): 30 pts (incentiva el regreso)

ENTRENAMIENTO:
  Sesión de entreno completada (según plan): 20 pts
  100% de ejercicios del día completados: 15 pts bonus
  Nuevo Récord Personal (cualquier ejercicio): 50 pts por PR
  Completar plan semanal 100%: 100 pts
  Completar un plan completo (4-12 semanas): 300 pts MILESTONE
  Primera sesión con trainer: 50 pts (onboarding)
  Calificar sesión con trainer (feedback): 10 pts

CLASES GRUPALES:
  Asistir a clase grupal (cualquier tipo): 20 pts
  Primera vez en una clase nueva (variedad): 30 pts
  Asistir a clase completa sin cancelar: 5 pts bonus
  Clases 4 semanas consecutivas mismo tipo: 75 pts (consistencia)

NUTRICIÓN:
  Completar el registro de comidas del día: 15 pts
  7 días consecutivos registrando comidas: 75 pts
  Subir foto del plato de comida: 10 pts
  Adherencia al plan nutricional >80% esta semana: 50 pts
  Primera consulta con nutricionista: 50 pts

EVALUACIONES & PROGRESO:
  Completar evaluación física: 100 pts
  Actualizar medidas corporales: 25 pts
  Subir foto de progreso: 20 pts
  Alcanzar meta mensual de peso/medidas: 200 pts MILESTONE
  Alcanzar objetivo principal (meta declarada): 500 pts MEGA MILESTONE

COMUNIDAD & SOCIAL:
  Referir un nuevo miembro (que se registra): 200 pts por referido
  Dejar reseña de clase (con comentario): 20 pts
  Dejar reseña de producto del marketplace: 15 pts
  Compartir logro en el feed social: 10 pts
  Recibir "kudos" de otro miembro: 5 pts por kudo
  Responder encuesta NPS: 25 pts
  Participar en challenge grupal: 30 pts
  Ganar challenge grupal: 100 pts

MARKETPLACE:
  Compra en el marketplace ($1 gastado): 10 pts por $1
  Primera compra en la tienda del gym: 50 pts
  Comprar un combo recomendado por el nutricionista: 25 pts bonus
  Suscribirse a la "Caja del Mes": 100 pts

ESPECIALES & BONUS:
  Cumpleaños del miembro: 100 pts regalo
  Aniversario de membresía (1 año): 500 pts
  Aniversario (2 años): 750 pts
  Aniversario (3+ años): 1,000 pts
  Sugerencia implementada por el gym: 150 pts
  Participar como modelo en foto/video del gym: 100 pts (con consentimiento)
  Traer acompañante con pase de visita: 25 pts
  Reactivación después de baja: 75 pts (regreso)
```

### 2.3 Reglas Anti-Abuso del Sistema de Puntos

```yaml
Para evitar que el sistema sea explotado:

  Límite diario de puntos:
    Máximo 300 puntos por día de cualquier fuente
    Evita que alguien haga 50 registros de comida para farm points

  Cooldown entre acciones similares:
    Un solo check-in por día (no puede hacer check-in y check-out
    múltiples veces para acumular)
    Una sola reseña de clase por clase (no puede dejar 10 reseñas de la misma)

  Verificación de autenticidad:
    Los PRs deben coincidir con los registros de sets en el sistema
    No se pueden reportar PRs sin sesión activa registrada

  Compras del marketplace:
    Los puntos por compras se otorgan solo después de confirmada la entrega
    Si hay devolución: se restan los puntos otorgados

  Referidos:
    Solo se pagan cuando el referido ha completado su primer mes
    El referidor y el referido no pueden ser la misma persona
    Máximo 5 referidos pagados por mes

  Vencimiento de puntos:
    Configurable por el gym (recomendado: 12 meses desde la última actividad)
    ARIA avisa 30 días antes: "Mari, tienes 1,200 puntos que vencen en 30 días"
    Incentiva el uso y la actividad del miembro
```

### 2.4 Vista del Miembro — Mi Billetera de Puntos

```
MIS FITCOINS — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🪙 SALDO ACTUAL:     2,840 FitCoins
  🏅 NIVEL:            🥈 PLATA (2,840/5,000 para ORO)

  ████████████████████████████████░░░░░░░░░  57% para el siguiente nivel

  RESUMEN DEL MES:
    Ganados:    +620 pts  ↑ (tu mejor mes)
    Canjeados:   -200 pts
    Neto:        +420 pts

ÚLTIMOS MOVIMIENTOS:
  Hoy 12:47     Check-in al gym                    +10 pts
  Hoy 12:47     Racha día 13 bonus (>10 días)      +25 pts
  Ayer 09:15    Sesión completada 100%             +35 pts
  Ayer 09:15    NUEVO PR — Hip Thrust 70kg 🏆      +50 pts
  15/06         Referido confirmado — Ana Ruiz    +200 pts  ← ¡Premio!
  14/06         Registro de comidas (día 8/7)      +75 pts  ← Racha semanal
  [Ver historial completo]

PUNTOS QUE PUEDES GANAR HOY:
  ✅ Check-in: Ya ganaste tus 10 pts hoy
  ⏳ Completar sesión de entreno: +20 pts disponibles
  ⏳ Registrar tus comidas: +15 pts disponibles
  ⏳ Calificar tu sesión con Carlos: +10 pts disponibles
  💡 Si completas todo: +45 pts más hoy → llegarás a 2,885 pts

  [🛍️ Ir a la tienda de recompensas]  [📊 Ver historial completo]
```

---

## 3. SISTEMA DE MEDALLAS & LOGROS

### 3.1 Arquitectura de Medallas

```yaml
Las medallas son reconocimientos permanentes que se muestran
en el perfil del miembro y en el feed social. Son coleccionables
y narran la historia del miembro en el gym.

Categorías de medallas:
  🏋️ ENTRENAMIENTO:      logros relacionados con el ejercicio
  📅 ASISTENCIA:         logros de consistencia y racha
  💪 FUERZA:             récords personales y hitos de carga
  🥗 NUTRICIÓN:          consistencia y adherencia al plan
  🤝 COMUNIDAD:          contribución social y referidos
  🌟 ESPECIALES:         hitos únicos y celebraciones
  🎖️ ÉLITE:             logros exclusivos de alto nivel
```

### 3.2 Catálogo Completo de Medallas

```yaml
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏋️ MEDALLAS DE ENTRENAMIENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥉 Primer Paso:
  trigger: Completar la primera sesión de entreno registrada
  puntos: 50
  mensaje: "¡Todo gran viaje comienza con un primer paso!
            Completaste tu primera sesión. Esto es solo el comienzo 💪"
  rareza: Común (todos la obtienen)

🥈 10 Sesiones:
  trigger: 10 sesiones de entreno completadas (históricas)
  puntos: 100

🥇 50 Sesiones:
  trigger: 50 sesiones completadas
  puntos: 200

💎 100 Sesiones — "Centenario":
  trigger: 100 sesiones completadas
  puntos: 500
  tipo: RARA
  mensaje: "100 sesiones. No es suerte ni motivación pasajera —
            eres alguien que aparece. Eso es todo."

⚫ 500 Sesiones — "Leyenda":
  trigger: 500 sesiones completadas
  puntos: 2,000
  tipo: LEGENDARIA
  beneficio_extra: Badge especial en perfil público + mención en el blog del gym

🎯 Plan Completo:
  trigger: Completar un plan de entrenamiento al 100% (sin abandonar)
  puntos: 300
  mensaje: "Completaste el plan completo. La mayoría se rinde a mitad.
            Tú no eres la mayoría."

⚡ Semana Perfecta:
  trigger: 7 días de 7 planificados entrenados
  puntos: 150
  (se puede ganar múltiples veces)

🔥 Racha de Fuego — 30 días:
  trigger: 30 días consecutivos de asistencia o entreno registrado
  puntos: 500
  tipo: RARA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 MEDALLAS DE ASISTENCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌅 Madrugador:
  trigger: 10 entrenamientos registrados antes de las 7:00am
  puntos: 100
  mensaje: "Cuando los demás duermen, tú ya estás construyendo el mejor tú."

🌙 Noctámbulo:
  trigger: 10 entrenamientos después de las 9:00pm
  puntos: 100

🗓️ 1 Año Contigo:
  trigger: 12 meses como miembro activo (sin cancelaciones)
  puntos: 500
  beneficio_extra: Badge "Veterano" visible en el perfil
  tipo: ESPECIAL

🗓️ 2 Años — "Comprometido":
  tipo: RARA
  puntos: 1,000

🗓️ 5 Años — "Leyenda del Gym":
  tipo: LEGENDARIA
  puntos: 5,000
  beneficio_extra: Placa física en el gym (si el gym lo desea)

🏖️ El que no se rindió:
  trigger: Regresar al gym después de 14+ días de inactividad
  puntos: 75
  mensaje: "Volver después de una pausa es más difícil que nunca haberse ido.
            El hecho de que estés aquí hoy lo dice todo."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💪 MEDALLAS DE FUERZA & PROGRESO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Primera PR:
  trigger: Primer récord personal registrado en cualquier ejercicio
  puntos: 100
  mensaje: "¡Tu primer récord personal! Desde hoy,
            cualquier peso anterior es historia."

📈 PR Semanal:
  trigger: Batir un récord personal esta semana
  puntos: 50 (recurrente — cada semana que haya PR)

🏋️ Club del 100:
  trigger: Levantar más de 100kg en cualquier ejercicio (para hombres)
  trigger_fem: Levantar más de 60kg (para mujeres) — configurable
  puntos: 300
  tipo: ESPECIAL

🦁 Club del Peso Corporal:
  trigger: Levantar tu propio peso corporal en sentadilla o press de banca
  puntos: 400
  tipo: RARA

🦅 Transformación 30 días:
  trigger: Mejoría medible en métricas físicas en los primeros 30 días
  (pérdida de grasa > 0.5% O ganancia de músculo > 0.5kg)
  puntos: 250

🏆 Meta Alcanzada:
  trigger: El miembro alcanza el objetivo declarado en la entrevista inicial
  puntos: 500
  tipo: ESPECIAL
  mensaje: "Lo dijiste que lo ibas a lograr. Y lo lograste.
            Las palabras se convirtieron en acción y la acción en resultados."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥗 MEDALLAS DE NUTRICIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🥗 Primer Plan Nutricional:
  trigger: Recibir y aceptar su primer plan nutricional
  puntos: 50

📱 Diario de Alimentación:
  trigger: 7 días consecutivos registrando todas las comidas
  puntos: 75

🌿 Mes Saludable:
  trigger: Adherencia nutricional >75% durante 30 días
  puntos: 200

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤝 MEDALLAS DE COMUNIDAD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Embajador:
  trigger: Referir 1 amigo que se convierte en miembro
  puntos: 200

🌟 Super Embajador:
  trigger: Referir 5 miembros en el mismo año
  puntos: 1,000
  tipo: RARA
  beneficio_extra: Mes gratis de membresía

🗣️ Voz de la Comunidad:
  trigger: 10 reseñas de clases aprobadas (con comentario de calidad)
  puntos: 150

💡 Innovador:
  trigger: Una sugerencia tuya fue implementada por el gym
  puntos: 200
  tipo: ESPECIAL
  beneficio_extra: Mención especial en el boletín del gym

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 MEDALLAS ESPECIALES (rarísimas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👑 Miembro Fundador:
  trigger: Ser uno de los primeros 50 miembros del gym
  tipo: ÚNICA — no se puede ganar después
  puntos: 1,000
  beneficio_extra: Badge "Fundador" permanente en el perfil

⚡ El Incansable:
  trigger: 365 días consecutivos de actividad (visita o entreno)
  tipo: LEGENDARIA — extremadamente rara
  puntos: 10,000
  beneficio_extra: Membresía de por vida con descuento + placa en el gym

🎂 Feliz Cumpleaños:
  trigger: Hacer check-in el día de su cumpleaños
  puntos: 50 bonus adicionales
  mensaje especial de ARIA + pequeño regalo del gym

🏋️ El Primero:
  trigger: Ser el primer check-in del día (primer miembro en llegar)
  puntos: 25 bonus
  (se puede ganar múltiples veces — cada vez que sea el primero)
```

### 3.3 Diseño Visual de las Medallas

```yaml
Diseño de cada medalla:
  Icono SVG único y memorable por medalla
  3 rarezas con diseños diferentes:
    Común:      borde plateado, fondo sólido
    Rara:       borde dorado con brillo animado
    Legendaria: borde arcoíris animado + partículas brillantes

  Al desbloquear:
    Animación de reveal (tipo sobre que se abre)
    Sonido de fanfarria
    Pantalla completa celebratoria por 3 segundos
    Opción de compartir en el feed del gym
    Opción de compartir en redes sociales (Instagram, WhatsApp, etc.)
    Notification push a todos los contactos del gym (opt-in)

  En el perfil del miembro:
    Galería de medallas desbloqueadas (en color)
    Medallas no desbloqueadas (en gris + pista de cómo conseguirla)
    Animación de flip al tocar una medalla
    Fecha de obtención + historia del logro
```

---

## 4. NIVELES DE MEMBRESÍA GAMIFICADA (PROGRESIÓN)

### 4.1 Sistema de 5 Niveles

```
PROGRESIÓN DE NIVELES — El viaje del miembro

🥉 BRONCE — El Aspirante (0 - 999 puntos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Descripción: "Acabas de comenzar. Cada gran campeón estuvo aquí."
Acceso: Funciones básicas de la app
Beneficios operativos:
  - Acceso a todas las clases incluidas en tu membresía
  - Reservas de citas con 48h de anticipación
  - Participación en challenges básicos
Badge visual: 🥉 Medallón de bronce en el perfil
ARIA tone: Muy alentador, celebra cada pequeño logro

🥈 PLATA — El Comprometido (1,000 - 4,999 puntos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Descripción: "Ya eres parte de la comunidad. Estás construyendo el hábito."
Requisito tiempo: mínimo 30 días de membresía activa
Beneficios adicionales vs. Bronce:
  + 5% de descuento en el marketplace
  + Prioridad en lista de espera de clases (antes que Bronce)
  + Acceso anticipado a eventos del gym (24h antes)
  + 1 freeze extra al año (en adición al del plan)
  + Badge "Miembro Plata" en el perfil
  + Acceso a challenges exclusivos de nivel Plata+
ARIA tone: Cálido, reconoce el progreso constante

🥇 ORO — El Dedicado (5,000 - 14,999 puntos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Descripción: "Nivel Oro. Eres alguien que aparece. Siempre."
Requisito tiempo: mínimo 3 meses de membresía activa
Beneficios adicionales vs. Plata:
  + 10% de descuento en el marketplace
  + Prioridad en reservas (72h de anticipación — antes que Plata)
  + 1 evaluación física gratuita extra al año
  + Acceso a clases especiales exclusivas para Oro+
  + Locker con preferencia (si está disponible)
  + Invitación a eventos y talleres VIP
  + Badge dorado brillante en el perfil
ARIA tone: Orgulloso, trata al miembro como un veterano

💎 PLATINO — El Élite (15,000 - 29,999 puntos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Descripción: "Platino. Eres parte de los pocos que realmente lo logran."
Requisito tiempo: mínimo 6 meses de membresía activa
Beneficios adicionales vs. Oro:
  + 15% de descuento en el marketplace
  + Locker dedicado garantizado
  + 1 mes de freeze gratis por año
  + Invitados especiales: 1 extra al mes (suma al del plan)
  + Sesión de evaluación y rediseño de plan gratuita (semestral)
  + Acceso priority en horarios pico (reserva con 96h de anticipación)
  + Badge de diamante animado en el perfil
  + Mención en el "Muro de Honor" del gym (físico + digital)
ARIA tone: De igual a igual, como hablar con un amigo veterano

👑 ÉLITE — La Leyenda (30,000+ puntos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Descripción: "ÉLITE. Solo el 1% llega aquí. Tú eres una inspiración."
Requisito tiempo: mínimo 12 meses de membresía activa
Beneficios adicionales vs. Platino:
  + 20% de descuento en el marketplace (permanente)
  + Sesión PT mensual incluida gratis
  + Membresía a precio congelado (no sube aunque cambien los precios)
  + Tarjeta física de membresía ÉLITE (metalizada)
  + Acceso a eventos privados y exclusivos del gym
  + Foto en el "Muro de Leyendas" del gym
  + Publicación en el blog y redes sociales del gym (con permiso)
  + Participación en decisiones del gym (focus group de miembros ÉLITE)
  + Badge coronado con animación especial en el perfil
ARIA tone: Reverencial, el miembro es una leyenda del gym
```

### 4.2 Mecánicas de Subida y Bajada de Nivel

```yaml
SUBIDA DE NIVEL:
  Automática cuando los puntos acumulados cruzan el umbral
  El miembro recibe:
    - Notificación especial con animación de fuegos artificiales
    - Email de felicitación con todos los nuevos beneficios
    - Mensaje especial de ARIA
    - Puntos bonus de celebración (+200 pts por subir de nivel)
    - El trainer y el dueño reciben una notificación de celebración

BAJADA DE NIVEL (mecánica importante para retención):
  Los niveles pueden bajar si el miembro está inactivo

  Regla de inactividad:
    30 días sin puntos ganados → el nivel baja 1 (de Oro a Plata, etc.)
    60 días sin puntos → baja 2 niveles

  ARIA avisa ANTES de que baje:
    "Oye Mari, llevas 25 días sin actividad. Si no hay actividad esta
     semana, perderás tu nivel ORO. ¿Puedo ayudarte a volver? 💪"

  Psicología:
    La aversión a la pérdida es un motivador poderoso
    El miembro prefiere volver al gym antes que perder su nivel

  PERO: el nivel nunca baja del nivel "congelado" por tiempo:
    Si el miembro lleva 6+ meses → mínimo Plata (aunque no gane puntos)
    Si el miembro lleva 12+ meses → mínimo Oro
    Esto protege a los veteranos de caer demasiado bajo

  Los puntos históricos NO se pierden:
    El nivel puede bajar pero los puntos ganados históricamente se conservan
    Al volver a ganar puntos: sube de nivel rápidamente
```

---

## 5. CHALLENGES — RETOS INDIVIDUALES Y GRUPALES

### 5.1 Tipos de Challenges

```yaml
CHALLENGES INDIVIDUALES (vs. uno mismo):

  Challenges de asistencia:
    "30 días de entreno" → entrenar 30 días en el mes
    "Semana perfecta" → cumplir todos los días planificados esta semana
    "Madrugador" → ir antes de las 7am durante 5 días seguidos

  Challenges de fuerza y progreso:
    "Sube tu Bench" → mejorar el PR de press de banca en 4 semanas
    "Squat Challenge" → completar los sets de sentadilla del plan sin fallar
    "Progresión de 30 días" → mejorar una métrica física en 30 días

  Challenges de nutrición:
    "7 días de registro" → registrar todas las comidas 7 días seguidos
    "Sin azúcar 14 días" → seguir el plan sin desviaciones en 2 semanas
    "Hidratación perfecta" → 8 vasos de agua al día durante 7 días

  Challenges de variedad:
    "Prueba algo nuevo" → asistir a 3 clases diferentes en el mes
    "El explorador" → usar todas las áreas del gym en una semana

CHALLENGES GRUPALES (vs. otros miembros):

  Challenges de clase:
    "Spinning King/Queen" → miembro con más clases de Spinning del mes
    "Yoga Lovers" → group challenge de las personas inscritas en Yoga

  Challenges del gym completo:
    "Gym vs. Record" → todo el gym junta 10,000 check-ins en el mes
    "100,000 kg Lifted" → entre todos levantar 100,000 kg esta semana
    "El Gym más Saludable" → % más alto de adherencia nutricional

  Challenges por equipo (squads):
    División automática o manual en equipos de 4-8 personas
    Compiten: asistencia total del equipo, volumen levantado, rachas
    El equipo ganador recibe recompensas para todos sus miembros

CHALLENGES EXTERNOS (gym vs. gym — Fase 3):
  La plataforma conecta múltiples gyms en retos intergimnasios
  "El gym con más check-ins de El Salvador esta semana"
  Refuerza el orgullo de pertenencia y la identidad del gym
```

### 5.2 Creación de Challenges (Panel Admin)

```
CREAR NUEVO CHALLENGE — Panel Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMACIÓN BÁSICA:
  Nombre:        [Reto de los 30 días de julio                    ]
  Tipo:          ○ Individual  ○ Grupal  ● Gym completo
  Descripción:   [En julio, el gym se une. 30 días, 30 entrenos.
                  ¿Quién llega al final?                           ]
  Imagen:        [Subir imagen del challenge — recomendado 1080×1080]

PERÍODO:
  Inicio:        [01/07/2026]
  Fin:           [31/07/2026]
  Hora inicio:   [00:01]

OBJETIVO & MÉTRICA:
  Métrica:       [Días de check-in en el mes          ▼]
  Objetivo:      [30 días]
  Tipo objetivo: ○ Todos lo intentan individualmente
                 ● Se suman para llegar a una meta grupal
  Meta grupal:   [2,000 check-ins totales del gym en julio]

PARTICIPACIÓN:
  ¿Quién puede unirse?:  ● Todos los miembros activos
                         ○ Solo ciertos planes: [___________]
  ¿Inscripción automática?:  ● Sí, todos inscritos automáticamente
                             ○ No, el miembro decide unirse

RECOMPENSAS:
  Por completar el objetivo individual:   200 pts + Medalla "Guerrero de Julio"
  Si el gym alcanza la meta grupal:       150 pts extra para TODOS los participantes

COMUNICACIONES:
  ● Anunciar 3 días antes (ARIA + push + email)
  ● Recordatorio semanal durante el challenge
  ● Alerta si el miembro lleva 3 días sin avanzar
  ● Celebración al completarlo

[Vista previa]  [Programar]  [Activar ahora]
```

### 5.3 Vista del Miembro — Challenges Activos

```
MIS RETOS — Junio 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RETO ACTIVO — Reto de los 30 días de Junio
  ████████████████████░░░░░░░░░░  67%  — 20/30 días
  Días restantes del mes: 10 días
  💡 Necesitas ir 10 de los próximos 10 días para completarlo
  Recompensa: 200 pts + Medalla "Guerrero de Junio" 🏆
  Participantes: 89 miembros participando
  Tú en el ranking: #23 de 89
  [Ver ranking completo]

RETO GYM — 2,000 Check-ins del Gym en Junio
  ████████████████████████████░░  92%  — 1,847/2,000 check-ins
  "¡Casi! Solo faltan 153 check-ins. ¡Ayuda al gym a lograrlo!"
  Si el gym lo logra: todos reciben +150 pts extra 🎁
  [Compartir en WhatsApp para animar a otros]

DISPONIBLES PARA UNIRTE:
  🌅 Madrugador de Julio
      Ir 10 veces antes de las 7am en julio
      Recompensa: Medalla + 150 pts
      [Unirme]

  🥗 Semana Nutricional
      Registrar todas las comidas 7 días seguidos
      Recompensa: 100 pts + consulta nutricional gratis
      [Unirme]

COMPLETADOS:
  ✅ Semana Perfecta — Mayo 2026        ← 150 pts ganados
  ✅ 10 Sesiones Completadas            ← 100 pts ganados
  [Ver todos mis challenges completados]
```

---

## 6. LEADERBOARDS — TABLAS DE CLASIFICACIÓN

### 6.1 Tipos de Leaderboards

```yaml
LEADERBOARDS DISPONIBLES:
  Por período: Esta semana  /  Este mes  /  Este año  /  Todo el tiempo

  Por categoría: 1. Asistencia — quién más días vino al gym
    2. Volumen — quién más kg totales levantó (sets × reps × peso)
    3. Racha — quién tiene la racha activa más larga
    4. FitCoins — quién más puntos ganó este mes
    5. Clases — quién más clases grupales asistió
    6. PRs — quién más récords personales batió
    7. Progreso físico — mayor % de mejora en composición corporal
    8. Referidos — quién más miembros nuevos trajo
    9. Nutrición — mayor adherencia al plan nutricional

  Leaderboard POR CLASE:
    Dentro de cada clase grupal: top performers
    Spinning: watts promedio más alto / más clases asistidas
    Yoga: asistencia más consistente
    HIIT: más rondas completadas en el AMRAP de la clase

  Por segmento (para comparar justo): Por género (hombre vs. hombre, mujer vs. mujer)
    Por rango de antigüedad (nuevos <3 meses vs. veteranos >1 año)
    Por objetivo (pérdida de peso vs. ganancia de masa)

  Leaderboard del TRAINER: Entre los clientes del mismo trainer
    Carlos puede ver quién de sus clientes tiene más PRs del mes
    Incentiva competencia amistosa entre el grupo del trainer
```

### 6.2 Diseño del Leaderboard en la App

```
RANKING — Más FitCoins de Junio
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Asistencia] [Volumen] [Racha] [FitCoins] [PRs]  ←tabs
[Esta semana] [Este mes ●] [Este año] [Siempre]    ←filtros

🥇 1.  Pedro Ramírez          1,240 pts  ↑ (+3)
         💎 Platino  |  42 días activo este mes
         [👏 Felicitar]

🥈 2.  Ana Torres              980 pts   = (sin cambio)
         🥇 Oro  |  38 días activo este mes

🥉 3.  Carlos Mejía            920 pts   ↑ (+8)
         🥇 Oro  |  35 días activo este mes

   4.  Rosa Hernández           750 pts
   5.  Andrés Pérez             720 pts

   ···

  23.  María García  ← TÚ      540 pts  ↑ (+5)
       🥈 Plata  |  20 días activo este mes
       "¡Estás a 180 pts del top 10! Completa tu reto de
        este mes y podrías llegar al top 15 💪"

  24.  Sandra López             510 pts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu posición: 23 de 247 miembros activos (top 9%)
[Ver mi progreso en el ranking]  [Compartir mi posición]
```

### 6.3 Configuración de Privacidad del Leaderboard

```yaml
El miembro controla su visibilidad:
  ● Aparecer con mi nombre real
  ○ Aparecer con nombre parcial (María G.)
  ○ Aparecer como anónimo (#23 del ranking)
  ○ No aparecer en ningún leaderboard

Por defecto: nombre real (incentiva la conexión social)
El admin puede configurar el default del gym
```

---

## 7. SISTEMA DE REFERIDOS

### 7.1 Mecánica Completa de Referidos

```
FLUJO DEL PROGRAMA DE REFERIDOS:

PASO 1: MIEMBRO COMPARTE SU LINK/CÓDIGO
  Desde la app → "Referir un amigo" → obtiene:
    - Link personalizado: gym.app/ref/maria-garcia-7x9k
    - Código de 6 caracteres: MAR7X9
    - Botones de compartir: WhatsApp, Instagram, copia de link
    - Mensaje pre-generado por ARIA:
      "¡Ey! Estoy en GYM ÉLITE y está increíble 💪
       Si te unes con mi código MAR7X9 tienes el 15% off
       tu primer mes. Yo recibo un mes gratis cuando lo hagas.
       ¡Únete! → gym.app/ref/maria-garcia-7x9k"

PASO 2: EL AMIGO SE REGISTRA
  Llega al gym (presencial o web) → ingresa el código
  Sistema registra: referido por María García
  El amigo recibe: 15% de descuento en su primer mes (beneficio configurable)

PASO 3: EL AMIGO COMPLETA SU PRIMER MES
  Trigger: el referido cumple 30 días activo como miembro pagante
  El sistema verifica: ¿el referido no canceló en el primer mes?

PASO 4: RECOMPENSA AL REFERIDOR
  María recibe automáticamente:
  - 200 FitCoins acreditados
  - Opción: 1 mes gratis O $20 de crédito en el marketplace
  - Notificación: "Tu amigo Ana completó su primer mes.
                   ¡Ganaste tu recompensa! 🎁"
  - Medalla "Embajador" si es su primer referido
  - Progreso hacia medalla "Super Embajador" (5 referidos)

PASO 5: SEGUIMIENTO
  María puede ver desde la app:
  - Cuántos links compartió
  - Cuántos llegaron al gym
  - Cuántos se convirtieron en miembros
  - Cuántas recompensas ha ganado
  - Quiénes son sus referidos (nombres, con permiso de ellos)
```

### 7.2 Configuración del Programa (Admin)

```yaml
Variables configurables por el gym:
  beneficio_para_el_referido:
    tipo: porcentaje | monto_fijo | meses_gratis | sesion_gratis
    valor: 15% # del primer mes

  beneficio_para_el_referidor:
    opcion_1: { tipo: 'meses_gratis', valor: 1 }
    opcion_2: { tipo: 'credito_marketplace', valor: 20 }
    opcion_3: { tipo: 'puntos', valor: 200 }
    el_referidor_elige_cual_prefiere: true

  requisito_para_pagar:
    dias_como_miembro_activo: 30
    primer_pago_exitoso: true

  limites_anti_abuso:
    max_referidos_pagados_por_mes: 5
    dias_antes_de_pagar_la_recompensa: 30
    referido_debe_ser_persona_nueva: true # no puede ser ex-miembro que regresa

  vigencia_del_link:
    dias_de_validez: 30 # después de 30 días el link expira
    usos_maximos: 1 # un link = un referido (o configurar múltiple)
```

---

## 8. FEED SOCIAL — COMUNIDAD INTERNA DEL GYM

### 8.1 Concepto del Feed Social

```yaml
El feed social NO es otra red social más — es el espejo de la
comunidad del gym. Solo los miembros del gym pueden ver y publicar.
El contenido es exclusivamente fitness y bienestar.

Filosofía:
  "Tu siguiente PR lo estás viendo hoy en el feed de alguien más."
  "La persona que te inspira entrena en el mismo gym que tú."
```

### 8.2 Tipos de Publicaciones

```yaml
PUBLICACIONES AUTOMÁTICAS (generadas por el sistema con opt-in):

  PR desbloqueado:
    "💪 María García acaba de romper su récord en Hip Thrust: 70 kg × 12!
     ¡Increíble progreso! [👏 Felicitar] [❤️ Me inspira]"

  Medalla desbloqueada:
    "🏅 Pedro Ramírez desbloqueó la medalla '100 Sesiones'.
     ¡100 veces que eligió aparecer! [👏 Increíble] [❤️]"

  Nivel subido:
    "🥇 Ana Torres subió a nivel ORO. ¡Felicitaciones!
     [👏 Felicitar]"

  Racha especial:
    "🔥 Carlos Mejía lleva 30 días consecutivos.
     El gimnasio no lo puede parar. [🔥 Épico] [❤️]"

  Meta alcanzada:
    "🎯 Rosa Hernández alcanzó su meta de perder 5 kg.
     ¡Lo prometió y lo logró! [🥳 Celebrar] [❤️]"

PUBLICACIONES MANUALES (el miembro decide compartir):

  Foto de progreso:
    El miembro comparte una foto (puede ser antes/después)
    Con texto opcional
    Solo visible para miembros del gym (no es pública)
    El miembro decide: ¿mostrar nombre? ¿mostrar foto?

  Foto post-entreno:
    "Día 47 completado 💪 #NoPainNoGain"

  Compartir una receta saludable:
    "Mi batido post-entreno favorito: ..."

  Pregunta a la comunidad:
    "¿Alguien tiene tips para el Peso Muerto? Me está costando la técnica"
    (el trainer puede responder también — visibilidad extra para el trainer)

  Celebración espontánea:
    "¡Hoy por fin logré mi primera dominada completa! 3 meses buscando esto 🙌"

PUBLICACIONES DEL GYM (staff / admin):
  Anuncios de eventos
  Tips de entrenamiento y nutrición (del trainer o nutricionista)
  Presentación de nuevos equipos o clases
  Resultados de challenges del gym
  Mención de miembros destacados (con permiso)
  Novedades del gym
```

### 8.3 Moderación del Feed

```yaml
Moderación automática (primera capa):
  Filtro de lenguaje ofensivo o inapropiado
  Detección de spam (misma publicación múltiples veces)
  Detección de contenido adulto en imágenes (AI moderation)

Moderación manual (admin):
  El admin ve todas las publicaciones antes de que sean públicas
  (configurable: puede ser post-publicación también)
  Botón de "ocultar publicación" sin notificar al miembro
  Botón de "eliminar y avisar" con mensaje de explicación

Reporte por usuarios:
  Cualquier miembro puede reportar una publicación como inapropiada
  Al recibir 3 reportes: publicación automáticamente en revisión
  El admin recibe alerta para revisar

Lo que NO se permite en el feed:
  ❌ Publicidad de terceros (suplementos de otras tiendas, competidores)
  ❌ Contenido político o religioso
  ❌ Imágenes de desnudez o contenido sexual
  ❌ Insultos o críticas directas a otros miembros o al gym
  ❌ Desinformación sobre salud (el nutricionista o trainer pueden corregir)
```

### 8.4 Diseño del Feed en la App

```
COMUNIDAD — GYM ÉLITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Para ti ●] [Siguiendo] [Del gym] [Retos] [Eventos]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[FOTO DE PERFIL]  Pedro Ramírez  💎 Platino
                  hace 23 minutos · 🏋️ Entrenamiento

"Día 47 de mi reto personal. El press de banca ya no es mi
enemigo 😂 Subí 15 kg de mi PR inicial.

Para los que están empezando: la consistencia > la motivación.
La motivación va y viene. Los hábitos se quedan 💪"

[FOTO DEL GYM]

❤️ 23 me gusta    💬 8 comentarios    👏 Felicitar

Ver todos los comentarios:
  Carlos G. (trainer) ✓: "¡Técnica perfecta Pedro!
                          Ese trabajo en excéntrico está pagando 🔥"
  María García: "¡Inspirando como siempre! 👏"
  Ana Torres: "¡Brutal! Yo también voy a lograrlo 💪"
  [+ 5 más]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏅 GYM ÉLITE — hace 1 hora · LOGRO DEL GYM

"¡Rosa Hernández alcanzó su meta de -5 kg! 🎯🥳
 12 semanas de trabajo consistente dan estos resultados.
 Rosa, eres una inspiración para todos. ¡Felicitaciones! 🙌"

[FOTO DE ROSA (con su permiso)]

❤️ 67 me gusta    💬 31 comentarios
[Ver]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[👤 Foto]  ¿Qué quieres compartir hoy?    [📸 Foto] [💬 Post]
```

---

## 9. GRUPOS & COMUNIDADES POR OBJETIVO

### 9.1 Grupos del Gym

```yaml
Grupos automáticos (el sistema los crea y asigna):

  Por objetivo de membresía:
    Grupo "Pérdida de Peso" → todos los miembros con ese objetivo
    Grupo "Ganancia Muscular" → ídem
    Grupo "Fuerza" → ídem
    Grupo "Resistencia" → ídem

  Por clase grupal:
    Grupo "Spinners" → todos los inscritos habituales a Spinning
    Grupo "Yoga Squad" → ídem
    Grupo "HIIT Crew" → ídem

  Por trainer:
    "Equipo Carlos" → todos los clientes de Carlos G.
    "Equipo Laura" → ídem

  Por nivel de fidelidad:
    "Club Élite" → solo miembros de nivel ÉLITE y PLATINO
    "Nuevos Miembros" → miembros de <3 meses (para apoyo especial)

Grupos manuales (el admin los crea para ocasiones especiales):
  "Reto de Julio Squad" → participantes del challenge del mes
  "Madrugadores" → quienes habitualmente van antes de las 7am
  "Equipo Competencia Mayo" → preparación para un evento

Funcionalidades de cada grupo:
  Feed interno del grupo (solo los del grupo lo ven)
  Leaderboard del grupo (ranking interno)
  Challenge exclusivo del grupo
  Mensajes del trainer/admin a todo el grupo
  Eventos y meetups del grupo
  Comparativa de progreso entre miembros del grupo
```

---

## 10. BUDDY MATCHING — COMPAÑERO DE ENTRENO

### 10.1 Sistema de Emparejamiento

```yaml
Buddy Matching:
  ARIA sugiere posibles compañeros de entreno basándose en:

  Compatibilidad de horario:
    - Días y horas habituales de visita
    - Coincidencia de >60% de horario

  Compatibilidad de objetivo:
    - Mismo objetivo principal (pérdida de peso, masa, etc.)
    - Nivel de fitness similar (no un principiante con un avanzado)

  Compatibilidad social:
    - El miembro indica si prefiere: entrenar en silencio, con conversación, competitivo
    - Género: el miembro indica su preferencia

  Historial de matching:
    - No sugerir a alguien que ya rechazó antes
    - Priorizar personas que también están buscando buddy

Proceso de match:
  1. Miembro activa "Buscar compañero de entreno" en su perfil
  2. ARIA identifica los 3 mejores matches automáticamente
  3. ARIA notifica: "Oye Mari, encontré 3 personas con horarios
                     y objetivos similares a los tuyos 😊 ¿Las conoces?"
  4. Si el miembro acepta conocerlos: ARIA envía un mensaje presentación
     a ambos miembros simultáneamente:
     "Hola Pedro y María! Los dos entrenan los martes y jueves por la
      mañana con objetivos de fuerza similares. Pensamos que podrían
      motivarse mutuamente. ¿Se animan a verse esta semana? 💪"
  5. Si ambos aceptan: se conectan en el chat de la app
  6. ARIA hace seguimiento: "¿Cómo les fue entrenando juntos? ¿Lo repiten?"

Beneficios del buddy system:
  - Los buddies se retienen mutuamente (difícil fallar si tu compañero va)
  - El gym premia la primera sesión juntos: +30 pts para ambos
  - Si el buddy bate un PR juntos: bonus especial para los dos
  - "Tu buddy lleva 3 días sin venir — ¿lo animas a volver?" (ARIA)
```

---

## 11. TIENDA DE RECOMPENSAS (REWARD STORE)

### 11.1 Catálogo de Recompensas

```
TIENDA DE RECOMPENSAS — Canjea tus FitCoins
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu saldo: 🪙 2,840 FitCoins

CATEGORÍA: DESCUENTOS EN MEMBRESÍA
  💳 10% descuento en próxima mensualidad         500 pts  [Canjear]
  💳 20% descuento en próxima mensualidad         900 pts  [Canjear]
  💳 1 mes gratis (para miembros >6 meses)      5,000 pts  [Canjear]
  💳 Freeze de 1 semana gratis                    300 pts  [Canjear]

CATEGORÍA: SERVICIOS GRATUITOS
  🏋️ 1 Sesión PT gratis (30 min)                 500 pts  [Canjear]
  🏋️ 1 Sesión PT gratis (60 min)                 900 pts  [Canjear]
  🥗 1 Consulta nutricional gratis                600 pts  [Canjear]
  📊 1 Evaluación física gratuita                 400 pts  [Canjear]
  🧘 1 Clase grupal especial gratis               200 pts  [Canjear]

CATEGORÍA: MARKETPLACE
  🛒 $5 de crédito en la tienda del gym           500 pts  [Canjear]
  🛒 $10 de crédito en la tienda                  950 pts  [Canjear]
  🛒 $20 de crédito en la tienda                1,800 pts  [Canjear]
  🛒 1 Barra proteica gratis (tu elección)        150 pts  [Canjear]
  🛒 Shaker del gym personalizado                 400 pts  [Canjear]

CATEGORÍA: MERCHANDISE EXCLUSIVO
  👕 Camiseta exclusiva "GYM ÉLITE"               800 pts  ⭐ POPULAR
  🎒 Mochila GYM ÉLITE                          1,500 pts  [Canjear]
  🧢 Gorra GYM ÉLITE                             500 pts  [Canjear]
  🍼 Botella térmica personalizada               600 pts  [Canjear]

CATEGORÍA: EXPERIENCIAS
  🎁 Caja sorpresa de suplementos             1,000 pts  [Canjear]
  📸 Sesión de fotos de transformación          800 pts  [Canjear]
  👥 Clase privada para ti y un amigo         2,000 pts  [Canjear]
  🌟 1 mes de membresía Elite (upgrade)       3,000 pts  [Canjear]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[🎯 Solo tienes 160 pts para el descuento de 10% 💡]
```

### 11.2 Gestión de la Tienda de Recompensas (Admin)

```yaml
El admin gestiona el catálogo de recompensas:

  Agregar nueva recompensa:
    - Nombre, descripción, imagen
    - Costo en puntos
    - Tipo: descuento | servicio | producto | experiencia
    - Stock disponible (si es físico)
    - Disponible para: todos | solo nivel Oro+ | solo Élite
    - Vigencia: permanente | del dd/mm al dd/mm

  Recompensas más canjeadas (analytics):
    Top 5 recompensas por número de canjes
    Valor total de puntos canjeados
    Costo monetario real de las recompensas otorgadas
    ROI: ¿los miembros que canjean recompensas retienen más?

  Proceso de canje:
    Al seleccionar una recompensa en la app:
      El miembro confirma el canje
      Los puntos se descuentan inmediatamente
      Si es servicio: se genera un voucher único de uso único
      Si es producto: aparece en la cola de pedidos del marketplace
      Si es descuento: se aplica automáticamente en el próximo cobro
      Si es experiencia: se abre el flujo de agendamiento
```

---

## 12. EVENTOS & COMPETENCIAS INTERNAS DEL GYM

### 12.1 Tipos de Eventos

```yaml
EVENTOS REGULARES:

  Evaluación de progreso mensual:
    Fecha: último viernes del mes
    Formato: evaluación física colectiva + celebración de logros del mes
    Gamificación: puntos extra por participar + fotos del evento

  Challenge del mes:
    Cada mes el gym lanza un reto diferente (creado por el admin)
    Premiación: top 3 del leaderboard del challenge
    Evento de clausura: ceremonia de premiación (foto + reconocimiento)

  Clase especial de instructor invitado:
    Evento mensual/bimestral
    Un instructor externo o especialista da una clase única
    Solo para miembros (beneficio de pertenencia)

  Reto inter-clases:
    Ejemplo: "Spinners vs. HIIT crew — quién tiene más asistencia en el mes"
    Genera sana rivalidad y orgullo de grupo

COMPETENCIAS FORMALES (trimestrales o semestrales):

  Torneo de Fuerza:
    Categorías: peso corporal, edad, género
    Modalidades: press de banca, sentadilla, peso muerto (o combinado)
    Premios: trofeos físicos + membresías gratis + puntos
    Registrado en el perfil: "Campeón de Fuerza Q1 2026"

  Reto de Transformación:
    Período: 12 semanas
    Métrica: % de cambio en composición corporal
    Documentación: fotos de inicio y fin + evaluaciones físicas
    Premios: membresía anual gratis para el ganador
    El gym gana: historias de transformación poderosas para su marketing

  Challenge de Asistencia:
    Período: 30 o 60 días
    Métrica: mayor número de visitas
    Sin trampa: el sistema valida automáticamente cada check-in
    Premios: top 3 con beneficios de membresía + merchandise
```

### 12.2 Gestión de Eventos (Admin)

```
CREAR EVENTO — Panel Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nombre del evento: [Torneo de Fuerza — Julio 2026              ]
Tipo:              ● Competencia  ○ Clase especial  ○ Social
Fecha:             [19/07/2026]   Hora: [10:00am]
Duración:          [3 horas]
Cupo máximo:       [30 participantes]
Inscripción:       ● Gratuita para miembros  ○ Costo: $___
Registrarse hasta: [15/07/2026]

Descripción:
[El primer Torneo de Fuerza de GYM ÉLITE. 3 modalidades:
 Press de Banca, Sentadilla y Peso Muerto. Categorías por peso
 corporal y género. ¡Demuestra lo que construiste! 🏆         ]

Premios:
  1er lugar: Membresía de 3 meses gratis + Trofeo + 500 pts
  2do lugar: 1 mes gratis + 300 pts
  3er lugar: Evaluación física + Sesión PT + 200 pts

Comunicaciones:
  ● Anunciar 3 semanas antes
  ● Recordatorio 1 semana antes
  ● Recordatorio el día anterior
  ● Post con resultados después del evento

[Programar evento]
```

---

## 13. EXPERIENCIA DEL MIEMBRO — APP GAMIFICADA

### 13.1 Pantalla de Gamificación en la App

```
MI PROGRESO GAMIFICADO — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NIVEL ACTUAL:
  🥈 PLATA — El Comprometido
  [████████████████████░░░░░░░░░░░░░]  57% para ORO
  2,840 / 5,000 FitCoins   (2,160 puntos para subir)

  Lo que ganas al llegar a Oro:
  ✨ 10% descuento en la tienda
  ✨ Prioridad en reservas (72h antes)
  ✨ Evaluación física gratuita extra al año
  [¿Cómo puedo llegar más rápido a Oro?]  ← ZEUS responde

RACHA ACTUAL:
  🔥 13 días consecutivos
  Récord personal de racha: 28 días (conseguido en marzo)
  [¿Cómo mantener mi racha?]

MIS MEDALLAS (18 de 62 desbloqueadas):
  [Collage de las últimas 6 medallas obtenidas]
  ✅ Primer PR  ✅ 10 Sesiones  ✅ Plan Completo
  ✅ Embajador  ✅ 1 Año Contigo  ✅ Meta Alcanzada
  [Ver todas mis medallas]

MIS RETOS ACTIVOS:
  🔥 Reto de Junio: 20/30 días  (67%)
  🥗 Semana Nutricional: 5/7 días  (71%)
  [Ver todos mis retos]

MI POSICIÓN EN EL RANKING:
  FitCoins del mes: #23 de 247  (top 9%) ↑
  Asistencia del mes: #18 de 247  (top 7%) ↑
  [Ver leaderboards completos]

LOGROS PRÓXIMOS (lo que casi consigues):
  🥇 50 Sesiones: te faltan 8 sesiones
  🔥 Racha 30 días: te faltan 17 días más
  💪 Club del Peso Corporal: estás al 85% de tu peso corporal en Hip Thrust
  [Ver todos los logros posibles]
```

### 13.2 Notificaciones de Gamificación

```yaml
Notificaciones push de gamificación (todas configurables por el miembro):

  CELEBRACIÓN (tono: eufórico):
    Al desbloquear medalla:
      "🏅 ¡NUEVA MEDALLA DESBLOQUEADA! '100 Sesiones'
       ¡Has entrenado 100 veces! Eso es dedicación de verdad."

    Al batir PR:
      "🎉 ¡NUEVO RÉCORD PERSONAL!
       Hip Thrust: 70 kg × 12. ¡Tu mejor marca histórica!"

    Al subir de nivel:
      "🥇 ¡SUBISTE A NIVEL ORO!
       Mira los beneficios que acabas de desbloquear →"

  MOTIVACIÓN (tono: alentador):
    Racha en peligro (no ha ido en 23h del día planificado):
      "⏰ Oye Mari, hoy es tu día de entreno.
       Tu racha de 12 días te espera.
       ¿Vas esta tarde? 💪"

    Cerca de próxima medalla:
      "🏅 Estás a solo 2 sesiones de tu medalla '50 Sesiones'.
       ¡Esta semana lo puedes hacer!"

    Compañero del gym logró algo:
      "🔥 Pedro Ramírez acaba de batir su PR en Sentadilla.
       ¿Tú cuándo vas a batir el tuyo? 😊"

  SOCIAL (tono: comunitario):
    Alguien felicitó tu publicación:
      "❤️ 5 personas de tu gym te están felicitando por tu PR.
       ¡Tu comunidad te ve!"

    Nuevo buddy sugerido:
      "👥 ARIA encontró a alguien con tu mismo horario y objetivo.
       ¿Quieres conocer a tu posible compañero de entreno?"
```

---

## 14. PANEL DE GESTIÓN DE GAMIFICACIÓN (ADMIN)

### 14.1 Dashboard de Gamificación

```
GAMIFICACIÓN — Dashboard Admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMEN DEL MES — Junio 2026:

  FitCoins distribuidos:          124,800 pts  (a 247 miembros)
  FitCoins canjeados:              38,500 pts  (31% de los ganados)
  Valor estimado de recompensas:    $770.00

  MEDALLAS DESBLOQUEADAS: 234 medallas este mes
    Top 5 más desbloqueadas:
    1. Check-in diario:      89 desbloqueamientos
    2. Semana Perfecta:      45
    3. PR del ejercicio:     38
    4. 10 Sesiones:          31
    5. Embajador:            12

  DISTRIBUCIÓN DE NIVELES:
    👑 Élite:     3 miembros   (1.2%)
    💎 Platino:  12 miembros   (4.9%)
    🥇 Oro:      47 miembros  (19.0%)
    🥈 Plata:    98 miembros  (39.7%)
    🥉 Bronce:   87 miembros  (35.2%)

  CHALLENGES ACTIVOS: 3 challenges corriendo
    Reto de Junio: 89/247 participando (36%)
    Semana Nutricional: 45/98 (con plan activo) participando
    Madrugador de Junio: 23 participantes

  ENGAGEMENT SOCIAL:
    Publicaciones en el feed: 47 esta semana
    Reacciones totales: 312
    Comentarios: 89
    Kudos enviados entre miembros: 156

CORRELACIÓN CON RETENCIÓN:
  Miembros con nivel Oro+:     Churn 1.2% (vs. 3.8% general)
  Miembros con racha activa:   Churn 0.8% (vs. 3.8% general)
  Miembros activos en feed:    Churn 1.5% (vs. 3.8% general)

  Conclusión: La gamificación está funcionando.
  El ROI estimado: $2,340/mes en revenue retenido vs. $440/mes
  en costo de recompensas = ROI 432%
```

### 14.2 Motor de Reglas (Rule Engine)

```yaml
El admin puede configurar reglas personalizadas sin código:

EDITOR DE REGLAS:

  CUANDO: [el miembro completa ▼] [una sesión de entreno ▼]
  Y:      [es la primera sesión del día ▼]
  ENTONCES: [dar puntos ▼] [+20 puntos ▼]

  CUANDO: [el miembro alcanza ▼] [la racha de ▼] [7 días ▼]
  ENTONCES: [dar puntos ▼] [+100 puntos ▼]
          + [enviar notificación ▼] ["¡Increíble racha de 7 días! 🔥"]
          + [evaluar medalla ▼] [Racha Semanal]

  CUANDO: [el miembro NO visita ▼] [por más de ▼] [4 días ▼]
  ENTONCES: [enviar a ARIA ▼] [workflow de retención Nivel 1 ▼]
          + [reducir Risk Score ▼] [en 8 puntos ▼]

Reglas predefinidas (las que ya tiene el sistema):
  [Ver lista completa de reglas activas]
  [+ Agregar regla personalizada]
  [Pausar regla temporal]  [Eliminar regla]

  Historial de reglas disparadas hoy:
  • 09:23 — María García → Racha 13 días → +25 pts (racha 10+ días)
  • 09:15 — Pedro R. → PR en Press de Banca → +50 pts + notif. al gym
  • 10:41 — Ana Torres → Sin visita 4 días → WF-Retención nivel 1
  [Ver todos los disparos de hoy]
```

---

## 15. ANALYTICS DE ENGAGEMENT & COMUNIDAD

### 15.1 Métricas de Gamificación

```yaml
KPIs de gamificación disponibles en el Panel Ejecutivo:

ENGAGEMENT:
  Tasa de activación:
    % de miembros que participan activamente en la gamificación
    (ganaron puntos en los últimos 7 días)
    Meta: >60% | Benchmark: 45-55%

  Profundidad de uso:
    Promedio de acciones gamificadas por miembro por semana
    (check-ins + sesiones + registros nutricionales + interacciones sociales)

  DAU / MAU ratio:
    Daily Active Users / Monthly Active Users
    >25% = buena retención de engagement

RETENCIÓN CORRELACIONADA:
  Churn por nivel de gamificación:
    Nivel Bronce: X% churn
    Nivel Plata:  X% churn
    Nivel Oro:    X% churn
    Platino/Élite: X% churn
    → Correlación directa entre nivel y retención

  Racha activa y retención:
    Sin racha activa: X% churn mensual
    Racha 1-7 días: X% churn
    Racha 8-30 días: X% churn
    Racha >30 días: X% churn (casi 0)

COMUNIDAD:
  Feed engagement rate: % de miembros que interactúan con el feed semanal
  Content creation rate: % de miembros que publican (no solo leen)
  Viral coefficient de referidos: ¿cada miembro trae cuántos nuevos?

ECONOMÍA DE PUNTOS:
  Inflación de puntos: ¿se están acumulando sin canjear? → revisar recompensas
  Canjeo por categoría: ¿qué tipo de recompensa prefieren?
  Costo promedio de recompensa vs. LTV del miembro que la recibe
```

---

## 16. INTEGRACIÓN CON TODOS LOS MÓDULOS

### 16.1 El Módulo de Gamificación como Capa Transversal

```yaml
La gamificación ESCUCHA eventos de todos los módulos
y REACCIONA con puntos, medallas y notificaciones:

ESCUCHA DE:
  MOD-ACCESS:      MEMBER_CHECKED_IN → puntos + racha + leaderboard
  MOD-WORKOUT:     SESSION_COMPLETED → puntos + streak + medallas
                   PERSONAL_RECORD → puntos + medalla especial + feed post
                   PLAN_COMPLETED → puntos milestone + medalla
  MOD-NUTRITION:   FOOD_LOG_COMPLETED → puntos
                   NUTRITION_STREAK → puntos + medalla
  MOD-SCHEDULING:  CLASS_ATTENDED → puntos + clase streak
  MOD-MARKETPLACE: PURCHASE_MADE → puntos por compra
                   REVIEW_SUBMITTED → puntos por reseña
  MOD-FEEDBACK:    SURVEY_COMPLETED → puntos
  MOD-MEMBER:      BIRTHDAY → puntos regalo automático
                   MEMBERSHIP_ANNIVERSARY → puntos milestone
  MOD-REFERRAL:    REFERRAL_CONFIRMED → puntos + medalla de embajador

EMITE A:
  MOD-CRM (ARIA):   cuando el miembro sube de nivel → ARIA celebra
                    cuando el miembro está cerca de una medalla → ARIA motiva
                    cuando la racha está en peligro → ARIA interviene
  MOD-ANALYTICS:    todos los eventos de gamificación alimentan el BI
  MOD-NOTIF:        todas las notificaciones de logros y puntos
  MOD-BILLING:      cuando se canjean descuentos en membresía → aplica al billing
  MOD-MARKETPLACE:  cuando se canjean créditos en tienda → agrega al wallet
```

---

## 17. MODELO DE DATOS COMPLETO

```sql
-- ─────────────────────────────────────────────────────────────
-- CONFIGURACIÓN DE GAMIFICACIÓN DEL GYM
-- ─────────────────────────────────────────────────────────────
CREATE TABLE gamification_config (
  gym_id                UUID PRIMARY KEY REFERENCES gyms(id),
  points_currency_name  VARCHAR(50) DEFAULT 'FitCoins',
  points_currency_icon  TEXT,
  levels_config         JSONB NOT NULL,           -- definición de cada nivel
  points_rules          JSONB NOT NULL,           -- reglas de ganancia de puntos
  leaderboard_enabled   BOOLEAN DEFAULT TRUE,
  feed_enabled          BOOLEAN DEFAULT TRUE,
  buddy_matching_enabled BOOLEAN DEFAULT TRUE,
  points_expiry_days    INTEGER DEFAULT 365,
  referral_reward_days  INTEGER DEFAULT 30,       -- días que el referido debe ser activo
  referral_benefit_percent DECIMAL(5,2) DEFAULT 15,
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SALDO DE PUNTOS POR MIEMBRO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_points (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL UNIQUE REFERENCES members(id),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  total_earned          INTEGER NOT NULL DEFAULT 0,   -- histórico total ganado
  total_redeemed        INTEGER NOT NULL DEFAULT 0,   -- histórico total canjeado
  current_balance       INTEGER NOT NULL DEFAULT 0,   -- saldo disponible
  lifetime_balance      INTEGER NOT NULL DEFAULT 0,   -- para cálculo de nivel
  current_level         VARCHAR(20) DEFAULT 'bronze',
  level_updated_at      TIMESTAMP,
  active_streak_days    INTEGER DEFAULT 0,
  longest_streak_days   INTEGER DEFAULT 0,
  last_activity_at      TIMESTAMP,
  points_expiry_at      TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TRANSACCIONES DE PUNTOS (log completo)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE points_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  transaction_type      VARCHAR(20) NOT NULL,  -- earn|redeem|expire|adjustment|bonus
  amount                INTEGER NOT NULL,       -- positivo = ganó, negativo = canjeó
  balance_after         INTEGER NOT NULL,
  source_event          VARCHAR(100),           -- CHECK_IN|SESSION_COMPLETED|PR|etc.
  source_module         VARCHAR(30),
  source_reference_id   UUID,                   -- ID del evento fuente
  description           VARCHAR(200),
  rule_id               UUID,                   -- qué regla de gamificación disparó esto
  is_bonus              BOOLEAN DEFAULT FALSE,
  expires_at            TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  INDEX (member_id, created_at DESC),
  INDEX (gym_id, created_at DESC)
);

-- ─────────────────────────────────────────────────────────────
-- CATÁLOGO DE MEDALLAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE badge_catalog (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID REFERENCES gyms(id),  -- null = badge del sistema
  code                  VARCHAR(50) NOT NULL,
  name                  VARCHAR(100) NOT NULL,
  description           TEXT NOT NULL,
  category              VARCHAR(30) NOT NULL,
  rarity                VARCHAR(20) DEFAULT 'common', -- common|rare|legendary|unique
  icon_url              TEXT,
  animation_url         TEXT,
  points_reward         INTEGER DEFAULT 0,
  trigger_type          VARCHAR(50),               -- tipo de evento que lo dispara
  trigger_config        JSONB,                     -- configuración del trigger
  celebration_message   TEXT,
  extra_benefit         TEXT,
  is_repeatable         BOOLEAN DEFAULT FALSE,     -- se puede ganar múltiples veces
  is_active             BOOLEAN DEFAULT TRUE,
  display_order         INTEGER,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- MEDALLAS GANADAS POR MIEMBRO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_badges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             UUID NOT NULL REFERENCES members(id),
  badge_id              UUID NOT NULL REFERENCES badge_catalog(id),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  earned_at             TIMESTAMP NOT NULL DEFAULT NOW(),
  context_data          JSONB,                     -- datos del logro (ej: peso levantado)
  is_featured           BOOLEAN DEFAULT FALSE,     -- el miembro lo pone en destacados
  times_earned          INTEGER DEFAULT 1,         -- para medallas repetibles
  UNIQUE (member_id, badge_id)                     -- a menos que is_repeatable
);

-- ─────────────────────────────────────────────────────────────
-- CHALLENGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE challenges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  title                 VARCHAR(200) NOT NULL,
  description           TEXT,
  challenge_type        VARCHAR(20) NOT NULL,  -- individual|group|gym_wide|squad
  metric_type           VARCHAR(50) NOT NULL,  -- checkins|sessions|volume|streak|nutrition
  target_value          DECIMAL(12,2) NOT NULL,
  starts_at             TIMESTAMP NOT NULL,
  ends_at               TIMESTAMP NOT NULL,
  auto_enroll           BOOLEAN DEFAULT FALSE,
  eligible_plans        TEXT[],
  max_participants      INTEGER,
  status                VARCHAR(20) DEFAULT 'upcoming',
  reward_points         INTEGER DEFAULT 0,
  reward_badge_id       UUID REFERENCES badge_catalog(id),
  reward_description    TEXT,
  image_url             TEXT,
  created_by            UUID REFERENCES staff(id),
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE challenge_participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id          UUID NOT NULL REFERENCES challenges(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  enrolled_at           TIMESTAMP DEFAULT NOW(),
  current_progress      DECIMAL(12,2) DEFAULT 0,
  completed             BOOLEAN DEFAULT FALSE,
  completed_at          TIMESTAMP,
  rank                  INTEGER,
  reward_granted        BOOLEAN DEFAULT FALSE,
  UNIQUE (challenge_id, member_id)
);

-- ─────────────────────────────────────────────────────────────
-- FEED SOCIAL
-- ─────────────────────────────────────────────────────────────
CREATE TABLE social_posts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  author_id             UUID NOT NULL REFERENCES members(id),
  author_type           VARCHAR(20) DEFAULT 'member', -- member|staff|system
  post_type             VARCHAR(30) NOT NULL,
  -- manual|auto_pr|auto_badge|auto_level|auto_goal|auto_streak|gym_announcement
  content               TEXT,
  media_urls            TEXT[],
  linked_badge_id       UUID REFERENCES badge_catalog(id),
  linked_pr_id          UUID,
  visibility            VARCHAR(20) DEFAULT 'gym_members',
  moderation_status     VARCHAR(20) DEFAULT 'pending',
  -- pending|approved|rejected|auto_approved
  moderated_by          UUID REFERENCES staff(id),
  moderated_at          TIMESTAMP,
  likes_count           INTEGER DEFAULT 0,
  comments_count        INTEGER DEFAULT 0,
  kudos_count           INTEGER DEFAULT 0,
  is_pinned             BOOLEAN DEFAULT FALSE,
  is_featured           BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMP DEFAULT NOW(),
  INDEX (gym_id, moderation_status, created_at DESC)
);

CREATE TABLE social_reactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id               UUID NOT NULL REFERENCES social_posts(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  reaction_type         VARCHAR(20) NOT NULL, -- like|kudos|inspire|fire
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (post_id, member_id, reaction_type)
);

CREATE TABLE social_comments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id               UUID NOT NULL REFERENCES social_posts(id),
  author_id             UUID NOT NULL REFERENCES members(id),
  content               TEXT NOT NULL,
  is_moderated          BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SISTEMA DE REFERIDOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE referral_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  referrer_member_id    UUID NOT NULL REFERENCES members(id),
  code                  VARCHAR(20) NOT NULL UNIQUE,
  url_slug              VARCHAR(100) NOT NULL UNIQUE,
  uses_count            INTEGER DEFAULT 0,
  successful_referrals  INTEGER DEFAULT 0,
  is_active             BOOLEAN DEFAULT TRUE,
  expires_at            TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  referral_link_id      UUID NOT NULL REFERENCES referral_links(id),
  referrer_id           UUID NOT NULL REFERENCES members(id),
  referee_id            UUID REFERENCES members(id),       -- null hasta que se registre
  referee_name          VARCHAR(200),
  referee_email         VARCHAR(150),
  status                VARCHAR(20) DEFAULT 'clicked',
  -- clicked|registered|active|qualified|rewarded
  registered_at         TIMESTAMP,
  activated_at          TIMESTAMP,
  qualified_at          TIMESTAMP,                         -- cuando cumple los 30 días
  referrer_reward_type  VARCHAR(30),
  referrer_reward_value DECIMAL(10,2),
  referrer_rewarded_at  TIMESTAMP,
  referee_discount_pct  DECIMAL(5,2),
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TIENDA DE RECOMPENSAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE reward_catalog (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  name                  VARCHAR(200) NOT NULL,
  description           TEXT,
  category              VARCHAR(30) NOT NULL,
  -- membership_discount|service|marketplace_credit|merchandise|experience
  points_cost           INTEGER NOT NULL,
  stock_available       INTEGER,                  -- null = ilimitado
  min_level_required    VARCHAR(20) DEFAULT 'bronze',
  reward_value          DECIMAL(10,2),            -- valor monetario real
  redemption_type       VARCHAR(20),              -- instant|voucher|scheduled
  is_active             BOOLEAN DEFAULT TRUE,
  valid_from            TIMESTAMP,
  valid_until           TIMESTAMP,
  image_url             TEXT,
  sort_order            INTEGER DEFAULT 0,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reward_redemptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  reward_id             UUID NOT NULL REFERENCES reward_catalog(id),
  points_spent          INTEGER NOT NULL,
  voucher_code          VARCHAR(50) UNIQUE,
  status                VARCHAR(20) DEFAULT 'pending',
  -- pending|delivered|used|expired|cancelled
  delivered_at          TIMESTAMP,
  used_at               TIMESTAMP,
  expires_at            TIMESTAMP,
  fulfilled_by          UUID REFERENCES staff(id),
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CHECKLIST DE CONFIGURACIÓN

```
CONFIGURACIÓN INICIAL DE GAMIFICACIÓN:
□ Nombre de la moneda de puntos elegido (FitCoins, PowerPts, etc.)
□ Tabla de puntos por acción configurada y revisada por el admin
□ Niveles de membresía configurados con beneficios reales y atractivos
□ Al menos 20 medallas cargadas con mensajes inspiracionales
□ Tienda de recompensas con mínimo 10 items (mix de gratuitos y premium)
□ Primer challenge del mes creado y programado
□ Sistema de referidos activado con beneficios para referidor y referido
□ Feed social activado con moderación configurada
□ Leaderboard visible en la app (opt-in de privacidad configurado)
□ Reglas anti-abuso del sistema de puntos activadas
□ Notificaciones de gamificación configuradas (qué se notifica y cómo)
□ Correlación con Risk Score del CRM (bajada de nivel = alerta)

COMUNICACIÓN DEL LANZAMIENTO:
□ Email a todos los miembros explicando el sistema de puntos
□ Video corto (30-60 seg) en el feed del gym explicando los niveles
□ Cartelería física en el gym sobre el programa (si aplica)
□ Primer challenge de lanzamiento activo (genera buzz inicial)
□ Primeras medallas "de bienvenida" asignadas a todos los miembros existentes
□ Staff capacitado para explicar el sistema a cualquier miembro

SEGUIMIENTO (mensual):
□ Revisar % de miembros activos en gamificación (meta: >60%)
□ Revisar correlación entre nivel y churn (debe ser inversamente proporcional)
□ Revisar canjes en la tienda (¿se canjea lo suficiente?)
□ Ajustar puntos si hay inflación o deflación del sistema
□ Crear nuevo challenge del mes antes del día 25 del mes anterior
□ Revisar medallas más cercanas a desbloquear (para campañas ARIA)
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulo: GYM-MOD-GAME_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión: Septiembre 2026_
