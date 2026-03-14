'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Copy, Loader2, QrCode, Share2 } from 'lucide-react'
import type { Event } from '@/types'
import { createSharePayload } from '@/lib/domain/share'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ShareEventDialogProps {
  event: Event
}

export function ShareEventDialog({ event }: ShareEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const payload = useMemo(() => createSharePayload(event), [event])

  useEffect(() => {
    if (!open || typeof window === 'undefined') return

    let active = true

    const prepareShareAssets = async () => {
      setLoading(true)
      setError(null)

      try {
        const url = new URL('/share', window.location.origin)
        url.searchParams.set('data', payload)
        const link = url.toString()
        if (link.length > 4000) {
          throw new Error('Este evento ficou grande demais para compartilhar por link.')
        }

        if (active) {
          setShareUrl(link)
        }

        // Carrega a lib de QR somente quando o modal abre.
        const { toDataURL } = await import('qrcode')
        const qr = await toDataURL(link, {
          margin: 1,
          width: 300,
          errorCorrectionLevel: 'M',
        })

        if (active) {
          setQrUrl(qr)
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Erro ao preparar compartilhamento.')
        setQrUrl('')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void prepareShareAssets()

    return () => {
      active = false
    }
  }, [open, payload])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: 'Link copiado!',
        description: 'Agora é só enviar para quem vai importar o evento.',
      })
    } catch {
      toast({
        title: 'Não foi possível copiar',
        description: 'Copie o link manualmente no campo abaixo.',
        variant: 'destructive',
      })
    }
  }

  const handleNativeShare = async () => {
    if (!shareUrl) return

    if (!navigator.share) {
      await handleCopy()
      return
    }

    try {
      await navigator.share({
        title: `Setlist: ${event.title}`,
        text: `Evento para importar: ${event.title}`,
        url: shareUrl,
      })
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return
      toast({
        title: 'Falha ao compartilhar',
        description: 'Tente copiar o link manualmente.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar por link/QR
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar evento</DialogTitle>
          <DialogDescription>
            Envie o link ou o QR code para importar este evento em outro dispositivo.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-2">Link de compartilhamento</p>
              <Input value={shareUrl} readOnly className="text-xs" />
              <div className="mt-2 flex gap-2">
                <Button type="button" variant="secondary" className="flex-1" onClick={handleCopy} disabled={!shareUrl}>
                  <Copy className="w-4 h-4 mr-1.5" />
                  Copiar
                </Button>
                <Button type="button" className="flex-1" onClick={() => void handleNativeShare()} disabled={!shareUrl}>
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Enviar
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">QR code</p>
              </div>

              {loading && (
                <div className="h-[220px] rounded-lg border border-dashed flex items-center justify-center text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando QR...
                </div>
              )}

              {!loading && qrUrl && (
                <div className="flex justify-center">
                  <Image
                    src={qrUrl}
                    alt={`QR code para compartilhar ${event.title}`}
                    width={220}
                    height={220}
                    unoptimized
                    className="h-[220px] w-[220px] rounded-lg border bg-white p-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
