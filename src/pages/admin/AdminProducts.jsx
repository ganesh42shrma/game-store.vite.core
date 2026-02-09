import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { getProducts, deleteProduct } from '../../api/products.js';
import { getSellingPrice, isOnSale } from '../../utils/productPrice.js';
import PaginationBar from '../../components/PaginationBar.jsx';
import TableSkeleton from '../../components/loaders/TableSkeleton.jsx';

const PRODUCTS_PER_PAGE = 10;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    getProducts({ page, limit: PRODUCTS_PER_PAGE })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.products ?? data?.data ?? [];
        setProducts(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const hasNext = products.length === PRODUCTS_PER_PAGE;

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-40 rounded bg-gray-200 animate-pulse" aria-hidden />
          <div className="h-10 w-28 rounded bg-gray-200 animate-pulse" aria-hidden />
        </div>
        <TableSkeleton rows={10} cols={3} />
      </div>
    );
  }
  if (error) return <div className="text-red-600 py-8">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manage games</h1>
        <Link
          to="/admin/products/new"
          className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900"
        >
          Add game
        </Link>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Price</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-gray-500 text-center">
                  No games. Add one above.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const onSale = isOnSale(p);
                const sellingPrice = getSellingPrice(p);
                const price = Number(p.price ?? 0);
                return (
                <tr key={p._id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{p.title || p.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {onSale ? (
                      <span className="flex items-center gap-1.5">
                        <span className="line-through text-gray-400">${price.toFixed(2)}</span>
                        <span>${sellingPrice.toFixed(2)}</span>
                        <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-800">Sale</span>
                      </span>
                    ) : (
                      `$${sellingPrice.toFixed(2)}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/products/${p._id}/edit`}
                        title="Edit"
                        className="p-1.5 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p._id, p.title || p.name)}
                        disabled={deleting === p._id}
                        title="Delete"
                        className="p-1.5 text-red-600 hover:text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
      {(page > 1 || hasNext) && (
        <PaginationBar
          page={page}
          hasPrev={page > 1}
          hasNext={hasNext}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
