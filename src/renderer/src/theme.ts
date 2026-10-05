import type { Settings, UniverseId } from '@shared/types'
import { FONT_STACKS, universeOf } from './universes'

export const DEFAULT_SETTINGS: Settings = {
  universe: 'starship',
  theme: 'cyan-command',
  primary: '#3ef0ff',
  secondary: '#7b8cff',
  alert: '#ff4d6d',
  background: 'starfield',
  starDensity: 0.6,
  starSpeed: 0.5,
  animation: 'full',
  sound: true,
  volume: 0.4,
  scanlines: true,
  glow: 0.7,
  font: 'orbitron',
  bootSequence: true,
  shipName: 'Meridian',
  density: 'comfortable',
  darkAdaptEmails: false,
  loadRemoteImages: false,
  pollSeconds: 90,
  notifications: true
}

/** Map an account colour from one universe palette to the same slot in another; custom colours are kept. */
export function remapAccountColor(color: string, from: UniverseId, to: UniverseId): string {
  const i = universeOf(from).accountColors.indexOf(color.toLowerCase())
  return i === -1 ? color : universeOf(to).accountColors[i]
}

/** Settings a universe takes over when you switch to it. Everything else (sound, polling, privacy...) is kept. */
export function universeDefaults(id: UniverseId): Partial<Settings> {
  const u = universeOf(id)
  const p = u.presets[0]
  return {
    universe: id,
    theme: p.id,
    primary: p.primary,
    secondary: p.secondary,
    alert: p.alert,
    font: u.defaultFont,
    background: u.defaultBackground,
    scanlines: u.scanlines
  }
}

/** Repair settings saved by older builds or for a different universe. */
export function normalizeSettings(s: Settings): Settings {
  const u = universeOf(s.universe)
  const out = { ...s, universe: u.id }
  if (!u.backgrounds.some((b) => b.id === out.background)) out.background = u.defaultBackground
  if (!u.fonts.some((f) => f.id === out.font)) out.font = u.defaultFont
  return out
}

export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16)
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`
}

export function applyTheme(s: Settings): void {
  const u = universeOf(s.universe)
  const root = document.documentElement.style
  root.setProperty('--primary', s.primary)
  root.setProperty('--primary-rgb', hexToRgb(s.primary))
  root.setProperty('--secondary', s.secondary)
  root.setProperty('--secondary-rgb', hexToRgb(s.secondary))
  root.setProperty('--alert', s.alert)
  root.setProperty('--alert-rgb', hexToRgb(s.alert))
  root.setProperty('--glow', String(s.glow))
  root.setProperty('--font-display', FONT_STACKS[s.font] ?? FONT_STACKS[u.defaultFont])
  root.setProperty('--font-body', s.font === 'mono' ? FONT_STACKS.mono : u.bodyFont)
  root.setProperty('--row-pad', s.density === 'compact' ? '8px' : '13px')
  document.body.dataset.universe = u.id
  document.body.dataset.light = String(!!u.light)
  document.body.dataset.anim = s.animation
  document.body.dataset.scanlines = String(s.scanlines)
}
