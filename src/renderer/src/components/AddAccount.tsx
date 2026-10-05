import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AuthKind, NewAccountInput, ProviderId, ServerConfig } from '@shared/types'
import { api, useCopy, useStore, useUniverse } from '../store'
import { sfx, warp } from '../fx'
import { Icon } from './Hud'

interface ProviderDef {
  id: ProviderId
  name: string
  blurb: string
  glyph: string
  imap: ServerConfig
  smtp: ServerConfig
  auths: { kind: AuthKind; label: string }[]
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'gmail', name: 'Gmail', glyph: 'G', blurb: 'Google Mail & Workspace',
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
    auths: [{ kind: 'password', label: 'App password' }, { kind: 'oauth-google', label: 'Google sign-in (OAuth)' }]
  },
  {
    id: 'outlook', name: 'Outlook', glyph: 'O', blurb: 'Outlook.com, Hotmail, Microsoft 365',
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
    auths: [{ kind: 'oauth-microsoft', label: 'Microsoft sign-in (OAuth)' }]
  },
  {
    id: 'proton', name: 'Proton Mail', glyph: 'P', blurb: 'Through Proton Mail Bridge',
    imap: { host: '127.0.0.1', port: 1143, secure: false, allowSelfSigned: true },
    smtp: { host: '127.0.0.1', port: 1025, secure: false, allowSelfSigned: true },
    auths: [{ kind: 'password', label: 'Bridge password' }]
  },
  {
    id: 'imap', name: 'Other IMAP', glyph: '@', blurb: 'Fastmail, iCloud, Yahoo, self-hosted…',
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
    auths: [{ kind: 'password', label: 'Password' }]
  },
  {
    id: 'demo', name: 'Simulation', glyph: '◈', blurb: 'Demo mailbox, no real account',
    imap: { host: '', port: 0, secure: false },
    smtp: { host: '', port: 0, secure: false },
    auths: [{ kind: 'none', label: 'Simulation' }]
  }
]

const HELP: Partial<Record<AuthKind | ProviderId, React.ReactNode>> = {
  'oauth-google': (
    <>
      Create a <b>Desktop app</b> OAuth client in Google Cloud Console (APIs &amp; Services → Credentials), add yourself as a
      test user on the consent screen, and paste its client ID and secret here. Your browser opens to sign in.
    </>
  ),
  'oauth-microsoft': (
    <>
      Register an app in Azure Portal → App registrations (account type: <i>personal + work accounts</i>). Add the platform
      <b> Mobile and desktop applications</b> with redirect URI <code>http://localhost</code>, enable <i>Allow public client flows</i>, and
      paste the Application (client) ID here. Your browser opens to sign in.
    </>
  ),
  proton: (
    <>
      Install and sign in to <b>Proton Mail Bridge</b>. Copy the IMAP/SMTP username and the Bridge-generated password from its
      mailbox settings. The Bridge must be running while StarMail is open.
    </>
  ),
  gmail: (
    <>
      Turn on 2-Step Verification, then create an app password at <b>myaccount.google.com/apppasswords</b> and paste the 16-letter code
      below.
    </>
  )
}

