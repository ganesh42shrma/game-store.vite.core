import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrders } from '../api/orders.js';
import PaginationBar from '../components/PaginationBar.jsx';
import OrderCardSkeleton from '../components/loaders/OrderCardSkeleton.jsx';

const ORDERS_PER_PAGE = 10;
const CURRENCY = '$';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = { page, limit: ORDERS_PER_PAGE };
    if (statusFilter) params.status = statusFilter;
    getOrders(params)
      .then(({ data, meta: m }) => {
        setOrders(Array.isArray(data) ? data : []);
        setMeta(m || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, page, statusFilter]);

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>Please <Link to="/" className="text-gray-900 underline">sign in</Link> to view orders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="h-8 w-24 mb-6 rounded bg-gray-200 animate-pulse" aria-hidden />
        <ul className="space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </ul>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-600 py-12">{error}</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet. <Link to="/" className="text-gray-900 underline">Browse games</Link>.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const id = order._id;
            const total = order.totalAmount != null ? Number(order.totalAmount) : (order.total != null ? Number(order.total) : 0);
            const status = order.status || '—';
            const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—';
            const items = order.items ?? [];
            const summary = items.length > 0
              ? items.map((it) => it.title || it.product?.title || it.product?.name || 'Item').filter(Boolean).join(', ')
              : null;
            const paymentStatus = order.paymentStatus || '—';
            return (
              <li key={id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link to={`/orders/${id}`} className="font-medium text-gray-900 hover:underline">
                      Order {id?.slice(-8) ?? id}
                    </Link>
                    <p className="text-gray-500 text-sm mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{createdAt}</span>
                      <span className="text-gray-400">·</span>
                      <span>Order: {status}</span>
                      <span className="text-gray-400">·</span>
                      <span>
                        Payment:{' '}
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {paymentStatus}
                        </span>
                      </span>
                    </p>
                    {summary && (
                      <p className="text-gray-600 text-sm mt-1 truncate" title={summary}>
                        {items.length} item{items.length !== 1 ? 's' : ''}: {summary}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 shrink-0">{CURRENCY}{total.toFixed(2)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {meta && (meta.totalPages > 1) && (
        <PaginationBar
          page={meta.page ?? page}
          totalPages={meta.totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
