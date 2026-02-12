import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BellOff, Loader2 } from 'lucide-react';
import { listAlerts, deleteAlert } from '../api/alerts.js';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications.js';

export default function MyAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [alertsRes, notifRes] = await Promise.all([
        listAlerts(),
        getNotifications({ limit: 30 }),
      ]);
      setAlerts(alertsRes.alerts);
      setNotifications(notifRes.notifications);
    } catch {
      setAlerts([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteAlert = async (alertId) => {
    setDeleting(alertId);
    try {
      await deleteAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const triggerLabel = (type, threshold) => {
    switch (type) {
      case 'on_sale':
        return 'Notify when on sale';
      case 'available':
        return 'Notify when in stock';
      case 'price_drop':
        return 'Alert on price drop';
      case 'price_below':
        return `Alert when below $${threshold ?? '?'}`;
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My alerts</h1>

      <section className="mb-10">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Active alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-sm">You have no active alerts. Add alerts from product pages or via chat.</p>
        ) : (
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li
                key={a._id}
                className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={a.productId ? `/products/${a.productId}` : '#'}
                    className="font-medium text-gray-900 hover:underline truncate block"
                  >
                    {a.product?.title ?? a.productId ?? 'Product'}
                  </Link>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {triggerLabel(a.triggerType, a.priceThreshold)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteAlert(a._id)}
                  disabled={deleting === a._id}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                >
                  {deleting === a._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BellOff className="w-4 h-4" />
                  )}
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-sm">No notifications yet.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n._id}
                className={`p-4 border rounded-lg ${!n.read ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200'}`}
              >
                <Link
                  to={n.productId ? `/products/${n.productId}` : '#'}
                  onClick={() => !n.read && handleMarkRead(n._id)}
                  className="block"
                >
                  <p className="font-medium text-gray-900">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.createdAt
                      ? new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
