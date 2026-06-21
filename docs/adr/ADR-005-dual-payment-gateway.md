# ADR-005: Stripe (Internacional) + MercadoPago (LATAM) como Dual Gateway

**Estado:** Aceptado
**Fecha:** Junio 2026
**Módulos afectados:** `GYM-MOD-BIL`

## Contexto

GymApp opera principalmente en LATAM (El Salvador como mercado inicial). Las tarjetas de débito/crédito locales muchas veces no son aceptadas por procesadores internacionales. Además, necesitamos cumplir con la legislación fiscal de El Salvador (DTE).

## Decisión

**Estrategia dual gateway con abstracción unificada:**

```typescript
interface PaymentGateway {
  createCustomer(data: CreateCustomerDTO): Promise<GatewayCustomer>;
  createSubscription(data: CreateSubscriptionDTO): Promise<GatewaySubscription>;
  charge(data: ChargeDTO): Promise<ChargeResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
  handleWebhook(payload: unknown, signature: string): Promise<WebhookEvent>;
}

class StripeGateway implements PaymentGateway { ... }
class MercadoPagoGateway implements PaymentGateway { ... }
```

### Stripe (primario)
- **Cuándo:** Tarjetas internacionales (Visa, Mastercard, Amex international), miembros con cuentas extranjeras
- **Por qué:** PCI-DSS Level 1, Stripe Radar (antifraude), suscripciones robustas, soporte técnico de primera clase
- **Modelo:** GymApp como Platform (Stripe Connect) para multi-tenant, o directo para cada gym

### MercadoPago (LATAM)
- **Cuándo:** Tarjetas locales de El Salvador y LATAM, pagos en efectivo vía puntos de pago
- **Por qué:** Penetración masiva en LATAM, acepta tarjetas locales que Stripe rechaza, unbanked-friendly
- **Ventaja clave:** Permite que miembros sin tarjeta de crédito paguen en puntos de pago físicos

### Selección automática de gateway
```typescript
function selectGateway(member: Member, paymentMethod: PaymentMethod): Gateway {
  if (paymentMethod.type === 'cash') return Gateway.MERCADOPAGO;
  if (member.country === 'SV' && !paymentMethod.isInternational) return Gateway.MERCADOPAGO;
  return Gateway.STRIPE; // default para tarjetas internacionales
}
```

### NUNCA almacenar datos de tarjeta
- Solo tokens del gateway (`gateway_token` en `payment_methods`)
- Formulario de tarjeta = iframe del gateway (Stripe Elements / MercadoPago Checkout Pro)
- El sistema del gym califica como PCI-DSS SAQ-A (nivel más simple)

## Alternativas consideradas

1. **Solo Stripe:** No acepta bien tarjetas locales de El Salvador. Excluye a una parte del mercado.
2. **Solo MercadoPago:** No disponible en todos los países objetivo. Stripe es superior para cobros recurrentes.
3. **PayU, Kushki (gateways locales):** Menor calidad de SDK, documentación y soporte técnico.

## Consecuencias

**Positivo:**
- Cobertura de prácticamente cualquier método de pago en LATAM
- Fallback: si Stripe falla, intentar con MercadoPago y viceversa
- Inclusión financiera: miembros sin tarjeta pueden pagar en efectivo

**Negativo:**
- Dos integraciones de webhook que mantener (Stripe + MercadoPago)
- Conciliación más compleja: transacciones en dos plataformas
- Dos conjuntos de llaves/tokens en Doppler
