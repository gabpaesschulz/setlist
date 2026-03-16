import { NextRequest, NextResponse } from 'next/server'

interface ItunesResult {
  artistName?: string
  artworkUrl100?: string
}

interface ItunesSearchResponse {
  results?: ItunesResult[]
}

interface DeezerArtistResult {
  name?: string
  picture_xl?: string
  picture_big?: string
  picture_medium?: string
}

interface DeezerSearchResponse {
  data?: DeezerArtistResult[]
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .trim()
}

function toLargeArtwork(url: string) {
  return url.replace(/\/\d+x\d+bb\./, '/600x600bb.')
}

function pickArtistImage(artist: string, results: ItunesResult[]) {
  const normalizedArtist = normalizeName(artist)
  const exactMatch = results.find((result) => {
    if (!result.artistName || !result.artworkUrl100) return false
    return normalizeName(result.artistName) === normalizedArtist
  })

  if (exactMatch?.artworkUrl100) {
    return toLargeArtwork(exactMatch.artworkUrl100)
  }

  const firstWithArtwork = results.find((result) => result.artworkUrl100)
  if (!firstWithArtwork?.artworkUrl100) return null
  return toLargeArtwork(firstWithArtwork.artworkUrl100)
}

function pickDeezerImage(artist: string, results: DeezerArtistResult[]) {
  const normalizedArtist = normalizeName(artist)

  const exactMatch = results.find((result) => {
    if (!result.name) return false
    return normalizeName(result.name) === normalizedArtist
  })

  const source = exactMatch ?? results[0]
  return source?.picture_xl || source?.picture_big || source?.picture_medium || null
}

async function fetchItunesImage(artist: string): Promise<string | null> {
  const itunesUrl = new URL('https://itunes.apple.com/search')
  itunesUrl.searchParams.set('term', artist)
  itunesUrl.searchParams.set('entity', 'song')
  itunesUrl.searchParams.set('limit', '25')
  itunesUrl.searchParams.set('country', 'BR')

  const response = await fetch(itunesUrl, {
    next: { revalidate: 60 * 60 * 12 },
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) return null

  const payload: ItunesSearchResponse = await response.json()
  const results = Array.isArray(payload.results) ? payload.results : []
  return pickArtistImage(artist, results)
}

async function fetchDeezerImage(artist: string): Promise<string | null> {
  const deezerUrl = new URL('https://api.deezer.com/search/artist')
  deezerUrl.searchParams.set('q', artist)

  const response = await fetch(deezerUrl, {
    next: { revalidate: 60 * 60 * 12 },
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) return null

  const payload: DeezerSearchResponse = await response.json()
  const results = Array.isArray(payload.data) ? payload.data : []
  return pickDeezerImage(artist, results)
}

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist')?.trim()

  if (!artist) {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  try {
    const itunesImage = await fetchItunesImage(artist)
    if (itunesImage) {
      return NextResponse.json({ imageUrl: itunesImage }, { status: 200 })
    }

    const deezerImage = await fetchDeezerImage(artist)
    const imageUrl = deezerImage || null
    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch {
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}
