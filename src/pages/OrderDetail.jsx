import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrder } from '../api/orders.js';
import OrderDetailSkeleton from '../components/loaders/OrderDetailSkeleton.jsx';

const CURRENCY = '$';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, id]);

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>Please <Link to="/" className="text-gray-900 underline">sign in</Link> to view this order.</p>
      </div>
    );
  }

  if (loading) return <OrderDetailSkeleton />;
  if (error) return <div className="text-red-600 py-12">{error}</div>;
  if (!order) return <div className="text-gray-600 py-12">Order not found.</div>;

  const items = order.items ?? order.products ?? [];
  const total = order.totalAmount != null ? Number(order.totalAmount) : (order.total != null ? Number(order.total) : 0);
  const subTotal = order.subTotal != null ? Number(order.subTotal) : total;
  const gstAmount = order.gstAmount != null ? Number(order.gstAmount) : 0;
  const gstRate = order.gstRate;
  const status = order.status || '—';
  const paymentStatus = order.paymentStatus || '—';
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '—';
  const paidAt = order.paidAt ? new Date(order.paidAt).toLocaleString() : null;
  const billingAddress = order.billingAddress;
  const isPaid = paymentStatus === 'paid';

  return (
    <div>
      <Link to="/orders" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">← Back to orders</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order {order._id?.slice(-8) ?? order._id}</h1>
      <p className="text-gray-500 text-sm mb-2">
        {createdAt} · {status}
        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
          isPaid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
        }`}>
          {paymentStatus}
        </span>
      </p>
      {paidAt && <p className="text-gray-500 text-sm mb-6">Paid at {paidAt}</p>}
      {!paidAt && <div className="mb-6" />}

      {billingAddress && Object.keys(billingAddress).length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white max-w-lg">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Billing address</h2>
          <p className="text-gray-600 text-sm">
            {billingAddress.line1}
            {billingAddress.line2 ? `, ${billingAddress.line2}` : ''}<br />
            {billingAddress.city}, {billingAddress.state} {billingAddress.pincode}, {billingAddress.country}
            {billingAddress.phone && ` · ${billingAddress.phone}`}
          </p>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-lg mb-6">
        <ul className="space-y-2 text-gray-700">
          {items.map((item, i) => {
            const product = item.product || item;
            const name = item.title ?? product?.title ?? product?.name ?? 'Item';
            const price = item.price != null ? Number(item.price) : (product?.price != null ? Number(product.price) : 0);
            const qty = item.quantity ?? 1;
            return (
              <li key={i} className="flex justify-between">
                <span>{name} × {qty}</span>
                <span>{CURRENCY}{(price * qty).toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
          {gstRate != null && (
            <>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Subtotal</span>
                <span>{CURRENCY}{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-sm">
                <span>GST ({gstRate}%)</span>
                <span>{CURRENCY}{gstAmount.toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-medium text-gray-900">
            <span>Total</span>
            <span>{CURRENCY}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {isPaid && (
        <p>
          <Link
            to={`/orders/${id}/invoice`}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 inline-block"
          >
            View invoice
          </Link>
        </p>
      )}
    </div>
  );
}
