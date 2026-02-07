import { api } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

/** Creates a payment for an order. Returns { payment, mockPaymentUrl }. */
export async function createPayment({ orderId, method }) {
  const res = await api('/api/payments', {
    method: 'POST',
    body: { orderId, method },
  });
  return {
    payment: res?.data?.payment ?? res?.payment,
    mockPaymentUrl: res?.data?.mockPaymentUrl ?? res?.mockPaymentUrl,
  };
}

export async function getPayment(id) {
  const res = await api(`/api/payments/${id}`);
  return unwrap(res);
}

export async function confirmPayment(id) {
  const res = await api(`/api/payments/${id}/confirm`, {
    method: 'POST',
  });
  return unwrap(res);
}
