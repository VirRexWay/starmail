import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, useCopy, useStore } from '../store'
import { Icon } from './Hud'

const variants = {
  hidden: { opacity: 0, y: 80, scale: 0.92, filter: 'blur(8px)' },
  shown: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 320, damping: 30 } },
  // "sent" launches the panel into the starfield; "discard" just folds it away
  exit: (sent: boolean) =>
    sent
      ? { opacity: 0, y: -420, scale: 0.08, rotateX: 50, filter: 'blur(4px) brightness(3)', transition: { duration: 0.75, ease: [0.6, 0, 0.9, 0.4] as const } }
      : { opacity: 0, y: 60, scale: 0.94, filter: 'blur(6px)', transition: { duration: 0.22 } }
}

export function ComposerHost() {
  const draft = useStore((s) => s.draft)
  const [sent, setSent] = useState(false)
  return (
    <AnimatePresence custom={sent} onExitComplete={() => setSent(false)}>
      {draft && <Composer key="composer" onSent={setSent} />}
    </AnimatePresence>
  )
}

function Composer({ onSent }: { onSent: (sent: boolean) => void }) {
  const { draft, accounts, updateDraft, closeDraft, send, sending } = useStore()
  const copy = useCopy()
  const [showCc, setShowCc] = useState(!!draft?.cc || !!draft?.bcc)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const toRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!draft) return
    if (draft.to) {
      bodyRef.current?.focus()
      bodyRef.current?.setSelectionRange(0, 0)
    } else toRef.current?.focus()
    // focus only when the composer first opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!draft) return null
  const account = accounts.find((a) => a.id === draft.accountId)

  const doSend = async (): Promise<void> => {
    // Set before sending so the exit animation (triggered when the draft closes) is the launch
    onSent(true)
    if (!(await send())) onSent(false)
  }

  return (
    <motion.div
      className="composer"
      style={{ '--acc': account?.color } as React.CSSProperties}
      variants={variants}
      initial="hidden"
      animate="shown"
      exit="exit"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void doSend()
        if (e.key === 'Escape') closeDraft()
        e.stopPropagation()
      }}
    >
      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      <header className="composer__head">
        <span className="composer__title">
          {copy.composeTitle[draft.mode]}
          {copy.accent?.compose && <span className="composer__accent">{copy.accent.compose}</span>}
        </span>
        <button className="icon-btn" onClick={closeDraft} title="Discard (Esc)">
          <Icon name="close" />
        </button>
      </header>

      <label className="field">
        <span>FROM</span>
        <select value={draft.accountId} onChange={(e) => updateDraft({ accountId: e.target.value })}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName} &lt;{a.email}&gt;
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>TO</span>
        <input ref={toRef} value={draft.to} onChange={(e) => updateDraft({ to: e.target.value })} placeholder="recipient@starbase.space, …" />
        {!showCc && (
          <button className="field__toggle" onClick={() => setShowCc(true)}>
            CC/BCC
          </button>
        )}
      </label>
      {showCc && (
        <>
          <label className="field">
            <span>CC</span>
            <input value={draft.cc} onChange={(e) => updateDraft({ cc: e.target.value })} />
          </label>
          <label className="field">
            <span>BCC</span>
            <input value={draft.bcc} onChange={(e) => updateDraft({ bcc: e.target.value })} />
          </label>
        </>
      )}
      <label className="field">
        <span>SUBJ</span>
        <input value={draft.subject} onChange={(e) => updateDraft({ subject: e.target.value })} />
      </label>

      <textarea ref={bodyRef} className="composer__body" value={draft.text} onChange={(e) => updateDraft({ text: e.target.value })} placeholder="Compose message…" />

      {draft.attachments.length > 0 && (
        <div className="composer__files">
          {draft.attachments.map((p) => (
            <span key={p} className="chip">
              <Icon name="clip" size={13} />
              <span className="chip__name">{p.split(/[\\/]/).pop()}</span>
              <button onClick={() => updateDraft({ attachments: draft.attachments.filter((x) => x !== p) })}>
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <footer className="composer__foot">
        <button
          className="icon-btn"
          title="Attach files"
          onClick={async () => {
            const files = await api.mail.pickAttachments()
            if (files.length) updateDraft({ attachments: [...new Set([...draft.attachments, ...files])] })
          }}
        >
          <Icon name="clip" />
        </button>
        <span className="composer__hint">{copy.sendHint}</span>
        <button className="btn btn--primary btn--send" onClick={doSend} disabled={sending}>
          {sending ? (
            <span className="btn__charging">{copy.sending}</span>
          ) : (
            <>
              <Icon name="send" /> {copy.send}
            </>
          )}
        </button>
      </footer>
    </motion.div>
  )
}
