# 📊 MÓDULO PANEL EJECUTIVO & ANALYTICS (MOD-J)

## Business Intelligence Completo — App Integral de Gimnasio de Élite

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-ANALYTICS`  
> **Prioridad:** MVP Fase 1 (dashboard básico) + Fase 2 (BI completo + Business Coach IA)  
> **Audiencia:** Propietario del gym, administrador, trainers (vistas filtradas)  
> **Principio rector:** _"El dueño que ve sus números en tiempo real nunca toma decisiones a ciegas"_

---

## 📋 TABLA DE CONTENIDO

1. [Visión General & Filosofía](#1-visión-general--filosofía)
2. [Dashboard Ejecutivo Principal](#2-dashboard-ejecutivo-principal)
3. [Módulo Financiero — KPIs & Reportes](#3-módulo-financiero--kpis--reportes)
4. [Módulo de Membresías & Retención](#4-módulo-de-membresías--retención)
5. [Módulo de Operaciones (Clases, Acceso, Staff)](#5-módulo-de-operaciones-clases-acceso-staff)
6. [Módulo de Entrenamiento & Progreso](#6-módulo-de-entrenamiento--progreso)
7. [Módulo de Nutrición & Marketplace](#7-módulo-de-nutrición--marketplace)
8. [Módulo de Satisfacción & NPS](#8-módulo-de-satisfacción--nps)
9. [Vista 360° del Miembro](#9-vista-360-del-miembro)
10. [Sistema de Alertas Inteligentes](#10-sistema-de-alertas-inteligentes)
11. [Business Coach IA — Consultas en Lenguaje Natural](#11-business-coach-ia--consultas-en-lenguaje-natural)
12. [Multi-Sede — Dashboard Comparativo](#12-multi-sede--dashboard-comparativo)
13. [Sistema de Reportes & Exportación](#13-sistema-de-reportes--exportación)
14. [Reportes Automáticos Programados](#14-reportes-automáticos-programados)
15. [Dashboard del Trainer](#15-dashboard-del-trainer)
16. [Dashboard de Recepción](#16-dashboard-de-recepción)
17. [Modelo de Datos & Arquitectura Analytics](#17-modelo-de-datos--arquitectura-analytics)

---

## 1. VISIÓN GENERAL & FILOSOFÍA

### 1.1 Propósito

El **Panel Ejecutivo** transforma los datos dispersos del gimnasio en inteligencia accionable. No es solo un lugar donde ver números — es el sistema nervioso de decisiones del negocio, disponible en tiempo real desde cualquier dispositivo.

El propietario debe poder contestar en menos de 30 segundos cualquier pregunta crítica:

- ¿Cuánto gané este mes vs. el mes pasado?
- ¿Quiénes están a punto de cancelar?
- ¿Qué clases están llenándose y cuáles están vacías?
- ¿Cuál es mi trainer con mejor retención de clientes?
- ¿Cuánto me debe la cartera de crédito del marketplace?

### 1.2 Principios de Diseño

| Principio        | Implementación                                            |
| ---------------- | --------------------------------------------------------- |
| **Tiempo real**  | KPIs críticos actualizados cada 30 segundos               |
| **Drill-down**   | De número global → por sede → por trainer → por miembro   |
| **Accionable**   | Cada dato negativo tiene un botón de acción directa       |
| **Mobile-first** | El dueño ve su gym desde el teléfono en cualquier momento |
| **Sin ruido**    | Solo las métricas que importan — nada decorativo          |
| **Historizado**  | Todo tiene comparativa vs. período anterior               |

### 1.3 Roles y Vistas

```yaml
SUPER ADMIN (Dueño/Propietario):
  Acceso: TODO — financiero, operacional, staff, BI completo
  Vista especial: multi-sede comparativo si tiene varias locaciones

GYM ADMIN:
  Acceso: operacional + financiero (sin costos del SaaS)
  Sin acceso: compensación del dueño, márgenes de rentabilidad del negocio

TRAINER:
  Acceso: solo sus clientes, sus clases, su performance
  Sin acceso: datos financieros, otros trainers, información global

RECEPCIONISTA:
  Acceso: check-ins del día, clases del día, alertas operacionales
  Sin acceso: financiero, KPIs de negocio
```

---

## 2. DASHBOARD EJECUTIVO PRINCIPAL

### 2.1 Layout del Dashboard Principal

```
╔══════════════════════════════════════════════════════════════════════════╗
║  🏋️ GYM ÉLITE — PANEL EJECUTIVO          Hoy: Sábado 13 junio 2026      ║
║  ⚡ Última actualización: hace 28 segundos    [📱 App] [🔔 3 alertas]    ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ ┌─────────┐ ║
║  │  💰 HOY          │ │  👥 MIEMBROS    │ │  📅 CHECK-INS  │ │  ⚠️ 4   │ ║
║  │  $1,425.00       │ │  Active: 247    │ │  Hoy: 89       │ │ ALERTAS │ ║
║  │  +12% vs ayer   │ │  +3 esta semana │ │  Pico: 10am    │ │ [Ver]   │ ║
║  └─────────────────┘ └─────────────────┘ └────────────────┘ └─────────┘ ║
║                                                                          ║
║  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ ┌─────────┐ ║
║  │  📈 MRR          │ │  🔴 EN RIESGO  │ │  🛒 VENTAS HOY │ │  ⭐ NPS  │ ║
║  │  $21,450.00      │ │  Score >60: 18  │ │  $485.00       │ │  72     │ ║
║  │  +5.2% vs mes   │ │  Críticos: 3   │ │  12 órdenes    │ │  +4 pts │ ║
║  └─────────────────┘ └─────────────────┘ └────────────────┘ └─────────┘ ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  GRÁFICAS PRINCIPALES                                                    ║
║                                                                          ║
║  ┌─────────────────────────────────────┐ ┌───────────────────────────┐  ║
║  │  📈 MRR ÚLTIMOS 12 MESES            │ │  👥 NUEVOS vs CANCELADOS  │  ║
║  │                                     │ │                           │  ║
║  │  22k ─────────────────────●         │ │  +23 ████░░ -8            │  ║
║  │  20k ────────────●●●●●●●●           │ │  +19 ███░░░ -11           │  ║
║  │  18k ──────●●●●●                    │ │  +31 █████░ -5            │  ║
║  │  16k ──●●●●                         │ │  Jun ████░░ -?            │  ║
║  │       J A S O N D E F M A M J       │ │      Nuevos   Cancelados  │  ║
║  └─────────────────────────────────────┘ └───────────────────────────┘  ║
║                                                                          ║
║  ┌─────────────────────────────────────┐ ┌───────────────────────────┐  ║
║  │  🔥 OCUPACIÓN DE CLASES (esta sem.) │ │  💰 REVENUE POR CATEGORÍA │  ║
║  │  [Mapa de calor hora × día]         │ │                           │  ║
║  │  Lun  ░▒▓▓▒░░░░░░░░░░░░░░░         │ │  Membresías  ████████ 68% │  ║
║  │  Mar  ░▒▓▓▓▒░░░░░░░░░░░░░          │ │  PT/Sesiones ████░░░ 18%  │  ║
║  │  Mié  ░▒▒▓▒░░░░░░░░░░░░░           │ │  Marketplace ██░░░░░  9%  │  ║
║  │  Jue  ░░▒▓▓▒░░░░░░░░░░░░           │ │  Otros       █░░░░░░  5%  │  ║
║  │  Vie  ░▒▓▓▒▒░░░░░░░░░░░            │ │                           │  ║
║  │       6  8 10 12 14 16 18 20 22    │ └───────────────────────────┘  ║
║  └─────────────────────────────────────┘                                ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║  ALERTAS ACTIVAS                                                         ║
║  🔴 Carlos Mejía (Score 88): Sin visita 18 días — Intervención urgente   ║
║  🟠 Pago fallido: Ana Rodríguez $85.00 — 3er intento fallido             ║
║  🟡 Clase Spinning 6pm: 100% capacidad — 5 en lista de espera           ║
║  🟡 Inventario: Creatina Monohidrato — solo 3 unidades restantes         ║
║  [Ver todas las alertas]                                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║  [💰 Financiero] [👥 Membresías] [📅 Operaciones] [🏋️ Entreno]          ║
║  [🥗 Nutrición]  [🛒 Tienda]     [⭐ Satisfacción] [👤 Mi Miembro]       ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### 2.2 Tarjetas de KPI — Especificación Completa

