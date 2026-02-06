import { Link } from 'react-router-dom';
import { updateCartItem, removeCartItem } from '../api/cart.js';

export default function CartItem({ item, onUpdate, onRemove }) {
  const product = item.product || item;
  const productId = product._id || item.productId;
  const name = product.name || product.title || 'Game';
  const price = product.price != null ? Number(product.price) : 0;
  const quantity = item.quantity ?? 1;
  const lineTotal = price * quantity;

  const handleQuantityChange = async (newQty) => {
    const qty = Math.max(0, parseInt(newQty, 10) || 0);
    if (qty === 0) {
      try {
        await removeCartItem(productId);
        onRemove?.();
      } catch {
        onUpdate?.();
      }
      return;
    }
    try {
      await updateCartItem(productId, qty);
      onUpdate?.();
    } catch {
      onUpdate?.();
    }
  };

  const handleRemove = async () => {
    try {
      await removeCartItem(productId);
      onRemove?.();
    } catch {
      onUpdate?.();
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-0">
      <div className="flex-1 min-w-0">
        <Link to={`/products/${productId}`} className="font-medium text-gray-900 hover:underline truncate block">
          {name}
        </Link>
        <p className="text-gray-600 text-sm">${price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-16 border border-gray-300 rounded px-2 py-1 text-center text-gray-900"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="text-gray-500 hover:text-red-600 text-sm"
        >
          Remove
        </button>
      </div>
      <div className="w-20 text-right font-medium text-gray-900">
        ${lineTotal.toFixed(2)}
      </div>
    </div>
  );
}
