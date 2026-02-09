import { useEffect, useState, useRef, useCallback } from 'react';
import { getRecentPurchasesStreamUrl } from '../api/events.js';
import { ShoppingBag } from 'lucide-react';

const TOAST_TTL_MS = 6000;
const MAX_VISIBLE_TOASTS = 3;
const IGNORE_EVENTS_FOR_MS = 2000;

function formatMessage(payload) {
  const { buyerName = 'Someone', country = '', productTitles = [] } = payload;
  const location = country ? ` from ${country}` : '';
  const names = Array.isArray(productTitles) && productTitles.length > 0
    ? productTitles
    : ['a game'];
  const productText = names.length === 1
    ? names[0]
    : names.length === 2
      ? `${names[0]} and ${names[1]}`
      : `${names[0]} and ${names.length - 1} more`;
  return `${buyerName}${location} purchased ${productText}`;
}

export default function RecentPurchasesToasts() {
  const [toasts, setToasts] = useState([]);
  const esRef = useRef(null);
  const connectedAtRef = useRef(null);

  const addToast = useCallback((payload) => {
    const message = formatMessage(payload);
    const id = `${payload.orderId ?? Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => {
      const next = [{ id, message, at: Date.now() }, ...prev].slice(0, MAX_VISIBLE_TOASTS);
      return next;
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    const url = getRecentPurchasesStreamUrl();
    let eventSource;

    try {
      eventSource = new EventSource(url);
      esRef.current = eventSource;
      connectedAtRef.current = Date.now();
    } catch {
      return;
    }

    eventSource.onmessage = (event) => {
      const now = Date.now();
      if (now - connectedAtRef.current < IGNORE_EVENTS_FOR_MS) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.buyerName != null || data.productTitles != null || data.orderId != null)) {
          addToast(data);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      esRef.current = null;
    };

    return () => {
      if (eventSource) eventSource.close();
      esRef.current = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none"
      aria-live="polite"
      aria-label="Recent purchases"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg bg-gray-900 text-white text-sm border border-gray-700"
        >
          <ShoppingBag className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <p className="leading-snug">{t.message}</p>
        </div>
      ))}
    </div>
  );
}
