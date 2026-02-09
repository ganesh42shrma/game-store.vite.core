import { api, BASE_URL, getToken } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

export async function getProducts(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const search = new URLSearchParams(cleaned).toString();
  const path = search ? `/api/products?${search}` : '/api/products';
  const res = await api(path);
  return unwrap(res);
}

/** All distinct tags across products (for admin autocomplete). */
export async function getProductTags() {
  const res = await api('/api/products/tags');
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
}

export async function getProduct(id) {
  const res = await api(`/api/products/${id}`);
  return unwrap(res);
}

/** Related products (similar games by tags). Optional params: { limit } (1–20, default 6). */
export async function getRelatedProducts(productId, params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(cleaned).toString();
  const path = query
    ? `/api/products/${productId}/related?${query}`
    : `/api/products/${productId}/related`;
  const res = await api(path);
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
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

/** List reviews for a product. Params: page, limit (max 50), sort ('createdAt' | '-createdAt'). */
export async function getProductReviews(productId, params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const query = new URLSearchParams(cleaned).toString();
  const path = query
    ? `/api/products/${productId}/reviews?${query}`
    : `/api/products/${productId}/reviews`;
  const res = await api(path);
  return unwrap(res);
}

/** Get the authenticated user's review for this product (or null). */
export async function getMyReview(productId) {
  const res = await api(`/api/products/${productId}/reviews/me`);
  return unwrap(res);
}

/** Create or update my review. Body: { rating: 1–5, comment?: string (max 2000) }. */
export async function submitReview(productId, body) {
  const res = await api(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body,
  });
  return unwrap(res);
}

/** Delete my review for this product. */
export async function deleteReview(productId) {
  return api(`/api/products/${productId}/reviews`, {
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
