import { hexToRgb } from '../theme'
import { offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * Frontier: a battered transport cruising past a dusty planet at the edge of
 * the system. Stars drift sideways in parallax and streak on a hard burn.
 * "drift" drops the planet for open space with brown dust clouds.
 */
export function frontierScene(mode: 'frontier' | 'drift', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const sRgb = hexToRgb(o.secondary)
  let w = 0
  let h = 0
  let bg: HTMLCanvasElement | null = null

  interface Star { x: number; y: number; layer: number; tw: number }
  interface Dust { x: number; y: number; vx: number; vy: number; r: number; a: number }
  let stars: Star[] = []
  let dust: Dust[] = []

  function paintBackdrop(): void {
    const [c, g] = offscreen(w, h)
    // Sky: near-black up top, warming toward the horizon
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#040507')
    sky.addColorStop(0.55, '#0b090c')
    sky.addColorStop(1, `rgba(${pRgb}, 0.16)`)
    g.fillStyle = '#040507'
    g.fillRect(0, 0, w, h)
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)

    if (mode === 'drift') {
      // Long brown dust lanes across open space
      for (let i = 0; i < 7; i++) {
        const x = rand(0, w)
        const y = rand(0, h)
        const r = rand(0.25, 0.55) * Math.max(w, h)
        const grad = g.createRadialGradient(x, y, 0, x, y, r)
        grad.addColorStop(0, `rgba(${i % 2 ? sRgb : pRgb}, 0.07)`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = grad
        g.fillRect(0, 0, w, h)
      }
    } else {
      // Small pale moon, upper left
      const mx = w * 0.16
      const my = h * 0.2
      const mr = Math.max(14, Math.min(w, h) * 0.035)
      const moon = g.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr)
      moon.addColorStop(0, 'rgba(235, 225, 205, 0.9)')
      moon.addColorStop(1, 'rgba(120, 110, 95, 0.85)')
      g.fillStyle = moon
      g.beginPath()
      g.arc(mx, my, mr, 0, Math.PI * 2)
      g.fill()

      // The planet: huge, low on the right, dusty bands and a lit atmosphere rim
      const R = Math.max(w, h) * 0.78
      const px = w * 0.8
      const py = h + R * 0.62
      g.save()
      g.beginPath()
      g.arc(px, py, R, 0, Math.PI * 2)
      g.clip()
      const body = g.createRadialGradient(px - R * 0.3, py - R * 0.5, R * 0.1, px, py, R)
      body.addColorStop(0, `rgba(${sRgb}, 0.95)`)
      body.addColorStop(0.6, `rgba(${sRgb}, 0.55)`)
      body.addColorStop(1, 'rgba(20, 12, 8, 1)')
      g.fillStyle = body
      g.fillRect(px - R, py - R, R * 2, R * 2)
      for (let i = 0; i < 26; i++) {
        const y = py - R + rand(0, R * 0.9)
        g.fillStyle = i % 3 ? `rgba(40, 22, 10, ${rand(0.08, 0.22)})` : `rgba(${pRgb}, ${rand(0.05, 0.14)})`
        g.fillRect(px - R, y, R * 2, rand(3, R * 0.05))
      }
      // Night side
      const shade = g.createLinearGradient(px - R, 0, px + R * 0.2, 0)
      shade.addColorStop(0, 'rgba(0,0,0,0.85)')
      shade.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = shade
      g.fillRect(px - R, py - R, R * 2, R * 2)
      g.restore()
      g.shadowColor = `rgba(${pRgb}, 0.9)`
      g.shadowBlur = 40
      g.strokeStyle = `rgba(${pRgb}, 0.55)`
      g.lineWidth = 3
      g.beginPath()
      g.arc(px, py, R, Math.PI * 1.05, Math.PI * 1.95)
      g.stroke()
      g.shadowBlur = 0
    }
    bg = c
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      stars = Array.from({ length: Math.round(120 + o.density * 520) }, () => ({ x: rand(0, w), y: rand(0, h), layer: Math.ceil(rand(0, 3)), tw: rand(0, 6.28) }))
      dust = Array.from({ length: Math.round(20 + o.density * 90) }, () => ({ x: rand(0, w), y: rand(0, h), vx: rand(-0.6, -0.15), vy: rand(0.02, 0.12), r: rand(0.6, 2.2), a: rand(0.08, 0.3) }))
      paintBackdrop()
    },
    draw(g, dt, boost, t) {
      if (bg) g.drawImage(bg, 0, 0, w, h)
      const drift = (0.15 + o.speed * 0.9) * dt
      const surge = 1 + boost * 1.6
      const streak = boost > 1.5

      for (const s of stars) {
        s.x -= drift * s.layer * 0.35 * surge
        if (s.x < -60) {
          s.x = w + rand(0, 40)
          s.y = rand(0, h)
        }
        const a = (0.35 + 0.22 * s.layer) * (0.75 + 0.25 * Math.sin(t / 900 + s.tw))
        const warm = s.layer === 3 ? pRgb : '235, 225, 210'
        if (streak) {
          g.strokeStyle = `rgba(${warm}, ${a})`
          g.lineWidth = s.layer * 0.6
          g.beginPath()
          g.moveTo(s.x, s.y)
          g.lineTo(s.x + boost * s.layer * 2.2, s.y)
          g.stroke()
        } else {
          g.fillStyle = `rgba(${warm}, ${a})`
          g.fillRect(s.x, s.y, s.layer * 0.6, s.layer * 0.6)
        }
      }

      for (const d of dust) {
        d.x += d.vx * dt * surge * (0.5 + o.speed)
        d.y += d.vy * dt
        if (d.x < -10) d.x = w + 10
        if (d.y > h + 10) d.y = -10
        g.fillStyle = `rgba(${pRgb}, ${d.a})`
        g.beginPath()
        g.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        g.fill()
      }

      if (boost > 3) {
        // Engine flare washing in from the right
        const flare = g.createLinearGradient(w, 0, w * 0.4, 0)
        flare.addColorStop(0, `rgba(${pRgb}, ${Math.min(0.22, boost / 140)})`)
        flare.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = flare
        g.fillRect(0, 0, w, h)
      }
    }
  }
}
