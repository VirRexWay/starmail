import { hexToRgb } from '../theme'
import { rand, type Scene, type SceneOpts } from './types'

const GLYPHS = 'ｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ0123456789Z:・."=*+-<>¦|'
const glyph = (): string => GLYPHS[(Math.random() * GLYPHS.length) | 0]

/**
 * Digital Rain: columns of glyphs falling and fading. Drawn incrementally: each
 * frame darkens the previous one slightly, so every glyph leaves a fading trail.
 * "cascade" is denser and faster, with horizontal glitch tears.
 */
export function rainScene(mode: 'rain' | 'cascade', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const dense = mode === 'cascade'
  const size = dense ? 13 : 16
  let w = 0
  let h = 0
  let fresh = true

  interface Drop { y: number; speed: number; row: number }
  let drops: Drop[] = []

  const reset = (d: Drop, top = false): void => {
    d.y = top ? rand(-40, 0) : rand(-h / size, h / size)
    d.speed = rand(0.18, 0.55) * (dense ? 1.6 : 1)
    d.row = Math.floor(d.y)
  }

  /** Static frame (animations off): finished trails at random heights. */
  function paintStatic(g: CanvasRenderingContext2D): void {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    g.font = `${size}px 'Share Tech Mono', 'MS Gothic', monospace`
    for (let c = 0; c < drops.length; c++) {
      const head = Math.floor(rand(0, h / size))
      const len = Math.floor(rand(6, 26))
      for (let k = 0; k < len; k++) {
        g.fillStyle = k === 0 ? 'rgba(220, 255, 230, 0.95)' : `rgba(${pRgb}, ${(1 - k / len) * 0.8})`
        g.fillText(glyph(), c * size, (head - k) * size)
      }
    }
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      const cols = Math.ceil(w / size)
      const keep = 0.35 + o.density * 0.65
      drops = Array.from({ length: cols }, () => {
        const d = { y: 0, speed: 0, row: 0 }
        reset(d)
        if (Math.random() > keep) d.speed = 0 // a sparse field leaves some columns dark
        return d
      })
      fresh = true
    },
    draw(g, dt, boost) {
      if (dt === 0) {
        if (fresh) paintStatic(g)
        fresh = false
        return
      }
      if (fresh) {
        g.fillStyle = '#000'
        g.fillRect(0, 0, w, h)
        fresh = false
      }
      // Fade the previous frame: the trails
      g.fillStyle = `rgba(0, 0, 0, ${Math.min(0.5, (dense ? 0.09 : 0.065) * dt)})`
      g.fillRect(0, 0, w, h)
      g.font = `${size}px 'Share Tech Mono', 'MS Gothic', monospace`
      g.textBaseline = 'top'

      const rate = (0.6 + o.speed * 1.2) * (1 + boost / 5) * dt
      for (let c = 0; c < drops.length; c++) {
        const d = drops[c]
        if (d.speed === 0) continue
        d.y += d.speed * rate
        const row = Math.floor(d.y)
        while (d.row < row) {
          d.row++
          const x = c * size
          const y = d.row * size
          // Re-colour the previous head as body, then draw the new bright head
          g.fillStyle = '#000'
          g.fillRect(x, y - size, size, size)
          g.fillStyle = `rgba(${pRgb}, 0.9)`
          g.fillText(glyph(), x, y - size)
          g.fillStyle = boost > 2 ? '#ffffff' : 'rgba(215, 255, 228, 0.95)'
          g.fillText(glyph(), x, y)
        }
        // Occasionally flicker a glyph somewhere in the trail
        if (Math.random() < 0.02 * dt) {
          const fy = (d.row - Math.floor(rand(2, 14))) * size
          g.fillStyle = '#000'
          g.fillRect(c * size, fy, size, size)
          g.fillStyle = `rgba(${pRgb}, 0.6)`
          g.fillText(glyph(), c * size, fy)
        }
        if (d.row * size > h + rand(0, h * 0.5)) reset(d, true)
      }

      // Glitch: tear a horizontal band and shift it sideways
      if (dense || boost > 2) {
        if (Math.random() < (dense ? 0.03 : 0.12) * dt) {
          const by = rand(0, h)
          const bh = rand(4, 40)
          const shift = rand(-40, 40)
          const dpr = g.canvas.width / w
          g.drawImage(g.canvas, 0, by * dpr, g.canvas.width, bh * dpr, shift, by, w, bh)
        }
      }
    }
  }
}
