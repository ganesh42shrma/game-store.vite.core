import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../../api/users.js';
import TableSkeleton from '../../components/loaders/TableSkeleton.jsx';

const USERS_PER_PAGE = 15;

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: USERS_PER_PAGE };
    if (roleFilter) params.role = roleFilter;
    getUsers(params)
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, roleFilter]);

  if (loading) {
    return (
      <div>
        <div className="h-8 w-32 mb-6 rounded bg-gray-200 animate-pulse" aria-hidden />
        <TableSkeleton rows={10} cols={5} />
      </div>
    );
  }
  if (error) return <div className="text-red-600 py-8">{error}</div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded px-3 py-2 text-gray-900 text-sm"
          >
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <Link
            to="/admin/users/new"
            className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800"
          >
            Add user
          </Link>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Active</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-gray-500 text-center">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {u.role ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.isActive === false ? 'No' : 'Yes'}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/users/${u._id}`}
                      className="text-gray-600 hover:text-gray-900 text-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {users.length === USERS_PER_PAGE && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
