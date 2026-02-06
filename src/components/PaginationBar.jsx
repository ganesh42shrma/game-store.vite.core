import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * @param {Object} props
 * @param {number} props.page - Current page (1-based)
 * @param {boolean} [props.hasPrev] - When true, show enabled Prev (for list APIs without meta)
 * @param {boolean} [props.hasNext] - When true, show enabled Next
 * @param {number} [props.totalPages] - When set (e.g. from orders meta), show "Page X of Y" and use for Next
 * @param {() => void} props.onPrev
 * @param {() => void} props.onNext
 */
export default function PaginationBar({ page, hasPrev = true, hasNext, totalPages, onPrev, onNext }) {
  const canPrev = totalPages != null ? page > 1 : hasPrev;
  const canNext = totalPages != null ? page < totalPages : hasNext;

  return (
    <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        {totalPages != null ? (
          <span>Page {page} of {totalPages}</span>
        ) : (
          <span>Page {page}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
