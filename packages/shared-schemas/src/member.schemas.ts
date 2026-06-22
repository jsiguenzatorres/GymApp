import { z } from 'zod';

export const CreateMemberSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  birthdate: z.coerce.date().optional(),
  gender: z.enum(['M', 'F', 'X']).optional(),
  source: z.enum(['walk_in', 'referral', 'social_media', 'web', 'other']).default('walk_in'),
  referredBy: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateMemberInput = z.infer<typeof CreateMemberSchema>;

export const UpdateMemberSchema = CreateMemberSchema.partial().omit({ email: true });
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;

export const MemberSearchSchema = z.object({
  q: z.string().max(200).optional(),
  status: z
    .enum(['LEAD', 'TRIAL', 'ACTIVE', 'FREEZE', 'EXPIRED', 'PRE_CANCEL', 'CANCELLED'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type MemberSearchInput = z.infer<typeof MemberSearchSchema>;
