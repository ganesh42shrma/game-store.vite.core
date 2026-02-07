import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrderInvoice } from '../api/orders.js';
import { getInvoice } from '../api/invoices.js';

const CURRENCY = '$';

export default function InvoiceView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    getOrderInvoice(id)
      .then((inv) => {
        if (inv) setInvoice(inv);
        else setError('Invoice not found.');
      })
      .catch((err) => {
        if (err?.status === 404 || err?.data?.message?.toLowerCase().includes('not found')) {
          setError('Invoice not found for this order. The order may not be paid yet.');
        } else {
          setError(err.message || err.data?.message || 'Failed to load invoice');
        }
      })
      .finally(() => setLoading(false));
  }, [user, id]);

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p><Link to="/" className="text-gray-900 underline">Sign in</Link> to view invoice.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-40 rounded bg-gray-100" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div>
        <p className="text-red-600 mb-4">{error || 'Invoice not found.'}</p>
        <Link to="/orders" className="text-gray-900 underline">Back to orders</Link>
      </div>
    );
  }

  const addr = invoice.billingAddress || {};
  const items = invoice.items ?? [];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to={`/orders/${id}`} className="text-gray-600 hover:text-gray-900 text-sm">
          ← Back to order
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 border border-gray-300 rounded text-gray-700 text-sm"
        >
          Print
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg p-6 bg-white print:border-0 print:shadow-none">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Invoice</h1>
        <p className="text-gray-600 text-sm mb-6">
          {invoice.invoiceNumber ?? `Invoice #${invoice._id?.slice(-8)}`}
          {invoice.issuedAt && (
            <> · Issued {new Date(invoice.issuedAt).toLocaleDateString()}</>
          )}
        </p>

        {Object.keys(addr).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-1">Billing address</h2>
            <p className="text-gray-600 text-sm">
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}<br />
              {addr.city}, {addr.state} {addr.pincode}, {addr.country}
              {addr.phone && ` · ${addr.phone}`}
            </p>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-sm font-medium text-gray-700">Item</th>
              <th className="py-2 text-sm font-medium text-gray-700 text-right">Qty</th>
              <th className="py-2 text-sm font-medium text-gray-700 text-right">Price</th>
              <th className="py-2 text-sm font-medium text-gray-700 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 text-gray-900">{item.title ?? 'Item'}</td>
                <td className="py-2 text-gray-600 text-right">{item.quantity ?? 1}</td>
                <td className="py-2 text-gray-600 text-right">{CURRENCY}{Number(item.price ?? 0).toFixed(2)}</td>
                <td className="py-2 text-gray-900 text-right">{CURRENCY}{Number(item.amount ?? (item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-1 text-right">
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
          <div className="flex justify-end gap-8 font-medium text-gray-900 text-lg">
            <span>Total</span>
            <span className="w-24 text-right">{CURRENCY}{Number(invoice.totalAmount ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <p className="mt-6 text-gray-500 text-sm">{invoice.notes}</p>
        )}
      </div>
    </div>
  );
}
