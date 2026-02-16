import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast } from '../store/toastSlice.js';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const typeConfig = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-800',
    iconColor: 'text-red-600',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    iconColor: 'text-blue-600',
  },
};

function ToastItem({ id, message, title, type, duration, onDismiss }) {
  const config = typeConfig[type] ?? typeConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${config.bg} ${config.text} min-w-[280px] max-w-sm`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium text-sm">{title}</p>}
        <p className={`text-sm ${title ? 'mt-0.5' : ''}`}>{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded hover:bg-black/5 -m-0.5"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Toast() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.toast.items);

  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {items.map((t) => (
          <ToastItem
            key={t.id}
            {...t}
            onDismiss={() => dispatch(removeToast(t.id))}
          />
        ))}
      </div>
    </div>
  );
}
