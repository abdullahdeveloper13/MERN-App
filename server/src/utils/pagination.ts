import type { PaginationMeta } from "./response.js";

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(
  query: Record<string, unknown>,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): Pagination {
  const rawPage = Number(query.page ?? defaults.page ?? 1);
  const rawLimit = Number(query.limit ?? defaults.limit ?? 12);
  const maxLimit = defaults.maxLimit ?? 100;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), maxLimit) : 12;

  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}
