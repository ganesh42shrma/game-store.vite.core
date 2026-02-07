import { api } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

/** Upload profile picture for current user. Request: multipart/form-data, field "image". Returns updated user (with profilePicture). */
export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api('/api/users/me/profile-picture', {
    method: 'POST',
    body: formData,
  });
  return unwrap(res);
}

/** Get current authenticated user (name, profilePicture, etc.). Use after login or on refresh. */
export async function getMe() {
  const res = await api('/api/users/me');
  return unwrap(res);
}

/** List users (paginated, optional filters). Returns array; no meta in standard response. */
export async function getUsers(params = {}) {
  const search = new URLSearchParams(params).toString();
  const path = search ? `/api/users?${search}` : '/api/users';
  const res = await api(path);
  return Array.isArray(res?.data) ? res.data : [];
}

export async function getUser(id) {
  const res = await api(`/api/users/${id}`);
  return unwrap(res);
}

export async function createUser(body) {
  const res = await api('/api/users', {
    method: 'POST',
    body,
  });
  return unwrap(res);
}

export async function updateUser(id, body) {
  const res = await api(`/api/users/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(res);
}

export async function deleteUser(id) {
  return api(`/api/users/${id}`, {
    method: 'DELETE',
  });
}
