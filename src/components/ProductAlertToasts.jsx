import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext.jsx';

export default function ProductAlertToasts() {
  const { latestToast } = useNotifications();

  if (!latestToast) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] max-w-sm pointer-events-auto"
      aria-live="polite"
      aria-label="Product alert"
    >
      <Link
        to={latestToast.productId ? `/products/${latestToast.productId}` : '/profile/alerts'}
        className="flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors"
      >
        <Bell className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <p className="font-medium text-sm">{latestToast.title}</p>
          <p className="text-sm text-amber-800 mt-0.5">{latestToast.message}</p>
        </div>
      </Link>
    </div>
  );
}
