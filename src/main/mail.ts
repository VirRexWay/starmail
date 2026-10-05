import { ImapFlow, type FetchMessageObject, type MessageStructureObject } from 'imapflow'
import nodemailer, { type Transporter } from 'nodemailer'
import { simpleParser, type AddressObject, type Attachment, type ParsedMail } from 'mailparser'
import type {
  AccountInfo,
  Address,
  Folder,
  ListResult,
  MessageAction,
  MessageDetail,
  MessageSummary,
  NewAccountInput,
  OutgoingMessage
} from '@shared/types'
import { getAccount, updateSecrets, type Secrets } from './store'
import { refresh } from './oauth'
import { assertServerSafe, tlsOptions } from './security'

type Creds = { user: string; pass: string } | { user: string; accessToken: string }

const pool = new Map<string, Promise<ImapFlow>>()

/** Returns usable credentials, refreshing the OAuth access token when it is about to expire. */
async function credentials(id: string): Promise<{ info: AccountInfo; creds: Creds }> {
  const { info, username, secrets } = await getAccount(id)
  if (info.auth === 'password') return { info, creds: { user: username, pass: secrets.password ?? '' } }

  let { accessToken, expiresAt } = secrets
  if (!accessToken || !expiresAt || expiresAt < Date.now()) {
    if (!secrets.refreshToken || !secrets.clientId) throw new Error('Session expired â€” re-add this account')
    const t = await refresh(info.auth, secrets.clientId, secrets.refreshToken, secrets.clientSecret)
    accessToken = t.accessToken
    expiresAt = t.expiresAt
    const patch: Partial<Secrets> = { accessToken, expiresAt }
    if (t.refreshToken) patch.refreshToken = t.refreshToken
    await updateSecrets(id, patch)
  }
  return { info, creds: { user: username, accessToken: accessToken! } }
}

// All IMAP and SMTP connections must be created through these two factories so
// the rules in ./security apply everywhere.

function makeClient(info: Pick<AccountInfo, 'imap'>, creds: Creds): ImapFlow {
  assertServerSafe(info.imap, 'IMAP')
  const client = new ImapFlow({
    host: info.imap.host,
    port: info.imap.port,
    secure: info.imap.secure,
    // Without this, imapflow silently logs in over plaintext when STARTTLS is not offered
    doSTARTTLS: info.imap.secure ? undefined : true,
    auth: creds,
    logger: false,
    tls: tlsOptions(info.imap)
  })
  client.on('error', (err: Error) => console.warn('[imap]', err.message))
  return client
}

/** Turn imapflow's STARTTLS refusal into something a user can act on. */
async function connect(c: ImapFlow): Promise<void> {
  try {
    await c.connect()
  } catch (e) {
    if ((e as { tlsFailed?: boolean }).tlsFailed) {
      throw new Error('Server did not offer encryption (STARTTLS), so your password was not sent. Use the SSL/TLS port (usually 993) or check your network.')
    }
    throw e
  }
}

function makeTransport(info: Pick<AccountInfo, 'smtp'>, creds: Creds): Transporter {
  assertServerSafe(info.smtp, 'SMTP')
  return nodemailer.createTransport({
    host: info.smtp.host,
    port: info.smtp.port,
    secure: info.smtp.secure,
    requireTLS: !info.smtp.secure,
    auth: 'pass' in creds ? creds : { type: 'OAuth2', user: creds.user, accessToken: creds.accessToken },
    tls: tlsOptions(info.smtp)
  })
}

async function client(id: string): Promise<ImapFlow> {
  const existing = pool.get(id)
  if (existing) {
    const c = await existing.catch(() => null)
    if (c?.usable) return c
    pool.delete(id)
  }
  const pending = (async () => {
    const { info, creds } = await credentials(id)
    const c = makeClient(info, creds)
    c.on('close', () => {
      if (pool.get(id) === pending) pool.delete(id)
    })
    await connect(c)
    return c
  })()
  pool.set(id, pending)
  pending.catch(() => pool.delete(id))
  return pending
}

export async function disconnect(id: string): Promise<void> {
  const p = pool.get(id)
  pool.delete(id)
  // Drop decoded messages for this account so removing it also clears them from memory
  for (const key of [...parsedCache.keys()]) {
    if (key.startsWith(id + '\u0000')) parsedCache.delete(key)
  }
  const c = await p?.catch(() => null)
  await c?.logout().catch(() => undefined)
}

export async function disconnectAll(): Promise<void> {
  await Promise.all([...pool.keys()].map(disconnect))
}

// ---------------------------------------------------------------- folders

const SPECIAL_ORDER = ['\\Inbox', '\\Flagged', '\\Drafts', '\\Sent', '\\Archive', '\\All', '\\Junk', '\\Trash']

