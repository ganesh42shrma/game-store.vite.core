import { api } from './client.js';

/** @typedef {'on_sale' | 'available' | 'price_drop' | 'price_below'} TriggerType */

/**
 * List user's active product alerts.
 * @returns {Promise<{ alerts: Array<{ _id: string, productId: string, product?: object, triggerType: TriggerType, priceThreshold?: number, isActive: boolean }> }>}
 */
export async function listAlerts() {
  const res = await api('/api/alerts');
  const data = res?.data ?? res;
  return {
    alerts: Array.isArray(data?.alerts) ? data.alerts : [],
  };
}

/**
 * Create a product alert.
 * @param {string} productId - Product ID
 * @param {TriggerType} triggerType - on_sale | available | price_drop | price_below
 * @param {number} [priceThreshold] - Required for price_below
 * @returns {Promise<object>}
 */
export async function createAlert(productId, triggerType, priceThreshold) {
  const body = { productId, triggerType };
  if (priceThreshold != null && triggerType === 'price_below') {
    body.priceThreshold = Number(priceThreshold);
  }
  const res = await api('/api/alerts', {
    method: 'POST',
    body,
  });
  return res?.data ?? res;
}

/**
 * Deactivate an alert.
 * @param {string} alertId - Alert ID
 * @returns {Promise<object>}
 */
export async function deleteAlert(alertId) {
  const res = await api(`/api/alerts/${alertId}`, {
    method: 'DELETE',
  });
  return res?.data ?? res;
}
