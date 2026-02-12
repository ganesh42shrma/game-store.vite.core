import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

/**
 * Compact invoice card for chat: shown when LLM returns invoiceId after buy_for_me.
 * Links to invoice view (route uses orderId).
 */
export default function ChatInvoiceCard({ orderId, invoiceId, onNavigate }) {
  if (!orderId) return null;

  return (
    <Link
      to={`/orders/${orderId}/invoice`}
      onClick={onNavigate}
      className="shrink-0 flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
      aria-label="View invoice"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">Invoice</p>
        <span className="text-xs text-gray-500">View invoice →</span>
      </div>
    </Link>
  );
}
