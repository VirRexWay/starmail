import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, useUniverse } from '../store'
import { sfx, warp } from '../fx'

/** Startup sequence in the current universe's style. Click or press any key to skip. */
export function Boot({ onDone }: { onDone: () => void }) {
  const universe = useUniverse()
  const ship = useStore((s) => s.settings.shipName)
  const [shown, setShown] = useState(0)
  const { title, subtitle, lines, hint } = universe.boot

  useEffect(() => {
    sfx.boot()
    const timers = lines.map((_, i) => setTimeout(() => setShown(i + 1), 250 + i * 230))
    timers.push(setTimeout(() => warp(1.2, 1200), 1500))
    timers.push(setTimeout(onDone, 2300))
    const skip = (): void => onDone()
    window.addEventListener('keydown', skip)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
    }
  }, [onDone, lines])

  return (
    <motion.div
      className="boot"
      onClick={onDone}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: 'blur(8px)' }}
      transition={{ duration: 0.5 }}
    >
      <motion.div className="boot__ring" initial={{ scale: 0.2, opacity: 0, rotate: -90 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 1.1, ease: [0.2, 0.9, 0.2, 1] }}>
        <div className="boot__ring-inner" />
      </motion.div>
      <motion.h1 className="boot__title" initial={{ letterSpacing: '1.2em', opacity: 0 }} animate={{ letterSpacing: '0.35em', opacity: 1 }} transition={{ duration: 1, delay: 0.2 }}>
        {title}
      </motion.h1>
      <motion.div className="boot__ship" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {subtitle(universe.copy.vessel(ship))}
      </motion.div>
      <div className="boot__log">
        {lines.slice(0, shown).map((l) => (
          <motion.div key={l} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
            <span className="boot__chev">›</span> {l}
          </motion.div>
        ))}
      </div>
      <div className="boot__hint">{hint}</div>
    </motion.div>
  )
}