```yaml
Cada tarjeta de KPI tiene:
  valor_principal: número grande, visible de lejos
  comparativa: vs. período anterior (día, semana, mes)
  indicador_tendencia: ↑ verde / → amarillo / ↓ rojo
  sparkline: mini gráfica de los últimos 7 días
  drill_down: al hacer clic → vista detallada del KPI
  tooltip: explicación de cómo se calcula el KPI

KPIs FILA 1 — Operacional Inmediato:
  Revenue Hoy:
    cálculo: suma de transacciones exitosas del día actual
    comparativa: vs. promedio últimos 7 días mismo día de semana
    drill: desglose por hora del día + por categoría

  Miembros Activos:
    cálculo: membresías con status = 'active' en este momento
    comparativa: +/- vs. mismo día del mes anterior
    drill: lista de miembros activos con estado de pago

  Check-ins Hoy:
    cálculo: registros de acceso desde 00:00 del día actual
    comparativa: vs. promedio últimos 30 días
    drill: histograma por hora + lista de quién vino

  Alertas Activas:
    cálculo: notificaciones de sistema sin resolver
    urgencia: color según prioridad más alta activa
    drill: panel de alertas completo

KPIs FILA 2 — Estratégico:
  MRR (Monthly Recurring Revenue):
    cálculo: proyección del mes basada en suscripciones activas
    comparativa: vs. MRR del mes anterior
    drill: desglose por tipo de membresía, tendencia 12 meses

  Miembros en Riesgo:
    cálculo: miembros con risk_score > 60
    urgencia: sub-conteo de Score >80 (críticos)
    drill: lista ordenada por score con botón de acción directa

  Ventas Marketplace Hoy:
    cálculo: órdenes confirmadas del día en el marketplace
    comparativa: vs. promedio diario del mes
    drill: órdenes por estado, productos más vendidos

  NPS Score:
    cálculo: (% promotores - % detractores) de los últimos 30 días
    comparativa: vs. mes anterior
    drill: distribución de respuestas, comentarios recientes
```

---

## 3. MÓDULO FINANCIERO — KPIs & REPORTES

### 3.1 Dashboard Financiero

```
DASHBOARD FINANCIERO — Junio 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERÍODO ACTUAL vs. ANTERIOR:
  [Este mes ▼]  [vs Mes anterior ▼]  [Actualizar]

┌─────────────────────────────────────────────────────────────┐
│  INGRESOS TOTALES                                           │
│                                                             │
│  Jun 2026 (proyectado):    $28,450.00                       │
│  May 2026 (real):          $27,040.00                       │
│  Diferencia:               +$1,410.00  (+5.2%) ↑           │
│                                                             │
│  DESGLOSE DEL MES:                                          │
│  Membresías recurrentes:   $19,350.00  (68.0%)             │
│  Sesiones PT adicionales:  $5,120.00   (18.0%)             │
│  Marketplace/Retail:       $2,560.00   (9.0%)              │
│  Clases especiales:        $850.00     (3.0%)              │
│  Cuotas de inscripción:    $570.00     (2.0%)              │
└─────────────────────────────────────────────────────────────┘

MÉTRICAS CLAVE DEL MES:
┌──────────────┬────────────┬────────────┬────────────────────┐
│ Métrica      │ Este mes   │ Mes ant.   │ Tendencia          │
├──────────────┼────────────┼────────────┼────────────────────┤
│ MRR          │ $21,450    │ $20,380    │ +5.2% ↑            │
│ ARR          │ $257,400   │ $244,560   │ +5.2% ↑            │
│ ARPU         │ $86.84     │ $84.08     │ +3.3% ↑            │
│ LTV estimado │ $1,736     │ $1,681     │ +3.3% ↑            │
│ CAC          │ $142       │ $158       │ -10.1% ↑ (mejor)   │
│ LTV:CAC      │ 12.2x      │ 10.6x      │ +15.1% ↑           │
│ Churn rate   │ 2.8%       │ 3.4%       │ -0.6pp ↑           │
│ Revenue churn│ 2.1%       │ 2.9%       │ -0.8pp ↑           │
│ New MRR      │ $2,340     │ $2,120     │ +10.4% ↑           │
│ Churned MRR  │ $570       │ $740       │ -23.0% ↑ (mejor)   │
│ Net MRR Growth│ $1,070    │ $380       │ +181.6% ↑          │
│ Expansion MRR│ $300       │ $200       │ +50.0% ↑           │
└──────────────┴────────────┴────────────┴────────────────────┘
```

### 3.2 Análisis de Cobros & Pagos Fallidos

```
ESTADO DE COBROS — Junio 2026

COBROS PROGRAMADOS ESTE MES:        337 cobros / $28,980.00
  ✅ Exitosos (cobrados):            318 cobros / $27,435.00 (94.7%)
  🔄 En proceso de retry:              8 cobros /    $684.00  (2.4%)
  🔴 Fallidos sin resolver:           11 cobros /    $861.00  (2.9%)

EVOLUCIÓN DIARIA:
  Día 1-10:   $9,820 cobrado / $0 pendiente
  Día 11-20:  $10,240 cobrado / $420 en retry
  Día 21-30:  $7,375 cobrado / $1,125 pendiente

ANÁLISIS DE FALLOS:
  Por razón:
    Fondos insuficientes:    5 (45%)
    Tarjeta vencida:         3 (27%)
    Tarjeta rechazada:       2 (18%)
    Error técnico:           1 (9%)

  Por antigüedad:
    < 3 días:    4 cobros (aún en retry automático)
    3-7 días:    5 cobros (ARIA enviando mensajes)
    > 7 días:    2 cobros (escalados al admin)

TASA DE RECUPERACIÓN HISTÓRICA:
  Pagos fallidos que se recuperan:   78% (benchmark industria: 71%)
  Tiempo promedio de recuperación:   4.2 días

ACCIÓN REQUERIDA:
  [Ver lista de cobros fallidos]  [Exportar para seguimiento]
```

### 3.3 Proyección de Ingresos (Forecast)

```yaml
PROYECCIÓN — Próximos 3 meses

Motor de proyección:
  Base: suscripciones activas × tasa de renovación histórica
  Ajuste: churn proyectado (basado en Risk Scores actuales)
  Ajuste: conversiones esperadas (trials activos × tasa de conversión)
  Intervalo de confianza: 80% / 90% / 95%

Julio 2026:
  Proyección base:      $28,900
  Proyección optimista: $30,200  (+4.5% si se recuperan cobros fallidos)
  Proyección pesimista: $27,100  (-6.2% si se pierden miembros en riesgo)
  Confianza:            85%

Agosto 2026:
  Proyección base:      $29,400
  Tendencia estacional: -3% (verano = menor asistencia histórica)
  Proyección ajustada:  $28,500
  Confianza:            72%

Septiembre 2026:
  Proyección base:      $31,200
  Tendencia estacional: +8% (inicio de ciclo escolar = nuevos miembros)
  Proyección ajustada:  $33,700
  Confianza:            65%

SUPUESTOS:
  - Sin cambios en pricing
  - Tasa de conversión de trials = histórico (42%)
  - Campañas de retención con efectividad promedio
  [Ajustar supuestos]  [Ver escenarios]
```

---

## 4. MÓDULO DE MEMBRESÍAS & RETENCIÓN

### 4.1 Dashboard de Cartera de Membresías

