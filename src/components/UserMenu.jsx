import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth, getAvatarUrl } from '../context/AuthContext.jsx';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  if (!user) return null;

  const avatarUrl = user.avatarUrl || getAvatarUrl(user.id || user.email);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-gray-900 hover:text-gray-700"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="sr-only md:not-sr-only md:inline text-sm max-w-[120px] truncate">
          {user.name || user.email}
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <User className="w-5 h-5 text-gray-900" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 text-sm"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-gray-900" />
            )}
            Profile
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
          >
            <LogOut className="w-4 h-4 text-gray-900" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
