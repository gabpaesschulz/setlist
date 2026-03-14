import type { EventType, EventStatus, TransportType, ExpenseCategory, PurchaseType } from '@/types'

// ─── App Meta ─────────────────────────────────────────────────────────────────

export const APP_VERSION = '1.0.0'

// ─── Event Types ──────────────────────────────────────────────────────────────

export const EVENT_TYPES: Record<EventType, { label: string; icon: string }> = {
  show: { label: 'Show', icon: '🎤' },
  festival: { label: 'Festival', icon: '🎪' },
  convencao: { label: 'Convenção', icon: '🎭' },
  outro: { label: 'Outro', icon: '📅' },
}

// ─── Event Status ─────────────────────────────────────────────────────────────

export const EVENT_STATUS: Record<EventStatus, { label: string; icon: string; color: string }> = {
  ativo: { label: 'Ativo', icon: '🟢', color: 'green' },
  concluido: { label: 'Concluído', icon: '✅', color: 'blue' },
  cancelado: { label: 'Cancelado', icon: '❌', color: 'red' },
  wishlist: { label: 'Wishlist', icon: '⭐', color: 'yellow' },
}

// ─── Transport Types ──────────────────────────────────────────────────────────

export const TRANSPORT_TYPES: Record<TransportType, { label: string; icon: string }> = {
  onibus: { label: 'Ônibus', icon: '🚌' },
  excursao: { label: 'Excursão', icon: '🚐' },
  aviao: { label: 'Avião', icon: '✈️' },
  carro: { label: 'Carro', icon: '🚗' },
  carona: { label: 'Carona', icon: '🚘' },
  trem: { label: 'Trem', icon: '🚆' },
  outro: { label: 'Outro', icon: '🚀' },
}

// ─── Expense Categories ───────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string }
> = {
  ingresso: { label: 'Ingresso', icon: '🎟️', color: 'purple' },
  transporte: { label: 'Transporte', icon: '🚌', color: 'blue' },
  hospedagem: { label: 'Hospedagem', icon: '🏨', color: 'indigo' },
  alimentacao: { label: 'Alimentação', icon: '🍔', color: 'orange' },
  merch: { label: 'Merch', icon: '👕', color: 'pink' },
  extras: { label: 'Extras', icon: '✨', color: 'teal' },
  outro: { label: 'Outro', icon: '💸', color: 'gray' },
}

// ─── Ticket Providers ─────────────────────────────────────────────────────────

export const TICKET_PROVIDERS: string[] = [
  'Eventim',
  'Ticketmaster',
  'Sympla',
  'Ingresso.com',
  'Bilheteria Digital',
  'Outro',
]

// ─── Purchase Types ───────────────────────────────────────────────────────────

export const PURCHASE_TYPES: Record<PurchaseType, { label: string }> = {
  inteira: { label: 'Inteira' },
  meia: { label: 'Meia-entrada' },
  social: { label: 'Social' },
  cortesia: { label: 'Cortesia' },
  outro: { label: 'Outro' },
}

// ─── Default Checklist Items ──────────────────────────────────────────────────

export const DEFAULT_CHECKLIST_ITEMS: string[] = [
  'Comprar ingresso',
  'Organizar transporte',
  'Verificar hospedagem',
  'Separar roupa',
  'Carregar celular e power bank',
  'Verificar horário de abertura de portões',
  'Confirmar endereço do local',
  'Baixar mapas offline',
]

// ─── Readiness Levels ─────────────────────────────────────────────────────────

export const READINESS_LEVELS = {
  em_aberto: { label: 'Em Aberto', color: 'text-gray-500', bg: 'bg-gray-100', minScore: 0 },
  organizando: { label: 'Organizando', color: 'text-yellow-600', bg: 'bg-yellow-100', minScore: 25 },
  quase_pronto: { label: 'Quase Pronto', color: 'text-blue-600', bg: 'bg-blue-100', minScore: 60 },
  pronto: { label: 'Pronto!', color: 'text-green-600', bg: 'bg-green-100', minScore: 90 },
} as const

// ─── Brazilian States ─────────────────────────────────────────────────────────

export const BRAZILIAN_STATES: Array<{ value: string; label: string }> = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]
