import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrder, updateOrder } from '../../api/orders.js';
import OrderDetailSkeleton from '../../components/loaders/OrderDetailSkeleton.jsx';

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then((data) => {
        setOrder(data);
        setStatus(data.status ?? '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (status === (order?.status ?? '')) return;
    setSaving(true);
    try {
      await updateOrder(id, { status });
      setOrder((o) => (o ? { ...o, status } : null));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <OrderDetailSkeleton />;
  if (error) return <div className="text-red-600 py-8">{error}</div>;
  if (!order) return <div className="text-gray-600 py-8">Order not found.</div>;

  const items = order.items ?? order.products ?? [];
  const total = order.totalAmount != null ? Number(order.totalAmount) : (order.total != null ? Number(order.total) : 0);
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '—';

  return (
    <div>
      <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">← Orders</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order {order._id?.slice(-8) ?? order._id}</h1>
      <p className="text-gray-500 text-sm mb-6">{createdAt}</p>
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
                <span>${(price * qty).toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 pt-4 border-t border-gray-200 font-medium text-gray-900">
          Total: ${total.toFixed(2)}
        </p>
      </div>
      <form onSubmit={handleStatusSubmit} className="flex items-center gap-2 max-w-md">
        <label htmlFor="status" className="text-sm font-medium text-gray-700">Status</label>
        <input
          id="status"
          type="text"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          placeholder="e.g. pending, shipped"
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-gray-900"
        />
        <button
          type="submit"
          disabled={saving || status === (order.status ?? '')}
          className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
        >
          {saving ? 'Updating…' : 'Update'}
        </button>
      </form>
    </div>
  );
}
