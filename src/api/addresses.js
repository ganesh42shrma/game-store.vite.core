import { api } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

export async function getAddresses() {
  const res = await api('/api/addresses');
  const data = res?.data;
  return Array.isArray(data) ? data : [];
}

export async function getAddress(id) {
  const res = await api(`/api/addresses/${id}`);
  return unwrap(res);
}

export async function createAddress(body) {
  const res = await api('/api/addresses', {
    method: 'POST',
    body,
  });
  return unwrap(res);
}

export async function updateAddress(id, body) {
  const res = await api(`/api/addresses/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(res);
}

export async function deleteAddress(id) {
  return api(`/api/addresses/${id}`, {
    method: 'DELETE',
  });
}

export async function setDefaultAddress(id) {
  const res = await api(`/api/addresses/${id}/set-default`, {
    method: 'POST',
  });
  return unwrap(res);
}
