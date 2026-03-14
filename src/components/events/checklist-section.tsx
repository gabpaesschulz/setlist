'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, CheckSquare } from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ChecklistItem } from '@/types'
import { toast } from '@/components/ui/use-toast'

interface ChecklistSectionProps {
  eventId: string
  checklist: ChecklistItem[]
}

export function ChecklistSection({ eventId, checklist }: ChecklistSectionProps) {
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const addChecklistItem = useEventsStore((s) => s.addChecklistItem)
  const updateChecklistItem = useEventsStore((s) => s.updateChecklistItem)
  const deleteChecklistItem = useEventsStore((s) => s.deleteChecklistItem)

  const done = checklist.filter((c) => c.done).length
  const total = checklist.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const handleToggle = async (item: ChecklistItem) => {
    await updateChecklistItem(item.id, { done: !item.done })
  }

  const handleDelete = async (id: string) => {
    await deleteChecklistItem(id)
  }

  const handleAdd = async () => {
    const label = newLabel.trim()
    if (!label) return
    await addChecklistItem({
      eventId,
      label,
      done: false,
      isDefault: false,
      order: checklist.length,
    })
    setNewLabel('')
    setAdding(false)
  }

  return (
    <div className="bg-card rounded-xl border p-4">
      {/* Progress */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">{done} de {total} itens</span>
            <span className="text-xs font-semibold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {checklist.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 py-2 group"
            >
              <button
                onClick={() => handleToggle(item)}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                  item.done
                    ? 'bg-primary border-primary text-white'
                    : 'border-border hover:border-primary'
                )}
              >
                {item.done && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={cn(
                'flex-1 text-sm transition-colors',
                item.done ? 'line-through text-muted-foreground' : 'text-foreground'
              )}>
                {item.label}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {total === 0 && !adding && (
        <p className="text-muted-foreground text-sm text-center py-4">
          Nenhum item no checklist
        </p>
      )}

      {/* Add item */}
      {adding ? (
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Novo item..."
            className="flex-1 h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
              if (e.key === 'Escape') setAdding(false)
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleAdd} disabled={!newLabel.trim()}>
            Adicionar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mt-3 pt-3 border-t w-full"
        >
          <Plus className="w-4 h-4" />
          Adicionar item
        </button>
      )}
    </div>
  )
}
