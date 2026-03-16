export type AutoBackupFrequency = 'daily' | 'weekly'

export interface AutoBackupConfig {
  enabled: boolean
  frequency: AutoBackupFrequency
  retention: number
}

export interface AutoBackupRunInput {
  config: AutoBackupConfig
  now?: Date
  lastBackupAt?: string
}

const CONFIG_KEY = 'backup.auto.config'

const DEFAULT_CONFIG: AutoBackupConfig = {
  enabled: false,
  frequency: 'daily',
  retention: 7,
}

function parseConfig(raw: string | null): AutoBackupConfig {
  if (!raw) return DEFAULT_CONFIG
  try {
    const parsed = JSON.parse(raw) as Partial<AutoBackupConfig>
    const enabled = parsed.enabled === true
    const frequency = parsed.frequency === 'weekly' ? 'weekly' : 'daily'
    const retention =
      typeof parsed.retention === 'number' && Number.isFinite(parsed.retention)
        ? clampRetention(parsed.retention)
        : DEFAULT_CONFIG.retention
    return { enabled, frequency, retention }
  } catch {
    return DEFAULT_CONFIG
  }
}

function clampRetention(value: number): number {
  return Math.min(60, Math.max(1, Math.round(value)))
}

export function getAutoBackupConfig(): AutoBackupConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  return parseConfig(localStorage.getItem(CONFIG_KEY))
}

export function setAutoBackupConfig(config: AutoBackupConfig): AutoBackupConfig {
  const normalized: AutoBackupConfig = {
    enabled: config.enabled,
    frequency: config.frequency === 'weekly' ? 'weekly' : 'daily',
    retention: clampRetention(config.retention),
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(normalized))
  }
  return normalized
}

export function shouldRunAutoBackup({
  config,
  now = new Date(),
  lastBackupAt,
}: AutoBackupRunInput): boolean {
  if (!config.enabled) return false
  if (!lastBackupAt) return true

  const lastDate = new Date(lastBackupAt)
  if (Number.isNaN(lastDate.getTime())) return true

  const msDiff = now.getTime() - lastDate.getTime()
  if (msDiff < 0) return false

  if (config.frequency === 'daily') {
    return msDiff >= 24 * 60 * 60 * 1000
  }
  return msDiff >= 7 * 24 * 60 * 60 * 1000
}

export function formatBackupDateLabel(dateIso: string): string {
  const value = new Date(dateIso)
  if (Number.isNaN(value.getTime())) return 'Data inválida'
  return value.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}
