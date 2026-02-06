import { api, BASE_URL, getToken } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

export async function getProducts(params = {}) {
  const search = new URLSearchParams(params).toString();
  const path = search ? `/api/products?${search}` : '/api/products';
  const res = await api(path);
  return unwrap(res);
}

export async function getProduct(id) {
  const res = await api(`/api/products/${id}`);
  return unwrap(res);
}

export async function createProduct(body) {
  const res = await api('/api/products', {
    method: 'POST',
    body,
  });
  return unwrap(res);
}

export async function updateProduct(id, body) {
  const res = await api(`/api/products/${id}`, {
    method: 'PATCH',
    body,
  });
  return unwrap(res);
}

export async function deleteProduct(id) {
  return api(`/api/products/${id}`, {
    method: 'DELETE',
  });
}

/** Upload product cover image (S3). multipart/form-data, field "image". */
export async function uploadProductImage(productId, file) {
  const url = `${BASE_URL}/api/products/${productId}/image`;
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(url, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave data null
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || 'Upload failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return unwrap(data);
}
