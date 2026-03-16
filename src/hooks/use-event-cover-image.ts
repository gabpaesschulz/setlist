'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/types'

const SUCCESS_CACHE_TTL_MS = 1000 * 60 * 60 * 12
const EMPTY_CACHE_TTL_MS = 1000 * 60 * 10

interface ArtistImageCacheEntry {
  imageUrl: string | null
  expiresAt: number
}

const artistImageCache = new Map<string, ArtistImageCacheEntry>()
const pendingArtistRequests = new Map<string, Promise<string | null>>()

function normalizeArtistKey(artist: string) {
  return artist.trim().toLowerCase()
}

function getCachedArtistImage(artist: string) {
  const cacheKey = normalizeArtistKey(artist)
  const cached = artistImageCache.get(cacheKey)
  if (!cached) return null

  if (cached.expiresAt <= Date.now()) {
    artistImageCache.delete(cacheKey)
    return null
  }

  return cached.imageUrl
}

async function requestArtistImage(artist: string): Promise<string | null> {
  const cacheKey = normalizeArtistKey(artist)
  if (!cacheKey) return null

  const cached = artistImageCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.imageUrl
  }

  if (cached && cached.expiresAt <= Date.now()) {
    artistImageCache.delete(cacheKey)
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

      artistImageCache.set(cacheKey, {
        imageUrl,
        expiresAt: Date.now() + (imageUrl ? SUCCESS_CACHE_TTL_MS : EMPTY_CACHE_TTL_MS),
      })
      return imageUrl
    })
    .catch(() => {
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
