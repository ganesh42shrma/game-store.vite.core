import { BASE_URL, getToken } from './client.js';

/**
 * Full URL for the recent-purchases SSE stream.
 * EventSource doesn't use fetch, so we need the absolute URL (same origin or CORS must allow).
 */
export function getRecentPurchasesStreamUrl() {
  const base = BASE_URL || '';
  const path = '/api/events/recent-purchases';
  return base.replace(/\/$/, '') + path;
}

/**
 * Subscribe to real-time product alert notifications via SSE.
 * Uses fetch + ReadableStream (Bearer auth required; EventSource doesn't support custom headers).
 * @param {(payload: { id: string; type: string; productId: string; productTitle: string; title: string; message: string; meta?: object; createdAt: string }) => void} onNotification
 * @returns {() => void} Abort function to unsubscribe
 */
export function subscribeToAlerts(onNotification) {
  const base = BASE_URL || '';
  const url = base.replace(/\/$/, '') + '/api/events/my-alerts';
  const token = getToken();
  if (!token) return () => {};

  const ctrl = new AbortController();
  const decoder = new TextDecoder();
  let buffer = '';

  fetch(url, {
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    signal: ctrl.signal,
  })
    .then((res) => {
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() ?? '';
          for (const block of blocks) {
            const line = block.split('\n').find((l) => l.startsWith('data: '));
            if (line) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload && typeof onNotification === 'function') onNotification(payload);
              } catch {
                // ignore malformed
              }
            }
          }
          read();
        }).catch(() => {});
      }
      read();
    })
    .catch(() => {});

  return () => ctrl.abort();
}
