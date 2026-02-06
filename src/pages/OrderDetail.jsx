import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrder } from '../api/orders.js';
import OrderDetailSkeleton from '../components/loaders/OrderDetailSkeleton.jsx';

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
  const total = order.total != null ? Number(order.total) : 0;
  const status = order.status || '—';
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '—';

  return (
    <div>
      <Link to="/orders" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">← Back to orders</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order {order._id?.slice(-8) ?? order._id}</h1>
      <p className="text-gray-500 text-sm mb-6">{createdAt} · {status}</p>
      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-lg">
        <ul className="space-y-2 text-gray-700">
          {items.map((item, i) => {
            const product = item.product || item;
            const name = product.name || product.title || 'Item';
            const price = product.price != null ? Number(product.price) : 0;
            const qty = item.quantity ?? 1;
            return (
              <li key={i} className="flex justify-between">
                <span>{name} × {qty}</span>
                <span>${(price * qty).toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 pt-4 border-t border-gray-200 font-medium text-gray-900">
          Total: ${total.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
