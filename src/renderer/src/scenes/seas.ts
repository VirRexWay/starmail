import { hexToRgb } from '../theme'
import { offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * High Seas. "ocean": a moonlit night sea with layered waves and a ship riding
 * the swell; a surge fires its cannon and heaves the waves. "chart": an old sea
 * chart with rhumb lines, a compass rose, islands and a route to the X.
 */
export function seasScene(mode: 'ocean' | 'chart', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  let w = 0
  let h = 0
  let bg: HTMLCanvasElement | null = null
  let cannon = 0
  let swell = 0

  // chart state
  let route: { x: number; y: number }[] = []
  let routeLen = 0
  let shipT = 0
  let dash = 0
  let fog: { x: number; y: number; r: number; v: number }[] = []

  const horizon = (): number => h * 0.6

  function waveY(layer: number, x: number, t: number): number {
    const base = horizon() + layer * (h * 0.4) * (0.08 + layer * 0.08)
    const amp = (3 + layer * 4) * (1 + swell)
    return base + Math.sin(x * (0.012 - layer * 0.0015) + t / (1400 - layer * 150) + layer) * amp + Math.sin(x * 0.031 + t / 900 + layer * 2) * amp * 0.35
  }

  function island(g: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    const pts: [number, number][] = []
    const n = 28
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const rr = r * (0.7 + 0.35 * Math.sin(a * 3 + cx) + rand(-0.08, 0.08))
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7])
    }
    // Shore hatching: a few offset outlines, fading outward
    for (let k = 3; k >= 0; k--) {
      g.strokeStyle = `rgba(40, 26, 12, ${0.1 + (3 - k) * 0.12})`
      g.lineWidth = 1
      g.beginPath()
      pts.forEach(([x, y], i) => {
        const dx = (x - cx) * (1 + k * 0.06)
        const dy = (y - cy) * (1 + k * 0.06)
        if (i) g.lineTo(cx + dx, cy + dy)
        else g.moveTo(cx + dx, cy + dy)
      })
      g.closePath()
      g.stroke()
    }
    g.fillStyle = 'rgba(90, 70, 40, 0.35)'
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.closePath()
    g.fill()
  }

  function compass(g: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    g.strokeStyle = 'rgba(40, 26, 12, 0.55)'
    g.lineWidth = 1
    for (const rr of [r, r * 0.92, r * 0.4]) {
      g.beginPath()
      g.arc(x, y, rr, 0, Math.PI * 2)
      g.stroke()
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2
      const len = i % 2 ? r * 0.6 : r * 0.95
      const side = (i % 2 ? r * 0.1 : r * 0.16)
      const tip = [x + Math.cos(a) * len, y + Math.sin(a) * len]
      const l = [x + Math.cos(a - Math.PI / 2) * side, y + Math.sin(a - Math.PI / 2) * side]
      const rt = [x + Math.cos(a + Math.PI / 2) * side, y + Math.sin(a + Math.PI / 2) * side]
      g.fillStyle = 'rgba(40, 26, 12, 0.65)'
      g.beginPath()
      g.moveTo(tip[0], tip[1])
      g.lineTo(l[0], l[1])
      g.lineTo(x, y)
      g.fill()
      g.fillStyle = `rgba(${pRgb}, 0.45)`
      g.beginPath()
      g.moveTo(tip[0], tip[1])
      g.lineTo(rt[0], rt[1])
      g.lineTo(x, y)
      g.fill()
    }
    g.fillStyle = 'rgba(40, 26, 12, 0.75)'
    g.font = `${Math.round(r * 0.28)}px 'IM Fell English SC', serif`
    g.textAlign = 'center'
    g.fillText('N', x, y - r * 1.05)
  }

  function paintBg(): void {
    const [c, g] = offscreen(w, h)
    if (mode === 'ocean') {
      const sky = g.createLinearGradient(0, 0, 0, horizon())
      sky.addColorStop(0, '#02040c')
      sky.addColorStop(1, '#13233d')
      g.fillStyle = sky
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 260; i++) {
        g.fillStyle = `rgba(230, 235, 255, ${rand(0.2, 0.8)})`
        g.fillRect(rand(0, w), rand(0, horizon() * 0.95), rand(0.5, 1.5), rand(0.5, 1.5))
      }
      const mx = w * 0.88
      const my = h * 0.13
      const mr = Math.max(18, Math.min(w, h) * 0.045)
      const halo = g.createRadialGradient(mx, my, mr, mx, my, mr * 6)
      halo.addColorStop(0, 'rgba(240, 235, 210, 0.18)')
      halo.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = halo
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#efe8d2'
      g.beginPath()
      g.arc(mx, my, mr, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#0a1426'
      g.fillRect(0, horizon(), w, h - horizon())
    } else {
      // Aged, candle-lit parchment: kept fairly dark so the panels stay readable
      const base = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75)
      base.addColorStop(0, '#6e5636')
      base.addColorStop(0.7, '#4a3720')
      base.addColorStop(1, '#22180c')
      g.fillStyle = base
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 9; i++) {
        const x = rand(0, w)
        const y = rand(0, h)
        const r = rand(30, 140)
        const stain = g.createRadialGradient(x, y, r * 0.6, x, y, r)
        stain.addColorStop(0, 'rgba(60, 40, 20, 0.05)')
        stain.addColorStop(0.9, 'rgba(60, 40, 20, 0.18)')
        stain.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = stain
        g.fillRect(x - r, y - r, r * 2, r * 2)
      }
      for (let i = 0; i < 3000; i++) {
        g.fillStyle = `rgba(30, 20, 8, ${rand(0.03, 0.1)})`
        g.fillRect(rand(0, w), rand(0, h), 1, 1)
      }
      // Rhumb lines from two wind roses
      for (const [cx, cy] of [[w * 0.18, h * 0.72], [w * 0.8, h * 0.3]]) {
        g.strokeStyle = 'rgba(40, 26, 12, 0.18)'
        g.lineWidth = 0.8
        for (let i = 0; i < 32; i++) {
          const a = (i / 32) * Math.PI * 2
          g.beginPath()
          g.moveTo(cx, cy)
          g.lineTo(cx + Math.cos(a) * w * 1.5, cy + Math.sin(a) * w * 1.5)
          g.stroke()
        }
      }
      island(g, w * 0.32, h * 0.32, Math.min(w, h) * 0.09)
      island(g, w * 0.66, h * 0.7, Math.min(w, h) * 0.12)
      island(g, w * 0.9, h * 0.85, Math.min(w, h) * 0.06)
      compass(g, w * 0.18, h * 0.72, Math.min(w, h) * 0.1)
      // The X
      const xx = w * 0.68
      const xy = h * 0.66
      g.strokeStyle = 'rgba(150, 30, 20, 0.85)'
      g.lineWidth = 4
      g.beginPath()
      g.moveTo(xx - 10, xy - 10)
      g.lineTo(xx + 10, xy + 10)
      g.moveTo(xx + 10, xy - 10)
      g.lineTo(xx - 10, xy + 10)
      g.stroke()
      route = [
        { x: w * 0.05, y: h * 0.15 },
        { x: w * 0.22, y: h * 0.2 },
        { x: w * 0.4, y: h * 0.48 },
        { x: w * 0.52, y: h * 0.42 },
        { x: xx, y: xy }
      ]
      routeLen = route.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - route[i].x, p.y - route[i].y), 0)
    }
    bg = c
  }

  function pointAt(d: number): { x: number; y: number; a: number } {
    for (let i = 1; i < route.length; i++) {
      const seg = Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y)
      if (d <= seg) {
        const k = d / seg
        return { x: route[i - 1].x + (route[i].x - route[i - 1].x) * k, y: route[i - 1].y + (route[i].y - route[i - 1].y) * k, a: Math.atan2(route[i].y - route[i - 1].y, route[i].x - route[i - 1].x) }
      }
      d -= seg
    }
    const last = route[route.length - 1]
    return { ...last, a: 0 }
  }

  function drawShip(g: CanvasRenderingContext2D, x: number, y: number, angle: number, s: number, lit: string): void {
    g.save()
    g.translate(x, y)
    g.rotate(angle)
    g.scale(s, s)
    g.fillStyle = '#05070d'
    g.beginPath()
    g.moveTo(-60, -6)
    g.lineTo(62, -6)
    g.lineTo(48, 12)
    g.lineTo(-48, 12)
    g.closePath()
    g.fill()
    g.fillRect(-58, -16, 22, 10) // stern castle
    for (const [mx, mh] of [[-24, 70], [10, 86], [40, 60]]) {
      g.fillRect(mx - 1.5, -6 - mh, 3, mh)
      g.beginPath()
      g.moveTo(mx - 20, -mh * 0.85)
      g.quadraticCurveTo(mx + 6, -mh * 0.55, mx - 20, -mh * 0.2)
      g.lineTo(mx + 18, -mh * 0.25)
      g.quadraticCurveTo(mx + 30, -mh * 0.55, mx + 18, -mh * 0.85)
      g.closePath()
      g.fill()
    }
    g.fillStyle = lit
    g.fillRect(-46, -2, 3, 3)
    g.fillRect(-30, -2, 3, 3)
    g.fillRect(-14, -2, 3, 3)
    g.restore()
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      paintBg()
      fog = Array.from({ length: 8 }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(80, 220), v: rand(0.08, 0.25) }))
    },
    draw(g, dt, boost, t) {
      if (bg) g.drawImage(bg, 0, 0, w, h)
      swell += ((boost > 3 ? 1.2 : 0) - swell) * 0.03 * dt

      if (mode === 'ocean') {
        // Moonlight path
        const mx = w * 0.88
        for (let y = horizon() + 2; y < h; y += 4) {
          const spread = (y - horizon()) * 0.35 + 10
          const x = mx + Math.sin(y * 0.3 + t / 400) * spread * 0.4
          g.fillStyle = `rgba(240, 232, 200, ${0.04 + Math.random() * 0.12})`
          g.fillRect(x - spread * rand(0.1, 0.4), y, spread * rand(0.2, 0.8), 1.5)
        }
        const layers = 4
        const shipX = ((t / 60) * (0.2 + o.speed * 0.4) + w * 0.3) % (w + 300) - 150
        for (let L = 0; L < layers; L++) {
          if (L === 1) {
            const y = waveY(0, shipX, t)
            const tilt = Math.atan2(waveY(0, shipX + 20, t) - y, 20)
            drawShip(g, shipX, y - 4, tilt, Math.min(w, h) / 900, `rgba(${pRgb}, 0.8)`)
            if (boost > 5 && cannon <= 0) cannon = 1
            if (cannon > 0) {
              const fx = shipX + 40
              const fy = y - 6
              const f = g.createRadialGradient(fx, fy, 0, fx, fy, 40 * cannon)
              f.addColorStop(0, `rgba(255, 220, 150, ${cannon})`)
              f.addColorStop(1, 'rgba(255, 140, 60, 0)')
              g.fillStyle = f
              g.fillRect(fx - 40, fy - 40, 80, 80)
              cannon -= 0.03 * dt
            }
          }
          const shade = 14 + L * 4
          g.fillStyle = `rgb(${6 + L * 2}, ${shade}, ${30 + L * 8})`
          g.beginPath()
          g.moveTo(0, h)
          for (let x = 0; x <= w + 20; x += 20) g.lineTo(x, waveY(L, x, t))
          g.lineTo(w, h)
          g.closePath()
          g.fill()
          g.strokeStyle = `rgba(200, 215, 235, ${0.08 + L * 0.03})`
          g.lineWidth = 1
          g.beginPath()
          for (let x = 0; x <= w + 20; x += 20) (x ? g.lineTo(x, waveY(L, x, t)) : g.moveTo(x, waveY(L, x, t)))
          g.stroke()
        }
        return
      }

      // Chart: marching route, a little ship sailing it, fog drifting over
      dash = (dash + 0.4 * dt) % 20
      g.setLineDash([8, 7])
      g.lineDashOffset = -dash
      g.strokeStyle = 'rgba(150, 30, 20, 0.6)'
      g.lineWidth = 2
      g.beginPath()
      route.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)))
      g.stroke()
      g.setLineDash([])
      shipT = (shipT + (0.6 + o.speed * 1.2) * (1 + boost / 4) * dt) % routeLen
      const p = pointAt(shipT)
      drawShip(g, p.x, p.y, 0, Math.min(w, h) / 2800, `rgba(${pRgb}, 0.9)`)
      for (const f of fog) {
        f.x += f.v * dt
        if (f.x - f.r > w) f.x = -f.r
        const grad = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r)
        grad.addColorStop(0, 'rgba(230, 220, 200, 0.08)')
        grad.addColorStop(1, 'rgba(230, 220, 200, 0)')
        g.fillStyle = grad
        g.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2)
      }
    }
  }
}