```
MEMBRESÍAS — Estado Actual: 13 junio 2026

CARTERA ACTIVA:
┌──────────────────────────────────────────────────────────────┐
│  Total miembros activos:           247                       │
│  ████████████████████████ 247/300 (82% de capacidad)        │
│                                                              │
│  DISTRIBUCIÓN POR PLAN:                                      │
│  Elite Anual:    ████████  82  (33.2%)  $37,260/año          │
│  Mensual Elite:  ██████    61  (24.7%)  $5,185/mes           │
│  Mensual Plus:   █████     52  (21.1%)  $3,380/mes           │
│  Mensual Básica: ████      41  (16.6%)  $1,845/mes           │
│  Trimestral:     ██        11  ( 4.5%)  $1,815/trim          │
└──────────────────────────────────────────────────────────────┘

MOVIMIENTOS DEL MES:
  Nuevos miembros:         +23  (fuentes: referidos 8, web 9, walk-in 6)
  Cancelaciones:            -8  (razones: precio 3, tiempo 2, mudanza 2, otro 1)
  Upgrades:                 +5  (mensual básica → plus × 3, plus → elite × 2)
  Downgrades:               -2  (elite → plus × 1, plus → básica × 1)
  Freezes activos:          14  (promedio 18.5 días de duración)
  Neto del mes:            +18  ↑

TRIALS ACTIVOS:
  En período de prueba:      8  (promedio día 4/7)
  Conversión esperada:       4  (50% histórico)
  Valor proyectado:         $340/mes si todos convierten
```

### 4.2 Análisis de Retención (Cohort Analysis)

```
RETENCIÓN POR COHORTE — Vista 12 meses

Mes de Ingreso  │ Mes 1 │ Mes 2 │ Mes 3 │ Mes 6 │ Mes 12
────────────────┼───────┼───────┼───────┼───────┼────────
Jun 2025 (n=31) │  100% │  87%  │  81%  │  74%  │  68%
Jul 2025 (n=28) │  100% │  89%  │  82%  │  75%  │  ─
Ago 2025 (n=24) │  100% │  83%  │  75%  │  71%  │  ─
Sep 2025 (n=37) │  100% │  91%  │  86%  │  79%  │  ─
Oct 2025 (n=29) │  100% │  88%  │  84%  │  ─    │  ─
Nov 2025 (n=22) │  100% │  86%  │  ─    │  ─    │  ─
Dic 2025 (n=18) │  100% │  ─    │  ─    │  ─    │  ─
─────────────────────────────────────────────────────────
PROMEDIO:        │  100% │  87%  │  82%  │  75%  │  68%

INTERPRETACIÓN:
  ✅ Retención mes 1: 87% — Excelente (industria: 80%)
  ✅ Retención mes 3: 82% — Bueno (industria: 72%)
  ✅ Retención mes 6: 75% — Muy bueno (industria: 65%)
  ⚠️ Cohorte Agosto: retención mes 3 fue 75% vs. promedio 82%
     → Coincide con cambio de instructor en Spinning ese mes
     → Acción tomada: nuevo instructor desde noviembre → mejora visible
```

### 4.3 Dashboard de Riesgo de Churn

```
RADAR DE RETENCIÓN — Tiempo Real

DISTRIBUCIÓN POR RISK SCORE:
  ⚫ 86-100 (Emergencia):   2 miembros  — Acción inmediata
  🔴 71-85  (Crítico):      8 miembros  — Acción esta semana
  🟠 56-70  (En riesgo):   18 miembros  — Workflow activo
  🟡 41-55  (Atención):    23 miembros  — Monitorear
  🟢 0-40   (Estable):    196 miembros  — Solo check-in regular

TOP 10 EN RIESGO MÁS ALTO:
┌──────────────────┬───────┬─────────────┬───────────────────────┐
│ Miembro          │ Score │ Días sin ir │ Razón principal        │
├──────────────────┼───────┼─────────────┼───────────────────────┤
│ Carlos Mejía     │  88   │     18      │ Inactividad + pago     │
│ Rosa Hernández   │  84   │     14      │ Inactividad extendida  │
│ Marcos Salazar   │  81   │     12      │ 3 no-shows + inactivo  │
│ Patricia Lima    │  76   │      9      │ NPS negativo + inactiva│
│ Jorge Ramos      │  74   │      8      │ Múltiples cancelaciones│
│ Isabel Cruz      │  71   │      7      │ Pago fallido + inactiva│
│ Diego Morales    │  68   │      6      │ Bajó frecuencia 60%    │
│ Sofía Vásquez    │  65   │      5      │ No responde a ARIA     │
│ Andrés Peña      │  63   │      5      │ Queja abierta >72h     │
│ Lucía Torres     │  61   │      4      │ Cambio de horario      │
└──────────────────┴───────┴─────────────┴───────────────────────┘
[Ver perfil]  [Contactar]  [Escalar]  para cada uno

EFECTIVIDAD DE RETENCIÓN (últimos 90 días):
  Miembros que entraron en riesgo:       47
  Recuperados con workflow ARIA:         28  (59.6%)
  Recuperados con intervención humana:    9  (19.1%)
  Cancelaron a pesar de intervención:    10  (21.3%)

  Revenue retenido estimado:           $2,380/mes
  Costo de retención:                   $380 (tiempo de staff)
  ROI de retención:                     +526%
```

---

## 5. MÓDULO DE OPERACIONES (CLASES, ACCESO, STAFF)

### 5.1 Dashboard de Clases & Ocupación

```
OPERACIONES — CLASES & SCHEDULING

OCUPACIÓN ESTA SEMANA (porcentaje de capacidad):
┌──────────────────┬────┬────┬────┬────┬────┬────┬────┐
│ Clase / Horario  │ Lu │ Ma │ Mi │ Ju │ Vi │ Sa │ Do │
├──────────────────┼────┼────┼────┼────┼────┼────┼────┤
│ Spinning 7:00am  │ 95%│100%│ 85%│100%│ 80%│ 90%│ ─  │
│ Spinning 6:00pm  │100%│ 90%│ 75%│ 85%│100%│ ─  │ ─  │
│ Yoga 8:00am      │ 60%│ ─  │ 55%│ ─  │ 65%│ 70%│ ─  │
│ Zumba 7:00pm     │ ─  │ 85%│ ─  │ 90%│ ─  │ ─  │ 75%│
│ HIIT 6:00am      │ 70%│ ─  │ 80%│ ─  │ 75%│ ─  │ ─  │
│ Pilates 10:00am  │ ─  │ 45%│ ─  │ 40%│ ─  │ 55%│ ─  │
└──────────────────┴────┴────┴────┴────┴────┴────┴────┘
🔴 >90%  🟠 70-90%  🟡 50-70%  🟢 <50%

ALERTAS:
⚠️ Pilates tiene ocupación baja (<50%) → Considerar: reducir slots o campaña de promoción
⚠️ Spinning 6pm Mar/Vie: 100% con lista de espera → Considerar: añadir sesión adicional

EFICIENCIA POR INSTRUCTOR:
┌─────────────────┬──────────┬─────────┬──────────┬────────┐
│ Instructor      │ Clases/sem│ Ocup. % │ Rating   │ No-shows│
├─────────────────┼──────────┼─────────┼──────────┼────────┤
│ Roberto Méndez  │    8     │   94%   │  4.9/5   │  3.2%  │
│ Laura Sánchez   │    6     │   71%   │  4.7/5   │  4.8%  │
│ Marcos García   │    5     │   58%   │  4.3/5   │  8.1%  │
│ Carmen López    │    4     │   87%   │  4.8/5   │  2.9%  │
└─────────────────┴──────────┴─────────┴──────────┴────────┘
⚠️ Marcos García: ocupación baja + no-shows altos → revisión de programa
```

### 5.2 Dashboard de Acceso & Aforo

```
ACCESO FÍSICO — Tiempo Real

AFORO AHORA: 47 personas en el gym
  ████████████████░░░░  47/120 (39% de capacidad) 🟢

FLUJO DEL DÍA (check-ins por hora):
  06:00  ████  18
  07:00  █████████  42
  08:00  █████████████  58
  09:00  ████████████████  71
  10:00  █████████████████████  89  ← Pico del día
  11:00  ████████████████████  84
  12:00  ████████████  54
  ...

ESTADÍSTICAS DEL DÍA:
  Total check-ins:        89
  Promedio diario 30d:    78  (+14% hoy)
  Tiempo promedio visita: 68 min
  Miembros únicos:        89
  Re-entradas:             0

ÚLTIMOS CHECK-INS:
  12:47  María García        Membresía Elite
  12:43  Pedro Ramírez       Membresía Plus
  12:38  Ana Torres          Membresía Elite
  12:31  [3 más]
  [Ver todos]

ACCESOS DENEGADOS HOY: 2
  10:15  Luis Moreno — Membresía vencida desde hace 3 días
          [Contactar]  [Activar acceso temporal]
  09:42  Visitante sin membresía — walk-in
          [Registrar trial]
```

