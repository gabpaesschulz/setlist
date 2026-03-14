'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Wallet, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Eventos', icon: Calendar },
  { href: '/expenses', label: 'Gastos', icon: Wallet },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/settings', label: 'Config', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/80 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-center justify-around px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200 active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {/* Active pill background */}
              {active && (
                <span className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-primary" />
              )}

              {/* Icon container */}
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground',
                )}
              >
                <Icon
                  className={cn(
                    'transition-all duration-200',
                    active ? 'h-5 w-5' : 'h-5 w-5',
                  )}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </span>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none tracking-tight transition-all duration-200',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
