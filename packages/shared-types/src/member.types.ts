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
