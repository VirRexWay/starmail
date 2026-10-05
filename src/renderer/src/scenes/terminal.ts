import { hexToRgb } from '../theme'
import { rand, type Scene, type SceneOpts } from './types'

const ri = (a: number, b: number): number => Math.floor(rand(a, b + 1))
const hex = (n: number): string => Array.from({ length: n }, () => '0123456789ABCDEF'[ri(0, 15)]).join('')
const bar = (pct: number): string => '[' + '#'.repeat(Math.round(pct / 5)).padEnd(20, '.') + `] ${pct}%`

const NOUNS = ['signal', 'mainframe', 'datastream', 'relay', 'cipher', 'mailbag', 'archive', 'beacon', 'uplink', 'node']
const VERBS = ['decoding', 'tracing', 'syncing', 'rerouting', 'compiling', 'calibrating', 'indexing', 'unscrambling']
const pick = <T,>(a: T[]): T => a[ri(0, a.length - 1)]

/** Movie-style console flavour text. Purely decorative; it doesn't do or describe anything real. */
function nextLine(): { text: string; kind: 'dim' | 'ok' | 'warn' | 'cmd' } {
  const r = Math.random()
  if (r < 0.15) return { text: `> ${pick(VERBS)} ${pick(NOUNS)} ${ri(1, 99)}...`, kind: 'cmd' }
  if (r < 0.32) return { text: `  ${pick(VERBS)} ${pick(NOUNS)} ${bar(ri(3, 100))}`, kind: 'dim' }
  if (r < 0.52) return { text: `  0x${hex(8)}  ${hex(4)} ${hex(4)} ${hex(4)} ${hex(4)}  ${hex(4)} ${hex(4)}`, kind: 'dim' }
  if (r < 0.66) return { text: `  [OK] ${pick(NOUNS)} ${ri(1, 64)} online`, kind: 'ok' }
  if (r < 0.78) return { text: `  ${pick(NOUNS)}.${pick(NOUNS)}.${ri(10, 99)} :: ${ri(12, 980)}ms`, kind: 'dim' }
  if (r < 0.86) return { text: `  [!] ${pick(NOUNS)} ${ri(1, 9)} unstable, compensating`, kind: 'warn' }
  return { text: `  checksum ${hex(16)} verified`, kind: 'ok' }
}

/**
 * Zero Day. "terminal": a full-window console feed typed out character by
 * character, with "ACCESS GRANTED" stamps on a surge. "nettrace": a network of
 * nodes with packets racing along the links; nodes light up as packets arrive.
 */
