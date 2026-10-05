import type { FontId, UniverseId } from '@shared/types'
import type { Universe, UniverseGroup } from './types'
import { starship } from './starship'
import { frontier } from './frontier'
import { elven } from './elven'
import { shadow } from './shadow'
import { seas } from './seas'
import { rain } from './rain'
import { zeroday } from './zeroday'
import { neon } from './neon'
import { retro } from './retro'
import { steampunk } from './steampunk'
import { noir } from './noir'
import { zen } from './zen'
import { eldritch } from './eldritch'

export type { Copy, Clock, ThemePreset, Universe, UniverseGroup } from './types'

/**
 * A universe is a complete theme: colours, typefaces, background scene, panel
 * styling (universes.css, under body[data-universe]), sound palette (fx.ts),
 * boot sequence, clock and every piece of user-facing wording.
 * To add one: write a definition here, a scene in ../scenes, a palette in
 * ../fx.ts and a block in ../universes.css.
 */
export const UNIVERSE_LIST: Universe[] = [starship, frontier, elven, shadow, seas, rain, zeroday, neon, retro, steampunk, noir, zen, eldritch]

export const UNIVERSES = Object.fromEntries(UNIVERSE_LIST.map((u) => [u.id, u])) as Record<UniverseId, Universe>

export const UNIVERSE_GROUPS: UniverseGroup[] = ['Space', 'Fantasy', 'Digital', 'Atmosphere']

export const universeOf = (id: UniverseId | undefined): Universe => UNIVERSES[id ?? 'starship'] ?? starship

/** Display-font stacks for every typeface option */
export const FONT_STACKS: Record<FontId, string> = {
  orbitron: "'Orbitron', sans-serif",
  rajdhani: "'Rajdhani', sans-serif",
  exo: "'Exo 2', sans-serif",
  stencil: "'Saira Stencil One', 'Microsoft YaHei', sans-serif",
  rye: "'Rye', serif",
  cinzel: "'Cinzel', serif",
  'cinzel-deco': "'Cinzel Decorative', serif",
  pirata: "'Pirata One', serif",
  fraktur: "'UnifrakturCook', serif",
  vt323: "'VT323', monospace",
  plex: "'IBM Plex Mono', monospace",
  audiowide: "'Audiowide', sans-serif",
  monoton: "'Monoton', 'Audiowide', sans-serif",
  pixelify: "'Pixelify Sans', monospace",
  silkscreen: "'Silkscreen', monospace",
  fell: "'IM Fell English SC', Georgia, serif",
  elite: "'Special Elite', 'Courier New', monospace",
  limelight: "'Limelight', serif",
  jolly: "'Jolly Lodger', serif",
  mincho: "'Shippori Mincho', 'Yu Mincho', serif",
  quicksand: "'Quicksand', sans-serif",
  pica: "'IM Fell DW Pica SC', Georgia, serif",
  grenze: "'Grenze Gotisch', serif",
  mono: "'Share Tech Mono', monospace"
}
