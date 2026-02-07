import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../api/addresses.js';

const emptyForm = {
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  phone: '',
  label: '',
  isDefault: false,
};

export default function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadAddresses = () => {
    getAddresses()
      .then(setAddresses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadAddresses();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const body = {
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      country: form.country.trim() || 'India',
      phone: form.phone.trim() || undefined,
      label: form.label.trim() || undefined,
      isDefault: form.isDefault,
    };
    try {
      if (editingId) {
        await updateAddress(editingId, body);
        setAddresses((prev) =>
          prev.map((a) => (a._id === editingId ? { ...a, ...body } : a))
        );
        setEditingId(null);
      } else {
        await createAddress(body);
        loadAddresses();
      }
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (addr) => {
    setEditingId(addr._id);
    setForm({
      line1: addr.line1 ?? '',
      line2: addr.line2 ?? '',
      city: addr.city ?? '',
      state: addr.state ?? '',
      pincode: addr.pincode ?? '',
      country: addr.country ?? 'India',
      phone: addr.phone ?? '',
      label: addr.label ?? '',
      isDefault: !!addr.isDefault,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to delete');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      loadAddresses();
    } catch (err) {
      setError(err.message || err.data?.message || 'Failed to set default');
    }
  };

  if (!user) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>
          Please <Link to="/" className="text-gray-900 underline">sign in</Link> to manage addresses.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-24 rounded bg-gray-100" />
        <div className="h-24 rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Addresses</h1>
        <Link to="/profile" className="text-gray-600 hover:text-gray-900 text-sm">
          ← Profile
        </Link>
      </div>
      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-3">Saved addresses</h2>
          {addresses.length === 0 ? (
            <p className="text-gray-500 text-sm">No addresses yet. Add one below.</p>
          ) : (
            <ul className="space-y-3">
              {addresses.map((addr) => (
                <li
                  key={addr._id}
                  className={`border rounded-lg p-4 ${
                    addr.isDefault ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  {addr.isDefault && (
                    <span className="text-xs font-medium text-gray-600 uppercase">Default</span>
                  )}
                  <p className="font-medium text-gray-900 mt-1">
                    {addr.label ? `${addr.label} – ` : ''}
                    {addr.line1}
                    {addr.line2 ? `, ${addr.line2}` : ''}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                  </p>
                  {addr.phone && <p className="text-gray-500 text-sm">{addr.phone}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(addr._id)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(addr)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr._id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            {editingId ? 'Edit address' : 'Add address'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-0.5">
                Label (e.g. Home, Office)
              </label>
              <input
                id="label"
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="line1" className="block text-sm font-medium text-gray-700 mb-0.5">
                Address line 1 *
              </label>
              <input
                id="line1"
                type="text"
                required
                value={form.line1}
                onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="line2" className="block text-sm font-medium text-gray-700 mb-0.5">
                Address line 2
              </label>
              <input
                id="line2"
                type="text"
                value={form.line2}
                onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-0.5">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-0.5">
                  State *
                </label>
                <input
                  id="state"
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-0.5">
                  Pincode *
                </label>
                <input
                  id="pincode"
                  type="text"
                  required
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-0.5">
                  Country
                </label>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-0.5">
                Phone
              </label>
              <input
                id="phone"
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isDefault"
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700">
                Set as default address
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Update' : 'Add address'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
