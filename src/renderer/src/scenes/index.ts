import type { BackgroundId } from '@shared/types'
import type { Scene, SceneOpts } from './types'
import { spaceScene } from './space'
import { frontierScene } from './frontier'
import { twilightScene } from './twilight'
import { embersScene } from './embers'
import { rainScene } from './rain'
import { terminalScene } from './terminal'
import { neonScene } from './neon'
import { retroScene } from './retro'
import { steampunkScene } from './steampunk'
import { noirScene } from './noir'
import { seasScene } from './seas'
import { zenScene } from './zen'
import { eldritchScene } from './eldritch'

export type { Scene, SceneOpts }

export function createScene(mode: Exclude<BackgroundId, 'none'>, o: SceneOpts): Scene {
  switch (mode) {
    case 'frontier':
    case 'drift':
      return frontierScene(mode, o)
    case 'twilight':
    case 'starlight':
      return twilightScene(mode, o)
    case 'embers':
    case 'ashfall':
      return embersScene(mode, o)
    case 'rain':
    case 'cascade':
      return rainScene(mode, o)
    case 'terminal':
    case 'nettrace':
      return terminalScene(mode, o)
    case 'neoncity':
    case 'glitchgrid':
      return neonScene(mode, o)
    case 'bounce':
    case 'pipes':
      return retroScene(mode, o)
    case 'clockwork':
    case 'skyport':
      return steampunkScene(mode, o)
    case 'rainwindow':
    case 'blinds':
      return noirScene(mode, o)
    case 'ocean':
    case 'chart':
      return seasScene(mode, o)
    case 'koi':
    case 'sand':
      return zenScene(mode, o)
    case 'fog':
    case 'void':
      return eldritchScene(mode, o)
    case 'starfield':
    case 'warp':
    case 'nebula':
    case 'grid':
      return spaceScene(mode, o)
  }
}
