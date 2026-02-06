import { api } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

export async function getUser(id) {
  const res = await api(`/api/users/${id}`);
  return unwrap(res);
}

export async function updateUser(id, body) {
  const res = await api(`/api/users/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(res);
}
