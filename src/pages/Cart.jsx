import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getCart, clearCart } from '../api/cart.js';
import CartItem from '../components/CartItem.jsx';
import { getSellingPrice } from '../utils/productPrice.js';
import CartSkeleton from '../components/loaders/CartSkeleton.jsx';

export default function Cart() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emptying, setEmptying] = useState(false);

  const refresh = () => {
    if (!user) return;
    getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    refreshCart();
  };

  const handleEmptyCart = async () => {
    const cartItems = Array.isArray(cart?.items) ? cart.items : [];
    if (emptying || cartItems.length === 0) return;
    setEmptying(true);
    try {
      await clearCart();
      setCart({ items: [], user: user?.id });
      refreshCart();
    } catch (err) {
      setError(err.message || 'Failed to empty cart');
    } finally {
      setEmptying(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, isAdmin, navigate]);

  if (isAdmin) return null;
  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>Please <Link to="/" className="text-gray-900 underline">sign in</Link> to view your cart.</p>
      </div>
    );
  }

  if (loading) {
    return <CartSkeleton />;
  }
  if (error) {
    return <div className="text-red-600 py-12">{error}</div>;
  }

  const items = Array.isArray(cart?.items) ? cart.items : [];
  const total = items.reduce((sum, item) => {
    const product = item.product || item;
    const sellingPrice = getSellingPrice(product);
    const qty = item.quantity ?? 1;
    return sum + sellingPrice * qty;
  }, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Cart</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty. <Link to="/" className="text-gray-900 underline">Browse games</Link>.</p>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            {items.map((item) => {
              const product = item.product || item;
              const id = product._id || item.productId;
              return (
                <CartItem
                  key={id}
                  item={item}
                  onUpdate={refresh}
                  onRemove={refresh}
                />
              );
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-medium text-gray-900">Total: ${total.toFixed(2)}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleEmptyCart}
                disabled={emptying}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-60"
              >
                {emptying ? 'Emptying…' : 'Empty cart'}
              </button>
              <Link
                to="/checkout"
                className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 hover:bg-gray-800"
              >
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
