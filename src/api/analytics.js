import { api } from './client.js';

function unwrap(res) {
  return res?.data ?? res;
}

/**
 * Admin analytics dashboard. Params: from (ISO date), to (ISO date), groupBy (day|week|month), limit (1-50).
 * Returns overview, revenueByPeriod, ordersByPeriod, topProducts, salesByPlatform, salesByGenre, reviewMetrics, userGrowth.
 */
export async function getAdminAnalytics(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  const search = new URLSearchParams(cleaned).toString();
  const path = search ? `/api/admin/analytics?${search}` : '/api/admin/analytics';
  const res = await api(path);
  return unwrap(res);
}
