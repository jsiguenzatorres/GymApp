import { SetMetadata } from '@nestjs/common';

export const PLAN_KEY = 'requiredPlans';

// Usage: @RequiresPlan('PRO', 'ELITE', 'ENTERPRISE')
export const RequiresPlan = (...plans: string[]) =>
  SetMetadata(
    PLAN_KEY,
    plans.map((p) => p.toUpperCase()),
  );
