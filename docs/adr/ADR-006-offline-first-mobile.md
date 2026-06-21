# ADR-006: Offline-First en Mobile con WatermelonDB

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** `GYM-MOD-WKT` (principalmente), `apps/mobile`

## Contexto

Los miembros usan la app móvil en el gym. Los gyms en LATAM frecuentemente tienen señal WiFi débil o intermitente en la sala de pesas. Una sesión de entrenamiento que pierde conexión a mitad de la sesión y pierde datos es inaceptable desde el UX.

## Decisión

**WatermelonDB** como base de datos SQLite local en el dispositivo móvil para sesiones de workout.

### Qué se almacena offline
- `workout_sessions`: sesión activa con metadata
- `executed_sets`: cada serie registrada (peso, reps, RPE, timestamp)
- `exercises`: biblioteca del gym (sincronizada al iniciar sesión o al abrir el módulo)
- `training_plan`: el plan actual del miembro (sincronizado al asignar o modificar)

### Flujo de sincronización
```
Dispositivo sin internet:
  - Usuario registra series en WatermelonDB local
  - App muestra correctamente PRs, timer, historial

Al recuperar conexión:
  - Background sync automático (WatermelonDB Sync Protocol)
  - Conflict resolution: timestamp-based (última escritura gana)
  - Si PR fue batido offline: celebración se dispara al sincronizar
```

### Qué requiere conexión obligatoria
- Pago de membresía y facturas
- Validación de QR de acceso (necesita el servidor para verificar membresía activa)
- Consultas a ZEUS que requieren LLM
- Compras en marketplace

## Alternativas consideradas

1. **AsyncStorage de React Native:** No soporta queries complejas ni sincronización. Descartado para datos relacionales.
2. **Redux Persist:** Solo para estado UI, no para datos de negocio. No tiene sync.
3. **Realm (MongoDB):** Viable, pero la licencia de Realm Sync tiene costo adicional. WatermelonDB es open source.
4. **TanStack Query con stale-while-revalidate:** Suficiente para muchos casos, pero no para sesiones de entrenamiento donde el usuario puede estar 1h sin internet.

## Consecuencias

**Positivo:**
- Experiencia de workout fluida independientemente de la conectividad
- Performance excelente: queries SQLite son locales, sin latencia de red
- Datos del miembro siempre disponibles (plan, PRs, historial)

**Negativo:**
- Complejidad de sincronización (conflicts, merge strategies)
- WatermelonDB tiene una curva de aprendizaje
- El schema de WatermelonDB debe estar sincronizado con el Prisma schema del backend (se mantienen en `packages/shared-schemas`)

**Regla:** Solo el módulo de workout usa WatermelonDB offline. El resto de la app usa TanStack Query con cache estándar.
