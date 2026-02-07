import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminInvoices } from '../../api/invoices.js';
import PaginationBar from '../../components/PaginationBar.jsx';
import TableSkeleton from '../../components/loaders/TableSkeleton.jsx';

const INVOICES_PER_PAGE = 10;

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', from: '', to: '' });

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: INVOICES_PER_PAGE };
    if (filters.status) params.status = filters.status;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    getAdminInvoices(params)
      .then(({ data, meta: m }) => {
        setInvoices(Array.isArray(data) ? data : []);
        setMeta(m || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, filters.status, filters.from, filters.to]);

  const applyFilters = () => {
    setPage(1);
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-44 mb-6 rounded bg-gray-200 animate-pulse" aria-hidden />
        <TableSkeleton rows={10} cols={6} />
      </div>
    );
  }
  if (error) return <div className="text-red-600 py-8">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Invoices</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm"
          placeholder="To"
        />
        <button
          type="button"
          onClick={applyFilters}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm"
        >
          Apply
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Invoice</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Order</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">User</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Issued</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-gray-500 text-center">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const orderId = typeof inv.order === 'object' ? inv.order?._id : inv.order;
                const userObj = typeof inv.user === 'object' ? inv.user : null;
                const userLabel = userObj ? (userObj.email || userObj.name || inv.user) : (inv.user ?? '—');
                const total = inv.totalAmount != null ? Number(inv.totalAmount) : 0;
                const issuedAt = inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : '—';
                return (
                  <tr key={inv._id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {inv.invoiceNumber ?? inv._id?.slice(-8)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {orderId ? (
                        <Link to={`/admin/orders/${orderId}`} className="text-gray-900 hover:underline">
                          {orderId.slice(-8)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{userLabel}</td>
                    <td className="px-4 py-3 text-gray-600">${total.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        inv.status === 'issued' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {inv.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{issuedAt}</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/invoices/${inv._id}`}
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
