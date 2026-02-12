import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProduct } from '../api/products.js';

/**
 * Compact game card for chat: uses only productId (from API productIds field).
 * Fetches GET /api/products/:id for cover image and title; do not display raw IDs.
 */
export default function ChatGameCard({ productId, onNavigate }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    getProduct(productId)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="w-28 shrink-0 rounded-lg border border-gray-200 bg-gray-100 overflow-hidden animate-pulse">
        <div className="aspect-3/4 bg-gray-200" />
        <div className="h-3 mt-1.5 mx-2 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !product) {
    return null;
  }

  const title = product.title || product.name || 'Game';
  const coverImage = product.coverImage || product.image || product.imageUrl;

  return (
    <Link
      to={`/products/${productId}`}
      onClick={onNavigate}
      className="shrink-0 w-28 rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all block group"
      aria-label={`View ${title}`}
    >
      <div className="aspect-3/4 bg-gray-100 flex items-center justify-center overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <span className="text-gray-300 text-2xl">?</span>
        )}
      </div>
      <div className="p-1.5 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight" title={title}>
          {title}
        </p>
        <span className="text-[10px] text-gray-500 mt-0.5 block">View game →</span>
      </div>
    </Link>
  );
}
