'use client';

import { useEffect } from 'react';
import { useEventsStore } from '@/stores/events-store';

/**
 * Ensures initial store hydration from IndexedDB on component mount.
 * Safe to call multiple times because hydration is idempotent.
 *
 * @returns loading and hydration flags for initial UI states.
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
