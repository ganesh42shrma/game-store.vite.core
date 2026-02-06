import { useEffect, useState } from 'react';
import { getProducts } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ProductCardSkeleton from '../components/loaders/ProductCardSkeleton.jsx';

const PRODUCTS_PER_PAGE = 12;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProducts({ page, limit: PRODUCTS_PER_PAGE })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.products ?? data?.data ?? [];
        setProducts(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  if (loading) {
    return (
      <div>
        <div className="h-8 w-28 mb-6 rounded bg-gray-200 animate-pulse" aria-hidden />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PRODUCTS_PER_PAGE }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 py-12 text-center">
        {error}
      </div>
    );
  }

  const hasNext = products.length === PRODUCTS_PER_PAGE;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <p className="text-gray-600 col-span-full">No products yet.</p>
        ) : (
          products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        )}
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
