import { hexToRgb } from '../theme'
import { offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * Neon City. "neoncity": a rainy skyline at night with lit windows, flickering
 * neon signs and flying cars streaking between the towers. "glitchgrid": a neon
 * perspective grid under a striped sun, torn by glitches.
 */
export function neonScene(mode: 'neoncity' | 'glitchgrid', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const sRgb = hexToRgb(o.secondary)
  const aRgb = hexToRgb(o.alert)
  let w = 0
  let h = 0
  let city: HTMLCanvasElement | null = null
  let gridOffset = 0

  interface Sign { x: number; y: number; w: number; h: number; rgb: string; ph: number; flicker: number }
  interface Drop { x: number; y: number; len: number; v: number }
  interface Car { x: number; y: number; v: number; rgb: string }
  let signs: Sign[] = []
  let drops: Drop[] = []
  let cars: Car[] = []

  function paintCity(): void {
    const [c, g] = offscreen(w, h)
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#05010f')
    sky.addColorStop(0.6, '#140726')
    sky.addColorStop(1, `rgba(${pRgb}, 0.25)`)
    g.fillStyle = '#05010f'
    g.fillRect(0, 0, w, h)
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    signs = []
    // Three layers of towers, nearer = darker and taller
    const layers = [
      { shade: '#1a0f2e', minH: 0.25, maxH: 0.5, win: 0.25, step: [30, 70] },
      { shade: '#110a20', minH: 0.35, maxH: 0.7, win: 0.35, step: [40, 90] },
      { shade: '#07040e', minH: 0.45, maxH: 0.85, win: 0.45, step: [50, 120] }
    ]
    for (const L of layers) {
      let x = -20
      while (x < w) {
        const bw = rand(L.step[0], L.step[1])
        const bh = h * rand(L.minH, L.maxH)
        const top = h - bh
        g.fillStyle = L.shade
        g.fillRect(x, top, bw, bh)
        if (Math.random() < 0.3) g.fillRect(x + bw * 0.4, top - rand(10, 40), 2, rand(10, 40)) // antenna
        // Lit windows
        for (let wy = top + 8; wy < h - 6; wy += 9) {
          for (let wx = x + 5; wx < x + bw - 6; wx += 7) {
            if (Math.random() < L.win * 0.35) {
              const warm = Math.random() < 0.6
              g.fillStyle = warm ? `rgba(255, 200, 120, ${rand(0.15, 0.5)})` : `rgba(${Math.random() < 0.5 ? pRgb : sRgb}, ${rand(0.2, 0.55)})`
              g.fillRect(wx, wy, 3, 4)
            }
          }
        }
        if (L === layers[2] && Math.random() < 0.5) {
          const sw = rand(18, Math.min(60, bw * 0.8))
          signs.push({ x: x + rand(4, Math.max(5, bw - sw - 4)), y: top + rand(14, Math.min(120, bh * 0.4)), w: sw, h: rand(8, 30), rgb: [pRgb, sRgb, aRgb][Math.floor(rand(0, 3))], ph: rand(0, 6.28), flicker: 0 })
        }
        x += bw + rand(0, 10)
      }
    }
    city = c
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      paintCity()
      drops = Array.from({ length: Math.round(80 + o.density * 260) }, () => ({ x: rand(0, w), y: rand(0, h), len: rand(8, 22), v: rand(9, 16) }))
      cars = Array.from({ length: Math.round(3 + o.density * 8) }, () => ({ x: rand(0, w), y: rand(h * 0.15, h * 0.6), v: rand(1.2, 3.5) * (Math.random() < 0.5 ? -1 : 1), rgb: Math.random() < 0.5 ? pRgb : '255, 255, 255' }))
    },
    draw(g, dt, boost, t) {
      if (mode === 'glitchgrid') {
        g.fillStyle = '#06010d'
        g.fillRect(0, 0, w, h)
        const horizon = h * 0.55
        // Striped sun
        const sx = w / 2
        const sr = Math.min(w, h) * 0.22
        const sun = g.createLinearGradient(0, horizon - sr * 2, 0, horizon)
        sun.addColorStop(0, `rgba(${aRgb}, 0.9)`)
        sun.addColorStop(1, `rgba(${pRgb}, 0.9)`)
        g.save()
        g.beginPath()
        g.arc(sx, horizon - sr * 0.15, sr, Math.PI, 0)
        g.clip()
        g.fillStyle = sun
        g.fillRect(sx - sr, horizon - sr * 2, sr * 2, sr * 2)
        g.fillStyle = '#06010d'
        for (let i = 0; i < 7; i++) g.fillRect(sx - sr, horizon - sr * 0.15 - i * sr * 0.12 - 2, sr * 2, 2 + i * 0.8)
        g.restore()
        g.strokeStyle = `rgba(${pRgb}, 0.55)`
        g.lineWidth = 1
        gridOffset = (gridOffset + 0.005 * (1 + o.speed * 3 + boost * 0.6) * dt) % 1
        for (let i = 0; i < 26; i++) {
          const k = (i + gridOffset) / 26
          const y = horizon + (h - horizon) * k * k
          g.globalAlpha = 0.2 + k * 0.8
          g.beginPath()
          g.moveTo(0, y)
          g.lineTo(w, y)
          g.stroke()
        }
        g.globalAlpha = 1
        for (let i = -24; i <= 24; i++) {
          g.beginPath()
          g.moveTo(w / 2 + i * 10, horizon)
          g.lineTo(w / 2 + i * w * 0.1, h)
          g.stroke()
        }
      } else {
        if (city) g.drawImage(city, 0, 0, w, h)
        // Neon signs: steady glow with the occasional stutter
        for (const s of signs) {
          if (dt > 0 && Math.random() < 0.004 * dt) s.flicker = rand(4, 14)
          if (s.flicker > 0) s.flicker -= dt
          const on = s.flicker > 0 ? Math.random() < 0.4 : true
          const a = on ? 0.75 + 0.2 * Math.sin(t / 300 + s.ph) + Math.min(0.25, boost / 40) : 0.15
          g.shadowColor = `rgba(${s.rgb}, ${a})`
          g.shadowBlur = 18
          g.strokeStyle = `rgba(${s.rgb}, ${a})`
          g.lineWidth = 2
          g.strokeRect(s.x, s.y, s.w, s.h)
          g.fillStyle = `rgba(${s.rgb}, ${a * 0.25})`
          g.fillRect(s.x, s.y, s.w, s.h)
        }
        g.shadowBlur = 0
        // Flying cars
        for (const c of cars) {
          c.x += c.v * (1 + o.speed) * (1 + boost / 8) * dt
          if (c.x < -60) c.x = w + 40
          if (c.x > w + 60) c.x = -40
          const tail = g.createLinearGradient(c.x, c.y, c.x - Math.sign(c.v) * 40, c.y)
          tail.addColorStop(0, `rgba(${c.rgb}, 0.9)`)
          tail.addColorStop(1, 'rgba(0,0,0,0)')
          g.strokeStyle = tail
          g.lineWidth = 2
          g.beginPath()
          g.moveTo(c.x, c.y)
          g.lineTo(c.x - Math.sign(c.v) * 40, c.y)
          g.stroke()
        }
        // Rain
        g.strokeStyle = `rgba(${sRgb}, 0.28)`
        g.lineWidth = 1
        g.beginPath()
        for (const d of drops) {
          d.y += d.v * dt
          d.x -= d.v * 0.15 * dt
          if (d.y > h) {
            d.y = rand(-40, 0)
            d.x = rand(0, w + 60)
          }
          g.moveTo(d.x, d.y)
          g.lineTo(d.x + d.len * 0.15, d.y - d.len)
        }
        g.stroke()
      }

      // Glitch tears: constant in the grid, triggered by a surge in the city
      const tearChance = mode === 'glitchgrid' ? 0.04 + boost * 0.02 : boost > 2 ? 0.15 : 0
      if (dt > 0 && Math.random() < tearChance * dt) {
        const dpr = g.canvas.width / w
        for (let i = 0; i < 3; i++) {
          const by = rand(0, h)
          const bh = rand(3, 30)
          g.drawImage(g.canvas, 0, by * dpr, g.canvas.width, bh * dpr, rand(-50, 50), by, w, bh)
        }
      }
      if (boost > 3) {
        g.fillStyle = `rgba(${pRgb}, ${Math.min(0.18, boost / 160)})`
        g.fillRect(0, 0, w, h)
      }
    }
  }
}
