import { useEffect, useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrder } from '../api/orders.js';
import { createPayment, getPayment, confirmPayment } from '../api/payments.js';

const CURRENCY = '$';
const PAYMENT_METHODS = [
  { value: 'mock_upi', label: 'UPI (mock)' },
  { value: 'mock_card', label: 'Card (mock)' },
  { value: 'mock_netbanking', label: 'Net banking (mock)' },
];

export default function CheckoutPay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { paymentId } = useParams();
  const orderIdFromQuery = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mock_upi');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  const orderId = order?.user ? order._id : order?.order ?? payment?.order;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    if (paymentId) {
      getPayment(paymentId)
        .then((p) => {
          if (!cancelled) {
            setPayment(p);
            const oid = typeof p?.order === 'object' ? p?.order?._id : p?.order;
            if (oid) {
              return getOrder(oid).then((o) => {
                setOrder(o);
              });
            }
            if (p?.order) setOrder({ _id: p.order });
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message || err.data?.message || 'Payment not found');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }

    if (orderIdFromQuery) {
      getOrder(orderIdFromQuery)
        .then((o) => {
          if (!cancelled) setOrder(o);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err.message || err.data?.message || 'Order not found');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => { cancelled = true; };
    }

    setError('Missing order or payment.');
    setLoading(false);
  }, [user, paymentId, orderIdFromQuery]);

  useEffect(() => {
    if (!orderIdFromQuery || !order?._id || payment != null) return;
    if (order.paymentStatus === 'paid') {
      setError('Order is already paid.');
      return;
    }

    let cancelled = false;
    createPayment({ orderId: order._id, method: paymentMethod })
      .then(({ payment: p }) => {
        if (!cancelled && p) setPayment(p);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || err.data?.message || 'Failed to create payment');
        }
      });
    return () => { cancelled = true; };
  }, [orderIdFromQuery, order?._id, order?.paymentStatus, paymentMethod]);

  const handlePayNow = async () => {
    const pid = payment?._id ?? paymentId;
    if (!pid) {
      setError('Payment not ready.');
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      await confirmPayment(pid);
      const oid = order?._id ?? payment?.order;
      navigate(oid ? `/orders/${oid}/success` : '/orders');
    } catch (err) {
      const msg = err?.data?.message || err.message;
      if (msg && msg.toLowerCase().includes('already captured')) {
        const oid = order?._id ?? payment?.order;
        navigate(oid ? `/orders/${oid}/success` : '/orders');
        return;
      }
      setError(msg || 'Payment failed');
    } finally {
      setConfirming(false);
    }
  };

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p><Link to="/" className="text-gray-900 underline">Sign in</Link> to continue payment.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-32 rounded bg-gray-100" />
      </div>
    );
  }

  if (error && !order && !payment) {
    return (
      <div>
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/orders" className="text-gray-900 underline">Go to orders</Link>
        {' · '}
        <Link to="/cart" className="text-gray-900 underline">Cart</Link>
      </div>
    );
  }

  const displayOrder = order || (payment?.order && typeof payment.order === 'object' ? payment.order : null);
  const totalAmount = displayOrder?.totalAmount ?? payment?.amount ?? 0;
  const subTotal = displayOrder?.subTotal ?? totalAmount;
  const gstAmount = displayOrder?.gstAmount ?? 0;
  const gstRate = displayOrder?.gstRate;
  const billingAddress = displayOrder?.billingAddress;
  const items = displayOrder?.items ?? [];
  const payId = payment?._id ?? paymentId;
  const isPaid = displayOrder?.paymentStatus === 'paid' || payment?.status === 'captured';

  if (isPaid) {
    const oid = displayOrder?._id ?? payment?.order;
    return (
      <div>
        <p className="text-green-600 mb-4">This order is already paid.</p>
        <Link to={oid ? `/orders/${oid}` : '/orders'} className="text-gray-900 underline">View order</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Complete payment</h1>

      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-lg space-y-4">
        {items.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-2">Order summary</h2>
            <ul className="space-y-1 text-gray-700">
              {items.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>{item.title ?? 'Item'} × {item.quantity ?? 1}</span>
                  <span>{CURRENCY}{((item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {billingAddress && (
          <div>
            <h2 className="text-sm font-medium text-gray-700 mb-1">Billing address</h2>
            <p className="text-gray-600 text-sm">
              {billingAddress.line1}
              {billingAddress.line2 ? `, ${billingAddress.line2}` : ''}<br />
              {billingAddress.city}, {billingAddress.state} {billingAddress.pincode}, {billingAddress.country}
              {billingAddress.phone && ` · ${billingAddress.phone}`}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 space-y-1">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{CURRENCY}{Number(subTotal).toFixed(2)}</span>
          </div>
          {gstRate != null && (
            <div className="flex justify-between text-gray-700">
              <span>GST ({gstRate}%)</span>
              <span>{CURRENCY}{Number(gstAmount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-gray-900 text-lg">
            <span>Total</span>
            <span>{CURRENCY}{Number(totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {!paymentId && order?.paymentStatus !== 'paid' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment method (mock)</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={handlePayNow}
          disabled={!payId || confirming}
          className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
        >
          {confirming ? 'Processing…' : 'Pay now'}
        </button>
        <Link to="/orders" className="px-4 py-2 border border-gray-300 rounded text-gray-700">
          Back to orders
        </Link>
      </div>
    </div>
  );
}
