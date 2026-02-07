import { api } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

/** User: get invoice by ID */
export async function getInvoice(id) {
  const res = await api(`/api/invoices/${id}`);
  return unwrap(res);
}

/** Admin: list invoices with pagination and filters */
export async function getAdminInvoices(params = {}) {
  const search = new URLSearchParams(params).toString();
  const path = search ? `/api/admin/invoices?${search}` : '/api/admin/invoices';
  const res = await api(path);
  const data = Array.isArray(res?.data) ? res.data : res?.data ?? [];
  const meta = res?.meta ?? null;
  return { data, meta };
}

/** Admin: get single invoice */
export async function getAdminInvoice(id) {
  const res = await api(`/api/admin/invoices/${id}`);
  return unwrap(res);
}

/** Admin: update invoice (status, notes) */
export async function updateAdminInvoice(id, body) {
  const res = await api(`/api/admin/invoices/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(res);
}
