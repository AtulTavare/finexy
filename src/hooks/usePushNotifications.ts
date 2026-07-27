import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export function usePushNotifications(userId: string | undefined, role: string) {
  const unsubscribed = useRef(false);

  const subscribe = useCallback(async () => {
    if (!userId || !('Notification' in window) || !('serviceWorker' in navigator)) return;

    if (Notification.permission === 'denied') return;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }

    const registration = await navigator.serviceWorker.ready;

    const existingSub = await registration.pushManager.getSubscription();

    if (existingSub) {
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', existingSub.endpoint)
        .single();

      if (existing) return;
    }

    if (existingSub) {
      await existingSub.unsubscribe();
    }

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const body = JSON.parse(JSON.stringify(subscription));

    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      role,
      endpoint: body.endpoint,
      keys: body.keys,
    }, { onConflict: 'endpoint' });
  }, [userId, role]);

  const unsubscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;

    unsubscribed.current = true;

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  }, []);

  useEffect(() => {
    unsubscribed.current = false;

    if (userId) {
      subscribe();
    }

    return () => {
      if (unsubscribed.current) {
        unsubscribe();
      }
    };
  }, [userId, subscribe, unsubscribe]);

  return { subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
