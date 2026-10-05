import { offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * Zen Garden. "koi": a still pond with koi swimming slow curves under lily pads,
 * ripples spreading where something touches the water; a surge drops a pebble in
 * the middle. "sand": raked sand flowing around stones, cherry petals drifting down.
 */
export function zenScene(mode: 'koi' | 'sand', o: SceneOpts): Scene {
  let w = 0
  let h = 0
  let bg: HTMLCanvasElement | null = null
  let pads: HTMLCanvasElement | null = null
  let lastBoost = 0

  interface Koi { x: number; y: number; a: number; target: number; v: number; len: number; base: string; spot: string; ph: number }
  interface Ripple { x: number; y: number; r: number; life: number; max: number }
  interface Petal { x: number; y: number; rot: number; vr: number; vx: number; vy: number; life: number }
  let koi: Koi[] = []
  let ripples: Ripple[] = []
  let petals: Petal[] = []

  const PATTERNS = [
    ['#f4efe6', '#d9482b'],
    ['#e8722a', '#f4efe6'],
    ['#f2c14e', '#e8722a'],
    ['#f4efe6', '#1c1c1c'],
    ['#d9482b', '#1c1c1c']
  ]

  function paintPond(): void {
    const [c, g] = offscreen(w, h)
    const water = g.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, Math.max(w, h) * 0.75)
    water.addColorStop(0, '#1d4a4a')
    water.addColorStop(1, '#0a2226')
    g.fillStyle = water
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '10, 30, 30' : '60, 90, 80'}, ${rand(0.08, 0.2)})`
      g.beginPath()
      g.ellipse(rand(0, w), rand(0, h), rand(4, 16), rand(3, 10), rand(0, 3), 0, Math.PI * 2)
      g.fill()
    }
    bg = c
    // Lily pads on their own layer, drawn above the fish
    const [pc, pg] = offscreen(w, h)
    const spots = [[0.06, 0.2], [0.12, 0.8], [0.88, 0.15], [0.94, 0.62], [0.55, 0.92], [0.3, 0.08], [0.75, 0.88]]
    for (const [fx, fy] of spots) {
      const x = fx * w
      const y = fy * h
      const r = rand(26, 52)
      const notch = rand(0, Math.PI * 2)
      pg.fillStyle = 'rgba(0, 0, 0, 0.25)'
      pg.beginPath()
      pg.arc(x + 4, y + 5, r, notch + 0.35, notch + Math.PI * 2 - 0.35)
      pg.lineTo(x + 4, y + 5)
      pg.fill()
      const leaf = pg.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r)
      leaf.addColorStop(0, '#6a9a4a')
      leaf.addColorStop(1, '#2f5a2a')
      pg.fillStyle = leaf
      pg.beginPath()
      pg.arc(x, y, r, notch + 0.35, notch + Math.PI * 2 - 0.35)
      pg.lineTo(x, y)
      pg.fill()
      pg.strokeStyle = 'rgba(20, 50, 20, 0.5)'
      pg.lineWidth = 1
      for (let k = 0; k < 7; k++) {
        const a = notch + 0.6 + (k / 6) * (Math.PI * 2 - 1.2)
        pg.beginPath()
        pg.moveTo(x, y)
        pg.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9)
        pg.stroke()
      }
      if (Math.random() < 0.4) {
        pg.fillStyle = 'rgba(245, 200, 215, 0.9)'
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2
          pg.beginPath()
          pg.ellipse(x + Math.cos(a) * 6 + r * 0.3, y + Math.sin(a) * 6 - r * 0.2, 7, 3, a, 0, Math.PI * 2)
          pg.fill()
        }
      }
    }
    pads = pc
  }

  function paintSand(): void {
    const [c, g] = offscreen(w, h)
    g.fillStyle = '#d8cfba'
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = `rgba(${Math.random() < 0.5 ? '120, 105, 80' : '255, 250, 240'}, ${rand(0.05, 0.18)})`
      g.fillRect(rand(0, w), rand(0, h), 1, 1)
    }
    const stones = [
      { x: w * 0.2, y: h * 0.7, r: Math.min(w, h) * 0.07 },
      { x: w * 0.72, y: h * 0.32, r: Math.min(w, h) * 0.1 },
      { x: w * 0.82, y: h * 0.8, r: Math.min(w, h) * 0.05 }
    ]
    const groove = (draw: () => void): void => {
      g.strokeStyle = 'rgba(120, 100, 70, 0.35)'
      g.lineWidth = 2
      draw()
      g.save()
      g.translate(0, -2)
      g.strokeStyle = 'rgba(255, 250, 238, 0.45)'
      g.lineWidth = 1.2
      draw()
      g.restore()
    }
    for (let y = 6; y < h; y += 9) groove(() => { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() })
    for (const s of stones) {
      g.fillStyle = '#d8cfba'
      g.beginPath()
      g.arc(s.x, s.y, s.r * 2.6, 0, Math.PI * 2)
      g.fill()
      for (let r = s.r * 1.25; r < s.r * 2.6; r += 9) groove(() => { g.beginPath(); g.arc(s.x, s.y, r, 0, Math.PI * 2); g.stroke() })
      g.fillStyle = 'rgba(60, 50, 35, 0.25)'
      g.beginPath()
      g.ellipse(s.x + s.r * 0.25, s.y + s.r * 0.3, s.r * 1.05, s.r * 0.8, 0, 0, Math.PI * 2)
      g.fill()
      const rock = g.createRadialGradient(s.x - s.r * 0.4, s.y - s.r * 0.4, s.r * 0.1, s.x, s.y, s.r)
      rock.addColorStop(0, '#8a8478')
      rock.addColorStop(1, '#3e3a34')
      g.fillStyle = rock
      g.beginPath()
      g.ellipse(s.x, s.y, s.r, s.r * 0.78, rand(-0.3, 0.3), 0, Math.PI * 2)
      g.fill()
      g.fillStyle = 'rgba(90, 120, 60, 0.55)'
      g.beginPath()
      g.ellipse(s.x - s.r * 0.2, s.y - s.r * 0.35, s.r * 0.45, s.r * 0.22, -0.2, 0, Math.PI * 2)
      g.fill()
    }
    bg = c
  }

  function drawKoi(g: CanvasRenderingContext2D, k: Koi, t: number): void {
    const wag = Math.sin(t / 260 + k.ph) * 0.35
    g.save()
    g.translate(k.x, k.y)
    g.rotate(k.a)
    const L = k.len
    // Shadow on the pond floor
    g.fillStyle = 'rgba(0, 10, 10, 0.25)'
    g.beginPath()
    g.ellipse(6, 8, L * 0.5, L * 0.14, 0, 0, Math.PI * 2)
    g.fill()
    // Tail
    g.save()
    g.translate(-L * 0.45, 0)
    g.rotate(wag)
    g.fillStyle = k.base
    g.globalAlpha = 0.85
    g.beginPath()
    g.moveTo(0, 0)
    g.quadraticCurveTo(-L * 0.25, -L * 0.2, -L * 0.32, -L * 0.14)
    g.quadraticCurveTo(-L * 0.2, 0, -L * 0.32, L * 0.14)
    g.quadraticCurveTo(-L * 0.25, L * 0.2, 0, 0)
    g.fill()
    g.restore()
    g.globalAlpha = 1
    // Fins
    g.fillStyle = k.base
    g.globalAlpha = 0.7
    for (const s of [-1, 1]) {
      g.beginPath()
      g.ellipse(L * 0.12, s * L * 0.14, L * 0.1, L * 0.05, s * (0.6 + wag * 0.5), 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1
    // Body with spots
    g.beginPath()
    g.ellipse(0, 0, L * 0.5, L * 0.15, 0, 0, Math.PI * 2)
    g.fillStyle = k.base
    g.fill()
    g.save()
    g.clip()
    g.fillStyle = k.spot
    g.beginPath()
    g.ellipse(L * 0.18, -L * 0.04, L * 0.14, L * 0.1, 0.4, 0, Math.PI * 2)
    g.ellipse(-L * 0.15, L * 0.05, L * 0.1, L * 0.08, -0.3, 0, Math.PI * 2)
    g.fill()
    g.restore()
    g.restore()
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      if (mode === 'koi') paintPond()
      else paintSand()
      koi = Array.from({ length: Math.round(4 + o.density * 7) }, () => {
        const [base, spot] = PATTERNS[Math.floor(rand(0, PATTERNS.length))]
        const a = rand(0, Math.PI * 2)
        return { x: rand(w * 0.1, w * 0.9), y: rand(h * 0.1, h * 0.9), a, target: a, v: rand(0.4, 0.9), len: rand(48, 86), base, spot, ph: rand(0, 6) }
      })
      ripples = []
      petals = Array.from({ length: Math.round(8 + o.density * 22) }, () => ({ x: rand(0, w), y: rand(-h, h), rot: rand(0, 6), vr: rand(-0.03, 0.03), vx: rand(0.2, 0.6), vy: rand(0.3, 0.7), life: 1 }))
    },
    draw(g, dt, boost, t) {
      if (bg) g.drawImage(bg, 0, 0, w, h)
      const surge = boost > 4 && lastBoost <= 4
      lastBoost = boost

      if (mode === 'koi') {
        if (surge) ripples.push({ x: w / 2, y: h / 2, r: 4, life: 1, max: Math.max(w, h) * 0.5 })
        if (dt > 0 && Math.random() < 0.01 * dt) ripples.push({ x: rand(0, w), y: rand(0, h), r: 2, life: 1, max: rand(40, 110) })
        for (const k of koi) {
          if (dt > 0 && Math.random() < 0.01 * dt) k.target = k.a + rand(-1.2, 1.2)
          // Keep away from the edges
          const cx = w / 2 - k.x
          const cy = h / 2 - k.y
          if (k.x < w * 0.05 || k.x > w * 0.95 || k.y < h * 0.05 || k.y > h * 0.95) k.target = Math.atan2(cy, cx)
          if (boost > 2) k.target = Math.atan2(-cy, -cx)
          let d = k.target - k.a
          while (d > Math.PI) d -= Math.PI * 2
          while (d < -Math.PI) d += Math.PI * 2
          k.a += d * 0.02 * dt
          const sp = k.v * (0.4 + o.speed) * (1 + boost / 6) * dt
          k.x += Math.cos(k.a) * sp
          k.y += Math.sin(k.a) * sp
          drawKoi(g, k, t)
        }
        if (pads) g.drawImage(pads, 0, 0, w, h)
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i]
          r.r += (r.max / 120) * dt
          r.life = 1 - r.r / r.max
          if (r.life <= 0) {
            ripples.splice(i, 1)
            continue
          }
          g.strokeStyle = `rgba(220, 245, 240, ${r.life * 0.35})`
          g.lineWidth = 1.5
          for (const k of [1, 0.7, 0.45]) {
            g.beginPath()
            g.arc(r.x, r.y, r.r * k, 0, Math.PI * 2)
            g.stroke()
          }
        }
        return
      }

      // Sand: petals drifting down, a gust on a surge
      for (const p of petals) {
        p.x += (p.vx + boost * 0.15) * (0.5 + o.speed) * dt + Math.sin(t / 900 + p.rot) * 0.3 * dt
        p.y += p.vy * (0.5 + o.speed) * dt
        p.rot += (p.vr + boost * 0.003) * dt
        if (p.y > h + 10 || p.x > w + 20) Object.assign(p, { x: rand(-40, w * 0.8), y: rand(-60, -10) })
        g.save()
        g.translate(p.x, p.y)
        g.rotate(p.rot)
        g.fillStyle = 'rgba(240, 180, 195, 0.85)'
        g.beginPath()
        g.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
    }
  }
}
