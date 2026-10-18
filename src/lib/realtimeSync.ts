import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from './supabase.ts';

type RealtimeCallback = (detail: {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  new?: any;
  old?: any;
}) => void;

let isInitialized = false;
let activeEventSource: EventSource | null = null;
let realtimeChannel: any = null;

/**
 * Initializes global Realtime synchronization listening on both:
 * 1. Supabase Postgres Changes WebSocket channel
 * 2. Backend Server-Sent Events (SSE) stream (/api/realtime/stream)
 */
export function initClientRealtimeSync(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  console.log('[Realtime Sync] Initializing live Supabase database sync...');

  // 1. Direct Supabase Realtime WebSocket Subscription
  if (isSupabaseConfigured() && supabase) {
    try {
      realtimeChannel = supabase
        .channel('client-db-realtime-listener')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            const table = payload.table;
            const eventType = payload.eventType;
            console.log(`[Supabase Realtime] ${eventType} event on "${table}" received by client.`, payload);

            // Dispatch custom window event for components
            window.dispatchEvent(
              new CustomEvent('supabase-data-changed', {
                detail: {
                  table,
                  eventType,
                  new: payload.new,
                  old: payload.old,
                  source: 'supabase-websocket'
                }
              })
            );
          }
        )
        .subscribe((status) => {
          console.log('[Supabase Realtime] Client WebSocket status:', status);
        });
    } catch (err) {
      console.warn('[Supabase Realtime] Could not initialize direct WebSocket client:', err);
    }
  }

  // 2. Server-Sent Events (SSE) Fallback & Server Broadcast Stream
  try {
    if (typeof EventSource !== 'undefined') {
      activeEventSource = new EventSource('/api/realtime/stream');

      activeEventSource.onopen = () => {
        console.log('[Realtime Sync] Connected to backend real-time stream (/api/realtime/stream)');
      };

      activeEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.table) {
            console.log(`[Realtime Sync] SSE event on "${data.table}" (${data.eventType})`);
            window.dispatchEvent(
              new CustomEvent('supabase-data-changed', {
                detail: {
                  ...data,
                  source: 'server-sse'
                }
              })
            );
          }
        } catch (e) {
          // heartbeat or unparseable frame
        }
      };

      activeEventSource.onerror = (err) => {
        console.warn('[Realtime Sync] SSE connection error, browser will auto-reconnect.', err);
      };
    }
  } catch (err) {
    console.warn('[Realtime Sync] SSE setup failed:', err);
  }
}

/**
 * React Hook for components to automatically re-fetch or modify their state
 * whenever rows in the specified Supabase tables are edited directly in Supabase.
 *
 * @param tables Array of table names to listen for (e.g. ['products', 'inventory', 'categories'])
 * @param onUpdate Callback function to invoke when data changes
 */
export function useRealtimeSync(tables: string[], onUpdate: RealtimeCallback): void {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    initClientRealtimeSync();

    let debounceTimer: any = null;

    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      const changedTable = detail?.table;

      if (!changedTable || tables.includes(changedTable) || tables.includes('*')) {
        // Debounce slightly to prevent burst-render on multi-row edits
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          try {
            onUpdateRef.current(detail);
          } catch (err) {
            console.error('[Realtime Sync] Error executing onUpdate callback:', err);
          }
        }, 150);
      }
    };

    window.addEventListener('supabase-data-changed', handleEvent);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('supabase-data-changed', handleEvent);
    };
  }, [tables.join(',')]);
}
