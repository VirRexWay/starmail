import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useStore } from './store'
import { Backdrop } from './components/Backdrop'
import { Boot } from './components/Boot'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { MessageList } from './components/MessageList'
import { Reader } from './components/Reader'
import { ComposerHost } from './components/Composer'
import { Settings } from './components/Settings'
import { AddAccount } from './components/AddAccount'
import { Toasts } from './components/Toasts'

function useKeyboard(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const s = useStore.getState()
      const el = e.target as HTMLElement
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        s.setPanel(s.panel === 'settings' ? null : 'settings')
        return
      }
      if (e.key === 'Escape') {
        if (s.panel && !(s.panel === 'addAccount' && s.accounts.length === 0)) s.setPanel(null)
        return
      }
      if (el.closest('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
      if (s.panel || s.draft) return
      const current = s.detail
      const map: Record<string, () => void> = {
        j: () => s.move(1),
        ArrowDown: () => s.move(1),
        k: () => s.move(-1),
        ArrowUp: () => s.move(-1),
        c: () => s.compose(),
        r: () => current && s.compose('reply', current),
        a: () => current && s.compose('replyAll', current),
        f: () => current && s.compose('forward', current),
        e: () => void s.act('archive'),
        '#': () => void s.act('trash'),
        Delete: () => void s.act('trash'),
        s: () => current && void s.act(current.flagged ? 'unflag' : 'flag'),
        u: () => void s.act('unseen'),
        '/': () => window.dispatchEvent(new Event('starmail:search'))
      }
      const fn = map[e.key]
      if (fn) {
        e.preventDefault()
        fn()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

function usePolling(): void {
  const seconds = useStore((s) => s.settings.pollSeconds)
  const ready = useStore((s) => s.ready)
  useEffect(() => {
    if (!ready) return
    const t = setInterval(() => void useStore.getState().poll(), seconds * 1000)
    return () => clearInterval(t)
  }, [seconds, ready])
}

export function App() {
  const { ready, settings, panel, init } = useStore()
  const [booting, setBooting] = useState(true)
  const finishBoot = useCallback(() => setBooting(false), [])

  useEffect(() => {
    void init()
  }, [init])

  useKeyboard()
  usePolling()

  const showBoot = ready && booting && settings.bootSequence
  const showUi = ready && (!booting || !settings.bootSequence)

  return (
    <MotionConfig reducedMotion={settings.animation === 'off' ? 'always' : 'never'}>
      <Backdrop
        mode={settings.background}
        density={settings.starDensity}
        speed={settings.starSpeed}
        primary={settings.primary}
        secondary={settings.secondary}
        alert={settings.alert}
        animated={settings.animation !== 'off'}
      />
      <div className="vignette" />

      <AnimatePresence>{showBoot && <Boot key="boot" onDone={finishBoot} />}</AnimatePresence>

      {showUi && (
        <motion.div
          className="shell"
          initial={{ opacity: 0, scale: 0.97, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.2, 0.9, 0.2, 1] }}
        >
          <TopBar />
          <main className="bridge">
            <Sidebar />
            <MessageList />
            <Reader />
          </main>
          <ComposerHost />
        </motion.div>
      )}

      <AnimatePresence>
        {showUi && panel === 'settings' && <Settings key="settings" />}
        {showUi && panel === 'addAccount' && <AddAccount key="add" />}
      </AnimatePresence>

      <Toasts />
      {settings.scanlines && <div className="scanlines" />}
    </MotionConfig>
  )
}
