/** Pull a readable message out of an axios error (handles class-validator arrays). */
export function apiErr(err: unknown, fallback = 'Something went wrong.'): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  return m ?? fallback;
}
