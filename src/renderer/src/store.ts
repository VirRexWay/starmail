import { create } from 'zustand'
import type {
  AccountInfo,
  Api,
  Folder,
  MessageAction,
  MessageDetail,
  MessageSummary,
  OutgoingMessage,
  Settings,
  UniverseId
} from '@shared/types'
import { applyTheme, DEFAULT_SETTINGS, normalizeSettings, remapAccountColor, universeDefaults } from './theme'
import { universeOf, type Copy } from './universes'
import { configureSound, sfx, warp } from './fx'

declare global {
  interface Window {
    api: Api
  }
}
export const api = window.api

/** '*' = unified inbox across every account */
export interface Selection {
  accountId: string
  folder: string
}

export interface Toast {
  id: number
  kind: 'info' | 'success' | 'error' | 'incoming'
  title: string
  body?: string
}

export interface Draft {
  accountId: string
  to: string
  cc: string
  bcc: string
  subject: string
  text: string
  inReplyTo?: string
  references?: string[]
  attachments: string[]
  mode: 'new' | 'reply' | 'replyAll' | 'forward'
}

export type Panel = 'settings' | 'addAccount' | null

export const msgKey = (m: Pick<MessageSummary, 'accountId' | 'folder' | 'uid'>): string =>
  `${m.accountId}|${m.folder}|${m.uid}`

