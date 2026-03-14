'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Edit, MoreVertical, CheckCircle, Copy, Trash2,
  MapPin, Calendar, Clock, Ticket, Bus, Hotel, DollarSign,
  Map, CheckSquare, FileText, Star, Music2
} from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import { calculateReadiness } from '@/lib/domain/readiness'
import { getCountdown } from '@/lib/domain/countdown'
import { formatDateLong } from '@/lib/formatters'
import { EventStatusBadge, EventTypeBadge } from '@/components/events/event-status-badge'
import { TicketSection } from '@/components/events/ticket-section'
import { TravelSection } from '@/components/events/travel-section'
import { LodgingSection } from '@/components/events/lodging-section'
import { ExpensesSection } from '@/components/events/expenses-section'
import { ItinerarySection } from '@/components/events/itinerary-section'
import { ChecklistSection } from '@/components/events/checklist-section'
import { ReflectionSection } from '@/components/events/reflection-section'
import { ShareEventDialog } from '@/components/events/share-event-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { toast } from '@/components/ui/use-toast'

const TYPE_GRADIENTS: Record<string, string> = {
  show: 'from-violet-600 via-purple-600 to-indigo-700',
  festival: 'from-orange-500 via-amber-500 to-yellow-600',
  convencao: 'from-blue-600 via-cyan-600 to-teal-700',
  outro: 'from-slate-600 via-slate-500 to-slate-700',
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  const events = useEventsStore((s) => s.events)
  const tickets = useEventsStore((s) => s.tickets)
  const travels = useEventsStore((s) => s.travels)
  const lodgings = useEventsStore((s) => s.lodgings)
  const expenses = useEventsStore((s) => s.expenses)
  const itinerary = useEventsStore((s) => s.itinerary)
  const checklist = useEventsStore((s) => s.checklist)
  const reflections = useEventsStore((s) => s.reflections)
  const deleteEvent = useEventsStore((s) => s.deleteEvent)
  const completeEvent = useEventsStore((s) => s.completeEvent)
  const duplicateEvent = useEventsStore((s) => s.duplicateEvent)

  const event = events.find((e) => e.id === id)
  const ticket = tickets.find((t) => t.eventId === id)
  const travel = travels.find((t) => t.eventId === id)
  const lodging = lodgings.find((l) => l.eventId === id)
  const eventExpenses = expenses.filter((e) => e.eventId === id)
  const eventItinerary = itinerary.filter((i) => i.eventId === id).sort((a, b) => a.order - b.order)
  const eventChecklist = checklist.filter((c) => c.eventId === id).sort((a, b) => a.order - b.order)
  const reflection = reflections.find((r) => r.eventId === id)

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

  const countdown = getCountdown(event.date, event.time)
  const readiness = calculateReadiness({ event, ticket, travel, lodging, expenses: eventExpenses, itinerary: eventItinerary, checklist: eventChecklist, reflection })
  const gradient = TYPE_GRADIENTS[event.type] ?? TYPE_GRADIENTS.outro
  const checklistProgress = eventChecklist.length > 0
    ? `${eventChecklist.filter(c => c.done).length}/${eventChecklist.length}`
    : '0/0'

  const handleDelete = async () => {
    await deleteEvent(id)
    toast({ title: 'Evento excluído', description: event.title })
    router.push('/events')
  }

  const handleComplete = async () => {
    await completeEvent(id)
    toast({ title: 'Evento concluído! 🎉', description: `${event.title} marcado como concluído` })
    setCompleteOpen(false)
  }

  const handleDuplicate = async () => {
    const dup = await duplicateEvent(id)
    toast({ title: 'Evento duplicado', description: 'Redirecionando para o novo evento...' })
    router.push(`/events/${dup.id}`)
  }

  const isPast = countdown.isPast
  const isCompleted = event.status === 'concluido'

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className={cn('relative bg-gradient-to-br', gradient, 'pt-safe-top')}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Link href={`/events/${id}/edit`}>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20 border border-white/30">
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        {/* Event Info */}
        <div className="px-4 pt-2 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <EventTypeBadge type={event.type} />
            <EventStatusBadge status={event.status} />
          </div>

          <h1 className="text-2xl font-bold text-white leading-tight mb-1">{event.title}</h1>
          {event.artist && event.artist !== event.title && (
            <p className="text-white/80 text-base mb-3">{event.artist}</p>
          )}

          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formatDateLong(event.date)}{event.endDate ? ` – ${formatDateLong(event.endDate)}` : ''}</span>
            </div>
            {event.time && (
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{event.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>{event.venue} · {event.city}, {event.state}</span>
            </div>
          </div>

          {/* Countdown */}
          {!isPast && !isCompleted && (
            <div className="bg-black/20 rounded-xl px-4 py-3 mb-4 text-center">
              <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Faltam</p>
              <p className="text-white text-4xl font-black">{countdown.days}</p>
              <p className="text-white/80 text-sm">
                {countdown.days === 1 ? 'dia' : 'dias'}
                {countdown.isToday ? ' — HOJE! 🎉' : countdown.isTomorrow ? ' — AMANHÃ! 🎶' : ''}
              </p>
            </div>
          )}
          {(isPast || isCompleted) && (
            <div className="bg-black/20 rounded-xl px-4 py-2 mb-4 text-center">
              <p className="text-white/90 text-sm font-medium">
                {isCompleted ? '✅ Evento concluído' : countdown.label}
              </p>
            </div>
          )}

          {/* Quick status row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <QuickBadge
              label="Ingresso"
              ok={ticket?.purchased ?? false}
              icon={<Ticket className="w-3 h-3" />}
            />
            <QuickBadge
              label="Transporte"
              ok={travel?.booked ?? false}
              icon={<Bus className="w-3 h-3" />}
            />
            {lodging?.required && (
              <QuickBadge
                label="Hospedagem"
                ok={lodging?.confirmed ?? false}
                icon={<Hotel className="w-3 h-3" />}
              />
            )}
            <QuickBadge
              label={`Checklist ${checklistProgress}`}
              ok={eventChecklist.length > 0 && eventChecklist.every(c => c.done)}
              icon={<CheckSquare className="w-3 h-3" />}
            />
          </div>

          {/* Readiness */}
          <div className="bg-black/20 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs uppercase tracking-wider">Prontidão</p>
              <p className="text-white text-sm font-semibold">{readiness.score}%</p>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${readiness.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-white/70 text-xs mt-1">{readiness.label}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <Tabs defaultValue="ingresso">
          <TabsList className="w-full grid grid-cols-4 mb-4 h-auto p-1">
            <TabsTrigger value="ingresso" className="text-xs py-2">
              <Ticket className="w-3.5 h-3.5 mr-1" />Ingresso
            </TabsTrigger>
            <TabsTrigger value="viagem" className="text-xs py-2">
              <Bus className="w-3.5 h-3.5 mr-1" />Viagem
            </TabsTrigger>
            <TabsTrigger value="gastos" className="text-xs py-2">
              <DollarSign className="w-3.5 h-3.5 mr-1" />Gastos
            </TabsTrigger>
            <TabsTrigger value="mais" className="text-xs py-2">
              <MoreVertical className="w-3.5 h-3.5 mr-1" />Mais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ingresso" className="mt-0 space-y-4">
            <TicketSection eventId={id} ticket={ticket} />
          </TabsContent>

          <TabsContent value="viagem" className="mt-0 space-y-4">
            <TravelSection eventId={id} travel={travel} />
            <LodgingSection eventId={id} lodging={lodging} />
          </TabsContent>

          <TabsContent value="gastos" className="mt-0 space-y-4">
            <ExpensesSection eventId={id} expenses={eventExpenses} />
          </TabsContent>

          <TabsContent value="mais" className="mt-0 space-y-4">
            {/* Roteiro */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Map className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Roteiro</h3>
              </div>
              <ItinerarySection eventId={id} itinerary={eventItinerary} />
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Checklist</h3>
              </div>
              <ChecklistSection eventId={id} checklist={eventChecklist} />
            </div>

            {/* Observações */}
            {event.notes && (
              <div className="bg-card rounded-xl p-4 border">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Observações</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{event.notes}</p>
              </div>
            )}

            {/* Reflexão */}
            {(isPast || isCompleted) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Reflexão pós-show</h3>
                </div>
                <ReflectionSection eventId={id} event={event} reflection={reflection} />
              </div>
            )}

            {/* Ações */}
            <div className="pt-4 border-t space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ações</h3>
              <ShareEventDialog event={event} />
              <Button variant="outline" className="w-full justify-start" onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar evento
              </Button>
              {!isCompleted && !isPast && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setCompleteOpen(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como concluído
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive/5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir evento
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir evento"
        description={`Tem certeza que deseja excluir "${event.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Marcar como concluído"
        description={`Confirmar que "${event.title}" foi concluído?`}
        confirmLabel="Confirmar"
        onConfirm={handleComplete}
      />
    </div>
  )
}

function QuickBadge({ label, ok, icon }: { label: string; ok: boolean; icon: React.ReactNode }) {
  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      ok
        ? 'bg-green-500/20 text-green-100 border border-green-400/30'
        : 'bg-white/10 text-white/60 border border-white/20'
    )}>
      {icon}
      <span>{label}</span>
      {ok && <span>✓</span>}
    </div>
  )
}
