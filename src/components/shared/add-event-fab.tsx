'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AddEventFabProps {
  label?: string;
  className?: string;
}

export function AddEventFab({ label, className }: AddEventFabProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 20,
        delay: 0.15,
      }}
      className={cn(
        'fixed z-40 right-4',
        className,
      )}
      // Sits above the bottom nav (64px) + safe area
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom) + 16px)' }}
    >
      <Link
        href="/events/new"
        className={cn(
          'flex items-center gap-2 shadow-lg shadow-primary/30',
          'bg-gradient-to-br from-violet-500 to-purple-700',
          'text-white font-semibold',
          'rounded-full',
          'active:scale-95 transition-transform duration-150',
          label ? 'px-5 py-3.5 text-sm' : 'h-14 w-14 justify-center',
        )}
      >
        <Plus className="h-5 w-5 flex-shrink-0" strokeWidth={2.5} />
        {label && <span>{label}</span>}
      </Link>
    </motion.div>
  );
}
