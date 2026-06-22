/**
 * Enum de eventos del Event Bus interno.
 * Emisores y listeners deben usar SIEMPRE estos valores — nunca strings literales.
 */
export enum GymEvent {
  // ── Acceso físico
  MEMBER_CHECKED_IN = 'member.checked_in',
  MEMBER_ACCESS_DENIED = 'member.access_denied',
  CONTROLLER_ONLINE = 'access.controller_online',
  CONTROLLER_OFFLINE = 'access.controller_offline',
  TAMPER_ALERT = 'access.tamper_alert',

  // ── Membresías
  MEMBERSHIP_CREATED = 'membership.created',
  MEMBERSHIP_ACTIVATED = 'membership.activated',
  MEMBERSHIP_EXPIRED = 'membership.expired',
  MEMBERSHIP_FROZEN = 'membership.frozen',
  MEMBERSHIP_UNFROZEN = 'membership.unfrozen',
  MEMBERSHIP_CANCELLED = 'membership.cancelled',
  MEMBERSHIP_RENEWED = 'membership.renewed',
  MEMBERSHIP_UPGRADED = 'membership.upgraded',

  // ── Billing
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_RECOVERED = 'payment.recovered',
  INVOICE_CREATED = 'billing.invoice_created',
  DUNNING_STARTED = 'billing.dunning_started',
  SUBSCRIPTION_BLOCKED = 'billing.subscription_blocked',

  // ── Workout
  SESSION_STARTED = 'workout.session_started',
  SESSION_COMPLETED = 'workout.session_completed',
  SESSION_ABANDONED = 'workout.session_abandoned',
  PR_ACHIEVED = 'workout.pr_achieved',
  PLAN_ASSIGNED = 'workout.plan_assigned',
  PLAN_COMPLETED = 'workout.plan_completed',

  // ── CRM / Risk
  MEMBER_CREATED = 'crm.member_created',
  RISK_SCORE_UPDATED = 'crm.risk_score_updated',
  RISK_SCORE_HIGH = 'crm.risk_score_high', // > 70
  RISK_SCORE_CRITICAL = 'crm.risk_score_critical', // > 85
  LEAD_CONVERTED = 'crm.lead_converted',

  // ── Gamificación
  POINTS_EARNED = 'gamification.points_earned',
  POINTS_EXPIRED = 'gamification.points_expired',
  BADGE_UNLOCKED = 'gamification.badge_unlocked',
  LEVEL_UP = 'gamification.level_up',
  CHALLENGE_COMPLETED = 'gamification.challenge_completed',
  REFERRAL_QUALIFIED = 'gamification.referral_qualified',

  // ── Marketplace
  ORDER_PLACED = 'marketplace.order_placed',
  ORDER_COMPLETED = 'marketplace.order_completed',
  ORDER_CANCELLED = 'marketplace.order_cancelled',
  LOW_STOCK_ALERT = 'marketplace.low_stock_alert',

  // ── Citas y Staff
  APPOINTMENT_BOOKED = 'appointment.booked',
  APPOINTMENT_CONFIRMED = 'appointment.confirmed',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',

  // ── Nutrición
  NUTRITION_PLAN_ASSIGNED = 'nutrition.plan_assigned',
  NUTRITION_LOG_SUBMITTED = 'nutrition.log_submitted',
}

// ── Payloads tipados de los eventos más importantes

export interface MemberCheckedInPayload {
  gymId: string;
  memberId: string;
  doorId: string;
  credentialType: 'QR' | 'NFC' | 'FACIAL' | 'PIN' | 'BLE';
  timestamp: Date;
  accessLogId: string;
}

export interface PrAchievedPayload {
  gymId: string;
  memberId: string;
  exerciseId: string;
  exerciseName: string;
  prType: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
  value: number;
  previousValue: number;
  sessionId: string;
}

export interface PaymentSucceededPayload {
  gymId: string;
  memberId: string;
  subscriptionId: string;
  transactionId: string;
  amount: number;
  currency: string;
  gateway: 'stripe' | 'mercadopago' | 'manual';
}

export interface RiskScoreUpdatedPayload {
  gymId: string;
  memberId: string;
  newScore: number;
  previousScore: number;
  signals: Record<string, number>;
}
