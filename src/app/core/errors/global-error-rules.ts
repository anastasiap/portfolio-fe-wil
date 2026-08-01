export function isGlobalError(status: number, code: string): boolean {
  if (status === 0) return true; // network
  if (status === 401) return true;
  if (status >= 500) return true;
  if (code === 'RATE_LIMIT_EXCEEDED') return true;
  return false;
}
