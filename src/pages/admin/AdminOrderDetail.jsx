import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminOrder, updateAdminOrderStatus } from '../../api/orders.js';
import OrderDetailSkeleton from '../../components/loaders/OrderDetailSkeleton.jsx';

const CURRENCY = '$';
const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminOrder(id)
      .then((data) => {
        setOrder(data);
        setStatus(data?.status ?? '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <OrderDetailSkeleton />;
  if (error) return <div className="text-red-600 py-8">{error}</div>;
  if (!order) return <div className="text-gray-600 py-8">Order not found.</div>;

  const items = order.items ?? order.products ?? [];
  const total = order.totalAmount != null ? Number(order.totalAmount) : (order.total != null ? Number(order.total) : 0);
  const subTotal = order.subTotal != null ? Number(order.subTotal) : total;
  const gstAmount = order.gstAmount != null ? Number(order.gstAmount) : 0;
  const gstRate = order.gstRate;
  const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString() : '—';
  const paymentStatus = order.paymentStatus || '—';

  return (
    <div>
      <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">← Orders</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order {order._id?.slice(-8) ?? order._id}</h1>
      <p className="text-gray-500 text-sm mb-2">
        {createdAt} · {order.status ?? '—'}
        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
          paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
        }`}>
          {paymentStatus}
        </span>
      </p>
      <div className="mb-6" />
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
        {gstRate != null && (
          <div className="mt-2 text-sm text-gray-600">
            Subtotal: {CURRENCY}{subTotal.toFixed(2)} · GST ({gstRate}%): {CURRENCY}{gstAmount.toFixed(2)}
          </div>
        )}
        <p className="mt-4 pt-4 border-t border-gray-200 font-medium text-gray-900">
          Total: {CURRENCY}{total.toFixed(2)}
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (status === (order?.status ?? '')) return;
          setSaving(true);
          setError(null);
          try {
            const updated = await updateAdminOrderStatus(id, { status });
            setOrder((o) => (o ? { ...o, status: updated?.status ?? status } : null));
          } catch (err) {
            setError(err.message || err.data?.message || 'Failed to update status');
          } finally {
            setSaving(false);
          }
        }}
        className="max-w-md space-y-2"
      >
        <h2 className="text-sm font-medium text-gray-700">Override order status</h2>
        <p className="text-gray-500 text-xs">
          Status is auto-set when payment is captured. Use this to cancel or override if needed.
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || status === (order?.status ?? '')}
            className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
          >
            {saving ? 'Updating…' : 'Update status'}
          </button>
        </div>
      </form>
    </div>
  );
}
