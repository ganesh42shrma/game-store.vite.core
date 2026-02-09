import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAdminAnalytics } from '../../api/analytics.js';
import { BarChart3, DollarSign, ShoppingBag, Users, Package, AlertTriangle, Star, TrendingUp, Calendar, SlidersHorizontal } from 'lucide-react';

const COLORS = ['#0f172a', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n ?? 0);
}

function getDefaultRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(() => getDefaultRange(30));
  const [groupBy, setGroupBy] = useState('day');
  const [topLimit, setTopLimit] = useState(10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = {
      from: range.from || undefined,
      to: range.to || undefined,
      groupBy: groupBy || 'day',
      limit: Math.min(50, Math.max(1, topLimit)) || 10,
    };
    getAdminAnalytics(params)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [range.from, range.to, groupBy, topLimit]);

  if (loading && !data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const overview = data?.overview ?? {};
  const revenueByPeriod = Array.isArray(data?.revenueByPeriod) ? data.revenueByPeriod : [];
  const ordersByPeriod = Array.isArray(data?.ordersByPeriod) ? data.ordersByPeriod : [];
  const topProducts = Array.isArray(data?.topProducts) ? data.topProducts : [];
  const salesByPlatform = Array.isArray(data?.salesByPlatform) ? data.salesByPlatform : [];
  const salesByGenre = Array.isArray(data?.salesByGenre) ? data.salesByGenre : [];
  const reviewMetrics = data?.reviewMetrics ?? {};
  const userGrowth = Array.isArray(data?.userGrowth) ? data.userGrowth : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
        <BarChart3 className="w-7 h-7" />
        Analytics
      </h1>

      {/* Filters – dedicated section */}
      <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-5">
        <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
          Filters
        </div>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Date range
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">From</label>
                <input
                  type="date"
                  value={range.from ?? ''}
                  onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">To</label>
                <input
                  type="date"
                  value={range.to ?? ''}
                  onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>
              <span className="text-sm text-gray-400 hidden sm:inline">or</span>
              <div className="flex gap-2">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRange(getDefaultRange(d))}
                    className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                  >
                    Last {d} days
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 pt-1 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Group by</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 min-w-[120px]"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Top products</label>
              <select
                value={topLimit}
                onChange={(e) => setTopLimit(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 min-w-[80px]"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {error && <p className="text-amber-700 text-sm">{error}</p>}

      {/* Overview KPIs */}
      <section>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Revenue
            </div>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(overview.totalRevenue)}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </div>
            <p className="text-xl font-semibold text-gray-900">{overview.totalOrders ?? 0}</p>
            <p className="text-xs text-gray-500">{overview.completedOrders ?? 0} completed</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              Users
            </div>
            <p className="text-xl font-semibold text-gray-900">{overview.totalUsers ?? 0}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Package className="w-4 h-4" />
              Products
            </div>
            <p className="text-xl font-semibold text-gray-900">{overview.totalProducts ?? 0}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <AlertTriangle className="w-4 h-4" />
              Low stock
            </div>
            <p className="text-xl font-semibold text-gray-900">{overview.lowStockCount ?? 0}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Orders by status</div>
            <div className="text-xs text-gray-600 space-y-0.5">
              {overview.ordersByStatus && Object.entries(overview.ordersByStatus).map(([k, v]) => (
                <span key={k} className="block">{k}: {v}</span>
              ))}
              {(!overview.ordersByStatus || Object.keys(overview.ordersByStatus).length === 0) && '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Revenue by period */}
      {revenueByPeriod.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue over time</h2>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByPeriod} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} labelFormatter={(l) => `Date: ${l}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Orders by period */}
      {ordersByPeriod.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Orders over time</h2>
          <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByPeriod} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f172a" name="Orders" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top products */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top products by revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No data in range.</p>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Product</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Platform</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Qty</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-700">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((row, i) => (
                      <tr key={row.productId ?? i} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-900 truncate max-w-[180px]" title={row.title}>{row.title}</td>
                        <td className="px-4 py-2 text-gray-600">{row.platform ?? '—'}</td>
                        <td className="px-4 py-2 text-right text-gray-900">{row.quantitySold ?? 0}</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Sales by platform */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sales by platform</h2>
          {salesByPlatform.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No data in range.</p>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByPlatform}
                    dataKey="revenue"
                    nameKey="platform"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ platform, revenue }) => `${platform}: ${formatCurrency(revenue)}`}
                  >
                    {salesByPlatform.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales by genre */}
        <section>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Sales by genre</h2>
          {salesByGenre.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No data in range.</p>
          ) : (
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByGenre} layout="vertical" margin={{ left: 60, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="genre" width={55} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#f59e0b" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Review metrics & User growth */}
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Review metrics
            </h2>
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex gap-6">
              <div>
                <p className="text-sm text-gray-500">Total reviews</p>
                <p className="text-2xl font-semibold text-gray-900">{reviewMetrics.totalReviews ?? 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average rating</p>
                <p className="text-2xl font-semibold text-gray-900">{reviewMetrics.averageRating != null ? Number(reviewMetrics.averageRating).toFixed(1) : '—'}</p>
              </div>
            </div>
          </div>

          {userGrowth.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                User growth
              </h2>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowth} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} name="New users" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
