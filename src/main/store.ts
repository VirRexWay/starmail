import { app, safeStorage } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { AccountInfo, Settings } from '@shared/types'

/** Everything sensitive about an account. Encrypted at rest with the OS keychain. */
export interface Secrets {
  password?: string
  accessToken?: string
  refreshToken?: string
  /** epoch ms */
  expiresAt?: number
  clientId?: string
  clientSecret?: string
}

interface StoredAccount extends AccountInfo {
  username: string
  secret: string
}

const dataDir = (): string => app.getPath('userData')
const accountsFile = (): string => join(dataDir(), 'accounts.json')
const settingsFile = (): string => join(dataDir(), 'settings.json')

let cache: StoredAccount[] | null = null

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(dataDir(), { recursive: true })
  const tmp = file + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

/** Secrets are only ever written encrypted; if the OS keychain is unavailable we refuse to store them. */
function encrypt(s: Secrets): string {
  if (Object.keys(s).length === 0) return ''
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS encryption is unavailable, so StarMail will not store credentials on this system')
  }
  return 'enc:' + safeStorage.encryptString(JSON.stringify(s)).toString('base64')
}

function decrypt(blob: string): Secrets {
  if (blob.startsWith('enc:')) {
    return JSON.parse(safeStorage.decryptString(Buffer.from(blob.slice(4), 'base64')))
  }
  // Legacy unencrypted entries from early builds; re-encrypted by load()
  if (blob.startsWith('plain:')) {
    return JSON.parse(Buffer.from(blob.slice(6), 'base64').toString('utf8'))
  }
  return {}
}

async function load(): Promise<StoredAccount[]> {
  if (!cache) {
    cache = await readJson<StoredAccount[]>(accountsFile(), [])
    const legacy = cache.filter((a) => a.secret.startsWith('plain:'))
    if (legacy.length && safeStorage.isEncryptionAvailable()) {
      for (const a of legacy) a.secret = encrypt(decrypt(a.secret))
      await persist()
    }
  }
  return cache
}

async function persist(): Promise<void> {
  await writeJson(accountsFile(), cache ?? [])
}

const toInfo = ({ secret: _s, username: _u, ...info }: StoredAccount): AccountInfo => info

export async function listAccounts(): Promise<AccountInfo[]> {
  return (await load()).map(toInfo)
}

export async function getAccount(id: string): Promise<{ info: AccountInfo; username: string; secrets: Secrets }> {
  const acc = (await load()).find((a) => a.id === id)
  if (!acc) throw new Error(`Unknown account ${id}`)
  return { info: toInfo(acc), username: acc.username, secrets: decrypt(acc.secret) }
}

export async function addAccount(info: AccountInfo, username: string, secrets: Secrets): Promise<AccountInfo> {
  const list = await load()
  list.push({ ...info, username, secret: encrypt(secrets) })
  await persist()
  return info
}

export async function updateAccount(id: string, patch: Partial<AccountInfo>): Promise<AccountInfo> {
  const acc = (await load()).find((a) => a.id === id)
  if (!acc) throw new Error(`Unknown account ${id}`)
  Object.assign(acc, patch, { id })
  await persist()
  return toInfo(acc)
}

export async function updateSecrets(id: string, patch: Partial<Secrets>): Promise<void> {
  const acc = (await load()).find((a) => a.id === id)
  if (!acc) return
  acc.secret = encrypt({ ...decrypt(acc.secret), ...patch })
  await persist()
}

export async function removeAccount(id: string): Promise<void> {
  cache = (await load()).filter((a) => a.id !== id)
  await persist()
}

export const getSettings = (): Promise<Partial<Settings>> => readJson(settingsFile(), {})
export const saveSettings = (s: Settings): Promise<void> => writeJson(settingsFile(), s)
