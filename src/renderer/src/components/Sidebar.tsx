import { motion } from 'framer-motion'
import type { Folder } from '@shared/types'
import { useCopy, useStore } from '../store'
import { sfx } from '../fx'
import { Icon } from './Hud'

const FOLDER_ICON: Record<string, Parameters<typeof Icon>[0]['name']> = {
  '\\Inbox': 'inbox',
  '\\Sent': 'sent',
  '\\Drafts': 'drafts',
  '\\Archive': 'archive',
  '\\All': 'archive',
  '\\Trash': 'trash',
  '\\Junk': 'spam',
  '\\Flagged': 'star'
}

const PROVIDER_TAG: Record<string, string> = { gmail: 'GMAIL', outlook: 'OUTLOOK', proton: 'PROTON', imap: 'IMAP', demo: 'SIM' }

export function Sidebar() {
  const { accounts, folders, folderErrors, sel, select, setPanel } = useStore()
  const copy = useCopy()
  const totalUnread = accounts.reduce(
    (n, a) => n + (folders[a.id]?.find((f) => f.specialUse === '\\Inbox')?.unread ?? 0),
    0
  )

  return (
    <nav className="sidebar">
      <button
        className={`nav-item nav-item--all ${sel.accountId === '*' ? 'is-active' : ''}`}
        onClick={() => select({ accountId: '*', folder: 'INBOX' })}
        onMouseEnter={sfx.hover}
      >
        <Icon name="all" />
        <span className="nav-item__name">{copy.allChannels}</span>
        {copy.accent?.all && <span className="nav-item__accent">{copy.accent.all}</span>}
        {totalUnread > 0 && <span className="badge">{totalUnread}</span>}
      </button>

      <div className="sidebar__scroll">
        {accounts.map((a, i) => (
          <motion.div
            key={a.id}
            className="account"
            style={{ '--acc': a.color } as React.CSSProperties}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <div className="account__head">
              <span className="account__dot" />
              <div className="account__meta">
                <span className="account__label">{a.label || a.email}</span>
                <span className="account__email">{a.email}</span>
              </div>
              <span className="account__tag">{PROVIDER_TAG[a.provider]}</span>
            </div>
            {folderErrors[a.id] && (
              <div className="account__error" title={folderErrors[a.id]}>
                ⚠ {copy.linkDown} — {folderErrors[a.id]}
              </div>
            )}
            {(folders[a.id] ?? []).map((f) => (
              <FolderRow key={f.path} f={f} active={sel.accountId === a.id && sel.folder === f.path} onClick={() => select({ accountId: a.id, folder: f.path })} />
            ))}
          </motion.div>
        ))}
      </div>

      <button className="nav-add" onClick={() => setPanel('addAccount')} onMouseEnter={sfx.hover}>
        <Icon name="plus" /> {copy.linkAccount}
      </button>
    </nav>
  )
}

function FolderRow({ f, active, onClick }: { f: Folder; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`nav-item ${active ? 'is-active' : ''}`}
      style={{ paddingLeft: 14 + f.depth * 14 }}
      onClick={onClick}
      onMouseEnter={sfx.hover}
      title={f.path}
    >
      {active && <motion.span layoutId="nav-active" className="nav-item__glow" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />}
      <Icon name={FOLDER_ICON[f.specialUse ?? ''] ?? 'folder'} />
      <span className="nav-item__name">{f.name}</span>
      {!!f.unread && <span className="badge">{f.unread}</span>}
    </button>
  )
}