const errText = (e: unknown): string =>
  String((e as Error)?.message ?? e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')

interface State {
  ready: boolean
  settings: Settings
  accounts: AccountInfo[]
  folders: Record<string, Folder[]>
  folderErrors: Record<string, string>
  sel: Selection
  messages: MessageSummary[]
  cursors: Record<string, number>
  hasMore: boolean
  loading: boolean
  listError: string | null
  query: string
  selectedKey: string | null
  detail: MessageDetail | null
  detailLoading: boolean
  draft: Draft | null
  sending: boolean
  panel: Panel
  toasts: Toast[]

  init(): Promise<void>
  updateSettings(patch: Partial<Settings>): void
  switchUniverse(id: UniverseId): void
  setPanel(p: Panel): void
  toast(kind: Toast['kind'], title: string, body?: string): void
  dismissToast(id: number): void

  reloadAccounts(): Promise<void>
  loadFolders(accountId: string): Promise<void>
  select(sel: Selection): Promise<void>
  loadMessages(more?: boolean, silent?: boolean): Promise<void>
  search(q: string): Promise<void>
  open(m: MessageSummary): Promise<void>
  move(delta: number): void
  act(action: MessageAction, target?: MessageSummary): Promise<void>
  compose(mode?: Draft['mode'], source?: MessageDetail): void
  updateDraft(patch: Partial<Draft>): void
  closeDraft(): void
  send(): Promise<boolean>
  poll(): Promise<void>
}

const inboxOf = (folders: Folder[] | undefined): string =>
  folders?.find((f) => f.specialUse === '\\Inbox')?.path ?? 'INBOX'

let toastId = 0
let saveTimer: ReturnType<typeof setTimeout> | undefined
/** Highest UID seen per account inbox, used to detect new mail between polls. */
const newestSeen: Record<string, number> = {}
let listToken = 0

function quote(m: MessageDetail): string {
  const who = m.from.name ? `${m.from.name} <${m.from.address}>` : m.from.address
  const body = (m.text ?? '').trim().split('\n').map((l) => `> ${l}`).join('\n')
  return `\n\nOn ${new Date(m.date).toLocaleString()}, ${who} wrote:\n${body}`
}

const fmtAddr = (a: { name: string; address: string }): string => (a.name ? `"${a.name}" <${a.address}>` : a.address)

/** Wording for the current universe, for code outside React components */
const copy = (): Copy => universeOf(useStore.getState().settings.universe).copy

export const useStore = create<State>((set, get) => ({
  ready: false,
  settings: DEFAULT_SETTINGS,
  accounts: [],
  folders: {},
  folderErrors: {},
  sel: { accountId: '*', folder: 'INBOX' },
  messages: [],
  cursors: {},
  hasMore: false,
  loading: false,
  listError: null,
  query: '',
  selectedKey: null,
  detail: null,
  detailLoading: false,
  draft: null,
  sending: false,
  panel: null,
  toasts: [],

  async init() {
    const stored = await api.settings.get()
    const settings = normalizeSettings({ ...DEFAULT_SETTINGS, ...stored })
    applyTheme(settings)
    void api.app.titleBarColor(universeOf(settings.universe).light ? '#2a2620' : settings.primary)
    configureSound(settings.sound, settings.volume, settings.universe)
    set({ settings })
    await get().reloadAccounts()
    set({ ready: true })
    if (get().accounts.length === 0) set({ panel: 'addAccount' })
    else await get().loadMessages()
  },

  updateSettings(patch) {
    const settings = normalizeSettings({ ...get().settings, ...patch })
    applyTheme(settings)
    void api.app.titleBarColor(universeOf(settings.universe).light ? '#2a2620' : settings.primary)
    configureSound(settings.sound, settings.volume, settings.universe)
    set({ settings })
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => void api.settings.set(settings), 300)
  },

  switchUniverse(id) {
    const from = get().settings.universe
    get().updateSettings(universeDefaults(id))
    // Accounts using a palette colour move to the matching colour in the new universe
    const changed = get().accounts.filter((a) => remapAccountColor(a.color, from, id) !== a.color)
    if (changed.length) {
      void Promise.all(changed.map((a) => api.accounts.update(a.id, { color: remapAccountColor(a.color, from, id) }))).then(() => get().reloadAccounts())
    }
    sfx.boot()
    warp(1, 1600)
  },

  setPanel(panel) {
    if (panel) sfx.open()
    else sfx.close()
    set({ panel })
  },

  toast(kind, title, body) {
    const id = ++toastId
    set({ toasts: [...get().toasts, { id, kind, title, body }] })
    if (kind === 'error') sfx.error()
    setTimeout(() => get().dismissToast(id), kind === 'error' ? 8000 : 4500)
  },

  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  async reloadAccounts() {
    const accounts = await api.accounts.list()
    set({ accounts })
    const { sel } = get()
    if (sel.accountId !== '*' && !accounts.some((a) => a.id === sel.accountId)) {
      set({ sel: { accountId: '*', folder: 'INBOX' } })
    }
    await Promise.all(accounts.map((a) => get().loadFolders(a.id)))
  },

  async loadFolders(accountId) {
    try {
      const list = await api.mail.folders(accountId)
      const { [accountId]: _, ...rest } = get().folderErrors
      set({ folders: { ...get().folders, [accountId]: list }, folderErrors: rest })
    } catch (e) {
      set({ folderErrors: { ...get().folderErrors, [accountId]: errText(e) } })
    }
  },

  async select(sel) {
    sfx.select()
    set({ sel, messages: [], cursors: {}, selectedKey: null, detail: null, query: '', listError: null })
    await get().loadMessages()
  },

  async loadMessages(more = false, silent = false) {
    const { sel, accounts, folders, cursors } = get()
    const token = ++listToken
    if (!silent) set({ loading: true, listError: null })
    const targets =
      sel.accountId === '*'
        ? accounts.map((a) => ({ id: a.id, folder: inboxOf(folders[a.id]) }))
        : [{ id: sel.accountId, folder: sel.folder }]

    const results = await Promise.allSettled(
      targets
        .filter((t) => !more || (cursors[t.id] ?? 0) > 1)
        .map(async (t) => ({ id: t.id, res: await api.mail.list(t.id, t.folder, more ? cursors[t.id] : undefined) }))
    )
    if (token !== listToken) return

    const nextCursors = more ? { ...cursors } : {}
    const fresh: MessageSummary[] = []
    const errors: string[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') {
        nextCursors[r.value.id] = r.value.res.cursor
        fresh.push(...r.value.res.messages)
        const top = Math.max(0, ...r.value.res.messages.map((m) => m.uid))
        if (sel.accountId === '*' || sel.folder === inboxOf(folders[r.value.id]))
          newestSeen[r.value.id] = Math.max(newestSeen[r.value.id] ?? 0, top)
      } else errors.push(errText(r.reason))
    }

    const merged = more ? [...get().messages, ...fresh] : fresh
    const seen = new Set<string>()
    const messages = merged
      .filter((m) => !seen.has(msgKey(m)) && seen.add(msgKey(m)))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))

    set({
      messages,
      cursors: nextCursors,
      hasMore: Object.values(nextCursors).some((c) => c > 1),
      loading: false,
      listError: errors.length && !fresh.length ? errors[0] : null
    })
    if (errors.length && fresh.length && !silent) get().toast('error', copy().toast.partialFail, errors[0])
  },

  async search(q) {
    set({ query: q })
    if (!q.trim()) return get().loadMessages()
    const { sel, accounts, folders } = get()
    const targets =
      sel.accountId === '*'
        ? accounts.map((a) => ({ id: a.id, folder: inboxOf(folders[a.id]) }))
        : [{ id: sel.accountId, folder: sel.folder }]
    set({ loading: true, listError: null })
    warp(0.4, 700)
    const token = ++listToken
    const res = await Promise.allSettled(targets.map((t) => api.mail.search(t.id, t.folder, q)))
    if (token !== listToken) return
    const messages = res
      .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    const failed = res.find((r): r is PromiseRejectedResult => r.status === 'rejected')
    set({ messages, hasMore: false, loading: false, listError: failed && !messages.length ? errText(failed.reason) : null })
  },

  async open(m) {
    const key = msgKey(m)
    if (get().selectedKey === key && get().detail) return
    sfx.select()
    set({
      selectedKey: key,
      detail: null,
      detailLoading: true,
      messages: get().messages.map((x) => (msgKey(x) === key ? { ...x, seen: true } : x))
    })
    try {
      const detail = await api.mail.get(m.accountId, m.folder, m.uid)
      if (get().selectedKey === key) set({ detail, detailLoading: false })
      if (!m.seen) void get().loadFolders(m.accountId)
    } catch (e) {
      if (get().selectedKey === key) set({ detailLoading: false })
      get().toast('error', copy().toast.openFail, errText(e))
    }
  },

  move(delta) {
    const { messages, selectedKey } = get()
    if (!messages.length) return
    const i = messages.findIndex((m) => msgKey(m) === selectedKey)
    const next = messages[Math.min(messages.length - 1, Math.max(0, i === -1 ? 0 : i + delta))]
    void get().open(next)
  },

  async act(action, target) {
    const m = target ?? get().messages.find((x) => msgKey(x) === get().selectedKey)
    if (!m) return
    const key = msgKey(m)
    const removes = action === 'archive' || action === 'trash' || action === 'spam'
    const before = get().messages
    const idx = before.findIndex((x) => msgKey(x) === key)

    if (removes) {
      if (action === 'trash') sfx.trash()
      else sfx.confirm()
      const messages = before.filter((x) => msgKey(x) !== key)
      const wasOpen = get().selectedKey === key
      set({ messages, ...(wasOpen ? { selectedKey: null, detail: null } : {}) })
      if (wasOpen && messages.length) void get().open(messages[Math.min(idx, messages.length - 1)])
    } else {
      sfx.select()
      const patch: Partial<MessageSummary> =
        action === 'seen' ? { seen: true } : action === 'unseen' ? { seen: false } : { flagged: action === 'flag' }
      set({
        messages: before.map((x) => (msgKey(x) === key ? { ...x, ...patch } : x)),
        detail: get().detail && msgKey(get().detail!) === key ? { ...get().detail!, ...patch } : get().detail
      })
    }

    try {
      await api.mail.action(m.accountId, m.folder, [m.uid], action)
      void get().loadFolders(m.accountId)
      if (removes) {
        const t = copy().toast
        get().toast('success', action === 'archive' ? t.archived : action === 'trash' ? t.trashed : t.spam, m.subject)
      }
    } catch (e) {
      get().toast('error', copy().toast.commandFail, errText(e))
      void get().loadMessages(false, true)
    }
  },

  compose(mode = 'new', source) {
    sfx.open()
    const { accounts, sel } = get()
    const accountId =
      source?.accountId ?? (sel.accountId !== '*' ? sel.accountId : accounts[0]?.id) ?? ''
    const me = accounts.find((a) => a.id === accountId)?.email.toLowerCase()
    const draft: Draft = { accountId, to: '', cc: '', bcc: '', subject: '', text: '', attachments: [], mode }
    if (source && mode !== 'new') {
      const subj = source.subject.replace(/^((re|fwd?):\s*)+/i, '')
      if (mode === 'forward') {
        draft.subject = `Fwd: ${subj}`
        draft.text = `\n\n---------- Forwarded transmission ----------\nFrom: ${fmtAddr(source.from)}\nDate: ${new Date(source.date).toLocaleString()}\nSubject: ${source.subject}\n\n${source.text ?? ''}`
      } else {
        draft.subject = `Re: ${subj}`
        const replyTo = source.replyTo.length ? source.replyTo : [source.from]
        draft.to = replyTo.map(fmtAddr).join(', ')
        if (mode === 'replyAll') {
          draft.cc = [...source.to, ...source.cc]
            .filter((a) => a.address.toLowerCase() !== me && !replyTo.some((r) => r.address === a.address))
            .map(fmtAddr)
            .join(', ')
        }
        draft.text = quote(source)
        draft.inReplyTo = source.messageId
        draft.references = [...(source.references ?? []), ...(source.messageId ? [source.messageId] : [])]
      }
    }
    set({ draft })
  },

  updateDraft(patch) {
    const d = get().draft
    if (d) set({ draft: { ...d, ...patch } })
  },

  closeDraft() {
    sfx.close()
    set({ draft: null })
  },

  async send() {
    const d = get().draft
    if (!d) return false
    if (!d.to.trim()) {
      get().toast('error', copy().toast.noRecipient, copy().toast.noRecipientBody)
      return false
    }
    set({ sending: true })
    const msg: OutgoingMessage = {
      accountId: d.accountId,
      to: d.to,
      cc: d.cc,
      bcc: d.bcc,
      subject: d.subject,
      text: d.text,
      inReplyTo: d.inReplyTo,
      references: d.references,
      attachments: d.attachments.map((path) => ({ path }))
    }
    try {
      await api.mail.send(msg)
      sfx.send()
      warp(1, 1600)
      set({ draft: null, sending: false })
      get().toast('success', copy().toast.sent, `To ${d.to}`)
      return true
    } catch (e) {
      set({ sending: false })
      get().toast('error', copy().toast.sendFailed, errText(e))
      return false
    }
  },

  async poll() {
    const { accounts, folders, settings } = get()
    let incoming = 0
    let latest: MessageSummary | undefined
    await Promise.all(
      accounts.map(async (a) => {
        try {
          const res = await api.mail.list(a.id, inboxOf(folders[a.id]), undefined, 15)
          const prev = newestSeen[a.id]
          const fresh = prev === undefined ? [] : res.messages.filter((m) => m.uid > prev && !m.seen)
          newestSeen[a.id] = Math.max(prev ?? 0, ...res.messages.map((m) => m.uid))
          incoming += fresh.length
          if (fresh[0] && (!latest || +new Date(fresh[0].date) > +new Date(latest.date))) latest = fresh[0]
        } catch {
          /* offline accounts are reported when the user opens them */
        }
      })
    )
    await Promise.all(accounts.map((a) => get().loadFolders(a.id)))
    if (!get().query) await get().loadMessages(false, true)
    if (incoming > 0 && latest) {
      sfx.incoming()
      const who = latest.from.name || latest.from.address
      get().toast('incoming', incoming > 1 ? copy().toast.incomingMany(incoming) : copy().toast.incoming, `${who} — ${latest.subject}`)
      if (settings.notifications && !document.hasFocus()) void api.app.notify(`Incoming: ${who}`, latest.subject)
    }
  }
}))

/** Wording for the current universe */
export const useCopy = (): Copy => useStore((s) => universeOf(s.settings.universe).copy)

/** The full current universe definition */
export const useUniverse = () => useStore((s) => universeOf(s.settings.universe))
