'use client'

import { useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Sun, Moon, Monitor, Download, Upload, RotateCcw, Sparkles,
  Smartphone, Info, Database, ChevronRight, Shield
} from 'lucide-react'
import { useEventsStore } from '@/stores/events-store'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { APP_VERSION } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [resetOpen, setResetOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const events = useEventsStore((s) => s.events)
  const expenses = useEventsStore((s) => s.expenses)
  const exportData = useEventsStore((s) => s.exportData)
  const importData = useEventsStore((s) => s.importData)
  const resetData = useEventsStore((s) => s.resetData)
  const seedDemo = useEventsStore((s) => s.seedDemo)

  const handleExport = async () => {
    try {
      const json = await exportData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `setlist-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Exportação concluída!', description: 'Arquivo salvo no seu dispositivo.' })
    } catch {
      toast({ title: 'Erro ao exportar', variant: 'destructive' })
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      await importData(text)
      toast({ title: 'Dados importados!', description: 'Todos os dados foram restaurados.' })
    } catch {
      toast({ title: 'Erro ao importar', description: 'Verifique se o arquivo é válido.', variant: 'destructive' })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleReset = async () => {
    if (resetConfirmText !== 'RESETAR') return
    await resetData()
    setResetOpen(false)
    setResetConfirmText('')
    toast({ title: 'App resetado', description: 'Todos os dados foram apagados.' })
  }

  const handleSeedDemo = async () => {
    await seedDemo()
    setDemoOpen(false)
    toast({ title: 'Dados demo carregados!', description: '8 eventos de exemplo foram adicionados.' })
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-4 pt-14 pb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize sua experiência</p>
      </div>

      <div className="px-4 space-y-6">
        {/* Aparência */}
        <Section title="Aparência" icon={<Sun className="w-4 h-4" />}>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-3">Tema</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Claro', icon: Sun },
                { value: 'dark', label: 'Escuro', icon: Moon },
                { value: 'system', label: 'Sistema', icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                    theme === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Dados */}
        <Section title="Dados" icon={<Database className="w-4 h-4" />}>
          <div className="divide-y divide-border">
            <SettingsRow
              icon={<Download className="w-4 h-4 text-blue-500" />}
              label="Exportar dados"
              description="Baixar backup em JSON"
              onClick={handleExport}
            />
            <SettingsRow
              icon={<Upload className="w-4 h-4 text-green-500" />}
              label="Importar dados"
              description="Restaurar de um arquivo JSON"
              onClick={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <SettingsRow
              icon={<Sparkles className="w-4 h-4 text-amber-500" />}
              label="Carregar dados demo"
              description="Adicionar eventos de exemplo"
              onClick={() => setDemoOpen(true)}
            />
            <SettingsRow
              icon={<RotateCcw className="w-4 h-4 text-destructive" />}
              label="Resetar todos os dados"
              description="Apaga tudo permanentemente"
              onClick={() => setResetOpen(true)}
              destructive
            />
          </div>
        </Section>

        {/* Estatísticas */}
        <Section title="Seus dados" icon={<Info className="w-4 h-4" />}>
          <div className="p-4 grid grid-cols-2 gap-3">
            <StatItem label="Eventos" value={events.length} />
            <StatItem label="Gastos" value={expenses.length} />
            <StatItem label="Versão" value={APP_VERSION} />
            <StatItem label="Armazenamento" value="Local" />
          </div>
        </Section>

        {/* PWA */}
        <Section title="Instalar no iPhone" icon={<Smartphone className="w-4 h-4" />}>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Para instalar o Setlist como app na sua tela de início:
            </p>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Abra esta página no Safari do iPhone' },
                { step: '2', text: 'Toque no ícone de Compartilhar (retângulo com seta)' },
                { step: '3', text: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
                { step: '4', text: 'Toque em "Adicionar" no canto superior direito' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </div>
                  <p className="text-sm text-foreground">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-xl">
              <p className="text-xs text-primary font-medium">
                💡 O app funciona offline! Todos os dados ficam salvos localmente no seu dispositivo.
              </p>
            </div>
          </div>
        </Section>

        {/* Sobre */}
        <Section title="Sobre" icon={<Shield className="w-4 h-4" />}>
          <div className="p-4 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">🎵</span>
            </div>
            <h3 className="font-bold text-lg">Setlist</h3>
            <p className="text-muted-foreground text-sm">v{APP_VERSION}</p>
            <p className="text-muted-foreground text-xs mt-3 max-w-xs mx-auto">
              Feito para organizar seus shows, festivais e viagens musicais. Local-first, sem backend.
            </p>
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              <span>Next.js</span>
              <span>·</span>
              <span>TypeScript</span>
              <span>·</span>
              <span>Dexie</span>
              <span>·</span>
              <span>Tailwind</span>
              <span>·</span>
              <span>PWA</span>
            </div>
          </div>
        </Section>
      </div>

      {/* Demo confirm */}
      <ConfirmDialog
        open={demoOpen}
        onOpenChange={setDemoOpen}
        title="Carregar dados demo"
        description="Isso vai adicionar 8 eventos de exemplo ao seu app. Seus dados existentes serão mantidos."
        confirmLabel="Carregar demo"
        onConfirm={handleSeedDemo}
      />

      {/* Reset confirm */}
      {resetOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg text-destructive mb-2">Resetar todos os dados</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação é irreversível. Todos os seus eventos, gastos, checklists e configurações serão apagados permanentemente.
            </p>
            <p className="text-sm font-medium mb-2">Digite <strong>RESETAR</strong> para confirmar:</p>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="RESETAR"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 bg-background"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setResetOpen(false); setResetConfirmText('') }}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={resetConfirmText !== 'RESETAR'}
                onClick={handleReset}
              >
                Resetar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function SettingsRow({
  icon, label, description, onClick, destructive
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left',
        destructive && 'hover:bg-destructive/5'
      )}
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', destructive && 'text-destructive')}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
