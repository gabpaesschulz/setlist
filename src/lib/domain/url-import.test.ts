import { describe, expect, it } from 'vitest'
import { parseTicketUrlImport } from '@/lib/domain/url-import'

describe('parseTicketUrlImport', () => {
  it('identifica link do Sympla e extrai metadados básicos', () => {
    const result = parseTicketUrlImport('https://www.sympla.com.br/evento/metallica-em-sao-paulo/2873927?date=2026-09-12&cidade=sao-paulo')

    expect(result.provider).toBe('Sympla')
    expect(result.normalizedUrl).toBe('https://www.sympla.com.br/evento/metallica-em-sao-paulo/2873927?date=2026-09-12&cidade=sao-paulo')
    expect(result.hints).toEqual({
      title: 'Metallica Em Sao Paulo',
      date: '2026-09-12',
      city: 'Sao Paulo',
    })
  })

  it('identifica link do Eventim sem protocolo e normaliza URL', () => {
    const result = parseTicketUrlImport('eventim.com.br/artist/iron-maiden/legacy-of-the-beast-2026-10-11')

    expect(result.provider).toBe('Eventim')
    expect(result.normalizedUrl).toBe('https://eventim.com.br/artist/iron-maiden/legacy-of-the-beast-2026-10-11')
    expect(result.hints.date).toBe('2026-10-11')
    expect(result.hints.title).toBe('Legacy Of The Beast 2026 10 11')
  })

  it('recusa URLs de provedores não suportados', () => {
    expect(() => parseTicketUrlImport('https://exemplo.com.br/evento/abc')).toThrow(
      'URL não suportada. Use links do Sympla ou Eventim.',
    )
  })
})
