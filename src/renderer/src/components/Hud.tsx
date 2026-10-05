import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useCopy, useStore, useUniverse } from '../store'

const GLYPHS = '!<>-_\\/[]{}=+*^?#ΔΣΩΞΨ01'

/** Text that "decodes" from scrambled glyphs into its final value. */
export function Decode({ text, ms = 450 }: { text: string; ms?: number }) {
  const anim = useStore((s) => s.settings.animation)
  const [out, setOut] = useState(text)
  const frame = useRef(0)

  useEffect(() => {
    if (anim === 'off' || text.length > 160) {
      setOut(text)
      return
    }
    const duration = anim === 'subtle' ? ms * 0.5 : ms
    const start = performance.now()
    const tick = (now: number): void => {
      const p = Math.min(1, (now - start) / duration)
      const reveal = Math.floor(p * text.length)
      let s = text.slice(0, reveal)
      for (let i = reveal; i < text.length; i++) {
        s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setOut(s)
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [text, ms, anim])

  return <>{out}</>
}

/** Panel with sci-fi corner brackets and an optional label tab. */
export function HudPanel({ label, accent, children, className = '', right }: { label?: string; accent?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`hud-panel ${className}`}>
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      {label && (
        <header className="hud-panel__label">
          <span className="hud-panel__tick" />
          <span>{label}</span>
          {accent && <span className="hud-panel__accent">{accent}</span>}
          <span className="hud-panel__rule" />
          {right}
        </header>
      )}
      {children}
    </section>
  )
}

/** Live stardate-style clock. */
/** Live clock in the current universe's reckoning (stardate, ship time, moons, hours of shadow). */
export function Stardate() {
  const universe = useUniverse()
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  const c = universe.clock(now)
  return (
    <div className="stardate">
      <span className="stardate__label">{c.label}</span>
      <span className="stardate__value">{c.value}</span>
      <span className="stardate__time">{c.sub}</span>
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  const copy = useCopy()
  label ??= copy.scanning
  return (
    <div className="spinner">
      <div className="spinner__radar">
        <div className="spinner__sweep" />
      </div>
      <span>{label}</span>
    </div>
  )
}

export function Icon({ name, size = 16 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

const ICONS = {
  inbox: <><path d="M3 13h5l2 3h4l2-3h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>,
  send: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>,
  sent: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>,
  drafts: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></>,
  archive: <><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v11h14V9" /><path d="M10 13h4" /></>,
  trash: <><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13" /><path d="M9 7V4h6v3" /></>,
  spam: <><path d="M12 3 2 21h20z" /><path d="M12 10v5M12 18h.01" /></>,
  star: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  folder: <path d="M3 6h6l2 2h10v11H3z" />,
  all: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></>,
  reply: <><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 5 5v5" /></>,
  replyAll: <><path d="M11 14 6 9l5-5" /><path d="M7 14 2 9l5-5" /><path d="M6 9h9a5 5 0 0 1 5 5v5" /></>,
  forward: <><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0-5 5v5" /></>,
  compose: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  clip: <path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></>
}
