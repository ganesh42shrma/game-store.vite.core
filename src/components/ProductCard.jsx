import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { addCartItem } from '../api/cart.js';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { getQuantity, refreshCart } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const id = product._id;
  const name = product.title || product.name || 'Game';
  const price = product.price != null ? Number(product.price) : 0;
  const image = product.coverImage || product.image || product.imageUrl;
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

  return (
    <div className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm transition-shadow bg-white flex flex-col">
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
          <p className="text-gray-600 mt-1">${price.toFixed(2)}</p>
        </div>
      </Link>
      {user && (
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
