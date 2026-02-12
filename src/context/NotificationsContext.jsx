import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications.js';
import { subscribeToAlerts } from '../api/events.js';
import { useAuth } from './AuthContext.jsx';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [latestToast, setLatestToast] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLatestToast(null);
      return;
    }
    setLoading(true);
    try {
      const { notifications: list } = await getNotifications({ limit: 20, unreadOnly: false });
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshUnreadOnly = useCallback(async () => {
    if (!user) return;
    try {
      const { notifications: list } = await getNotifications({ limit: 20, unreadOnly: true });
      setUnreadCount(list.length);
    } catch {
      // ignore
    }
  }, [user]);

  const markRead = useCallback(async (ids) => {
    const idArr = Array.isArray(ids) ? ids : [ids];
    try {
      await markAsRead(idArr);
      setNotifications((prev) =>
        prev.map((n) => (idArr.includes(n._id) ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - idArr.length));
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToAlerts((payload) => {
      const notification = {
        _id: payload.id || `live-${Date.now()}`,
        type: payload.type,
        productId: payload.productId,
        productTitle: payload.productTitle,
        title: payload.title,
        message: payload.message,
        meta: payload.meta,
        read: false,
        createdAt: payload.createdAt || new Date().toISOString(),
      };
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
      setLatestToast(notification);
      setTimeout(() => setLatestToast(null), 6000);
    });
    return unsubscribe;
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    latestToast,
    refresh,
    refreshUnreadOnly,
    markRead,
    markAllAsRead,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
