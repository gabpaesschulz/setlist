'use client';

import { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      {/* Icon circle */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted/60 ring-1 ring-border">
          <Icon className="h-9 w-9 text-muted-foreground/70" strokeWidth={1.5} />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Action */}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </motion.div>
  );
}
