# 💳 MÓDULO GESTIÓN DE MEMBRESÍAS & BILLING/PAGOS

## App Integral de Gimnasio de Élite

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Códigos del Módulo:** `GYM-MOD-MEM` (Membresías) · `GYM-MOD-BIL` (Billing & Pagos)  
> **Prioridad:** MVP Fase 1 — Core del negocio  
> **Módulos relacionados:** CRM (Mod-B), Acceso & Control (Mod-H), Marketplace (Mod-E), Panel Ejecutivo (Mod-J), ARIA Asistente Virtual

---

## 📋 TABLA DE CONTENIDO

### PARTE I — GESTIÓN DE MEMBRESÍAS

1. [Visión General del Módulo](#1-visión-general-del-módulo-membresías)
2. [Catálogo de Tipos de Membresía](#2-catálogo-de-tipos-de-membresía)
3. [Ciclo de Vida Completo del Miembro](#3-ciclo-de-vida-completo-del-miembro)
4. [Onboarding Digital del Nuevo Miembro](#4-onboarding-digital-del-nuevo-miembro)
5. [Contratos Digitales & Documentación Legal](#5-contratos-digitales--documentación-legal)
6. [Gestión de Estados de Membresía](#6-gestión-de-estados-de-membresía)
7. [Freeze, Pausa & Suspensión](#7-freeze-pausa--suspensión)
8. [Upgrades, Downgrades & Cambios de Plan](#8-upgrades-downgrades--cambios-de-plan)
9. [Cancelaciones & Política de Retención](#9-cancelaciones--política-de-retención)
10. [Membresías Especiales & Corporativas](#10-membresías-especiales--corporativas)
11. [Portal de Autoservicio del Miembro](#11-portal-de-autoservicio-del-miembro)

### PARTE II — BILLING & PAGOS

12. [Visión General del Módulo de Billing](#12-visión-general-del-módulo-de-billing)
13. [Arquitectura de Cobros Recurrentes](#13-arquitectura-de-cobros-recurrentes)
14. [Métodos y Pasarelas de Pago](#14-métodos-y-pasarelas-de-pago)
15. [Gestión de Pagos Fallidos & Recuperación](#15-gestión-de-pagos-fallidos--recuperación)
16. [Facturación Electrónica & Documentos Fiscales](#16-facturación-electrónica--documentos-fiscales)
17. [Sistema de Descuentos, Cupones & Promociones](#17-sistema-de-descuentos-cupones--promociones)
18. [Gift Cards & Vouchers](#18-gift-cards--vouchers)
19. [Crédito Interno & Wallet del Miembro](#19-crédito-interno--wallet-del-miembro)
20. [Integración Contable & Conciliación](#20-integración-contable--conciliación)
21. [Reportes Financieros & KPIs](#21-reportes-financieros--kpis)
22. [Seguridad & Cumplimiento PCI-DSS](#22-seguridad--cumplimiento-pci-dss)
23. [Modelo de Datos Completo](#23-modelo-de-datos-completo)

---

# PARTE I — GESTIÓN DE MEMBRESÍAS

---

## 1. VISIÓN GENERAL DEL MÓDULO (MEMBRESÍAS)

### 1.1 Propósito

El módulo de **Gestión de Membresías** es el motor de ingresos del gimnasio. Controla quién tiene acceso, a qué servicios, en qué condiciones y por cuánto tiempo — conectando directamente con el sistema de acceso físico, el billing automático y el CRM de retención.

Va mucho más allá de un simple directorio: es un sistema de **relaciones contractuales dinámicas** que se adapta al ciclo de vida de cada miembro, gestiona documentación legal, automatiza comunicaciones y provee al propietario visibilidad total del estado de su cartera de membresías.

### 1.2 Principios de Diseño

| Principio                    | Implementación                                                     |
| ---------------------------- | ------------------------------------------------------------------ |
| **Flexibilidad total**       | Cualquier tipo de membresía es configurable sin tocar código       |
| **Automatización primero**   | Renovaciones, cobros, notificaciones — todo automático por defecto |
| **Transparencia al miembro** | El miembro ve en tiempo real su estado, pagos y beneficios         |
| **Zero friction**            | Contratar, actualizar o cancelar debe ser posible sin ir al gym    |
| **Protección del negocio**   | Contratos digitales, políticas claras y cumplimiento automático    |

---

## 2. CATÁLOGO DE TIPOS DE MEMBRESÍA

### 2.1 Arquitectura del Catálogo

El administrador configura todos los tipos de membresía desde el panel. Cada tipo es completamente personalizable:

```yaml
# Estructura base de un tipo de membresía
membership_type:
  id: UUID
  gym_id: UUID
  name: 'Membresía Elite Anual'
  code: 'ELITE-ANN' # código interno para reportes
  category: annual # monthly | quarterly | semester | annual | pack | day_pass | custom
  description: 'Acceso ilimitado a todas las instalaciones 24/7...'

  # Duración
  duration:
    type: fixed # fixed | rolling | sessions | unlimited
    value: 12 # número de unidades
    unit: months # days | weeks | months | years | sessions

  # Precio
  pricing:
    base_price: 450.00 # precio base del período
    currency: USD
    billing_frequency: upfront # upfront | monthly | weekly
    # si billing_frequency = monthly:
    monthly_price: 40.00
    setup_fee: 20.00 # cuota de inscripción (puede ser 0)
    setup_fee_waivable: true # si se puede exonerar en promociones

  # Accesos incluidos
  access:
    facilities: [gym_floor, cardio_room, locker_room, parking]
    classes_included: all # all | list | none
    class_credits_per_month: null # null = ilimitado
    pt_sessions_included: 0 # sesiones PT mensuales incluidas
    guest_passes_per_month: 2
    spa_access: false
    pool_access: false
    sauna_access: false
    locations: [all] # all | [location_id_1, location_id_2]
    access_hours: '24/7' # "24/7" | "06:00-22:00" | custom

  # Contratos y compromisos
  commitment:
    minimum_period_months: 12 # compromiso mínimo
    cancellation_notice_days: 30
    early_cancellation_fee: 150.00
    auto_renew: true
    renewal_notice_days: 30 # avisar al miembro X días antes de renovación

  # Freeze
  freeze_policy:
    allowed: true
    max_times_per_year: 2
    max_duration_days: 30
    min_days_between_freezes: 30
    fee_per_freeze: 0.00 # costo por congelar (puede ser 0)
    extends_end_date: true # si el freeze extiende la fecha de fin

  # Disponibilidad
  availability:
    is_active: true
    visible_in_app: true
    min_age: 18
    max_age: null
    requires_approval: false # si requiere aprobación manual del admin
    max_members: null # límite total de membresías de este tipo

  # Extras
  includes_towel_service: false
  includes_nutrition_consultation: true
  includes_fitness_evaluation: true
  priority_booking: true # prioridad en reservas de clases
  discount_retail: 10 # % descuento en marketplace

  # Metadata
  created_at: timestamp
  updated_at: timestamp
```

### 2.2 Catálogo Predefinido de Membresías (Ejemplo Completo)

#### 🏷️ MEMBRESÍAS POR DURACIÓN

| Tipo               | Precio         | Compromiso     | Acceso            | Incluye                             |
| ------------------ | -------------- | -------------- | ----------------- | ----------------------------------- |
| **Day Pass**       | $10/día        | Sin compromiso | Horario comercial | Solo gym floor                      |
| **Semana Trial**   | $25/semana     | 7 días         | Horario comercial | Clases grupales incluidas           |
| **Mensual Básica** | $45/mes        | Mes a mes      | 06:00–22:00       | Gym floor + cardio                  |
| **Mensual Plus**   | $65/mes        | 3 meses mínimo | 05:00–23:00       | Todo + 2 clases grupales/sem        |
| **Mensual Elite**  | $85/mes        | 6 meses mínimo | 24/7              | Todo ilimitado + evaluación mensual |
| **Trimestral**     | $165/trimestre | 3 meses        | 05:00–23:00       | Todo + 1 sesión PT                  |
| **Semestral**      | $280/semestre  | 6 meses        | 24/7              | Todo + 2 sesiones PT                |
| **Anual Classic**  | $480/año       | 12 meses       | 24/7              | Todo + 4 sesiones PT + evaluaciones |
| **Anual Elite**    | $650/año       | 12 meses       | 24/7 VIP          | Todo + 8 PT + nutrición + locker    |

#### 🏋️ PACKS DE SESIONES (Sin Fecha de Vencimiento de Membresía)

| Pack                 | Sesiones              | Precio | Precio/Sesión | Válido Por |
| -------------------- | --------------------- | ------ | ------------- | ---------- |
| **Pack PT Starter**  | 5 sesiones PT         | $175   | $35           | 2 meses    |
| **Pack PT Standard** | 10 sesiones PT        | $300   | $30           | 3 meses    |
| **Pack PT Premium**  | 20 sesiones PT        | $500   | $25           | 6 meses    |
| **Pack Clases 10**   | 10 clases grupales    | $80    | $8            | 2 meses    |
| **Pack Clases 20**   | 20 clases grupales    | $140   | $7            | 3 meses    |
| **Pack Nutrición 4** | 4 consultas nutrición | $120   | $30           | 4 meses    |

#### 👨‍👩‍👧 MEMBRESÍAS FAMILIARES

```yaml
Membresía Familiar:
  titulares: 1 titular (paga precio base)
  dependientes:
    - hasta 4 dependientes
    - descuento 30% para cónyuge / pareja
    - descuento 40% para hijos menores de 18 años
    - descuento 20% para padres/suegros
  acceso: todos en el mismo horario del plan familiar
  facturación: un solo cobro consolidado al titular
  contratos: contrato individual por cada miembro de la familia
```

#### 🏢 MEMBRESÍAS CORPORATIVAS

```yaml
Membresía Corporativa:
  empresa: se registra como cuenta corporativa
  empleados:
    - mínimo 5 empleados para precio corporativo
    - escala de descuentos según volumen:
        5–10 empleados: 15% descuento
        11–25 empleados: 20% descuento
        26–50 empleados: 25% descuento
        51+ empleados: 30% descuento + account manager dedicado
  facturación:
    - mensual a la empresa (una factura consolidada)
    - o descuento en nómina del empleado (integración con RR.HH.)
  reportes: reporte mensual de uso para el área de RR.HH.
  beneficio empresa: RSE / bienestar corporativo certificado
```

#### 🎓 MEMBRESÍAS ESPECIALES

| Tipo                          | Descuento                | Documentación Requerida    |
| ----------------------------- | ------------------------ | -------------------------- |
| **Estudiante**                | 25% sobre Mensual Básica | Carnet estudiantil vigente |
| **Adulto Mayor (60+)**        | 30% sobre cualquier plan | DUI o pasaporte            |
| **Fuerzas Armadas / Policía** | 20%                      | Credencial institucional   |
| **Personal de Salud**         | 20%                      | Carnet profesional         |
| **Exalumno del Gym**          | 15% win-back             | Historial en el sistema    |

---

## 3. CICLO DE VIDA COMPLETO DEL MIEMBRO

### 3.1 Diagrama de Estados

```
                    ┌─────────────┐
                    │    LEAD     │ ← Contacto inicial
                    └──────┬──────┘
                           │ Calificado por ARIA
                    ┌──────▼──────┐
                    │    TRIAL    │ ← Período de prueba (3-7 días)
                    └──────┬──────┘
                           │ Conversión
          ┌────────────────▼────────────────┐
          │                                 │
   ┌──────▼──────┐                  ┌──────▼──────┐
   │   ACTIVO    │◄─── Reactivar ───│  CANCELADO  │
   └──────┬──────┘                  └─────────────┘
          │
    ┌─────┼─────────────┐
    │     │             │
    ▼     ▼             ▼
┌───────┐ ┌──────────┐ ┌──────────────┐
│FREEZE │ │ VENCIDO  │ │  PRE-CANCEL  │
│(pausa)│ │(sin pago)│ │ (proceso de  │
└───┬───┘ └────┬─────┘ │  cancelación)│
    │          │       └──────┬───────┘
    │   Paga/  │              │ Confirma
    └──reanuda─┘         cancelación
                              │
                         ┌────▼────┐
                         │CANCELADO│
                         └─────────┘
```

### 3.2 Transiciones y Reglas

```yaml
Transiciones automáticas:
  ACTIVO → VENCIDO:
    trigger: fecha_fin + 3 días de gracia sin pago
    acción: bloqueo de acceso físico + notificación + inicio WF retención

  ACTIVO → FREEZE:
    trigger: solicitud del miembro (sujeto a política)
    acción: pausar cobro, pausar acceso, extendar fecha fin

  FREEZE → ACTIVO:
    trigger: fecha de fin del freeze o solicitud del miembro
    acción: reanudar cobro, reanudar acceso

  VENCIDO → ACTIVO:
    trigger: pago exitoso
    acción: reactivar acceso, continuar desde donde quedó o renovar

  ACTIVO → PRE-CANCEL:
    trigger: solicitud de cancelación del miembro
    acción: iniciar proceso, verificar período de aviso, calcular monto pendiente

  PRE-CANCEL → CANCELADO:
    trigger: confirmación + cumplimiento de período de aviso
    acción: cancelar acceso en fecha indicada, emitir documentos

  CANCELADO → ACTIVO (Win-Back):
    trigger: nuevo contrato + pago de inscripción
    acción: nuevo perfil de membresía (mantiene historial anterior vinculado)
```

---

## 4. ONBOARDING DIGITAL DEL NUEVO MIEMBRO

### 4.1 Flujo Completo de Registro

```
PASO 1: CAPTURA DE DATOS BÁSICOS
  Canales: App / Web / Recepción (staff registra) / ARIA (WhatsApp/Telegram)
  Datos: nombre, email, teléfono, fecha nacimiento, foto
  Sistema: crea perfil provisional (status: pending)
  → ARIA o staff selecciona el plan de membresía

PASO 2: SELECCIÓN DE MEMBRESÍA
  El prospecto ve: cards visuales de cada plan con:
  - Precio destacado
  - Lista de beneficios incluidos
  - Comparativa visual entre planes
  - Testimoniales de otros miembros (si el gym los configura)
  - Botón "Seleccionar este plan"

PASO 3: CONFIGURACIONES ADICIONALES
  ¿Quiere agregar add-ons?
  □ Locker dedicado (+$10/mes)
  □ Toallas incluidas (+$8/mes)
  □ Estacionamiento (+$15/mes)
  □ Sesiones PT adicionales (+$X/sesión)
  □ Plan nutricional (+$20/mes)

  ¿Descuento aplicable?
  □ Código de referido
  □ Cupón promocional
  □ Membresía especial (estudiante, adulto mayor, etc.)

PASO 4: RESUMEN Y CONFIRMACIÓN
  Resumen claro antes de firmar:
  ┌────────────────────────────────────────────┐
  │  RESUMEN DE TU MEMBRESÍA                   │
  │                                            │
  │  Plan:        Mensual Elite                │
  │  Duración:    Mes a mes (mín. 6 meses)     │
  │  Precio:      $85.00/mes                   │
  │  Inscripción: $20.00 (pago único hoy)      │
  │  Add-ons:     Locker $10/mes               │
  │  TOTAL HOY:   $115.00                      │
  │  Siguiente cobro: 10 de julio 2026         │
  │                                            │
  │  Acceso 24/7 · Clases ilimitadas           │
  │  Evaluación mensual · 2 sesiones PT/mes    │
  └────────────────────────────────────────────┘

PASO 5: FIRMA DE CONTRATO DIGITAL
  (Ver sección 5 en detalle)

PASO 6: PAGO INICIAL
  - Cuota de inscripción + primer período
  - Guardar método de pago para cobros futuros
  - Proceso seguro PCI-DSS compliant

PASO 7: ACTIVACIÓN Y BIENVENIDA
  - Generación inmediata de QR de acceso
  - Envío de credenciales de la app
  - Activación en control de acceso físico
  - Inicio del WF-001 (Onboarding de ARIA)
  - Email de bienvenida con todo el detalle
```

### 4.2 Evaluación Física Inicial

```yaml
Evaluación inicial (obligatoria para planes >mensual, opcional para básicos):

Datos recopilados por el trainer asignado:
  Biométricos:
    - Peso (kg): báscula digital conectada
    - Estatura (cm)
    - % Grasa corporal: bioimpedancia eléctrica
    - Masa muscular (kg)
    - Masa ósea (kg)
    - Agua corporal (%)
    - Metabolismo basal (kcal/día)
    - IMC calculado

  Circunferencias (cinta métrica):
    - Cintura (cm)
    - Cadera (cm)
    - Pecho (cm)
    - Brazo derecho/izquierdo relajado y contraído (cm)
    - Muslo derecho/izquierdo (cm)
    - Pantorrilla derecha/izquierda (cm)

  Tests de capacidad física:
    - Test de push-ups (máximo en 1 minuto)
    - Test de sentadillas (máximo en 1 minuto)
    - Flexión de tronco (cm)
    - Test de escalón (FC a los 3 minutos) → estimación VO2max
    - Fuerza de agarre (dinamómetro, si disponible)
    - Tiempo en plancha (segundos)

  Fotos de inicio:
    - Frente, perfil izquierdo, perfil derecho, dorso
    - Almacenadas encriptadas, solo acceso del miembro y trainer
    - Base para comparativas futuras

  Notas médicas:
    - Lesiones previas
    - Condiciones crónicas
    - Medicamentos relevantes
    - Restricciones de movimiento

Resultado:
  - Informe PDF automático generado
  - Enviado al miembro por email + disponible en la app
  - Base para el plan personalizado del trainer
  - Programada próxima evaluación en el calendario (30–60 días)
```

---

## 5. CONTRATOS DIGITALES & DOCUMENTACIÓN LEGAL

### 5.1 Motor de Contratos

```yaml
Sistema de contratos digitales:
  Generación:
    - Template configurable por el gym (con su logo, datos legales, cláusulas propias)
    - Variables dinámicas auto-completadas: nombre, plan, precio, fechas, términos
    - Preview antes de firmar (PDF preview en la app/web)
    - Multi-idioma: español (principal), inglés (si el gym lo requiere)

  Firma electrónica:
    - Firma con dedo/stylus en pantalla táctil (app o tablet de recepción)
    - Firma criptográfica con timestamp y hash del documento
    - Verificación por OTP (código SMS al teléfono del miembro)
    - Cumplimiento: Ley de Firma Electrónica de El Salvador + estándares internacionales
    - Provider: DocuSign API / HelloSign / firma propia con OpenSSL

  Almacenamiento:
    - PDF firmado con hash SHA-256 almacenado en S3 encriptado
    - Inalterable post-firma (cualquier modificación invalida el hash)
    - Acceso: miembro (descarga desde app), staff (panel), legal del gym
    - Respaldo automático en segundo cloud provider

  Distribución:
    - Email automático al miembro con PDF adjunto al firmar
    - Disponible en la app → "Mis Documentos"
    - El gym recibe notificación de firma completada
```

### 5.2 Cláusulas Estándar del Contrato

```
El sistema incluye las siguientes cláusulas configurables:

1. PARTES DEL CONTRATO
   Datos del gym (razón social, NIT, dirección) + datos del miembro

2. DESCRIPCIÓN DEL SERVICIO
   Plan contratado, accesos incluidos, período de vigencia
   (auto-completado desde el catálogo de membresías)

3. PRECIO Y FORMA DE PAGO
   Monto, frecuencia de cobro, método de pago autorizado,
   fecha del primer y siguiente cobro

4. AUTORIZACIÓN DE COBRO AUTOMÁTICO
   *** Cláusula crítica ***
   El miembro autoriza expresamente el débito automático a
   su tarjeta/cuenta en las fechas pactadas

5. PERÍODO DE COMPROMISO
   Duración mínima, consecuencias de cancelación anticipada,
   monto de penalización (si aplica)

6. POLÍTICA DE FREEZE/PAUSA
   Condiciones, máximo de veces, duración máxima, costos

7. POLÍTICA DE CANCELACIÓN
   Aviso requerido, canal de solicitud, fecha efectiva,
   penalizaciones, reembolsos aplicables

8. NORMAS DE CONDUCTA Y USO DE INSTALACIONES
   Código de conducta, responsabilidad por daños,
   uso del equipamiento, vestimenta requerida

9. EXONERACIÓN DE RESPONSABILIDAD MÉDICA
   *** Cláusula de salud ***
   El miembro declara estar en condiciones físicas para ejercitarse,
   recomendación de evaluación médica previa,
   exoneración por lesiones derivadas del uso inadecuado

10. PROTECCIÓN DE DATOS PERSONALES
    Finalidad del tratamiento de datos, derechos del titular,
    canales de comunicación autorizados (GDPR/Ley local)

11. MODIFICACIONES AL SERVICIO
    Derecho del gym a modificar horarios/servicios con previo aviso,
    derecho del miembro a cancelar sin penalización si cambios son materiales

12. JURISDICCIÓN Y RESOLUCIÓN DE DISPUTAS
    Ley aplicable, proceso de mediación antes de litigio

FIRMA DEL MIEMBRO + FECHA + HASH CRIPTOGRÁFICO
SELLO DIGITAL DEL GYM
```

### 5.3 Otros Documentos Gestionados

```yaml
Documentos adicionales:
  Addendum de membresía familiar:
    - Registro de cada dependiente
    - Consentimiento del titular para cobros
    - Para menores: autorización y tutela del padre/madre

  Contrato corporativo:
    - Entre el gym y la empresa
    - Lista de empleados autorizados
    - Condiciones de facturación B2B
    - Proceso de altas y bajas de empleados

  Declaración de salud:
    - Formulario pre-ejercicio PAR-Q (Physical Activity Readiness)
    - Condiciones médicas declaradas
    - Firma de aceptación de riesgo
    - Recomendación de evaluación médica si PAR-Q positivo

  Consentimiento de imagen:
    - Autorización para uso de fotos/videos del miembro en marketing
    - Opt-in granular: redes sociales / sitio web / material impreso
    - Revocable en cualquier momento

  Política de privacidad aceptada:
    - Versión específica aceptada + fecha
    - Log de cambios de política con re-aceptación
```

---

## 6. GESTIÓN DE ESTADOS DE MEMBRESÍA

### 6.1 Estados y Transiciones

```yaml
Estado: ACTIVO
  acceso_fisico: habilitado
  cobros: según calendario de billing
  app_acceso: completo
  aria_mode: proactivo_positivo
  indicador_visual: 🟢 Verde

  sub-estados:
    activo_al_dia: sin deudas, sin alertas
    activo_con_aviso: falta menos de X días para renovación
    activo_en_freeze: membresía congelada (sub-estado)

Estado: TRIAL
  acceso_fisico: habilitado (horario restringido si aplica)
  cobros: ninguno hasta conversión
  app_acceso: básico (sin marketplace crédito, sin nutrición completa)
  aria_mode: conversión_activa
  indicador_visual: 🔵 Azul
  duración: configurable (3 / 5 / 7 días)
  auto_convierte: false (requiere acción del miembro o staff)

Estado: FREEZE
  acceso_fisico: bloqueado
  cobros: pausados (el período se extiende automáticamente)
  app_acceso: solo consulta (sin reservas, sin compras)
  aria_mode: check_in_suave (¿cuándo regresas?)
  indicador_visual: 🧊 Celeste

  reglas automáticas:
    - Al llegar la fecha de fin del freeze: reactivación automática
    - ARIA notifica 3 días antes: "Tu membresía se reactiva el [fecha]"
    - Si el miembro quiere extender: solicitud + aprobación del admin

Estado: VENCIDO (pago pendiente)
  acceso_fisico: BLOQUEADO (inmediato al vencimiento del período de gracia)
  cobros: reintentos automáticos según política
  app_acceso: solo consulta del estado + pago de deuda
  aria_mode: recuperación_urgente
  indicador_visual: 🔴 Rojo
  período_gracia: configurable (recomendado: 3 días)

Estado: SUSPENDIDO (por conducta / deuda prolongada)
  acceso_fisico: BLOQUEADO
  cobros: suspendidos pero deuda registrada
  app_acceso: solo aviso de suspensión + contacto al gym
  aria_mode: escalado_admin (ARIA no contacta, solo staff)
  indicador_visual: ⚫ Negro
  requiere: acción manual del admin para reactivar

Estado: PRE-CANCELACIÓN
  acceso_fisico: habilitado (hasta fecha efectiva)
  cobros: último cobro calculado hasta fecha efectiva
  app_acceso: completo hasta fecha efectiva
  aria_mode: retención_critica (WF-006 activo)
  indicador_visual: 🟠 Naranja
  duración: período de aviso (ej: 30 días)

Estado: CANCELADO
  acceso_fisico: BLOQUEADO desde fecha efectiva
  cobros: ninguno (deudas deben estar saldadas antes de cancelar)
  app_acceso: solo historial de solo lectura por 90 días
  aria_mode: win_back (WF-007 activo a los 30/60/90 días)
  indicador_visual: ⚫ Gris
```

---

## 7. FREEZE, PAUSA & SUSPENSIÓN

### 7.1 Proceso de Freeze (Congelamiento)

```
SOLICITUD DEL MIEMBRO:
  Canales: App → Mi Membresía → Congelar
           ARIA (WhatsApp): "Quiero congelar mi membresía"
           Portal web → Mi cuenta → Gestionar membresía
           Recepción (staff ingresa)

VALIDACIÓN AUTOMÁTICA DEL SISTEMA:
  ✅ ¿El plan permite freeze? (verificar política)
  ✅ ¿Cuántos freezes ha usado este año? (verificar límite)
  ✅ ¿Han pasado los días mínimos desde el último freeze?
  ✅ ¿No tiene deuda pendiente? (freeze no disponible con deudas)
  ✅ ¿La fecha de inicio solicitada es válida? (mínimo 24-48h de anticipación)

SI VÁLIDO → FORMULARIO:
  - Fecha de inicio del freeze: [selector de fecha]
  - Fecha de regreso estimada: [selector de fecha]
    (puede ser "no sé todavía" → freeze indefinido hasta max_days)
  - Motivo (opcional pero incentivado):
    [Viaje] [Lesión] [Situación personal] [Trabajo] [Otro]
  - Nota libre: campo de texto

CONFIRMACIÓN Y EFECTOS:
  - El sistema calcula: nueva fecha de fin de membresía = fecha_fin_original + días_freeze
  - Muestra al miembro: "Tu membresía se extiende automáticamente hasta [nueva fecha]"
  - Cobra la tarifa de freeze si aplica (puede ser $0)
  - Desactiva acceso físico en la fecha de inicio
  - Notificación ARIA: "Tu membresía queda congelada desde [fecha] hasta [fecha].
    ¡Nos vemos cuando regreses! 🧊 Si necesitas adelantar tu regreso, avísame."

GESTIÓN DEL FREEZE:
  El miembro puede (desde app/ARIA):
  ✅ Ver fecha de regreso programada
  ✅ Adelantar el regreso (reactivar antes de la fecha)
  ✅ Extender el freeze (si no ha llegado al máximo) → requiere aprobación admin
  ❌ No puede cancelar retroactivamente un freeze ya iniciado

REACTIVACIÓN:
  Automática: al llegar la fecha de fin del freeze
  Manual: miembro solicita regreso anticipado
  ARIA notifica 3 días antes de reactivación automática:
  "¡Hola [nombre]! En 3 días regresa tu acceso al gym 🎉
   ¿Todo listo para retomar donde lo dejaste?
   Tu trainer Carlos ya actualizó tu plan. ¿Agendamos la primera sesión?"
```

### 7.2 Freeze Médico (Caso Especial)

```yaml
Freeze médico:
  trigger: miembro reporta lesión o condición médica
  documentación requerida: certificado médico (PDF adjunto en la app)
  duración: según certificado (sin límite de días con documentación válida)
  costo: $0 (exonerado siempre con certificado)
  no cuenta para límite anual de freezes

  proceso ARIA:
    - ARIA detecta palabras clave: "me lesioné", "cirugía", "médico", "hospital"
    - Activa flujo de freeze médico: "Lo siento mucho 😔 ¿Quieres que congele
      tu membresía sin costo mientras te recuperas?
      Solo necesito el documento médico. ¿Me lo puedes enviar aquí mismo?"
    - El documento se sube directo en el chat de WhatsApp/Telegram
    - Admin recibe notificación para revisar y aprobar en < 2 horas
```

---

## 8. UPGRADES, DOWNGRADES & CAMBIOS DE PLAN

### 8.1 Upgrade (Mejora de Plan)

```
FLUJO DE UPGRADE:

1. SOLICITUD
   Miembro solicita upgrade desde app / ARIA / recepción
   ARIA proactivamente sugiere upgrade cuando detecta:
   - Miembro usando servicios no incluidos en su plan frecuentemente
   - Miembro con alta satisfacción (NPS > 8) y asistencia regular
   - Próxima renovación = oportunidad de upgrade

2. COMPARATIVA VISUAL
   App muestra tabla: Plan actual vs. Plan sugerido
   ┌──────────────────┬───────────────┬───────────────┐
   │ Beneficio        │ Tu plan actual│ Plan Elite     │
   ├──────────────────┼───────────────┼───────────────┤
   │ Precio           │ $45/mes       │ $85/mes       │
   │ Horario          │ 06:00-22:00   │ 24/7          │
   │ Clases grupales  │ 2/semana      │ Ilimitadas    │
   │ Sesiones PT      │ No incluidas  │ 2/mes         │
   │ Evaluación física│ Trimestral    │ Mensual       │
   │ Locker           │ No            │ Sí            │
   └──────────────────┴───────────────┴───────────────┘

3. CÁLCULO DE PRORRATEO
   Sistema calcula automáticamente el ajuste:
   - Días restantes del período actual con plan viejo
   - Crédito aplicado al nuevo plan
   - Diferencia a cobrar hoy

   Ejemplo:
   "Han transcurrido 12 de 30 días de tu plan actual ($45/mes).
    Crédito disponible: $27.00 (18 días restantes × $1.50/día)
    Precio del nuevo plan por 18 días: $51.00
    Diferencia a pagar hoy: $24.00
    Desde el próximo mes: $85.00/mes"

4. AUTORIZACIÓN Y PAGO
   Cargo inmediato de la diferencia prorateada
   Actualización instantánea de accesos y beneficios
   Nuevo contrato generado y enviado

5. CONFIRMACIÓN
   ARIA: "¡Felicidades! 🎉 Ya tienes acceso Elite completo.
          Tu locker #47 está listo. Tu primera sesión PT con Carlos
          está disponible esta semana. ¿La agendamos?"
```

### 8.2 Downgrade (Cambio a Plan Menor)

```yaml
Proceso de downgrade:
  restricciones:
    - Solo permitido al vencimiento del período de compromiso mínimo
    - Si está en compromiso: pagar penalización de upgrade anticipado O esperar
    - El sistema informa claramente qué beneficios se pierden

  proceso ARIA:
    - ARIA no facilita el downgrade inmediatamente — primero escucha
    - 'Entiendo que quieres ajustar tu plan 😊 ¿Puedo preguntarte por qué?
      Quizás hay una opción que funcione mejor para ti sin bajar el plan'
    - Intenta retención: ¿es por precio? → freeze temporal, descuento
    - Si el miembro confirma: procesa al vencimiento del período actual
    - Envía confirmación: 'Tu plan cambiará a Mensual Básica el [fecha].
        Hasta entonces sigues disfrutando todos los beneficios Elite 😊'

  efectos:
    - El cambio se programa para el inicio del siguiente período de cobro
    - No hay cambio inmediato (el miembro mantiene beneficios actuales hasta el fin del período)
    - Nuevo contrato generado y firmado para el nuevo plan
    - Accesos ajustados automáticamente en la fecha efectiva
```

---

## 9. CANCELACIONES & POLÍTICA DE RETENCIÓN

### 9.1 Proceso de Cancelación

```
SOLICITUD DE CANCELACIÓN:
  El miembro puede iniciar desde:
  - App → Mi Membresía → Cancelar membresía
  - ARIA: escribe "quiero cancelar"
  - Email al gym
  - Presencialmente en recepción

  *** NO SE PUEDE CANCELAR SIN PASAR POR EL PROCESO ***
  (protección contra cancelaciones accidentales)

FLUJO EN LA APP:
  Paso 1: Confirmación de intención
  "¿Estás seguro/a de que quieres cancelar tu membresía?
   Perderás acceso a [lista de beneficios] el [fecha efectiva]"
  [Sí, quiero cancelar] [No, mantener membresía]

  Paso 2: Encuesta de motivo (obligatoria)
  ¿Por qué decides cancelar?
  ○ Precio / presupuesto
  ○ Me mudo a otra ciudad
  ○ Lesión o salud
  ○ Falta de tiempo
  ○ Cambio a otro gym
  ○ No veo resultados
  ○ Mal servicio o atención
  ○ Cambio en mi situación personal
  ○ Otro: [campo libre]

  Paso 3: Oferta de retención inteligente (basada en el motivo)

  Si motivo = "precio":
    "Entendemos que el presupuesto importa. ¿Qué tal si:
     → Congelamos tu membresía gratis por 1 mes (sin costo)
     → O cambiamos a nuestro plan Básico por $45/mes
     ¿Te funciona alguna de estas opciones?"

  Si motivo = "falta de tiempo":
    "¿Y si cambiamos a un plan de 2 días/semana con precio reducido?
     O podemos congelar hasta que tengas más disponibilidad."

  Si motivo = "no veo resultados":
    "Nos preocupa escuchar eso 😔 ¿Podemos agendar una sesión
     gratuita de re-evaluación con tu trainer antes de que decidas?
     Queremos ayudarte a alcanzar tu objetivo."

  Si motivo = "lesión":
    → Freeze médico inmediato (ver sección 7.2)

  Paso 4: Si insiste en cancelar
  Cálculo final:
  - Fecha efectiva de cancelación (hoy + período de aviso requerido)
  - Monto pendiente (si cancela en período de compromiso)
  - Saldo a favor (si aplica reembolso)
  - Confirmación final con todos los términos claros

EFECTOS DE LA CANCELACIÓN:
  - Fecha efectiva: hoy + días de aviso requerido por contrato
  - Acceso físico: ACTIVO hasta la fecha efectiva
  - Cobros: último cobro = período hasta fecha efectiva (prorateado)
  - Penalización de cancelación anticipada: cobrada inmediatamente si aplica
  - Puntos de fidelidad: congelados por 90 días (si regresa, los recupera)
  - Datos: conservados 2 años para análisis y win-back (GDPR compliant)

POST-CANCELACIÓN (ARIA Win-Back):
  → Inicia WF-007 (Win-Back) a los 30, 60 y 90 días
```

### 9.2 Política de Reembolsos

```yaml
Política de reembolsos (configurable por el gym):
  Cuota de inscripción: NO reembolsable (en ningún caso)

  Mensualidades pagadas por adelantado:
    Cancelación en primeros 3 días: reembolso 100% del período no iniciado
    Cancelación con > 3 días del período: pro-rata por días no usados
    Cancelación en período de compromiso: penalización aplica

  Packs de sesiones no utilizados:
    Vigentes: reembolso 100% de sesiones no tomadas
    Vencidos: no reembolsables

  Freeze médico con certificado:
    Período freezado: reembolso completo del período no accedido (si ya pagó)

  Cancelación por mudanza (con documentación): Reembolso pro-rata sin penalización de compromiso anticipado

  Cierre del gym por fuerza mayor: Reembolso 100% de período no disfrutado

  Proceso de reembolso:
    Tiempo: 5-10 días hábiles al método original de pago
    Documentación: crédito en el sistema + notificación al miembro
    Reporte: visible en el panel financiero del admin
```

---

## 10. MEMBRESÍAS ESPECIALES & CORPORATIVAS

### 10.1 Membresías Familiares — Gestión Detallada

```yaml
Estructura:
  titular: miembro principal, responsable del pago
  dependientes: hasta 4 adicionales en la misma cuenta

Registro de dependientes:
  - Cada dependiente tiene su propio perfil completo de miembro
  - Sus propias métricas, rutinas y objetivos
  - Su propio acceso (QR individual)
  - Vinculado al titular para facturación consolidada

Para menores de edad:
  - El titular adulto firma el contrato y autorización
  - El menor no puede usar el sistema de pagos
  - Horarios de acceso restringibles (ej: no acceso sin adulto antes de las 6am)
  - Trainer asignado con protocolo para menores

Facturación consolidada:
  - UN solo cargo mensual al titular que incluye todos los dependientes
  - Factura detalla cada miembro y su plan
  - Si un dependiente se da de baja: recálculo automático del siguiente cobro

Proceso de alta de nuevo dependiente:
  Titular va a app → Mi Membresía → Agregar familiar
  Sistema calcula: descuento aplicable + prorrateo del primer mes
  Se genera contrato individual del dependiente (firmado por titular si es menor)
```

### 10.2 Membresías Corporativas — Gestión Detallada

```yaml
Cuenta corporativa:
  Entidad empresa:
    - Razón social, NIT/RUC, dirección fiscal
    - Contacto RR.HH. responsable de la cuenta
    - Método de pago corporativo (transferencia, cargo a tarjeta empresarial)
    - Portal exclusivo para el administrador de RR.HH.

  Gestión de empleados:
    - El responsable de RR.HH. da altas y bajas desde su portal
    - Alta de empleado: → Ingresa datos básicos del empleado (nombre, email, ID empresa)
        → Sistema envía invitación al empleado para completar su perfil
        → Empleado acepta términos y activa su acceso
    - Baja de empleado (cuando deja la empresa): → RR.HH. lo desactiva en el portal
        → Sistema cancela automáticamente con la fecha efectiva indicada
        → El ex-empleado puede conservar la membresía a precio individual si desea

  Facturación B2B:
    - Una factura mensual consolidada para la empresa
    - Detalle por empleado (nombre, días activo, monto proporcional)
    - Formato compatible con ERP de la empresa (Excel, PDF, EDI si se requiere)
    - Fecha de corte configurable (puede no coincidir con el calendario normal)

  Reporte de uso para RR.HH.:
    - Asistencia agregada (sin datos individuales de salud para privacidad)
    - % de empleados que usaron el beneficio el mes
    - Días más frecuentados
    - ROI estimado: 'El 78% de sus empleados activos reportan menos días de baja'
```

---

## 11. PORTAL DE AUTOSERVICIO DEL MIEMBRO

### 11.1 Sección "Mi Membresía" en la App

```
MI MEMBRESÍA
┌────────────────────────────────────────────────────────────┐
│  👤 María García                        🟢 ACTIVA          │
│  Plan: Mensual Elite                                       │
│  Válido hasta: 10 de julio 2026        23 días restantes   │
│  💳 Próximo cobro: $95.00 el 10/julio                      │
├────────────────────────────────────────────────────────────┤
│  MIS ACCESOS:                                              │
│  ✅ Gym floor (24/7)  ✅ Cardio  ✅ Clases ilimitadas      │
│  ✅ 2 sesiones PT/mes (1 disponible este mes)              │
│  ✅ Locker #47        ✅ Evaluación física                  │
├────────────────────────────────────────────────────────────┤
│  [🔐 Mi código QR de acceso]                              │
│  [📄 Ver mi contrato]  [📊 Ver mis pagos]                 │
├────────────────────────────────────────────────────────────┤
│  GESTIONAR MI MEMBRESÍA:                                   │
│  [🧊 Congelar membresía]  [⬆️ Mejorar plan]               │
│  [💳 Actualizar método de pago]                           │
│  [🔔 Gestionar notificaciones]                            │
│  [📞 Hablar con soporte]                                  │
└────────────────────────────────────────────────────────────┘
```

### 11.2 Historial de Pagos (Vista del Miembro)

```
MIS PAGOS
┌──────────┬──────────────────────────────┬────────┬──────────┐
│ Fecha    │ Concepto                     │ Monto  │ Estado   │
├──────────┼──────────────────────────────┼────────┼──────────┤
│ 10/06/26 │ Mensualidad Elite + Locker   │ $95.00 │ ✅ Pagado │
│ 10/05/26 │ Mensualidad Elite + Locker   │ $95.00 │ ✅ Pagado │
│ 25/05/26 │ Pack PT 5 sesiones           │$175.00 │ ✅ Pagado │
│ 10/04/26 │ Mensualidad Elite + Locker   │ $95.00 │ ✅ Pagado │
│ 10/04/26 │ Suplemento Whey 1kg          │ $45.00 │ ✅ Pagado │
│ 25/03/26 │ Inscripción (cuota única)    │ $20.00 │ ✅ Pagado │
│ 25/03/26 │ Primer mes Elite + Locker    │ $95.00 │ ✅ Pagado │
└──────────┴──────────────────────────────┴────────┴──────────┘

[Descargar factura] para cada línea
[Exportar historial completo como PDF]
```

---

# PARTE II — BILLING & PAGOS

---

## 12. VISIÓN GENERAL DEL MÓDULO DE BILLING

### 12.1 Propósito

El módulo de **Billing & Pagos** es el motor financiero de toda la plataforma. Garantiza que los cobros correctos lleguen al momento correcto al método correcto, con cero fricción para el miembro y cero trabajo manual para el gym.

Sus responsabilidades van desde el cobro de la primera cuota de inscripción hasta la gestión de impagos, la generación de facturas electrónicas legales y la reconciliación contable automatizada.

### 12.2 Arquitectura General

```
┌──────────────────────────────────────────────────────────────┐
│                    FUENTES DE REVENUE                        │
│  Membresías  │  PT Sessions  │  Clases  │  Marketplace       │
│  Nutrición   │  Add-ons      │  Eventos │  Penalizaciones    │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    BILLING ENGINE                            │
│  Scheduler (cuando cobrar)  │  Calculator (cuánto cobrar)   │
│  Proration Engine           │  Discount Engine              │
│  Subscription Manager       │  Invoice Generator            │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                PAYMENT ORCHESTRATOR                          │
│  Stripe  │  MercadoPago  │  Local Bank  │  Cash/Transfer    │
│  Retry Logic  │  Failure Handler  │  Webhook Processor      │
└──────────────────────────┬───────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────┐
│               FINANCIAL RECORDS                              │
│  Transaction Log  │  Invoice Store  │  Ledger               │
│  Reconciliation   │  Tax Reports    │  Accounting Sync      │
└──────────────────────────────────────────────────────────────┘
```

---

## 13. ARQUITECTURA DE COBROS RECURRENTES

### 13.1 Motor de Suscripciones

```yaml
Subscription Engine:

  Para cada membresía activa, el sistema mantiene:
    subscription_id: UUID único
    member_id: referencia al miembro
    plan_id: referencia al tipo de membresía

    billing_cycle:
      frequency: monthly | weekly | quarterly | annual
      anchor_day: día del mes para el cobro (ej: día 10)
      # Opciones de anchor_day:
      # - "registration_date": cobra siempre el mismo día del mes que se registró
      # - "1st_of_month": normalizar todos los cobros al día 1
      # - "15th_of_month": normalizar al día 15
      # - custom_day: cualquier día 1-28

    pricing:
      base_amount: 85.00
      addons_amount: 10.00  # locker, toallas, etc.
      discount_amount: 0.00
      tax_amount: 0.00      # si aplica en la jurisdicción
      total_amount: 95.00

    payment_method_id: referencia al método guardado

    status: active | paused | cancelled | past_due

    dates:
      started_at: fecha de inicio
      current_period_start: inicio del período actual
      current_period_end: fin del período actual
      next_billing_date: próximo intento de cobro
      trial_end: fin del trial (si aplica)
      cancelled_at: fecha de cancelación (si aplica)

    retry_config:
      max_retries: 3
      retry_intervals: [3, 5, 7]  # días entre reintentos

    metadata:
      contract_id: referencia al contrato firmado
      commitment_end: fecha fin del compromiso mínimo
```

### 13.2 Calendario de Cobros

```
EJEMPLO DE CALENDARIO — Miembro registrado el 10 de mayo:

Cobro 1 (inscripción + primer mes):     10 mayo  → $20 inscripción + $95 = $115
Cobro 2 (mes 2):                        10 junio → $95
Cobro 3 (mes 3):                        10 julio → $95
...y así cada mes en la misma fecha

NORMALIZACIÓN DE FECHAS (si el gym lo configura):
  Si el gym normaliza cobros al día 1:
  Registro 15 mayo → primer cobro prorateado: 15 días × ($95/30) = $47.50
  A partir del 1 junio: $95.00 mensuales normales

COBROS EN FECHAS PROBLEMÁTICAS:
  Día 29, 30, 31 no existen en todos los meses:
  → Si anchor_day = 31 y el mes tiene 28 días: cobro el día 28
  → Sistema maneja esto automáticamente
```

### 13.3 Proceso de Cobro (Día del Billing)

```
SECUENCIA DE COBRO AUTOMÁTICO:

1. T-3 días: NOTIFICACIÓN PREVIA
   Email + App Push al miembro:
   "Tu cobro de $95.00 se realizará el [fecha].
    Método de pago: Visa ****4521
    [Actualizar método de pago si es necesario]"

2. T-0: INTENTO DE COBRO
   00:01 AM: El sistema intenta el cobro

   SI EXITOSO:
     → Registro de transacción como "completed"
     → Actualizar período de membresía
     → Generar factura electrónica
     → Enviar factura al miembro (email + disponible en app)
     → Notificación: "¡Tu pago de $95.00 fue procesado exitosamente! 💳"

   SI FALLIDO:
     → Registro como "failed" con código de error
     → Inicio del proceso de recuperación (ver sección 15)

3. T+X: REINTENTOS (si falla)
   (Ver sección 15 completa)
```

### 13.4 Prorrateo Automático

```javascript
// Lógica de prorrateo para upgrades, downgrades y registros en mitad del ciclo

function calculateProration(scenario) {
  // ESCENARIO 1: Registro en mitad del mes (si el gym normaliza al día 1)
  if (scenario === 'mid_month_registration') {
    const daysInMonth = getDaysInMonth(currentMonth);
    const daysRemaining = daysInMonth - registrationDay + 1;
    const dailyRate = monthlyPrice / daysInMonth;
    const proratedAmount = dailyRate * daysRemaining;
    // Ejemplo: registrado día 15, mes de 30 días, precio $85/mes
    // = ($85/30) × 16 días = $45.33
    return Math.round(proratedAmount * 100) / 100; // redondear a 2 decimales
  }

  // ESCENARIO 2: Upgrade en mitad del período
  if (scenario === 'mid_cycle_upgrade') {
    const daysInPeriod = getDaysInBillingPeriod();
    const daysUsed = getDaysSincePeriodStart();
    const daysRemaining = daysInPeriod - daysUsed;

    const creditFromOldPlan = (oldPlanPrice / daysInPeriod) * daysRemaining;
    const chargeForNewPlan = (newPlanPrice / daysInPeriod) * daysRemaining;
    const amountDue = chargeForNewPlan - creditFromOldPlan;

    return {
      credit: creditFromOldPlan,
      charge: chargeForNewPlan,
      net_due: Math.max(0, amountDue),
      net_refund: Math.max(0, -amountDue),
    };
  }

  // ESCENARIO 3: Cancelación con reembolso pro-rata
  if (scenario === 'cancellation_refund') {
    const daysInPeriod = getDaysInBillingPeriod();
    const daysUsed = getDaysSincePeriodStart();
    const daysUnused = daysInPeriod - daysUsed;
    const refundAmount = (paidAmount / daysInPeriod) * daysUnused;
    return refundAmount;
  }
}
```

---

## 14. MÉTODOS Y PASARELAS DE PAGO

### 14.1 Pasarelas Integradas

```yaml
STRIPE (Principal — Internacional):
  casos_de_uso:
    - Tarjetas de crédito/débito internacionales (Visa, MC, Amex, Discover)
    - Apple Pay / Google Pay
    - Débito bancario (ACH en USA si hay miembros americanos)
  características:
    - PCI-DSS Level 1 (máximo nivel de seguridad)
    - Tokenización de tarjetas (el gym NUNCA toca números de tarjeta)
    - Radar (detección de fraude IA de Stripe)
    - Gestión nativa de suscripciones recurrentes
    - Webhooks en tiempo real para éxito/fallo de cobros
    - Dashboard de Stripe para reportes adicionales
    - Soporte multi-moneda (USD, EUR, etc.)
  comisiones: ~2.9% + $0.30 por transacción (variable por país)
  integración: Stripe.js + Stripe Elements (UI de pago segura embebida)

MERCADOPAGO (LATAM — Principal para El Salvador y región):
  casos_de_uso:
    - Tarjetas locales que no funcionan bien en Stripe
    - Transferencias bancarias locales
    - Pagos en efectivo (cupón impreso para pagar en banco/tienda)
    - Billetera MercadoPago
  características:
    - Amplia cobertura en El Salvador, Guatemala, Honduras, etc.
    - Permite pagos sin tarjeta (importante en mercados con alta unbanked population)
    - Cuotas/mensualidades con tarjetas locales
    - Notificaciones IPN en tiempo real
  comisiones: variable por país y método (~2.5–5%)

PAYPAL:
  casos_de_uso: miembros expatriados o con PayPal preferido
  limitaciones: no es ideal para suscripciones recurrentes automáticas
  modo: principalmente para cobros manuales o packs

TRANSFERENCIA BANCARIA DIRECTA:
  casos_de_uso: membresías corporativas, montos altos
  proceso:
    - Admin genera referencia de pago única
    - Empresa transfiere al banco del gym
    - Staff confirma el pago manualmente en el sistema
    - Sistema genera factura y activa/extiende membresía
  automatización parcial: si el banco tiene API de notificaciones

PAGO EN EFECTIVO / MOSTRADOR:
  casos_de_uso: miembros que prefieren pago presencial
  proceso:
    - Staff registra el pago en el POS del sistema
    - Sistema genera recibo + actualiza el estado
    - Staff entrega recibo físico + email automático
  limitación: no automatizable para cobros recurrentes
  solución: recordatorios de ARIA antes del vencimiento
    "Hola [nombre], tu membresía vence el [fecha].
    Puedes renovar en recepción o aquí mismo te ayudo a pagar online 😊"
```

### 14.2 Gestión de Métodos de Pago Guardados

```yaml
Tarjeta guardada (Card Vault):

  proceso de guardado:
    - El miembro ingresa datos de tarjeta UNA SOLA VEZ
    - Stripe/MercadoPago tokeniza la tarjeta
    - Solo el TOKEN (no el número) se guarda en la base de datos del gym
    - PCI compliance: el gym NUNCA maneja datos de tarjeta en bruto

  lo que el miembro ve en la app:
    Mis métodos de pago:
    💳 Visa terminada en 4521 · Vence 12/28   [Principal] [Eliminar]
    💳 Mastercard terminada en 8893 · Vence 03/27  [Usar como principal] [Eliminar]
    [+ Agregar nuevo método de pago]

  múltiples métodos:
    - El miembro puede tener hasta 3 métodos guardados
    - Un método marcado como "principal" para cobros automáticos
    - Si el principal falla: intento automático con el siguiente método (configurable)

  expiración de tarjetas:
    - Stripe tiene "Card Account Updater" → actualiza automáticamente tarjetas
      expiradas con la nueva información del banco (reducción de fallos)
    - 30 días antes de expiración: ARIA notifica al miembro para actualizar

  eliminación de método:
    - Si es el único método: no se puede eliminar si hay suscripción activa
    - Sistema pide agregar uno nuevo antes de eliminar el actual
```

### 14.3 Checkout Seguro (Agregar Nueva Tarjeta)

```
INTERFAZ DE PAGO:
  Usando Stripe Elements o MercadoPago Checkout Pro:
  - El formulario de tarjeta es un iframe del proveedor de pagos
  - Los datos NUNCA pasan por los servidores del gym
  - Validación en tiempo real (número de tarjeta válido, CVV, expiración)
  - 3D Secure automático cuando el banco lo requiere
  - Soporte para Apple Pay / Google Pay con un toque

FLUJO EN LA APP:
  1. Mi Membresía → Métodos de pago → Agregar tarjeta
  2. Iframe de Stripe se carga (seguro, certificado)
  3. Miembro ingresa datos
  4. Verificación de $0 o $1 (charge y refund inmediato) para validar
  5. Token guardado, tarjeta disponible para cobros futuros
  6. Confirmación: "Tarjeta Visa ****4521 guardada exitosamente ✅"
```

---

## 15. GESTIÓN DE PAGOS FALLIDOS & RECUPERACIÓN

### 15.1 Códigos de Error y Acciones

```yaml
Códigos de fallo de Stripe y respuesta del sistema:

card_declined (tarjeta rechazada genérico):
  acción: reintento en 3 días + notificación empática al miembro
  mensaje_miembro: 'Tu pago no pudo procesarse 😔 Por favor verifica
    tu tarjeta o agrega un método alternativo.'

insufficient_funds (fondos insuficientes):
  acción: reintento en 5 días (esperar a que recargue)
  mensaje_miembro: 'Tuvimos un problema con tu pago.
    ¿Puedes verificar el saldo de tu tarjeta?'

card_expired (tarjeta vencida):
  acción: NO reintentar — solicitar actualización inmediata
  mensaje_miembro: 'Tu tarjeta Visa ****4521 venció. Por favor agrega
    una nueva tarjeta para continuar tu membresía.'

do_not_honor (banco rechaza sin motivo claro):
  acción: reintento en 3 días + sugerir llamar al banco
  mensaje_miembro: 'Tu banco rechazó el pago. Puede ser un bloqueo
    temporal. ¿Tienes otra tarjeta disponible?'

lost_card / stolen_card (tarjeta reportada):
  acción: NO reintentar — cancelar token, solicitar nueva tarjeta urgente
  mensaje_miembro: 'Hay un problema con tu método de pago.
    Por favor comunícate con nosotros para resolverlo.'

network_error (error técnico):
  acción: reintento automático en 2 horas (no notificar al miembro aún)
  si falla segunda vez: reintento normal en 3 días
```

### 15.2 Dunning Process (Proceso de Recuperación de Cobros)

```
EL SISTEMA APLICA ESTA SECUENCIA AUTOMÁTICAMENTE:

╔══════════════════════════════════════════════════════════════╗
║  DÍA 0: PRIMER FALLO                                        ║
║  → Estado membresía: activo (período de gracia inicia)      ║
║  → Notificación inmediata al miembro (app push + email)     ║
║  → ARIA: mensaje WhatsApp empático sobre el pago            ║
║  → Acceso físico: MANTIENE (período de gracia)              ║
╚══════════════════════════════════════════════════════════════╝
           ↓ espera 3 días
╔══════════════════════════════════════════════════════════════╗
║  DÍA 3: SEGUNDO INTENTO                                     ║
║  → Reintento automático de cobro                            ║
║  → Si exitoso: membresía normalizada, notificación          ║
║  → Si falla: ARIA envía recordatorio con link de pago       ║
╚══════════════════════════════════════════════════════════════╝
           ↓ espera 2 días más
╔══════════════════════════════════════════════════════════════╗
║  DÍA 5: TERCER INTENTO                                      ║
║  → Reintento automático                                     ║
║  → Si exitoso: normalizado                                  ║
║  → Si falla: acceso físico SUSPENDIDO (fin del período de   ║
║    gracia configurable 3–5 días)                            ║
║  → ARIA: "Tu acceso ha sido suspendido temporalmente..."    ║
║  → Link de pago directo en el mensaje                       ║
╚══════════════════════════════════════════════════════════════╝
           ↓ espera 2 días más
╔══════════════════════════════════════════════════════════════╗
║  DÍA 7: CUARTO INTENTO                                      ║
║  → Reintento automático                                     ║
║  → Alerta al admin: "Pago pendiente de [nombre] - $95"      ║
║  → ARIA intenta contacto por todos los canales              ║
╚══════════════════════════════════════════════════════════════╝
           ↓ si no paga en 7 días más
╔══════════════════════════════════════════════════════════════╗
║  DÍA 14: ESCALADA MÁXIMA                                    ║
║  → Estado: VENCIDO (past_due → unpaid)                      ║
║  → Admin recibe tarea: contactar al miembro directamente    ║
║  → Si en 30 días no hay respuesta: proceso de baja          ║
║  → Deuda registrada en el sistema para eventual cobro       ║
╚══════════════════════════════════════════════════════════════╝
```

### 15.3 Enlace de Pago Express

```yaml
Payment Link:
  descripción: URL única y segura para que el miembro pague sin iniciar sesión
  uso:
    - ARIA lo incluye en mensajes de cobro fallido
    - Email automático de cobro fallido lo incluye
    - Válido por: 48 horas (configurable)
    - Muestra: monto adeudado + descripción + opciones de pago
    - Al pagar: membresía se reactiva automáticamente en tiempo real

  ejemplo de mensaje: 'Hola María, tienes un pago pendiente de $95.00.
    Puedes resolverlo en 1 minuto aquí:
    👉 https://gym.app/pay/px_8f72k3
    (Enlace válido hasta el 12/06 a las 10pm)

    Si necesitas hablar con nosotros, estamos aquí 😊'
```

---

## 16. FACTURACIÓN ELECTRÓNICA & DOCUMENTOS FISCALES

### 16.1 Sistema de Facturación

```yaml
Factura electrónica:

  generación automática:
    - Por cada transacción exitosa: factura generada en < 5 segundos
    - Número de factura secuencial e irrepetible
    - Formato: PDF + XML (para integración contable)
    - Firma digital del emisor (el gym)

  datos de la factura:
    Encabezado:
      - Logo del gym (configurable)
      - Razón social del gym + NIT/RUC + dirección
      - Número de factura
      - Fecha y hora de emisión
      - Régimen fiscal (configurable por país)

    Datos del cliente:
      - Nombre del miembro
      - NIT/DUI (si lo aportó al registrarse — opcional)
      - Email
      - Teléfono

    Detalle de la transacción:
      - Descripción: "Membresía Elite - Junio 2026"
      - Cantidad, precio unitario, descuento, subtotal
      - Impuestos (IVA u otros según configuración fiscal)
      - Total

    Método de pago:
      - "Tarjeta Visa ****4521" | "Efectivo" | "Transferencia"
      - Referencia de transacción

    Pie:
      - Política de reembolso resumida
      - Contacto del gym
      - Código QR para verificación de autenticidad

  distribución:
    - Email automático con PDF adjunto al miembro
    - Disponible en la app → Mis Pagos → [Descargar factura]
    - El gym tiene acceso a todas las facturas en el panel admin
    - Exportación masiva por período (para contabilidad)

  cumplimiento fiscal El Salvador:
    - Compatible con DTE (Documento Tributario Electrónico) del MH
    - Integración con el sistema de facturación electrónica autorizado
    - Soporte para: Factura de Consumidor Final + Crédito Fiscal + Nota de Crédito
```

### 16.2 Notas de Crédito y Ajustes

```yaml
Nota de crédito (para reembolsos y ajustes):
  casos de generación:
    - Reembolso parcial o total
    - Corrección de cobro erróneo
    - Descuento aplicado retroactivamente
    - Cortesía por queja resuelta

  proceso:
    - Admin autoriza la nota de crédito desde el panel
    - Sistema genera el documento fiscal correspondiente
    - Reembolso procesado al método de pago original
    - Registro en el ledger contable
    - Notificación al miembro con el documento

  rastreo:
    - Cada nota de crédito vinculada a la factura original
    - Visible en el historial del miembro y en reportes contables
```

---

## 17. SISTEMA DE DESCUENTOS, CUPONES & PROMOCIONES

### 17.1 Tipos de Descuentos

```yaml
Tipos de descuento soportados:

  1. PORCENTAJE SOBRE EL TOTAL
     ejemplo: 20% de descuento en la membresía
     aplicación: (precio_base × 0.20)

  2. MONTO FIJO
     ejemplo: $15 de descuento
     aplicación: precio_base - 15.00 (mínimo $0)

  3. EXONERACIÓN DE INSCRIPCIÓN
     ejemplo: "Sin cuota de inscripción esta semana"
     aplicación: setup_fee = 0 para este miembro

  4. PRIMER MES GRATIS
     ejemplo: "Primer mes sin costo"
     aplicación: primer cobro = $0, desde el segundo mes precio normal

  5. N MESES AL PRECIO DE M
     ejemplo: "Paga 10 meses, lleva 12"
     aplicación: cobro de 10 meses, acceso por 12

  6. PRECIO ESPECIAL POR TIEMPO LIMITADO
     ejemplo: "$59/mes en lugar de $85/mes los primeros 3 meses"
     aplicación: precio reducido × 3 meses, luego precio normal

  7. DESCUENTO DE REFERIDO
     ejemplo: "Tú y tu amigo reciben 1 mes con 30% descuento"
     aplicación: descuento automático al registrar el código de referido
```

### 17.2 Gestión de Cupones

```yaml
Cupón:
  code: 'VERANO2026' # código que el miembro ingresa
  name: 'Promoción Verano 2026' # nombre interno
  description: '20% off en cualquier membresía mensual'

  discount:
    type: percentage
    value: 20
    applies_to: [mensual_basic, mensual_plus, mensual_elite]
    applies_to_setup_fee: false

  validity:
    starts_at: '2026-06-01'
    expires_at: '2026-07-31'

  limits:
    max_uses_total: 500 # máximo 500 veces total
    max_uses_per_member: 1 # cada miembro solo puede usarlo 1 vez
    first_time_only: true # solo para nuevos miembros (no renovaciones)

  combination:
    combinable_with_other_codes: false
    combinable_with_special_pricing: false # no combinable con precios de student/senior

  tracking:
    times_used: 47 # actualizado en tiempo real
    revenue_impact: -$1,233.40 # descuento total otorgado
    conversion_rate: 68% # % de quienes ingresaron el código que completaron el registro

  canal_de_distribucion: redes_sociales | email | flyer_fisico | referidos
```

### 17.3 Promociones Automáticas por Comportamiento

```yaml
Descuentos dinámicos basados en CRM (sin código):

  Descuento de lealtad (automático):
    trigger: miembro cumple 1 año de membresía continua
    descuento: 10% en la renovación anual
    aplica: automáticamente, no requiere acción del miembro
    ARIA notifica: "¡Feliz aniversario! 🎉 Tu próxima renovación tiene 10% off"

  Descuento win-back:
    trigger: ex-miembro regresa después de 60+ días cancelado
    descuento: primer mes 50% off + exoneración de inscripción
    aplica: al seleccionar cualquier plan durante el primer mes de regreso

  Descuento preventivo de churn:
    trigger: Risk Score > 75
    descuento: configurable por el admin (ej: 15% off próxima mensualidad)
    autorización: el admin decide si ARIA puede ofrecer el descuento
    ARIA: "Oye [nombre], queremos que te quedes 😊 Esta semana tienes
            un 15% de descuento en tu próxima mensualidad si renuevas hoy"

  Descuento por referido exitoso:
    trigger: miembro que refirió tiene 1 nuevo miembro confirmado
    descuento: 1 mes gratis O $X de descuento (configurable)
    aplica: automáticamente en el siguiente ciclo de cobro
```

---

## 18. GIFT CARDS & VOUCHERS

### 18.1 Gift Cards

```yaml
Gift Cards (tarjetas de regalo):

  denominaciones configurables:
    - $50, $100, $150, $200, $300 (o personalizadas)
    - O cargables con monto libre (ej: $75 exactos)

  tipos:
    - Digital: código QR + PIN, enviada por email/WhatsApp
    - Física: tarjeta impresa con código raspar (si el gym las imprime)
    - Membresía específica: "1 mes de Mensual Elite" (sin monto monetario)

  compra:
    - Cualquier persona puede comprar una gift card (sin ser miembro)
    - Desde el sitio web del gym / app del miembro (para regalar)
    - En recepción (pago en efectivo o tarjeta)
    - Gift cards son procesadas como producto en el POS

  uso:
    - El receptor ingresa el código al registrarse o en su perfil
    - El saldo se aplica al siguiente cobro (o al pago de la membresía)
    - Si el saldo es menor al precio: paga la diferencia con otro método
    - Si el saldo es mayor: queda como crédito para futuros cobros

  validez:
    - 12 meses desde la compra (configurable)
    - Si vence sin usarse: depende de la política del gym
      (El Salvador: se recomienda extender 6 meses más por buena fe)

  gestión:
    - Dashboard de gift cards vendidas: código, monto, estado, quién compró, quién usa
    - Exportación para contabilidad (pasivo hasta que se redime)
```

### 18.2 Vouchers de Servicio

```yaml
Vouchers (canjeables por servicio específico):
  tipos:
    - '1 sesión PT gratuita'
    - '3 clases grupales'
    - '1 consulta nutricional'
    - '1 evaluación física'
    - '1 semana de trial completo'

  uso más frecuente:
    - Vouchers de trial para dar a prospectos (ventas)
    - Vouchers de cortesía para resolver quejas
    - Vouchers como premios de gamificación (Módulo I)
    - Vouchers de cumpleaños
    - Vouchers corporativos (empresa regala a empleados)

  gestión:
    - Staff genera vouchers desde el panel con un clic
    - Se envían por email/WhatsApp al receptor
    - Al canjearse: el trainer lo confirma en el sistema
    - Estadísticas: vouchers emitidos vs. canjeados vs. vencidos
```

---

## 19. CRÉDITO INTERNO & WALLET DEL MIEMBRO

### 19.1 Wallet (Billetera Digital)

```yaml
Gym Wallet:

  descripción: saldo positivo en la cuenta del miembro, utilizable para pagar
               membresía, clases, marketplace y cualquier servicio del gym

  cómo se carga el wallet:
    ✅ Canje de gift card
    ✅ Reembolso de cobro (en lugar de devolver a tarjeta)
    ✅ Bonificación por logros (si el gym lo configura — parte del sistema de incentivos)
    ✅ Crédito por queja resuelta (cortesía del admin)
    ✅ Referido exitoso (si el gym paga referidos en wallet en lugar de descuento)
    ✅ Carga manual por el admin (donaciones, correcciones)

  cómo se usa:
    - En cualquier cobro del sistema, el miembro puede elegir usar su wallet
    - Pago mixto: wallet cubre lo que puede, el resto va a tarjeta
    - Automático: el gym puede configurar que el wallet siempre se aplique primero

  visibilidad:
    - Saldo visible en la app → Mi Membresía → Wallet
    - Historial de movimientos: créditos y débitos con descripción
    - ARIA notifica cuando el wallet recibe un crédito

  validez del saldo:
    - Configurable: saldo no vence (recomendado) o vence en X meses
    - Si el miembro cancela: saldo reembolsable (política del gym)

  límites:
    - Saldo máximo en wallet: configurable (ej: $500 máximo)
    - Por seguridad: el admin puede ver y ajustar manualmente

# Ejemplo de pantalla de wallet:
Mi Wallet:                         Saldo disponible: $47.50

Historial:
  + $20.00  Crédito por referido de Ana Torres           01/06/26
  + $15.00  Cortesía por queja #TKT-892 resuelta         15/05/26
  - $12.50  Cobro mensualidad (saldo wallet aplicado)    10/05/26
  + $25.00  Canje de Gift Card #GC-4892                  01/05/26
```

### 19.2 Cuenta de Crédito (Compras a Crédito)

```yaml
Cuenta de crédito (para marketplace y servicios extra):

  diferencia con wallet:
    - Wallet: saldo POSITIVO (el miembro ya pagó, tiene crédito disponible)
    - Cuenta crédito: saldo NEGATIVO (el miembro debe al gym)

  cómo funciona:
    - El admin asigna un límite de crédito al miembro (ej: $100)
    - El miembro puede comprar en el marketplace o contratar servicios hasta ese límite
    - El saldo deudor se muestra claramente: "Debes $45.00 al gym"
    - El gym puede cobrar la deuda:
      a) Sumándola al próximo cobro de membresía automáticamente
      b) El miembro la paga manualmente desde la app
      c) ARIA envía recordatorio de saldo cuando supera X días

  intereses:
    - Por defecto: 0% (es un servicio de conveniencia, no de financiamiento)
    - El gym puede configurar un cargo fijo por pago tardío (configurable)

  límite de crédito:
    - Global: límite para todos los miembros (ej: $50 por defecto)
    - Individual: el admin puede subir el límite para miembros VIP
    - Auto-reducción: si el miembro tiene 2 pagos tardíos, el sistema reduce el límite

  reportes:
    - Cartera de crédito total del gym: suma de todos los saldos deudores
    - Antigüedad de saldos: qué miembros llevan más tiempo con deuda
    - Alertas: saldos que superan 30 días sin abono
```

---

## 20. INTEGRACIÓN CONTABLE & CONCILIACIÓN

### 20.1 Integración con Software Contable

```yaml
Integraciones nativas:

  QuickBooks Online:
    - Sincronización automática de:
      * Ingresos por categoría (membresías, servicios, retail)
      * Facturas emitidas → cuentas por cobrar
      * Pagos recibidos → entradas de efectivo
      * Notas de crédito → ajustes
    - Frecuencia: en tiempo real (webhook) o batch diario (configurable)
    - Mapeo de cuentas contables configurado por el contador del gym

  Xero:
    - Misma funcionalidad que QuickBooks
    - API nativa de Xero
    - Ideal para gimnasios que ya usan Xero en El Salvador

  Sistema contable DTE de El Salvador:
    - Generación de DTEs (Documentos Tributarios Electrónicos)
    - Transmisión al Ministerio de Hacienda (MH)
    - Según legislación vigente de facturación electrónica de El Salvador
    - Soporte para: CCF (Crédito Fiscal), CF (Consumidor Final), NC (Nota de Crédito)

  Exportación manual (para cualquier otro sistema):
    - Exportar transacciones en formato: CSV, Excel, JSON
    - Filtros: por período, por tipo de transacción, por método de pago
    - Formato personalizable (columnas configurables)
```

### 20.2 Conciliación Automática

```yaml
Proceso de conciliación:

  Qué se concilia:
    - Cobros en Stripe: reporte de Stripe vs. registros del sistema
    - Cobros en MercadoPago: reporte MP vs. registros del sistema
    - Depósitos en cuenta bancaria: extraer del banco API (si disponible)

  Frecuencia:
    - Diaria: automática a las 2:00 AM
    - Manual: el admin puede lanzar conciliación en cualquier momento

  Resultado del proceso:
    - Transacciones que concilian: marcadas como "conciliado"
    - Discrepancias detectadas: alerta al admin con detalle
      * "Cobro en Stripe por $95 no encontrado en el sistema"
      * "Pago en sistema sin cobro correspondiente en Stripe"
    - Reporte de conciliación descargable (para el contador)

  Manejo de comisiones de pasarela:
    - Stripe cobra sus comisiones (ej: $2.59 en un cobro de $95)
    - El sistema registra por separado:
      * Ingreso bruto: $95.00
      * Comisión pasarela: -$2.59
      * Ingreso neto: $92.41
    - Los reportes pueden mostrar bruto o neto (configurable)
```

---

## 21. REPORTES FINANCIEROS & KPIs

### 21.1 Dashboard Financiero en Tiempo Real

```
PANEL FINANCIERO — Hoy: 10 junio 2026

┌─────────────────────────────────────────────────────────────┐
│  INGRESOS DEL DÍA                                           │
│  💰 Total cobrado hoy:        $1,425.00                     │
│  📈 vs. promedio diario:      +12% ↑                        │
│  🎯 vs. meta del día:         87% (meta: $1,640)            │
├─────────────────────────────────────────────────────────────┤
│  COBROS PENDIENTES DEL DÍA                                  │
│  ⏳ Membresías a cobrar hoy:  8 cobros · $720.00            │
│  ⚠️ Intentos fallidos hoy:    2 cobros · $190.00            │
│  🔄 En reintento:             3 cobros · $285.00            │
├─────────────────────────────────────────────────────────────┤
│  MES EN CURSO (junio 2026)                                  │
│  MRR realizado:    $28,450 / $31,200 esperado (91%)         │
│  Cobros exitosos:  298 / 315 total (94.6%)                  │
│  Cobros fallidos:  17 (5.4%) · $1,615 en riesgo             │
└─────────────────────────────────────────────────────────────┘
```

### 21.2 KPIs Financieros Críticos

```yaml
KPIs de membresías:

  MRR (Monthly Recurring Revenue):
    fórmula: suma de todos los cobros recurrentes del mes
    objetivo: crecer 5%+ mensual
    alerta: si MRR cae >3% vs mes anterior

  ARR (Annual Recurring Revenue):
    fórmula: MRR × 12
    uso: para proyecciones y evaluación del negocio

  Churn de Revenue (Revenue Churn):
    fórmula: (MRR perdido por cancelaciones / MRR inicio del mes) × 100
    objetivo: < 3% mensual
    diferente a: churn de miembros (que mide personas, no dinero)

  Expansion MRR:
    fórmula: nuevo MRR de upgrades y add-ons de miembros existentes
    objetivo: que cubra o supere el churn

  Net MRR Growth:
    fórmula: nuevo MRR + expansion MRR - churned MRR
    objetivo: positivo siempre

  LTV (Customer Lifetime Value):
    fórmula: ARPU × (1 / churn_rate mensual)
    ejemplo: $85 ARPU × (1 / 0.05 churn) = $1,700 LTV promedio

  CAC (Customer Acquisition Cost):
    fórmula: gasto marketing + ventas / nuevos miembros del período
    benchmark: CAC < 3 meses de LTV

  LTV:CAC Ratio:
    objetivo: > 3:1 (por cada $1 gastado en adquisición, recuperar $3+ en vida)

  ARPU (Average Revenue Per User):
    fórmula: MRR total / miembros activos totales
    desglose: por tipo de plan, por sede, por antigüedad

  Tasa de Cobro Exitoso (Collection Rate):
    fórmula: cobros exitosos / cobros intentados × 100
    objetivo: > 96%
    benchmark industria: ~94–96%

  Días hasta Recuperación (Days Sales Outstanding):
    fórmula: promedio de días entre fallo de pago y cobro exitoso
    objetivo: < 7 días

KPIs de packs y servicios adicionales:

  Attach Rate (penetración de add-ons):
    fórmula: miembros con al menos 1 add-on / total miembros × 100
    objetivo: > 30%

  Pack Conversion:
    fórmula: miembros que compraron pack PT / total con plan base × 100

  Revenue por Servicio:
    desglose: membresías / PT / nutrición / clases especiales / marketplace
```

### 21.3 Reportes Disponibles

```yaml
Reporte: Estado de Cuenta por Miembro
  contenido: todo el historial de cobros y pagos de un miembro específico
  uso: atención al cliente, verificación, legal
  exportar: PDF con membrete del gym

Reporte: Ingresos del Período
  filtros: fecha inicio-fin, sede, tipo de ingreso
  agrupaciones: por día / semana / mes / trimestre
  incluye: bruto, comisiones de pasarela, neto
  exportar: PDF, Excel, CSV

Reporte: Cartera de Membresías Activas
  contenido: listado de todos los miembros activos con: plan, monto, fecha vencimiento, método de pago
  alertas: los que vencen en los próximos 30 días
  exportar: Excel (para contacto proactivo)

Reporte: Cobros Fallidos y Recuperación
  contenido: todos los cobros fallidos del período, estado de recuperación, monto en riesgo
  kpis: tasa de recuperación (cuántos se recuperan eventualmente)
  exportar: Excel

Reporte: Saldos de Crédito y Wallet
  contenido: miembros con wallet positivo (pasivo del gym) + miembros con deuda (cuentas por cobrar)
  alertas: deudas mayores a $X o con más de 30 días

Reporte: Descuentos y Promociones Otorgadas
  contenido: descuentos aplicados en el período, por tipo y código
  impacto: revenue dejado de percibir (para evaluar ROI de las promociones)
  exportar: Excel

Reporte: Proyección de Ingresos (Forecast)
  horizonte: próximos 30 / 60 / 90 días
  base: cobros recurrentes programados - churn estimado + conversiones esperadas
  confianza: % de probabilidad (basado en historial)

Reporte: Conciliación con Pasarela de Pagos
  contenido: comparativa cobros sistema vs. cobros en Stripe/MercadoPago
  discrepancias: destacadas para revisión manual
  exportar: Excel, PDF (firmado para auditores)

Reporte: Fiscal / Contable
  IVA cobrado por período
  Ingresos por categoría según catálogo contable
  Formato compatible con importación a QuickBooks/Xero
```

---

## 22. SEGURIDAD & CUMPLIMIENTO PCI-DSS

### 22.1 Estándares de Seguridad

```yaml
PCI-DSS Compliance:

  ¿Qué es PCI-DSS?
    Payment Card Industry Data Security Standard — estándar obligatorio
    para cualquier negocio que procese pagos con tarjeta.

  Nivel de cumplimiento:
    El gym usa pasarelas certificadas (Stripe, MercadoPago) que manejan
    todos los datos de tarjeta. El sistema del gym NUNCA almacena, procesa
    ni transmite datos de tarjeta en bruto.
    → El gym califica como SAQ A (nivel más simple de PCI-DSS)

  Medidas implementadas:

    Datos de tarjeta:
      ✅ NUNCA se almacenan números de tarjeta en la base de datos del gym
      ✅ Solo tokens (string sin valor fuera del sistema de la pasarela)
      ✅ Formulario de tarjeta = iframe de Stripe (datos van directo a Stripe)
      ✅ CVV/CVC nunca almacenado (ni siquiera temporalmente)

    Infraestructura:
      ✅ HTTPS/TLS 1.3 obligatorio en todas las comunicaciones
      ✅ Base de datos encriptada en reposo (AES-256)
      ✅ Acceso a base de datos solo desde servidores de aplicación (sin acceso directo)
      ✅ Firewall y WAF (Web Application Firewall) activos
      ✅ Escaneos de vulnerabilidades trimestrales

    Acceso:
      ✅ Acceso al panel admin con 2FA obligatorio
      ✅ Logs de auditoría de todas las acciones financieras
      ✅ Principio de mínimo privilegio (cada rol ve solo lo que necesita)
      ✅ Sesiones con timeout automático

    Monitoreo:
      ✅ Alertas en tiempo real de actividad inusual (transacciones grandes, múltiples fallos)
      ✅ Stripe Radar para detección de fraude en tiempo real
      ✅ Rate limiting en APIs de pago
      ✅ IP whitelisting para operaciones sensibles (configurable)

  Datos personales (GDPR / Ley local de protección de datos):
    ✅ Consentimiento explícito para procesamiento de datos
    ✅ Derecho al olvido: eliminación de datos en 30 días tras solicitud
    ✅ Portabilidad: exportar todos los datos del miembro en JSON/PDF
    ✅ Minimización: solo recopilamos datos necesarios para el servicio
    ✅ Data breach notification: proceso documentado para notificar en < 72h
```

### 22.2 Prevención de Fraude

```yaml
Medidas anti-fraude:
  Stripe Radar (IA de Stripe):
    - Analiza cada transacción contra millones de señales
    - Bloquea automáticamente tarjetas marcadas como fraudulentas globalmente
    - Reglas personalizables: bloquear tarjetas de ciertos países, velocidad inusual

  Detección de comportamiento inusual:
    - Múltiples intentos de pago fallidos en corto tiempo → bloqueo temporal
    - Cambio de tarjeta + compra grande inmediata → revisión manual
    - IP diferente a la habitual + método de pago nuevo → 3DS adicional

  Chargeback protection:
    - Toda la documentación (contratos firmados, logs de acceso, comunicaciones)
      disponible para disputar chargebacks ante el banco
    - Stripe Radar Score incorporado en decisiones de reembolso

  Alertas internas:
    - Reembolsos múltiples en corto tiempo → notificación al admin
    - Cancelación inmediata post-cobro (señal de fraude) → revisión
```

---

## 23. MODELO DE DATOS COMPLETO

### 23.1 Tablas del Módulo de Billing

```sql
-- ─────────────────────────────────────────────────────────────
-- TIPOS DE MEMBRESÍA (catálogo configurado por el gym)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE membership_types (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  name                        VARCHAR(100) NOT NULL,
  code                        VARCHAR(30) NOT NULL,
  category                    VARCHAR(30) NOT NULL,
  -- Duración
  duration_type               VARCHAR(20) NOT NULL, -- fixed|rolling|sessions|unlimited
  duration_value              INTEGER,
  duration_unit               VARCHAR(20),          -- days|weeks|months|years|sessions
  -- Precio base
  base_price                  DECIMAL(10,2) NOT NULL,
  currency                    VARCHAR(3) DEFAULT 'USD',
  billing_frequency           VARCHAR(20) DEFAULT 'monthly',
  setup_fee                   DECIMAL(10,2) DEFAULT 0,
  -- Accesos
  access_config               JSONB NOT NULL,       -- facilities, classes, etc.
  -- Compromiso
  min_commitment_months       INTEGER DEFAULT 1,
  cancellation_notice_days    INTEGER DEFAULT 30,
  early_cancellation_fee      DECIMAL(10,2) DEFAULT 0,
  auto_renew                  BOOLEAN DEFAULT TRUE,
  -- Freeze
  freeze_allowed              BOOLEAN DEFAULT TRUE,
  freeze_max_per_year         INTEGER DEFAULT 2,
  freeze_max_days             INTEGER DEFAULT 30,
  freeze_fee                  DECIMAL(10,2) DEFAULT 0,
  -- Disponibilidad
  is_active                   BOOLEAN DEFAULT TRUE,
  visible_in_app              BOOLEAN DEFAULT TRUE,
  max_members                 INTEGER,
  -- Metadata
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW(),
  UNIQUE (gym_id, code)
);

-- ─────────────────────────────────────────────────────────────
-- MEMBRESÍAS DE MIEMBROS (instancias de planes)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE memberships (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  membership_type_id          UUID NOT NULL REFERENCES membership_types(id),
  -- Estado
  status                      VARCHAR(20) NOT NULL DEFAULT 'active',
  -- Fechas
  started_at                  DATE NOT NULL,
  ends_at                     DATE,                -- null = indefinida (month-to-month)
  commitment_ends_at          DATE,
  next_billing_date           DATE,
  cancelled_at                TIMESTAMP,
  cancellation_effective_date DATE,
  cancellation_reason         VARCHAR(100),
  cancellation_details        TEXT,
  -- Pricing activo
  current_base_price          DECIMAL(10,2) NOT NULL,
  current_addons_total        DECIMAL(10,2) DEFAULT 0,
  current_discount_amount     DECIMAL(10,2) DEFAULT 0,
  current_total               DECIMAL(10,2) NOT NULL,
  -- Billing
  billing_anchor_day          INTEGER,             -- día del mes del cobro
  payment_method_id           UUID REFERENCES payment_methods(id),
  -- Add-ons activos
  active_addons               JSONB DEFAULT '[]',  -- [{addon_id, name, price}]
  -- Freeze tracking
  freeze_count_this_year      INTEGER DEFAULT 0,
  -- Contracto
  contract_id                 UUID REFERENCES contracts(id),
  -- Auto-renovación
  auto_renew                  BOOLEAN DEFAULT TRUE,
  renewal_notice_sent_at      TIMESTAMP,
  -- Metadata
  created_by                  UUID REFERENCES staff(id),
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SUSCRIPCIONES (motor de cobros recurrentes)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE subscriptions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  membership_id               UUID NOT NULL REFERENCES memberships(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  -- Estado
  status                      VARCHAR(20) NOT NULL DEFAULT 'active',
  -- Período actual
  current_period_start        DATE NOT NULL,
  current_period_end          DATE NOT NULL,
  -- Próximo cobro
  next_billing_at             TIMESTAMP NOT NULL,
  next_billing_amount         DECIMAL(10,2) NOT NULL,
  -- Método de pago
  payment_method_id           UUID REFERENCES payment_methods(id),
  -- Gateway
  gateway                     VARCHAR(20) NOT NULL, -- stripe|mercadopago|manual
  gateway_subscription_id     VARCHAR(100),         -- ID en Stripe/MP
  -- Reintentos
  retry_count                 INTEGER DEFAULT 0,
  next_retry_at               TIMESTAMP,
  last_failed_at              TIMESTAMP,
  last_failure_reason         VARCHAR(100),
  -- Metadata
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- MÉTODOS DE PAGO GUARDADOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE payment_methods (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  -- Tipo
  method_type                 VARCHAR(20) NOT NULL, -- card|bank_transfer|paypal|wallet|cash
  -- Tarjeta (tokenizada)
  gateway                     VARCHAR(20),          -- stripe|mercadopago
  gateway_token               VARCHAR(200),         -- token del gateway (NO datos de tarjeta)
  -- Display info (no sensible)
  card_brand                  VARCHAR(20),          -- visa|mastercard|amex
  card_last_four              VARCHAR(4),
  card_exp_month              INTEGER,
  card_exp_year               INTEGER,
  card_holder_name            VARCHAR(100),
  -- Estado
  is_default                  BOOLEAN DEFAULT FALSE,
  is_active                   BOOLEAN DEFAULT TRUE,
  -- Metadata
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW(),
  INDEX (member_id, is_default)
);

-- ─────────────────────────────────────────────────────────────
-- TRANSACCIONES (registro de cada cobro o movimiento)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  subscription_id             UUID REFERENCES subscriptions(id),
  membership_id               UUID REFERENCES memberships(id),
  -- Tipo y estado
  transaction_type            VARCHAR(30) NOT NULL, -- charge|refund|credit|adjustment|fee
  status                      VARCHAR(20) NOT NULL, -- pending|succeeded|failed|refunded|disputed
  -- Montos
  amount                      DECIMAL(10,2) NOT NULL,
  currency                    VARCHAR(3) DEFAULT 'USD',
  gateway_fee                 DECIMAL(10,2) DEFAULT 0,  -- comisión de pasarela
  net_amount                  DECIMAL(10,2),            -- calculado: amount - gateway_fee
  -- Descripción
  description                 VARCHAR(255),
  line_items                  JSONB,                    -- [{description, qty, unit_price, total}]
  -- Pago
  payment_method_id           UUID REFERENCES payment_methods(id),
  gateway                     VARCHAR(20),
  gateway_transaction_id      VARCHAR(200),             -- ID único en Stripe/MP
  gateway_response            JSONB,                    -- respuesta completa del gateway
  -- Fallo (si aplica)
  failure_code                VARCHAR(100),
  failure_message             TEXT,
  -- Facturación
  invoice_id                  UUID REFERENCES invoices(id),
  -- Reconciliación
  reconciled                  BOOLEAN DEFAULT FALSE,
  reconciled_at               TIMESTAMP,
  -- Metadata
  processed_at                TIMESTAMP,
  created_at                  TIMESTAMP DEFAULT NOW(),
  INDEX (member_id, created_at DESC),
  INDEX (status, created_at DESC),
  INDEX (gateway_transaction_id)
);

-- ─────────────────────────────────────────────────────────────
-- FACTURAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  -- Numeración
  invoice_number              VARCHAR(50) NOT NULL UNIQUE,
  invoice_type                VARCHAR(30) DEFAULT 'invoice', -- invoice|credit_note|receipt
  -- Fechas
  issued_at                   TIMESTAMP NOT NULL DEFAULT NOW(),
  due_at                      TIMESTAMP,
  paid_at                     TIMESTAMP,
  -- Estado
  status                      VARCHAR(20) DEFAULT 'issued', -- issued|paid|voided|refunded
  -- Montos
  subtotal                    DECIMAL(10,2) NOT NULL,
  discount_amount             DECIMAL(10,2) DEFAULT 0,
  tax_amount                  DECIMAL(10,2) DEFAULT 0,
  total                       DECIMAL(10,2) NOT NULL,
  -- Items
  line_items                  JSONB NOT NULL,
  -- Datos del miembro (snapshot al momento de emisión)
  member_snapshot             JSONB NOT NULL,    -- nombre, email, dirección fiscal
  -- Datos del gym (snapshot)
  gym_snapshot                JSONB NOT NULL,    -- razón social, NIT, dirección
  -- DTE El Salvador
  dte_type                    VARCHAR(10),       -- 'CF'|'CCF'|'NC'
  dte_codigo_generacion       UUID,
  dte_numero_control          VARCHAR(50),
  dte_sello_recepcion         VARCHAR(200),
  -- Archivos
  pdf_url                     TEXT,
  xml_url                     TEXT,
  -- Referencia
  credit_note_for_invoice_id  UUID REFERENCES invoices(id),
  -- Metadata
  created_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- FREEZES DE MEMBRESÍA
-- ─────────────────────────────────────────────────────────────
CREATE TABLE membership_freezes (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id               UUID NOT NULL REFERENCES memberships(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  -- Fechas
  freeze_start_date           DATE NOT NULL,
  freeze_end_date             DATE,                 -- null = indefinido (hasta max_days)
  actual_unfreeze_date        DATE,
  -- Estado
  status                      VARCHAR(20) DEFAULT 'active', -- active|completed|cancelled
  -- Motivo
  reason                      VARCHAR(50),          -- travel|injury|personal|work|other
  reason_detail               TEXT,
  medical_certificate_url     TEXT,                 -- para freeze médico
  is_medical                  BOOLEAN DEFAULT FALSE,
  -- Efectos
  days_frozen                 INTEGER,              -- calculado al descongelar
  original_end_date           DATE,                 -- fecha fin antes del freeze
  new_end_date                DATE,                 -- fecha fin extendida por el freeze
  -- Cobro
  freeze_fee_charged          DECIMAL(10,2) DEFAULT 0,
  -- Aprobación
  approved_by                 UUID REFERENCES staff(id),
  approved_at                 TIMESTAMP,
  -- Metadata
  created_at                  TIMESTAMP DEFAULT NOW(),
  updated_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CUPONES Y DESCUENTOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE coupons (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  code                        VARCHAR(50) NOT NULL,
  name                        VARCHAR(100) NOT NULL,
  description                 TEXT,
  -- Tipo de descuento
  discount_type               VARCHAR(20) NOT NULL, -- percentage|fixed|free_months|waive_setup
  discount_value              DECIMAL(10,2),
  free_months                 INTEGER,
  -- Aplicación
  applies_to                  JSONB,                -- ["membership_type_id_1", ...]
  applies_to_setup_fee        BOOLEAN DEFAULT FALSE,
  duration_months             INTEGER,              -- nulo = permanente mientras dure membresía
  -- Validez
  starts_at                   TIMESTAMP,
  expires_at                  TIMESTAMP,
  -- Límites de uso
  max_uses_total              INTEGER,
  max_uses_per_member         INTEGER DEFAULT 1,
  first_time_only             BOOLEAN DEFAULT FALSE,
  -- Combinación
  combinable                  BOOLEAN DEFAULT FALSE,
  -- Tracking
  times_used                  INTEGER DEFAULT 0,
  -- Estado
  is_active                   BOOLEAN DEFAULT TRUE,
  -- Metadata
  created_by                  UUID REFERENCES staff(id),
  created_at                  TIMESTAMP DEFAULT NOW(),
  UNIQUE (gym_id, code)
);

CREATE TABLE coupon_uses (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id                   UUID NOT NULL REFERENCES coupons(id),
  member_id                   UUID NOT NULL REFERENCES members(id),
  membership_id               UUID REFERENCES memberships(id),
  transaction_id              UUID REFERENCES transactions(id),
  discount_applied            DECIMAL(10,2) NOT NULL,
  used_at                     TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- WALLET / SALDO DEL MIEMBRO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_wallets (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id                   UUID NOT NULL UNIQUE REFERENCES members(id),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  balance                     DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency                    VARCHAR(3) DEFAULT 'USD',
  updated_at                  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id                   UUID NOT NULL REFERENCES member_wallets(id),
  transaction_type            VARCHAR(20) NOT NULL, -- credit|debit
  amount                      DECIMAL(10,2) NOT NULL,
  balance_after               DECIMAL(10,2) NOT NULL,
  description                 VARCHAR(255),
  reference_type              VARCHAR(30),          -- membership_charge|gift_card|refund|bonus|credit_note
  reference_id                UUID,
  created_by                  UUID REFERENCES staff(id),
  created_at                  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- GIFT CARDS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE gift_cards (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  code                        VARCHAR(30) NOT NULL UNIQUE,
  pin                         VARCHAR(10),           -- para validación adicional
  -- Tipo y valor
  gift_card_type              VARCHAR(20) DEFAULT 'monetary', -- monetary|membership_period
  initial_amount              DECIMAL(10,2),
  remaining_amount            DECIMAL(10,2),
  membership_type_id          UUID REFERENCES membership_types(id),
  membership_months           INTEGER,
  -- Estado
  status                      VARCHAR(20) DEFAULT 'active', -- active|redeemed|expired|voided
  -- Comprador
  purchased_by_member_id      UUID REFERENCES members(id),
  purchased_by_name           VARCHAR(100),
  purchased_by_email          VARCHAR(150),
  purchase_transaction_id     UUID REFERENCES transactions(id),
  -- Beneficiario
  redeemed_by_member_id       UUID REFERENCES members(id),
  redeemed_at                 TIMESTAMP,
  -- Validez
  purchased_at                TIMESTAMP DEFAULT NOW(),
  expires_at                  TIMESTAMP,
  -- Metadata
  created_at                  TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CONFIGURACIÓN INICIAL DEL MÓDULO

### Checklist de Configuración: Membresías & Billing

```
MEMBRESÍAS:
□ Catálogo de planes configurado (mínimo 3 planes)
□ Políticas de freeze configuradas por plan
□ Plantilla de contrato personalizada con datos del gym
□ Política de reembolsos definida y en el contrato
□ Formulario PAR-Q (declaración de salud) configurado
□ Add-ons disponibles configurados (locker, toallas, etc.)
□ Membresías especiales con sus requisitos de documentación
□ Proceso de onboarding: evaluación inicial programada automáticamente

BILLING:
□ Pasarela(s) de pago integrada(s) y probada(s)
□ Stripe/MercadoPago account verificada y en modo live
□ Webhooks configurados (URLs de notificación de pago)
□ Día de cobro definido (anclado a fecha de registro o normalizado)
□ Período de gracia definido (recomendado: 3 días)
□ Política de reintentos configurada (días entre intentos)
□ Acciones automáticas por fallo configuradas (notificaciones, bloqueo)
□ Templates de email de cobro exitoso y fallido personalizados

FACTURACIÓN:
□ Datos fiscales del gym configurados (razón social, NIT, dirección fiscal)
□ Logo del gym en las facturas
□ Régimen fiscal configurado (IVA u otros)
□ Numeración de facturas iniciada
□ Si El Salvador: integración DTE con proveedor autorizado
□ Integración contable configurada (QuickBooks, Xero u exportación manual)

SEGURIDAD:
□ 2FA habilitado para todas las cuentas de staff con acceso financiero
□ Roles y permisos configurados (quién puede emitir notas de crédito, hacer reembolsos)
□ Límite de descuento máximo por recepcionista configurado
□ Alertas de transacciones inusuales configuradas
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulos: GYM-MOD-MEM · GYM-MOD-BIL_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión sugerida: Septiembre 2026_
