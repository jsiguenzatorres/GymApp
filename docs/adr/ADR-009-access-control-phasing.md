# ADR-009: Control de Acceso Físico por Fases (QR → NFC/BLE → HID/Facial)

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** `GYM-MOD-ACCESS`

## Contexto

El control de acceso físico requiere hardware en el gym. Los diferentes niveles de sofisticación tienen costos de hardware y complejidad de integración muy distintos. Necesitamos una estrategia que permita lanzar rápido sin hardware especial, y evolucionar hacia soluciones enterprise.

## Decisión

**Tres fases de implementación con interfaz unificada:**

```typescript
interface AccessCredential {
  type: 'QR' | 'NFC' | 'FACIAL' | 'PIN' | 'BLE';
  validate(payload: string, context: AccessContext): Promise<ValidationResult>;
}
```

### Fase 1 — QR Propio (MVP)
**Hardware requerido:** Solo un smartphone o tablet con cámara (puede ser el teléfono del recepcionista)
**Cómo funciona:**
- El miembro muestra el QR en su app
- El recepcionista escanea con cualquier lector QR o tablet con la web admin
- El backend valida el QR (HMAC-SHA256, TTL 60s, nonce anti-replay)

**Payload del QR:**
```json
{
  "memberId": "uuid",
  "gymId": "uuid",
  "timestamp": 1720000000,
  "expiresAt": 1720000060,
  "nonce": "random-16-bytes",
  "signature": "hmac-sha256-hex"
}
```

### Fase 2 — IoT + NFC + BLE (Growth, mes 7)
**Hardware requerido:** Raspberry Pi 4 + lector NFC (o controlador industrial IoT)
**Credenciales añadidas:**
- **NFC MIFARE DESFire EV3:** AES-128, credenciales en la tarjeta/pulsera física
- **BLE Beacon:** Phone-as-key con rotating keys cada 15 minutos
- **PIN:** 6 dígitos, bcrypt, para casos donde no hay teléfono
- **Kisi API:** Puertas inteligentes gestionadas en la nube

**Protocolo edge:**
- Raspberry Pi toma decisiones offline < 100ms
- Sincroniza con backend cada 30 segundos
- Cache de membresías activas por hasta 2 horas sin internet

### Fase 3 — Enterprise (Scale, mes 14+)
**Para grandes cadenas de gym o instalaciones de alta seguridad:**
- **Reconocimiento facial:** InsightFace, embeddings 512-dim en pgvector, SIEMPRE local (GDPR Art.9)
- **HID global:** Integración con sistemas enterprise de control de acceso
- **Salto KS / Brivo:** Cloud-based commercial access control

### Árbol de decisión de validación (aplica a todas las fases)
```
1. ¿La credencial es válida sintácticamente? (firma, TTL) → NO: DENIED
2. ¿El miembro existe? → NO: DENIED
3. ¿La membresía está ACTIVE? → NO: DENIED (con mensaje específico)
4. ¿El pago está al día? → NO: DENIED (ir al pago)
5. ¿Hay aforo disponible? → NO: DENIED (gym lleno)
6. ¿El miembro tiene acceso a esta zona? → NO: DENIED
7. ¿El miembro está en lista negra? → SÍ: DENIED + alerta
8. ¿Es dentro del horario permitido? → NO: DENIED
→ GRANTED (abrir puerta X ms)
```

## Consecuencias

**Positivo:**
- Lanzamiento en P1 sin inversión en hardware costoso
- Evolución incremental según crecimiento del gym
- La interfaz unificada `AccessCredential` permite añadir nuevos tipos sin refactoring mayor

**Negativo:**
- QR en P1 requiere que el recepcionista escanee manualmente (no es "tap and go")
- La migración de Phase 1 a Phase 2 requiere instalación de hardware en el gym (trabajo de campo)
- Facial Recognition (P3) requiere consentimiento explícito del miembro (proceso de enrollment)
