'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useEventsStore } from '@/stores/events-store'
import { EventForm } from '@/components/events/event-form'
import { Button } from '@/components/ui/button'
import { Music2 } from 'lucide-react'
import Link from 'next/link'

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const events = useEventsStore((s) => s.events)
  const tickets = useEventsStore((s) => s.tickets)
  const travels = useEventsStore((s) => s.travels)
  const lodgings = useEventsStore((s) => s.lodgings)
  const expenses = useEventsStore((s) => s.expenses)
  const itinerary = useEventsStore((s) => s.itinerary)
  const checklist = useEventsStore((s) => s.checklist)
  const reflections = useEventsStore((s) => s.reflections)
  const loading = useEventsStore((s) => s.loading)

  const event = events.find((e) => e.id === id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
        <Music2 className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center">Evento não encontrado</p>
        <Link href="/events">
          <Button variant="outline">Ver todos os eventos</Button>
        </Link>
      </div>
    )
  }

  const initialData = {
    event,
    ticket: tickets.find((t) => t.eventId === id),
    travel: travels.find((t) => t.eventId === id),
    lodging: lodgings.find((l) => l.eventId === id),
    expenses: expenses.filter((e) => e.eventId === id),
    itinerary: itinerary.filter((i) => i.eventId === id),
    checklist: checklist.filter((c) => c.eventId === id),
    reflection: reflections.find((r) => r.eventId === id),
  }

  return <EventForm mode="edit" initialData={initialData} />
}
