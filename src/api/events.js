import { BASE_URL } from './client.js';

/**
 * Full URL for the recent-purchases SSE stream.
 * EventSource doesn't use fetch, so we need the absolute URL (same origin or CORS must allow).
 */
export function getRecentPurchasesStreamUrl() {
  const base = BASE_URL || '';
  const path = '/api/events/recent-purchases';
  return base.replace(/\/$/, '') + path;
}
