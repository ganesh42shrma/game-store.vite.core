import { api } from './client.js';

export async function createOrder(body = {}) {
  return api('/api/orders', {
    method: 'POST',
    body,
  });
}

/** Returns invoice for a paid order (GET /api/orders/:id/invoice). */
export async function getOrderInvoice(orderId) {
  const res = await api(`/api/orders/${orderId}/invoice`);
  return res?.data ?? res;
}

/** Returns { data: order[], meta?: { total, page, limit, totalPages } } for pagination. */
export async function getOrders(params = {}) {
  const search = new URLSearchParams(params).toString();
  const path = search ? `/api/orders?${search}` : '/api/orders';
  const res = await api(path);
  const data = Array.isArray(res?.data) ? res.data : res?.data ?? [];
  const meta = res?.meta ?? null;
  return { data, meta };
}

/** Returns single order (unwrap { data } if present). */
export async function getOrder(id) {
  const res = await api(`/api/orders/${id}`);
  return res?.data ?? res;
}

/** Admin: list all orders (requires GET /api/admin/orders on backend). Returns { data, meta }. */
export async function getAdminOrders(params = {}) {
  const search = new URLSearchParams(params).toString();
  const path = search ? `/api/admin/orders?${search}` : '/api/admin/orders';
  const res = await api(path);
  const data = Array.isArray(res?.data) ? res.data : res?.data ?? [];
  const meta = res?.meta ?? null;
  return { data, meta };
}

/** Admin: override order status (pending | completed | cancelled). */
export async function updateAdminOrderStatus(id, body) {
  const res = await api(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    body,
  });
  return res?.data ?? res;
}
