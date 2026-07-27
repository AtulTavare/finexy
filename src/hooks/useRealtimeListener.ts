import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

type ToastFn = (title: string, body: string, data?: Record<string, unknown>) => void;

const EVENT_MAP: Record<string, { title: string; body: (payload: Record<string, unknown>) => string; url?: string }> = {
  leads: {
    title: 'New Lead',
    body: (p) => `${p.name ?? 'Someone'} added as a lead`,
    url: '/admin-shubhaminfinity/business',
  },
  clients: {
    title: 'New Client',
    body: (p) => `${p.name ?? 'A client'} registered`,
    url: '/admin-shubhaminfinity/business',
  },
  projects: {
    title: 'Project Update',
    body: (p) => `${p.title ?? 'A project'} was ${p.status ? 'updated to ' + p.status : 'created'}`,
    url: '/admin-shubhaminfinity/projects',
  },
  tasks: {
    title: 'Task Due',
    body: (p) => `${p.title ?? 'A task'} is due`,
    url: '/admin-shubhaminfinity/tasks',
  },
  meetings: {
    title: 'Meeting Scheduled',
    body: (p) => `${p.title ?? 'A meeting'} has been scheduled`,
    url: '/admin-shubhaminfinity/calendar',
  },
  business_payments: {
    title: 'Payment Received',
    body: (p) => `Payment of ${p.amount ?? ''} received`,
    url: '/admin-shubhaminfinity/business',
  },
  engagements: {
    title: 'Engagement Update',
    body: (p) => `Engagement ${p.type ?? ''} ${p.status ? 'is now ' + p.status : 'created'}`,
    url: '/admin-shubhaminfinity/business',
  },
};

const CLIENT_EVENT_MAP: Record<string, { title: string; body: (payload: Record<string, unknown>) => string; url?: string }> = {
  projects: {
    title: 'Project Update',
    body: (p) => `${p.title ?? 'A project'} was ${p.status ? 'updated to ' + p.status : 'created'}`,
    url: '/client/projects',
  },
  meetings: {
    title: 'Meeting Scheduled',
    body: (p) => `${p.title ?? 'A meeting'} has been scheduled`,
    url: '/client/calendar',
  },
  business_payments: {
    title: 'Payment Confirmed',
    body: (p) => `Payment of ${p.amount ?? ''} confirmed`,
    url: '/client/payments',
  },
};

export function useRealtimeListener(userId: string | undefined, role: string, showToast: ToastFn) {
  useEffect(() => {
    if (!userId) return;

    const tables = role === 'admin' ? Object.keys(EVENT_MAP) : Object.keys(CLIENT_EVENT_MAP);
    const map = role === 'admin' ? EVENT_MAP : CLIENT_EVENT_MAP;

    const channels = tables.map((table) => {
      const eventMap = map[table];
      if (!eventMap) return null;

      return supabase
        .channel(`realtime-${table}`)
        .on(
          'postgres_changes' as never,
          { event: '*', schema: 'public', table },
          (payload: { new: Record<string, unknown> }) => {
            const title = eventMap.title;
            const body = eventMap.body(payload.new);

            showToast(title, body, { url: eventMap.url, table });
          },
        )
        .subscribe();
    });

    return () => {
      channels.forEach((ch) => {
        if (ch) supabase.removeChannel(ch);
      });
    };
  }, [userId, role, showToast]);
}