export function AddAccount() {
  const { setPanel, reloadAccounts, accounts, toast, select } = useStore()
  const [provider, setProvider] = useState<ProviderDef | null>(null)
  const [form, setForm] = useState<NewAccountInput | null>(null)
  const [busy, setBusy] = useState<'test' | 'add' | null>(null)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)
  const first = accounts.length === 0
  const copy = useCopy()
  const accountColors = useUniverse().accountColors
  const nameOf = (p: ProviderDef): string => (p.id === 'demo' ? copy.simulation : p.name)

  const pick = (p: ProviderDef): void => {
    sfx.select()
    setProvider(p)
    setStatus(null)
    setForm({
      provider: p.id,
      auth: p.auths[0].kind,
      email: '',
      displayName: '',
      label: p.id === 'demo' ? 'Starship Meridian' : p.name,
      color: accountColors[accounts.length % accountColors.length],
      imap: { ...p.imap },
      smtp: { ...p.smtp },
      username: '',
      password: '',
      oauthClientId: '',
      oauthClientSecret: ''
    })
    if (p.id === 'demo') void link(true)
  }

  const set = (patch: Partial<NewAccountInput>): void => setForm((f) => (f ? { ...f, ...patch } : f))
  const setServer = (which: 'imap' | 'smtp', patch: Partial<ServerConfig>): void =>
    setForm((f) => (f ? { ...f, [which]: { ...f[which], ...patch } } : f))

  const isOAuth = form?.auth === 'oauth-google' || form?.auth === 'oauth-microsoft'

  const test = async (): Promise<void> => {
    if (!form) return
    setBusy('test')
    setStatus(null)
    const res = await api.accounts.test(form)
    setBusy(null)
    if (res.ok) sfx.confirm()
    else sfx.error()
    setStatus(res.ok ? { ok: true, text: copy.handshakeOk } : { ok: false, text: res.error ?? 'Failed' })
  }

  const link = async (demo = false): Promise<void> => {
    const input: NewAccountInput | null = demo
      ? { provider: 'demo', auth: 'none', email: '', displayName: '', label: 'Starship Meridian', color: accountColors[0], imap: PROVIDERS[4].imap, smtp: PROVIDERS[4].smtp }
      : form
    if (!input) return
    setBusy('add')
    setStatus(isOAuth ? { ok: true, text: 'Complete sign-in in your browser…' } : null)
    try {
      const acc = await api.accounts.add(input)
      sfx.confirm()
      warp(1, 1500)
      toast('success', copy.toast.linked, acc.email)
      setPanel(null)
      await reloadAccounts()
      await select({ accountId: '*', folder: 'INBOX' })
    } catch (e) {
      sfx.error()
      setStatus({ ok: false, text: String((e as Error).message).replace(/^.*?Error: /, '') })
    } finally {
      setBusy(null)
    }
  }

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="modal hud-panel"
        initial={{ scale: 0.9, opacity: 0, rotateX: 12 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      >
        <i className="corner tl" />
        <i className="corner tr" />
        <i className="corner bl" />
        <i className="corner br" />
        <header className="modal__head">
          <div>
            <div className="modal__kicker">{first ? copy.welcome : copy.configureKicker}</div>
            <h2>{provider ? `Link ${nameOf(provider)}` : copy.addTitle}</h2>
          </div>
          {!first && (
            <button className="icon-btn" onClick={() => setPanel(null)}>
              <Icon name="close" />
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {!provider || provider.id === 'demo' ? (
            <motion.div key="pick" className="providers" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              {PROVIDERS.map((p, i) => (
                <motion.button
                  key={p.id}
                  className={`provider provider--${p.id}`}
                  onClick={() => pick(p)}
                  onMouseEnter={sfx.hover}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                  whileHover={{ y: -4 }}
                  disabled={busy !== null}
                >
                  <span className="provider__glyph">{p.glyph}</span>
                  <span className="provider__name">{nameOf(p)}</span>
                  <span className="provider__blurb">{p.blurb}</span>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            form && (
              <motion.div key="form" className="acct-form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
                {provider.auths.length > 1 && (
                  <div className="seg">
                    {provider.auths.map((a) => (
                      <button key={a.kind} className={form.auth === a.kind ? 'is-on' : ''} onClick={() => set({ auth: a.kind })}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}

                {(isOAuth ? HELP[form.auth] : HELP[provider.id]) && <p className="help">{isOAuth ? HELP[form.auth] : HELP[provider.id]}</p>}

                <div className="grid2">
                  <TextField label="Email address" value={form.email} onChange={(email) => set({ email })} placeholder={isOAuth ? 'optional — detected at sign-in' : 'you@example.com'} />
                  <TextField label="Display name" value={form.displayName} onChange={(displayName) => set({ displayName })} placeholder="Name on outgoing mail" />
                </div>

                {isOAuth ? (
                  <div className="grid2">
                    <TextField label="OAuth client ID" value={form.oauthClientId ?? ''} onChange={(oauthClientId) => set({ oauthClientId })} />
                    {form.auth === 'oauth-google' && (
                      <TextField label="Client secret" value={form.oauthClientSecret ?? ''} onChange={(oauthClientSecret) => set({ oauthClientSecret })} secret />
                    )}
                  </div>
                ) : (
                  <div className="grid2">
                    <TextField
                      label={provider.id === 'proton' ? 'Bridge username' : 'Username'}
                      value={form.username ?? ''}
                      onChange={(username) => set({ username })}
                      placeholder="defaults to email"
                    />
                    <TextField
                      label={provider.id === 'gmail' ? 'App password' : provider.id === 'proton' ? 'Bridge password' : 'Password'}
                      value={form.password ?? ''}
                      onChange={(password) => set({ password })}
                      secret
                    />
                  </div>
                )}

                {(provider.id === 'imap' || provider.id === 'proton') && (
                  <div className="servers">
                    {(['imap', 'smtp'] as const).map((w) => (
                      <div key={w} className="server">
                        <span className="server__label">{w.toUpperCase()}</span>
                        <input value={form[w].host} onChange={(e) => setServer(w, { host: e.target.value })} placeholder={`${w}.example.com`} />
                        <input className="server__port" type="number" value={form[w].port} onChange={(e) => setServer(w, { port: Number(e.target.value) })} />
                        <select value={form[w].secure ? 'tls' : 'starttls'} onChange={(e) => setServer(w, { secure: e.target.value === 'tls' })}>
                          <option value="tls">SSL/TLS</option>
                          <option value="starttls">STARTTLS</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid2">
                  <TextField label={copy.channelLabel} value={form.label} onChange={(label) => set({ label })} />
                  <div className="tf">
                    <span>{copy.channelColour}</span>
                    <div className="swatches">
                      {accountColors.map((c) => (
                        <button key={c} className={`swatch ${form.color === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => set({ color: c })} />
                      ))}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {status && (
                    <motion.div className={`status ${status.ok ? 'status--ok' : 'status--err'}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      {status.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <footer className="modal__foot">
                  <button className="btn" onClick={() => { setProvider(null); setStatus(null) }}>
                    ‹ Back
                  </button>
                  <span style={{ flex: 1 }} />
                  {!isOAuth && (
                    <button className="btn" onClick={test} disabled={busy !== null}>
                      {busy === 'test' ? 'Pinging…' : 'Test link'}
                    </button>
                  )}
                  <button className="btn btn--primary" onClick={() => link()} disabled={busy !== null}>
                    {busy === 'add' ? (isOAuth ? 'Awaiting sign-in…' : 'Linking…') : isOAuth ? 'Sign in & link' : 'Link account'}
                  </button>
                </footer>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

function TextField({ label, value, onChange, placeholder, secret }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean }) {
  return (
    <label className="tf">
      <span>{label}</span>
      <input type={secret ? 'password' : 'text'} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
    </label>
  )
}
