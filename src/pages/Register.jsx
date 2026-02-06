import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProducts } from '../api/products.js';
import DomeGallery from '../components/DomeGallery.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { user, register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [featuredGames, setFeaturedGames] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getProducts({ limit: 20 })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setFeaturedGames(list);
      })
      .catch(() => {
        if (!cancelled) setFeaturedGames([]);
      });
    return () => { cancelled = true; };
  }, []);

  const galleryImages = useMemo(() => {
    if (featuredGames.length === 0) return undefined;
    return featuredGames.map((game) => ({
      src: game.coverImage || game.image || game.imageUrl || '',
      alt: game.title || game.name || 'Game'
    })).filter((img) => img.src);
  }, [featuredGames]);

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, name || undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || err.data?.message || 'Registration failed');
    }
  };

  const LANDING_PANE_BG_LIGHT = '#e0e0e0';
  const paneBg = LANDING_PANE_BG_LIGHT;

  const subheadingText = 'Discover and buy your favorite games. Create an account to browse the catalog and manage your cart.';
  const subheadingWords = subheadingText.split(' ');

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[3fr_2fr]" style={{ backgroundColor: paneBg }}>
      {/* Left: Hero section with dome gallery (60%) */}
      <div className="flex flex-col min-h-0 overflow-hidden" style={{ backgroundColor: paneBg }}>
        <div className="shrink-0 px-6 pt-6 pb-2 md:px-8 md:pt-8 md:pb-2 text-center md:text-left">
          <motion.div
            className="mb-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0, ease: 'easeOut' }}
          >
            <img
              src="/1-removebg-preview.png"
              alt="Lobby"
              className="h-24 md:h-32 w-auto object-contain"
            />
          </motion.div>
          <motion.p
            className="text-gray-600 text-lg flex flex-wrap"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.04, delayChildren: 1.35 } },
              hidden: {}
            }}
          >
            {subheadingWords.map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-1.5"
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
        </div>
        <motion.div
          className="flex-1 min-h-0 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <DomeGallery
            images={galleryImages?.length ? galleryImages : undefined}
            fit={0.8}
            minRadius={600}
            maxVerticalRotationDeg={0}
            segments={34}
            dragDampening={2}
            overlayBlurColor={paneBg}
          />
        </motion.div>
      </div>

      {/* Right: Register form (40%) */}
      <div className="flex items-center justify-center p-8 md:p-12" style={{ backgroundColor: paneBg }}>
        <motion.div
          className="w-full max-w-sm rounded-2xl border border-gray-200/80 bg-white/80 px-8 py-8 shadow-xl backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Register</h2>
          <p className="text-gray-600 text-sm mb-6">Create an account to browse and buy games.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
              />
            </div>
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-gray-600 text-sm">
            Already have an account? <Link to="/" className="text-gray-900 font-medium underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
