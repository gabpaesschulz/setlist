'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CalendarDays, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useEventsStore } from '@/stores/events-store';
import { useInitEventsStore } from '@/hooks/use-events-store';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { AddEventFab } from '@/components/shared/add-event-fab';
import { EventList } from '@/components/events/event-list';
import { cn } from '@/lib/utils';

// ─── Filter chip definition ───────────────────────────────────────────────────

type FilterChip = 'todos' | 'proximos' | 'passados' | 'festival' | 'show';

const CHIPS: { id: FilterChip; label: string }[] = [
  { id: 'todos',    label: 'Todos' },
  { id: 'proximos', label: 'Próximos' },
  { id: 'passados', label: 'Passados' },
  { id: 'festival', label: 'Festivais' },
  { id: 'show',     label: 'Shows' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { loading, isHydrated } = useInitEventsStore();

  const events = useEventsStore((s) => s.events);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [activeChip,  setActiveChip]   = useState<FilterChip>('todos');
  const [filterCity,  setFilterCity]   = useState('');
  const [filterMonth, setFilterMonth]  = useState('');
  const [pastOpen,    setPastOpen]     = useState(false);

  // ── Derived data ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  // Collect unique cities and months for dropdowns
  const cities = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.city));
    return Array.from(set).sort();
  }, [events]);

  const months = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => set.add(e.date.slice(0, 7)));
    return Array.from(set).sort();
  }, [events]);

  // ── Filtered + grouped events ─────────────────────────────────────────────
  const { upcoming, past } = useMemo(() => {
    const q = search.toLowerCase().trim();

    const filtered = events.filter((e) => {
      // text search
      if (q) {
        const haystack = [e.title, e.artist, e.city, e.venue].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // chip filter
      if (activeChip === 'proximos' && e.date < today) return false;
      if (activeChip === 'passados' && e.date >= today) return false;
      if (activeChip === 'festival' && e.type !== 'festival') return false;
      if (activeChip === 'show'     && e.type !== 'show')     return false;

      // city filter
      if (filterCity && e.city !== filterCity) return false;

      // month filter (YYYY-MM)
      if (filterMonth && !e.date.startsWith(filterMonth)) return false;

      return true;
    });

    const upcoming = filtered
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    const past = filtered
      .filter((e) => e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));

    return { upcoming, past };
  }, [events, search, activeChip, filterCity, filterMonth, today]);

  const totalFiltered = upcoming.length + past.length;

  if (!isHydrated && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando eventos...</p>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Meus Eventos"
          subtitle="Nenhum evento ainda"
        />
        <EmptyState
          icon={CalendarDays}
          title="Sem eventos ainda"
          description="Adicione seu primeiro show, festival ou evento para começar a organizar tudo em um lugar."
          action={
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
              + Adicionar Evento
            </Link>
          }
        />
        <AddEventFab />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Meus Eventos"
        action={
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-bold text-primary">
            {events.length}
          </span>
        }
      />

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por evento, artista, cidade..."
            className="w-full h-10 rounded-xl border border-input bg-muted/40 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              className={cn(
                'h-8 rounded-full px-4 text-xs font-medium whitespace-nowrap transition-all duration-150',
                activeChip === chip.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted',
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Secondary filters ──────────────────────────────────────────────── */}
      <div className="px-4 pb-3 flex gap-2">
        {/* City dropdown */}
        <div className="relative flex-1">
          <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="w-full h-8 appearance-none rounded-lg border border-input bg-muted/40 pl-7 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Month dropdown */}
        <div className="relative flex-1">
          <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full h-8 appearance-none rounded-lg border border-input bg-muted/40 pl-7 pr-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          >
            <option value="">Todos os meses</option>
            {months.map((m) => {
              const [year, month] = m.split('-');
              const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('pt-BR', {
                month: 'long',
                year: 'numeric',
              });
              return (
                <option key={m} value={m}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* ── No results ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {totalFiltered === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-4 py-12 text-center"
          >
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-base font-semibold text-foreground">Nenhum evento encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente ajustar a busca ou os filtros.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* ── Upcoming section ─────────────────────────────────────────── */}
            {(activeChip !== 'passados') && upcoming.length > 0 && (
              <section className="mb-4">
                <SectionHeader label="Próximos" count={upcoming.length} />
                <EventList events={upcoming} />
              </section>
            )}

            {/* ── Past section ─────────────────────────────────────────────── */}
            {(activeChip !== 'proximos') && past.length > 0 && (
              <section>
                <button
                  onClick={() => setPastOpen((o) => !o)}
                  className="w-full"
                >
                  <SectionHeader
                    label="Passados"
                    count={past.length}
                    collapsible
                    open={pastOpen}
                    muted
                  />
                </button>

                <AnimatePresence initial={false}>
                  {pastOpen && (
                    <motion.div
                      key="past-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="opacity-75">
                        <EventList events={past} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            )}

            {/* Edge case: passados chip but no upcoming shown */}
            {activeChip === 'passados' && past.length > 0 && (
              <section>
                <SectionHeader label="Passados" count={past.length} muted />
                <div className="opacity-75">
                  <EventList events={past} />
                </div>
              </section>
            )}

            {/* Edge case: proximos chip but no past shown */}
            {activeChip === 'proximos' && upcoming.length > 0 && (
              <section>
                <SectionHeader label="Próximos" count={upcoming.length} />
                <EventList events={upcoming} />
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AddEventFab />
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  count: number;
  collapsible?: boolean;
  open?: boolean;
  muted?: boolean;
}

function SectionHeader({ label, count, collapsible, open, muted }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2.5',
        collapsible && 'cursor-pointer select-none',
      )}
    >
      <span
        className={cn(
          'text-xs font-bold tracking-wider uppercase',
          muted ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
          muted
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/15 text-primary',
        )}
      >
        {count}
      </span>
      {collapsible && (
        <span className="ml-auto text-muted-foreground">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      )}
    </div>
  );
}
