import { hexToRgb } from '../theme'
import { glowSprite, offscreen, rand, type Scene, type SceneOpts } from './types'

/**
 * Shadow Realm: a burning sky over jagged mountains and a smouldering volcano.
 * Embers rise, ash falls and smoke rolls past, lit red from below. A surge
 * flares the forge and throws a burst of embers into the sky.
 * "ashfall" is darker: heavy ash, thick smoke, distant lightning.
 */
export function embersScene(mode: 'embers' | 'ashfall', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const aRgb = hexToRgb(o.alert)
  const heavy = mode === 'ashfall'
  const sprite = glowSprite(pRgb, 48)
  const hot = glowSprite(aRgb, 48)
  let w = 0
  let h = 0
  let sky: HTMLCanvasElement | null = null
  let land: HTMLCanvasElement | null = null
  let flash = 0

  interface Ember { x: number; y: number; vx: number; vy: number; life: number; r: number; ph: number }
  interface Ash { x: number; y: number; r: number; ph: number; v: number }
  interface Smoke { x: number; y: number; r: number; v: number }
  let embers: Ember[] = []
  let ash: Ash[] = []
  let smoke: Smoke[] = []
  let crater = { x: 0, y: 0 }

  const newEmber = (burst = 0): Ember => ({
    x: burst ? crater.x + rand(-30, 30) : rand(0, w),
    y: burst ? crater.y : h + rand(0, 30),
    vx: rand(-0.3, 0.3) + (burst ? rand(-2, 2) : 0),
    vy: -rand(0.4, 1.3) - burst * rand(2, 6),
    life: 1,
    r: rand(0.6, 1.8),
    ph: rand(0, 6.28)
  })

  function paintSky(): void {
    const [c, g] = offscreen(w, h)
    const grad = g.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, '#030102')
    grad.addColorStop(0.5, heavy ? '#0a0405' : '#100405')
    grad.addColorStop(1, `rgba(${pRgb}, ${heavy ? 0.16 : 0.3})`)
    g.fillStyle = '#030102'
    g.fillRect(0, 0, w, h)
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
    sky = c
  }

  function ridge(g: CanvasRenderingContext2D, baseY: number, amp: number, step: number, color: string): void {
    g.fillStyle = color
    g.beginPath()
    g.moveTo(0, h)
    let x = 0
    g.lineTo(0, baseY - rand(0, amp))
    while (x < w) {
      x += rand(step * 0.4, step)
      g.lineTo(x, baseY - rand(0, amp) * (0.4 + Math.random() * 0.6))
    }
    g.lineTo(w, h)
    g.closePath()
    g.fill()
  }

  function paintLand(): void {
    const [c, g] = offscreen(w, h)
    // Far ridge
    ridge(g, h * 0.8, h * 0.16, 60, 'rgba(34, 10, 8, 0.95)')
    // The volcano: a broad cone left of centre, crater glowing
    const vx = w * 0.36
    const vy = h * 0.5
    crater = { x: vx, y: vy + 6 }
    g.fillStyle = '#120505'
    g.beginPath()
    g.moveTo(vx - w * 0.38, h)
    g.lineTo(vx - w * 0.05, vy + 4)
    g.lineTo(vx - w * 0.025, vy)
    g.lineTo(vx + w * 0.025, vy + 2)
    g.lineTo(vx + w * 0.055, vy + 6)
    g.lineTo(vx + w * 0.42, h)
    g.closePath()
    g.fill()
    // Lava runs down the flanks
    g.strokeStyle = `rgba(${pRgb}, 0.55)`
    g.shadowColor = `rgba(${pRgb}, 0.9)`
    g.shadowBlur = 12
    for (let i = 0; i < 5; i++) {
      g.lineWidth = rand(1, 2.5)
      g.beginPath()
      let x = vx + rand(-w * 0.02, w * 0.02)
      let y = vy + 6
      g.moveTo(x, y)
      for (let k = 0; k < 8; k++) {
        x += rand(-14, 14) + (i - 2) * 6
        y += rand(18, 40)
        g.lineTo(x, y)
      }
      g.stroke()
    }
    g.shadowBlur = 0
    // Near jagged range in front
    ridge(g, h * 0.93, h * 0.2, 45, '#050102')
    land = c
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      paintSky()
      paintLand()
      embers = Array.from({ length: Math.round((heavy ? 25 : 60) + o.density * (heavy ? 60 : 160)) }, () => ({ ...newEmber(), y: rand(0, h) }))
      ash = Array.from({ length: Math.round((heavy ? 120 : 30) + o.density * (heavy ? 260 : 80)) }, () => ({ x: rand(0, w), y: rand(0, h), r: rand(0.5, 1.8), ph: rand(0, 6.28), v: rand(0.15, 0.5) }))
      smoke = Array.from({ length: heavy ? 9 : 6 }, () => ({ x: rand(0, w), y: rand(h * 0.05, h * 0.55), r: rand(0.25, 0.5) * Math.max(w, h), v: rand(0.05, 0.2) }))
    },
    draw(g, dt, boost, t) {
      if (sky) g.drawImage(sky, 0, 0, w, h)

      // The forge glow breathes, and flares with a surge
      const breathe = 0.5 + 0.5 * Math.sin(t / 2200)
      const glowA = (heavy ? 0.12 : 0.22) + breathe * 0.08 + Math.min(0.35, boost / 60)
      const glow = g.createRadialGradient(crater.x, crater.y, 0, crater.x, crater.y, Math.max(w, h) * 0.55)
      glow.addColorStop(0, `rgba(${aRgb}, ${glowA})`)
      glow.addColorStop(0.25, `rgba(${pRgb}, ${glowA * 0.6})`)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = glow
      g.fillRect(0, 0, w, h)

      // Smoke rolling across, under-lit
      for (const s of smoke) {
        s.x += s.v * dt * (1 + boost * 0.1)
        if (s.x - s.r > w) s.x = -s.r
        const grad = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r)
        grad.addColorStop(0, `rgba(${heavy ? '22, 12, 12' : '40, 14, 10'}, ${heavy ? 0.55 : 0.4})`)
        grad.addColorStop(0.7, `rgba(${pRgb}, 0.04)`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = grad
        g.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2)
      }

      if (heavy && dt > 0) {
        if (Math.random() < 0.0025 * dt) flash = 1
        if (flash > 0) {
          g.fillStyle = `rgba(255, 220, 210, ${flash * 0.12})`
          g.fillRect(0, 0, w, h * 0.6)
          flash -= 0.08 * dt
        }
      }

      if (land) g.drawImage(land, 0, 0, w, h)

      // A surge throws a burst of embers out of the crater
      if (boost > 4 && dt > 0) for (let i = 0; i < Math.min(6, boost / 4); i++) embers.push(newEmber(1))

      g.globalCompositeOperation = 'lighter'
      const lift = (0.6 + o.speed * 1.2) * dt
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]
        e.x += e.vx * dt + Math.sin(t / 500 + e.ph) * 0.35 * dt
        e.y += e.vy * lift
        e.vy *= Math.pow(0.995, dt)
        e.life -= 0.0025 * dt
        if (e.y < -20 || e.life <= 0) {
          if (embers.length > 400) embers.splice(i, 1)
          else Object.assign(e, newEmber())
          continue
        }
        const flicker = 0.55 + 0.45 * Math.sin(t / 90 + e.ph * 7)
        const size = e.r * 10
        g.globalAlpha = Math.max(0, e.life * flicker)
        g.drawImage(e.life > 0.7 ? hot : sprite, e.x - size / 2, e.y - size / 2, size, size)
      }
      g.globalAlpha = 1
      g.globalCompositeOperation = 'source-over'

      for (const a of ash) {
        a.y += a.v * dt * (0.6 + o.speed)
        a.x += Math.sin(t / 1300 + a.ph) * 0.3 * dt
        if (a.y > h + 5) {
          a.y = -5
          a.x = rand(0, w)
        }
        g.fillStyle = `rgba(150, 140, 135, ${heavy ? 0.45 : 0.3})`
        g.fillRect(a.x, a.y, a.r, a.r)
      }
    }
  }
}
