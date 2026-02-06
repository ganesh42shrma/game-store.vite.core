const BASE_URL = process.env.NODE_ENV === "development" ? import.meta.env.VITE_API_URL_DEV : import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body != null && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const config = {
    ...options,
    headers,
  };
  if (config.body != null && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave data null
  }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export { BASE_URL, getToken };
