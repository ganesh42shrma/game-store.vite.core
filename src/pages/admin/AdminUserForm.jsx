import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUser, createUser, updateUser, deleteUser } from '../../api/users.js';

const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const emptyForm = { name: '', email: '', password: '', role: 'user', isActive: true };

export default function AdminUserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isNew) return;
    getUser(id)
      .then((u) => {
        setUser(u);
        setForm({
          name: u?.name ?? '',
          email: u?.email ?? '',
          password: '',
          role: u?.role ?? 'user',
          isActive: u?.isActive !== false,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (isNew) {
        const trimmedName = form.name.trim();
        if (!trimmedName) {
          setError('Name is required.');
          setSaving(false);
          return;
        }
        const body = {
          name: trimmedName,
          email: form.email.trim(),
          password: form.password.trim(),
          role: form.role,
        };
        const created = await createUser(body);
        navigate(`/admin/users/${created._id}`, { replace: true });
      } else {
        const trimmedName = form.name.trim();
        if (!trimmedName) {
          setError('Name is required.');
          setSaving(false);
          return;
        }
        const body = {
          name: trimmedName,
          email: form.email.trim() || undefined,
          role: form.role,
          isActive: form.isActive,
        };
        if (form.password.trim()) body.password = form.password.trim();
        const updated = await updateUser(id, body);
        setUser(updated);
      }
    } catch (err) {
      setError(err.message || err.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(id);
      navigate('/admin/users', { replace: true });
    } catch (err) {
      setError(err.message || err.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
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
  if (!isNew && error && !user) return <div className="text-red-600 py-8">{error}</div>;

  return (
    <div>
      <Link to="/admin/users" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">
        ← Users
      </Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {isNew ? 'Add user' : 'Edit user'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label htmlFor="user-name" className="block text-sm font-medium text-gray-700 mb-1">Name (required)</label>
          <input
            id="user-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="user-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="user-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password {isNew ? '' : '(leave blank to keep current)'}
          </label>
          <input
            id="user-password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required={isNew}
            minLength={6}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            id="user-role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {!isNew && (
          <div className="flex items-center gap-2">
            <input
              id="user-isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <label htmlFor="user-isActive" className="text-sm text-gray-700">Active</label>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create user' : 'Update'}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete user'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
