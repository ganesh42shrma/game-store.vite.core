import { useDispatch, useSelector } from 'react-redux';
import { hideConfirmation } from '../store/confirmationSlice.js';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationModal() {
  const dispatch = useDispatch();
  const {
    open,
    title,
    message,
    confirmLabel,
    cancelLabel,
    variant,
    onConfirm,
    onCancel,
  } = useSelector((s) => s.confirmation);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm?.();
    dispatch(hideConfirmation());
  };

  const handleCancel = () => {
    onCancel?.();
    dispatch(hideConfirmation());
  };

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-6">
        {isDanger && (
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        )}
        <h2 id="confirmation-title" className="text-lg font-semibold text-gray-900 text-center">
          {title}
        </h2>
        {message && (
          <p id="confirmation-message" className="mt-2 text-sm text-gray-600 text-center">
            {message}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
