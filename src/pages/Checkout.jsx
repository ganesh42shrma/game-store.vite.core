import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getCart } from '../api/cart.js';
import { createOrder } from '../api/orders.js';
import CheckoutSkeleton from '../components/loaders/CheckoutSkeleton.jsx';

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createOrder();
      navigate('/orders');
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>Please <Link to="/" className="text-gray-900 underline">sign in</Link> to checkout.</p>
      </div>
    );
  }

  if (loading) {
    return <CheckoutSkeleton />;
  }

  const items = cart?.items ?? cart ?? [];
  const total = items.reduce((sum, item) => {
    const product = item.product || item;
    const price = product.price != null ? Number(product.price) : 0;
    const qty = item.quantity ?? 1;
    return sum + price * qty;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>Your cart is empty. <Link to="/" className="text-gray-900 underline">Add items</Link> first.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Checkout</h1>
      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-md">
        <ul className="space-y-2 text-gray-700">
          {items.map((item) => {
            const product = item.product || item;
            const name = product.name || product.title || 'Game';
            const price = product.price != null ? Number(product.price) : 0;
            const qty = item.quantity ?? 1;
            return (
              <li key={product._id || item.productId} className="flex justify-between">
                <span>{name} × {qty}</span>
                <span>${(price * qty).toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 pt-4 border-t border-gray-200 font-medium text-gray-900">
          Total: ${total.toFixed(2)}
        </p>
      </div>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={submitting}
          className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
        >
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
        <Link to="/cart" className="px-4 py-2 border border-gray-300 rounded text-gray-700">
          Back to cart
        </Link>
      </div>
    </div>
  );
}
