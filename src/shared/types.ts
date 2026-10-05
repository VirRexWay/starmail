// Types shared between the main process, preload bridge and renderer.

export type ProviderId = 'gmail' | 'outlook' | 'proton' | 'imap' | 'demo'

export type AuthKind = 'password' | 'oauth-google' | 'oauth-microsoft' | 'none'

export interface ServerConfig {
  host: string
  port: number
  /** true = implicit TLS (993/465), false = STARTTLS / plain */
  secure: boolean
  /** Accept self-signed certificates (needed for Proton Mail Bridge) */
  allowSelfSigned?: boolean
}

/** Account as seen by the renderer — never contains secrets. */
export interface AccountInfo {
  id: string
  provider: ProviderId
  auth: AuthKind
  email: string
  displayName: string
  label: string
  color: string
  imap: ServerConfig
  smtp: ServerConfig
}

/** Payload the renderer sends to add an account. */
export interface NewAccountInput {
  provider: ProviderId
  auth: AuthKind
  email: string
  displayName: string
  label: string
  color: string
  imap: ServerConfig
  smtp: ServerConfig
  /** IMAP/SMTP username (defaults to email) */
  username?: string
  password?: string
  /** OAuth app credentials, used only for the OAuth providers */
  oauthClientId?: string
  oauthClientSecret?: string
}

export interface Folder {
  path: string
  name: string
  delimiter: string
  specialUse?: string
  unread?: number
  total?: number
  depth: number
}

export interface Address {
  name: string
  address: string
}

export interface MessageSummary {
  accountId: string
  folder: string
  uid: number
  subject: string
  from: Address
  to: Address[]
  date: string
  seen: boolean
  flagged: boolean
  hasAttachments: boolean
  snippet?: string
}

export interface AttachmentInfo {
  index: number
  filename: string
  contentType: string
  size: number
}

export interface MessageDetail extends MessageSummary {
  cc: Address[]
  replyTo: Address[]
  messageId?: string
  references?: string[]
  html?: string
  text?: string
  attachments: AttachmentInfo[]
}

export interface ListResult {
  messages: MessageSummary[]
  total: number
  /** Lowest sequence number loaded; pass back to load older messages */
  cursor: number
}

export interface OutgoingMessage {
  accountId: string
  to: string
  cc?: string
  bcc?: string
  subject: string
  text: string
  inReplyTo?: string
  references?: string[]
  attachments?: { path: string }[]
}

export type MessageAction = 'archive' | 'trash' | 'seen' | 'unseen' | 'flag' | 'unflag' | 'spam'

export type UniverseId =
  | 'starship'
  | 'frontier'
  | 'elven'
  | 'shadow'
  | 'rain'
  | 'zeroday'
  | 'neon'
  | 'retro'
  | 'steampunk'
  | 'noir'
  | 'seas'
  | 'zen'
  | 'eldritch'

export type BackgroundId =
  | 'starfield'
  | 'warp'
  | 'nebula'
  | 'grid'
  | 'frontier'
  | 'drift'
  | 'twilight'
  | 'starlight'
  | 'embers'
  | 'ashfall'
  | 'rain'
  | 'cascade'
  | 'terminal'
  | 'nettrace'
  | 'neoncity'
  | 'glitchgrid'
  | 'bounce'
  | 'pipes'
  | 'clockwork'
  | 'skyport'
  | 'rainwindow'
  | 'blinds'
  | 'ocean'
  | 'chart'
  | 'koi'
  | 'sand'
  | 'fog'
  | 'void'
  | 'none'

export type FontId =
  | 'orbitron'
  | 'rajdhani'
  | 'exo'
  | 'stencil'
  | 'rye'
  | 'cinzel'
  | 'cinzel-deco'
  | 'pirata'
  | 'fraktur'
  | 'vt323'
  | 'plex'
  | 'audiowide'
  | 'monoton'
  | 'pixelify'
  | 'silkscreen'
  | 'fell'
  | 'elite'
  | 'limelight'
  | 'jolly'
  | 'mincho'
  | 'quicksand'
  | 'pica'
  | 'grenze'
  | 'mono'

export interface Settings {
  universe: UniverseId
  theme: string
  primary: string
  secondary: string
  alert: string
  background: BackgroundId
  starDensity: number
  starSpeed: number
  animation: 'off' | 'subtle' | 'full'
  sound: boolean
  volume: number
  scanlines: boolean
  glow: number
  font: FontId
  bootSequence: boolean
  shipName: string
  density: 'compact' | 'comfortable'
  darkAdaptEmails: boolean
  loadRemoteImages: boolean
  pollSeconds: number
  notifications: boolean
}

export interface Api {
  accounts: {
    list(): Promise<AccountInfo[]>
    add(input: NewAccountInput): Promise<AccountInfo>
    update(id: string, patch: Partial<Pick<AccountInfo, 'label' | 'color' | 'displayName'>>): Promise<AccountInfo>
    remove(id: string): Promise<void>
    test(input: NewAccountInput): Promise<{ ok: boolean; error?: string }>
  }
  mail: {
    folders(accountId: string): Promise<Folder[]>
    list(accountId: string, folder: string, cursor?: number, limit?: number): Promise<ListResult>
    get(accountId: string, folder: string, uid: number): Promise<MessageDetail>
    action(accountId: string, folder: string, uids: number[], action: MessageAction): Promise<void>
    search(accountId: string, folder: string, query: string): Promise<MessageSummary[]>
    send(msg: OutgoingMessage): Promise<void>
    saveAttachment(accountId: string, folder: string, uid: number, index: number): Promise<string | null>
    pickAttachments(): Promise<string[]>
  }
  settings: {
    get(): Promise<Partial<Settings>>
    set(s: Settings): Promise<void>
  }
  app: {
    openExternal(url: string): Promise<void>
    notify(title: string, body: string): Promise<void>
    titleBarColor(hex: string): Promise<void>
  }
}
