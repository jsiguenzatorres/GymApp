# ADR-010: Edge Computing para Control de Acceso Offline-Capable

**Estado:** Aceptado (Fase 2+)
**Fecha:** Junio 2026
**Módulos afectados:** `GYM-MOD-ACCESS` (Fase 2+)

## Contexto

En Fase 2, cuando instalamos controladores físicos (Raspberry Pi 4) en los gyms, el acceso no puede depender de una conexión estable a internet. Si el backend está temporalmente inaccesible o el ISP del gym cae, los miembros no pueden entrar a su gym — experiencia inaceptable.

## Decisión

**Arquitectura de decisión híbrida edge + cloud:**

```
┌─────────────────────────────────────────────────────┐
│                   GYM (On-Premise)                   │
│                                                      │
│  Raspberry Pi 4 / Industrial Controller              │
│  ┌────────────────────────────────────────────────┐  │
│  │ Edge Decision Engine                           │  │
│  │  - Cache de membresías activas (hasta 2h)      │  │
│  │  - Decisión offline < 100ms                    │  │
│  │  - BullMQ local para sync queue                │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │ MQTT                             │
│            Puerta / Torniquete                       │
└───────────────────┼─────────────────────────────────┘
                    │ Internet (30s sync interval)
                    ↓
              GymApp Backend (Railway/AWS)
```

### Protocolo MQTT
El controlador edge y el backend se comunican vía MQTT:

```typescript
interface ControllerMessage {
  controllerId: string;
  gymId: string;
  doorId: string;
  eventType: 'ACCESS_GRANTED' | 'ACCESS_DENIED' | 'DOOR_OPEN' | 'DOOR_CLOSED'
           | 'DOOR_HELD_OPEN' | 'TAMPER_ALERT' | 'POWER_FAILURE'
           | 'CONTROLLER_ONLINE' | 'CONTROLLER_OFFLINE';
  credentialType: 'QR' | 'NFC' | 'FACIAL' | 'PIN' | 'BLE';
  credentialData: string;
  memberId?: string;
  timestamp: number;
  metadata?: { denialReason?: string; confidence?: number; rssi?: number; };
}
```

### Política de cache en el edge
| Dato | TTL en edge | Estrategia de invalidación |
|------|------------|---------------------------|
| Membresías activas | 2 horas | Push inmediato en cambio de estado |
| Blacklist | 30 minutos | Push inmediato al añadir |
| Horarios de acceso | 24 horas | Batch update diario |
| Zonas y aforo | 30 segundos | Push continuo |

### Modos de operación
1. **Online:** Edge reenvía al backend, backend decide, edge actúa
2. **Offline < 2h:** Edge decide localmente con cache. Logs en queue local.
3. **Offline > 2h:** Edge rechaza acceso (política de seguridad conservadora) + alerta al dueño del gym

### Seguridad del edge
- Comunicación MQTT con TLS
- Certificados rotados trimestralmente
- Edge solo puede leer membresías activas, no datos sensibles
- Logs de acceso se sincronizan y son inmutables en el backend
- Si el controlador es alterado físicamente: `TAMPER_ALERT` + alerta inmediata

## Alternativas consideradas

1. **Decisión 100% en la nube:** Dependencia total del internet del gym. Un corte de internet = nadie entra. Inadmisible.
2. **Decisión 100% en el edge (sin backend):** Imposible mantener membresías y pagos actualizados sin el backend.
3. **WebSocket persistente en lugar de MQTT:** MQTT es más adecuado para IoT (QoS levels, retain messages, last will). WebSocket es más adecuado para web browsers.

## Consecuencias

**Positivo:**
- El gym sigue funcionando aunque el internet caiga hasta 2 horas
- < 100ms de latencia para validación de acceso (no espera round-trip)
- Los gyms valoran mucho la confiabilidad del control de acceso

**Negativo:**
- Requiere hardware físico instalado por técnico (costo de onboarding del gym)
- El edge debe ser actualizado (OTA updates gestionados vía el backend)
- Seguridad del hardware físico en el gym (fuera de nuestro control directo)
