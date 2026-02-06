import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrders } from '../api/orders.js';
import PaginationBar from '../components/PaginationBar.jsx';
import OrderCardSkeleton from '../components/loaders/OrderCardSkeleton.jsx';

const ORDERS_PER_PAGE = 10;

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getOrders({ page, limit: ORDERS_PER_PAGE })
      .then(({ data, meta: m }) => {
        setOrders(Array.isArray(data) ? data : []);
        setMeta(m || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, page]);

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">No orders yet. <Link to="/" className="text-gray-900 underline">Browse products</Link>.</p>
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
            return (
              <li key={id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link to={`/orders/${id}`} className="font-medium text-gray-900 hover:underline">
                      Order {id?.slice(-8) ?? id}
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">{createdAt} · {status}</p>
                    {summary && (
                      <p className="text-gray-600 text-sm mt-1 truncate" title={summary}>
                        {items.length} item{items.length !== 1 ? 's' : ''}: {summary}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-gray-900 shrink-0">${total.toFixed(2)}</p>
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
