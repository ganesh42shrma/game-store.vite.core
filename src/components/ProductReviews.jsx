import { useEffect, useState } from 'react';
import { Star, MessageSquare, Trash2, Pencil } from 'lucide-react';
import {
  getProductReviews,
  getMyReview,
  submitReview,
  deleteReview,
} from '../api/products.js';
import PaginationBar from './PaginationBar.jsx';

const LIMIT = 10;
const MAX_COMMENT_LENGTH = 2000;

/**
 * @param {{ productId: string; product: { reviewSummary?: { label?: string; percentPositive?: number | null; reviewCount?: number }; rating?: number; reviewCount?: number }; user: object | null; isAdmin?: boolean; onReviewChange?: () => void }} props
 */
export default function ProductReviews({ productId, product, user, isAdmin, onReviewChange }) {
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  const [myReview, setMyReview] = useState(null);
  const [myReviewLoading, setMyReviewLoading] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(false);

  // Prefer summary from reviews list (updates right after submit); fallback to product
  const listSummary = reviewsData?.summary;
  const summary = listSummary ?? product?.reviewSummary;
  const percentPositive = summary?.percentPositive;
  const reviews = reviewsData?.reviews ?? [];
  const reviewCount = listSummary?.reviewCount ?? product?.reviewCount ?? reviews.length;
  const effectiveCount = reviewCount > 0 ? reviewCount : reviews.length;
  // Rating: use product (refetched), or compute from current reviews if product still 0
  const productRating = product?.rating;
  const computedRating =
    reviews.length > 0 && (productRating == null || productRating === 0)
      ? reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviews.length
      : productRating;
  const rating = computedRating != null ? Number(computedRating) : productRating;
  // When we have reviews, never show "No reviews yet" – show count and optional Steam label
  const rawLabel = summary?.label ?? 'No reviews yet';
  const hasReviews = effectiveCount > 0;
  const label = hasReviews && (rawLabel === 'No reviews yet' || rawLabel === 'Need more reviews')
    ? (effectiveCount === 1 ? '1 review' : `${effectiveCount} reviews`)
    : rawLabel;

  // Fetch paginated reviews
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setReviewsLoading(true);
    setReviewsError(null);
    getProductReviews(productId, { page: reviewsPage, limit: LIMIT, sort: '-createdAt' })
      .then((data) => {
        if (!cancelled) setReviewsData(data);
      })
      .catch((err) => {
        if (!cancelled) setReviewsError(err.message || 'Failed to load reviews');
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, reviewsPage]);

  // Fetch current user's review when logged in (and not admin).
  // Only treat as "my review" if the review's user id matches current user (avoids showing another user's review after login switch).
  const currentUserId = user?.id ?? user?._id;
  useEffect(() => {
    if (!productId || !user || isAdmin) {
      setMyReview(null);
      return;
    }
    let cancelled = false;
    setMyReviewLoading(true);
    getMyReview(productId)
      .then((data) => {
        if (!cancelled) {
          const reviewUserId = data?.user?._id ?? data?.user?.id;
          const isCurrentUserReview = reviewUserId != null && currentUserId != null && String(reviewUserId) === String(currentUserId);
          const resolved = data != null && isCurrentUserReview ? data : null;
          setMyReview(resolved);
          if (resolved) {
            setFormRating(resolved.rating ?? 5);
            setFormComment(resolved.comment ?? '');
          } else {
            setFormRating(5);
            setFormComment('');
          }
        }
      })
      .catch(() => {
        if (!cancelled) setMyReview(null);
      })
      .finally(() => {
        if (!cancelled) setMyReviewLoading(false);
      });
    return () => { cancelled = true; };
  }, [productId, user, isAdmin, currentUserId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !productId) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      const updated = await submitReview(productId, {
        rating: formRating,
        comment: formComment.trim() || undefined,
      });
      setMyReview(updated);
      setEditingReview(false);
      setFormError(null);
      const fresh = await getProductReviews(productId, { page: reviewsPage, limit: LIMIT, sort: '-createdAt' });
      setReviewsData(fresh);
      onReviewChange?.();
    } catch (err) {
      setFormError(err.message || 'Failed to save review');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!user || !productId || !myReview) return;
    if (!window.confirm('Delete your review?')) return;
    setDeleteSubmitting(true);
    setFormError(null);
    try {
      await deleteReview(productId);
      setMyReview(null);
      setFormRating(5);
      setFormComment('');
      const fresh = await getProductReviews(productId, { page: reviewsPage, limit: LIMIT, sort: '-createdAt' });
      setReviewsData(fresh);
      onReviewChange?.();
    } catch (err) {
      setFormError(err.message || 'Failed to delete review');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const meta = reviewsData?.meta ?? {};
  const totalPages = meta.totalPages ?? 1;

  // Only show "your review" card if this review belongs to the current user (handles login switch / stale state)
  const reviewUserId = myReview?.user?._id ?? myReview?.user?.id;
  const isMyReview = myReview && currentUserId != null && reviewUserId != null && String(reviewUserId) === String(currentUserId);
  const showReviewForm = !isMyReview || editingReview;

  return (
    <section className="mt-10 pt-8 border-t border-gray-200 w-full">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Reviews
      </h2>

      {/* Steam-style summary: show rating and count when we have reviews; never "No reviews yet" when list has reviews */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {(rating != null && hasReviews) && (
            <span className="flex items-center gap-1 text-gray-700">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-medium">{Number(rating).toFixed(1)}</span>
            </span>
          )}
          <span className="text-gray-600 font-medium">{label}</span>
          {percentPositive != null && hasReviews && (
            <span className="text-sm text-gray-500">({percentPositive}% positive)</span>
          )}
        </div>
        {hasReviews && label === rawLabel && (
          <span className="text-sm text-gray-500">{effectiveCount} review{effectiveCount !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Your review (logged-in, non-admin): read-only card when submitted, form only when writing or editing */}
      {user && !isAdmin && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {isMyReview && !editingReview ? 'Your review' : isMyReview ? 'Edit your review' : 'Write a review'}
          </h3>
          {myReviewLoading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : showReviewForm ? (
            <form onSubmit={handleSubmitReview} className="space-y-3 max-w-xl" aria-busy={formSubmitting}>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Rating (1–5)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRating(r)}
                      className="p-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
                      aria-label={`${r} star${r > 1 ? 's' : ''}`}
                      aria-pressed={formRating === r}
                    >
                      <Star
                        className={`w-8 h-8 ${formRating >= r ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Comment (optional, max {MAX_COMMENT_LENGTH} characters)</label>
                <textarea
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 disabled:opacity-50"
                  placeholder="Share your experience with this game..."
                  disabled={formSubmitting}
                />
                <p className="text-xs text-gray-500 mt-0.5">{formComment.length}/{MAX_COMMENT_LENGTH}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-gray-900 text-white rounded border border-gray-900 hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {formSubmitting && <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />}
                  {formSubmitting ? 'Saving…' : isMyReview ? 'Update review' : 'Submit review'}
                </button>
                {editingReview && (
                  <button
                    type="button"
                    onClick={() => { setEditingReview(false); setFormError(null); }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                )}
                {isMyReview && editingReview && (
                  <button
                    type="button"
                    onClick={handleDeleteReview}
                    disabled={deleteSubmitting || formSubmitting}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteSubmitting ? 'Deleting…' : 'Delete review'}
                  </button>
                )}
              </div>
              {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
            </form>
          ) : isMyReview ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 max-w-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {myReview.rating}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {myReview.updatedAt
                    ? new Date(myReview.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : myReview.createdAt
                      ? new Date(myReview.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : ''}
                </span>
              </div>
              {myReview.comment && (
                <p className="mt-2 text-gray-600 text-sm whitespace-pre-wrap">{myReview.comment}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setEditingReview(true)}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-100 flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDeleteReview}
                  disabled={deleteSubmitting}
                  className="px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleteSubmitting ? 'Deleting…' : 'Delete review'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Community reviews</h3>
        {reviewsLoading ? (
          <p className="text-sm text-gray-500">Loading reviews…</p>
        ) : reviewsError ? (
          <p className="text-sm text-red-600">{reviewsError}</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          <>
            <ul className="space-y-4">
              {reviews.map((rev) => (
                <li key={rev._id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {rev.user?.name ?? 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-600">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {rev.rating}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {rev.updatedAt
                        ? new Date(rev.updatedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                        : rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                          : ''}
                    </span>
                  </div>
                  {rev.comment && (
                    <p className="mt-1 text-gray-600 text-sm whitespace-pre-wrap">{rev.comment}</p>
                  )}
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <PaginationBar
                page={reviewsPage}
                totalPages={totalPages}
                onPrev={() => setReviewsPage((p) => Math.max(1, p - 1))}
                onNext={() => setReviewsPage((p) => Math.min(totalPages, p + 1))}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
