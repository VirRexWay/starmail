import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Address, MessageDetail } from '@shared/types'
import { api, useCopy, useStore } from '../store'
import { sfx } from '../fx'
import { Decode, HudPanel, Icon, Spinner } from './Hud'

const fmt = (a: Address): string => (a.name ? `${a.name} <${a.address}>` : a.address)

function initials(a: Address): string {
  const src = a.name || a.address
  const parts = src.replace(/[<>"]/g, '').split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
}

function bytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function buildDoc(html: string, remote: boolean, dark: boolean): string {
  const ext = remote ? ' https:' : ''
  return `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:${ext}; style-src 'unsafe-inline'${ext}; font-src data:${ext}; media-src data:${ext}">
<base target="_blank">
<style>
  html { background: #fff; }
  body { margin: 0; padding: 22px 26px; font: 15px/1.55 -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1a1d24; overflow-wrap: anywhere; }
  img { max-width: 100%; height: auto; }
  table { max-width: 100% !important; }
  ${dark ? 'html { filter: invert(.9) hue-rotate(180deg); } img, video, picture, [style*="background-image"] { filter: invert(1) hue-rotate(180deg); }' : ''}
</style></head><body>${html}</body></html>`
}

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g

function Linkified({ text }: { text: string }) {
  const parts: ReactNode[] = text.split(URL_RE).map((p, i) =>
    i % 2 ? (
      <a key={i} href={p} onClick={(e) => { e.preventDefault(); void api.app.openExternal(p) }}>
        {p}
      </a>
    ) : (
      p
    )
  )
  return <pre className="reader__text">{parts}</pre>
}

export function Reader() {
  const { detail, detailLoading, selectedKey } = useStore()
  const copy = useCopy()

  return (
    <HudPanel className="reader-panel" label={copy.readerLabel} accent={copy.accent?.reader}>
      <AnimatePresence mode="wait">
        {detail ? (
          <motion.div
            key={selectedKey}
            className="reader"
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.28 }}
          >
            <MessageView m={detail} />
          </motion.div>
        ) : detailLoading ? (
          <motion.div key="loading" className="reader__idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Spinner label={copy.decrypting} />
          </motion.div>
        ) : (
          <motion.div key="idle" className="reader__idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="holo">
              <div className="holo__ring holo__ring--1" />
              <div className="holo__ring holo__ring--2" />
              <div className="holo__ring holo__ring--3" />
              <div className="holo__core"><Icon name="mail" size={34} /></div>
            </div>
            <p className="reader__idle-title">{copy.idleTitle}</p>
            <p className="reader__idle-hint">
              <kbd>J</kbd>/<kbd>K</kbd> navigate · <kbd>C</kbd> compose · <kbd>/</kbd> search
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </HudPanel>
  )
}

function Btn({ icon, label, onClick, danger, on, compact }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onClick: () => void; danger?: boolean; on?: boolean; compact?: boolean }) {
  return (
    <button className={`tool ${danger ? 'tool--danger' : ''} ${on ? 'is-on' : ''} ${compact ? 'tool--icon' : ''}`} onClick={onClick} onMouseEnter={sfx.hover} title={label}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  )
}

function MessageView({ m }: { m: MessageDetail }) {
  const { act, compose, accounts, toast } = useStore()
  const copy = useCopy()
  const settings = useStore((s) => s.settings)
  const [remote, setRemote] = useState(settings.loadRemoteImages)
  const [dark, setDark] = useState(settings.darkAdaptEmails)
  const account = accounts.find((a) => a.id === m.accountId)
  const hasRemote = useMemo(() => !!m.html && /(src|background)\s*=\s*["']?https?:|url\(\s*["']?https?:/i.test(m.html), [m.html])
  const doc = useMemo(() => (m.html ? buildDoc(m.html, remote, dark) : ''), [m.html, remote, dark])

  return (
    <>
      <div className="reader__toolbar">
        <Btn icon="reply" label="Reply" onClick={() => compose('reply', m)} />
        <Btn icon="replyAll" label="All" onClick={() => compose('replyAll', m)} />
        <Btn icon="forward" label="Fwd" onClick={() => compose('forward', m)} />
        <span className="reader__sep" />
        <Btn icon="star" label="Priority" compact on={m.flagged} onClick={() => act(m.flagged ? 'unflag' : 'flag')} />
        <Btn icon="eyeOff" label="Unread" compact onClick={() => act('unseen')} />
        <Btn icon="archive" label="Archive" compact onClick={() => act('archive')} />
        <Btn icon="spam" label="Spam" compact onClick={() => act('spam')} />
        <Btn icon="trash" label="Delete" compact danger onClick={() => act('trash')} />
      </div>

      <h1 className="reader__subject">
        <Decode text={m.subject} />
      </h1>

      <div className="reader__meta">
        <div className="avatar" style={{ '--acc': account?.color } as React.CSSProperties}>
          {initials(m.from)}
        </div>
        <div className="reader__people">
          <div className="reader__from">
            <strong>{m.from.name || m.from.address}</strong>
            {m.from.name && <span className="dim"> &lt;{m.from.address}&gt;</span>}
          </div>
          <div className="reader__to dim">
            to {m.to.map(fmt).join(', ') || 'undisclosed'}
            {m.cc.length > 0 && <> · cc {m.cc.map(fmt).join(', ')}</>}
          </div>
        </div>
        <div className="reader__date">
          <span>{new Date(m.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          {account && <span className="reader__via" style={{ color: account.color }}>via {account.label || account.email}</span>}
        </div>
      </div>

      {m.attachments.length > 0 && (
        <div className="reader__attachments">
          {m.attachments.map((a) => (
            <button
              key={a.index}
              className="chip"
              onClick={async () => {
                try {
                  const path = await api.mail.saveAttachment(m.accountId, m.folder, m.uid, a.index)
                  if (path) toast('success', copy.toast.saved, path)
                } catch (e) {
                  toast('error', copy.toast.saveFail, String((e as Error).message).replace(/^.*?Error: /, ''))
                }
              }}
            >
              <Icon name="download" size={14} />
              <span className="chip__name">{a.filename}</span>
              <span className="chip__size">{bytes(a.size)}</span>
            </button>
          ))}
        </div>
      )}

      {m.html && (
        <div className="reader__bodybar">
          {hasRemote && !remote && (
            <button className="bodybar__btn" onClick={() => setRemote(true)}>
              <Icon name="image" size={14} /> Remote images blocked for privacy — load them
            </button>
          )}
          <button className={`bodybar__btn ${dark ? 'is-on' : ''}`} onClick={() => setDark(!dark)}>
            <Icon name="moon" size={14} /> Dark-adapt
          </button>
        </div>
      )}

      <div className="reader__body">
        {m.html ? (
          <iframe className="reader__frame" title="message" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={doc} />
        ) : (
          <Linkified text={m.text ?? ''} />
        )}
      </div>
    </>
  )
}
