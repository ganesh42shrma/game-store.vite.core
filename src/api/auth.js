import { api } from './client.js';

// Backend returns { success, data: { user, token, expiresIn } }
function unwrap(data) {
  return data?.data ?? data;
}

export async function login(email, password) {
  const raw = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  const data = unwrap(raw);
  if (data?.token) {
    localStorage.setItem('token', data.token); // JWT stored in localStorage under key "token"
  }
  return data;
}

export async function register(email, password, name) {
  const raw = await api('/api/auth/register', {
    method: 'POST',
    body: { email, password, name: name || email },
  });
  const data = unwrap(raw);
  if (data?.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
}
