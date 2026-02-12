import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, ShoppingBag, FileText, Users, LayoutDashboard, BarChart3, Bot } from 'lucide-react';

const iconClass = 'w-5 h-5 shrink-0';

const navItems = [
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/llm-analytics', label: 'LLM Analytics', icon: Bot },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-[70vh] gap-8">
      <aside className="w-56 shrink-0 border-r border-gray-200 pr-6">
        <Link
          to="/admin"
          className="flex items-center gap-2 text-gray-900 font-semibold mb-6"
        >
          <LayoutDashboard className={iconClass} />
          Admin
        </Link>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={iconClass} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
