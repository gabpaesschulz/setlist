'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Calendar, Loader2, MapPin, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEventsStore } from '@/stores/events-store'
import { generateDefaultChecklist } from '@/lib/domain/checklist'
import { findDuplicateSharedEvent, parseSharePayload } from '@/lib/domain/share'
import { formatDateLong } from '@/lib/formatters'
import { toast } from '@/components/ui/use-toast'

export default function ShareImportPage() {
  return (
    <Suspense fallback={<ShareImportFallback />}>
      <ShareImportContent />
    </Suspense>
  )
}

function ShareImportContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const events = useEventsStore((s) => s.events)
  const addEvent = useEventsStore((s) => s.addEvent)
  const addChecklistItem = useEventsStore((s) => s.addChecklistItem)

  const [importing, setImporting] = useState(false)

  const parsed = useMemo(() => {
    const raw = searchParams.get('data')
    if (!raw) {
      return { payload: null, error: 'Este link não contém dados de evento.' }
    }

    try {
      return { payload: parseSharePayload(raw), error: null }
    } catch (err) {
      return {
        payload: null,
        error: err instanceof Error ? err.message : 'Não foi possível ler este link.',
      }
    }
  }, [searchParams])

  const duplicateEvent = useMemo(() => {
    if (!parsed.payload) return null
    return findDuplicateSharedEvent(events, parsed.payload.event)
  }, [events, parsed.payload])

  const handleImport = async () => {
    if (!parsed.payload) return
    if (duplicateEvent) {
      toast({
        title: 'Evento já existe',
        description: `${duplicateEvent.title} já está na sua lista.`,
      })
      router.push(`/events/${duplicateEvent.id}`)
      return
    }

    setImporting(true)
    try {
      const created = await addEvent({
        title: parsed.payload.event.title,
        artist: parsed.payload.event.artist,
        type: parsed.payload.event.type,
        status: 'ativo',
        date: parsed.payload.event.date,
        endDate: parsed.payload.event.endDate,
        time: parsed.payload.event.time,
        city: parsed.payload.event.city,
        state: parsed.payload.event.state,
        venue: parsed.payload.event.venue,
        notes: parsed.payload.event.notes,
        coverImage: undefined,
      })

      const defaultChecklist = generateDefaultChecklist(created.id)
      await Promise.all(defaultChecklist.map((item) => addChecklistItem(item)))

      toast({
        title: 'Evento importado!',
        description: `${created.title} foi adicionado na sua lista.`,
      })
      router.push(`/events/${created.id}`)
    } catch (err) {
      toast({
        title: 'Falha ao importar',
        description: err instanceof Error ? err.message : 'Erro inesperado ao importar evento.',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  if (!parsed.payload) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto w-full max-w-lg rounded-2xl border bg-card p-6">
          <h1 className="text-lg font-semibold">Link inválido</h1>
          <p className="mt-2 text-sm text-muted-foreground">{parsed.error}</p>
          <Link href="/events" className="mt-4 inline-flex">
            <Button variant="outline">Ir para eventos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { event } = parsed.payload

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto w-full max-w-lg space-y-4">
        <Link href="/events" className="inline-flex">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </Link>

        <div className="rounded-2xl border bg-card p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Compartilhado com você</p>
          <h1 className="mt-1 text-xl font-bold leading-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">{event.artist}</p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>
                {formatDateLong(event.date)}
                {event.endDate ? ` - ${formatDateLong(event.endDate)}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{event.venue} - {event.city}, {event.state}</span>
            </div>
          </div>

          {event.notes && (
            <div className="mt-4 rounded-xl bg-muted/40 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{event.notes}</p>
            </div>
          )}

          {duplicateEvent && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2 text-amber-900 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Esse evento já existe na sua lista.</p>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                    Para evitar duplicidade, a importação foi bloqueada.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/events/${duplicateEvent.id}`)}
                    className="border-amber-600/40 bg-transparent text-amber-900 hover:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/10"
                  >
                    Abrir evento existente
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleImport} className="mt-5 w-full" disabled={importing || Boolean(duplicateEvent)}>
            {duplicateEvent ? (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Evento já importado
              </>
            ) : importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar este evento
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ShareImportFallback() {
  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto flex w-full max-w-lg items-center justify-center rounded-2xl border bg-card p-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando compartilhamento...
      </div>
    </div>
  )
}
