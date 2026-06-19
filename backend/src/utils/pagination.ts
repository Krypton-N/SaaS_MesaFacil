/**
 * Helper de paginación para los listados del API.
 *
 * La paginación es OPT-IN y no rompe a los consumidores existentes:
 * - Si la petición NO envía `limit`, se devuelven todas las filas (limit = null).
 * - Si envía `limit`, se acota entre 1 y MAX_LIMIT y se aplica `offset`.
 *
 * El resultado se reporta en el campo `meta` de la respuesta, dejando `data`
 * como arreglo (compatible con el frontend actual).
 */

export const MAX_LIMIT = 100;

export interface Pagination {
  limit: number | null;
  offset: number;
}

export interface PaginationMeta {
  total: number;
  limit: number | null;
  offset: number;
}

/** Lee `limit`/`offset` de los query params y los normaliza. */
export function getPagination(query: Record<string, unknown>): Pagination {
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  let limit: number | null = null;
  if (rawLimit !== undefined && rawLimit !== '') {
    const parsed = parseInt(String(rawLimit), 10);
    if (!Number.isNaN(parsed)) {
      limit = Math.min(Math.max(parsed, 1), MAX_LIMIT);
    }
  }

  let offset = 0;
  if (rawOffset !== undefined && rawOffset !== '') {
    const parsed = parseInt(String(rawOffset), 10);
    if (!Number.isNaN(parsed)) offset = Math.max(parsed, 0);
  }

  return { limit, offset };
}
