import { useState, useEffect, useRef } from 'react';

/**
 * Returns a value that updates only after `delayMs` has passed since the last change to `value`.
 * Used to debounce search input so we don't hit the API on every keystroke.
 * @param {string} value - Immediate value (e.g. input state)
 * @param {number} delayMs - Debounce delay in milliseconds
 * @returns {string} Debounced value
 */
export function useDebouncedValue(value, delayMs) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
