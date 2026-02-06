import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getProducts } from '../api/products.js';

export default function Landing() {
  const navigate = useNavigate();
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [featuredGames, setFeaturedGames] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getProducts({ limit: 3 })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setFeaturedGames(list.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setFeaturedGames([]);
      });
    return () => { cancelled = true; };
  }, []);

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message || err.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2">
      {/* Left: Hero section */}
      <div className="bg-gray-100 flex items-center justify-center p-8 md:p-12 overflow-auto">
        <div className="max-w-md text-center md:text-left w-full">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            Game Store
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            Discover and buy your favorite games. Sign in to browse the catalog and manage your cart.
          </p>
          <div className="aspect-video max-w-sm mx-auto md:mx-0 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 mb-6">
            <span className="text-6xl">🎮</span>
          </div>
          {featuredGames.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-3">Featured games</p>
              <div className="grid grid-cols-3 gap-3">
                {featuredGames.map((game) => {
                  const id = game._id;
                  const title = game.title || game.name || 'Game';
                  const cover = game.coverImage || game.image || game.imageUrl;
                  return (
                    <Link
                      key={id}
                      to={`/products/${id}`}
                      className="block rounded-lg overflow-hidden border border-gray-200 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="aspect-[3/4] bg-gray-200">
                        {cover ? (
                          <img
                            src={cover}
                            alt={title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                            🎮
                          </div>
                        )}
                      </div>
                      <p className="p-2 text-xs font-medium text-gray-900 truncate text-center" title={title}>
                        {title}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex items-center justify-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign in</h2>
          <p className="text-gray-600 text-sm mb-6">Sign in to browse and buy games.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-6 text-gray-600 text-sm">
            New account? <Link to="/register" className="text-gray-900 font-medium underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
