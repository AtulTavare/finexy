import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { useRealtimeListener } from '@/src/hooks/useRealtimeListener';
import { ToastContainer, type Toast } from '@/src/components/NotificationToast';

interface NotificationContextValue {
  showToast: (title: string, body: string, data?: Record<string, unknown>) => void;
  toasts: Toast[];
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const userId = user?.id;
  const role = user?.user_metadata?.role ?? 'admin';

  const showToast = useCallback((title: string, body: string, data?: Record<string, unknown>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, body, data }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const stableShowToast = useCallback((title: string, body: string, data?: Record<string, unknown>) => {
    showToast(title, body, data);
    if (data?.url) {
      const targetUserId = data?.targetUserId as string | undefined;
      const fnUserId = data?.fnUserId as string | undefined;
      if (targetUserId && import.meta.env.VITE_SUPABASE_URL) {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ user_id: targetUserId, title, body, data: { ...data, role } }),
          },
        ).catch(() => {});
      }
    }
  }, [showToast, role]);

  usePushNotifications(userId, role);

  useRealtimeListener(userId, role, showToast);

  const value = useMemo(() => ({ showToast: stableShowToast, toasts }), [stableShowToast, toasts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
