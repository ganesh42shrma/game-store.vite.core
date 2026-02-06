import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct } from '../api/products.js';
import { addCartItem } from '../api/cart.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProductDetailSkeleton from '../components/loaders/ProductDetailSkeleton.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
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
        if (!cancelled) setError(err.message || 'Product not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
      setMessage('Added to cart');
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
        {error || 'Product not found'}
      </div>
    );
  }

  const name = product.title || product.name || 'Product';
  const price = product.price != null ? Number(product.price) : 0;
  const description = product.description || '';
  const image = product.coverImage || product.image || product.imageUrl;

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-6xl">?</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
          <p className="text-xl text-gray-700 mt-2">${price.toFixed(2)}</p>
          {description && (
            <p className="text-gray-600 mt-4">{description}</p>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
            >
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
            {message && (
              <p className={`mt-2 text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-gray-600'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
