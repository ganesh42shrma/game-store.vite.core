import { api } from './client.js';

// Backend wraps in { success, data: { _id, user, items } }
function unwrap(res) {
  return res?.data ?? res;
}

export async function getCart() {
  const res = await api('/api/cart');
  return unwrap(res);
}

export async function addCartItem(productId, quantity = 1) {
  const res = await api('/api/cart/items', {
    method: 'POST',
    body: { productId, quantity },
  });
  return unwrap(res);
}

export async function updateCartItem(productId, quantity) {
  const res = await api(`/api/cart/items/${productId}`, {
    method: 'PATCH',
    body: { quantity },
  });
  return unwrap(res);
}

export async function removeCartItem(productId) {
  const res = await api(`/api/cart/items/${productId}`, {
    method: 'DELETE',
  });
  return unwrap(res);
}

export async function clearCart() {
  return api('/api/cart', {
    method: 'DELETE',
  });
}
