import { hexToRgb } from '../theme'
import { offscreen, rand, type Scene, type SceneOpts } from './types'

/** Pre-rendered gear sprite: toothed rim, spokes and a hub. */
function gearSprite(r: number, teeth: number, rgb: string): HTMLCanvasElement {
  const size = Math.ceil(r * 2 + 4)
  const [c, g] = offscreen(size, size)
  const cx = size / 2
  g.translate(cx, cx)
  g.beginPath()
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2
    const a1 = ((i + 0.5) / teeth) * Math.PI * 2
    const tw = (0.18 / teeth) * Math.PI * 2
    g.lineTo(Math.cos(a0) * r * 0.86, Math.sin(a0) * r * 0.86)
    g.lineTo(Math.cos(a0 + tw) * r, Math.sin(a0 + tw) * r)
    g.lineTo(Math.cos(a1 - tw) * r, Math.sin(a1 - tw) * r)
    g.lineTo(Math.cos(a1) * r * 0.86, Math.sin(a1) * r * 0.86)
  }
  g.closePath()
  const grad = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r)
  grad.addColorStop(0, `rgba(${rgb}, 0.95)`)
  grad.addColorStop(1, `rgba(${rgb}, 0.45)`)
  g.fillStyle = grad
  g.fill()
  // Cut-outs between spokes
  g.globalCompositeOperation = 'destination-out'
  const spokes = r > 60 ? 6 : 4
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2 + Math.PI / spokes
    g.beginPath()
    g.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.2, r * 0.13, a, 0, Math.PI * 2)
    g.fill()
  }
  g.beginPath()
  g.arc(0, 0, r * 0.1, 0, Math.PI * 2)
  g.fill()
  g.globalCompositeOperation = 'source-over'
  g.strokeStyle = 'rgba(30, 18, 8, 0.5)'
  g.lineWidth = 1.5
  g.beginPath()
  g.arc(0, 0, r * 0.68, 0, Math.PI * 2)
  g.stroke()
  return c
}

/**
 * Steampunk Telegraph. "clockwork": meshing brass gears, steam venting from
 * pipes and a pneumatic tube that fires a capsule on a surge. "skyport":
 * airships drifting through amber clouds.
 */
