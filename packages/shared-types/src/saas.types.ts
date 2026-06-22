export enum SaasPlan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ELITE = 'ELITE',
  ENTERPRISE = 'ENTERPRISE',
}

export const PLAN_MEMBER_LIMITS: Record<SaasPlan, number | null> = {
  [SaasPlan.STARTER]: 150,
  [SaasPlan.PRO]: 500,
  [SaasPlan.ELITE]: null, // ilimitado
  [SaasPlan.ENTERPRISE]: null, // ilimitado
};

/** Features disponibles por plan */
export const PLAN_FEATURES: Record<SaasPlan, string[]> = {
  [SaasPlan.STARTER]: [
    'memberships',
    'billing',
    'access_qr',
    'workout_basic',
    'crm_basic',
    'analytics_basic',
  ],
  [SaasPlan.PRO]: [
    'memberships',
    'billing',
    'access_qr',
    'workout_full',
    'crm_full',
    'analytics_full',
    'marketplace',
    'nutrition',
    'gamification',
    'aria_ai',
    'zeus_ai',
  ],
  [SaasPlan.ELITE]: [
    'memberships',
    'billing',
    'access_full',
    'workout_full',
    'crm_full',
    'analytics_full',
    'marketplace',
    'nutrition',
    'gamification',
    'aria_ai',
    'zeus_ai',
    'white_label',
    'classes',
    'feedback',
    'content',
  ],
  [SaasPlan.ENTERPRISE]: ['all', 'multi_location', 'api_access', 'sla', 'dedicated_support'],
};

export function planHasFeature(plan: SaasPlan, feature: string): boolean {
  const features = PLAN_FEATURES[plan];
  return features.includes('all') || features.includes(feature);
}
