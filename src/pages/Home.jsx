import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getProducts, getProductTags } from '../api/products.js';
import ProductCard from '../components/ProductCard.jsx';
import PaginationBar from '../components/PaginationBar.jsx';
import ProductCardSkeleton from '../components/loaders/ProductCardSkeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';

const PRODUCTS_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 400;
const FETCH_THROTTLE_MS = 300;
const PLATFORMS = ['PC', 'PS5', 'XBOX', 'SWITCH'];
const DEFAULT_TAGS_VISIBLE = 6;

export default function Home() {
  const { user, isAdmin } = useAuth();
  const { refreshCart, totalItems } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [platform, setPlatform] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const searchQuery = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);
  const lastFetchTimeRef = useRef(0);
  const prevSearchRef = useRef(searchQuery);
  const prevFiltersRef = useRef({ platform, selectedTag });

  useEffect(() => {
    if (user) refreshCart();
  }, [user, refreshCart]);

  useEffect(() => {
    getProductTags().then(setAllTags).catch(() => {});
  }, []);

  useEffect(() => {
    const searchJustChanged = prevSearchRef.current !== searchQuery;
    const filtersChanged =
      prevFiltersRef.current.platform !== platform ||
      prevFiltersRef.current.selectedTag !== selectedTag;
    if (searchJustChanged) {
      prevSearchRef.current = searchQuery;
    }
    if (filtersChanged) {
      prevFiltersRef.current = { platform, selectedTag };
      setPage(1);
    }
    const pageToFetch = searchJustChanged || filtersChanged ? 1 : page;

    let cancelled = false;
    const cleanup = () => { cancelled = true; };

    const params = {
      page: pageToFetch,
      limit: PRODUCTS_PER_PAGE,
      search: searchQuery || undefined,
      platform: platform || undefined,
      tag: selectedTag || undefined,
    };

    const doFetch = () => {
      setLoading(true);
      setError(null);
      getProducts(params)
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
  }, [page, searchQuery, platform, selectedTag]);

  const hasNext = products.length === PRODUCTS_PER_PAGE;
  const showCheckoutBar = user && !isAdmin && totalItems > 0;
  const hasActiveFilters = platform || selectedTag;
  const visibleTags = tagsExpanded ? allTags : allTags.slice(0, DEFAULT_TAGS_VISIBLE);
  const hasMoreTags = allTags.length > DEFAULT_TAGS_VISIBLE;

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

      <div className="mb-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Platform</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlatform('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                !platform
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  platform === p
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
          <div className="flex flex-wrap gap-2 items-center">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedTag === tag
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {tag}
              </button>
            ))}
            {hasMoreTags && (
              <button
                type="button"
                onClick={() => setTagsExpanded((e) => !e)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 bg-white hover:bg-gray-50"
              >
                {tagsExpanded ? (
                  <>Less <ChevronUp className="w-4 h-4" /></>
                ) : (
                  <>More <ChevronDown className="w-4 h-4" /></>
                )}
              </button>
            )}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => { setPlatform(''); setSelectedTag(''); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>
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
