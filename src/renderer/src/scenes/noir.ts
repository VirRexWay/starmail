import { hexToRgb } from '../theme'
import { offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * Noir. "rainwindow": out-of-focus city lights behind a rain-streaked office
 * window, a neon sign stuttering outside, lightning on a surge. "blinds": a dark
 * office cut by light through venetian blinds, cigarette smoke curling up;
 * a surge sweeps headlights across the room.
 */
export function noirScene(mode: 'rainwindow' | 'blinds', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  let w = 0
  let h = 0
  let bg: HTMLCanvasElement | null = null
  let flash = 0
  let flicker = 0
  let sweep = 0

  interface Bead { x: number; y: number; r: number; v: number; sliding: boolean }
  interface Streak { x: number; y: number; len: number; v: number }
  interface Smoke { x: number; y: number; r: number; life: number; ph: number }
  let beads: Bead[] = []
  let streaks: Streak[] = []
  let smoke: Smoke[] = []
  let motes: { x: number; y: number; ph: number }[] = []

  function paintBg(): void {
    const [c, g] = offscreen(w, h)
    if (mode === 'rainwindow') {
      const grad = g.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#07080b')
      grad.addColorStop(1, '#14161b')
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
      // Bokeh: blurred city lights, mostly warm and grey, a few in the accent colour
      for (let i = 0; i < 70; i++) {
        const x = rand(0, w)
        const y = rand(h * 0.35, h)
        const r = rand(8, 48)
        const rgb = Math.random() < 0.15 ? pRgb : Math.random() < 0.6 ? '230, 200, 150' : '200, 205, 215'
        const b = g.createRadialGradient(x, y, 0, x, y, r)
        b.addColorStop(0, `rgba(${rgb}, ${rand(0.08, 0.22)})`)
        b.addColorStop(0.7, `rgba(${rgb}, ${rand(0.03, 0.1)})`)
        b.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = b
        g.fillRect(x - r, y - r, r * 2, r * 2)
      }
    } else {
      g.fillStyle = '#0a0a0c'
      g.fillRect(0, 0, w, h)
    }
    bg = c
  }

  /** Light through the blinds: slanted bright stripes inside a skewed window shape. */
  function drawBlinds(g: CanvasRenderingContext2D, t: number): void {
    const drift = Math.sin(t / 9000) * 30 + sweep
    g.save()
    g.beginPath()
    g.moveTo(w * 0.35 + drift, -20)
    g.lineTo(w * 1.1 + drift, -20)
    g.lineTo(w * 0.75 + drift, h + 20)
    g.lineTo(-w * 0.05 + drift, h + 20)
    g.closePath()
    g.clip()
    const slat = Math.max(18, h / 26)
    for (let y = -40; y < h + 40; y += slat) {
      const light = g.createLinearGradient(0, y, w, y)
      light.addColorStop(0, 'rgba(240, 232, 215, 0)')
      light.addColorStop(0.5, `rgba(240, 232, 215, ${0.1 + Math.min(0.25, sweep / 300)})`)
      light.addColorStop(1, 'rgba(240, 232, 215, 0)')
      g.fillStyle = light
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(w, y + h * 0.25)
      g.lineTo(w, y + h * 0.25 + slat * 0.55)
      g.lineTo(0, y + slat * 0.55)
      g.fill()
    }
    // Dust hanging in the light
    g.fillStyle = 'rgba(255, 248, 230, 0.35)'
    for (const m of motes) g.fillRect(m.x + Math.sin(t / 3000 + m.ph) * 12, m.y + Math.cos(t / 4000 + m.ph) * 8, 1.2, 1.2)
    g.restore()
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      paintBg()
      beads = Array.from({ length: Math.round(60 + o.density * 160) }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.8, 2.8), v: 0, sliding: false }))
      streaks = Array.from({ length: Math.round(60 + o.density * 140) }, () => ({ x: rand(0, w), y: rand(0, h), len: rand(10, 30), v: rand(6, 11) }))
      motes = Array.from({ length: Math.round(30 + o.density * 60) }, () => ({ x: rand(0, w), y: rand(0, h), ph: rand(0, 6) }))
      smoke = []
    },
    draw(g, dt, boost, t) {
      if (bg) g.drawImage(bg, 0, 0, w, h)

      if (mode === 'blinds') {
        sweep = sweep * Math.pow(0.97, dt) + (boost > 3 ? boost * 1.5 * dt : 0)
        drawBlinds(g, t)
        if (dt > 0 && Math.random() < 0.25 * dt) smoke.push({ x: w * 0.12, y: h * 0.86, r: rand(4, 8), life: 1, ph: rand(0, 6) })
        for (let i = smoke.length - 1; i >= 0; i--) {
          const s = smoke[i]
          s.y -= (0.5 + o.speed * 0.6) * dt
          s.x += Math.sin(t / 900 + s.ph + s.y * 0.02) * 0.6 * dt
          s.r += 0.12 * dt
          s.life -= 0.004 * dt
          if (s.life <= 0) {
            smoke.splice(i, 1)
            continue
          }
          const grad = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r)
          grad.addColorStop(0, `rgba(200, 200, 205, ${s.life * 0.09})`)
          grad.addColorStop(1, 'rgba(200, 200, 205, 0)')
          g.fillStyle = grad
          g.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2)
        }
        return
      }

      // Neon sign outside: a coloured glow that stutters now and then
      if (dt > 0 && Math.random() < 0.006 * dt) flicker = rand(6, 20)
      if (flicker > 0) flicker -= dt
      const on = flicker > 0 ? Math.random() < 0.45 : true
      const glow = g.createRadialGradient(w * 0.1, h * 0.28, 0, w * 0.1, h * 0.28, Math.max(w, h) * 0.45)
      glow.addColorStop(0, `rgba(${pRgb}, ${on ? 0.22 : 0.05})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = glow
      g.fillRect(0, 0, w, h)

      // Rain outside
      g.strokeStyle = 'rgba(180, 190, 205, 0.12)'
      g.lineWidth = 1
      g.beginPath()
      for (const s of streaks) {
        s.y += s.v * (0.6 + o.speed) * dt
        s.x += s.v * 0.12 * dt
        if (s.y > h) {
          s.y = rand(-40, 0)
          s.x = rand(-60, w)
        }
        g.moveTo(s.x, s.y)
        g.lineTo(s.x - s.len * 0.12, s.y - s.len)
      }
      g.stroke()

      // Beads on the glass; now and then one gives way and runs down
      for (const b of beads) {
        if (!b.sliding && dt > 0 && Math.random() < 0.0008 * dt) {
          b.sliding = true
          b.v = rand(1.5, 4)
        }
        if (b.sliding) {
          g.strokeStyle = 'rgba(210, 220, 235, 0.12)'
          g.lineWidth = b.r * 0.8
          g.beginPath()
          g.moveTo(b.x, b.y - 30)
          g.lineTo(b.x, b.y)
          g.stroke()
          b.y += b.v * dt
          b.x += Math.sin(b.y * 0.05) * 0.3
          if (b.y > h + 10) Object.assign(b, { x: rand(0, w), y: rand(0, h * 0.3), sliding: false, v: 0 })
        }
        g.fillStyle = 'rgba(220, 228, 240, 0.28)'
        g.beginPath()
        g.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = 'rgba(255, 255, 255, 0.4)'
        g.fillRect(b.x - b.r * 0.4, b.y - b.r * 0.5, 1, 1)
      }

      // Lightning: rare on its own, guaranteed on a surge
      if (boost > 4 && flash <= 0) flash = 1
      if (dt > 0 && Math.random() < 0.0008 * dt) flash = 0.7
      if (flash > 0) {
        g.fillStyle = `rgba(235, 240, 255, ${flash * 0.35})`
        g.fillRect(0, 0, w, h)
        flash -= 0.05 * dt
      }
    }
  }
}
