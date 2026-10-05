import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useCopy, useStore } from '../store'
import { sfx, warp } from '../fx'
import { Icon, Stardate } from './Hud'

export function TopBar() {
  const { settings, search, query, compose, setPanel, poll, loading, accounts } = useStore()
  const copy = useCopy()
  const [q, setQ] = useState(query)
  const [spinning, setSpinning] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => setQ(query), [query])

  useEffect(() => {
    const focus = (): void => input.current?.focus()
    window.addEventListener('starmail:search', focus)
    return () => window.removeEventListener('starmail:search', focus)
  }, [])

  const refresh = async (): Promise<void> => {
    sfx.confirm()
    warp(0.6, 900)
    setSpinning(true)
    await poll()
    setSpinning(false)
  }

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__logo">
          <span />
        </div>
        <div className="brand__text">
          <span className="brand__name">{copy.brand}</span>
          <span className="brand__ship">{copy.vessel(settings.shipName)} · {copy.uplinks(accounts.length)}</span>
        </div>
      </div>

      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault()
          void search(q)
        }}
      >
        <Icon name="search" />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            if (!e.target.value && query) void search('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQ('')
              if (query) void search('')
              input.current?.blur()
            }
          }}
          placeholder={copy.searchPlaceholder}
          spellCheck={false}
        />
        {loading && <span className="search__pulse" />}
      </form>

      <div className="topbar__actions">
        <motion.button className="btn btn--primary" onClick={() => compose()} whileTap={{ scale: 0.95 }} onMouseEnter={sfx.hover} disabled={!accounts.length}>
          <Icon name="compose" /> {copy.compose}
        </motion.button>
        <button className={`icon-btn ${spinning ? 'is-spinning' : ''}`} onClick={refresh} title="Scan for new mail" onMouseEnter={sfx.hover}>
          <Icon name="refresh" />
        </button>
        <button className="icon-btn" onClick={() => setPanel('settings')} title="Settings (Ctrl+,)" onMouseEnter={sfx.hover}>
          <Icon name="settings" />
        </button>
      </div>

      <Stardate />
    </header>
  )
}
