import { NextRequest, NextResponse } from 'next/server'

interface ItunesResult {
  artistName?: string
  artworkUrl100?: string
}

interface ItunesSearchResponse {
  results?: ItunesResult[]
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

export async function GET(request: NextRequest) {
  const artist = request.nextUrl.searchParams.get('artist')?.trim()

  if (!artist) {
    return NextResponse.json({ imageUrl: null }, { status: 400 })
  }

  const itunesUrl = new URL('https://itunes.apple.com/search')
  itunesUrl.searchParams.set('term', artist)
  itunesUrl.searchParams.set('entity', 'song')
  itunesUrl.searchParams.set('limit', '25')
  itunesUrl.searchParams.set('country', 'BR')

  try {
    const response = await fetch(itunesUrl, {
      next: { revalidate: 60 * 60 * 12 },
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({ imageUrl: null }, { status: 200 })
    }

    const payload: ItunesSearchResponse = await response.json()
    const results = Array.isArray(payload.results) ? payload.results : []
    const imageUrl = pickArtistImage(artist, results)
    return NextResponse.json({ imageUrl }, { status: 200 })
  } catch {
    return NextResponse.json({ imageUrl: null }, { status: 200 })
  }
}
