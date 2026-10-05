import { motion } from 'framer-motion'
import type { Settings as S, UniverseId } from '@shared/types'
import { api, useCopy, useStore, useUniverse } from '../store'
import { sfx, warp } from '../fx'
import { UNIVERSE_GROUPS, UNIVERSE_LIST } from '../universes'
import { Icon } from './Hud'

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="set-row">
      <div className="set-row__text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
      <div className="set-row__ctl">{children}</div>
    </div>
  )
}

function Toggle({ k }: { k: keyof S }) {
  const on = useStore((st) => st.settings[k])
  return (
    <button
      className={`toggle ${on ? 'is-on' : ''}`}
      onClick={() => {
        sfx.select()
        useStore.getState().updateSettings({ [k]: !on } as Partial<S>)
      }}
    >
      <span />
    </button>
  )
}

function Seg<K extends keyof S>({ k, options }: { k: K; options: [S[K], string][] }) {
  const value = useStore((st) => st.settings[k])
  return (
    <div className="seg seg--sm">
      {options.map(([v, l]) => (
        <button
          key={String(v)}
          className={value === v ? 'is-on' : ''}
          onClick={() => {
            sfx.select()
            useStore.getState().updateSettings({ [k]: v } as Partial<S>)
          }}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function Slider({ k, min = 0, max = 1, step = 0.05 }: { k: 'starDensity' | 'starSpeed' | 'volume' | 'glow' | 'pollSeconds'; min?: number; max?: number; step?: number }) {
  const value = useStore((st) => st.settings[k])
  return (
    <input
      type="range"
      className="slider"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => useStore.getState().updateSettings({ [k]: Number(e.target.value) })}
    />
  )
}

export function Settings() {
  const { settings: s, updateSettings: set, setPanel, accounts, reloadAccounts, toast, switchUniverse } = useStore()
  const universe = useUniverse()
  const copy = useCopy()

  return (
    <>
      <motion.div className="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(null)} />
      <motion.aside
        className="drawer hud-panel"
        initial={{ x: '105%' }}
        animate={{ x: 0 }}
        exit={{ x: '105%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      >
        <i className="corner tl" />
        <i className="corner bl" />
        <header className="drawer__head">
          <div>
            <div className="modal__kicker">{copy.settingsKicker}</div>
            <h2>{copy.settingsTitle}</h2>
          </div>
          <button className="icon-btn" onClick={() => setPanel(null)}>
            <Icon name="close" />
          </button>
        </header>

        <div className="drawer__body">
          <h3>Universe</h3>
          <div className="universe-select">
            <select value={s.universe} onChange={(e) => switchUniverse(e.target.value as UniverseId)} aria-label="Universe">
              {UNIVERSE_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {UNIVERSE_LIST.filter((u) => u.group === group).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="universe-select__tagline">{universe.tagline}</p>
          </div>

          <h3>Color scheme</h3>
          <div className="presets">
            {universe.presets.map((p) => (
              <button
                key={p.id}
                className={`preset ${s.theme === p.id ? 'is-on' : ''}`}
                onClick={() => {
                  sfx.confirm()
                  set({ theme: p.id, primary: p.primary, secondary: p.secondary, alert: p.alert })
                }}
              >
                <span className="preset__chips">
                  <i style={{ background: p.primary }} />
                  <i style={{ background: p.secondary }} />
                  <i style={{ background: p.alert }} />
                </span>
                {p.name}
              </button>
            ))}
          </div>
          <Row label="Custom colors" hint="Primary · secondary · alert">
            {(['primary', 'secondary', 'alert'] as const).map((k) => (
              <input key={k} type="color" className="color" value={s[k]} onChange={(e) => set({ [k]: e.target.value, theme: 'custom' })} />
            ))}
          </Row>
          <Row label="Glow intensity">
            <Slider k="glow" />
          </Row>
          <Row label="Typeface">
            <Seg k="font" options={universe.fonts.map((f) => [f.id, f.name])} />
          </Row>
          <Row label="List density">
            <Seg k="density" options={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} />
          </Row>

          <h3>{copy.viewscreen}</h3>
          <Row label="Background">
            <Seg k="background" options={universe.backgrounds.map((b) => [b.id, b.name])} />
          </Row>
          <Row label="Particle density">
            <Slider k="starDensity" />
          </Row>
          <Row label="Drift speed">
            <Slider k="starSpeed" />
          </Row>
          <Row label={copy.warpLabel}>
            <button className="btn btn--sm" onClick={() => { sfx.send(); warp(1, 1800) }}>{copy.warpButton}</button>
          </Row>
          <Row label="Animations" hint="Off also freezes the background">
            <Seg k="animation" options={[['full', 'Full'], ['subtle', 'Subtle'], ['off', 'Off']]} />
          </Row>
          <Row label="Scanlines">
            <Toggle k="scanlines" />
          </Row>
          <Row label="Boot sequence on launch">
            <Toggle k="bootSequence" />
          </Row>
          <Row label={copy.shipNameLabel}>
            <input className="text-in" value={s.shipName} onChange={(e) => set({ shipName: e.target.value })} />
          </Row>

          <h3>Audio</h3>
          <Row label="Sound effects">
            <Toggle k="sound" />
          </Row>
          <Row label="Volume">
            <Slider k="volume" />
          </Row>

          <h3>{copy.comms}</h3>
          <Row label="Check for new mail" hint={`Every ${s.pollSeconds}s`}>
            <Slider k="pollSeconds" min={30} max={600} step={15} />
          </Row>
          <Row label="Desktop notifications">
            <Toggle k="notifications" />
          </Row>
          <Row label="Load remote images" hint="Off protects you from tracking pixels">
            <Toggle k="loadRemoteImages" />
          </Row>
          <Row label="Dark-adapt HTML emails" hint="Inverts light emails to match the dark theme">
            <Toggle k="darkAdaptEmails" />
          </Row>

          <h3>{copy.linkedChannels}</h3>
          {accounts.map((a) => (
            <div key={a.id} className="acct-row" style={{ '--acc': a.color } as React.CSSProperties}>
              <span className="account__dot" />
              <input
                className="text-in"
                defaultValue={a.label}
                onBlur={async (e) => {
                  if (e.target.value !== a.label) {
                    await api.accounts.update(a.id, { label: e.target.value })
                    await reloadAccounts()
                  }
                }}
              />
              <div className="swatches swatches--sm">
                {universe.accountColors.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${a.color === c ? 'is-on' : ''}`}
                    style={{ background: c }}
                    onClick={async () => {
                      await api.accounts.update(a.id, { color: c })
                      await reloadAccounts()
                    }}
                  />
                ))}
              </div>
              <button
                className="icon-btn icon-btn--danger"
                title="Unlink account"
                onClick={async () => {
                  await api.accounts.remove(a.id)
                  sfx.trash()
                  toast('info', copy.toast.unlinked, a.email)
                  await reloadAccounts()
                  await useStore.getState().loadMessages()
                }}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
          <button className="btn btn--sm" onClick={() => setPanel('addAccount')}>
            <Icon name="plus" size={14} /> Link account
          </button>

          <h3>Keyboard</h3>
          <div className="keys">
            {[
              ['J / K', 'Next / previous'],
              ['C', 'Compose'],
              ['R / A / F', 'Reply / all / forward'],
              ['E', 'Archive'],
              ['Del / #', 'Delete'],
              ['S', 'Toggle priority'],
              ['U', 'Mark unread'],
              ['/', 'Search'],
              ['Ctrl+,', 'Settings'],
              ['Esc', 'Close panel']
            ].map(([k, d]) => (
              <div key={k}>
                <kbd>{k}</kbd> <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.aside>
    </>
  )
}
