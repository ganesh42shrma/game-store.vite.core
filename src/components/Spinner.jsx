export default function Spinner({ size = 'default' }) {
  const sizeClass = size === 'sm' ? 'w-6 h-6 border-2' : 'w-10 h-10 border-2';
  return (
    <div
      className={`${sizeClass} border-gray-200 border-t-gray-900 rounded-full animate-spin`}
      aria-label="Loading"
      role="status"
    />
  );
}
