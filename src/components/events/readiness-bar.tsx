import { cn } from '@/lib/utils';
import type { ReadinessLevel } from '@/types';
import { READINESS_LEVELS } from '@/lib/constants';

interface ReadinessBarProps {
  score: number;
  level: ReadinessLevel;
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

const barColors: Record<ReadinessLevel, string> = {
  em_aberto:   'bg-gray-400',
  organizando: 'bg-yellow-500',
  quase_pronto:'bg-blue-500',
  pronto:      'bg-green-500',
};

export function ReadinessBar({
  score,
  level,
  showLabel = true,
  compact = false,
  className,
}: ReadinessBarProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const meta = READINESS_LEVELS[level];
  const barColor = barColors[level];

  return (
    <div className={cn('w-full', className)}>
      {/* Label row */}
      {showLabel && !compact && (
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn('text-xs font-medium', meta.color)}>
            {meta.label}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {clampedScore}%
          </span>
        </div>
      )}

      {/* Progress track */}
      <div
        className={cn(
          'w-full rounded-full bg-muted overflow-hidden',
          compact ? 'h-1' : 'h-2',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            barColor,
          )}
          style={{ width: `${clampedScore}%` }}
        />
      </div>

      {/* Compact label below */}
      {showLabel && compact && (
        <div className="flex items-center justify-between mt-1">
          <span className={cn('text-[10px] font-medium', meta.color)}>
            {meta.label}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {clampedScore}%
          </span>
        </div>
      )}
    </div>
  );
}
