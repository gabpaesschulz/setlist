'use client';

import { useEffect } from 'react';
import { useEventsStore } from '@/stores/events-store';

/**
 * Initializes the events store by loading all persisted events from IndexedDB
 * on component mount. Safe to call multiple times — Zustand deduplicates.
 *
 * @returns `loading` — true while the initial fetch is in progress.
 *
 * @example
 *   function EventsPage() {
 *     const { loading } = useInitEventsStore();
 *     if (loading) return <Spinner />;
 *     return <EventList />;
 *   }
 */
export function useInitEventsStore() {
  const loadAll = useEventsStore((s) => s.loadAll);
  const loading = useEventsStore((s) => s.loading);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { loading };
}
