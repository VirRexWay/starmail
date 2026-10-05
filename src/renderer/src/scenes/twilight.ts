import { hexToRgb } from '../theme'
import { glowSprite, offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * Elven Realm: an ancient wood at twilight. Golden motes of light rise between
 * the trees and leaves drift down; a surge sends a gust of wind through them.
 * "starlight" opens the sky up: low treeline, a band of stars and shooting stars.
 */
export function twilightScene(mode: 'twilight' | 'starlight', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const sRgb = hexToRgb(o.secondary)
  const open = mode === 'starlight'
  const sprite = glowSprite(pRgb)
  let w = 0
  let h = 0
  let sky: HTMLCanvasElement | null = null
  let trees: HTMLCanvasElement | null = null

  interface Star { x: number; y: number; r: number; ph: number; f: number }
  interface Mote { x: number; y: number; vx: number; vy: number; r: number; ph: number }
  interface Leaf { x: number; y: number; rot: number; vr: number; vx: number; size: number; ph: number; silver: boolean }
  interface Shooter { x: number; y: number; vx: number; vy: number; life: number }
  let stars: Star[] = []
  let motes: Mote[] = []
  let leaves: Leaf[] = []
  const shooters: Shooter[] = []

  const newMote = (y = rand(h * 0.35, h + 20)): Mote => ({ x: rand(0, w), y, vx: 0, vy: 0, r: rand(0.6, 1.8), ph: rand(0, 6.28) })
  const newLeaf = (y = rand(-h, 0)): Leaf => ({ x: rand(-40, w), y, rot: rand(0, 6.28), vr: rand(-0.04, 0.04), vx: rand(0.1, 0.5), size: rand(3, 7), ph: rand(0, 6.28), silver: Math.random() < 0.35 })

  function paintSky(): void {
    const [c, g] = offscreen(w, h)
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#04060f')
    grad.addColorStop(0.45, '#0a1430')
    grad.addColorStop(0.75, '#14284a')
    grad.addColorStop(1, `rgba(${sRgb}, 0.35)`)
    g.fillStyle = '#04060f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)

    if (open) {
      // Faint band of countless stars arcing across the sky
      g.save()
      g.translate(w / 2, h * 0.45)
      g.rotate(-0.35)
      for (let i = 0; i < 2600; i++) {
        const x = rand(-w, w)
        const y = (Math.random() + Math.random() + Math.random() - 1.5) * h * 0.12
        g.fillStyle = `rgba(220, 225, 255, ${rand(0.03, 0.22)})`
        g.fillRect(x, y, 1, 1)
      }
      const band = g.createLinearGradient(0, -h * 0.18, 0, h * 0.18)
      band.addColorStop(0, 'rgba(0,0,0,0)')
      band.addColorStop(0.5, `rgba(${sRgb}, 0.07)`)
      band.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = band
      g.fillRect(-w, -h * 0.18, w * 2, h * 0.36)
      g.restore()
    }

    // Crescent moon: a pale disc with a sky-coloured disc cut across it
    const mx = w * 0.82
    const my = h * 0.16
    const mr = Math.max(16, Math.min(w, h) * 0.04)
    const halo = g.createRadialGradient(mx, my, mr, mx, my, mr * 5)
    halo.addColorStop(0, 'rgba(230, 235, 255, 0.12)')
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = halo
    g.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10)
    g.fillStyle = 'rgba(240, 238, 225, 0.95)'
    g.beginPath()
    g.arc(mx, my, mr, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = grad
    g.beginPath()
    g.arc(mx + mr * 0.45, my - mr * 0.2, mr * 0.92, 0, Math.PI * 2)
    g.fill()
    sky = c
  }

  /** Tall slender trees with high crowns; taller toward the screen edges to frame the view. */
  function treeline(g: CanvasRenderingContext2D, baseY: number, minH: number, maxH: number, color: string, edgeBoost: number): void {
    g.fillStyle = color
    let x = -30
    while (x < w + 30) {
      const edge = Math.pow(Math.abs(x / w - 0.5) * 2, 3)
      const th = rand(minH, maxH) * (1 + edge * edgeBoost)
      const trunk = Math.max(1.5, th * 0.018)
      g.fillRect(x - trunk / 2, baseY - th * 0.62, trunk, th * 0.62 + 4)
      for (let k = 0; k < 5; k++) {
        g.beginPath()
        g.ellipse(x + rand(-th * 0.03, th * 0.03), baseY - th * (0.5 + k * 0.11), th * 0.13 * (1 - k * 0.14), th * 0.09, 0, 0, Math.PI * 2)
        g.fill()
      }
      x += rand(16, 38)
    }
    g.fillRect(0, baseY, w, h - baseY)
  }

  function paintTrees(): void {
    const [c, g] = offscreen(w, h)
    const back = h * (open ? 0.9 : 0.8)
    const front = h * (open ? 0.95 : 0.9)
    treeline(g, back, h * (open ? 0.06 : 0.16), h * (open ? 0.12 : 0.3), 'rgba(12, 26, 44, 0.92)', open ? 0.5 : 1)
    const mist = g.createLinearGradient(0, back - h * 0.12, 0, back + h * 0.05)
    mist.addColorStop(0, 'rgba(0,0,0,0)')
    mist.addColorStop(0.6, `rgba(${sRgb}, 0.13)`)
    mist.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = mist
    g.fillRect(0, back - h * 0.12, w, h * 0.17)
    treeline(g, front, h * (open ? 0.05 : 0.2), h * (open ? 0.1 : 0.42), '#03060c', open ? 1 : 2.2)
    trees = c
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      stars = Array.from({ length: Math.round((open ? 260 : 140) + o.density * (open ? 600 : 300)) }, () => ({
        x: rand(0, w),
        y: rand(0, h * 0.8),
        r: rand(0.4, 1.5),
        ph: rand(0, 6.28),
        f: rand(0.4, 1.6)
      }))
      motes = Array.from({ length: Math.round((open ? 18 : 30) + o.density * (open ? 40 : 90)) }, () => newMote(rand(0, h)))
      leaves = open ? [] : Array.from({ length: Math.round(8 + o.density * 32) }, () => newLeaf(rand(-h, h)))
      paintSky()
      paintTrees()
    },
    draw(g, dt, boost, t) {
      if (sky) g.drawImage(sky, 0, 0, w, h)

      for (const s of stars) {
        const a = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin((t / 1000) * s.f + s.ph))
        g.fillStyle = `rgba(230, 235, 255, ${a})`
        g.fillRect(s.x, s.y, s.r, s.r)
      }

      if (open && dt > 0) {
        if (Math.random() < 0.004 * dt) shooters.push({ x: rand(w * 0.1, w * 0.9), y: rand(0, h * 0.35), vx: rand(-9, -5), vy: rand(2.5, 4.5), life: 1 })
        for (let i = shooters.length - 1; i >= 0; i--) {
          const s = shooters[i]
          s.x += s.vx * dt
          s.y += s.vy * dt
          s.life -= 0.018 * dt
          if (s.life <= 0) {
            shooters.splice(i, 1)
            continue
          }
          const tail = g.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9)
          tail.addColorStop(0, `rgba(255, 255, 255, ${s.life})`)
          tail.addColorStop(1, 'rgba(255,255,255,0)')
          g.strokeStyle = tail
          g.lineWidth = 1.4
          g.beginPath()
          g.moveTo(s.x, s.y)
          g.lineTo(s.x - s.vx * 9, s.y - s.vy * 9)
          g.stroke()
        }
      }

      if (trees) g.drawImage(trees, 0, 0, w, h)

      // Rising motes of light (additive, so they bloom where they overlap)
      const cx = w / 2
      const cy = h * 0.6
      const rise = (0.12 + o.speed * 0.45) * dt
      g.globalCompositeOperation = 'lighter'
      for (const m of motes) {
        if (boost > 0.5) {
          const dx = m.x - cx
          const dy = m.y - cy
          const d = Math.hypot(dx, dy) || 1
          m.vx += (dx / d) * boost * 0.014 * dt
          m.vy += (dy / d) * boost * 0.014 * dt
        }
        const damp = Math.pow(0.95, dt)
        m.vx *= damp
        m.vy *= damp
        m.x += m.vx * dt + Math.sin(t / 1400 + m.ph) * 0.25 * dt
        m.y += m.vy * dt - rise
        if (m.y < -20 || m.x < -40 || m.x > w + 40 || m.y > h + 40) Object.assign(m, newMote(h + 10))
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 650 + m.ph * 3))
        const size = m.r * 14 * (1 + Math.min(1, boost / 20))
        g.globalAlpha = pulse * 0.75
        g.drawImage(sprite, m.x - size / 2, m.y - size / 2, size, size)
      }
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'

      // Falling leaves, blown sideways by a surge
      for (const l of leaves) {
        l.y += (0.25 + o.speed * 0.6) * dt
        l.x += (l.vx + boost * 0.18) * dt + Math.sin(t / 900 + l.ph) * 0.45 * dt
        l.rot += (l.vr + boost * 0.004) * dt
        if (l.y > h + 20 || l.x > w + 60) Object.assign(l, newLeaf(rand(-60, -10)))
        g.save()
        g.translate(l.x, l.y)
        g.rotate(l.rot)
        g.fillStyle = l.silver ? `rgba(${sRgb}, 0.75)` : `rgba(${pRgb}, 0.8)`
        g.beginPath()
        g.ellipse(0, 0, l.size, l.size * 0.42, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
  }
}
