import { GaEventsSource } from './analytics.service';

const WEB_APP_URL = 'test';

// utils/uuid.ts
export function getClientId(): string {
  const key = 'client_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getUTM(name: string): string {
  const usp = new URLSearchParams(location.search);
  return usp.get(name) || '';
}

export async function sendInterestToSheet(email: string, source: GaEventsSource, plan: string, event: string) {
  const body = new URLSearchParams({
    email,
    event,
    source,
    plan,
    client_id: getClientId(),
    ua: navigator.userAgent || '',
    ref: document.referrer || '',
    utm_source: getUTM('utm_source'),
    utm_medium: getUTM('utm_medium'),
    utm_campaign: getUTM('utm_campaign'),
    utm_term: getUTM('utm_term'),
    utm_content: getUTM('utm_content'),

    // Honeypot — keep empty; if filled, server ignores
    company: '',
  });

  const res = await fetch(WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
    mode: 'cors', // fine; no preflight with form-encoded
  });

  // Apps Script doesn't expose true HTTP status; parse JSON body
  const json = await res.json().catch(() => null);
  if (json && json.ok) return { ok: true };
  return { ok: false, error: json?.error || 'Unknown error' };
}