### 5.3 Dashboard de Staff & Payroll

```
STAFF — Resumen del Mes

PLANTILLA ACTIVA: 8 personas
  Trainers/PT:         4
  Instructores clases: 3
  Recepcionistas:      2

DESEMPEÑO DEL MES:
┌──────────────┬──────────┬──────────┬──────────┬──────────────┐
│ Nombre       │Asistencia│ Sesiones │ Revenue  │ Retención    │
│              │ al trabajo│ impartidas│ generado │ de clientes  │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Carlos G.    │  100%    │    42    │ $3,780   │    92%       │
│ Laura S.     │   95%    │    38    │ $3,040   │    87%       │
│ Miguel R.    │   91%    │    31    │ $2,480   │    78%       │
│ Sofía P.     │   100%   │    28    │ $2,240   │    85%       │
└──────────────┴──────────┴──────────┴──────────┴──────────────┘

PAYROLL ESTIMADO ESTE MES:
  Salarios fijos:       $3,200.00
  Comisiones PT:        $1,436.00  (basado en sesiones impartidas)
  Bonos por retención:  $280.00    (Carlos G. y Sofía P.)
  TOTAL PAYROLL:        $4,916.00
  [Ver cálculo detallado]  [Aprobar payroll]
```

---

## 6. MÓDULO DE ENTRENAMIENTO & PROGRESO

### 6.1 Analytics de Entrenamiento del Gym

```
ENTRENAMIENTO — Analytics del Gimnasio

ADHERENCIA AL PLAN (mes actual):
  Miembros con plan activo:              186  (75% del total activo)
  Completando plan correctamente (>80%):  112  (60.2%)
  Adherencia media (50-80%):              52  (27.9%)
  Adherencia baja (<50%):                 22  (11.8%)
  Sin registrar sesiones este mes:        34  (14% — alerta CRM)

VOLUMEN DE ENTRENAMIENTO (todo el gym, esta semana):
  Total sets ejecutados:      4,847
  Total reps completadas:    52,340
  Volumen total (kg):       418,750
  Sesiones completadas:         312
  Duración promedio sesión:   54 min

RÉCORDS PERSONALES ESTA SEMANA: 47 PRs
  Por ejercicio más frecuente:
    Press de banca:    12 PRs
    Sentadilla:         9 PRs
    Peso muerto:        8 PRs
    Hip Thrust:         7 PRs
    Remo:               6 PRs
    Otros:              5 PRs

EJERCICIOS MÁS ASIGNADOS (top 10):
  1. Sentadilla Hack            847 veces en planes activos
  2. Hip Thrust con Barra       782 veces
  3. Press de Banca             731 veces
  4. Jalón al Pecho             698 veces
  5. Peso Muerto Rumano         645 veces
  [Ver top 50]

RENDIMIENTO POR TRAINER:
  KPI: PRs generados por sus clientes / total clientes
  Carlos G.:   2.4 PRs/cliente/mes ⭐ Top performer
  Laura S.:    1.9 PRs/cliente/mes ✅
  Miguel R.:   1.2 PRs/cliente/mes ⚠️ Revisar planes
  Sofía P.:    2.1 PRs/cliente/mes ✅
```

### 6.2 Analytics de Progreso de Miembros

```
PROGRESO DE MEMBRESÍA (análisis de resultados)

OBJETIVOS ALCANZADOS ESTE MES: 8 miembros
  Pérdida de peso (meta alcanzada):     3 miembros
  Aumento de fuerza (meta alcanzada):   3 miembros
  Definición (meta alcanzada):          2 miembros

EVALUACIONES FÍSICAS DEL MES:
  Programadas:   24
  Completadas:   19  (79%)
  Pendientes:     5  [Ver lista]

CAMBIOS PROMEDIO EN MÉTRICAS (todos los miembros con 3+ meses):
  Pérdida de peso promedio:       -2.8 kg
  Reducción % grasa corporal:     -1.9%
  Aumento masa muscular:          +0.7 kg
  Mejora fuerza (promedio 1RM):   +18%

ANÁLISIS DE MESETAS (miembros sin progreso 4+ semanas): 12
  Por categoría de objetivo:
    Pérdida de peso:    5  (el más común)
    Fuerza:             4
    Masa muscular:      3

  [Alertar a sus trainers]  [Ver perfiles]
```

---

## 7. MÓDULO DE NUTRICIÓN & MARKETPLACE

### 7.1 Analytics de Nutrición

```
NUTRICIÓN — Dashboard del Mes

ADOPCIÓN DEL MÓDULO:
  Miembros con plan nutricional activo:   98  (39.7% del total)
  Adherencia al plan (promedio):          64%
  Miembros registrando comidas diario:    71  (72% de los con plan)
  Análisis de fotos de platos/semana:    234  (+18% vs. mes ant.)
  Exámenes médicos subidos:               12  (nuevos este mes)

PLANES NUTRICIONALES POR OBJETIVO:
  Pérdida de peso:        52 planes  (53%)
  Ganancia muscular:      28 planes  (29%)
  Mantenimiento:          11 planes  (11%)
  Rendimiento deportivo:   7 planes   (7%)

CONSULTAS CON NUTRICIONISTA:
  Este mes:    18 consultas completadas
  Pendientes:   4 agendadas
  Canceladas:   2 (con motivo registrado)

  Nutricionista: Dra. Ana López
  Rating promedio: 4.8/5.0
```

### 7.2 Analytics del Marketplace

```
MARKETPLACE — Dashboard del Mes

VENTAS TOTALES:
  Revenue total marketplace:   $2,560.00
  Número de órdenes:                62
  Ticket promedio:               $41.29
  vs. mes anterior:              +12.4% ↑

PRODUCTOS MÁS VENDIDOS:
  1. Whey Gold Vainilla 2lb         18 uds  $810.00
  2. Quest Bar Chocolate x12         9 cajas $378.00
  3. BCAA 2:1:1 Sandía 400g         12 uds  $264.00
  4. Creatina Monohidrato 300g       15 uds  $270.00
  5. L-Carnitina 3000mg 30d         11 uds  $275.00

CARTERA DE CRÉDITO:
  Saldo total deudor:          $1,847.50
  En estado normal (<70%):       985.00  (28 miembros)
  En alerta (70-90%):            547.50  ( 9 miembros)
  Suspendidos (100%+):           315.00  ( 5 miembros) ⚠️

  Cobros automaticos del mes:  $2,240.00  (82% de la cartera cobrada)
  Pendiente de cobro manual:     $420.00

CANALES DE PEDIDO:
  App (lista de productos):    38 órdenes  (61%)
  ARIA / Chat:                 14 órdenes  (23%)
  POS mostrador:                8 órdenes  (13%)
  Foto/Cámara:                  2 órdenes   (3%)

INVENTARIO CRÍTICO:
  Sin stock:           2 productos  [Reponer urgente]
  Stock crítico (<3):  4 productos  [Ordenar esta semana]
  [Ver inventario completo]
```

---

## 8. MÓDULO DE SATISFACCIÓN & NPS

### 8.1 Dashboard de Satisfacción

```
SATISFACCIÓN DEL CLIENTE — Dashboard

NPS SCORE ACTUAL: 72  (Excelente — Benchmark industria: 45-65)
  ████████████████████████████░░░░░░░░  72/100
  Promotores  (9-10):   61%  ────────────────────
  Pasivos     (7-8):    22%  ──────────
  Detractores (0-6):    17%  ────────

  vs. mes anterior: +4 pts ↑
  Tendencia 6 meses: 58 → 61 → 64 → 67 → 68 → 72 (↑ consistente)

DISTRIBUCIÓN POR SERVICIO:
  Instalaciones del gym:    4.6/5.0  ⭐⭐⭐⭐⭐
  Trainers / PT:            4.8/5.0  ⭐⭐⭐⭐⭐
  Clases grupales:          4.7/5.0  ⭐⭐⭐⭐⭐
  Atención en recepción:    4.4/5.0  ⭐⭐⭐⭐
  App móvil:                4.5/5.0  ⭐⭐⭐⭐⭐
  Marketplace/Tienda:       4.3/5.0  ⭐⭐⭐⭐
  ARIA (asistente virtual): 4.6/5.0  ⭐⭐⭐⭐⭐

TICKETS DE FEEDBACK ESTE MES:
  Total tickets:    23
  Quejas formales:   8
  Sugerencias:      11
  Incidentes:        4

  Resueltos:        20  (87%)
  En proceso:        3  (13%)
  Tiempo prom. resolución: 18.4 horas
  Satisfacción post-resolución: 4.1/5.0

TEMAS MÁS FRECUENTES EN QUEJAS:
  Equipamiento fuera de servicio:  3  (37%)
  Temperatura del gym:             2  (25%)
  Disponibilidad de estacionamiento: 2 (25%)
  Atención de instructor específico: 1 (13%)
  [Ver todas las quejas]
```