export function terminalScene(mode: 'terminal' | 'nettrace', o: SceneOpts): Scene {
  const pRgb = hexToRgb(o.primary)
  const aRgb = hexToRgb(o.alert)
  let w = 0
  let h = 0

  // ---- terminal state
  const lineH = 17
  let lines: { text: string; kind: string; shown: number }[] = []
  let typing = 0
  let stamp = 0

  // ---- network state
  interface Node { x: number; y: number; pulse: number; hot: number }
  interface Packet { a: number; b: number; t: number; v: number }
  let nodes: Node[] = []
  let links: [number, number][] = []
  let packets: Packet[] = []

  function buildNet(): void {
    const count = Math.round(26 + o.density * 50)
    nodes = Array.from({ length: count }, () => ({ x: rand(20, w - 20), y: rand(20, h - 20), pulse: rand(0, 6.28), hot: 0 }))
    links = []
    nodes.forEach((n, i) => {
      const near = nodes
        .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
        .filter((x) => x.j !== i)
        .sort((p, q) => p.d - q.d)
        .slice(0, 3)
      for (const { j } of near) if (!links.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) links.push([i, j])
    })
    packets = []
  }

  const spawnPacket = (): void => {
    const [a, b] = links[ri(0, links.length - 1)]
    packets.push(Math.random() < 0.5 ? { a, b, t: 0, v: rand(0.006, 0.02) } : { a: b, b: a, t: 0, v: rand(0.006, 0.02) })
  }

  function drawTerminal(g: CanvasRenderingContext2D, dt: number, boost: number): void {
    g.fillStyle = '#020502'
    g.fillRect(0, 0, w, h)
    const cps = (0.8 + o.speed * 2.5) * (1 + boost / 3) * dt
    typing += cps
    const maxLines = Math.ceil(h / lineH) + 1
    while (typing >= 1) {
      typing -= 1
      const last = lines[lines.length - 1]
      if (!last || last.shown >= last.text.length) {
        lines.push({ ...nextLine(), shown: 0 })
        if (lines.length > maxLines) lines.shift()
      } else last.shown += ri(1, 3)
    }
    g.font = `14px 'VT323', 'Share Tech Mono', monospace`
    g.textBaseline = 'top'
    const top = h - lines.length * lineH - 6
    lines.forEach((l, i) => {
      const color = l.kind === 'cmd' ? `rgba(${pRgb}, 0.75)` : l.kind === 'ok' ? `rgba(${pRgb}, 0.55)` : l.kind === 'warn' ? `rgba(${aRgb}, 0.6)` : `rgba(${pRgb}, 0.28)`
      g.fillStyle = color
      const text = l.text.slice(0, l.shown)
      g.fillText(text, 14, top + i * lineH)
      if (i === lines.length - 1 && Math.floor(performance.now() / 500) % 2 === 0) {
        g.fillRect(14 + g.measureText(text).width + 2, top + i * lineH + 2, 8, 13)
      }
    })

    // A second, dimmer hex column down the right edge
    g.fillStyle = `rgba(${pRgb}, 0.12)`
    for (let y = 8; y < h; y += lineH) g.fillText(hex(8), w - 90, y)

    if (boost > 6) stamp = 1
    if (stamp > 0) {
      g.save()
      g.globalAlpha = Math.min(1, stamp * 1.4)
      g.font = `bold ${Math.round(Math.min(w, h) * 0.09)}px 'VT323', monospace`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillStyle = `rgba(${pRgb}, 0.9)`
      g.shadowColor = `rgba(${pRgb}, 1)`
      g.shadowBlur = 30
      g.fillText('ACCESS GRANTED', w / 2, h / 2)
      g.restore()
      stamp -= 0.012 * dt
    }
  }

  function drawNet(g: CanvasRenderingContext2D, dt: number, boost: number, t: number): void {
    g.fillStyle = '#020403'
    g.fillRect(0, 0, w, h)
    g.lineWidth = 1
    for (const [a, b] of links) {
      g.strokeStyle = `rgba(${pRgb}, 0.12)`
      g.beginPath()
      g.moveTo(nodes[a].x, nodes[a].y)
      g.lineTo(nodes[b].x, nodes[b].y)
      g.stroke()
    }
    if (dt > 0 && Math.random() < (0.15 + o.density * 0.3 + boost * 0.1) * dt) spawnPacket()
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i]
      p.t += p.v * (1 + o.speed * 2) * (1 + boost / 6) * dt
      if (p.t >= 1) {
        nodes[p.b].hot = 1
        packets.splice(i, 1)
        continue
      }
      const A = nodes[p.a]
      const B = nodes[p.b]
      const x = A.x + (B.x - A.x) * p.t
      const y = A.y + (B.y - A.y) * p.t
      g.fillStyle = `rgba(${pRgb}, 0.95)`
      g.fillRect(x - 1.5, y - 1.5, 3, 3)
    }
    for (const n of nodes) {
      n.hot = Math.max(0, n.hot - 0.02 * dt)
      const glow = 0.25 + 0.15 * Math.sin(t / 900 + n.pulse) + n.hot * 0.6
      g.strokeStyle = n.hot > 0.5 ? `rgba(${aRgb}, ${glow})` : `rgba(${pRgb}, ${glow})`
      g.beginPath()
      g.arc(n.x, n.y, 3 + n.hot * 4, 0, Math.PI * 2)
      g.stroke()
    }
  }

  return {
    resize(nw, nh) {
      w = nw
      h = nh
      lines = Array.from({ length: Math.ceil(h / lineH) }, () => {
        const l = nextLine()
        return { ...l, shown: l.text.length }
      })
      buildNet()
    },
    draw(g, dt, boost, t) {
      if (mode === 'terminal') drawTerminal(g, dt, boost)
      else drawNet(g, dt, boost, t)
    }
  }
}
