export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  GYM_OWNER = 'GYM_OWNER',
  GYM_ADMIN = 'GYM_ADMIN',
  TRAINER = 'TRAINER',
  RECEPTIONIST = 'RECEPTIONIST',
  NUTRITIONIST = 'NUTRITIONIST',
  MEMBER = 'MEMBER',
  MEMBER_TRIAL = 'MEMBER_TRIAL',
}

export const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.GYM_OWNER, UserRole.GYM_ADMIN] as const;

export const STAFF_ROLES = [
  UserRole.GYM_OWNER,
  UserRole.GYM_ADMIN,
  UserRole.TRAINER,
  UserRole.RECEPTIONIST,
  UserRole.NUTRITIONIST,
] as const;

export const MEMBER_ROLES = [UserRole.MEMBER, UserRole.MEMBER_TRIAL] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];