### 8.2 Análisis de Comentarios (NLP)

```yaml
Análisis automático de texto libre en encuestas:

Sentimiento general de comentarios este mes:
  Positivo:   72%
  Neutro:     18%
  Negativo:   10%

Temas emergentes (NLP clustering):
  Positivos más mencionados:
    "limpieza" / "muy limpio":           47 menciones
    "trainers excelentes":               38 menciones
    "buenos equipos":                    31 menciones
    "app fácil de usar":                 28 menciones

  Negativos más mencionados:
    "parking difícil":                   12 menciones → ALERTA RECURRENTE
    "caminadoras ocupadas siempre":       8 menciones → Considerar más caminadoras
    "agua caliente en duchas":            6 menciones → Mantenimiento urgente

Insights automáticos del sistema:
  "El tema de estacionamiento lleva 3 meses consecutivos
   como el comentario negativo #1. Requiere atención estructural."

  "Los comentarios sobre los trainers son consistentemente
   los más positivos — ventaja competitiva a reforzar en marketing."
```

---

## 9. VISTA 360° DEL MIEMBRO

### 9.1 Perfil Ejecutivo Completo del Miembro

```
PERFIL 360° — María García Pérez
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENCABEZADO:
  [FOTO]  María García Pérez
          Miembro desde: 15 marzo 2026 (90 días)
          Membresía: Elite Mensual — $95.00/mes
          Trainer: Carlos Gutiérrez
          Estado: 🟢 ACTIVA          Risk Score: 24 (Estable)
          Nivel fidelidad: 🥈 PLATA  Puntos: 2,340

PESTAÑAS: [Resumen] [Financiero] [Entreno] [Nutrición] [Citas] [Comunicaciones] [Historial]

━━ TAB: RESUMEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MÉTRICAS FÍSICAS (última evaluación: 01/06/2026):
  Peso: 65.8 kg (inicio: 68.0 kg | -2.2 kg ↓)
  % Grasa: 26.5% (inicio: 28.0% | -1.5% ↓)
  Masa muscular: 49.2 kg (inicio: 48.9 kg | +0.3 kg ↑)
  IMC: 24.8 (normal) ✅

OBJETIVO Y PROGRESO:
  Meta: Perder 8 kg para el 15 septiembre 2026
  Progreso: 27.5% del objetivo alcanzado
  Ritmo actual: -0.55 kg/sem (necesario: -0.73 kg/sem)
  Proyección de llegada: 18 semanas (ligeramente detrás)

ACTIVIDAD RECIENTE:
  Última visita:           Hoy a las 10:23am
  Sesiones este mes:       8/12 programadas (67%)
  PRs esta semana:         2 (Press Banca + Remo)
  Racha actual:            12 días ↑
  Plan activo:             Pérdida de Peso Fase 2 (Sem 6/12)

━━ TAB: FINANCIERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VALOR DEL CLIENTE:
  LTV acumulado (90 días):    $285.00
  LTV proyectado (12 meses):  $1,140.00 (si retiene)
  Costo de adquisición:       $148.00 (referida por Pedro R.)
  ROI del cliente:            +93% hasta ahora

ESTADO DE PAGOS:
  Próximo cobro: $95.00 el 15/07/2026
  Historial: 3 cobros / 3 exitosos (100% ✅)
  Método: Visa ****4521 (vence 12/28)
  Deuda marketplace: $57.00 (de $150 límite — 38%)
  Wallet saldo: $25.00

━━ TAB: COMUNICACIONES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ACTIVIDAD CON ARIA (últimas 2 semanas):
  Mensajes enviados por ARIA:   14
  Respuestas de María:          11 (79% respuesta)
  Tiempo prom. de respuesta:    12 minutos
  Canal preferido: WhatsApp ✓
  Mejor horario: 7-9am y 7-9pm
  Sentimiento promedio: +0.6 (positivo)

ÚLTIMO MENSAJE DE ARIA (hoy 8:30am):
  "¡Buenos días María! ☀️ ¡12 días de racha!
   Hoy tienes Día B (Torso + Cardio).
   Carlos dejó una nota: 'Sube 2.5kg en Hip Thrust hoy.'
   ¿Nos vemos en el gym? 💪"
  [María respondió a las 8:47am: "¡Ahí voy! 🔥"]

ACCIONES RÁPIDAS:
  [💬 Enviar mensaje]  [📞 Llamar con ARIA]  [📧 Email]
  [📅 Agendar cita]   [❄️ Freeze]           [⬆️ Upgrade]
  [🎁 Dar beneficio]  [⚠️ Escalar a trainer] [📋 Ver historial completo]
```

---

## 10. SISTEMA DE ALERTAS INTELIGENTES

### 10.1 Motor de Alertas

```yaml
Categorías de alertas (configurables por el admin):

CATEGORÍA: RETENCIÓN (prioridad alta)
  Risk Score cruzó umbral 70:
    trigger: risk_score aumenta de <70 a ≥70
    destinatario: admin + trainer del miembro
    mensaje: "⚠️ [Nombre] alcanzó Risk Score 74. Sin visita 8 días.
              Workflow de retención Nivel 2 activado. [Ver perfil]"
    acción_directa: botón [Contactar ahora] abre WhatsApp

  Miembro sin visita X días (configurable por segmento):
    principiantes (<3 meses): alerta a 3 días
    regulares (3-12 meses):   alerta a 5 días
    veteranos (>1 año):       alerta a 7 días

CATEGORÍA: FINANCIERO (prioridad alta)
  Pago fallido sin resolver > 5 días:
    destinatario: admin
    urgencia: 🔴 Rojo

  MRR cayó más del 5% vs. semana anterior:
    destinatario: dueño
    urgencia: 🟠 Naranja

  Deuda de crédito de miembro supera $200:
    destinatario: admin
    urgencia: 🟡 Amarillo

CATEGORÍA: OPERACIONAL (prioridad media)
  Clase con ocupación < 30% (48h antes):
    destinatario: admin
    mensaje: "Pilates del martes tiene solo 4/15 reservas.
              ¿Enviar promo a miembros interesados?"
    acción: [Enviar promoción]  [Cancelar clase]  [Ignorar]

  Clase con 100% de capacidad:
    destinatario: recepcionista
    mensaje: "Spinning 6pm está lleno. 5 en lista de espera."
    acción: [Añadir clase extra]  [Gestionar lista de espera]

  Instructor faltó sin aviso:
    destinatario: admin + recepcionista
    urgencia: 🔴 Rojo
    acción: [Buscar sustituto]  [Notificar a inscritos]

CATEGORÍA: INVENTARIO (prioridad media)
  Stock llegó al mínimo configurado:
    destinatario: admin
    mensaje: "Creatina Monohidrato: 3 unidades (mínimo: 5)"
    acción: [Crear orden de compra]  [Contactar proveedor]

CATEGORÍA: CUMPLEAÑOS & FECHAS (prioridad baja)
  3 días antes del cumpleaños de un miembro:
    destinatario: ARIA (para activar workflow de cumpleaños)

  Membresía vence en 30 días:
    destinatario: ARIA (workflow de renovación automático)

  Evaluación física vencida (>60 días sin evaluación):
    destinatario: trainer del miembro
```

### 10.2 Centro de Alertas (Panel Admin)

