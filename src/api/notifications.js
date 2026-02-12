import { api } from './client.js';

/**
 * Fetch notifications for the authenticated user.
 * @param {{ limit?: number; unreadOnly?: boolean }} [options]
 * @returns {Promise<{ notifications: Array<{ _id: string, type: string, productId?: string, productTitle?: string, title: string, message: string, meta?: object, read: boolean, createdAt: string }> }>}
 */
export async function getNotifications(options = {}) {
  const params = new URLSearchParams();
  if (options.limit != null) params.set('limit', String(options.limit));
  if (options.unreadOnly) params.set('unreadOnly', 'true');
  const path = params.toString() ? `/api/notifications?${params}` : '/api/notifications';
  const res = await api(path);
  const data = res?.data ?? res;
  return {
    notifications: Array.isArray(data?.notifications) ? data.notifications : [],
  };
}

/**
 * Mark specific notifications as read.
 * @param {string | string[]} notificationIds
 * @returns {Promise<object>}
 */
export async function markAsRead(notificationIds) {
  const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
  const res = await api('/api/notifications/read', {
    method: 'PATCH',
    body: { notificationIds: ids },
  });
  return res?.data ?? res;
}

/**
 * Mark all notifications as read.
 * @returns {Promise<object>}
 */
export async function markAllAsRead() {
  const res = await api('/api/notifications/read-all', {
    method: 'PATCH',
  });
  return res?.data ?? res;
}
