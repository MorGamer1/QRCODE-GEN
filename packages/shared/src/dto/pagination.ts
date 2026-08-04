import { z } from 'zod';

/**
 * `z.coerce.boolean()` is a footgun for string-sourced booleans (HTTP query params, env vars):
 * it coerces via `Boolean(str)`, and `Boolean("false")` is `true` - any non-empty string is
 * truthy - so explicitly asking for `?flag=false` (or setting `FLAG=false` in the environment)
 * ends up `true`. This parses the literal "true"/"false" strings (and tolerates an already-
 * boolean value, e.g. from a JSON body) instead.
 */
export const booleanFromString = () =>
  z.union([z.boolean(), z.enum(['true', 'false'])]).transform((v) => v === true || v === 'true');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
