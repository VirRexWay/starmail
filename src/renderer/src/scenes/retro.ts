import { rand, type Scene, type SceneOpts } from './types'

/**
 * Retro Desktop screensavers. "bounce": two bouncing quadrilaterals leaving
 * colour-cycling echoes. "pipes": shaded pipes growing across a grid in random
 * turns until the screen fills, then a fresh start.
 */
export function retroScene(mode: 'bounce' | 'pipes', o: SceneOpts): Scene {
  let w = 0
  let h = 0

  // ---- bounce
  interface Pt { x: number; y: number; vx: number; vy: number }
  let shapes: { pts: Pt[]; hue: number; trail: { x: number; y: number }[][] }[] = []

  // ---- pipes
  const cell = 26
  let cols = 0
  let rows = 0
  let used: Uint8Array = new Uint8Array(0)
  interface Pipe { c: number; r: number; dir: number; hue: number; steps: number }
  let pipe: Pipe | null = null
  let segments = 0
  let acc = 0
  let fresh = true
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]

  const newPipe = (): Pipe => ({ c: Math.floor(rand(0, cols)), r: Math.floor(rand(0, rows)), dir: Math.floor(rand(0, 4)), hue: rand(0, 360), steps: 0 })

  function drawJoint(g: CanvasRenderingContext2D, x: number, y: number, hue: number): void {
    const grad = g.createRadialGradient(x - 3, y - 3, 1, x, y, 9)
    grad.addColorStop(0, `hsl(${hue}, 80%, 85%)`)
    grad.addColorStop(1, `hsl(${hue}, 70%, 25%)`)
    g.fillStyle = grad
    g.beginPath()
    g.arc(x, y, 8, 0, Math.PI * 2)
    g.fill()
  }

  function drawSegment(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, hue: number): void {
    const vertical = x1 === x2
    const grad = vertical ? g.createLinearGradient(x1 - 6, 0, x1 + 6, 0) : g.createLinearGradient(0, y1 - 6, 0, y1 + 6)
    grad.addColorStop(0, `hsl(${hue}, 70%, 22%)`)
    grad.addColorStop(0.35, `hsl(${hue}, 80%, 72%)`)
    grad.addColorStop(1, `hsl(${hue}, 70%, 18%)`)
    g.strokeStyle = grad
    g.lineWidth = 11
    g.lineCap = 'butt'
    g.beginPath()
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.stroke()
  }

  function stepPipe(g: CanvasRenderingContext2D): void {
    if (!pipe || pipe.steps > 40 + o.density * 60) pipe = newPipe()
    const p = pipe
    if (Math.random() < 0.25) {
      p.dir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4
    }
    const [dc, dr] = DIRS[p.dir]
    const nc = p.c + dc
    const nr = p.r + dr
    if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || used[nr * cols + nc]) {
      pipe = newPipe()
      return
    }
    const x1 = p.c * cell + cell / 2
    const y1 = p.r * cell + cell / 2
    drawSegment(g, x1, y1, nc * cell + cell / 2, nr * cell + cell / 2, p.hue)
    drawJoint(g, x1, y1, p.hue)
    used[nr * cols + nc] = 1
    p.c = nc
    p.r = nr
    p.steps++
    segments++
  }

  function resetPipes(g: CanvasRenderingContext2D): void {
    g.fillStyle = '#000'
    g.fillRect(0, 0, w, h)
    used = new Uint8Array(cols * rows)
    segments = 0
    pipe = null
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      shapes = [0, 1].map((i) => ({
        pts: Array.from({ length: 4 }, () => ({ x: rand(0, w), y: rand(0, h), vx: rand(1.5, 3.5) * (Math.random() < 0.5 ? -1 : 1), vy: rand(1.5, 3.5) * (Math.random() < 0.5 ? -1 : 1) })),
        hue: i * 160,
        trail: []
      }))
      cols = Math.ceil(w / cell)
      rows = Math.ceil(h / cell)
      fresh = true
    },
    draw(g, dt, boost) {
      if (mode === 'bounce') {
        g.fillStyle = '#000'
        g.fillRect(0, 0, w, h)
        const sp = (0.5 + o.speed * 1.5) * (1 + boost / 6) * dt
        const echoes = Math.round(4 + o.density * 10)
        for (const s of shapes) {
          for (const p of s.pts) {
            p.x += p.vx * sp
            p.y += p.vy * sp
            if (p.x < 0 || p.x > w) p.vx *= -1
            if (p.y < 0 || p.y > h) p.vy *= -1
          }
          s.hue = (s.hue + 0.4 * dt) % 360
          if (dt > 0) {
            s.trail.unshift(s.pts.map((p) => ({ x: p.x, y: p.y })))
            if (s.trail.length > echoes * 5) s.trail.length = echoes * 5
          }
          s.trail.forEach((pts, i) => {
            if (i % 5) return
            g.strokeStyle = `hsla(${s.hue + i}, 100%, 60%, ${1 - i / (echoes * 5)})`
            g.lineWidth = 1.5
            g.beginPath()
            pts.forEach((p, k) => (k ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)))
            g.closePath()
            g.stroke()
          })
        }
        return
      }
      if (fresh) {
        resetPipes(g)
        // Animations off: grow a finished screen in one go
        if (dt === 0) for (let i = 0; i < 400; i++) stepPipe(g)
        fresh = false
      }
      acc += (0.3 + o.speed * 0.7) * (1 + boost / 4) * dt
      while (acc >= 1) {
        acc -= 1
        stepPipe(g)
      }
      if (segments > cols * rows * 0.45) resetPipes(g)
    }
  }
}
