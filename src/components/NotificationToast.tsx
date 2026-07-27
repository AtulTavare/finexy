import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Toast {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export function NotificationToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleClick = () => {
    const url = toast.data?.url as string | undefined;
    if (url) navigate(url);
    onDismiss(toast.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="flex items-start gap-3 rounded-xl border border-orange-200 bg-white p-4 shadow-lg dark:border-orange-800 dark:bg-gray-800 cursor-pointer"
      onClick={handleClick}
    >
      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{toast.body}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
        className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <NotificationToast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