export function steampunkScene(mode: 'clockwork' | 'skyport', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const sRgb = hexToRgb(o.secondary)
  let w = 0
  let h = 0
  let bg: HTMLCanvasElement | null = null

  interface Gear { x: number; y: number; r: number; sprite: HTMLCanvasElement; angle: number; speed: number }
  interface Puff { x: number; y: number; r: number; life: number; vx: number; vy: number }
  interface Ship { x: number; y: number; scale: number; v: number; ph: number }
  interface Cloud { x: number; y: number; r: number; v: number; a: number }
  let gears: Gear[] = []
  let puffs: Puff[] = []
  let vents: { x: number; y: number }[] = []
  let ships: Ship[] = []
  let clouds: Cloud[] = []
  let capsule = -1
  let prop = 0

  /** A driving gear plus meshing neighbours; each turns opposite at a speed set by its radius. */
  function cluster(x: number, y: number, r: number, base: number): void {
    const teeth = Math.round(r / 6)
    gears.push({ x, y, r, sprite: gearSprite(r, teeth, pRgb), angle: rand(0, 6), speed: base })
    let px = x
    let py = y
    let pr = r
    let sp = base
    for (let i = 0; i < 2; i++) {
      const nr = pr * rand(0.45, 0.75)
      const a = rand(0, Math.PI * 2)
      const nx = px + Math.cos(a) * (pr + nr) * 0.93
      const ny = py + Math.sin(a) * (pr + nr) * 0.93
      sp = (-sp * pr) / nr
      gears.push({ x: nx, y: ny, r: nr, sprite: gearSprite(nr, Math.max(8, Math.round(nr / 6)), i ? sRgb : pRgb), angle: rand(0, 6), speed: sp })
      px = nx
      py = ny
      pr = nr
    }
  }

  function paintBg(): void {
    const [c, g] = offscreen(w, h)
    const grad = g.createLinearGradient(0, 0, 0, h)
    if (mode === 'skyport') {
      grad.addColorStop(0, '#1a1208')
      grad.addColorStop(0.55, '#4a3018')
      grad.addColorStop(1, `rgba(${pRgb}, 0.55)`)
    } else {
      grad.addColorStop(0, '#120c06')
      grad.addColorStop(1, '#24170b')
    }
    g.fillStyle = '#120c06'
    g.fillRect(0, 0, w, h)
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    if (mode === 'clockwork') {
      // Riveted pipes along the bottom
      g.strokeStyle = `rgba(${sRgb}, 0.35)`
      g.lineWidth = 14
      g.beginPath()
      g.moveTo(0, h - 40)
      g.lineTo(w * 0.3, h - 40)
      g.lineTo(w * 0.3, h - 120)
      g.moveTo(w * 0.55, h)
      g.lineTo(w * 0.55, h - 90)
      g.lineTo(w * 0.8, h - 90)
      g.stroke()
      vents = [{ x: w * 0.3, y: h - 128 }, { x: w * 0.8 + 6, y: h - 92 }]
      // Glass tube on the right edge
      const tx = w - 34
      g.fillStyle = 'rgba(200, 220, 210, 0.06)'
      g.fillRect(tx - 9, 0, 18, h)
      g.strokeStyle = `rgba(${pRgb}, 0.35)`
      g.lineWidth = 1.5
      g.strokeRect(tx - 9, -2, 18, h + 4)
      for (let y = 40; y < h; y += 120) {
        g.fillStyle = `rgba(${pRgb}, 0.5)`
        g.fillRect(tx - 12, y, 24, 6)
      }
    } else {
      const sun = g.createRadialGradient(w * 0.7, h * 0.62, 0, w * 0.7, h * 0.62, Math.max(w, h) * 0.5)
      sun.addColorStop(0, `rgba(${pRgb}, 0.35)`)
      sun.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = sun
      g.fillRect(0, 0, w, h)
    }
    bg = c
  }

  function drawShip(g: CanvasRenderingContext2D, s: Ship, t: number): void {
    const bob = Math.sin(t / 1400 + s.ph) * 4
    g.save()
    g.translate(s.x, s.y + bob)
    g.scale(s.scale, s.scale)
    g.fillStyle = 'rgba(20, 12, 6, 0.85)'
    g.strokeStyle = `rgba(${pRgb}, 0.35)`
    g.lineWidth = 1.2
    // Envelope with ribs
    g.beginPath()
    g.ellipse(0, 0, 90, 26, 0, 0, Math.PI * 2)
    g.fill()
    g.stroke()
    for (let i = -2; i <= 2; i++) {
      g.beginPath()
      g.ellipse(i * 28, 0, 6, 25, 0, 0, Math.PI * 2)
      g.stroke()
    }
    // Fins
    g.beginPath()
    g.moveTo(-82, -6)
    g.lineTo(-110, -26)
    g.lineTo(-96, 0)
    g.lineTo(-110, 26)
    g.lineTo(-82, 6)
    g.fill()
    // Gondola and rigging
    g.fillRect(-26, 32, 52, 12)
    g.beginPath()
    g.moveTo(-26, 32)
    g.lineTo(-40, 20)
    g.moveTo(26, 32)
    g.lineTo(40, 20)
    g.stroke()
    g.fillStyle = `rgba(${pRgb}, 0.6)`
    for (let i = -18; i <= 18; i += 9) g.fillRect(i, 35, 4, 4)
    // Propeller
    g.strokeStyle = 'rgba(30, 20, 10, 0.8)'
    g.lineWidth = 2
    g.beginPath()
    const pl = 12 * Math.cos(prop)
    g.moveTo(-30, 38 - pl)
    g.lineTo(-30, 38 + pl)
    g.stroke()
    g.restore()
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      gears = []
      const s = Math.min(w, h)
      cluster(w * 0.08, h * 0.88, s * 0.22, 0.004)
      cluster(w * 0.92, h * 0.12, s * 0.16, -0.006)
      if (o.density > 0.3) cluster(w * 0.62, h * 1.02, s * 0.14, 0.007)
      if (o.density > 0.6) cluster(w * 0.3, h * 0.02, s * 0.1, -0.009)
      puffs = []
      ships = Array.from({ length: Math.round(2 + o.density * 3) }, (_, i) => ({ x: rand(-200, w), y: h * rand(0.12, 0.6), scale: rand(0.35, 1) * (i === 0 ? 1.2 : 1), v: rand(0.15, 0.4), ph: rand(0, 6) }))
      ships.sort((a, b) => a.scale - b.scale)
      clouds = Array.from({ length: 14 }, () => ({ x: rand(-200, w), y: rand(h * 0.1, h * 0.9), r: rand(60, 180), v: rand(0.1, 0.35), a: rand(0.08, 0.2) }))
      paintBg()
    },
    draw(g, dt, boost, t) {
      if (bg) g.drawImage(bg, 0, 0, w, h)
      const turbo = 1 + boost / 3

      if (mode === 'clockwork') {
        for (const gr of gears) {
          gr.angle += gr.speed * (0.4 + o.speed * 1.2) * turbo * dt * 4
          g.save()
          g.translate(gr.x, gr.y)
          g.rotate(gr.angle)
          g.globalAlpha = 0.55
          g.drawImage(gr.sprite, -gr.sprite.width / 2, -gr.sprite.height / 2)
          g.restore()
        }
        // Steam
        if (dt > 0) {
          for (const v of vents) if (Math.random() < (0.12 + boost * 0.05) * dt) puffs.push({ x: v.x, y: v.y, r: rand(4, 10), life: 1, vx: rand(-0.3, 0.3), vy: -rand(0.6, 1.4) * turbo })
        }
        for (let i = puffs.length - 1; i >= 0; i--) {
          const p = puffs[i]
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.r += 0.35 * dt
          p.life -= 0.008 * dt
          if (p.life <= 0) {
            puffs.splice(i, 1)
            continue
          }
          const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
          grad.addColorStop(0, `rgba(230, 220, 205, ${p.life * 0.18})`)
          grad.addColorStop(1, 'rgba(230, 220, 205, 0)')
          g.fillStyle = grad
          g.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)
        }
        // Pneumatic capsule shoots up the tube on a surge
        if (boost > 5 && capsule < 0) capsule = h + 30
        if (capsule >= 0) {
          capsule -= 26 * dt
          const tx = w - 34
          g.fillStyle = `rgba(${pRgb}, 0.95)`
          g.fillRect(tx - 6, capsule, 12, 28)
          g.fillStyle = 'rgba(255, 245, 220, 0.5)'
          g.fillRect(tx - 6, capsule + 4, 12, 3)
          if (capsule < -40) capsule = -1
        }
        return
      }

      // Skyport
      prop += 0.6 * dt * turbo
      for (const c of clouds) {
        c.x += c.v * (0.5 + o.speed) * turbo * dt
        if (c.x - c.r > w) c.x = -c.r * 2
        const grad = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r)
        grad.addColorStop(0, `rgba(240, 210, 160, ${c.a})`)
        grad.addColorStop(1, 'rgba(240, 210, 160, 0)')
        g.fillStyle = grad
        g.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)
      }
      for (const s of ships) {
        s.x += s.v * (0.5 + o.speed) * turbo * s.scale * dt
        if (s.x - 130 * s.scale > w) s.x = -140 * s.scale
        drawShip(g, s, t)
      }
      if (boost > 2) {
        g.strokeStyle = 'rgba(255, 240, 210, 0.15)'
        g.lineWidth = 1
        for (let i = 0; i < 12; i++) {
          const y = rand(0, h)
          const x = rand(0, w)
          g.beginPath()
          g.moveTo(x, y)
          g.lineTo(x + boost * 6, y)
          g.stroke()
        }
      }
    }
  }
}
