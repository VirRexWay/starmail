import { AnimatePresence, motion } from 'framer-motion'
import { useCopy, useStore } from '../store'

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  const copy = useCopy()
  return (
    <div className="toasts">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            className={`toast toast--${t.kind}`}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
            onClick={() => dismissToast(t.id)}
          >
            <span className="toast__kicker">{copy.kicker[t.kind]}</span>
            <strong>{t.title}</strong>
            {t.body && <span className="toast__body">{t.body}</span>}
            <motion.span className="toast__timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: t.kind === 'error' ? 8 : 4.5, ease: 'linear' }} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