```
CENTRO DE ALERTAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Filtros: [🔴 Críticas (2)] [🟠 Altas (6)] [🟡 Medias (14)] [Todas (22)]

🔴 CRÍTICA — Carlos Mejía — Risk Score 88 — Hace 3 horas
   18 días sin visita + pago fallido (2do intento)
   ARIA envió 3 mensajes sin respuesta
   [📞 Llamar ahora] [👤 Ver perfil] [⬆️ Escalar al dueño] [✓ Resolver]

🔴 CRÍTICA — Duchas agua fría (3 quejas en 24h)
   Patricia Lima, Jorge Ramos, Isabel Cruz reportaron mismo problema
   [🔧 Mantenimiento] [📢 Notificar afectados] [✓ Resolver]

🟠 ALTA — Pago fallido 3er intento — Ana Rodríguez — $85.00
   Tarjeta vencida. Lleva 7 días en proceso de dunning.
   [💬 Enviar link de pago] [👤 Ver perfil] [⏸️ Suspender acceso] [✓]

🟠 ALTA — Clase Pilates martes solo 4 reservas de 15 (48h)
   Ocupación 27% — por debajo del umbral de 50%
   [📢 Enviar promo] [❌ Cancelar clase] [😴 Ignorar esta vez] [✓]

🟡 MEDIA — Stock crítico: 3 productos bajo mínimo
   Creatina (3u), BCAA Sandía (0u), L-Carnitina (4u)
   [📦 Crear orden de compra] [Ver inventario] [✓]

[Marcar todas como vistas]  [Configurar alertas]  [Ver historial]
```

---

## 11. BUSINESS COACH IA — CONSULTAS EN LENGUAJE NATURAL

### 11.1 Concepto del Business Coach

El **Business Coach** es una interfaz conversacional que permite al dueño o admin consultar cualquier métrica del negocio en lenguaje natural, sin necesidad de navegar por reportes o construir queries. Es el equivalente de tener un analista de datos disponible 24/7.

```
BUSINESS COACH IA — Panel Ejecutivo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[🤖 Pregúntale algo a tu Business Coach]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUEÑO: "¿Cómo voy este mes vs el mes pasado?"

BUSINESS COACH:
  Junio va muy bien 📈 Aquí el resumen:

  • Revenue: $28,450 proyectado vs $27,040 del mes pasado (+5.2%)
  • Membresías activas: 247 vs 232 del mes pasado (+6.5%)
  • Churn: 2.8% vs 3.4% — mejoraste retención ✅
  • NPS: 72 vs 68 del mes pasado (+4 pts) ✅

  Lo que más mejoró: La retención gracias a los workflows de ARIA.
  Lo que todavía necesita atención: 11 cobros fallidos sin resolver
  representan $861 en riesgo.

  ¿Quieres que profundice en alguna área específica?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUEÑO: "¿Qué trainer me genera más dinero?"

BUSINESS COACH:
  Basado en el revenue generado directamente por sus clientes este mes:

  1. 🥇 Carlos Gutiérrez:  $3,780 en PT + retención del 92% de sus clientes
  2. 🥈 Sofía Palma:       $2,240 en PT + mejor ratio LTV ($1,890 promedio)
  3. 🥉 Laura Sánchez:     $3,040 en PT pero retención solo 87%
  4.    Miguel Robles:     $2,480 pero 78% retención — el más bajo del equipo

  Carlos genera más revenue Y retiene mejor. Si tuvieras que elegir
  uno para promocionar o darle más clientes: Carlos.

  Miguel necesita atención — sus clientes progresan menos (1.2 PRs/mes
  vs promedio del gym de 2.1). ¿Quieres ver sus planes de entrenamiento?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUEÑO: "¿Cuánto dinero dejé de ganar por cancelaciones en los últimos 3 meses?"

BUSINESS COACH:
  Calculando revenue perdido por cancelaciones (abril–junio 2026):

  Cancelaciones en el período:   31 miembros
  ARPU promedio al cancelar:     $78.40/mes
  LTV restante estimado no cobrado: $18,720

  Desglose por motivo declarado:
  • Precio / presupuesto:  12 cancelaciones → $7,490 perdido
  • Falta de tiempo:        8 cancelaciones → $4,990 perdido
  • Mudanza/cambio ciudad:  6 cancelaciones → $3,740 perdido (inevitable)
  • No ver resultados:      3 cancelaciones → $1,870 perdido (prevenible)
  • Mala experiencia:       2 cancelaciones → $1,248 perdido (crítico)

  Revenue evitable (si se hubieran retenido los que se fueron por precio
  o resultados): ~$9,360 en los próximos 12 meses.

  Inversión en ARIA + workflows: $240/mes → ROI si retiene 1 miembro más:
  +$940/año por miembro. Cada miembro retenido paga 3.9 meses de ARIA.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 11.2 Preguntas de Ejemplo que el Business Coach puede responder

```yaml
Financieras:
  "¿Cuál fue mi mejor mes del año pasado y por qué?"
  "¿Cuánto me costaría reducir el precio de la membresía básica un 10%?"
  "¿Cuántos miembros nuevos necesito para llegar a $30k MRR?"
  "¿Cuál es el ROI de mis clases de spinning vs. el Yoga?"

Retención:
  "¿Qué tienen en común los miembros que llevan más de un año?"
  "¿En qué mes suelen cancelar más los nuevos miembros?"
  "¿Los miembros que usan ZEUS Coach se quedan más tiempo?"
  "Muéstrame los miembros que cumplen aniversario este mes"

Operacional:
  "¿Cuál es mi hora de mayor ocupación esta semana?"
  "¿Qué clase tiene la peor relación ocupación/costo?"
  "¿Cuándo fue la última vez que tuve más de 100 personas en el gym?"
  "¿Qué instructor tiene los mejores reviews de los últimos 60 días?"

Marketplace:
  "¿Qué producto me genera más margen este mes?"
  "¿Cuánto del total de ventas es a crédito vs. contado?"
  "¿Qué miembros tienen la deuda más antigua?"
  "¿Cuáles son mis 10 mejores clientes del marketplace?"

Predictivas:
  "¿Cuántos miembros creo que voy a perder el próximo mes?"
  "Si la tendencia continúa, ¿cuándo llegaré a 300 miembros activos?"
  "¿Hay algún patrón estacional que deba preparar para julio?"
  "¿Qué miembros actuales tienen más probabilidad de upgradearse?"
