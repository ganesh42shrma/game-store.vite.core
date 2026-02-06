import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { getCart } from '../api/cart.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);

  const refreshCart = useCallback(() => {
    if (!user) return;
    getCart()
      .then(setCart)
      .catch(() => setCart(null));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCart(null);
      return;
    }
    getCart()
      .then(setCart)
      .catch(() => setCart(null));
  }, [user]);

  const totalItems = useMemo(() => {
    const items = cart?.items ?? [];
    return items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
  }, [cart]);

  const getQuantity = useCallback((productId) => {
    const items = cart?.items ?? [];
    const item = items.find((i) => (i.product?._id ?? i.productId) === productId);
    return item ? (item.quantity ?? 0) : 0;
  }, [cart]);

  const value = user
    ? { cart, refreshCart, getQuantity, totalItems }
    : { cart: null, refreshCart: () => {}, getQuantity: () => 0, totalItems: 0 };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
