import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { addCartItem } from '../api/cart.js';
import { getSellingPrice, isOnSale } from '../utils/productPrice.js';

export default function ProductCard({ product, variant }) {
  const { user, isAdmin } = useAuth();
  const { getQuantity, refreshCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const id = product._id;
  const name = product.title || product.name || 'Game';
  const price = product.price != null ? Number(product.price) : 0;
  const sellingPrice = getSellingPrice(product);
  const onSale = isOnSale(product);
  const image = product.coverImage || product.image || product.imageUrl;
  const shortDesc = product.shortDescription?.trim() || '';
  const tags = Array.isArray(product.tags) ? product.tags.filter((t) => t != null && String(t).trim()) : [];
  const inCartQty = user ? getQuantity(id) : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    setAdded(false);
    try {
      await addCartItem(id, 1);
      refreshCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setAdded(false);
    } finally {
      setAdding(false);
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    try {
      await addCartItem(id, 1);
      refreshCart();
      navigate('/cart');
    } catch {
      setAdding(false);
    } finally {
      setAdding(false);
    }
  };

  const isSaleSection = variant === 'sale';
  return (
    <div className={`group rounded-lg overflow-hidden transition-shadow flex flex-col relative ${
      isSaleSection
        ? 'border-2 border-amber-300 bg-amber-50/70 hover:shadow-md hover:border-amber-400'
        : 'border border-gray-200 bg-white hover:shadow-sm'
    }`}>
      {onSale && (
        <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500 text-white shadow">
          Sale
        </span>
      )}
      <Link to={`/products/${id}`} className="block flex-1 min-h-0">
        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <span className="text-gray-400 text-4xl">?</span>
          )}
        </div>
        <div className="p-4">
          <h2 className="font-medium text-gray-900 truncate">{name}</h2>
          {shortDesc && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{shortDesc}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {String(tag).trim()}
                </span>
              ))}
              {tags.length > 5 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-gray-500">
                  +{tags.length - 5}
                </span>
              )}
            </div>
          )}
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            {onSale ? (
              <>
                <span className="text-gray-400 line-through text-sm">${price.toFixed(2)}</span>
                <span className="text-gray-900 font-medium">${sellingPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-gray-900 font-medium">${sellingPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
      {user && !isAdmin && (
        <div className="p-4 pt-0 space-y-2" onClick={(e) => e.preventDefault()}>
          {inCartQty > 0 && (
            <p className="text-sm text-gray-600">
              {inCartQty} in cart
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 py-2 px-3 text-sm font-medium border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {added ? 'Added' : adding ? '…' : 'Add to cart'}
            </button>
            <button
              type="button"
              onClick={handleBuy}
              disabled={adding}
              className="flex-1 py-2 px-3 text-sm font-medium rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
            >
              Buy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
