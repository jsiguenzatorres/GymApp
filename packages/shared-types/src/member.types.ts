export enum PaymentStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentType {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  STRIPE = 'STRIPE',
  MERCADOPAGO = 'MERCADOPAGO',
  OTHER = 'OTHER',
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PaymentType.CASH]: 'Efectivo',
  [PaymentType.CARD]: 'Tarjeta (terminal)',
  [PaymentType.BANK_TRANSFER]: 'Transferencia',
  [PaymentType.STRIPE]: 'Stripe',
  [PaymentType.MERCADOPAGO]: 'MercadoPago',
  [PaymentType.OTHER]: 'Otro',
};

export enum BillingFrequency {
  ONE_TIME = 'ONE_TIME',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
}

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  [BillingFrequency.ONE_TIME]: 'Una vez',
  [BillingFrequency.WEEKLY]: 'Semanal',
  [BillingFrequency.MONTHLY]: 'Mensual',
  [BillingFrequency.QUARTERLY]: 'Trimestral',
  [BillingFrequency.SEMI_ANNUAL]: 'Semestral',
  [BillingFrequency.ANNUAL]: 'Anual',
};

export enum MembershipStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum MemberStatus {
  LEAD = 'LEAD',
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  FREEZE = 'FREEZE',
  EXPIRED = 'EXPIRED',
  PRE_CANCEL = 'PRE_CANCEL',
  CANCELLED = 'CANCELLED',
}

export enum LoyaltyLevel {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  ELITE = 'elite',
}

/** Rangos de FitCoins (lifetime) para cada nivel */
export const LOYALTY_THRESHOLDS: Record<LoyaltyLevel, number> = {
  [LoyaltyLevel.BRONZE]: 0,
  [LoyaltyLevel.SILVER]: 1_000,
  [LoyaltyLevel.GOLD]: 5_000,
  [LoyaltyLevel.PLATINUM]: 15_000,
  [LoyaltyLevel.ELITE]: 30_000,
};

export function getLoyaltyLevel(lifetimePoints: number): LoyaltyLevel {
  if (lifetimePoints >= LOYALTY_THRESHOLDS[LoyaltyLevel.ELITE]) return LoyaltyLevel.ELITE;
  if (lifetimePoints >= LOYALTY_THRESHOLDS[LoyaltyLevel.PLATINUM]) return LoyaltyLevel.PLATINUM;
  if (lifetimePoints >= LOYALTY_THRESHOLDS[LoyaltyLevel.GOLD]) return LoyaltyLevel.GOLD;
  if (lifetimePoints >= LOYALTY_THRESHOLDS[LoyaltyLevel.SILVER]) return LoyaltyLevel.SILVER;
  return LoyaltyLevel.BRONZE;
}
