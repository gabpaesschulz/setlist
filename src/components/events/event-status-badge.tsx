import { cn } from '@/lib/utils';
import type { EventStatus, EventType, ReadinessLevel } from '@/types';
import { EVENT_STATUS, EVENT_TYPES, READINESS_LEVELS } from '@/lib/constants';

// ─── Event Status Badge ───────────────────────────────────────────────────────

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

const statusStyles: Record<EventStatus, string> = {
  ativo:     'bg-green-500/10 text-green-600 ring-green-500/20',
  concluido: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  cancelado: 'bg-red-500/10 text-red-500 ring-red-500/20',
  wishlist:  'bg-yellow-500/10 text-yellow-600 ring-yellow-500/20',
};

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const meta = EVENT_STATUS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
        statusStyles[status],
        className,
      )}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

// ─── Event Type Badge ─────────────────────────────────────────────────────────

interface EventTypeBadgeProps {
  type: EventType;
  className?: string;
}

const typeStyles: Record<EventType, string> = {
  show:      'bg-purple-500/10 text-purple-600 ring-purple-500/20',
  festival:  'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  convencao: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  outro:     'bg-slate-500/10 text-slate-600 ring-slate-500/20',
};

export function EventTypeBadge({ type, className }: EventTypeBadgeProps) {
  const meta = EVENT_TYPES[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
        typeStyles[type],
        className,
      )}
    >
      <span>{meta.icon}</span>
      <span>{meta.label}</span>
    </span>
  );
}

// ─── Readiness Level Badge ────────────────────────────────────────────────────

interface ReadinessLevelBadgeProps {
  level: ReadinessLevel;
  className?: string;
}

export function ReadinessLevelBadge({ level, className }: ReadinessLevelBadgeProps) {
  const meta = READINESS_LEVELS[level];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.bg,
        meta.color,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
