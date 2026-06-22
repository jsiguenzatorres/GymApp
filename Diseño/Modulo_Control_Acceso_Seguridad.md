# 🔐 MÓDULO CONTROL DE ACCESO & SEGURIDAD FÍSICA (MOD-ACCESS)

## Sistema de Acceso Inteligente 24/7 — App Integral de Gimnasio de Élite

### Documento de Diseño Detallado — Versión 1.0 · Junio 2026

---

> **Código del Módulo:** `GYM-MOD-ACCESS`  
> **Prioridad:** MVP Fase 1 (QR propio) → Fase 2 (IoT + biometría)  
> **Módulos relacionados:** Membresías (MOD-MEM), CRM/ARIA (MOD-CRM), Analytics (MOD-ANALYTICS), Billing (MOD-BIL)  
> **Principio rector:** _"El miembro entra con su teléfono. El gym opera 24/7 sin recepcionista permanente."_

---

## 📋 TABLA DE CONTENIDO

1. [Visión General & Propósito](#1-visión-general--propósito)
2. [Arquitectura del Sistema de Acceso](#2-arquitectura-del-sistema-de-acceso)
3. [Canal 1 — QR Dinámico Propio (MVP)](#3-canal-1--qr-dinámico-propio-mvp)
4. [Canal 2 — Tarjeta NFC / RFID](#4-canal-2--tarjeta-nfc--rfid)
5. [Canal 3 — Reconocimiento Facial (Biometría)](#5-canal-3--reconocimiento-facial-biometría)
6. [Canal 4 — PIN Numérico](#6-canal-4--pin-numérico)
7. [Canal 5 — Bluetooth BLE (Manos Libres)](#7-canal-5--bluetooth-ble-manos-libres)
8. [Integración con Hardware (Torniquetes y Puertas)](#8-integración-con-hardware-torniquetes-y-puertas)
9. [Motor de Validación de Acceso](#9-motor-de-validación-de-acceso)
10. [Control de Aforo en Tiempo Real](#10-control-de-aforo-en-tiempo-real)
11. [Acceso por Áreas y Zonas](#11-acceso-por-áreas-y-zonas)
12. [Operación 24/7 sin Recepcionista](#12-operación-247-sin-recepcionista)
13. [Modo Visitante & Acceso de Cortesía](#13-modo-visitante--acceso-de-cortesía)
14. [Seguridad & Prevención de Fraude](#14-seguridad--prevención-de-fraude)
15. [Cámaras & Vigilancia Integrada](#15-cámaras--vigilancia-integrada)
16. [Logs de Acceso & Analytics](#16-logs-de-acceso--analytics)
17. [Alertas & Notificaciones de Acceso](#17-alertas--notificaciones-de-acceso)
18. [Integración con Módulos del Sistema](#18-integración-con-módulos-del-sistema)
19. [Panel de Gestión de Acceso (Admin)](#19-panel-de-gestión-de-acceso-admin)
20. [Modelo de Datos Completo](#20-modelo-de-datos-completo)

---

## 1. VISIÓN GENERAL & PROPÓSITO

### 1.1 Propósito

El **Módulo de Control de Acceso** es la puerta de entrada física al gimnasio convertida en un sistema inteligente. Garantiza que solo los miembros con membresía activa y vigente ingresen, registra cada movimiento de entrada y salida, controla el aforo en tiempo real y permite al gym operar 24 horas sin depender de un recepcionista permanente.

Es también el punto de datos más confiable del sistema: cada check-in es un dato de comportamiento que alimenta el Risk Score de retención, el análisis de ocupación, los KPIs del dashboard y los workflows de ARIA.

### 1.2 Capacidades Centrales

```yaml
Lo que el módulo garantiza:

  ✅ Acceso solo a miembros con membresía activa y al día
  ✅ Registro automático de entrada y salida sin intervención humana
  ✅ Múltiples métodos: QR, NFC, facial, PIN, Bluetooth
  ✅ Control de aforo máximo en tiempo real
  ✅ Acceso por zonas según nivel de membresía
  ✅ Operación 24/7 con alertas automáticas al staff
  ✅ Integración con torniquetes, puertas y molinetes
  ✅ Logs completos e inmutables de todos los eventos
  ✅ Alertas instantáneas de acceso denegado o intrusión
  ✅ Datos de acceso alimentando CRM, analytics y retención
```

### 1.3 Casos de Uso Cubiertos

| Escenario                                    | Cómo lo maneja el sistema                                     |
| -------------------------------------------- | ------------------------------------------------------------- |
| Miembro llega al gym con su teléfono         | Escanea QR en la app → torniquete abre en < 1 segundo         |
| Miembro olvidó el teléfono                   | Usa PIN de 6 dígitos en el panel de la entrada                |
| Miembro con membresía vencida intenta entrar | Acceso denegado + notificación a ARIA para contactarlo        |
| Gym opera a las 3am sin staff                | Sistema funciona autónomo + alertas automáticas por anomalías |
| Miembro quiere entrar con un acompañante     | Sistema gestiona "pase de invitado" según el plan             |
| Área de spa/sauna es solo para plan Elite    | Sistema verifica nivel de membresía antes de abrir la puerta  |
| Aforo máximo alcanzado                       | Sistema bloquea nuevas entradas + notifica a recepción        |
| Alguien intenta entrar sin ser miembro       | Cámara + alerta + denegación automática                       |

---

## 2. ARQUITECTURA DEL SISTEMA DE ACCESO

### 2.1 Diagrama de Arquitectura

```
CAPAS DEL SISTEMA DE CONTROL DE ACCESO

┌─────────────────────────────────────────────────────────────────────┐
│                    INTERFACES DE IDENTIFICACIÓN                     │
│                                                                     │
│  📱 QR Dinámico    💳 NFC/RFID    👤 Facial    🔢 PIN    📡 BLE    │
│  (App propia)      (Tarjeta)      (Cámara AI)  (Teclado) (Teléfono)│
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    CONTROLADOR LOCAL (Edge Device)                  │
│                                                                     │
│  Raspberry Pi 4 / Industrial IoT Controller                        │
│  • Funciona OFFLINE (decisiones locales sin internet)              │
│  • Sincroniza con la nube cada 30 segundos                         │
│  • Cache local de membresías válidas (actualizado en tiempo real)  │
│  • Gestiona el hardware: torniquete, cerradura, LED, buzzer        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ WebSocket / MQTT
┌──────────────────────────────▼──────────────────────────────────────┐
│                    BACKEND — MOD-ACCESS                             │
│                                                                     │
│  AccessValidationService   →  Verifica membresía en tiempo real    │
│  AforiManager              →  Controla aforo máximo                │
│  ZoneAccessService         →  Valida acceso por área               │
│  AccessLogService          →  Registra cada evento                 │
│  AlertService              →  Dispara alertas de seguridad         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    BASE DE DATOS & CACHE                            │
│                                                                     │
│  PostgreSQL: access_logs, access_devices, member_credentials        │
│  Redis: aforo_actual (tiempo real), membresías_cache (30 seg TTL)  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 El Controlador Local (Edge Computing)

```yaml
Por qué necesitamos un controlador local:

  PROBLEMA: Si el acceso depende 100% de internet:
    - Si cae la conexión → el gym queda bloqueado (nadie entra ni sale)
    - Latencia de 200-500ms → experiencia de usuario mala
    - Punto único de falla crítico

  SOLUCIÓN: Edge Controller con decisiones locales:
    - El controlador local tiene una copia caché de las membresías activas
    - Toma decisiones de acceso en < 100ms sin internet
    - Sincroniza con la nube cuando hay conexión
    - Si la nube no responde: usa la última información válida (máx. 2h)
    - Después de 2h sin conexión: requiere validación online (seguridad)

Hardware recomendado:
  MVP (básico):
    Raspberry Pi 4 (4GB RAM) + Ubuntu Server
    Costo: ~$80-120 por punto de acceso
    Capacidad: suficiente para 1 punto de acceso

  Producción (robusto):
    Industrial IoT Controller (Advantech, Siemens, etc.)
    Costo: ~$200-400 por controlador
    Capacidad: gestiona múltiples puntos de acceso
    Ventaja: certificado para uso industrial, más confiable

  Hosted (si se usa Kisi/Salto en Fase 2):
    El hardware lo provee Kisi/Salto
    El gimnasio paga mensualidad por el servicio de acceso
    Integración vía API de Kisi/Salto
```

---

## 3. CANAL 1 — QR DINÁMICO PROPIO (MVP)

### 3.1 Cómo Funciona el QR Dinámico

```
FLUJO COMPLETO — ACCESO CON QR:

PASO 1: GENERACIÓN DEL QR
  El QR del miembro NO es estático (número fijo de membresía)
  Es dinámico: se genera nuevo cada 60 segundos

  Contenido del QR:
    {
      memberId: "uuid-del-miembro",
      gymId: "uuid-del-gym",
      timestamp: 1718270400,          // Unix timestamp de generación
      expiresAt: 1718270460,          // válido por 60 segundos
      signature: "HMAC-SHA256",       // firma criptográfica del backend
      nonce: "abc123xyz"              // para evitar replay attacks
    }

  Por qué dinámico:
    - Un QR estático puede ser fotografiado y reutilizado por otro
    - El QR dinámico caduca en 60 segundos → inutilizable si se copia
    - La firma criptográfica garantiza que no puede falsificarse

PASO 2: PRESENTACIÓN EN LA APP
  El miembro abre la app → Home → "Mi código QR"
  O desde el widget en la pantalla de bloqueo (iOS/Android)

  La pantalla muestra:
  ┌──────────────────────────────────────────────────┐
  │  [FOTO DEL MIEMBRO]   María García               │
  │                        Membresía Elite ✅         │
  │                                                  │
  │  ████████████████████████████████████████        │
  │  ████████████████████████████████████████        │
  │  ████  ████████████████████  ████████████        │
  │  ████  ████████████████████  ████████████        │
  │  ████  ██  ████  ████  ████  ████████████        │
  │  ████████████████████████████████████████        │
  │  ████████████████████████████████████████        │
  │                                                  │
  │  ⏱️ Expira en: 0:42                              │
  │  🔄 [Generar nuevo código]                       │
  │                                                  │
  │  💡 Brillo automático al máximo para escaneo     │
  └──────────────────────────────────────────────────┘

  Comportamiento de la app al abrir el QR:
    - Brillo de pantalla → 100% automáticamente
    - Modo "no molestar" activado
    - Countdown visual de los segundos restantes
    - Al llegar a 0: regenera automáticamente sin tocar

PASO 3: LECTURA DEL QR
  Scanner en el torniquete o lector de la entrada
  Hardware: Lector QR 2D Honeywell / Zebra / similar
  Tiempo de lectura: < 0.3 segundos
  Funciona con: pantalla sucia, ángulos, brillo alto/bajo

PASO 4: VALIDACIÓN EN EL CONTROLADOR LOCAL
  El controlador verifica en < 100ms:
  1. ¿La firma HMAC es válida? (no fue falsificado)
  2. ¿El timestamp no expiró? (< 60 segundos)
  3. ¿El nonce no fue usado antes? (no es replay de un código anterior)
  4. ¿El memberId está en el cache local como activo?
  5. ¿La membresía tiene acceso a esta zona?
  6. ¿El aforo actual no superó el máximo?

PASO 5: RESULTADO
  ACCESO CONCEDIDO (todo válido):
    → LED verde en el lector
    → Torniquete se desbloquea por 3 segundos
    → Sonido de bip de bienvenida
    → App recibe notificación: "✅ ¡Bienvenida, María! GYM ÉLITE 12:47pm"
    → Registro en log de acceso
    → Check-in automático en el sistema

  ACCESO DENEGADO (cualquier validación falla):
    → LED rojo en el lector
    → Torniquete permanece bloqueado
    → Sonido de buzzer diferente al de acceso
    → Pantalla en el lector: motivo del rechazo
    → Alerta al sistema (según el motivo)
```

### 3.2 Widget de Acceso Rápido (Sin Abrir la App)

```yaml
Widget en pantalla de bloqueo (iOS y Android):
  El miembro puede mostrar su QR directamente desde la pantalla de bloqueo
  Sin necesidad de desbloquear el teléfono ni abrir la app

  iOS:    Widget con Live Activity (siempre visible en la isla dinámica)
  Android: Widget en pantalla de bloqueo

  Comportamiento:
    Al acercar el teléfono al lector: el widget detecta el NFC del lector
    y activa el brillo máximo automáticamente

  Seguridad:
    El widget muestra el QR pero este expira igual en 60 segundos
    Sin membresía activa: el widget muestra "Membresía vencida" no el QR
```

---

## 4. CANAL 2 — TARJETA NFC / RFID

### 4.1 Tarjeta Física del Gym

```yaml
Tarjeta NFC/RFID:
  tipo: MIFARE DESFire EV3 (alta seguridad — no clonable)
  tecnología: NFC ISO/IEC 14443-A + RFID 13.56 MHz

  datos almacenados en la tarjeta:
    - member_id (UUID del miembro)
    - gym_id
    - card_serial_number (único, vinculado al miembro en el sistema)
    - issue_date + expiry_date de la tarjeta (no de la membresía)
    - sector_key (clave de acceso encriptada — única por tarjeta)

  datos NO almacenados en la tarjeta:
    - Estado de la membresía (se verifica siempre en el servidor)
    - Datos personales del miembro
    - Información financiera

  por qué DESFire y no Mifare Classic:
    Mifare Classic fue hackeado en 2008 — cualquier teléfono puede clonarlo
    DESFire EV3 usa AES-128 — imposible clonar con hardware consumer

  diseño físico:
    Tamaño: ISO/IEC 7810 ID-1 (mismo que tarjeta de crédito)
    Materiales: PVC estándar o PET biodegradable
    Impresión: Logo del gym, nombre del miembro, número de membresía visible
    Opción: con foto del miembro impresa
    Costo por tarjeta: $1.50 - $3.00 dependiendo del volumen

Proceso de emisión:
  1. Admin registra nueva tarjeta: escanea el serial en el panel
  2. Sistema vincula el serial al miembro en la base de datos
  3. Tarjeta activa en segundos — no requiere programación especial
  4. Si se pierde: admin la desactiva en 1 clic → nueva tarjeta emitida

Múltiples tarjetas:
  Un miembro puede tener hasta 3 tarjetas activas (ej: gym bag + casa + trabajo)
  Cada una queda registrada en los logs de acceso con su serial único
```

### 4.2 NFC desde el Teléfono

```yaml
NFC via teléfono (alternativa a la tarjeta física):
  El miembro puede usar su teléfono como tarjeta NFC
  Sin necesidad de abrir la app — solo acercar el teléfono al lector

  iOS:    Background NFC Tag Reading (automático si hay un reader)
          Requiere configuración una vez en la app
  Android: NFC siempre disponible (Android 4.4+)
          Host-based Card Emulation (HCE)

  Seguridad:
    El chip NFC emula una tarjeta con los mismos estándares DESFire
    Los datos se actualizan cada 24 horas automáticamente desde el servidor
    Si el teléfono es robado: desactivar remotamente desde la app o panel admin
```

---

## 5. CANAL 3 — RECONOCIMIENTO FACIAL (BIOMETRÍA)

### 5.1 Arquitectura del Sistema Facial

```yaml
Tecnología:
  Cámara: IP Camera 2MP+ con visión nocturna (lux mínimo < 0.5)
  Motor de IA: Face Recognition API (DeepFace / InsightFace / Azure Face)
  Procesamiento: Edge computing local (privacidad — no sube fotos a la nube)
  Precisión: > 99.5% de reconocimiento correcto con buena iluminación
  Anti-spoofing: Detección de vida (liveness detection) — rechaza fotos y videos

Funcionamiento:
  1. El miembro se registra: toma 5 fotos en diferentes ángulos desde la app
  2. El modelo entrena un embedding facial único (vector de 512 dimensiones)
  3. El embedding se almacena localmente en el controlador (no la foto)
  4. Al llegar al gym: la cámara detecta la cara en tiempo real
  5. Compara el embedding de la cara detectada con la base de embeddings
  6. Si coincide (distancia coseno < umbral): acceso concedido
  7. Si no coincide: acceso denegado + captura de imagen para revisión

Tiempo de reconocimiento: < 1.5 segundos desde que el miembro se para frente a la cámara

Privacidad y consentimiento:
  El reconocimiento facial es SIEMPRE opt-in (nunca obligatorio)
  El miembro debe:
    ✅ Dar consentimiento explícito escrito (en el contrato de membresía)
    ✅ Registrar su cara voluntariamente en la app
    ✅ Poder revocarlo en cualquier momento (elimina el embedding)

  Los datos biométricos:
    - Se procesan localmente (no se envían a la nube)
    - Los embeddings (no las fotos) se almacenan encriptados
    - Se eliminan automáticamente al cancelar la membresía
    - Cumplimiento: GDPR Artículo 9 (datos biométricos = categoría especial)

Casos especiales:
  Gemelos idénticos: el sistema puede confundirlos
    → En estos casos, configurar un PIN adicional obligatorio

  Cambios físicos drásticos (barba, cirugía, etc.):
    → El sistema detecta baja confianza → pide QR o PIN como respaldo
    → El miembro puede actualizar sus fotos desde la app cuando quiera

  Condiciones de iluminación difíciles:
    → La cámara tiene IR para visión nocturna
    → Si la confianza < umbral mínimo: solicita método alternativo
```

### 5.2 Experiencia del Miembro con Reconocimiento Facial

```
FLUJO DE REGISTRO FACIAL (una sola vez):

En la app → Perfil → Acceso al Gym → Activar reconocimiento facial

PASO 1: Información y consentimiento
  "El reconocimiento facial te permite entrar al gym sin sacar
   el teléfono. Tus datos biométricos se procesan localmente
   en nuestro sistema y nunca se comparten con terceros.
   Puedes desactivarlo en cualquier momento."
  [✅ Acepto y quiero registrar mi cara]  [No, gracias]

PASO 2: Captura guiada de fotos
  La app activa la cámara frontal
  Guía al miembro:
  "Mira directamente a la cámara" → Captura #1 (frente)
  "Gira ligeramente a la derecha" → Captura #2
  "Gira ligeramente a la izquierda" → Captura #3
  "Sube un poco la barbilla" → Captura #4
  "Baja un poco la barbilla" → Captura #5

  Detección automática de calidad:
  ✅ Buena iluminación
  ✅ Cara completa visible
  ✅ Sin objetos que tapen el rostro
  ❌ "Muy oscuro — busca mejor luz" (error)

PASO 3: Confirmación
  "¡Registro exitoso! 🎉
   La próxima vez que vengas al gym, solo párate frente
   a la cámara de la entrada. Sin teléfono, sin tarjeta."

FLUJO DE ACCESO CON FACIAL (cada visita):
  → Miembro se acerca a la entrada
  → Cámara detecta cara en el área de detección (radio 1.5m)
  → Análisis en 1.2 segundos
  → Pantalla de la cámara: "✅ María García - Bienvenida!"
  → Torniquete abre
  → App recibe notificación silenciosa de check-in
```

---

## 6. CANAL 4 — PIN NUMÉRICO

### 6.1 Sistema de PIN

```yaml
PIN de acceso:
  longitud: 6 dígitos (configurable: 4-8)
  asignación: el miembro lo elige desde la app en "Mi Perfil > Acceso"
  cambio: puede cambiarlo cuando quiera desde la app
  uso: respaldo cuando no tiene teléfono o tarjeta

Hardware en la entrada:
  Teclado numérico retroiluminado (resistente a agua y polvo)
  Display: 2-3 líneas para mostrar mensajes de estado
  El miembro ingresa: PIN de 6 dígitos + tecla ENTER

Seguridad del PIN:
  Almacenado: hash bcrypt (nunca en texto plano)
  Intentos fallidos: máximo 5 intentos → bloqueo 15 minutos
  Bloqueo: notificación push al miembro + alerta al admin
  Anti-shoulder surfing: el display oculta los dígitos con *

  Por qué 6 dígitos y no 4:
    4 dígitos: 10,000 combinaciones (fácil de adivinar)
    6 dígitos: 1,000,000 combinaciones
    Con bloqueo a los 5 intentos: prácticamente imposible de forzar

PIN temporal para visitantes:
  El admin puede generar PINs de un solo uso o con fecha de expiración
  Para visitantes, evaluadores, personal de mantenimiento, etc.
  El PIN temporal queda registrado con el nombre del visitante
```

---

## 7. CANAL 5 — BLUETOOTH BLE (MANOS LIBRES)

### 7.1 Acceso Bluetooth Manos Libres

```yaml
Concepto:
  El miembro lleva el teléfono en la bolsa o bolsillo
  Al acercarse a la entrada (radio ~3-5 metros), el sistema lo detecta
  El torniquete se abre automáticamente — sin sacar el teléfono
  Experiencia: como si el gym "reconociera" al miembro mágicamente

Tecnología:
  BLE (Bluetooth Low Energy) — bajo consumo de batería
  El teléfono emite un beacon BLE con el ID encriptado del miembro
  El lector BLE en la puerta detecta el beacon y lo valida

Requisitos del teléfono:
  iOS: Bluetooth activado + permisos de ubicación "Siempre"
  Android: Bluetooth + "Ubicación precisa siempre permitida" para la app
  La app debe tener permiso de background BLE scanning

Consideraciones de seguridad:
  El beacon BLE rota su clave cada 15 minutos (para evitar tracking)
  Solo válido cuando el miembro está físicamente presente
  Anti-relay attack: el sistema verifica que la señal sea fuerte (RSSI > -65 dBm)
  Si la señal es débil (posible relay): requiere confirmación adicional (tocar botón)

Configuración por el miembro:
  En la app: Acceso > Activar acceso Bluetooth
  El miembro puede elegir:
    ○ Automático (manos libres — sin confirmación)
    ○ Semi-automático (notificación en el teléfono para confirmar)
    ○ Desactivado

Limitaciones conocidas:
  - En horas de mucho tráfico: si varios miembros llegan juntos,
    puede haber interferencia de señales (mitigado con RSSI preciso)
  - Si la batería del teléfono está al 5%: BLE puede desconectarse
    → Fallback automático: el miembro usa el PIN
  - No funciona si el Bluetooth está desactivado
    → Fallback automático: QR o PIN
```

---

## 8. INTEGRACIÓN CON HARDWARE (TORNIQUETES Y PUERTAS)

### 8.1 Tipos de Hardware Soportados

```yaml
FASE 1 — Hardware básico (sin integración IoT):

  Torniquete de trípode básico (manual):
    Costo: $200-500
    Integración: relé eléctrico simple (señal de 12V del controlador = abrir)
    Control: el controlador envía pulso eléctrico cuando valida el acceso
    Ventaja: muy económico, funciona con cualquier controlador
    Desventaja: sin feedback de estado, sin bidireccional

  Cerradura electromagnética en puerta:
    Costo: $80-200 por puerta
    Integración: igual que el torniquete (relé de 12V)
    Uso: para puertas de áreas especiales (spa, sala VIP, área de pesas)
    Requiere: UPS para que funcione en corte de luz

FASE 2 — Hardware con API (integración inteligente):

  Kisi Access Controller:
    Costo hardware: $300-600 por controlador
    Mensualidad: $5-10 por puerta
    API: REST + Webhooks bidireccionales
    Ventajas:
      - Dashboard propio de Kisi (complementario al nuestro)
      - App de Kisi como backup
      - Soporte para BLE, NFC, QR (propio de Kisi)
      - Alertas en tiempo real
      - Funciona offline con su propio cache
    Integración: Kisi API → nuestro backend recibe webhooks de cada evento

  Salto KS:
    Costo hardware: $200-800 por punto
    API: Salto Space o SHIP API
    Ventajas:
      - Muy popular en Europa y LATAM
      - Integración con muchos sistemas de gym
      - Cerraduras para lockers también
    Desventaja: setup más complejo

  Brivo:
    Ideal para: cadenas de gym con múltiples sedes
    API: Brivo Access Control API
    Ventaja: gestión centralizada multi-sitio

  Paxton Net2:
    Popular en El Salvador y Centroamérica
    API: Paxton Net2 SDK
    Costo moderado, buen soporte regional

FASE 3 — Hardware enterprise:
  HID Global / Lenel / Honeywell:
    Para gyms de muy alto nivel o corporativos
    APIs enterprise con soporte 24/7
    Integración con cámaras de seguridad, alarmas y control de edificio
```

### 8.2 Protocolo de Comunicación con el Hardware

```typescript
// Protocolo MQTT para comunicación con el controlador local

// Estructura de mensajes del controlador al backend
interface ControllerMessage {
  controllerId: string; // ID del controlador físico
  gymId: string;
  doorId: string; // puerta específica
  eventType:
    | 'ACCESS_GRANTED'
    | 'ACCESS_DENIED'
    | 'DOOR_OPEN'
    | 'DOOR_CLOSED'
    | 'DOOR_HELD_OPEN'
    | 'TAMPER_ALERT'
    | 'POWER_FAILURE'
    | 'CONTROLLER_ONLINE'
    | 'CONTROLLER_OFFLINE';
  credentialType: 'QR' | 'NFC' | 'FACIAL' | 'PIN' | 'BLE';
  credentialData: string; // hash del credential (no el dato original)
  memberId?: string; // null si fue denegado por no reconocido
  timestamp: number;
  metadata?: {
    denialReason?: string; // EXPIRED_MEMBERSHIP | AFORO_FULL | WRONG_ZONE | etc.
    confidence?: number; // para facial recognition
    rssi?: number; // para BLE
  };
}

// El backend responde con la validación
interface ValidationResponse {
  allowed: boolean;
  memberId?: string;
  memberName?: string;
  membershipType?: string;
  denialReason?: string;
  openDurationMs: number; // cuánto tiempo dejar abierto (default: 3000ms)
  displayMessage?: string; // mensaje para la pantalla del lector
}

// Topics MQTT
const TOPICS = {
  ACCESS_EVENTS: `gym/{gymId}/controller/{controllerId}/events`,
  DOOR_COMMANDS: `gym/{gymId}/controller/{controllerId}/commands`,
  SYNC_MEMBERS: `gym/{gymId}/controller/{controllerId}/sync`,
  STATUS: `gym/{gymId}/controller/{controllerId}/status`,
};
```

### 8.3 Señalización de la Entrada

```yaml
Señalización visual y sonora:

  En el lector/torniquete:
    LED verde pulsante: esperando credencial
    LED verde sólido: acceso concedido (torniquete abierto 3 seg)
    LED rojo pulsante: acceso denegado
    LED azul: procesando...
    LED amarillo: modo mantenimiento / sin conexión al servidor

  Sonidos:
    Bip corto agudo: acceso concedido
    Bip largo grave: acceso denegado
    Secuencia de 3 bips: error del sistema

  Pantalla en el lector (si tiene display):
    Acceso concedido: "BIENVENIDO/A MARÍA! 😊 12:47"
    Denegado - membresía: "MEMBRESÍA VENCIDA — Habla con recepción"
    Denegado - aforo: "GYM AL MÁXIMO AFORO — Espera un momento"
    Denegado - zona: "ESTA ÁREA ES SOLO PARA PLAN ELITE"
    Error: "SISTEMA TEMPORAL NO DISPONIBLE — Usa el PIN"

  En la pantalla de TV/monitor en recepción (si hay):
    Animación de bienvenida cuando un miembro entra
    Foto del miembro + nombre (por privacidad: solo visible en la recepción)
    Aforo actual en tiempo real
```

---

## 9. MOTOR DE VALIDACIÓN DE ACCESO

### 9.1 Árbol de Decisión de Validación

```
MOTOR DE VALIDACIÓN — Árbol de decisión completo

Al recibir una credencial el controlador ejecuta en < 100ms:

1. ¿La credencial es válida técnicamente?
   QR: ¿La firma HMAC es válida? ¿No expiró? ¿Nonce no usado?
   NFC: ¿El serial de la tarjeta existe y está activo?
   Facial: ¿La confianza supera el umbral mínimo (98%)?
   PIN: ¿El hash coincide? ¿No excedió intentos?
   BLE: ¿La señal supera el RSSI mínimo? ¿El beacon es auténtico?

   NO → DENEGADO: "Credencial inválida"
   ↓
2. ¿El miembro existe en el sistema?
   NO → DENEGADO: "Miembro no registrado"
   ↓
3. ¿La membresía está activa?
   (status = 'active' o 'trial')
   NO (expired) → DENEGADO: "Membresía vencida" + alerta ARIA
   NO (frozen) → DENEGADO: "Membresía congelada" + mensaje info
   NO (suspended) → DENEGADO: "Acceso suspendido" + contactar admin
   NO (cancelled) → DENEGADO: "Membresía cancelada"
   ↓
4. ¿El pago está al día? (dentro del período de gracia)
   NO → DENEGADO: "Pago pendiente" + link de pago en la app
   ↓
5. ¿El aforo actual está por debajo del máximo?
   NO → DENEGADO: "Aforo máximo alcanzado" + estimado de espera
   ↓
6. ¿El miembro tiene acceso a esta zona específica?
   (comparar zona_requerida con nivel_de_membresia)
   NO → DENEGADO: "Esta área requiere plan [X]" + info de upgrade
   ↓
7. ¿No está en lista de restricción de acceso? (conducta)
   SÍ (en lista negra) → DENEGADO + alerta inmediata al admin
   ↓
8. ¿Es horario permitido para su plan?
   (ej: plan básico solo 6am-10pm)
   NO → DENEGADO: "Tu plan no incluye acceso en este horario"
   ↓
✅ ACCESO CONCEDIDO
   → Abrir torniquete/puerta por 3 segundos
   → Registrar check-in en logs
   → Actualizar aforo +1
   → Emitir evento ACCESS_GRANTED para otros módulos
   → Notificación push al miembro (si tiene activadas)
```

### 9.2 Tiempos de Respuesta Objetivo

```yaml
Tiempos de validación por método:

  Decisión local (sin internet):
    QR:     < 50ms   (verificación criptográfica local)
    NFC:    < 50ms   (lookup en cache local)
    Facial: < 1,500ms (procesamiento de imagen local)
    PIN:    < 100ms  (hash comparison local)
    BLE:    < 200ms  (beacon validation local)

  Decisión online (con internet):
    Todas:  < 300ms  (round-trip al servidor + base de datos)

  Fallback offline:
    El controlador mantiene cache de membresías activas por 2 horas
    Si pierde conexión: funciona con el cache (acepta las activas del cache)
    Si el cache tiene > 2 horas de antigüedad: requiere conexión obligatoria

Tiempo total de experiencia (desde presentar credencial hasta abrir):
  QR:      0.3 + 0.1 = 0.4 segundos   ← objetivo
  NFC:     0.1 + 0.1 = 0.2 segundos
  Facial:  1.5 segundos (el más lento)
  PIN:     tiempo de tipeo + 0.1 segundos
  BLE:     automático (detectado antes de llegar al lector)
```

---

## 10. CONTROL DE AFORO EN TIEMPO REAL

### 10.1 Sistema de Aforo

```yaml
Aforo máximo:
  Configurable por el admin en gym_settings
  Diferente límite por zona (ej: área de pesas 50, cardio 30, spinning 20)
  Puede cambiarse en tiempo real sin reiniciar el sistema

Cómo se cuenta el aforo:
  +1 al registrar CHECK-IN (entrada)
  -1 al registrar CHECK-OUT (salida)

  CHECK-OUT automático:
    Opcional: lector de salida en la puerta de salida
    Alternativa: check-out por tiempo (si no hay registro de salida en X horas,
    el sistema asume que salió y descuenta del aforo)
    El miembro puede hacer check-out manual desde la app

  Tiempo máximo de estancia configurado:
    Si alguien está más de 4 horas (configurable): check-out automático
    Notificación: "Registramos tu salida después de 4h. ¡Hasta pronto!"

Cuando se alcanza el 80% del aforo:
  - Notificación push al admin y recepcionista
  - El semáforo de aforo cambia de verde a amarillo
  - ARIA puede notificar proactivamente a miembros que suelen ir en este horario:
    "Oye María, el gym está al 80% ahora. Quizás prefiero ir más tarde 😊"

Cuando se alcanza el 100% del aforo:
  - El sistema BLOQUEA nuevas entradas
  - El torniquete no acepta ninguna credencial
  - El display en la entrada: "GYM AL MÁXIMO — Espera por favor ⏳"
  - Se activa el modo lista de espera:
    Los miembros que intenten entrar pueden registrarse en la lista de espera
    Al salir alguien: la app notifica al primero de la lista
    El primero tiene 5 minutos para llegar antes de pasar al siguiente
  - El admin puede ver en tiempo real: ¿cuántos hay esperando?

Vista de aforo en tiempo real (pantalla pública opcional):
  Pantalla TV en la entrada o estacionamiento del gym:
  "AFORO ACTUAL: 47/120 🟢 Puedes entrar"
  "AFORO ACTUAL: 110/120 🟡 Casi lleno"
  "AFORO ACTUAL: 120/120 🔴 Al máximo — Espera"
```

### 10.2 Histograma de Ocupación

```
HISTOGRAMA DE OCUPACIÓN — Hoy Sábado 13 junio

Hora   Personas  (pico máx: 89 a las 10:00am)
06:00  ████  18
07:00  █████████  42
08:00  █████████████  58
09:00  ████████████████  71
10:00  █████████████████████  89 ← PICO
11:00  ████████████████████  84
12:00  ████████████  54
13:00  ████████  38
14:00  ██████  28
15:00  █████  22
16:00  ████████  36
17:00  █████████████  58
18:00  ████████████████████  82 ← 2do pico
19:00  ██████████████████  78
20:00  ████████████  54
21:00  ████████  38
22:00  █████  20

Promedio día:    47 personas
Hora más ocupada: 10:00am (89)
Hora más vacía:   06:00am (18)

[Ver semana]  [Ver mes]  [Exportar]
```

---

## 11. ACCESO POR ÁREAS Y ZONAS

### 11.1 Configuración de Zonas

```yaml
El gym se divide en zonas con diferentes niveles de acceso:

Configuración desde el panel admin:
  Cada zona tiene:
    nombre: "Sala de Pesas Principal"
    codigo: "WEIGHTS_MAIN"
    descripcion: "Área de mancuernas, barras y máquinas de fuerza"
    aforo_maximo: 50
    horario_apertura: "05:30"
    horario_cierre: "23:00"
    planes_con_acceso: ["basic", "plus", "elite", "annual"]
    requiere_induccion: false    # true = solo puede entrar si tuvo una clase intro

Zonas típicas de un gym:
  ENTRADA_PRINCIPAL:
    planes: todos los activos
    horario: según plan de membresía

  SALA_PESAS_PRINCIPAL:
    planes: basic, plus, elite, annual, corporate
    horario: horario del gym

  AREA_CARDIO:
    planes: todos los activos
    horario: horario del gym

  CLASES_GRUPALES:
    planes: plus, elite, annual (o por reserva en basic)
    horario: horario de clases
    requiere_reserva: true (verificar que tiene reserva activa)

  SPA_JACUZZI:
    planes: elite, annual, corporate_premium
    horario: "08:00" - "21:00"

  SAUNA:
    planes: elite, annual
    horario: "07:00" - "21:00"
    aforo_maximo: 8

  AREA_VIP_LOUNGE:
    planes: annual, corporate_vip
    horario: "06:00" - "22:00"

  LOCKERS_PREMIUM:
    planes: [plan que incluye locker asignado]
    solo_el_locker_asignado: true

Acceso a zona:
  El mismo mecanismo (QR, NFC, etc.) funciona para todas las puertas
  El sistema verifica si el plan del miembro incluye esa zona
  Si no tiene acceso: mensaje descriptivo con opción de upgrade
```

### 11.2 Lockers Inteligentes

```yaml
Sistema de lockers (integración opcional):

  Hardware: Cerraduras electrónicas en lockers (ej: Ojmar, Digilock)

  Lockers asignados permanentemente:
    Miembros con plan Elite o Annual tienen locker fijo
    El admin lo asigna en el perfil del miembro
    El miembro abre su locker con el mismo método (QR/NFC/PIN)
    El número del locker se muestra en la app

  Lockers de uso diario (self-service):
    Disponibles para planes que no incluyen locker fijo
    El miembro llega → la app le asigna un locker disponible
    Al salir: el locker se libera automáticamente
    Si un miembro olvidó su locker abierto: alerta automática

  Gestión de lockers:
    Dashboard: qué lockers están ocupados en tiempo real
    Alerta: si un locker lleva X horas abierto o no se cerró al salir
    Reporte: ocupación histórica de lockers
```

---

## 12. OPERACIÓN 24/7 SIN RECEPCIONISTA

### 12.1 Modo de Operación Autónoma

```yaml
El gym puede operar completamente sin staff en ciertos horarios
(ej: 10pm - 6am) gracias al sistema de acceso inteligente.

Configuración del horario autónomo:
  horas_con_staff: "06:00 - 22:00"
  horas_autonomas: "22:00 - 06:00"
  en_modo_autonomo:
    acceso: solo miembros con plan 24/7 (Elite, Annual)
    nuevos_visitantes: bloqueados automáticamente
    alertas: todas van al número de emergencia del admin
    camaras: grabación continua activada
    llamada_de_voz: ARIA atiende si alguien toca el intercomunicador

Intercomunicador integrado en la entrada:
  Si alguien toca el timbre en horas autónomas:
    ARIA responde con voz natural:
    "Hola, bienvenido/a a GYM ÉLITE. En este momento no hay
     personal disponible. Si eres miembro, usa tu QR, tarjeta
     o PIN para ingresar. Si necesitas ayuda, puedes enviarnos
     un WhatsApp al +503-XXX-XXXX o llamar al [número de emergencia]."

    Si el visitante dice que es miembro con problema:
    ARIA ofrece asistencia por WhatsApp y contacta al admin on-call.

    Si el visitante no es miembro:
    ARIA explica los horarios de atención y opciones de membresía.

Protocolos de emergencia en modo autónomo:
  INCENDIO / EMERGENCIA:
    El sistema recibe señal del sistema de alarmas del edificio
    → Todas las puertas se ABREN automáticamente (fail-safe)
    → Alerta SMS/llamada al dueño, admin y número de emergencia local

  ALERTA MÉDICA (botón de pánico en el gym):
    El miembro puede tocar un botón de emergencia físico en el gym
    → Llamada automática al 911 + al admin del gym
    → Notificación push a todos los miembros en el gym en ese momento
    → Apertura de todas las puertas para facilitar acceso de emergencias

  ROBO / INTRUSIÓN:
    Si la cámara detecta movimiento cuando el gym está vacío (madrugada)
    → Alerta al admin con foto/video del evento
    → El admin puede ver en vivo desde su teléfono
    → Opción: llamar a seguridad privada o policía directamente desde la app
```

### 12.2 Rotación del Personal On-Call

```yaml
Sistema de on-call para emergencias:

  El admin configura:
    lista_de_oncall: [nombre + teléfono de cada responsable]
    rotacion: semanal / por turno / siempre el mismo

  En caso de alerta crítica (fuera de horario):
    1. Notificación push al oncall actual
    2. Si no responde en 5 minutos: llama al siguiente de la lista
    3. Si nadie responde en 15 minutos: SMS a todos los de la lista

  El oncall puede desde su teléfono:
    ✅ Ver las cámaras del gym en vivo
    ✅ Abrir o cerrar puertas remotamente
    ✅ Ver quién está en el gym en ese momento
    ✅ Llamar al miembro que está dentro (si es una emergencia)
    ✅ Generar un acceso temporal para un técnico o cerrajero
```

---

## 13. MODO VISITANTE & ACCESO DE CORTESÍA

### 13.1 Pase de Visitante (Guest Pass)

```yaml
Pase de visitante:
  Los miembros con ciertos planes pueden traer acompañantes

  Cantidad según el plan:
    Plan Básico:   0 pases de invitado por mes
    Plan Plus:     1 pase de invitado por mes
    Plan Elite:    2 pases de invitado por mes
    Plan Anual:    2 pases de invitado por mes

  Proceso de emisión:
    Miembro abre la app → "Traer un acompañante" → ingresa nombre del visitante
    Sistema genera un QR de un solo uso con:
      - Validez: solo el día de hoy
      - Zona: solo áreas permitidas para el plan del miembro anfitrión
      - Uso: un solo ingreso

    El miembro comparte el QR por WhatsApp con su acompañante
    El acompañante presenta el QR en la entrada
    El sistema registra el uso del pase y descuenta del cupo mensual

  Seguridad:
    El QR del visitante tiene menos privilegios que el del miembro
    El visitante no puede acceder a zonas premium
    El visitante queda registrado en los logs con el nombre proporcionado
    Si un miembro abusa de los pases de visita: el admin puede restringirlos

Acceso de trial (prospecto):
  ARIA o el staff genera un QR de trial para un prospecto
  Válido por: X días (configurable — ej: 3 o 7 días)
  Acceso a: zonas estándar (no zonas premium)
  El prospecto queda en el pipeline de ventas del CRM
  Al vencer el trial: el QR deja de funcionar automáticamente

Acceso de cortesía (generado por admin):
  Para: personal de mantenimiento, médicos, fisioterapeutas, auditores
  Configurable: fecha de inicio + fecha de fin + zonas permitidas
  Sin límite de usos en el período configurado
  Queda completamente registrado en los logs con motivo
```

---

## 14. SEGURIDAD & PREVENCIÓN DE FRAUDE

### 14.1 Amenazas y Mitigaciones

```yaml
AMENAZA: Compartir el QR con otra persona
  MITIGACIÓN:
    El QR expira en 60 segundos → inútil si se comparte
    La foto del miembro aparece en la pantalla del lector al escanear
    El staff puede verificar visualmente que coincide con la persona
    Si hay cámara: el sistema compara la cara con la foto del miembro (opcional)

AMENAZA: Clonar tarjeta NFC
  MITIGACIÓN:
    Usamos MIFARE DESFire EV3 (encriptación AES-128 — actualmente no clonable)
    Incluso si se clonara: el sistema verifica el estado de la membresía online
    Cada tarjeta tiene un serial único vinculado en la BD al miembro

AMENAZA: Replay attack (capturar y reproducir el QR antes de que expire)
  MITIGACIÓN:
    El nonce del QR se marca como "usado" al primer escaneo
    Un segundo intento del mismo nonce: acceso denegado + alerta
    La ventana de 60 segundos hace el ataque prácticamente imposible en tiempo real

AMENAZA: Forzar el torniquete físicamente
  MITIGACIÓN:
    Torniquetes de alta resistencia con sensores de fuerza
    Alarma si se detecta fuerza excesiva
    Cámara en la entrada registra el evento

AMENAZA: Piggyback (colarse detrás de un miembro)
  MITIGACIÓN:
    Sensor infrarrojo en el torniquete: detecta si más de 1 persona pasa
    Alerta si el torniquete registra doble paso
    En zonas críticas: detector de altura o peso en el torniquete

AMENAZA: Hackear el controlador local
  MITIGACIÓN:
    El controlador no tiene acceso a internet directo (detrás de firewall)
    Comunicación encriptada con el backend (TLS 1.3 + certificado mutuo)
    No hay puertos abiertos innecesarios
    Actualizaciones de firmware automáticas y firmadas digitalmente

AMENAZA: Ingeniería social (alguien convence al staff de dejarlo pasar)
  MITIGACIÓN:
    Política clara: ningún miembro entra sin validar en el sistema
    El staff tiene acceso a ver el estado de la membresía en la app
    Los accesos manuales quedan registrados con el staff que los autorizó
    Auditoría mensual de accesos manuales vs. electrónicos
```

### 14.2 Lista de Restricciones de Acceso

```yaml
Lista de acceso restringido (black list interna del gym):

  Casos donde se agrega a un miembro:
    - Comportamiento inapropiado documentado (después del proceso formal)
    - Robo confirmado dentro del gym
    - Agresión física documentada
    - Acoso a otros miembros (con evidencia)
    - Violación grave de las normas del gym

  Proceso de adición a la lista:
    Solo el admin o dueño puede agregar/quitar de la lista
    Se requiere documentar la razón
    Si la membresía está activa: no se reembolsa por conducta

  Comportamiento del sistema cuando intenta entrar:
    Acceso denegado silenciosamente (sin mostrar razón en la pantalla)
    Alerta INMEDIATA al admin con foto/video del intento
    Si hay staff: notificación en la recepción para actuar
    Si no hay staff (modo autónomo): alerta a oncall

  Duración de la restricción:
    Temporal (X días configurables)
    Permanente (hasta que el admin la levante)

  IMPORTANTE — Proceso justo:
    Antes de agregar a la lista: el miembro debe ser notificado formalmente
    El gym debe tener evidencia documentada
    Hay un período de apelación (72 horas recomendado)
    Esto protege al gym de demandas legales
```

---

## 15. CÁMARAS & VIGILANCIA INTEGRADA

### 15.1 Integración de Cámaras

```yaml
Cámaras soportadas:
  Protocolo: ONVIF (estándar de la industria — compatible con 90% de cámaras IP)
  Resolución recomendada: 2MP (1080p) mínimo, 4MP o 4K para entradas

  Cámaras de referencia:
    Hikvision DS-2CD2143G2-I (indoor, 4MP, IR)
    Dahua IPC-HDW2849H-S-IL (dual-light, 4K)
    Reolink RLC-823A (buena relación costo-calidad)

  Ubicaciones mínimas recomendadas:
    ✅ Entrada principal (con visión del torniquete)
    ✅ Área de recepción
    ✅ Acceso a vestuarios (solo el pasillo — no dentro)
    ✅ Área de pesas (cobertura general, sin espacios ciegos)
    ✅ Estacionamiento (si aplica)
    ❌ Vestuarios / baños (prohibido absolutamente)
    ❌ Áreas de cambio de ropa (prohibido)

Acceso a las cámaras:
  Admin / Dueño: acceso completo a todas las cámaras en vivo y grabado
  Staff: acceso a cámaras del área donde trabajan
  Oncall: acceso completo durante emergencias
  Sin acceso: trainers, miembros (nunca)

  Desde la app del admin:
    Live view: transmisión en tiempo real de cualquier cámara
    Playback: revisión de grabaciones (búsqueda por fecha/hora)
    Clips: exportar fragmentos de video para evidencia

  Desde el panel web:
    Vista multi-cámara (grid de todas las cámaras a la vez)
    Búsqueda por fecha y hora en grabaciones

Almacenamiento de grabaciones:
  Local: NVR (Network Video Recorder) en el gym
    Capacidad: 2-4 TB dependiendo del número de cámaras y resolución
    Retención: 30 días rolling (se sobreescribe automáticamente)
  Nube: backup de fragmentos con alertas de movimiento o eventos
    Retención cloud: 7 días (por costo)

  Tiempo de retención recomendado:
    Entradas: 30 días (incidentes de acceso)
    Interior del gym: 15 días
    Vestuarios (pasillos): 7 días

Privacidad:
  Aviso visible en la entrada: "ÁREA VIDEOVIGILADA"
  Incluido en el contrato de membresía
  Las grabaciones no se comparten con terceros excepto con orden judicial
  Los miembros pueden solicitar ver grabaciones de su propia persona
```

### 15.2 Alertas de Video Basadas en IA

```yaml
Detección inteligente de eventos (opcional — requiere hardware compatible):
  Detección de movimiento en horario cerrado:
    Trigger: movimiento detectado cuando no hay check-ins activos
    Acción: alerta push + clip de video al admin

  Cuenta de personas excede el aforo:
    Trigger: la cámara AI cuenta más personas que el aforo registrado
    Acción: alerta + revisar posibles piggybacking no detectados

  Persona merodeando en la entrada sin entrar (>5 min):
    Trigger: cámara detecta persona estática fuera por más de 5 min
    Acción: alerta discreta al admin

  Objeto abandonado (bolso, mochila >15 min sin dueño):
    Trigger: objeto estático detectado por más de 15 minutos
    Acción: alerta al staff

  Incidente físico (pelea, caída):
    Trigger: movimiento brusco + cambio de postura detectado
    Acción: alerta inmediata + grabación del evento
    NOTA: Esta funcionalidad es de alta tecnología — requiere cámara con IA integrada
```

---

## 16. LOGS DE ACCESO & ANALYTICS

### 16.1 Registro de Cada Evento

```yaml
Cada evento de acceso genera un registro inmutable:

Evento de acceso (access_log):
  id: UUID único
  gym_id: UUID del gym
  timestamp: fecha y hora exacta (con timezone)
  event_type: CHECK_IN | CHECK_OUT | ACCESS_DENIED | VISITOR_ACCESS | MANUAL_OVERRIDE
  member_id: UUID del miembro (null si es visitante no registrado)
  member_name_snapshot: nombre en el momento del acceso
  credential_type: QR | NFC | FACIAL | PIN | BLE | MANUAL
  door_id: qué puerta o zona
  controller_id: qué controlador procesó el evento
  granted: true | false
  denial_reason: (si fue denegado) motivo del rechazo
  membership_status_snapshot: estado de la membresía en el momento del acceso
  membership_type_snapshot: tipo de plan en el momento del acceso
  aforo_before: aforo antes de este evento
  aforo_after: aforo después de este evento
  facial_confidence: (solo para facial) puntuación de confianza
  ble_rssi: (solo para BLE) fuerza de la señal
  ip_address_controller: IP del controlador
  device_fingerprint: huella del dispositivo físico
  manual_override_by: (si fue manual) staff que lo autorizó
  notes: observaciones adicionales

Inmutabilidad de los logs: Los logs de acceso NUNCA pueden ser editados ni eliminados
  (excepto por orden judicial documentada)
  Se almacenan con hash SHA-256 de cada registro
  El hash se verifica periódicamente para detectar manipulaciones
  Son la evidencia legal en caso de disputas
```

### 16.2 Analytics de Acceso

```yaml
Métricas disponibles en el panel de analytics:

DIARIAS:
  - Check-ins totales del día con histograma por hora
  - Miembros únicos que visitaron hoy
  - Distribución por tipo de credencial usado (QR 78%, NFC 15%, PIN 7%)
  - Tiempo promedio de permanencia
  - Accesos denegados con motivo

SEMANALES/MENSUALES:
  - Días y horas de mayor ocupación (mapa de calor)
  - Frecuencia de visitas por miembro (¿cuántas veces viene por semana?)
  - Comparativa de ocupación vs. mismo período anterior
  - Miembros que no han venido en X días (base del Risk Score)

POR MIEMBRO:
  - Todas las visitas en el historial
  - Frecuencia habitual (días y horarios preferidos)
  - Variaciones del patrón (¿viene menos que antes?)
  - Duración promedio de visita
  - Zonas visitadas (si tiene múltiples puertas con lectores)

ANALYTICS DE SEGURIDAD:
  - Intentos de acceso denegados por razón
  - Intentos con credencial inválida (posibles intentos de fraude)
  - Accesos manuales vs. electrónicos (para auditoría)
  - Eventos de piggybacking detectados

KPIs OPERACIONALES:
  - Hora pico (para planificación de staff)
  - Tiempo promedio en el torniquete (¿hay cuellos de botella?)
  - Tasa de éxito de la primera presentación de credencial
  - Downtime del sistema (% de disponibilidad)
```

---

## 17. ALERTAS & NOTIFICACIONES DE ACCESO

### 17.1 Alertas del Sistema de Acceso

```yaml
ALERTAS CRÍTICAS (inmediatas — push + SMS):
  Intrusión detectada fuera de horario:
    trigger: CHECK_IN en horario cerrado sin credencial válida
    destinatario: admin + oncall
    acción_sugerida: revisar cámara + llamar a seguridad si es necesario

  Acceso de miembro en lista de restricción:
    trigger: intento de acceso de un miembro restringido
    destinatario: admin + recepcionista
    acción: el sistema deniega automáticamente, el staff actúa si hay presencia

  Torniquete mantenido abierto por más de 30 segundos:
    trigger: door_held_open sin nuevo CHECK_IN
    destinatario: recepcionista + admin
    acción: revisar si alguien pasó sin registrar

  Tamper alert (alguien intentó manipular el lector):
    trigger: señal de tamper del controlador hardware
    destinatario: admin + oncall
    acción: revisar cámara del área

  Controlador sin conexión > 5 minutos:
    trigger: controlador no responde al ping del backend
    destinatario: admin + técnico designado
    acción: verificar conectividad / reiniciar remotamente si es posible

ALERTAS MEDIAS (push al admin en horario laboral): Aforo al 80% alcanzado
  Aforo al 100% alcanzado
  5 accesos denegados por membresía vencida en 1 hora
  Miembro usa PIN 5 veces incorrectas (bloqueo activado)
  Tasa de éxito de credencial bajó del 90% (problema técnico posible)

ALERTAS INFORMATIVAS (resumen diario al admin): Total de check-ins del día
  Hora de mayor ocupación
  Miembros únicos del día
  Accesos denegados con distribución de motivos
```

### 17.2 Notificaciones al Miembro

```yaml
Notificaciones push al miembro relacionadas con acceso:

  Al ingresar exitosamente:
    "✅ ¡Bienvenido/a a GYM ÉLITE! 12:47pm — ¡Que tengas un gran entreno! 💪"
    (configurable: el miembro puede desactivar esta notificación)

  Al salir (check-out):
    "👋 ¡Hasta pronto, María! Estuviste 65 minutos hoy. ¡Excelente sesión!"
    (solo si hay lector de salida configurado)

  Membresía a punto de vencer (ARIA):
    Se envía 7 días y 3 días antes — no es una alerta de acceso, es de retención

  Membresía vencida al intentar entrar:
    Push + mensaje de ARIA: "Hola María, tu membresía venció el 10/06.
    Para renovar: [link directo de pago] o acércate a recepción 😊"

  Pase de visitante usado:
    "Tu acompañante [Nombre del visitante] ingresó al gym a las 14:30
    usando tu pase de invitado. Tienes 1 pase restante este mes."

  QR escaneado cuando el miembro no está en el gym (posible fraude):
    "Detectamos que alguien usó tu código QR en el gym pero tú no lo
    confirmaste. Si no eras tú, avísanos de inmediato. [Reportar]"
```

---

## 18. INTEGRACIÓN CON MÓDULOS DEL SISTEMA

### 18.1 Cómo el Acceso Alimenta Todo el Sistema

```yaml
Cada CHECK_IN emite el evento MEMBER_CHECKED_IN que alimenta:

MOD-CRM (Retención):
  - Actualiza la fecha de última visita del miembro
  - Recalcula el Risk Score (visita reciente = score baja)
  - Si el miembro tenía Risk Score > 60 y viene: cancela los workflows de
    retención activos y envía un mensaje positivo de bienvenida a su regreso
  - Alimenta el "días sin visitar" para el cálculo de riesgo

MOD-ANALYTICS (Dashboard):
  - Actualiza el aforo en tiempo real en el dashboard del admin
  - Agrega el check-in al histograma del día
  - Incrementa el contador de check-ins totales del día
  - Actualiza "miembros en el gym ahora" para el aforo live

MOD-WORKOUT (Entrenamiento):
  - ZEUS recibe el contexto: "María acaba de entrar al gym"
  - Si el miembro tiene sesión programada: ZEUS envía reminder del plan de hoy
  - Si es la primera visita después de ausencia: ZEUS ajusta la recomendación
    de intensidad ("bienvenida de vuelta — empieza con un 80% de tu carga habitual")

MOD-GAMIFICATION (Puntos y Medallas):
  - +10 puntos por check-in
  - Verifica si este check-in completa una racha (streak) y da bonus
  - Verifica si activa alguna medalla (ej: "50 visitas en el año")
  - Actualiza el leaderboard de asistencia en tiempo real

MOD-NOTIF (Notificaciones):
  - Envía la notificación de bienvenida al miembro
  - Si el miembro llegó para su clase reservada: confirma la asistencia
  - Notifica al trainer asignado si el miembro llega para su sesión PT

MOD-SCHEDULING (Agenda):
  - Si el miembro tiene clase reservada en los próximos 30 min:
    confirma automáticamente su asistencia (sin que tenga que hacer check-in
    manual en la clase)
  - Actualiza el aforo de la clase

Cada CHECK_OUT emite el evento MEMBER_CHECKED_OUT:
  - Actualiza aforo (disminuye en 1)
  - Registra la duración de la visita
  - Alimenta el histograma de salidas
  - ZEUS puede enviar mensaje post-entreno: "¡Gran sesión, María!
    Recuerda proteína en los próximos 30 minutos 💪"
```

---

## 19. PANEL DE GESTIÓN DE ACCESO (ADMIN)

### 19.1 Panel de Control de Acceso

```
PANEL ADMIN — CONTROL DE ACCESO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ESTADO EN TIEMPO REAL:
  Aforo actual:    47/120 🟢
  Puertas:         [Entrada Principal ✅] [Spa 🔴 cerrado] [Sauna ✅]
  Controladores:   [CTRL-01 ✅ Online] [CTRL-02 ✅ Online]
  Cámaras:         [CAM-01 ✅] [CAM-02 ✅] [CAM-03 ⚠️ Señal débil]

VISTA LIVE — ÚLTIMOS EVENTOS:
  12:47:23  ✅  María García          QR      Entrada Principal
  12:47:01  ✅  Pedro Ramírez         NFC     Entrada Principal
  12:45:38  ❌  Luis Moreno           QR      Membresía vencida
  12:44:12  ✅  Ana Torres            Facial  Entrada Principal
  12:43:55  ✅  [Visitante] Juan López QR-VISIT Entrada Principal
  [Ver todos los eventos]

ACCIONES RÁPIDAS:
  [🚪 Abrir puerta remotamente]    → seleccionar puerta + razón
  [🔒 Bloquear puerta remotamente] → emergencia o mantenimiento
  [👤 Acceso temporal]             → generar QR de cortesía
  [⚠️ Modo emergencia]             → abrir TODAS las puertas
  [📊 Ver histograma de hoy]
  [📋 Ver log completo]

GESTIÓN DE DISPOSITIVOS:
  [+ Agregar controlador]          → instalar nuevo controlador
  [+ Agregar lector]               → configurar nuevo lector
  [+ Agregar zona]                 → crear nueva área con acceso
  [⚙️ Configurar horarios]         → horarios de cada zona/puerta
  [📡 Estado de hardware]          → diagnóstico de todos los dispositivos

CONFIGURACIÓN DE AFORO:
  Aforo general del gym: [120] personas
  Aforo sala de pesas:   [50]  personas
  Aforo zona cardio:     [30]  personas
  Aforo spa/jacuzzi:     [15]  personas
  Aforo sauna:           [8]   personas
  [Guardar cambios]
```

### 19.2 Gestión de Credenciales por Miembro

```
PERFIL DE ACCESO — María García
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEMBRESÍA: Elite Anual — ACTIVA ✅
  Acceso hasta: 15 marzo 2027
  Zonas permitidas: Todas (incluyendo Spa y Sauna)
  Horario: 24/7

CREDENCIALES ACTIVAS:
  📱 QR Dinámico (App):       ✅ Activo       [Desactivar]
  💳 Tarjeta NFC #A4F2:       ✅ Activo       [Desactivar] [Reportar perdida]
  👤 Reconocimiento facial:   ✅ Registrada   [Ver/Actualizar fotos] [Desactivar]
  🔢 PIN:                     ✅ Configurado  [Resetear PIN]
  📡 Bluetooth BLE:           ❌ No activado  [Activar]

  [+ Emitir nueva tarjeta NFC]

PASES DE VISITA:
  Pases mensuales: 2 disponibles de 2 (ninguno usado este mes)
  Historial de visitas de acompañantes:
  05/06 - Juan García (familiar) - Entrada 10:30am [Ver log]

HISTORIAL DE ACCESO (últimos 10):
  13/06 12:47  ✅ Check-in  QR      Entrada Principal  [Dur: activo]
  11/06 09:23  ✅ Check-in  NFC     Entrada Principal  [Dur: 68 min]
  11/06 10:31  ✅ Check-out (auto)  Entrada Principal
  ...
  [Ver historial completo]  [Exportar PDF]

RESTRICCIONES:
  Estado: Sin restricciones ✅
  [Agregar restricción]  (solo admin puede — requiere documentación)
```

---

## 20. MODELO DE DATOS COMPLETO

```sql
-- ─────────────────────────────────────────────────────────────
-- DISPOSITIVOS DE CONTROL DE ACCESO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE access_controllers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  name                  VARCHAR(100) NOT NULL,
  controller_type       VARCHAR(30) DEFAULT 'local',  -- local|kisi|salto|brivo
  hardware_model        VARCHAR(100),
  firmware_version      VARCHAR(20),
  ip_address            VARCHAR(45),
  mac_address           VARCHAR(17),
  location_description  VARCHAR(200),
  status                VARCHAR(20) DEFAULT 'online',   -- online|offline|maintenance
  last_seen_at          TIMESTAMP,
  last_sync_at          TIMESTAMP,
  config                JSONB,                          -- config específica del hardware
  created_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE access_doors (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  controller_id         UUID NOT NULL REFERENCES access_controllers(id),
  name                  VARCHAR(100) NOT NULL,
  code                  VARCHAR(30) NOT NULL,           -- 'MAIN_ENTRANCE', 'SPA', etc.
  zone_type             VARCHAR(30),                    -- entrance|gym_floor|spa|sauna|vip
  required_plans        TEXT[],                         -- planes con acceso a esta puerta
  aforo_max             INTEGER,                        -- aforo máximo de esta zona
  aforo_current         INTEGER DEFAULT 0,
  schedule              JSONB,                          -- horarios de apertura
  hardware_pin          INTEGER,                        -- pin de relé del controlador
  open_duration_ms      INTEGER DEFAULT 3000,
  is_active             BOOLEAN DEFAULT TRUE,
  has_exit_reader       BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CREDENCIALES DE MIEMBROS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE member_credentials (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  credential_type       VARCHAR(20) NOT NULL,   -- qr|nfc|facial|pin|ble
  -- NFC
  nfc_card_serial       VARCHAR(50) UNIQUE,
  nfc_card_key          TEXT,                   -- encriptado
  -- PIN
  pin_hash              TEXT,                   -- bcrypt hash
  pin_failed_attempts   INTEGER DEFAULT 0,
  pin_locked_until      TIMESTAMP,
  -- Facial
  facial_embedding      VECTOR(512),            -- pgvector para el embedding
  facial_registered_at  TIMESTAMP,
  facial_photo_count    INTEGER DEFAULT 0,
  -- BLE
  ble_device_id         VARCHAR(100),
  ble_public_key        TEXT,
  -- Estado
  is_active             BOOLEAN DEFAULT TRUE,
  is_primary            BOOLEAN DEFAULT FALSE,
  last_used_at          TIMESTAMP,
  created_at            TIMESTAMP DEFAULT NOW(),
  UNIQUE (gym_id, nfc_card_serial)
);

-- ─────────────────────────────────────────────────────────────
-- LOG DE ACCESOS (tabla principal — inmutable)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE access_logs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                      UUID NOT NULL REFERENCES gyms(id),
  door_id                     UUID NOT NULL REFERENCES access_doors(id),
  controller_id               UUID NOT NULL REFERENCES access_controllers(id),
  -- Quien accede
  member_id                   UUID REFERENCES members(id),
  member_name_snapshot        VARCHAR(200),
  credential_id               UUID REFERENCES member_credentials(id),
  credential_type             VARCHAR(20) NOT NULL,
  -- Visitante (si no es miembro)
  visitor_name                VARCHAR(200),
  visitor_pass_id             UUID,
  -- Resultado
  event_type                  VARCHAR(30) NOT NULL,
  -- CHECK_IN|CHECK_OUT|ACCESS_DENIED|VISITOR_IN|MANUAL_OVERRIDE|EMERGENCY
  granted                     BOOLEAN NOT NULL,
  denial_reason               VARCHAR(50),
  -- EXPIRED_MEMBERSHIP|FROZEN|INVALID_CREDENTIAL|AFORO_FULL|WRONG_ZONE
  -- |WRONG_HOUR|BLACKLISTED|CREDENTIAL_EXPIRED|REPLAY_ATTACK
  -- Snapshot de estado al momento del acceso
  membership_status_snapshot  VARCHAR(20),
  membership_type_snapshot    VARCHAR(50),
  aforo_before                INTEGER,
  aforo_after                 INTEGER,
  -- Metadata técnica
  confidence_score            DECIMAL(5,4),          -- para facial
  ble_rssi                    INTEGER,               -- para BLE
  qr_nonce                    VARCHAR(50),           -- para detectar replays
  -- Autorización manual
  manual_override_by          UUID REFERENCES staff(id),
  manual_override_reason      TEXT,
  -- Integridad
  record_hash                 VARCHAR(64),           -- SHA-256 del registro
  -- Tiempo
  occurred_at                 TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX (gym_id, occurred_at DESC),
  INDEX (member_id, occurred_at DESC),
  INDEX (door_id, occurred_at DESC)
);

-- Prevenir edición/borrado de logs (INMUTABILIDAD)
CREATE RULE no_update_access_logs AS ON UPDATE TO access_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_access_logs AS ON DELETE TO access_logs DO INSTEAD NOTHING;

-- ─────────────────────────────────────────────────────────────
-- AFORO EN TIEMPO REAL (Redis-backed, pero tabla como respaldo)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE zone_occupancy (
  door_id               UUID PRIMARY KEY REFERENCES access_doors(id),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  current_count         INTEGER NOT NULL DEFAULT 0,
  max_capacity          INTEGER NOT NULL,
  last_updated_at       TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PASES DE VISITANTE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE visitor_passes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  issued_by_member_id   UUID REFERENCES members(id),   -- null si es del admin/staff
  issued_by_staff_id    UUID REFERENCES staff(id),
  visitor_name          VARCHAR(200),
  visitor_email         VARCHAR(150),
  pass_type             VARCHAR(20) DEFAULT 'guest',   -- guest|trial|courtesy|maintenance
  access_code           VARCHAR(50) NOT NULL UNIQUE,   -- código del QR
  allowed_zones         TEXT[],                        -- zonas permitidas
  valid_from            TIMESTAMP NOT NULL,
  valid_until           TIMESTAMP NOT NULL,
  max_uses              INTEGER DEFAULT 1,
  uses_count            INTEGER DEFAULT 0,
  is_active             BOOLEAN DEFAULT TRUE,
  notes                 TEXT,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- LISTA DE RESTRICCIONES DE ACCESO
-- ─────────────────────────────────────────────────────────────
CREATE TABLE access_restrictions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  member_id             UUID NOT NULL REFERENCES members(id),
  restriction_type      VARCHAR(20) DEFAULT 'full_block',  -- full_block|zone_block|time_block
  blocked_zones         TEXT[],                           -- null = todas las zonas
  reason                TEXT NOT NULL,
  evidence_notes        TEXT,
  restricted_from       TIMESTAMP NOT NULL DEFAULT NOW(),
  restricted_until      TIMESTAMP,                        -- null = permanente
  is_active             BOOLEAN DEFAULT TRUE,
  created_by            UUID NOT NULL REFERENCES staff(id),
  lifted_at             TIMESTAMP,
  lifted_by             UUID REFERENCES staff(id),
  lift_reason           TEXT,
  created_at            TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CONFIGURACIÓN DE CÁMARAS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE security_cameras (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id                UUID NOT NULL REFERENCES gyms(id),
  name                  VARCHAR(100) NOT NULL,
  location              VARCHAR(200),
  rtsp_url              TEXT,                  -- encriptado
  snapshot_url          TEXT,                  -- encriptado
  model                 VARCHAR(100),
  resolution            VARCHAR(20),
  has_night_vision      BOOLEAN DEFAULT FALSE,
  has_ai_detection      BOOLEAN DEFAULT FALSE,
  status                VARCHAR(20) DEFAULT 'online',
  related_door_id       UUID REFERENCES access_doors(id),
  recording_retention_days INTEGER DEFAULT 30,
  created_at            TIMESTAMP DEFAULT NOW()
);
```

---

## 📎 APÉNDICE — CHECKLIST DE IMPLEMENTACIÓN

```
FASE 1 — QR PROPIO (MVP, semanas 1-4):
□ Sistema de generación y rotación de QR dinámico implementado
□ Firma HMAC-SHA256 configurada con key secreta en Doppler
□ Detección de replay attacks (nonce tracking en Redis)
□ Widget de QR en la app con brillo automático y countdown
□ Lector QR físico instalado en la entrada (mínimo 1)
□ Controlador Raspberry Pi configurado con cache local de membresías
□ Protocolo MQTT entre controlador y backend probado
□ Access logs inmutables con hashing implementado
□ Panel de aforo en tiempo real en el dashboard admin
□ Notificación push de bienvenida al miembro al hacer check-in
□ Alertas de membresía vencida al intentar acceder
□ Integración con Risk Score del CRM (check-in actualiza el score)

FASE 2 — TARJETA NFC + BIOMETRÍA (semanas 12-20):
□ Tarjetas MIFARE DESFire EV3 ordenadas y personalizadas
□ Lectores NFC/RFID instalados (mismos puntos que los QR)
□ Proceso de emisión y vinculación de tarjetas documentado
□ Cámara IP para reconocimiento facial instalada en entrada
□ Motor de reconocimiento facial configurado localmente (privacidad)
□ Proceso de registro facial guiado en la app implementado
□ Liveness detection anti-spoofing activado
□ Consentimiento biométrico en el flujo de onboarding
□ Flujo de eliminación de datos biométricos al cancelar membresía

FASE 3 — HARDWARE AVANZADO (semanas 20+):
□ Evaluación y selección de proveedor: Kisi vs. Salto vs. otro
□ Torniquetes de trípode instalados (reemplazar barrera si había)
□ Integración API Kisi/Salto con el backend
□ Sistema de lockers electrónicos si aplica
□ Acceso por zonas configurado (spa, sauna, VIP, etc.)
□ Modo 24/7 sin staff configurado y probado
□ Sistema de cámaras IP instalado y configurado
□ Intercomunicador con ARIA en la entrada principal
□ NVR para grabación local instalado

SEGURIDAD (todas las fases):
□ Política de acceso documentada y firmada por el staff
□ Proceso formal para agregar a la lista de restricciones
□ Protocolo de emergencia documentado (incendio, médica, robo)
□ Contactos on-call configurados en el sistema
□ UPS instalado para los controladores (sin corte de luz)
□ Test mensual del sistema completo documentado
```

---

_Documento generado: Junio 2026_  
_Versión: 1.0_  
_Módulo: GYM-MOD-ACCESS_  
_Parte del Documento Maestro: App Integral de Gimnasio de Élite_  
_Próxima revisión: Septiembre 2026_
