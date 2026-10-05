import { hexToRgb } from '../theme'
import { glowSprite, rand, type Scene, type SceneOpts } from './types'

/**
 * Eldritch. "fog": tentacles sway up out of a drifting fog and, once in a long
 * while, a vast eye opens in the murk; a surge makes them thrash and the eye
 * wake. "void": a slow spiral of light dragged into a central dark, with pairs
 * of eyes blinking in the black.
 */
export function eldritchScene(mode: 'fog' | 'void', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const sRgb = hexToRgb(o.secondary)
  const sprite = glowSprite(pRgb, 32)
  const sprite2 = glowSprite(sRgb, 32)
  let w = 0
  let h = 0
  let eye = 0 // 0 closed .. 1 open
  let eyeTarget = 0
  let eyeHold = 0
  let thrash = 0

  interface Tentacle { x: number; len: number; width: number; ph: number; f: number }
  interface Fog { x: number; y: number; r: number; v: number; a: number }
  interface Mote { a: number; r: number; v: number; s: number; alt: boolean }
  interface Eyes { x: number; y: number; open: number; next: number; size: number }
  let tentacles: Tentacle[] = []
  let fog: Fog[] = []
  let motes: Mote[] = []
  let eyes: Eyes[] = []

  function drawTentacle(g: CanvasRenderingContext2D, T: Tentacle, t: number): void {
    const n = 26
    const amp = (18 + thrash * 40) * (0.6 + o.speed)
    const left: [number, number][] = []
    const right: [number, number][] = []
    const spine: [number, number][] = []
    for (let i = 0; i <= n; i++) {
      const k = i / n
      const y = h + 20 - k * T.len
      const x = T.x + Math.sin(t / (1600 / T.f) + k * 4 + T.ph) * amp * Math.pow(k, 1.3) + Math.sin(t / 700 + k * 9) * thrash * 12 * k
      const wdt = T.width * (1 - k * 0.92)
      spine.push([x, y])
      left.push([x - wdt, y])
      right.push([x + wdt, y])
    }
    g.fillStyle = 'rgba(8, 14, 12, 0.92)'
    g.beginPath()
    left.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    right.reverse().forEach(([x, y]) => g.lineTo(x, y))
    g.closePath()
    g.fill()
    g.strokeStyle = `rgba(${pRgb}, 0.18)`
    g.lineWidth = 1
    g.stroke()
    // Suckers along one side
    g.fillStyle = `rgba(${pRgb}, 0.12)`
    for (let i = 2; i < n - 3; i += 2) {
      const [x, y] = spine[i]
      const wdt = T.width * (1 - (i / n) * 0.92)
      g.beginPath()
      g.arc(x + wdt * 0.55, y, wdt * 0.28, 0, Math.PI * 2)
      g.fill()
    }
  }

  function drawEye(g: CanvasRenderingContext2D, x: number, y: number, size: number, open: number, t: number): void {
    if (open <= 0.02) return
    const ew = size
    const eh = size * 0.42 * open
    g.save()
    g.beginPath()
    g.moveTo(x - ew, y)
    g.quadraticCurveTo(x, y - eh * 2, x + ew, y)
    g.quadraticCurveTo(x, y + eh * 2, x - ew, y)
    g.closePath()
    const halo = g.createRadialGradient(x, y, 0, x, y, ew * 1.6)
    halo.addColorStop(0, `rgba(${pRgb}, ${0.25 * open})`)
    halo.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = halo
    g.fillRect(x - ew * 1.6, y - ew * 1.6, ew * 3.2, ew * 3.2)
    g.clip()
    const iris = g.createRadialGradient(x, y, 0, x, y, ew * 0.6)
    iris.addColorStop(0, `rgba(${pRgb}, 0.95)`)
    iris.addColorStop(0.7, `rgba(${sRgb}, 0.7)`)
    iris.addColorStop(1, 'rgba(10, 10, 10, 0.9)')
    g.fillStyle = 'rgba(30, 32, 26, 0.95)'
    g.fillRect(x - ew, y - ew, ew * 2, ew * 2)
    g.fillStyle = iris
    const look = Math.sin(t / 2400) * ew * 0.25
    g.beginPath()
    g.arc(x + look, y, ew * 0.55, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#020202'
    g.beginPath()
    g.ellipse(x + look, y, ew * 0.07, ew * 0.42, 0, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      const count = Math.round(3 + o.density * 4)
      tentacles = Array.from({ length: count }, (_, i) => ({
        x: ((i + 0.5) / count) * w + rand(-60, 60),
        len: h * rand(0.35, 0.8),
        width: rand(14, 30),
        ph: rand(0, 6),
        f: rand(0.7, 1.4)
      }))
      fog = Array.from({ length: 12 }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(120, 320), v: rand(0.05, 0.25) * (Math.random() < 0.5 ? -1 : 1), a: rand(0.05, 0.12) }))
      motes = Array.from({ length: Math.round(250 + o.density * 600) }, () => ({ a: rand(0, Math.PI * 2), r: rand(20, Math.max(w, h) * 0.75), v: rand(0.6, 1.4), s: rand(3, 9), alt: Math.random() < 0.3 }))
      eyes = Array.from({ length: Math.round(4 + o.density * 8) }, () => ({ x: rand(0, w), y: rand(0, h), open: 0, next: rand(0, 400), size: rand(5, 11) }))
    },
    draw(g, dt, boost, t) {
      thrash += ((boost > 2 ? 1 : 0) - thrash) * 0.05 * dt

      if (mode === 'fog') {
        const bg = g.createLinearGradient(0, 0, 0, h)
        bg.addColorStop(0, '#050807')
        bg.addColorStop(1, '#0d1612')
        g.fillStyle = bg
        g.fillRect(0, 0, w, h)
        // The eye: opens rarely on its own, always on a surge
        if (dt > 0 && eyeTarget === 0 && Math.random() < 0.0006 * dt) {
          eyeTarget = 1
          eyeHold = rand(180, 400)
        }
        if (boost > 4) {
          eyeTarget = 1
          eyeHold = Math.max(eyeHold, 200)
        }
        if (eyeTarget === 1) {
          eyeHold -= dt
          if (eyeHold <= 0) eyeTarget = 0
        }
        eye += (eyeTarget - eye) * 0.02 * dt
        drawEye(g, w * 0.5, h * 0.3, Math.min(w, h) * 0.22, eye, t)
        for (const f of fog.slice(0, 6)) {
          f.x += f.v * dt
          if (f.x - f.r > w) f.x = -f.r
          if (f.x + f.r < 0) f.x = w + f.r
          const grad = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r)
          grad.addColorStop(0, `rgba(160, 180, 170, ${f.a})`)
          grad.addColorStop(1, 'rgba(160, 180, 170, 0)')
          g.fillStyle = grad
          g.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2)
        }
        for (const T of tentacles) drawTentacle(g, T, t)
        for (const f of fog.slice(6)) {
          f.x += f.v * dt
          if (f.x - f.r > w) f.x = -f.r
          if (f.x + f.r < 0) f.x = w + f.r
          const grad = g.createRadialGradient(f.x, f.y + h * 0.3, 0, f.x, f.y + h * 0.3, f.r)
          grad.addColorStop(0, `rgba(160, 180, 170, ${f.a * 1.3})`)
          grad.addColorStop(1, 'rgba(160, 180, 170, 0)')
          g.fillStyle = grad
          g.fillRect(f.x - f.r, f.y + h * 0.3 - f.r, f.r * 2, f.r * 2)
        }
        return
      }

      // The void
      g.fillStyle = 'rgba(2, 2, 4, 0.5)'
      g.fillRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      g.globalCompositeOperation = 'lighter'
      for (const m of motes) {
        m.a += (m.v * 40) / (m.r + 60) * 0.02 * (0.5 + o.speed) * (1 + boost / 4) * dt
        m.r -= 0.12 * (1 + boost / 6) * dt
        if (m.r < 12) {
          m.r = Math.max(w, h) * rand(0.5, 0.75)
          m.a = rand(0, Math.PI * 2)
        }
        const x = cx + Math.cos(m.a) * m.r
        const y = cy + Math.sin(m.a) * m.r * 0.6
        g.globalAlpha = Math.min(0.6, m.r / 400)
        g.drawImage(m.alt ? sprite2 : sprite, x - m.s / 2, y - m.s / 2, m.s, m.s)
      }
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'
      const core = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.12)
      core.addColorStop(0, '#000')
      core.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = core
      g.fillRect(cx - w * 0.2, cy - h * 0.2, w * 0.4, h * 0.4)
      for (const e of eyes) {
        e.next -= dt
        if (e.next <= 0) {
          e.open = e.open > 0 ? 0 : 1
          e.next = e.open ? rand(60, 240) : rand(200, 900)
        }
        const o2 = boost > 3 ? 1 : e.open
        for (const dx of [-e.size * 1.6, e.size * 1.6]) drawEye(g, e.x + dx, e.y, e.size, o2, t)
      }
    }
  }
}
