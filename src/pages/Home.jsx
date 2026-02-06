import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ProductCardSkeleton from '../components/loaders/ProductCardSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

const PRODUCTS_PER_PAGE = 12;

export default function Home() {
  const { user } = useAuth();
  const { refreshCart, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user) refreshCart();
  }, [user, refreshCart]);

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
        if (!cancelled) setError(err.message || 'Failed to load games');
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
  const showCheckoutBar = user && totalItems > 0;

  return (
    <div className={showCheckoutBar ? 'pb-24' : ''}>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Games</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <p className="text-gray-600 col-span-full">No games yet.</p>
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
      {showCheckoutBar && (
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              <span className="font-medium text-gray-900">{totalItems}</span> item{totalItems !== 1 ? 's' : ''} in cart
            </p>
            <Link
              to="/checkout"
              className="shrink-0 px-6 py-3 rounded font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              Proceed to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
