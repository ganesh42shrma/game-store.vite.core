import { Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div>
      <nav className="flex gap-6 mb-6 border-b border-gray-200 pb-4">
        <Link
          to="/admin/products"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Games
        </Link>
        <Link
          to="/admin/orders"
          className="text-gray-600 hover:text-gray-900 font-medium"
        >
          Orders
        </Link>
      </nav>
      <Outlet />
    </div>
  );
}
