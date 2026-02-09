import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, getRelatedProducts } from '../api/products.js';
import { addCartItem } from '../api/cart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import ProductDetailSkeleton from '../components/loaders/ProductDetailSkeleton.jsx';
import ProductReviewVideos from '../components/ProductReviewVideos.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getQuantity, refreshCart } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getProduct(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Game not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRelatedProducts(id, { limit: 5 })
      .then((list) => {
        if (!cancelled) setRelated(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await addCartItem(product._id, 1);
      refreshCart();
      setMessage('Added to cart');
    } catch (err) {
      setMessage(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await addCartItem(product._id, 1);
      refreshCart();
      navigate('/cart');
    } catch (err) {
      setMessage(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }
  if (error || !product) {
    return (
      <div className="text-red-600 py-12">
        {error || 'Game not found'}
      </div>
    );
  }

  const name = product.title || product.name || 'Game';
  const price = product.price != null ? Number(product.price) : 0;
  const description = product.description || '';
  const image = product.coverImage || product.image || product.imageUrl;
  const tags = Array.isArray(product.tags) ? product.tags.filter((t) => t != null && String(t).trim()) : [];
  const inCartQty = user ? getQuantity(product._id) : 0;

  return (
    <>
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-6xl">?</span>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
              <p className="text-xl text-gray-700 mt-2">${price.toFixed(2)}</p>
              {description && (
                <p className="text-gray-600 mt-4">{description}</p>
              )}
              <div className="mt-6">
                {user && !isAdmin && inCartQty > 0 && (
                  <p className="text-sm text-gray-600 mb-2">{inCartQty} in cart</p>
                )}
                {user && !isAdmin && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={adding}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      {adding ? 'Adding…' : 'Add to cart'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBuy}
                      disabled={adding}
                      className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 hover:bg-gray-800 disabled:opacity-50"
                    >
                      Buy
                    </button>
                  </div>
                )}
                {message && (
                  <p className={`mt-2 text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-gray-600'}`}>
                    {message}
                  </p>
                )}
              </div>
            </div>
            {tags.length > 0 && (
              <div className="md:shrink-0 w-full md:w-auto grid grid-cols-2 gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    {String(tag).trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <ProductReviewVideos links={product.youtubeLinks} />
      </div>

      {related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200 w-full max-w-full">
          <div className="w-full max-w-6xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Similar games</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {related.slice(0, 5).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
