import { z } from 'zod';

export const CreateGymSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  timezone: z.string().default('America/El_Salvador'),
  country: z.string().length(2).default('SV'),
  currency: z.string().length(3).default('USD'),
  taxId: z.string().max(20).optional(),
  legalName: z.string().max(200).optional(),
});

export type CreateGymInput = z.infer<typeof CreateGymSchema>;

export const UpdateGymSchema = CreateGymSchema.partial().omit({ slug: true });
export type UpdateGymInput = z.infer<typeof UpdateGymSchema>;
