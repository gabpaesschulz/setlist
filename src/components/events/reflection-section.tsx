'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Event, EventReflection } from '@/types'
import { toast } from '@/components/ui/use-toast'

interface ReflectionSectionProps {
  eventId: string
  event: Event
  reflection?: EventReflection
}

export function ReflectionSection({ eventId, event, reflection }: ReflectionSectionProps) {
  const upsertReflection = useEventsStore((s) => s.upsertReflection)
  const [editing, setEditing] = useState(!reflection)
  const [rating, setRating] = useState(reflection?.rating ?? 0)
  const [worthIt, setWorthIt] = useState(reflection?.worthIt ?? true)
  const [notes, setNotes] = useState(reflection?.notes ?? '')
  const [favoriteMoment, setFavoriteMoment] = useState(reflection?.favoriteMoment ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (rating === 0) {
      toast({ title: 'Selecione uma avaliação', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await upsertReflection({
        id: reflection?.id,
        eventId,
        rating,
        worthIt,
        notes: notes || undefined,
        favoriteMoment: favoriteMoment || undefined,
        createdAt: reflection?.createdAt ?? new Date().toISOString(),
      })
      toast({ title: 'Reflexão salva! ⭐' })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (!editing && reflection) {
    return (
      <div className="bg-card rounded-xl border p-4">
        {/* Stars */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn('w-5 h-5', s <= reflection.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')}
            />
          ))}
          <span className="ml-2 text-sm font-medium">{reflection.rating}/5</span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded-full',
            reflection.worthIt ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          )}>
            {reflection.worthIt ? '✓ Valeu a pena' : '✗ Não valeu a pena'}
          </span>
        </div>

        {reflection.favoriteMoment && (
          <div className="mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Momento favorito</p>
            <p className="text-sm">{reflection.favoriteMoment}</p>
          </div>
        )}

        {reflection.notes && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
            <p className="text-sm text-muted-foreground">{reflection.notes}</p>
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-xs">
          Editar reflexão
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border p-4 space-y-4">
      <p className="text-sm text-muted-foreground">Como foi o {event.title}?</p>

      {/* Star rating */}
      <div>
        <Label className="text-xs mb-2 block">Avaliação</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Star
                className={cn(
                  'w-7 h-7 transition-colors',
                  s <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground hover:text-amber-300'
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Worth it */}
      <div>
        <Label className="text-xs mb-2 block">Valeu a pena?</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setWorthIt(true)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              worthIt ? 'bg-green-500 text-white border-green-500' : 'bg-card border-border text-muted-foreground'
            )}
          >
            Sim ✓
          </button>
          <button
            onClick={() => setWorthIt(false)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
              !worthIt ? 'bg-red-500 text-white border-red-500' : 'bg-card border-border text-muted-foreground'
            )}
          >
            Não
          </button>
        </div>
      </div>

      {/* Favorite moment */}
      <div>
        <Label className="text-xs mb-2 block" htmlFor="favMoment">Momento favorito</Label>
        <Textarea
          id="favMoment"
          value={favoriteMoment}
          onChange={(e) => setFavoriteMoment(e.target.value)}
          placeholder="O que mais marcou..."
          rows={2}
          className="text-sm"
        />
      </div>

      {/* Notes */}
      <div>
        <Label className="text-xs mb-2 block" htmlFor="reflNotes">Notas gerais</Label>
        <Textarea
          id="reflNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Comentários, memórias, próximas vezes..."
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || rating === 0} className="flex-1">
          {saving ? 'Salvando...' : 'Salvar reflexão'}
        </Button>
        {reflection && (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  )
}
