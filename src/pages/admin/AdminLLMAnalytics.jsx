import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAdminAnalytics } from '../../api/analytics.js';
import { Bot, MessageSquare, Cpu, Calendar, SlidersHorizontal, Hash, ArrowUpDown } from 'lucide-react';

function formatNum(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString();
}

function getDefaultRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function AdminLLMAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState(() => getDefaultRange(30));
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = {
      from: range.from || undefined,
      to: range.to || undefined,
      groupBy: groupBy || 'day',
    };
    getAdminAnalytics(params)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load LLM analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, groupBy]);

  if (loading && !data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">LLM Analytics</h1>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-200" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">LLM Analytics</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const llm = data?.llmAnalytics ?? {};
  const overview = llm.overview ?? {};
  const byAgent = Array.isArray(overview.byAgent) ? overview.byAgent : [];
  const byProvider = Array.isArray(overview.byProvider) ? overview.byProvider : [];
  const usageByPeriod = Array.isArray(llm.usageByPeriod) ? llm.usageByPeriod : [];
  const hasAny = overview.totalRequests > 0 || byAgent.length > 0 || byProvider.length > 0 || usageByPeriod.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
        <Bot className="w-7 h-7 text-gray-700" />
        LLM Analytics
      </h1>
      <p className="text-sm text-gray-600">
        Token usage and request counts for Games Q&A chat and game-creation agents. Data is recorded when agents call the LLM.
      </p>

      {/* Filters */}
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
          </div>
        </div>
      </section>

      {error && <p className="text-amber-700 text-sm">{error}</p>}

      {!hasAny && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No LLM usage data in this range yet.</p>
          <p className="text-sm mt-1">Data appears after the first chat or game-creation requests.</p>
        </div>
      )}

      {hasAny && (
        <>
          {/* Overview KPIs */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <MessageSquare className="w-4 h-4" />
                  Total requests
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatNum(overview.totalRequests)}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <ArrowUpDown className="w-4 h-4" />
                  Input tokens
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatNum(overview.totalInputTokens)}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <ArrowUpDown className="w-4 h-4" />
                  Output tokens
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatNum(overview.totalOutputTokens)}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Hash className="w-4 h-4" />
                  Total tokens
                </div>
                <p className="text-xl font-semibold text-gray-900">{formatNum(overview.totalTokens)}</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* By agent */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">By agent</h2>
              {byAgent.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No agent breakdown.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Agent</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Requests</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Input</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Output</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Total tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byAgent.map((row, i) => (
                          <tr key={row.agentType ?? i} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-900 font-medium">{row.agentType ?? '—'}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatNum(row.requests)}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatNum(row.inputTokens)}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatNum(row.outputTokens)}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">{formatNum(row.totalTokens)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            {/* By provider */}
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">By provider</h2>
              {byProvider.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No provider breakdown.</p>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Provider</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Requests</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Input</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Output</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700">Total tokens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byProvider.map((row, i) => (
                          <tr key={row.provider ?? i} className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-900 font-medium">{row.provider ?? '—'}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatNum(row.requests)}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatNum(row.inputTokens)}</td>
                            <td className="px-4 py-2 text-right text-gray-700">{formatNum(row.outputTokens)}</td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">{formatNum(row.totalTokens)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Usage over time */}
          {usageByPeriod.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Usage over time
              </h2>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageByPeriod} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => formatNum(v)} />
                    <Tooltip
                      formatter={(value, name) => [name === 'totalTokens' ? formatNum(value) : value, name === 'totalTokens' ? 'Total tokens' : name === 'requests' ? 'Requests' : name]}
                      labelFormatter={(l) => `Date: ${l}`}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="requests" stroke="#0f172a" strokeWidth={2} name="Requests" dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="totalTokens" stroke="#f59e0b" strokeWidth={2} name="Total tokens" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Token breakdown over time (optional bar chart) */}
          {usageByPeriod.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tokens by period</h2>
              <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByPeriod} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNum(v)} />
                    <Tooltip formatter={(v) => formatNum(v)} />
                    <Legend />
                    <Bar dataKey="inputTokens" fill="#3b82f6" name="Input tokens" stackId="tokens" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="outputTokens" fill="#10b981" name="Output tokens" stackId="tokens" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
