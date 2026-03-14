'use client';

import { cn } from '@/lib/utils';
import { getCountdown } from '@/lib/domain/countdown';

interface CountdownBadgeProps {
  date: string;
  time?: string;
  variant?: 'hero' | 'card' | 'inline';
  className?: string;
}

export function CountdownBadge({
  date,
  time,
  variant = 'card',
  className,
}: CountdownBadgeProps) {
  const countdown = getCountdown(date, time);

  // ── Hero variant ─────────────────────────────────────────────────────────────
  if (variant === 'hero') {
    return (
      <div className={cn('flex flex-col items-center', className)}>
        {countdown.isToday ? (
          <span className="animate-pulse text-2xl font-black tracking-tight text-green-500">
            Hoje! 🎉
          </span>
        ) : countdown.isPast ? (
          <span className="text-base font-medium text-muted-foreground">
            {countdown.label}
          </span>
        ) : (
          <>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-black tracking-tighter text-primary leading-none">
                {countdown.days}
              </span>
              <span className="text-lg font-semibold text-muted-foreground mb-1">
                {countdown.days === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground font-medium mt-0.5">
              {countdown.isTomorrow ? 'amanhã!' : 'restantes'}
            </span>
          </>
        )}
      </div>
    );
  }

  // ── Inline variant ────────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'text-sm font-medium',
          countdown.isToday
            ? 'text-green-500 animate-pulse'
            : countdown.isPast
              ? 'text-muted-foreground'
              : 'text-primary',
          className,
        )}
      >
        {countdown.label}
      </span>
    );
  }

  // ── Card variant (default) ────────────────────────────────────────────────────
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        countdown.isToday
          ? 'bg-green-500/15 text-green-600 animate-pulse'
          : countdown.isPast
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/10 text-primary',
        className,
      )}
    >
      {countdown.isToday
        ? 'Hoje! 🎉'
        : countdown.isTomorrow
          ? 'Amanhã!'
          : countdown.isPast
            ? countdown.label
            : countdown.days === 0
              ? 'Hoje'
              : `${countdown.days}d`}
    </span>
  );
}
