import { useDispatch } from 'react-redux';
import { showConfirmation } from '../store/confirmationSlice.js';

/**
 * Hook to show confirmation dialogs from anywhere.
 * Replaces window.confirm with a styled modal.
 *
 * @example
 * const confirm = useConfirmation();
 *
 * // With callbacks
 * confirm({
 *   title: 'Delete conversation?',
 *   message: 'This cannot be undone.',
 *   confirmLabel: 'Delete',
 *   variant: 'danger',
 *   onConfirm: () => handleDelete(),
 * });
 *
 * // Promise-based (for async flows)
 * const ok = await confirm.promise({
 *   message: 'Delete this?',
 *   variant: 'danger',
 * });
 * if (ok) handleDelete();
 */
export function useConfirmation() {
  const dispatch = useDispatch();

  const show = (options) => {
    dispatch(showConfirmation(options));
  };

  show.promise = (options) => {
    return new Promise((resolve) => {
      dispatch(
        showConfirmation({
          ...options,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        })
      );
    });
  };

  return show;
}
