import { hexToRgb } from '../theme'
import type { Scene, SceneOpts } from './types'

/** Starship: 3D starfield, constant warp tunnel, drifting nebula, or synthwave grid. */
export function spaceScene(mode: 'starfield' | 'warp' | 'nebula' | 'grid', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const sRgb = hexToRgb(o.secondary)
  let w = 0
  let h = 0
  let gridOffset = 0

  interface Star { x: number; y: number; z: number; pz: number; tint: number }
  const spawn = (z = Math.random()): Star => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z, pz: z, tint: Math.random() })
  const stars: Star[] = Array.from({ length: Math.round(150 + o.density * 1100) }, () => spawn())

  const clouds = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.35 + Math.random() * 0.4,
    dx: (Math.random() - 0.5) * 0.00006,
    dy: (Math.random() - 0.5) * 0.00006,
    rgb: i % 2 ? pRgb : sRgb
  }))

  return {
    resize(nw, nh) {
      w = nw
      h = nh
    },
    draw(g, dt, boost) {
      const base = mode === 'warp' ? 6 : mode === 'nebula' ? 0.25 : 1
      const v = (0.0008 + o.speed * 0.004) * (base + boost) * dt

      // Partial clear during warp leaves motion trails
      g.fillStyle = `rgba(2, 4, 10, ${boost > 2 ? 0.35 : 1})`
      g.fillRect(0, 0, w, h)

      if (mode === 'nebula') {
        for (const c of clouds) {
          c.x += c.dx * dt * 16
          c.y += c.dy * dt * 16
          if (c.x < -0.3 || c.x > 1.3) c.dx *= -1
          if (c.y < -0.3 || c.y > 1.3) c.dy *= -1
          const r = c.r * Math.max(w, h)
          const grad = g.createRadialGradient(c.x * w, c.y * h, 0, c.x * w, c.y * h, r)
          grad.addColorStop(0, `rgba(${c.rgb}, 0.13)`)
          grad.addColorStop(1, 'rgba(0,0,0,0)')
          g.fillStyle = grad
          g.fillRect(0, 0, w, h)
        }
      }

      if (mode === 'grid') {
        const horizon = h * 0.62
        const sun = g.createLinearGradient(0, horizon - 180, 0, horizon)
        sun.addColorStop(0, `rgba(${sRgb}, 0)`)
        sun.addColorStop(1, `rgba(${sRgb}, 0.18)`)
        g.fillStyle = sun
        g.fillRect(0, horizon - 180, w, 180)
        g.strokeStyle = `rgba(${pRgb}, 0.35)`
        g.lineWidth = 1
        gridOffset = (gridOffset + 0.004 * (1 + o.speed * 3 + boost) * dt) % 1
        for (let i = 0; i < 24; i++) {
          const t = (i + gridOffset) / 24
          const y = horizon + (h - horizon) * t * t
          g.globalAlpha = t
          g.beginPath()
          g.moveTo(0, y)
          g.lineTo(w, y)
          g.stroke()
        }
        g.globalAlpha = 1
        for (let i = -20; i <= 20; i++) {
          g.beginPath()
          g.moveTo(w / 2 + i * 12, horizon)
          g.lineTo(w / 2 + i * w * 0.12, h)
          g.stroke()
        }
      }

      const cx = w / 2
      const cy = mode === 'grid' ? h * 0.35 : h / 2
      const fov = Math.max(w, h) * 0.5
      const streak = boost > 1 || mode === 'warp'

      for (const s of stars) {
        s.pz = s.z
        s.z -= v
        if (s.z <= 0.01) {
          Object.assign(s, spawn(1))
          continue
        }
        const sx = cx + (s.x / s.z) * fov
        const sy = cy + (s.y / s.z) * fov
        if (mode === 'grid' && sy > h * 0.62) continue
        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
          Object.assign(s, spawn(1))
          continue
        }
        const bright = Math.min(1, (1 - s.z) * 1.4)
        const rgb = s.tint > 0.85 ? pRgb : s.tint > 0.75 ? sRgb : '220, 235, 255'
        const size = Math.max(0.4, (1 - s.z) * 2.2)
        if (streak) {
          g.strokeStyle = `rgba(${rgb}, ${bright})`
          g.lineWidth = size
          g.beginPath()
          g.moveTo(cx + (s.x / s.pz) * fov, cy + (s.y / s.pz) * fov)
          g.lineTo(sx, sy)
          g.stroke()
        } else {
          g.fillStyle = `rgba(${rgb}, ${bright})`
          g.fillRect(sx, sy, size, size)
        }
      }

      if (boost > 3) {
        const flash = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6)
        flash.addColorStop(0, `rgba(${pRgb}, ${Math.min(0.25, boost / 120)})`)
        flash.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = flash
        g.fillRect(0, 0, w, h)
      }
    }
  }
}
