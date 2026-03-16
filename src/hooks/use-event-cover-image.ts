'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/types'

const artistImageCache = new Map<string, string | null>()
const pendingArtistRequests = new Map<string, Promise<string | null>>()

function normalizeArtistKey(artist: string) {
  return artist.trim().toLowerCase()
}

function getCachedArtistImage(artist: string) {
  const cacheKey = normalizeArtistKey(artist)
  return artistImageCache.has(cacheKey) ? artistImageCache.get(cacheKey) ?? null : null
}

async function requestArtistImage(artist: string): Promise<string | null> {
  const cacheKey = normalizeArtistKey(artist)
  if (!cacheKey) return null

  if (artistImageCache.has(cacheKey)) {
    return artistImageCache.get(cacheKey) ?? null
  }

  const pendingRequest = pendingArtistRequests.get(cacheKey)
  if (pendingRequest) return pendingRequest

  const request = fetch(`/api/artist-image?artist=${encodeURIComponent(artist)}`)
    .then(async (response) => {
      if (!response.ok) return null
      const payload: { imageUrl?: string | null } = await response.json()
      const imageUrl =
        typeof payload.imageUrl === 'string' && payload.imageUrl.trim()
          ? payload.imageUrl.trim()
          : null
      artistImageCache.set(cacheKey, imageUrl)
      return imageUrl
    })
    .catch(() => {
      artistImageCache.set(cacheKey, null)
      return null
    })
    .finally(() => {
      pendingArtistRequests.delete(cacheKey)
    })

  pendingArtistRequests.set(cacheKey, request)
  return request
}

export function useEventCoverImage(event: Pick<Event, 'coverImage' | 'artist'>): string | undefined {
  const selectedImage = event.coverImage?.trim()
  const artistName = event.artist?.trim()
  const artistKey = artistName ? normalizeArtistKey(artistName) : ''

  const [artistFallback, setArtistFallback] = useState<{
    artistKey: string
    imageUrl: string | null
  } | null>(() => {
    if (selectedImage || !artistName) return null
    return {
      artistKey,
      imageUrl: getCachedArtistImage(artistName),
    }
  })

  useEffect(() => {
    let alive = true

    if (selectedImage || !artistName) {
      return () => {
        alive = false
      }
    }

    requestArtistImage(artistName).then((imageUrl) => {
      if (alive) {
        setArtistFallback({
          artistKey: normalizeArtistKey(artistName),
          imageUrl,
        })
      }
    })

    return () => {
      alive = false
    }
  }, [artistName, selectedImage])

  if (selectedImage) return selectedImage
  if (!artistKey) return undefined
  if (artistFallback?.artistKey !== artistKey) return undefined
  return artistFallback.imageUrl || undefined
}
