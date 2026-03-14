'use client';

import { ReactNode, useEffect } from 'react';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { useEventsStore } from '@/stores/events-store';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const loadAll = useEventsStore((s) => s.loadAll);

  // ── Initialize store on first mount ──────────────────────────────────────────
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Register service worker ───────────────────────────────────────────────────
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => {
          console.warn('[AppShell] Service worker registration failed:', err);
        });
    }
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      {/* ── Main scrollable content area ── */}
      <main
        className="flex-1 overflow-y-auto"
        // Content area is padded at the bottom to sit above the fixed bottom nav
        // 64px = h-16 nav height + safe area
        style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        {/* Top safe area */}
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {children}
        </div>
      </main>

      {/* ── Fixed bottom navigation ── */}
      <BottomNav />
    </div>
  );
}
