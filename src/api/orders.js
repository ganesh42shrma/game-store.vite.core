import { api } from './client.js';

export async function createOrder() {
  return api('/api/orders', {
    method: 'POST',
  });
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

export async function getOrder(id) {
  return api(`/api/orders/${id}`);
}

export async function updateOrder(id, body) {
  return api(`/api/orders/${id}`, {
    method: 'PATCH',
    body,
  });
}
