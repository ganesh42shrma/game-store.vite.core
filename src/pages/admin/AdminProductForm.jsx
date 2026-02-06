import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, uploadProductImage } from '../../api/products.js';
import FormSkeleton from '../../components/loaders/FormSkeleton.jsx';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';

const MAX_YOUTUBE_LINKS = 3;

const PLATFORMS = ['PC', 'PS5', 'XBOX', 'SWITCH'];
const ACCEPT_IMAGE = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function validateTitle(value) {
  const t = value?.trim();
  if (!t) return 'Title is required';
  if (t.length > 200) return 'Title must be 200 characters or less';
  return null;
}

function validateDescription(value) {
  const t = value?.trim();
  if (!t) return 'Description is required';
  return null;
}

function validatePrice(value) {
  const n = parseFloat(value);
  if (value === '' || value == null) return 'Price is required';
  if (Number.isNaN(n)) return 'Enter a valid number';
  if (n <= 0) return 'Price must be greater than 0';
  return null;
}

function validateGenre(value) {
  const t = value?.trim();
  if (!t) return 'Genre is required';
  return null;
}

function validateStock(value) {
  if (value === '' || value == null) return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0) return 'Stock must be 0 or a positive integer';
  return null;
}

function validateImageFile(file) {
  if (!file) return null;
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(file.type)) return 'File must be JPEG, PNG, GIF, or WebP';
  if (file.size > MAX_SIZE_BYTES) return `File must be under ${MAX_SIZE_MB}MB`;
  return null;
}

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [touched, setTouched] = useState({});
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    platform: 'PC',
    genre: '',
    stock: '0',
    youtubeLinks: [],
  });

  const errors = {
    title: validateTitle(form.title),
    description: validateDescription(form.description),
    price: validatePrice(form.price),
    genre: validateGenre(form.genre),
    stock: validateStock(form.stock),
    image: validateImageFile(imageFile),
  };

  const setTouchedField = useCallback((field) => {
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getProduct(id)
      .then((data) => {
        setForm({
          title: data.title ?? '',
          description: data.description ?? '',
          price: data.price != null ? String(data.price) : '',
          platform: data.platform ?? 'PC',
          genre: data.genre ?? '',
          stock: data.stock != null ? String(data.stock) : '0',
          youtubeLinks: Array.isArray(data.youtubeLinks) ? [...data.youtubeLinks] : [],
        });
        if (data.coverImage) setExistingCoverUrl(data.coverImage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && ACCEPT_IMAGE.split(',').some((t) => file.type === t.trim())) {
      setImageFile(file);
    }
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ title: true, description: true, price: true, genre: true, stock: true });
    const hasErrors = Object.values(errors).some(Boolean);
    if (hasErrors) {
      setError('Please fix the errors below.');
      return;
    }
    setError('');
    setSaving(true);
    const youtubeLinks = (form.youtubeLinks ?? [])
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter(Boolean)
      .slice(0, MAX_YOUTUBE_LINKS);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      platform: form.platform,
      genre: form.genre.trim(),
      stock: Math.max(0, parseInt(form.stock, 10) || 0),
      youtubeLinks,
    };
    try {
      let productId = id;
      if (isEdit) {
        await updateProduct(id, payload);
      } else {
        const created = await createProduct(payload);
        productId = created._id;
      }
      if (imageFile) {
        await uploadProductImage(productId, imageFile);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.message || err.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const showError = (field) => touched[field] && errors[field];
  const inputErrorClass = (field) =>
    showError(field) ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300';

  if (loading) return <FormSkeleton />;

  const displayPreviewUrl = imagePreviewUrl ?? existingCoverUrl;

  return (
    <div>
      <Link to="/admin/products" className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block">← Games</Link>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        {isEdit ? 'Edit game' : 'Add game'}
      </h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onBlur={() => setTouchedField('title')}
            placeholder="e.g. Test Game"
            maxLength={200}
            className={`w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400 ${inputErrorClass('title')}`}
          />
          {showError('title') && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            onBlur={() => setTouchedField('description')}
            placeholder="Brief description of the game"
            className={`w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400 ${inputErrorClass('description')}`}
          />
          {showError('description') && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              onBlur={() => setTouchedField('price')}
              placeholder="0.00"
              className={`w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400 ${inputErrorClass('price')}`}
            />
            {showError('price') && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              id="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
              onBlur={() => setTouchedField('stock')}
              placeholder="0"
              className={`w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400 ${inputErrorClass('stock')}`}
            />
            {showError('stock') && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
            <select
              id="platform"
              value={form.platform}
              onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
            <input
              id="genre"
              type="text"
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              onBlur={() => setTouchedField('genre')}
              placeholder="e.g. RPG, Action"
              className={`w-full border rounded px-3 py-2 text-gray-900 placeholder-gray-400 ${inputErrorClass('genre')}`}
            />
            {showError('genre') && <p className="mt-1 text-sm text-red-600">{errors.genre}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Review / YouTube links (optional, max {MAX_YOUTUBE_LINKS})</label>
          <p className="text-gray-500 text-xs mb-2">YouTube watch or youtu.be links. Shown as embedded videos on the game page.</p>
          <div className="space-y-2">
            {(form.youtubeLinks ?? []).map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    const next = [...(form.youtubeLinks ?? [])];
                    next[index] = e.target.value;
                    setForm((f) => ({ ...f, youtubeLinks: next }));
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (form.youtubeLinks ?? []).filter((_, i) => i !== index);
                    setForm((f) => ({ ...f, youtubeLinks: next }));
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 rounded border border-gray-300 hover:border-red-300"
                  title="Remove link"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(form.youtubeLinks ?? []).length < MAX_YOUTUBE_LINKS && (
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    youtubeLinks: [...(f.youtubeLinks ?? []), ''],
                  }))
                }
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <Plus className="w-4 h-4" />
                Add link
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cover image (optional, max {MAX_SIZE_MB}MB)</label>
          <p className="text-gray-500 text-xs mb-2">JPEG, PNG, GIF, or WebP. {isEdit && 'Choose a new file to replace the current image.'}</p>

          <div className="space-y-3">
            <label
              htmlFor="image"
              onDrop={handleImageDrop}
              onDragOver={handleImageDragOver}
              className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-colors"
            >
              <input
                ref={fileInputRef}
                id="image"
                type="file"
                accept={ACCEPT_IMAGE}
                onChange={handleImageChange}
                className="hidden"
              />
              {!displayPreviewUrl ? (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click or drag a file here</span>
                </>
              ) : (
                <div className="relative w-full max-w-xs mx-auto p-2">
                  <img
                    src={displayPreviewUrl}
                    alt="Cover preview"
                    className="w-full aspect-video object-contain rounded border border-gray-200 bg-white"
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {imageFile && (
                      <span className="text-xs text-gray-500 truncate flex-1">
                        {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearImage(); }}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </label>
            {errors.image && (
              <p className="text-sm text-red-600">{errors.image}</p>
            )}
            {existingCoverUrl && !imageFile && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Current cover image is shown above. Select a new file to replace it.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
          <Link to="/admin/products" className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
