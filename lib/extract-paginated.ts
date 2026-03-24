import type { AxiosResponse } from "axios";

import type { PaginatedResponse } from "@/types/pagination";

/** Normalizes Laravel-style paginated JSON (handles a few common shapes). */
export function extractPaginated<T>(
  res: AxiosResponse<unknown>,
): PaginatedResponse<T> {
  const body = res.data as Record<string, unknown>;

  let rows: T[] | undefined;
  let meta: PaginatedResponse<T>["meta"] | undefined;

  if (Array.isArray(body?.data)) {
    rows = body.data as T[];
    meta = body.meta as PaginatedResponse<T>["meta"];
  } else if (
    body?.data &&
    typeof body.data === "object" &&
    Array.isArray((body.data as { data?: unknown }).data)
  ) {
    const nested = body.data as { data: T[]; meta?: typeof meta };
    rows = nested.data;
    meta = nested.meta;
  }

  if (!rows) {
    rows = [];
  }
  if (!meta) {
    meta = { current_page: 1, last_page: 1, per_page: rows.length, total: rows.length };
  }

  return { data: rows, meta };
}
