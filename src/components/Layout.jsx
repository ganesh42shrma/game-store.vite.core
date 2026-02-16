import { Link, Outlet, useLocation } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import UserMenu from './UserMenu.jsx';
import NotificationBell from './NotificationBell.jsx';
import RecentPurchasesToasts from './RecentPurchasesToasts.jsx';
import ProductAlertToasts from './ProductAlertToasts.jsx';
import Toast from './Toast.jsx';
import ConfirmationModal from './ConfirmationModal.jsx';
import GameQAChat from './GameQAChat.jsx';

const iconClass = 'w-5 h-5 text-gray-900';

export default function Layout() {
  const { user, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isRegister = location.pathname === '/register';
  const isLandingOrRegister = isLanding || isRegister;
  const isHome = location.pathname === '/home';
  const isOrders = location.pathname.startsWith('/orders');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toast />
      <ConfirmationModal />
      <RecentPurchasesToasts />
      <ProductAlertToasts />
      {!isLandingOrRegister && (
        <header className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={user ? '/home' : '/'} className="flex items-center">
              <img
                src="/1-removebg-preview.png"
                alt="Lobby"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <nav className="flex items-center gap-6">
              {user ? (
                <>
                  {!isHome && (
                    <Link to="/home" className="text-gray-900 hover:text-gray-700">
                      Home
                    </Link>
                  )}
                  {!isAdmin && (
                    <>
                      <Link to="/cart" className="flex items-center gap-1.5 text-gray-900 hover:text-gray-700" title="Cart">
                        <span className="relative inline-flex">
                          <ShoppingCart className={iconClass} />
                          {totalItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-gray-900 text-white text-xs font-medium">
                              {totalItems > 99 ? '99+' : totalItems}
                            </span>
                          )}
                        </span>
                        <span className="sr-only md:not-sr-only md:inline">Cart</span>
                      </Link>
                      <Link to="/orders" className={`flex items-center gap-1.5 ${isOrders ? 'text-gray-900 font-medium' : 'text-gray-900 hover:text-gray-700'}`} title="Orders">
                        <Package className={iconClass} />
                        <span className="sr-only md:not-sr-only md:inline">Orders</span>
                      </Link>
                      <NotificationBell />
                    </>
                  )}
                  {isAdmin && (
                    <Link to="/admin/products" className="text-gray-900 hover:text-gray-700">
                      Admin
                    </Link>
                  )}
                  <UserMenu />
                </>
              ) : (
                <>
                  <Link to="/" className="text-gray-900 hover:text-gray-700">
                    Sign in
                  </Link>
                  <Link to="/register" className="text-gray-900 hover:text-gray-700">
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
      )}
      <main className={isLandingOrRegister ? 'flex-1 w-full p-0 min-h-0 flex' : 'flex-1 max-w-6xl w-full mx-auto px-4 py-8'}>
        <Outlet />
      </main>
      {user && !isLandingOrRegister && <GameQAChat />}
      {user && (
        <footer className="mt-auto border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link to="/home" className="text-lg font-semibold text-gray-900">
                Lobby
              </Link>
              <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
                <Link to="/home" className="hover:text-gray-900">Home</Link>
                {!isAdmin && (
                  <>
                <Link to="/cart" className="hover:text-gray-900">Cart</Link>
                <Link to="/orders" className="hover:text-gray-900">Orders</Link>
                <Link to="/profile/alerts" className="hover:text-gray-900">My alerts</Link>
                  </>
                )}
                <Link to="/profile" className="hover:text-gray-900">Profile</Link>
                {isAdmin && (
                  <Link to="/admin/products" className="hover:text-gray-900">Admin</Link>
                )}
              </nav>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-gray-500 text-sm">
              © {new Date().getFullYear()} Lobby. All rights reserved.
            </div>
          </div>
        </footer>
      )}
      {!user && (
        <footer className="mt-auto border-t border-gray-200 py-4">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Lobby. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