export async function folders(id: string): Promise<Folder[]> {
  const c = await client(id)
  const list = await c.list({ statusQuery: { unseen: true, messages: true } })
  const out: Folder[] = list
    .filter((f) => !f.flags.has('\\Noselect') && !f.flags.has('\\NonExistent'))
    .map((f) => ({
      path: f.path,
      name: f.path.toUpperCase() === 'INBOX' ? 'Inbox' : f.name,
      delimiter: f.delimiter,
      specialUse: f.path.toUpperCase() === 'INBOX' ? '\\Inbox' : f.specialUse,
      unread: f.status?.unseen,
      total: f.status?.messages,
      depth: f.delimiter ? f.path.split(f.delimiter).length - 1 : 0
    }))
  const rank = (f: Folder): number => {
    const i = f.specialUse ? SPECIAL_ORDER.indexOf(f.specialUse) : -1
    return i === -1 ? SPECIAL_ORDER.length : i
  }
  return out.sort((a, b) => rank(a) - rank(b) || a.path.localeCompare(b.path))
}

async function specialFolder(c: ImapFlow, use: string, fallbacks: string[]): Promise<string | null> {
  const list = await c.list()
  const hit = list.find((f) => f.specialUse === use)
  if (hit) return hit.path
  const byName = list.find((f) => fallbacks.some((n) => f.path.toLowerCase() === n.toLowerCase()))
  return byName?.path ?? null
}

// ---------------------------------------------------------------- messages

const addr = (a?: { name?: string; address?: string }): Address => ({
  name: a?.name ?? '',
  address: a?.address ?? ''
})

function hasAttachment(node?: MessageStructureObject): boolean {
  if (!node) return false
  if (node.disposition === 'attachment') return true
  return (node.childNodes ?? []).some(hasAttachment)
}

function summarize(id: string, folder: string, m: FetchMessageObject): MessageSummary {
  const env = m.envelope
  return {
    accountId: id,
    folder,
    uid: m.uid,
    subject: env?.subject || '(no subject)',
    from: addr(env?.from?.[0]),
    to: (env?.to ?? []).map(addr),
    date: (env?.date ?? m.internalDate ?? new Date()).toString(),
    seen: m.flags?.has('\\Seen') ?? false,
    flagged: m.flags?.has('\\Flagged') ?? false,
    hasAttachments: hasAttachment(m.bodyStructure)
  }
}

const SUMMARY_QUERY = { uid: true, envelope: true, flags: true, bodyStructure: true, internalDate: true } as const

export async function list(id: string, folder: string, cursor?: number, limit = 50): Promise<ListResult> {
  const c = await client(id)
  const lock = await c.getMailboxLock(folder)
  try {
    const total = c.mailbox ? c.mailbox.exists : 0
    const end = cursor ? cursor - 1 : total
    if (end < 1) return { messages: [], total, cursor: 1 }
    const start = Math.max(1, end - limit + 1)
    const messages: MessageSummary[] = []
    for await (const m of c.fetch(`${start}:${end}`, SUMMARY_QUERY)) messages.push(summarize(id, folder, m))
    messages.sort((a, b) => b.uid - a.uid)
    return { messages, total, cursor: start }
  } finally {
    lock.release()
  }
}

export async function search(id: string, folder: string, query: string): Promise<MessageSummary[]> {
  const c = await client(id)
  const lock = await c.getMailboxLock(folder)
  try {
    const isGmail = c.capabilities.has('X-GM-EXT-1')
    const uids = await c.search(
      isGmail ? { gmraw: query } : { or: [{ subject: query }, { from: query }, { to: query }, { body: query }] },
      { uid: true }
    )
    if (!uids || uids.length === 0) return []
    const recent = uids.slice(-100)
    const out: MessageSummary[] = []
    for await (const m of c.fetch(recent, SUMMARY_QUERY, { uid: true })) out.push(summarize(id, folder, m))
    return out.sort((a, b) => b.uid - a.uid)
  } finally {
    lock.release()
  }
}

/** Parsed messages are kept briefly so attachments can be saved without refetching. */
const parsedCache = new Map<string, ParsedMail>()
const cacheKey = (id: string, folder: string, uid: number): string => `${id}\u0000${folder}\u0000${uid}`

function remember(key: string, parsed: ParsedMail): void {
  parsedCache.delete(key)
  parsedCache.set(key, parsed)
  while (parsedCache.size > 25) parsedCache.delete(parsedCache.keys().next().value!)
}

const addrList = (a?: AddressObject | AddressObject[]): Address[] =>
  (Array.isArray(a) ? a : a ? [a] : []).flatMap((o) => o.value.map((v) => addr(v)))

/** Swap cid: references for inline data URIs so embedded images render. */
function inlineCids(html: string, attachments: Attachment[]): string {
  let out = html
  for (const a of attachments) {
    // contentType comes from the sender and lands inside an HTML attribute: only allow plain image types
    if (!a.cid || a.size > 3_000_000 || !/^image\/[a-z0-9.+-]+$/i.test(a.contentType)) continue
    const uri = `data:${a.contentType};base64,${a.content.toString('base64')}`
    out = out.split(`cid:${a.cid}`).join(uri)
  }
  return out
}

/** Whole message is downloaded and parsed in memory, so a hostile giant email must be refused. */
const MAX_MESSAGE_BYTES = 75 * 1024 * 1024

