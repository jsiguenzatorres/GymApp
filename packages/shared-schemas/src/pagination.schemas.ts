import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export const SearchSchema = PaginationSchema.extend({
  q: z.string().max(200).optional(),
});

export type SearchInput = z.infer<typeof SearchSchema>;

export function buildPaginatedResponse<T>(data: T[], total: number, input: PaginationInput) {
  return {
    data,
    meta: {
      total,
      page: input.page,
      limit: input.limit,
      totalPages: Math.ceil(total / input.limit),
      hasNextPage: input.page * input.limit < total,
      hasPrevPage: input.page > 1,
    },
  };
}
