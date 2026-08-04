import { booleanFromString, buildPaginatedResult, paginationQuerySchema } from './pagination';

describe('booleanFromString', () => {
  const schema = booleanFromString();

  // Regression test: z.coerce.boolean() coerces via JS `Boolean(str)`, and
  // `Boolean("false")` is `true` - any non-empty string is truthy. That bug shipped in the QR
  // management page's `isArchived=false` filter, silently coercing to `true` and returning zero
  // results for the default view. See packages/shared/src/dto/pagination.ts for the fix.
  it('parses the literal string "false" as false, not true', () => {
    expect(schema.parse('false')).toBe(false);
  });

  it('parses the literal string "true" as true', () => {
    expect(schema.parse('true')).toBe(true);
  });

  it('passes through an already-boolean value unchanged', () => {
    expect(schema.parse(true)).toBe(true);
    expect(schema.parse(false)).toBe(false);
  });

  it('rejects strings that are not exactly "true" or "false"', () => {
    expect(schema.safeParse('False').success).toBe(false);
    expect(schema.safeParse('0').success).toBe(false);
    expect(schema.safeParse('1').success).toBe(false);
    expect(schema.safeParse('yes').success).toBe(false);
    expect(schema.safeParse('').success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('applies defaults when nothing is provided', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('coerces numeric strings from query params', () => {
    expect(paginationQuerySchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
  });

  it('rejects page below 1', () => {
    expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false);
  });

  it('rejects pageSize above 100', () => {
    expect(paginationQuerySchema.safeParse({ pageSize: 101 }).success).toBe(false);
  });

  it('rejects non-integer values', () => {
    expect(paginationQuerySchema.safeParse({ page: 1.5 }).success).toBe(false);
  });
});

describe('buildPaginatedResult', () => {
  it('computes totalPages by rounding up', () => {
    expect(buildPaginatedResult([1, 2, 3], 21, 1, 10).totalPages).toBe(3);
  });

  it('floors totalPages at 1 even when total is 0', () => {
    expect(buildPaginatedResult([], 0, 1, 20).totalPages).toBe(1);
  });

  it('preserves the items, page and pageSize passed in', () => {
    const result = buildPaginatedResult(['a', 'b'], 2, 4, 2);
    expect(result).toEqual({ items: ['a', 'b'], page: 4, pageSize: 2, total: 2, totalPages: 1 });
  });
});
