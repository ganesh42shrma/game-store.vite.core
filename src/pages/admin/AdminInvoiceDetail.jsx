import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminInvoice, updateAdminInvoice } from '../../api/invoices.js';

const CURRENCY = '$';

export default function AdminInvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminInvoice(id)
      .then((inv) => {
        setInvoice(inv);
        setStatus(inv?.status ?? '');
        setNotes(inv?.notes ?? '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAdminInvoice(id, { status, notes });
      setInvoice((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (err) {
      setError(err.message || err.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-100" />
      </div>
    );
  }
  if (error) return <div className="text-red-600 py-8">{error}</div>;
  if (!invoice) return <div className="text-gray-600 py-8">Invoice not found.</div>;

  const addr = invoice.billingAddress || {};
  const items = invoice.items ?? [];
  const orderId = typeof invoice.order === 'object' ? invoice.order?._id : invoice.order;

  return (
    <div>
      <Link to="/admin/invoices" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">
        ← Invoices
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Invoice {invoice.invoiceNumber ?? invoice._id?.slice(-8)}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {invoice.issuedAt && `Issued ${new Date(invoice.issuedAt).toLocaleDateString()}`}
      </p>

      <div className="border border-gray-200 rounded-lg p-4 bg-white max-w-2xl mb-6">
        {Object.keys(addr).length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-1">Billing address</h2>
            <p className="text-gray-600 text-sm">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}<br />
              {addr.city}, {addr.state} {addr.pincode}, {addr.country}
              {addr.phone && ` · ${addr.phone}`}
            </p>
          </div>
        )}

        {orderId && (
          <p className="text-sm text-gray-600 mb-4">
            Order: <Link to={`/admin/orders/${orderId}`} className="text-gray-900 underline">{orderId.slice(-8)}</Link>
          </p>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-sm font-medium text-gray-700">Item</th>
              <th className="py-2 text-sm font-medium text-gray-700 text-right">Qty</th>
              <th className="py-2 text-sm font-medium text-gray-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{item.title ?? 'Item'}</td>
                <td className="py-2 text-gray-600 text-right">{item.quantity ?? 1}</td>
                <td className="py-2 text-gray-900 text-right">{CURRENCY}{Number(item.amount ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-1 text-right">
          <div className="flex justify-end gap-8">
            <span className="text-gray-600">Subtotal</span>
            <span className="w-24 text-right">{CURRENCY}{Number(invoice.subTotal ?? 0).toFixed(2)}</span>
          </div>
          {invoice.gstRate != null && (
            <div className="flex justify-end gap-8">
              <span className="text-gray-600">GST ({invoice.gstRate}%)</span>
              <span className="w-24 text-right">{CURRENCY}{Number(invoice.gstAmount ?? 0).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-end gap-8 font-medium text-gray-900">
            <span>Total</span>
            <span className="w-24 text-right">{CURRENCY}{Number(invoice.totalAmount ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && <p className="mt-4 text-gray-500 text-sm">Notes: {invoice.notes}</p>}
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Edit invoice</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label htmlFor="inv-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            id="inv-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          >
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
          </select>
        </div>
        <div>
          <label htmlFor="inv-notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            id="inv-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Update'}
        </button>
      </form>
    </div>
  );
}