```

---

## 12. MULTI-SEDE — DASHBOARD COMPARATIVO

### 12.1 Vista Consolidada de Cadena

```
GYM ÉLITE — CADENA (3 sedes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESUMEN DE CADENA — Junio 2026:

                    TOTAL CADENA   ZONA ROSA    SANTA ELE.   SAN BENITO
────────────────────────────────────────────────────────────────────────
Miembros activos:       621          247           204           170
Revenue MRR:        $53,650       $21,450       $17,600       $14,600
Revenue/miembro:       $86.4         $86.8         $86.3         $85.9
Churn rate:             2.9%          2.8%          3.1%          2.7%
NPS:                     70             72            67            71
Ocupación clases:       78%            82%           74%           79%
Check-ins/día prom:     241             96            82            63
Tickets pendientes:       9              3             4             2
────────────────────────────────────────────────────────────────────────

MEJOR SEDE ESTE MES: Zona Rosa ⭐
  Menor churn (2.8%) + Mayor NPS (72) + Mayor revenue/miembro

SEDE QUE NECESITA ATENCIÓN: Santa Elena ⚠️
  Churn 3.1% (el más alto) + NPS 67 (el más bajo)
  Acción sugerida: revisar calidad de trainers y satisfacción de clientes
  [Ver análisis detallado de Santa Elena]

TENDENCIA DE CRECIMIENTO:
  Zona Rosa:     +6.2%/mes ↑ (mejor tendencia)
  San Benito:    +4.8%/mes ↑
  Santa Elena:   +3.1%/mes ↑ (necesita impulso)

[Ver sede individual ▼]  [Exportar reporte consolidado]
```

---

## 13. SISTEMA DE REPORTES & EXPORTACIÓN

### 13.1 Catálogo Completo de Reportes

```yaml
REPORTES FINANCIEROS:
  RPT-FIN-001: Estado de Resultados del Período
    contenido: ingresos por categoría, costos operativos, utilidad estimada
    filtros: período, sede
    formatos: PDF (con membrete del gym), Excel

  RPT-FIN-002: Cartera de Membresías Activas
    contenido: listado miembros con plan, monto, fecha vencimiento, método de pago
    uso: control de vencimientos, proactividad en renovaciones
    filtros: por plan, vencimiento en próximos X días
    formatos: Excel, CSV

  RPT-FIN-003: Cobros Fallidos y Estado de Recovery
    contenido: transacciones fallidas, estado del proceso de recuperación
    filtros: fecha, estado, monto
    formatos: Excel

  RPT-FIN-004: Cartera de Crédito Marketplace
    contenido: miembros con deuda, monto, antigüedad, estado
    antigüedad: 0-30 / 30-60 / 60+ días
    formatos: Excel (para gestión de cobranza)

  RPT-FIN-005: Forecast de Ingresos
    contenido: proyección 1, 3 y 6 meses con intervalos de confianza
    formatos: PDF ejecutivo

  RPT-FIN-006: Reporte Fiscal / Contable
    contenido: ingresos por categoría, IVA, facturas emitidas
    cumplimiento: formato compatible con MH El Salvador
    formatos: PDF, Excel, XML (para importar a sistema contable)

REPORTES DE MEMBRESÍAS:
  RPT-MEM-001: Cohort Analysis de Retención (12 meses)
  RPT-MEM-002: Miembros en Riesgo (lista priorizada con score y acciones)
  RPT-MEM-003: Movimientos del Período (nuevos, cancelados, upgrades, freezes)
  RPT-MEM-004: Distribución por Plan y Objetivo
  RPT-MEM-005: Win-Back (exmiembros candidatos a reactivar)
  RPT-MEM-006: Miembros que cumplen aniversario el próximo mes

REPORTES OPERACIONALES:
  RPT-OPS-001: Ocupación de Clases por Instructor y Horario
  RPT-OPS-002: Reporte de Accesos y Check-ins
  RPT-OPS-003: Performance de Instructores (rating, asistencia, retención)
  RPT-OPS-004: Tickets de Feedback (quejas, sugerencias, NPS)
  RPT-OPS-005: Reporte de Staff y Payroll

REPORTES DE ENTRENAMIENTO:
  RPT-ENT-001: Adherencia a Planes por Trainer y Miembro
  RPT-ENT-002: Récords Personales del Período
  RPT-ENT-003: Ejercicios más Asignados y Populares
  RPT-ENT-004: Miembros en Meseta (sin progreso en 4+ semanas)
  RPT-ENT-005: Progreso de Métricas Físicas Agregadas

REPORTES DE SATISFACCIÓN:
  RPT-SAT-001: NPS Mensual con Evolución y Comentarios
  RPT-SAT-002: Tickets por Categoría y Tiempo de Resolución
  RPT-SAT-003: Análisis de Sentimiento de Comentarios

REPORTES CORPORATIVOS:
  RPT-COR-001: Reporte de Uso para Empresa (uso del beneficio por empleado)
  RPT-COR-002: Factura Consolidada Corporativa
  RPT-COR-003: ROI del Programa de Bienestar Corporativo
```

### 13.2 Constructor de Reportes Personalizados

```
CONSTRUCTOR DE REPORTES — Panel Admin

El admin puede crear reportes completamente personalizados:

PASO 1: Seleccionar dimensiones (qué analizar)
  Miembro / Trainer / Plan de membresía / Clase / Producto

PASO 2: Seleccionar métricas (qué medir)
  Revenue / Asistencia / Progreso físico / Satisfacción / Actividad

PASO 3: Filtros
  Período / Sede / Segmento / Plan / Objetivo / Nivel de riesgo

PASO 4: Agrupación y ordenamiento
  Por semana / mes / trimestre | Ordenar por valor ↑↓

PASO 5: Visualización
  Tabla / Gráfica de barras / Gráfica de líneas / Mapa de calor

PASO 6: Guardar y programar
  Nombre del reporte → guardar para uso futuro
  Programar envío automático (diario/semanal/mensual) por email

EJEMPLO DE REPORTE PERSONALIZADO:
  "Revenue por trainer agrupado por mes, últimos 6 meses,
   ordenado de mayor a menor, exportado en Excel cada lunes"
```

---

## 14. REPORTES AUTOMÁTICOS PROGRAMADOS

### 14.1 Reportes Automáticos por Defecto

```yaml
DIARIOS (enviados a las 7:00am):
  Destinatario: Admin / Dueño
  Contenido:
    - Resumen del día anterior: revenue, check-ins, nuevos miembros, alertas resueltas
    - Agenda del día: clases, evaluaciones físicas, citas especiales
    - Top 5 alertas activas que requieren acción
    - 3 miembros con Risk Score más alto del día
  Formato: Email HTML + PDF adjunto + Push notification resumen

SEMANALES (enviados los lunes a las 8:00am):
  Destinatario: Admin / Dueño
  Contenido:
    - MRR de la semana vs semana anterior
    - Nuevos vs. cancelados neto
    - Ocupación promedio de clases
    - Top 3 alegrías y top 3 áreas de mejora de la semana
    - Preview de la semana que inicia (clases, vencimientos, cumpleaños)
  Formato: Email ejecutivo + Dashboard actualizado

MENSUALES (enviados el día 2 de cada mes):
  Destinatario: Dueño
  Contenido: Reporte ejecutivo completo (PDF de 5-8 páginas) con:
    - Resumen financiero: P&L estimado, MRR, cohorts
    - Retención: cohort analysis actualizado, miembros recuperados
    - Operacional: ocupación, satisfacción, NPS
    - Top 5 insights del Business Coach IA
    - Recomendaciones para el siguiente mes
  Formato: PDF profesional con membrete + Email ejecutivo

ALERTAS EN TIEMPO REAL (inmediatas):
  Risk Score de miembro llega a 80+ → Push + Email al admin
  Pago fallido > $200 → Push al admin
  Incidente de seguridad o lesión reportada → Push + Email URGENTE
  Clase con instructor sin confirmar (2h antes) → Push a recepción
```

---

## 15. DASHBOARD DEL TRAINER

### 15.1 Vista del Trainer (Panel simplificado)

```
PANEL TRAINER — Carlos Gutiérrez
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MI RENDIMIENTO — Junio 2026:
  Revenue generado:       $3,780   (4to mejor mes del año ↑)
  Clientes activos:           18   (+2 vs mes pasado)
  Retención de clientes:     92%   (meta: >85% ✅)
  PRs generados:              47   (2.4 por cliente ⭐)
  Rating promedio:           4.9   (meta: >4.5 ✅)

MI AGENDA HOY:
  09:00 María García — PT Fuerza [Confirmada ✅]
  11:00 Pedro Ramírez — PT Masa  [Confirmada ✅]
  14:00 [DISPONIBLE]
  16:00 Ana Torres — Evaluación  [Pendiente confirmación ⏳]
  18:00 Clase Funcional (12/15 reservas)

MIS CLIENTES EN RIESGO:
  🔴 Ana Torres — 7 días sin venir (plan desactualizado)
     [Actualizar plan] [Enviar mensaje]

TAREAS PENDIENTES:
  📝 Actualizar notas: sesión de Pedro del viernes
  📊 Revisión plan: Luis Moreno vence en 3 días
  📅 Evaluar progreso: Carmen Ruiz lleva 4 semanas
```

---

## 16. DASHBOARD DE RECEPCIÓN

### 16.1 Vista de Recepción (Tiempo Real)

```
RECEPCIÓN — GYM ÉLITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Vista optimizada para tablet en mostrador]

AHORA: Sábado 13 junio 2026 — 12:47pm
AFORO: 47/120 personas 🟢  CLASES: 2 activas ahora

━━━ PRÓXIMAS 2 HORAS ━━━━━━━━━━━━━━━━━━━━━━━━━━━

14:00 Clase Zumba — Sala Principal
      Carmen López (instructora) ✅ confirmada
      Reservas: 11/15  [3 walk-ins posibles]
      [Ver lista de inscritos]

14:30 Sesión PT — Carlos G. con Pedro Ramírez
      [Confirmada] — Sala de Pesas B

━━━ PEDIDOS LISTOS PARA RETIRAR ━━━━━━━━━━━━━━━━

📦 #ORD-2891 — María García — Whey + Quest Bars
   [Pago: Tarjeta ✅]  [Entregar →]

