import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { createAlert, deleteAlert, listAlerts } from '../api/alerts.js';
import { getSellingPrice, isOnSale } from '../utils/productPrice.js';

const TRIGGER_LABELS = {
  on_sale: 'Notify when on sale',
  available: 'Notify when in stock',
  price_drop: 'Alert on price drop',
  price_below: 'Alert when below',
};

export default function ProductAlerts({ product, user, isAdmin, onAlertChange }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [priceInput, setPriceInput] = useState('');
  const [showPriceInput, setShowPriceInput] = useState(false);

  const productId = product?._id;
  const hasStock = (product?.stock ?? 0) > 0;
  const onSale = isOnSale(product);
  const sellingPrice = getSellingPrice(product);

  const hasAlert = (type) => alerts.some((a) => a.productId === productId && a.triggerType === type);

  useEffect(() => {
    if (!user || isAdmin || !productId) {
      setLoading(false);
      return;
    }
    listAlerts()
      .then(({ alerts: list }) => setAlerts(list))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [user, isAdmin, productId]);

  const handleCreate = async (triggerType, priceThreshold) => {
    if (!productId) return;
    setAction(triggerType);
    setShowPriceInput(false);
    setPriceInput('');
    try {
      await createAlert(productId, triggerType, priceThreshold);
      const { alerts: list } = await listAlerts();
      setAlerts(list);
      onAlertChange?.();
    } catch {
      // error handled by parent if needed
    } finally {
      setAction(null);
    }
  };

  const handleDelete = async (alertId) => {
    setAction('delete');
    try {
      await deleteAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      onAlertChange?.();
    } catch {
      // ignore
    } finally {
      setAction(null);
    }
  };

  const handlePriceBelow = () => {
    const val = parseFloat(priceInput);
    if (!Number.isFinite(val) || val <= 0) return;
    handleCreate('price_below', val);
  };

  if (!user || isAdmin || loading) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-sm font-medium text-gray-700 mb-2">Product alerts</p>
      <div className="flex flex-wrap gap-2">
        {!hasAlert('on_sale') && (
          <button
            type="button"
            onClick={() => handleCreate('on_sale')}
            disabled={action === 'on_sale'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            {action === 'on_sale' ? 'Adding…' : TRIGGER_LABELS.on_sale}
          </button>
        )}
        {hasAlert('on_sale') && (
          <button
            type="button"
            onClick={() => handleDelete(alerts.find((a) => a.productId === productId && a.triggerType === 'on_sale')?._id)}
            disabled={action === 'delete'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-amber-200 rounded text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
          >
            <BellOff className="w-4 h-4" />
            Remove “on sale” alert
          </button>
        )}

        {!hasStock && !hasAlert('available') && (
          <button
            type="button"
            onClick={() => handleCreate('available')}
            disabled={action === 'available'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" />
            {action === 'available' ? 'Adding…' : TRIGGER_LABELS.available}
          </button>
        )}
        {!hasStock && hasAlert('available') && (
          <button
            type="button"
            onClick={() => handleDelete(alerts.find((a) => a.productId === productId && a.triggerType === 'available')?._id)}
            disabled={action === 'delete'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-amber-200 rounded text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
          >
            <BellOff className="w-4 h-4" />
            Remove “in stock” alert
          </button>
        )}

        {!hasAlert('price_below') && (
          <>
            {!showPriceInput ? (
              <button
                type="button"
                onClick={() => setShowPriceInput(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                <Bell className="w-4 h-4" />
                {TRIGGER_LABELS.price_below}
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <span className="text-sm text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 20"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePriceBelow()}
                  className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded"
                />
                <button
                  type="button"
                  onClick={handlePriceBelow}
                  disabled={!priceInput || action === 'price_below'}
                  className="px-2 py-1.5 text-sm bg-gray-900 text-white rounded disabled:opacity-50"
                >
                  Set
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPriceInput(false); setPriceInput(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
        {hasAlert('price_below') && (
          <button
            type="button"
            onClick={() => handleDelete(alerts.find((a) => a.productId === productId && a.triggerType === 'price_below')?._id)}
            disabled={action === 'delete'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-amber-200 rounded text-amber-800 bg-amber-50 hover:bg-amber-100 disabled:opacity-50"
          >
            <BellOff className="w-4 h-4" />
            Remove price alert
          </button>
        )}
      </div>
    </div>
  );
}
