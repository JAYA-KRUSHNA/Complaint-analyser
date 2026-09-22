import { useEffect, useState } from 'react';
import { useToast, type Toast as ToastType } from '../contexts/ToastContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ICON_MAP = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200/60',
    icon: 'text-emerald-500',
    title: 'text-emerald-800',
    message: 'text-emerald-600',
    progress: 'bg-emerald-400',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200/60',
    icon: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-600',
    progress: 'bg-red-400',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200/60',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    message: 'text-amber-600',
    progress: 'bg-amber-400',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200/60',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-600',
    progress: 'bg-blue-400',
  },
};

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const colors = COLOR_MAP[toast.type];
  const Icon = ICON_MAP[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (duration <= 0) return;
    const interval = 50;
    const step = (interval / duration) * 100;
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [duration]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl
        transition-all duration-300 ease-out
        ${colors.bg} ${colors.border}
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-8 opacity-0 scale-95'}
      `}
      style={{
        maxWidth: '380px',
        width: '100%',
        boxShadow: '0 8px 32px -4px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${colors.title}`}>{toast.title}</p>
          {toast.message && (
            <p className={`text-xs mt-0.5 ${colors.message} leading-relaxed`}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors -mt-0.5 -mr-1"
        >
          <X className="w-3.5 h-3.5 text-current opacity-40 hover:opacity-70" />
        </button>
      </div>
      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-[2px] w-full bg-black/[0.04]">
          <div
            className={`h-full ${colors.progress} transition-none rounded-full opacity-50`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}
