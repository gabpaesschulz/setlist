type TicketProvider = 'Sympla' | 'Eventim'

interface ImportedHints {
  title?: string
  date?: string
  city?: string
}

export interface TicketUrlImportResult {
  provider: TicketProvider
  normalizedUrl: string
  hints: ImportedHints
}

const DATE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function parseTicketUrlImport(rawUrl: string): TicketUrlImportResult {
  const parsedUrl = parseUrl(rawUrl)
  const provider = detectProvider(parsedUrl)
  if (!provider) {
    throw new Error('URL não suportada. Use links do Sympla ou Eventim.')
  }

  const hints: ImportedHints = {
    title: extractTitle(parsedUrl, provider),
    date: extractDate(parsedUrl),
    city: extractCity(parsedUrl),
  }

  return {
    provider,
    normalizedUrl: parsedUrl.toString(),
    hints,
  }
}

function parseUrl(rawUrl: string): URL {
  const value = rawUrl.trim()
  if (!value) {
    throw new Error('Informe uma URL para importar.')
  }

  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value)
    }
    return new URL(`https://${value}`)
  } catch {
    throw new Error('URL inválida para importação.')
  }
}

function detectProvider(url: URL): TicketProvider | null {
  const host = url.hostname.toLowerCase()
  if (host.includes('sympla')) return 'Sympla'
  if (host.includes('eventim')) return 'Eventim'
  return null
}

function extractTitle(url: URL, provider: TicketProvider): string | undefined {
  const segments = url.pathname
    .split('/')
    .map((segment) => decodeURIComponent(segment).trim())
    .filter(Boolean)

  const candidate =
    provider === 'Sympla'
      ? segments.find((segment) => /[a-z]/i.test(segment) && !/^\d+$/.test(segment) && !isBoilerplateSegment(segment))
      : [...segments]
          .reverse()
          .find((segment) => /[a-z]/i.test(segment) && !isBoilerplateSegment(segment))

  if (!candidate) return undefined
  return toTitleCase(candidate)
}

function extractDate(url: URL): string | undefined {
  const searchParams = ['date', 'data', 'eventDate', 'event_date', 'dia']
  for (const key of searchParams) {
    const value = url.searchParams.get(key)?.trim()
    if (!value) continue

    const normalized = normalizeDate(value)
    if (normalized) return normalized
  }

  const pathDate = url.pathname.match(/(\d{4})[-_/](\d{2})[-_/](\d{2})/)
  if (pathDate) {
    return `${pathDate[1]}-${pathDate[2]}-${pathDate[3]}`
  }

  return undefined
}

function extractCity(url: URL): string | undefined {
  const value = url.searchParams.get('city') ?? url.searchParams.get('cidade')
  if (!value) return undefined
  return toTitleCase(value)
}

function normalizeDate(value: string): string | undefined {
  if (DATE_ISO_PATTERN.test(value)) {
    return value
  }

  const brDate = value.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (brDate) {
    return `${brDate[3]}-${brDate[2]}-${brDate[1]}`
  }

  return undefined
}

function isBoilerplateSegment(segment: string): boolean {
  const normalized = segment.toLowerCase()
  return ['artist', 'evento', 'eventos', 'tickets', 'ingressos'].includes(normalized)
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
