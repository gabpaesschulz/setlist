'use client';

import { useEffect } from 'react';
import { useEventsStore } from '@/stores/events-store';

/**
 * Initializes the events store by hydrating persisted events from IndexedDB
 * on component mount. Safe to call multiple times — hydration is idempotent.
 *
 * @returns `loading` e `isHydrated` para controle de estado de bootstrap.
 *
 * @example
 *   function EventsPage() {
 *     const { loading } = useInitEventsStore();
 *     if (loading) return <Spinner />;
 *     return <EventList />;
 *   }
 */
export function useInitEventsStore() {
  const ensureHydrated = useEventsStore((s) => s.ensureHydrated);
  const loading = useEventsStore((s) => s.loading);
  const isHydrated = useEventsStore((s) => s.isHydrated);

  useEffect(() => {
    ensureHydrated();
  }, [ensureHydrated]);

  return { loading, isHydrated };
}
