import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame } from '../api/games.js';
import { addCartItem } from '../api/cart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import GameDetailSkeleton from '../components/loaders/GameDetailSkeleton.jsx';
import GameReviewVideos from '../components/GameReviewVideos.jsx';

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { getQuantity, refreshCart } = useCart();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getGame(id)
      .then((data) => {
        if (!cancelled) setGame(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Game not found');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await addCartItem(game._id, 1);
      refreshCart();
      setMessage('Added to cart');
    } catch (err) {
      setMessage(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await addCartItem(game._id, 1);
      refreshCart();
      navigate('/cart');
    } catch (err) {
      setMessage(err.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <GameDetailSkeleton />;
  }
  if (error || !game) {
    return (
      <div className="text-red-600 py-12">
        {error || 'Game not found'}
      </div>
    );
  }

  const name = game.title || game.name || 'Game';
  const price = game.price != null ? Number(game.price) : 0;
  const description = game.description || '';
  const image = game.coverImage || game.image || game.imageUrl;
  const inCartQty = user ? getQuantity(game._id) : 0;

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-6xl">?</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
          <p className="text-xl text-gray-700 mt-2">${price.toFixed(2)}</p>
          {description && (
            <p className="text-gray-600 mt-4">{description}</p>
          )}
          <div className="mt-6">
            {user && !isAdmin && inCartQty > 0 && (
              <p className="text-sm text-gray-600 mb-2">{inCartQty} in cart</p>
            )}
            {user && !isAdmin && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  {adding ? 'Adding…' : 'Add to cart'}
                </button>
                <button
                  type="button"
                  onClick={handleBuy}
                  disabled={adding}
                  className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 hover:bg-gray-800 disabled:opacity-50"
                >
                  Buy
                </button>
              </div>
            )}
            {message && (
              <p className={`mt-2 text-sm ${message.includes('Failed') ? 'text-red-600' : 'text-gray-600'}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
      <GameReviewVideos links={game.youtubeLinks} />
    </div>
  );
}
