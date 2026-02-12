import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext.jsx';

const iconClass = 'w-5 h-5 text-gray-900';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleNotificationClick = (n) => {
    if (!n.read) markRead(n._id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-gray-900 hover:text-gray-700"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span className="relative inline-flex">
          <Bell className={iconClass} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </span>
        <span className="sr-only md:not-sr-only md:inline">Alerts</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-medium text-gray-900">Product alerts</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-72">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 ${!n.read ? 'bg-amber-50/50' : ''}`}
                >
                  <Link
                    to={n.productId ? `/products/${n.productId}` : '/profile/alerts'}
                    onClick={() => handleNotificationClick(n)}
                    className="block"
                  >
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </Link>
                </div>
              ))
            )}
          </div>
          <Link
            to="/profile/alerts"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-center text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-100"
          >
            My alerts
          </Link>
        </div>
      )}
    </div>
  );
}