━━━ ALERTAS DE RECEPCIÓN ━━━━━━━━━━━━━━━━━━━━━━

⚠️ Luis Moreno intentó acceder a las 10:15am
   Membresía vencida desde 10 junio
   [Activar acceso temporal] [Cobrar renovación]

━━━ ÚLTIMOS CHECK-INS ━━━━━━━━━━━━━━━━━━━━━━━━━

12:47  María García         Membresía Elite ✅
12:43  Pedro Ramírez        Membresía Plus  ✅
12:38  Visitante sin ID     [Registrar] [Denegar]
[Ver todos]  [Registrar check-in manual]
```

---

## 17. MODELO DE DATOS & ARQUITECTURA ANALYTICS

### 17.1 Estrategia de Datos para Analytics

```yaml
Arquitectura de datos para el BI:

  DATOS TRANSACCIONALES (PostgreSQL — fuente de verdad):
    Todos los módulos escriben aquí en tiempo real
    Usado para: operación del día a día, reportes en tiempo real

  SNAPSHOTS DIARIOS (PostgreSQL — tabla metric_snapshots):
    Job programado cada noche a las 2:00 AM
    Calcula y guarda: MRR, miembros activos, churn, NPS, ocupación, etc.
    Propósito: evitar queries costosas para datos históricos de KPIs
    Retención: 3 años de historial

  VISTAS MATERIALIZADAS (PostgreSQL — actualizadas cada hora):
    Para dashboards que necesitan datos frescos pero no en tiempo real
    Ejemplos: ocupación de clases, distribución de membresías, cartera de crédito
    Actualizadas con: REFRESH MATERIALIZED VIEW CONCURRENTLY

  CACHÉ EN REDIS (actualizado en tiempo real):
    Para: check-ins activos, aforo, alertas activas, risk scores
    TTL: 30 segundos (para balance entre frescura y performance)
    Invalidación: automática al producirse eventos relevantes
```

### 17.2 Tablas de Analytics

```sql
-- ─────────────────────────────────────────────────────────────
-- SNAPSHOTS DIARIOS DE KPIs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE metric_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  snapshot_date         DATE NOT NULL,
  -- Membresías
  total_active_members  INTEGER,
  new_members_day       INTEGER,
  cancelled_members_day INTEGER,
  frozen_members        INTEGER,
  trial_members         INTEGER,
  -- Financiero
  mrr                   DECIMAL(12,2),
  new_mrr_day           DECIMAL(12,2),
  churned_mrr_day       DECIMAL(12,2),
  expansion_mrr_day     DECIMAL(12,2),
  daily_revenue         DECIMAL(12,2),
  -- Operacional
  checkins_day          INTEGER,
  classes_held_day      INTEGER,
  avg_class_occupancy   DECIMAL(5,2),
  -- Retención
  churn_rate_30d        DECIMAL(5,4),
  avg_risk_score        DECIMAL(5,2),
  members_at_risk       INTEGER,
  -- Entrenamiento
  sessions_completed    INTEGER,
  prs_achieved          INTEGER,
  -- Satisfacción
  nps_score_30d         DECIMAL(5,2),
  open_tickets          INTEGER,
  -- Marketplace
  marketplace_revenue   DECIMAL(12,2),
  marketplace_orders    INTEGER,
  credit_portfolio      DECIMAL(12,2),
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (gym_id, snapshot_date)
);

-- ─────────────────────────────────────────────────────────────
-- VISTA MATERIALIZADA — DASHBOARD KPIs
-- ─────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW dashboard_kpis AS
SELECT
  gym_id,
  -- MRR actual
  (SELECT SUM(current_total) FROM memberships
   WHERE gym_id = m.gym_id AND status = 'active') AS current_mrr,
  -- Miembros activos
  (SELECT COUNT(*) FROM memberships
   WHERE gym_id = m.gym_id AND status = 'active') AS active_members,
  -- Miembros en riesgo
  (SELECT COUNT(*) FROM members
   WHERE gym_id = m.gym_id AND risk_score > 60) AS members_at_risk,
  -- Revenue hoy
  (SELECT COALESCE(SUM(amount), 0) FROM transactions
   WHERE gym_id = m.gym_id
   AND DATE(created_at) = CURRENT_DATE
   AND status = 'succeeded') AS revenue_today,
  -- NPS 30 días
  (SELECT
     (COUNT(CASE WHEN rating >= 9 THEN 1 END)::float -
      COUNT(CASE WHEN rating <= 6 THEN 1 END)::float) /
     NULLIF(COUNT(*), 0) * 100
   FROM survey_responses sr
   WHERE sr.gym_id = m.gym_id
   AND sr.survey_type = 'nps'
   AND sr.created_at >= NOW() - INTERVAL '30 days'
  ) AS nps_score_30d,
  NOW() AS last_refreshed
FROM gyms m
WITH DATA;

-- Índice para refresh eficiente
CREATE UNIQUE INDEX ON dashboard_kpis(gym_id);

-- ─────────────────────────────────────────────────────────────
-- SISTEMA DE ALERTAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE alert_rules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  rule_name             VARCHAR(100) NOT NULL,
  category              VARCHAR(30) NOT NULL,
  metric                VARCHAR(100) NOT NULL,
  operator              VARCHAR(10) NOT NULL, -- gt|lt|gte|lte|eq|ne
  threshold_value       DECIMAL(12,2) NOT NULL,
  severity              VARCHAR(20) DEFAULT 'medium',
  notify_roles          TEXT[],              -- ['admin', 'owner', 'trainer']
  notify_channels       TEXT[],              -- ['push', 'email', 'sms']
  is_active             BOOLEAN DEFAULT TRUE,
  cooldown_minutes      INTEGER DEFAULT 60,
  last_triggered_at     TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alert_instances (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  rule_id               UUID REFERENCES alert_rules(id),
  member_id             UUID REFERENCES members(id),
  category              VARCHAR(30) NOT NULL,
  severity              VARCHAR(20) NOT NULL,
  title                 VARCHAR(200) NOT NULL,
  message               TEXT NOT NULL,
  context_data          JSONB,
  status                VARCHAR(20) DEFAULT 'active',
  resolved_at           TIMESTAMP,
  resolved_by           UUID REFERENCES staff(id),
  resolution_notes      TEXT,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- REPORTES GUARDADOS Y PROGRAMADOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE saved_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  name                  VARCHAR(200) NOT NULL,
  report_type           VARCHAR(50) NOT NULL,
  config                JSONB NOT NULL,       -- filtros, métricas, agrupaciones
  is_scheduled          BOOLEAN DEFAULT FALSE,
  schedule_frequency    VARCHAR(20),          -- daily|weekly|monthly
  schedule_day          INTEGER,
  schedule_time         TIME,
  recipient_emails      TEXT[],
  last_run_at           TIMESTAMP,
  created_by            UUID REFERENCES staff(id),
  created_at            TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CHECKLIST DE CONFIGURACIÓN

```
DASHBOARD EJECUTIVO:
□ KPIs por defecto configurados y probados con datos reales
□ Umbrales de alertas configurados por categoría
□ Emails de alerta configurados para el dueño y admin
□ Destinatarios de reportes automáticos definidos
□ Zona horaria del gym configurada correctamente

REPORTES:
□ Logo del gym cargado para los reportes PDF
□ Datos fiscales del gym en el pie de página
□ Plantillas de email personalizadas con colores del gym
□ Al menos 3 reportes automáticos programados activos
□ Constructor de reportes probado con un reporte personalizado

BUSINESS COACH IA:
□ Acceso habilitado para el dueño (requiere plan Pro o Elite del SaaS)
□ Contexto del gym cargado (tipo de negocio, ciudad, capacidad)
□ Historial de datos suficiente (mínimo 30 días) para respuestas útiles

MULTI-SEDE (si aplica):
□ Todas las sedes registradas y vinculadas
□ Vista consolidada de cadena probada
□ Métricas comparativas calibradas

ALERTAS:
□ Al menos 8 reglas de alerta activas (mínimo recomendado)
□ Push notifications al teléfono del dueño probadas
□ Plan de respuesta para alertas críticas documentado
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulo: GYM-MOD-ANALYTICS_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión: Septiembre 2026_
