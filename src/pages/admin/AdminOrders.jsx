import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../../api/orders.js';
import PaginationBar from '../../components/PaginationBar.jsx';
import TableSkeleton from '../../components/loaders/TableSkeleton.jsx';

const ORDERS_PER_PAGE = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getOrders({ page, limit: ORDERS_PER_PAGE })
      .then(({ data, meta: m }) => {
        setOrders(Array.isArray(data) ? data : []);
        setMeta(m || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) {
    return (
      <div>
        <div className="h-8 w-44 mb-6 rounded bg-gray-200 animate-pulse" aria-hidden />
        <TableSkeleton rows={10} cols={5} />
      </div>
    );
  }
  if (error) return <div className="text-red-600 py-8">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Manage orders</h1>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Order</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-gray-500 text-center">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const total = order.totalAmount != null ? Number(order.totalAmount) : (order.total != null ? Number(order.total) : 0);
                const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—';
                const status = order.status || '—';
                return (
                  <tr key={order._id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {order._id?.slice(-8) ?? order._id}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{createdAt}</td>
                    <td className="px-4 py-3 text-gray-600">{status}</td>
                    <td className="px-4 py-3 text-gray-600">${total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
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
