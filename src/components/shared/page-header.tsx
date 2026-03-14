import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-start justify-between px-4 pt-6 pb-2',
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="ml-4 flex-shrink-0 flex items-center">
          {action}
        </div>
      )}
    </header>
  );
}
