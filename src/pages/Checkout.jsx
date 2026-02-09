import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { getCart } from '../api/cart.js';
import { getAddresses } from '../api/addresses.js';
import { createOrder } from '../api/orders.js';
import { getSellingPrice } from '../utils/productPrice.js';
import CheckoutSkeleton from '../components/loaders/CheckoutSkeleton.jsx';

const CURRENCY = '$';

export default function Checkout() {
  const { user, isAdmin } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([getCart(), getAddresses()])
      .then(([cartData, addrs]) => {
        setCart(cartData);
        setAddresses(Array.isArray(addrs) ? addrs : []);
        const defaultAddr = addrs?.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr._id);
        else if (addrs?.length) setSelectedAddressId(addrs[0]._id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, isAdmin, navigate]);

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body = selectedAddressId ? { addressId: selectedAddressId } : {};
      const res = await createOrder(body);
      const order = res?.data ?? res;
      const orderId = order?._id;
      refreshCart();
      if (orderId) {
        navigate(`/checkout/pay?orderId=${orderId}`);
      } else {
        navigate('/orders');
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (isAdmin) return null;
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

  const items = cart?.items ?? [];
  const subTotal = items.reduce((sum, item) => {
    const product = item.product || item;
    const sellingPrice = getSellingPrice(product);
    const qty = item.quantity ?? 1;
    return sum + sellingPrice * qty;
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

      {addresses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Billing address</h2>
          <div className="space-y-2">
            {addresses.map((addr) => (
              <label
                key={addr._id}
                className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer ${
                  selectedAddressId === addr._id ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr._id}
                  checked={selectedAddressId === addr._id}
                  onChange={() => setSelectedAddressId(addr._id)}
                  className="mt-1"
                />
                <div>
                  {addr.label && <span className="font-medium text-gray-900">{addr.label} – </span>}
                  <span className="text-gray-700">
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                  </span>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-gray-500">
            <Link to="/profile/addresses" className="text-gray-900 underline">Manage addresses</Link>
          </p>
        </div>
      )}

      {addresses.length === 0 && (
        <p className="mb-4 text-amber-700 text-sm">
          No address on file. <Link to="/profile/addresses" className="underline">Add an address</Link> or place order without one.
        </p>
      )}

      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-md">
        <ul className="space-y-2 text-gray-700">
          {items.map((item) => {
            const product = item.product || item;
            const name = product.name || product.title || 'Game';
            const sellingPrice = getSellingPrice(product);
            const qty = item.quantity ?? 1;
            return (
              <li key={product._id || item.productId} className="flex justify-between">
                <span>{name} × {qty}</span>
                <span>{CURRENCY}{(sellingPrice * qty).toFixed(2)}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 pt-4 border-t border-gray-200 text-gray-600 text-sm">
          Subtotal: {CURRENCY}{subTotal.toFixed(2)}. GST will be applied at order creation.
        </p>
        <p className="mt-2 font-medium text-gray-900">
          Total (approx): {CURRENCY}{subTotal.toFixed(2)}
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
