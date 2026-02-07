import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuth, getAvatarUrl } from '../context/AuthContext.jsx';
import { updateUser, uploadProfilePicture } from '../api/users.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;

export default function Profile() {
  const { user, updateUser: setAuthUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  // Sync form when user is loaded/updated (e.g. after refresh fetch)
  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.name, user?.email]);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const profilePictureUrl = user?.profilePicture || getAvatarUrl(user?.id || user?.email);
  const displayPreview = previewUrl ?? profilePictureUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const body = { name: name.trim() || undefined, email: email.trim() || undefined };
    if (password.trim()) body.password = password.trim();
    try {
      const updated = await updateUser(user.id, body);
      setAuthUser({ name: updated.name ?? name, email: updated.email ?? email, profilePicture: updated.profilePicture });
      setPassword('');
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.message || err.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const updated = await uploadProfilePicture(file);
      setAuthUser({ profilePicture: updated?.profilePicture ?? user?.profilePicture });
      setSuccess('Profile picture updated.');
      setPreviewUrl(null);
    } catch (err) {
      setError(err.message || err.data?.message || 'Upload failed');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!window.confirm('Remove profile picture? DiceBear avatar will be used instead.')) return;
    setError('');
    setSuccess('');
    setRemoving(true);
    try {
      await updateUser(user.id, { profilePicture: '' });
      setAuthUser({ profilePicture: null });
      setSuccess('Profile picture removed.');
    } catch (err) {
      setError(err.message || err.data?.message || 'Update failed');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>
      <p className="mb-4 text-sm text-gray-600">
        <Link to="/profile/addresses" className="text-gray-900 underline hover:no-underline">
          Manage addresses
        </Link>
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile picture</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
            {typeof displayPreview === 'string' && (displayPreview.startsWith('http') || displayPreview.startsWith('blob:')) ? (
              <img src={displayPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : user?.profilePicture ? 'Change picture' : 'Upload picture'}
            </button>
            {user?.profilePicture && (
              <button
                type="button"
                onClick={handleRemovePicture}
                disabled={removing}
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
              >
                {removing ? 'Removing…' : 'Remove picture'}
              </button>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">JPEG, PNG, GIF or WebP. Max {MAX_SIZE_MB}MB.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New password (leave blank to keep current)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
