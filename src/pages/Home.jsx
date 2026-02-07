import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getProducts } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ProductCardSkeleton from '../components/loaders/ProductCardSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

const PRODUCTS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 400;
const FETCH_THROTTLE_MS = 300;

export default function Home() {
  const { user, isAdmin } = useAuth();
  const { refreshCart, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const searchQuery = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const lastFetchTimeRef = useRef(0);
  const prevSearchRef = useRef(searchQuery);

  useEffect(() => {
    if (user) refreshCart();
  }, [user, refreshCart]);

  useEffect(() => {
    const searchJustChanged = prevSearchRef.current !== searchQuery;
    if (searchJustChanged) {
      prevSearchRef.current = searchQuery;
      setPage(1);
    }
    const pageToFetch = searchJustChanged ? 1 : page;

    let cancelled = false;
    const cleanup = () => { cancelled = true; };

    const doFetch = () => {
      setLoading(true);
      setError(null);
      getProducts({
        page: pageToFetch,
        limit: PRODUCTS_PER_PAGE,
        search: searchQuery || undefined,
      })
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
    };

    const now = Date.now();
    const elapsed = now - lastFetchTimeRef.current;
    const shouldThrottle = lastFetchTimeRef.current > 0 && elapsed < FETCH_THROTTLE_MS;

    if (shouldThrottle) {
      const timer = setTimeout(() => {
        lastFetchTimeRef.current = Date.now();
        doFetch();
      }, FETCH_THROTTLE_MS - elapsed);
      return () => {
        clearTimeout(timer);
        cleanup();
      };
    }

    lastFetchTimeRef.current = Date.now();
    doFetch();
    return cleanup;
  }, [page, searchQuery]);

  const hasNext = products.length === PRODUCTS_PER_PAGE;
  const showCheckoutBar = user && !isAdmin && totalItems > 0;

  return (
    <div className={showCheckoutBar ? 'pb-24' : ''}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Games</h1>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search games…"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            aria-label="Search products"
          />
        </div>
      </div>
      {error && (
        <p className="text-red-600 py-4 text-center">{error}</p>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: PRODUCTS_PER_PAGE }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.length === 0 ? (
            <p className="text-gray-600 col-span-full">No games yet.</p>
          ) : (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          )}
        </div>
      )}
      {!loading && (page > 1 || hasNext) && (
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
