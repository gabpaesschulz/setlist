import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, action, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm',
        className,
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
          {title}
        </h2>
        {action && (
          <div className="flex items-center">
            {action}
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
