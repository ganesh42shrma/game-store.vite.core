import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrder } from '../api/orders.js';
import { createRazorpayOrder, verifyRazorpayPayment } from '../api/payments.js';

const CURRENCY = '$';
const PAYMENT_METHODS = [
  { value: 'razorpay', label: 'Razorpay' },
];

export default function CheckoutPay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromQuery = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [rzData, setRzData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);

  

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

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

    setError('Missing order.');
    setLoading(false);
  }, [user, orderIdFromQuery]);

  // Removed mock payment creation: Razorpay is the only supported flow.

  // When Razorpay is selected, pre-create a Razorpay order (authenticated).
  useEffect(() => {
    let cancelled = false;
    if (paymentMethod !== 'razorpay' || !order?._id) {
      setRzData(null);
      return () => { cancelled = true; };
    }

    createRazorpayOrder({ orderId: order._id })
      .then((res) => {
        if (!cancelled) setRzData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.data?.message || err.message || 'Failed to create Razorpay order');
      });

    return () => { cancelled = true; };
  }, [paymentMethod, order?._id]);

  const handlePayNow = async () => {
    // Razorpay flow: create order, open checkout, then verify on success.
    if (paymentMethod === 'razorpay') {
      if (!order?._id) {
        setError('Order not ready.');
        return;
      }
      setConfirming(true);
      setError(null);
      try {
        const res = rzData ?? await createRazorpayOrder({ orderId: order._id });
        const { key, order: rzOrder, appOrderId } = res;

        // load Razorpay script
        await new Promise((resolve, reject) => {
          if (window.Razorpay) return resolve();
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
          document.body.appendChild(s);
        });

        const options = {
          key: key,
          amount: rzOrder.amount,
          currency: rzOrder.currency || 'INR',
          order_id: rzOrder.id,
          name: 'Game Store',
          description: `Order ${appOrderId}`,
          handler: async function (response) {
            try {
              await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                appOrderId,
              });
              navigate(`/orders/${appOrderId}/success`);
            } catch (err) {
              setError(err?.data?.message || err.message || 'Verification failed');
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
          },
          theme: { color: '#111827' },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        setError(err?.data?.message || err.message || 'Razorpay failed');
      } finally {
        setConfirming(false);
      }
      return;
    }

    // No other payment methods supported.
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

  const displayOrder = order;
  const totalAmount = displayOrder?.totalAmount ?? 0;
  const subTotal = displayOrder?.subTotal ?? totalAmount;
  const gstAmount = displayOrder?.gstAmount ?? 0;
  const gstRate = displayOrder?.gstRate;
  const billingAddress = displayOrder?.billingAddress;
  const items = displayOrder?.items ?? [];
  const isPaid = displayOrder?.paymentStatus === 'paid';

  if (isPaid) {
    const oid = displayOrder?._id;
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

        {/* Razorpay only — no payment method selector */}
      </div>

      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={handlePayNow}
          disabled={((!(rzData && rzData.order)) || confirming)}
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
