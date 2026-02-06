import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getCart } from '../api/cart.js';
import CartItem from '../components/CartItem.jsx';
import CartSkeleton from '../components/loaders/CartSkeleton.jsx';

export default function Cart() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = () => {
    if (!user) return;
    getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

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
    const price = product.price != null ? Number(product.price) : 0;
    const qty = item.quantity ?? 1;
    return sum + price * qty;
  }, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Cart</h1>
      {items.length === 0 ? (
        <p className="text-gray-600">Your cart is empty. <Link to="/" className="text-gray-900 underline">Browse products</Link>.</p>
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
          <div className="mt-6 flex items-center justify-between">
            <p className="text-lg font-medium text-gray-900">Total: ${total.toFixed(2)}</p>
            <Link
              to="/checkout"
              className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900"
            >
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
