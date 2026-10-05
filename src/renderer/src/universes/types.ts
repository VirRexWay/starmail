import type { BackgroundId, FontId, UniverseId } from '@shared/types'

/**
 * A universe is a complete theme: colors, typefaces, background scene, panel
 * styling (in styles.css under body[data-universe]), sound profile, boot
 * sequence, clock and every piece of user-facing wording.
 */

export interface ThemePreset {
  id: string
  name: string
  primary: string
  secondary: string
  alert: string
}

export interface Copy {
  brand: string
  vessel: (name: string) => string
  uplinks: (n: number) => string
  shipNameLabel: string
  allChannels: string
  compose: string
  searchPlaceholder: string
  searchLabel: string
  readerLabel: string
  idleTitle: string
  emptyFolder: string
  noResults: string
  signalLost: string
  loadMore: string
  scanning: string
  decrypting: string
  composeTitle: Record<'new' | 'reply' | 'replyAll' | 'forward', string>
  send: string
  sending: string
  sendHint: string
  linkAccount: string
  linkDown: string
  welcome: string
  configureKicker: string
  addTitle: string
  simulation: string
  channelLabel: string
  channelColour: string
  handshakeOk: string
  settingsKicker: string
  settingsTitle: string
  viewscreen: string
  comms: string
  linkedChannels: string
  warpLabel: string
  warpButton: string
  kicker: Record<'info' | 'success' | 'error' | 'incoming', string>
  toast: {
    sent: string
    sendFailed: string
    archived: string
    trashed: string
    spam: string
    incoming: string
    incomingMany: (n: number) => string
    linked: string
    unlinked: string
    partialFail: string
    openFail: string
    commandFail: string
    noRecipient: string
    noRecipientBody: string
    saved: string
    saveFail: string
  }
  /** Small secondary-language captions next to panel labels (Frontier only) */
  accent?: Partial<Record<'list' | 'reader' | 'compose' | 'all', string>>
}

export interface Clock {
  label: string
  value: string
  sub: string
}

export type UniverseGroup = 'Space' | 'Fantasy' | 'Digital' | 'Atmosphere'

export interface Universe {
  id: UniverseId
  name: string
  group: UniverseGroup
  /** Light panels with dark text (affects native window buttons, overlays) */
  light?: boolean
  tagline: string
  presets: ThemePreset[]
  /** Colours offered for accounts; index-matched across universes so switching can remap them */
  accountColors: string[]
  fonts: { id: FontId; name: string }[]
  defaultFont: FontId
  /** CSS font stack for body text in this universe */
  bodyFont: string
  backgrounds: { id: BackgroundId; name: string }[]
  defaultBackground: BackgroundId
  scanlines: boolean
  boot: { title: string; subtitle: (vessel: string) => string; lines: string[]; hint: string }
  clock: (now: Date) => Clock
  copy: Copy
}

export const pad = (n: number): string => String(n).padStart(2, '0')
export const hhmm = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`
export const dayOfYear = (d: Date): number => Math.floor((+d - +new Date(d.getFullYear(), 0, 0)) / 86_400_000)
export const plural = (n: number, one: string, many = one + 's'): string => `${n} ${n === 1 ? one : many}`

export function roman(n: number): string {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  let out = ''
  for (const [v, s] of map) while (n >= v) { out += s; n -= v }
  return out || 'N'
}

export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return n + s
}
