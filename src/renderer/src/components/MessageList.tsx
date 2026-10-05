import { AnimatePresence, motion } from 'framer-motion'
import { msgKey, useCopy, useStore } from '../store'
import { sfx } from '../fx'
import { HudPanel, Icon, Spinner } from './Hud'

export function relTime(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - +d) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400 && d.getDate() === new Date().getDate()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  if (diff < 7 * 86400) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MessageList() {
  const { messages, loading, listError, hasMore, selectedKey, open, act, loadMessages, accounts, sel, folders, query } = useStore()
  const anim = useStore((s) => s.settings.animation)
  const copy = useCopy()
  const colorOf = (id: string): string => accounts.find((a) => a.id === id)?.color ?? 'var(--primary)'
  const folderName =
    sel.accountId === '*' ? copy.allChannels : (folders[sel.accountId]?.find((f) => f.path === sel.folder)?.name ?? sel.folder)

  return (
    <HudPanel
      className="list-panel"
      label={query ? `${copy.searchLabel} // ${query}` : folderName}
      accent={copy.accent?.list}
      right={<span className="hud-panel__count">{messages.length.toString().padStart(3, '0')}</span>}
    >
      <div className="list">
        {loading && messages.length === 0 && <Spinner />}
        {!loading && listError && (
          <div className="list__empty list__empty--error">
            <Icon name="spam" size={28} />
            <p>{copy.signalLost}</p>
            <small>{listError}</small>
          </div>
        )}
        {!loading && !listError && messages.length === 0 && (
          <div className="list__empty">
            <Icon name="inbox" size={28} />
            <p>{query ? copy.noResults : copy.emptyFolder}</p>
          </div>
        )}
        <AnimatePresence initial={anim !== 'off'}>
          {messages.map((m, i) => {
            const key = msgKey(m)
            return (
              <motion.button
                key={key}
                layout={anim === 'full' ? 'position' : false}
                className={`row ${key === selectedKey ? 'is-selected' : ''} ${m.seen ? '' : 'is-unread'}`}
                style={{ '--acc': colorOf(m.accountId) } as React.CSSProperties}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 15) * 0.025 } }}
                exit={{ opacity: 0, x: -120, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.28 } }}
                onClick={() => open(m)}
                onMouseEnter={sfx.hover}
                data-key={key}
              >
                <span className="row__stripe" />
                <div className="row__top">
                  <span className="row__from">{m.from.name || m.from.address || '(unknown)'}</span>
                  {m.hasAttachments && <Icon name="clip" size={13} />}
                  <span className="row__date">{relTime(m.date)}</span>
                </div>
                <div className="row__subject">{m.subject}</div>
                {m.snippet && <div className="row__snippet">{m.snippet}</div>}
                <span
                  className={`row__flag ${m.flagged ? 'is-on' : ''}`}
                  role="button"
                  title="Priority"
                  onClick={(e) => {
                    e.stopPropagation()
                    act(m.flagged ? 'unflag' : 'flag', m)
                  }}
                >
                  <Icon name="star" size={14} />
                </span>
              </motion.button>
            )
          })}
        </AnimatePresence>
        {hasMore && !query && (
          <button className="list__more" onClick={() => loadMessages(true)} disabled={loading}>
            {loading ? `${copy.scanning}…` : copy.loadMore}
          </button>
        )}
      </div>
    </HudPanel>
  )
}
