# ADR-008: Agentes IA con Nombre y Personalidad Configurables por Gym (White-Label)

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** `GYM-MOD-CRM-V` (ARIA), `GYM-MOD-WKT` (ZEUS)

## Contexto

ARIA y ZEUS son los nombres por defecto de los agentes IA. Sin embargo, un gym que paga por el plan elite quiere que su asistente virtual se llame con su propia marca ("FitBot de PowerGym", "Coach Max", etc.). La personalidad del agente también debe reflejar la cultura del gym.

## Decisión

Cada agente tiene configuración white-label almacenada en la tabla `gym_ai_config`:

```sql
CREATE TABLE gym_ai_config (
  gym_id                UUID PRIMARY KEY REFERENCES gyms(id),
  -- ARIA config
  aria_enabled          BOOLEAN DEFAULT TRUE,
  aria_display_name     VARCHAR(100) DEFAULT 'ARIA',
  aria_avatar_url       TEXT,
  aria_voice_id         VARCHAR(100),  -- ElevenLabs voice ID
  aria_personality      TEXT,          -- instrucciones de personalidad custom
  aria_greeting         TEXT,          -- mensaje de bienvenida custom
  -- ZEUS config
  zeus_enabled          BOOLEAN DEFAULT TRUE,
  zeus_display_name     VARCHAR(100) DEFAULT 'ZEUS',
  zeus_avatar_url       TEXT,
  zeus_voice_id         VARCHAR(100),
  zeus_personality      TEXT,
  -- Límites por plan
  aria_daily_limit      INTEGER DEFAULT 50,   -- queries/miembro/día
  zeus_daily_limit      INTEGER DEFAULT 100,
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

### Construcción del system prompt
```typescript
function buildAriaSystemPrompt(gymConfig: GymAiConfig, memberContext: object): string {
  const basePerson = `Eres ${gymConfig.aria_display_name}, el asistente virtual de ${gymConfig.gym_name}.`;
  const personality = gymConfig.aria_personality ?? DEFAULT_ARIA_PERSONALITY;
  const rules = ARIA_SAFETY_RULES; // reglas de seguridad que NO pueden ser overrideadas
  return `${basePerson}\n\n${personality}\n\n${rules}\n\nContexto del miembro: ${JSON.stringify(memberContext)}`;
}
```

### Reglas de seguridad que NO son configurables
Sin importar la personalidad custom del gym, el agente SIEMPRE:
- Se identifica como IA si el miembro pregunta directamente
- No hace diagnósticos médicos
- Deriva situaciones de emergencia física a servicios de salud
- No procesa pagos directamente (redirige al flujo de pago seguro)
- No almacena ni repite datos de tarjeta

## Alternativas consideradas

1. **Nombre hardcodeado ARIA/ZEUS:** Impide diferenciación de marca para gyms elite. Descartado.
2. **Agente completamente custom por gym (prompt completo configurable):** Riesgo de que el gym configure un agente que haga cosas peligrosas o ilegales. La solución híbrida (personalidad + reglas de seguridad inmutables) es el balance correcto.

## Consecuencias

**Positivo:**
- Gyms en plan elite tienen su propia marca de IA
- Diferenciador de venta en el mercado
- Las reglas de seguridad permanecen inmutables independientemente de la configuración

**Negativo:**
- Personalidades custom pueden producir respuestas inesperadas que el equipo GymApp no anticipó
- Testing QA debe incluir casos con personalidades custom de ejemplo
