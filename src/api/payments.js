import { api } from './client.js';

/** Create a Razorpay order for an existing app order. Returns { key, order, appOrderId } */
export async function createRazorpayOrder({ orderId }) {
  const res = await api('/api/payments/razorpay/create-order', {
    method: 'POST',
    body: { orderId },
  });
  return res?.data ?? res;
}

/** Verify/capture a Razorpay payment on the server. */
export async function verifyRazorpayPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, appOrderId }) {
  const res = await api('/api/payments/razorpay/verify', {
    method: 'POST',
    body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, appOrderId },
  });
  return res?.data ?? res;
}
