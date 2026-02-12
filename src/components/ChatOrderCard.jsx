import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

/**
 * Compact order card for chat: shown when LLM returns orderId after buy_for_me.
 * Links to order detail page.
 */
export default function ChatOrderCard({ orderId, onNavigate }) {
  if (!orderId) return null;

  const shortId = orderId.length > 8 ? orderId.slice(-8) : orderId;

  return (
    <Link
      to={`/orders/${orderId}`}
      onClick={onNavigate}
      className="shrink-0 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
      aria-label="View order"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
        <Package className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">Order #{shortId}</p>
        <span className="text-xs text-gray-500">View order →</span>
      </div>
    </Link>
  );
}