async function fetchParsed(id: string, folder: string, uid: number): Promise<{ parsed: ParsedMail; msg: FetchMessageObject }> {
  const c = await client(id)
  const lock = await c.getMailboxLock(folder)
  try {
    const meta = await c.fetchOne(String(uid), { uid: true, size: true }, { uid: true })
    if (meta && meta.size && meta.size > MAX_MESSAGE_BYTES) {
      throw new Error(`Message is ${Math.round(meta.size / 1048576)} MB — too large to open safely`)
    }
    const msg = await c.fetchOne(String(uid), { ...SUMMARY_QUERY, source: true }, { uid: true })
    if (!msg || !msg.source) throw new Error('Message not found')
    const parsed = await simpleParser(msg.source)
    if (!msg.flags?.has('\\Seen')) {
      await c.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true })
      msg.flags?.add('\\Seen')
    }
    remember(cacheKey(id, folder, uid), parsed)
    return { parsed, msg }
  } finally {
    lock.release()
  }
}

export async function get(id: string, folder: string, uid: number): Promise<MessageDetail> {
  const { parsed, msg } = await fetchParsed(id, folder, uid)
  const refs = parsed.references
  return {
    ...summarize(id, folder, msg),
    cc: addrList(parsed.cc),
    replyTo: addrList(parsed.replyTo),
    messageId: parsed.messageId,
    references: Array.isArray(refs) ? refs : refs ? [refs] : [],
    html: parsed.html ? inlineCids(parsed.html, parsed.attachments) : undefined,
    text: parsed.text,
    attachments: parsed.attachments
      .map((a, index) => ({ a, index }))
      .filter(({ a }) => a.contentDisposition !== 'inline' || !a.cid)
      .map(({ a, index }) => ({
        index,
        filename: a.filename ?? `attachment-${index + 1}`,
        contentType: a.contentType,
        size: a.size
      }))
  }
}

export async function attachment(id: string, folder: string, uid: number, index: number): Promise<Attachment> {
  const key = cacheKey(id, folder, uid)
  const parsed = parsedCache.get(key) ?? (await fetchParsed(id, folder, uid)).parsed
  const a = parsed.attachments[index]
  if (!a) throw new Error('Attachment not found')
  return a
}

export async function action(id: string, folder: string, uids: number[], act: MessageAction): Promise<void> {
  const c = await client(id)
  const range = uids.join(',')
  const lock = await c.getMailboxLock(folder)
  try {
    switch (act) {
      case 'seen':
        await c.messageFlagsAdd(range, ['\\Seen'], { uid: true })
        return
      case 'unseen':
        await c.messageFlagsRemove(range, ['\\Seen'], { uid: true })
        return
      case 'flag':
        await c.messageFlagsAdd(range, ['\\Flagged'], { uid: true })
        return
      case 'unflag':
        await c.messageFlagsRemove(range, ['\\Flagged'], { uid: true })
        return
    }
    const target =
      act === 'trash'
        ? await specialFolder(c, '\\Trash', ['Trash', 'Deleted Items', 'Deleted Messages', '[Gmail]/Trash'])
        : act === 'spam'
          ? await specialFolder(c, '\\Junk', ['Spam', 'Junk', 'Junk Email', '[Gmail]/Spam'])
          : ((await specialFolder(c, '\\Archive', ['Archive'])) ?? (await specialFolder(c, '\\All', [])))
    if (!target) throw new Error(`No ${act} folder found on this server`)
    if (target === folder) {
      if (act === 'trash') await c.messageDelete(range, { uid: true })
      return
    }
    await c.messageMove(range, target, { uid: true })
  } finally {
    lock.release()
  }
}

// ---------------------------------------------------------------- sending

export async function send(msg: OutgoingMessage): Promise<void> {
  const { info, creds } = await credentials(msg.accountId)
  const transport = makeTransport(info, creds)
  await transport.sendMail({
    from: { name: info.displayName, address: info.email },
    to: msg.to,
    cc: msg.cc || undefined,
    bcc: msg.bcc || undefined,
    subject: msg.subject,
    text: msg.text,
    inReplyTo: msg.inReplyTo,
    references: msg.references,
    attachments: msg.attachments
  })
  transport.close()
}

// ---------------------------------------------------------------- connection test

export async function test(input: NewAccountInput): Promise<{ ok: boolean; error?: string }> {
  const creds = { user: input.username || input.email, pass: input.password ?? '' }
  try {
    const c = makeClient(input, creds)
    await connect(c)
    await c.logout()
  } catch (e) {
    const err = e as Error & { responseText?: string; authenticationFailed?: boolean }
    const msg = err.responseText ?? err.message
    return { ok: false, error: msg.startsWith('IMAP:') ? msg : `IMAP: ${msg}` }
  }
  try {
    const t = makeTransport(input, creds)
    await t.verify()
    t.close()
  } catch (e) {
    const msg = (e as Error).message
    return { ok: false, error: msg.startsWith('SMTP:') ? msg : `SMTP: ${msg}` }
  }
  return { ok: true }
}
