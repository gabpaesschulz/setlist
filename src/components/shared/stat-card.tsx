import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: 'purple' | 'green' | 'blue' | 'amber' | 'red' | 'default';
  className?: string;
}

const colorMap: Record<NonNullable<StatCardProps['color']>, { icon: string; badge: string }> = {
  purple: { icon: 'bg-purple-500/10 text-purple-500', badge: 'text-purple-500' },
  green:  { icon: 'bg-green-500/10 text-green-500',   badge: 'text-green-500' },
  blue:   { icon: 'bg-blue-500/10 text-blue-500',     badge: 'text-blue-500' },
  amber:  { icon: 'bg-amber-500/10 text-amber-500',   badge: 'text-amber-500' },
  red:    { icon: 'bg-red-500/10 text-red-500',       badge: 'text-red-500' },
  default:{ icon: 'bg-muted text-muted-foreground',   badge: 'text-muted-foreground' },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'default',
  className,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'rounded-2xl bg-card border border-border/50 p-4 shadow-sm flex flex-col gap-3',
        className,
      )}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', colors.icon)}>
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>

        {trend && trend !== 'neutral' && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              trend === 'up' ? 'text-green-500' : 'text-red-500',
            )}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {trendLabel && <span>{trendLabel}</span>}
          </div>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}
