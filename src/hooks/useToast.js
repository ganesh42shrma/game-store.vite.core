import { useDispatch } from 'react-redux';
import { addToast } from '../store/toastSlice.js';

/**
 * Hook to show toasts from anywhere.
 * @example
 * const toast = useToast();
 * toast.success('Item added to cart');
 * toast.error('Something went wrong');
 * toast.info('Processing...', { title: 'Info' });
 */
export function useToast() {
  const dispatch = useDispatch();

  return {
    show: (message, options = {}) => {
      dispatch(addToast({ message, ...options }));
    },
    success: (message, options = {}) => {
      dispatch(addToast({ message, type: 'success', ...options }));
    },
    error: (message, options = {}) => {
      dispatch(addToast({ message, type: 'error', ...options }));
    },
    info: (message, options = {}) => {
      dispatch(addToast({ message, type: 'info', ...options }));
    },
  };
}
