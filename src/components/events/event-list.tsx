'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Event } from '@/types';
import { useEventsStore } from '@/stores/events-store';
import { EventCard } from '@/components/events/event-card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventListProps {
  events: Event[];
  emptyMessage?: string;
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventList({ events, emptyMessage, compact = false }: EventListProps) {
  const getTicketByEventId   = useEventsStore((s) => s.getTicketByEventId);
  const getTravelByEventId   = useEventsStore((s) => s.getTravelByEventId);
  const getLodgingByEventId  = useEventsStore((s) => s.getLodgingByEventId);
  const getExpensesByEventId = useEventsStore((s) => s.getExpensesByEventId);
  const getChecklistByEventId = useEventsStore((s) => s.getChecklistByEventId);

  if (events.length === 0 && emptyMessage) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4">
      <AnimatePresence initial={false}>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22, delay: index * 0.04, ease: 'easeOut' }}
          >
            <EventCard
              event={event}
              ticket={getTicketByEventId(event.id)}
              travel={getTravelByEventId(event.id)}
              lodging={getLodgingByEventId(event.id)}
              expenses={getExpensesByEventId(event.id)}
              checklist={getChecklistByEventId(event.id)}
              compact={compact}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
