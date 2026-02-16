import { BASE_URL, getToken, api } from './client.js';

/**
 * Get chat history for a thread. Use when opening the chat to restore previous messages.
 * @param {{ threadId?: string, limit?: number }} options - thread_id (default: server uses {user_id}-chat), limit (default 20, max 50)
 * @returns {Promise<{ messages: { role: string, content: string, createdAt?: string }[], threadId: string | null }>}
 */
export async function getChatHistory(options = {}) {
  const token = getToken();
  const params = new URLSearchParams();
  if (options.threadId != null && options.threadId !== '') params.set('thread_id', options.threadId);
  if (options.limit != null) params.set('limit', String(Math.min(50, Math.max(1, options.limit))));
  const url = `${BASE_URL}/api/chat/history${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  const payload = data?.data ?? data;
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const threadId = payload?.thread_id ?? payload?.threadId ?? null;
  return { messages, threadId };
}

/**
 * List user's chat threads (max 3). Use for chat history sidebar.
 * @returns {Promise<{ threads: Array<{ threadId: string, lastMessageAt?: string }> }>}
 */
export async function getChatThreads() {
  const token = getToken();
  const url = `${BASE_URL}/api/chat/threads`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  const payload = data?.data ?? data;
  const threads = Array.isArray(payload?.threads) ? payload.threads : [];
  return { threads };
}

/**
 * Delete a chat thread and all its messages.
 * @param {string} threadId
 * @returns {Promise<{ deleted: boolean, deletedCount?: number }>}
 */
export async function deleteChatThread(threadId) {
  const res = await api(`/api/chat/threads/${threadId}`, { method: 'DELETE' });
  return res?.data ?? res;
}

/**
 * Rename a chat thread.
 * @param {string} threadId
 * @param {string} title - New title (trimmed, max 100 chars)
 * @returns {Promise<{ updated: boolean, title: string }>}
 */
export async function renameChatThread(threadId, title) {
  const res = await api(`/api/chat/threads/${threadId}`, {
    method: 'PATCH',
    body: { title: String(title).trim().slice(0, 100) },
  });
  return res?.data ?? res;
}

/**
 * Send a message to the Games Q&A agent. Returns the full reply, product IDs, and thread_id.
 * @param {string} message - User message (non-empty, max 2000 chars)
 * @param {{ threadId?: string }} options - optional thread_id to continue a conversation
 * @returns {Promise<{ message: string, productIds: string[], threadId: string | null }>}
 */
export async function sendMessage(message, options = {}) {
  const token = getToken();
  const url = `${BASE_URL}/api/chat`;
  const body = { message };
  if (options.threadId) body.thread_id = options.threadId;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  const payload = data?.data ?? data;
  return {
    message: payload?.message ?? '',
    productIds: Array.isArray(payload?.productIds) ? payload.productIds : [],
    threadId: payload?.thread_id ?? payload?.threadId ?? null,
  };
}

/**
 * Send a message and receive the reply as an SSE stream.
 * Only final-answer content is passed to onChunk. Thinking text goes to onThinking.
 * Tool call results and DB output are never exposed to the UI.
 * @param {string} message - User message
 * @param {{ threadId?: string, onChunk: (content: string) => void, onDone: (productIds: string[], threadId?: string | null, meta?: { orderId?: string, invoiceId?: string, mockPaymentUrl?: string, paymentId?: string }) => void, onThinking?: (content: string) => void, onError?: (message: string) => void }} callbacks
 */
export async function sendMessageStream(message, { threadId, newChat, onChunk, onDone, onThinking, onError }) {
  const token = getToken();
  const url = `${BASE_URL}/api/chat?stream=1`;
  const body = { message };
  if (threadId) body.thread_id = threadId;
  if (newChat) body.new_chat = true;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const errMsg = data?.message || res.statusText || 'Request failed';
    onError?.(errMsg);
    throw new Error(errMsg);
  }
  const reader = res.body?.getReader();
  if (!reader) {
    onError?.('Stream not available');
    return;
  }
  const decoder = new TextDecoder();
  let buffer = '';
  let productIds = [];
  let doneSent = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('data:')) {
          const raw = line.slice(5).trim();
          if (raw === '[DONE]' || raw === '') continue;
          try {
            const event = JSON.parse(raw);
            // Only final-answer chunks are shown as the reply. Never show tool/DB output.
            if (event.type === 'chunk' && typeof event.content === 'string') {
              onChunk(event.content);
            } else if (event.type === 'thinking' && typeof event.content === 'string') {
              onThinking?.(event.content);
            } else if (event.type === 'done') {
              productIds = Array.isArray(event.productIds) ? event.productIds : [];
              const tid = event.thread_id ?? event.threadId ?? null;
              const meta = {
                orderId: event.orderId ?? null,
                invoiceId: event.invoiceId ?? null,
                mockPaymentUrl: event.mockPaymentUrl ?? null,
                paymentId: event.paymentId ?? null,
              };
              onDone(productIds, tid, meta);
              doneSent = true;
            } else if (event.type === 'error' && event.message) {
              onError?.(event.message);
            }
            // Intentionally ignore any other event types (e.g. tool_call, tool_result)
          } catch {
            // ignore parse errors for single line
          }
        }
      }
    }
    if (!doneSent) onDone(productIds, null, {});
  } finally {
    reader.releaseLock();
  }
}
